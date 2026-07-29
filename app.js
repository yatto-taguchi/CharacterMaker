// ==========================================================================
// Application State & Constants
// ==========================================================================
const STATE_KEY = 'char_model_sheet_data';

// デフォルトの状態
let state = {
  aspectRatio: '9-16', // '3-4' | '9-16' | '1-1'
  baseStyle: 'Soft watercolor style. 4k high quality.',
  activeCharId: 1,
  characters: [
    {
      id: 1,
      charName: 'Pink Hair Character',
      charTags: 'Pink Hair, Character Sheet',
      attrHair: 'Light Pink, Wavy Long',
      attrEyes: 'Gentle Smile',
      charMemo: 'Height: ~160cm. Bright personality.',
      activeTags: [],
      refImage: null
    }
  ],
  slots: [
    { src: 'references/test1_smartphone_salon_1_reels.png', x: 0, y: 0, scale: 1.0, baseScale: 1.0 },
    { src: 'references/test1_smartphone_salon_2_reels.png', x: 0, y: 0, scale: 1.0, baseScale: 1.0 },
    { src: 'references/test1_smartphone_salon_3_reels.png', x: 0, y: 0, scale: 1.0, baseScale: 1.0 }
  ]
};

let activeSlotIndex = 0;

// ドラッグ操作一時変数
let isDragging = false;
let startX = 0;
let startY = 0;
let originX = 0;
let originY = 0;

// ==========================================================================
// DOM Elements
// ==========================================================================
const slotCards = document.querySelectorAll('.slot-card');
const zoomSlider = document.getElementById('zoom-slider');
const zoomValueDisplay = document.getElementById('zoom-value');
const activeSlotNameDisplay = document.getElementById('active-slot-name');
const btnReset = document.getElementById('btn-reset');
const fileInput = document.getElementById('file-input');
const saveStatus = document.getElementById('save-status');
const btnExport = document.getElementById('btn-export');
const btnReloadImages = document.getElementById('btn-reload-images');
const btnOpenFolder = document.getElementById('btn-open-folder');

// フォーム要素
const profileForm = document.getElementById('profile-form');
const charNameInput = document.getElementById('char-name');
const charTagsInput = document.getElementById('char-tags');
const tagsPreview = document.getElementById('tags-preview');
const attrHairInput = document.getElementById('attr-hair');
const attrEyesInput = document.getElementById('attr-eyes');
const charMemoInput = document.getElementById('char-memo');
const worldStyleInput = document.getElementById('world-style');
const rosterTabs = document.getElementById('roster-tabs');
const btnAddCharacter = document.getElementById('btn-add-character');
const promptCharCheckboxes = document.getElementById('prompt-char-checkboxes');
const refImageInput = document.getElementById('ref-image-input');
const refImagePreview = document.getElementById('ref-image-preview');
const refImagePlaceholder = document.getElementById('ref-image-placeholder');
const btnRemoveRef = document.getElementById('btn-remove-ref');
const refImageUploadArea = document.getElementById('ref-image-upload-area');

// ==========================================================================
// Event Listeners Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // データの読み込みと初期描画
  loadSavedData();
  renderCharacterTabs();
  renderMultiCharCheckboxes();
  updateProfileFormFromActiveChar();

  // ギャラリーの初期化とレンダリング
  renderGallery();
  setupLightbox();
  setupCharacterManagement();

  // 各種リスナー設定
  if (btnReloadImages) {
    btnReloadImages.addEventListener('click', forceReloadImages);
  }
  setupSlotSelectionDynamic();
  setupDragAndDrop();
  setupZoom();
  setupAspectSelectors();
  setupFormListeners();
  setupFileInput();
  setupExport();
  setupDressUpStudio();
});

// ==========================================================================
// Image Reload Logic
// ==========================================================================
function forceReloadImages() {
  const timestamp = new Date().getTime();
  state.slots.forEach((slot, index) => {
    const slotCard = document.querySelector(`.slot-card[data-slot="${index}"]`);
    const img = slotCard.querySelector('.slot-img');
    
    if (!slot.src.startsWith('data:')) {
      const basePath = slot.src.split('?')[0];
      
      // 一旦透明にしてロード中のUIフィードバックを与える
      img.style.opacity = '0.3';
      img.style.transition = 'opacity 0.2s ease';
      
      img.onload = () => {
        img.style.opacity = '1';
        calculateBaseScale(index, img);
        updateSlotImageTransform(index);
      };
      
      // クエリパラメータでキャッシュを無効化
      img.src = `${basePath}?t=${timestamp}`;
    }
  });
}

// ==========================================================================
// Gallery Rendering & Initialization
// ==========================================================================
function renderGallery() {
  const container = document.getElementById('gallery-grid-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  state.slots.forEach((slot, index) => {
    const isActive = index === activeSlotIndex ? 'active' : '';
    
    // Create HTML for each slot dynamically
    const card = document.createElement('div');
    card.className = `slot-card ${isActive}`;
    card.setAttribute('data-slot', index);
    
    card.innerHTML = `
      <div class="slot-label">Image ${index + 1}</div>
      <div class="viewport aspect-${state.aspectRatio}">
        <div class="grid-overlay"></div>
        <img src="${slot.src}" alt="Generated Image ${index + 1}" class="draggable-img slot-img" draggable="false">
        <div class="interaction-hint"><i data-lucide="zoom-in"></i> クリックで拡大</div>
      </div>
    `;
    
    container.appendChild(card);
    
    // Hook up image load events for alignment
    const img = card.querySelector('.slot-img');
    img.onload = () => {
      calculateBaseScale(index, img);
      updateSlotImageTransform(index);
    };
    
    // Event listener for opening lightbox
    card.addEventListener('click', (e) => {
      // Allow drag events to still happen without popping modal if the user was dragging
      if (!isDragging) {
        openLightbox(slot.src);
      }
    });
  });
  
  // Re-run setup functions to bind new elements
  // We need to re-fetch the slotCards
  setupSlotSelectionDynamic();
  
  if (window.lucide) window.lucide.createIcons();
}

function setupSlotSelectionDynamic() {
  const dynamicSlotCards = document.querySelectorAll('.slot-card');
  dynamicSlotCards.forEach(card => {
    card.addEventListener('click', (e) => {
      if (isDragging) return;
      const slotIndex = parseInt(card.dataset.slot);
      setActiveSlot(slotIndex);
    });
  });
}

// Lightbox Logic
function setupLightbox() {
  const modal = document.getElementById('lightbox-modal');
  const closeBtn = document.getElementById('lightbox-close');
  const overlay = document.getElementById('lightbox-overlay');
  const dlBtn = document.getElementById('btn-lightbox-download');
  
  if (!modal) return;

  const closeModal = () => {
    modal.style.display = 'none';
  };

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);
  
  dlBtn.addEventListener('click', () => {
    const img = document.getElementById('lightbox-img');
    const link = document.createElement('a');
    link.href = img.src;
    link.download = `generated_image_${new Date().getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
  
  const dlTransparentBtn = document.getElementById('btn-lightbox-download-transparent');
  if (dlTransparentBtn) {
    dlTransparentBtn.addEventListener('click', () => {
      const img = document.getElementById('lightbox-img');
      const sourceImage = new Image();
      sourceImage.crossOrigin = "Anonymous";
      sourceImage.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = sourceImage.width;
        canvas.height = sourceImage.height;
        const ctx = canvas.getContext('2d');
        
        // 元画像を描画
        ctx.drawImage(sourceImage, 0, 0);
        
        const maxDim = Math.min(canvas.width, canvas.height);
        
        // フェード開始ライン（外側）
        const outT = maxDim * 0.02; // 上端ギリギリ
        const outB = maxDim * 0.02;
        const outL = maxDim * 0.02;
        const outR = maxDim * 0.02;
        
        // フェード終了ライン（内側セーフゾーン）
        const inT = maxDim * 0.08; // トップは顔を守るため浅く
        const inB = maxDim * 0.22; // ボトム
        const inL = maxDim * 0.16; // サイド
        const inR = maxDim * 0.16;
        
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = canvas.width;
        maskCanvas.height = canvas.height;
        const maskCtx = maskCanvas.getContext('2d');
        
        // 全体のぼかし（ご要望に合わせて少し強くしました: 2% -> 4%）
        maskCtx.filter = `blur(${maxDim * 0.04}px)`;
        
        const generatePolygon = (mT, mB, mL, mR, noiseMag) => {
            const pts = [];
            const edgeSteps = 15; // 直線の頂点数
            const addLine = (x1, y1, x2, y2) => {
                for (let i = 0; i < edgeSteps; i++) {
                    const frac = i / edgeSteps;
                    let x = x1 + (x2 - x1) * frac;
                    let y = y1 + (y2 - y1) * frac;
                    x += (Math.random() - 0.5) * noiseMag;
                    y += (Math.random() - 0.5) * noiseMag;
                    pts.push({x, y});
                }
            };
            const left = mL;
            const right = canvas.width - mR;
            const top = mT;
            const bottom = canvas.height - mB;
            
            // 角を丸めない（四角いまま）元の仕様に戻す
            addLine(left, top, right, top);
            addLine(right, top, right, bottom);
            addLine(right, bottom, left, bottom);
            addLine(left, bottom, left, top);
            
            return pts;
        };

        // 1つ前のバージョン(t*t)に戻し、角を丸めた仕様
        const steps = 40;
        maskCtx.fillStyle = 'rgba(0, 0, 0, 0.06)';
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const easeT = t * t; // 外側に大きく広がるカーブ（1個前の仕様）
            
            const curT = outT + (inT - outT) * easeT;
            const curB = outB + (inB - outB) * easeT;
            const curL = outL + (inL - outL) * easeT;
            const curR = outR + (inR - outR) * easeT;
            
            const noise = maxDim * 0.03;
            const pts = generatePolygon(curT, curB, curL, curR, noise);
            
            maskCtx.beginPath();
            maskCtx.moveTo(pts[0].x, pts[0].y);
            for(let j=1; j<pts.length; j++) maskCtx.lineTo(pts[j].x, pts[j].y);
            maskCtx.closePath();
            maskCtx.fill();
        }
        
        // 最後に中央の「絶対保護ゾーン」を100%不透明で塗りつぶす
        maskCtx.fillStyle = 'rgba(0, 0, 0, 1)';
        const solidPts = generatePolygon(inT, inB, inL, inR, maxDim * 0.01);
        maskCtx.beginPath();
        maskCtx.moveTo(solidPts[0].x, solidPts[0].y);
        for(let j=1; j<solidPts.length; j++) maskCtx.lineTo(solidPts[j].x, solidPts[j].y);
        maskCtx.closePath();
        maskCtx.fill();
        
        // 元キャンバスにマスクを適用 (destination-in)
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(maskCanvas, 0, 0);
        
        // PNGとしてダウンロード
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `generated_image_transparent_${new Date().getTime()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      sourceImage.src = img.src;
    });
  }
}

function openLightbox(src) {
  const modal = document.getElementById('lightbox-modal');
  const img = document.getElementById('lightbox-img');
  if (modal && img) {
    img.src = src;
    modal.style.display = 'flex';
  }
}

function calculateBaseScale(index, img) {
  const slotCard = document.querySelector(`.slot-card[data-slot="${index}"]`);
  const viewport = slotCard.querySelector('.viewport');
  
  let vpWidth = viewport.clientWidth;
  let vpHeight = viewport.clientHeight;
  
  // DOMレイアウト確定前でサイズが0の場合のフォールバック
  if (vpWidth === 0 || vpHeight === 0) {
    const ratio = state.aspectRatio;
    if (ratio === '9-16') {
      vpWidth = 270;
      vpHeight = 480;
    } else if (ratio === '1-1') {
      vpWidth = 340;
      vpHeight = 340;
    } else {
      vpWidth = 300;
      vpHeight = 400;
    }
  }
  
  const imgWidth = img.naturalWidth;
  const imgHeight = img.naturalHeight;

  if (imgWidth === 0 || imgHeight === 0) {
    state.slots[index].baseScale = 1.0;
    return;
  }

  // Cover フィット（隙間なく埋める）する倍率を計算
  const scaleCover = Math.max(vpWidth / imgWidth, vpHeight / imgHeight);
  state.slots[index].baseScale = scaleCover;
  console.log(`Slot ${index + 1} Base Scale: ${scaleCover}`);
}

// ==========================================================================
// UI Rendering & Transformation
// ==========================================================================
function updateSlotImageTransform(index) {
  const slotCard = document.querySelector(`.slot-card[data-slot="${index}"]`);
  const img = slotCard.querySelector('.slot-img');
  const slot = state.slots[index];
  
  // 実際の描画倍率は ベース倍率 × ユーザーによるズーム倍率
  const finalScale = slot.baseScale * slot.scale;
  
  // 中央揃え (top:50%, left:50% 起点) に対する平行移動と拡大縮小
  img.style.transform = `translate(calc(-50% + ${slot.x}px), calc(-50% + ${slot.y}px)) scale(${finalScale})`;
}

function setupSlotSelection() {
  slotCards.forEach(card => {
    card.addEventListener('click', () => {
      const slotIndex = parseInt(card.dataset.slot);
      setActiveSlot(slotIndex);
    });
  });
}

function setActiveSlot(index) {
  activeSlotIndex = index;
  
  // UIのアクティブ表示切り替え
  slotCards.forEach(card => {
    if (parseInt(card.dataset.slot) === index) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });

  // コントロール表示の更新
  activeSlotNameDisplay.textContent = `Slot ${index + 1}`;
  zoomSlider.value = state.slots[index].scale;
  zoomValueDisplay.textContent = `${Math.round(state.slots[index].scale * 100)}%`;
}

// ==========================================================================
// Image Drag & Zoom Control
// ==========================================================================
function setupDragAndDrop() {
  slotCards.forEach(card => {
    const img = card.querySelector('.slot-img');
    const slotIndex = parseInt(card.dataset.slot);

    img.addEventListener('mousedown', (e) => {
      e.preventDefault();
      if (slotIndex !== activeSlotIndex) {
        // アクティブでないスロットをクリックした場合は選択のみ
        setActiveSlot(slotIndex);
        return;
      }

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      originX = state.slots[slotIndex].x;
      originY = state.slots[slotIndex].y;
      img.style.cursor = 'grabbing';
    });
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    state.slots[activeSlotIndex].x = originX + dx;
    state.slots[activeSlotIndex].y = originY + dy;
    
    updateSlotImageTransform(activeSlotIndex);
    markAsUnsaved();
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      const activeImg = document.querySelector(`.slot-card[data-slot="${activeSlotIndex}"] .slot-img`);
      if (activeImg) activeImg.style.cursor = 'grab';
    }
  });
}

function setupZoom() {
  zoomSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    state.slots[activeSlotIndex].scale = val;
    zoomValueDisplay.textContent = `${Math.round(val * 100)}%`;
    updateSlotImageTransform(activeSlotIndex);
    markAsUnsaved();
  });

  // マウスホイールによるズーム
  slotCards.forEach(card => {
    const slotIndex = parseInt(card.dataset.slot);
    const viewport = card.querySelector('.viewport');

    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      // ホイール操作時は、そのスロットをアクティブにする
      if (slotIndex !== activeSlotIndex) {
        setActiveSlot(slotIndex);
      }

      const zoomStep = 0.05;
      let newScale = state.slots[slotIndex].scale + (e.deltaY < 0 ? zoomStep : -zoomStep);
      newScale = Math.max(0.2, Math.min(4, newScale));
      
      state.slots[slotIndex].scale = parseFloat(newScale.toFixed(2));
      zoomSlider.value = state.slots[slotIndex].scale;
      zoomValueDisplay.textContent = `${Math.round(state.slots[slotIndex].scale * 100)}%`;
      
      updateSlotImageTransform(slotIndex);
      markAsUnsaved();
    }, { passive: false });
  });

  // 位置リセット
  btnReset.addEventListener('click', () => {
    state.slots[activeSlotIndex].x = 0;
    state.slots[activeSlotIndex].y = 0;
    state.slots[activeSlotIndex].scale = 1.0;
    
    zoomSlider.value = 1.0;
    zoomValueDisplay.textContent = '100%';
    
    updateSlotImageTransform(activeSlotIndex);
    markAsUnsaved();
  });
}

// ==========================================================================
// Aspect Ratio Selector
// ==========================================================================
function setupAspectSelectors() {
  const aspectButtons = document.querySelectorAll('.btn-aspect');
  
  aspectButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      aspectButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const ratio = btn.dataset.ratio;
      state.aspectRatio = ratio;
      
      // グリッド内のすべてのビューポートクラスを更新
      const viewports = document.querySelectorAll('.poses-grid-container .viewport');
      viewports.forEach(vp => {
        vp.className = `viewport aspect-${ratio}`;
      });

      // アスペクト比変更に伴い、ベーススケールを再計算する
      setTimeout(() => {
        state.slots.forEach((slot, index) => {
          const img = document.querySelector(`.slot-card[data-slot="${index}"] .slot-img`);
          calculateBaseScale(index, img);
          updateSlotImageTransform(index);
        });
      }, 310); // CSS transition (0.3s) の完了を待つ

      markAsUnsaved();
    });
  });
}

// ==========================================================================
// Image Resizer Utility
// ==========================================================================
function resizeImageFile(file, maxWidth, maxHeight, callback) {
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        } else {
          width = Math.round(width * (maxHeight / height));
          height = maxHeight;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      // Background for transparent images converted to JPEG
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      callback(dataUrl);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

// ==========================================================================
// File Input & Image Loader
// ==========================================================================
function setupFileInput() {
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    resizeImageFile(file, 1600, 1600, (src) => {
      state.slots[activeSlotIndex].src = src;
      
      const img = document.querySelector(`.slot-card[data-slot="${activeSlotIndex}"] .slot-img`);
      
      // onload を先に登録する
      img.onload = () => {
        state.slots[activeSlotIndex].x = 0;
        state.slots[activeSlotIndex].y = 0;
        state.slots[activeSlotIndex].scale = 1.0;
        zoomSlider.value = 1.0;
        zoomValueDisplay.textContent = '100%';
        calculateBaseScale(activeSlotIndex, img);
        updateSlotImageTransform(activeSlotIndex);
      };
      
      img.src = src;
      markAsUnsaved();
    });
  });
}

// ==========================================================================
// Form & Data Persistence
// ==========================================================================
function setupFormListeners() {
  charTagsInput.addEventListener('input', () => {
    updateTagsPreview(charTagsInput.value);
    markAsUnsaved();
  });

  const inputs = [charNameInput, attrHairInput, attrEyesInput, charMemoInput, worldStyleInput];
  inputs.forEach(input => {
    input.addEventListener('input', markAsUnsaved);
  });

  profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveData();
  });
}

function updateTagsPreview(tagsString) {
  tagsPreview.innerHTML = '';
  if (!tagsString || !tagsString.trim()) return;

  const tags = tagsString.split(/[,、]/)
    .map(t => t.trim())
    .filter(t => t.length > 0);

  tags.forEach(tag => {
    const badge = document.createElement('span');
    badge.className = 'tag-badge';
    badge.innerHTML = `<i data-lucide="hash" style="width:12px;height:12px;"></i> ${tag}`;
    tagsPreview.appendChild(badge);
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function markAsUnsaved() {
  saveStatus.innerHTML = '<i data-lucide="alert-circle"></i> 未保存の変更あり';
  saveStatus.className = 'status-badge saving';
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function markAsSaved() {
  saveStatus.innerHTML = '<i data-lucide="cloud-check"></i> 保存済み';
  saveStatus.className = 'status-badge';
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function saveData() {
  state.baseStyle = worldStyleInput.value;
  
  const activeChar = state.characters.find(c => c.id === state.activeCharId);
  if (activeChar) {
    activeChar.charName = charNameInput.value;
    activeChar.charTags = charTagsInput.value;
    activeChar.attrHair = attrHairInput.value;
    activeChar.attrEyes = attrEyesInput.value;
    activeChar.charMemo = charMemoInput.value;
  }

  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
    markAsSaved();
    showToast('設定データを保存しました');
    
    // バックエンドへフルデータを送信 (AI読み取り用)
    fetch('/api/save-full-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    }).catch(err => console.error('Full state backup failed:', err));
    
  } catch (e) {
    console.error('Save failed (likely QuotaExceededError):', e);
    showToast('保存エラー: ブラウザの保存容量がいっぱいです。画像の枚数やサイズを減らしてください。');
  }

  // 名簿タブとチェックボックスを再描画して名前を反映
  renderCharacterTabs();
  renderMultiCharCheckboxes();

  const card = document.querySelector('.info-section');
  card.style.borderColor = 'var(--accent-green)';
  setTimeout(() => {
    card.style.borderColor = 'var(--border-color)';
  }, 500);
}

function loadSavedData() {
  const saved = localStorage.getItem(STATE_KEY);
  if (!saved) {
    // 初回起動時
    return;
  }

  try {
    const data = JSON.parse(saved);
    
    // データ移行ロジック（古い形式から新しいcharacters配列形式へ）
    if (!data.characters && data.charName) {
      console.log('Migrating old state to new character array format');
      state.characters = [
        {
          id: 1,
          charName: data.charName,
          charTags: data.charTags,
          attrHair: data.attrHair,
          attrEyes: data.attrEyes,
          charMemo: data.charMemo,
        }
      ];
      state.baseStyle = 'Soft watercolor style, 4k high quality.';
      state.activeCharId = 1;
      
      if (data.slots && data.slots.length > 0) {
        state.slots = data.slots;
      }
    } else {
      // 正常な新しいフォーマットのロード
      state = { ...state, ...data };
    }

    // データマイグレーション（activeTags, refImageの追加）
    state.characters.forEach(char => {
      if (!char.activeTags) char.activeTags = [];
      if (char.refImage === undefined) char.refImage = null;
    });

    // 不正な数値のバリデーション
    state.slots.forEach(slot => {
      if (typeof slot.x !== 'number' || isNaN(slot.x)) slot.x = 0;
      if (typeof slot.y !== 'number' || isNaN(slot.y)) slot.y = 0;
      if (typeof slot.scale !== 'number' || isNaN(slot.scale) || slot.scale <= 0) slot.scale = 1.0;
      if (typeof slot.baseScale !== 'number' || isNaN(slot.baseScale) || slot.baseScale <= 0) slot.baseScale = 1.0;
    });

    // アスペクト比ボタンのアクティブ切り替え
    const aspectButtons = document.querySelectorAll('.btn-aspect');
    aspectButtons.forEach(btn => {
      if (btn.dataset.ratio === state.aspectRatio) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    markAsSaved();
  } catch (e) {
    console.error('Failed to load state:', e);
    markAsUnsaved();
  }
}

// キャラクターフォームにデータを反映する関数
function updateProfileFormFromActiveChar() {
  worldStyleInput.value = state.baseStyle || '';
  
  const activeChar = state.characters.find(c => c.id === state.activeCharId) || state.characters[0];
  if (!activeChar) return;
  
  charNameInput.value = activeChar.charName || '';
  charTagsInput.value = activeChar.charTags || '';
  attrHairInput.value = activeChar.attrHair || '';
  attrEyesInput.value = activeChar.attrEyes || '';
  charMemoInput.value = activeChar.charMemo || '';

  if (activeChar.refImage) {
    refImagePreview.src = activeChar.refImage;
    refImagePreview.style.display = 'block';
    refImagePlaceholder.style.display = 'none';
    btnRemoveRef.style.display = 'flex';
  } else {
    refImagePreview.src = '';
    refImagePreview.style.display = 'none';
    refImagePlaceholder.style.display = 'flex';
    btnRemoveRef.style.display = 'none';
  }

  updateTagsPreview(activeChar.charTags || '');
  updateDressUpStudioUI();
}

// キャラクター名簿の描画
function renderCharacterTabs() {
  rosterTabs.innerHTML = '';
  state.characters.forEach((char) => {
    const tab = document.createElement('div');
    tab.className = `roster-tab ${char.id === state.activeCharId ? 'active' : ''}`;
    tab.dataset.id = char.id;
    tab.innerHTML = `<i data-lucide="user"></i> ${char.charName || 'New Char'}`;
    rosterTabs.appendChild(tab);
  });
  if (window.lucide) window.lucide.createIcons();
}

// 登場キャラ選択のチェックボックスの描画
function renderMultiCharCheckboxes() {
  promptCharCheckboxes.innerHTML = '';
  state.characters.forEach((char) => {
    const label = document.createElement('label');
    label.className = 'char-checkbox-label';
    
    // デフォルトでアクティブなキャラだけチェック状態にする
    const isChecked = char.id === state.activeCharId ? 'checked' : '';
    
    label.innerHTML = `
      <input type="checkbox" value="${char.id}" class="prompt-char-select" ${isChecked}>
      ${char.charName || 'New Char'}
    `;
    promptCharCheckboxes.appendChild(label);
  });
  
  // チェック状態が変わったらプロンプトを再構築
  const checkboxes = promptCharCheckboxes.querySelectorAll('.prompt-char-select');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      // 簡易的に triggerEvaluate を呼ぶために、
      // 実際には evaluateDressUpCombination に必要なDOM要素を直接渡して実行する
      const aiMsgBox = document.getElementById('ai-prompt-msg');
      const aiPromptText = document.getElementById('ai-prompt-text');
      const promptCount = document.getElementById('prompt-count');
      const promptScene = document.getElementById('prompt-scene');
      const promptAction = document.getElementById('prompt-action');
      const promptBg = document.getElementById('prompt-bg');
      const designRadios = document.getElementsByName('design-spec');
      
      if (typeof evaluateDressUpCombination === 'function') {
        evaluateDressUpCombination(aiMsgBox, aiPromptText, promptScene, promptAction, promptBg, designRadios, promptCount);
      }
    });
  });
}

function setupCharacterManagement() {
  // タブのクリックでキャラクター切り替え
  rosterTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.roster-tab');
    if (!tab) return;
    
    const charId = parseInt(tab.dataset.id);
    if (charId === state.activeCharId) return;
    
    // 現在の入力を保存してから切り替え
    saveData();
    state.activeCharId = charId;
    updateProfileFormFromActiveChar();
    renderCharacterTabs();
    
    // 新しいキャラを開いた際、デフォルトでチェックボックスもそれに合わせる（任意）
    renderMultiCharCheckboxes();
  });

  // 追加ボタン
  btnAddCharacter.addEventListener('click', () => {
    saveData(); // 現在の状態を保存
    
    const newId = state.characters.length > 0 ? Math.max(...state.characters.map(c => c.id)) + 1 : 1;
    const newChar = {
      id: newId,
      charName: `Character ${newId}`,
      charTags: 'New Character',
      attrHair: '',
      attrEyes: '',
      charMemo: '',
      activeTags: [],
      refImage: null
    };
    state.characters.push(newChar);
    state.activeCharId = newId;

    // バックエンドにフォルダ作成をリクエスト
    fetch('/api/create-char-folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderName: `char_${newId}` })
    }).catch(err => console.error('Folder creation failed:', err));
    
    
    updateProfileFormFromActiveChar();
    renderCharacterTabs();
    renderMultiCharCheckboxes();
    saveData();
  });

  // リファレンス画像のアップロード機能
  refImageUploadArea.addEventListener('click', (e) => {
    if (e.target.closest('.btn-remove-ref')) return;
    refImageInput.click();
  });

  refImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const activeChar = state.characters.find(c => c.id === state.activeCharId);
    if (!activeChar) return;
    
    resizeImageFile(file, 800, 800, (resizedDataUrl) => {
      const safeName = (activeChar.charName || `char_${activeChar.id}`).replace(/[\\/:*?"<>|]/g, '');
      const folderName = safeName;
      const fileName = `ref_${new Date().getTime()}.png`;

      fetch('/api/upload-ref', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName, fileName, base64Data: resizedDataUrl })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          activeChar.refImage = data.filePath; // e.g., references/いと/ref_123.png
          updateProfileFormFromActiveChar();
          saveData();
        } else {
          showToast('画像保存エラー: ' + data.error);
        }
      })
      .catch(err => {
        console.error('Upload failed:', err);
        showToast('画像保存通信エラーが発生しました');
      });
    });
  });

  btnRemoveRef.addEventListener('click', (e) => {
    e.stopPropagation();
    const activeChar = state.characters.find(c => c.id === state.activeCharId);
    if (activeChar) {
      activeChar.refImage = null;
      refImageInput.value = '';
      updateProfileFormFromActiveChar();
      saveData();
    }
  });
}

// ==========================================================================
// HTML Canvas Model Sheet Export (Image Merging)
// ==========================================================================
function setupExport() {
  btnExport.addEventListener('click', () => {
    exportModelSheet();
  });
}

function exportModelSheet() {
  const canvas = document.getElementById('export-canvas');
  const ctx = canvas.getContext('2d');
  
  // 1. スロットのアスペクト比設定
  let slotWidth = 800;
  let slotHeight = 1066; // 3:4 default
  
  if (state.aspectRatio === '9-16') {
    slotWidth = 600;
    slotHeight = 1067;
  } else if (state.aspectRatio === '1-1') {
    slotWidth = 800;
    slotHeight = 800;
  }
  
  // グリッド配置 (2x2)
  const padding = 50;
  const gridGap = 40;
  
  // テキストを描画するヘッダー/フッター部分の高さ
  const headerHeight = 250;
  const footerHeight = 180;
  
  // キャンバスの総サイズ計算
  const canvasWidth = (slotWidth * 2) + (padding * 2) + gridGap;
  const canvasHeight = headerHeight + (slotHeight * 2) + gridGap + footerHeight;
  
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  
  // 背景を白でクリア (AI読み込み用のクリーンな背景)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  // --- 2. ヘッダーテキストの描画 ---
  const activeChar = state.characters.find(c => c.id === state.activeCharId) || state.characters[0];

  // タイトル (キャラクター名)
  ctx.fillStyle = '#0f111a';
  ctx.font = `bold 64px 'Outfit', 'Noto Sans JP', sans-serif`;
  ctx.fillText(activeChar.charName || 'Character Model Sheet', padding, 100);
  
  // サブタイトル / 属性情報
  ctx.fillStyle = '#656a8a';
  ctx.font = `28px 'Outfit', 'Noto Sans JP', sans-serif`;
  const infoText = `Hair: ${activeChar.attrHair || 'N/A'}  |  Eyes: ${activeChar.attrEyes || 'N/A'}`;
  ctx.fillText(infoText, padding, 150);
  
  // メモテキストの描画
  ctx.fillStyle = '#4a4f6d';
  ctx.font = `italic 24px 'Outfit', 'Noto Sans JP', sans-serif`;
  const memoText = activeChar.charMemo || '';
  ctx.fillText(memoText, padding, 195);
  
  // 装飾用のライン
  ctx.strokeStyle = '#e2e5f0';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(padding, 225);
  ctx.lineTo(canvasWidth - padding, 225);
  ctx.stroke();
  
  // --- 3. グリッド内への画像描画 ---
  const images = [];
  let loadedCount = 0;
  
  // 4つのスロット画像をImageオブジェクトとしてロード
  state.slots.forEach((slot, index) => {
    const imgObj = new Image();
    // CORSエラー防止
    if (slot.src.startsWith('data:')) {
      imgObj.src = slot.src;
    } else {
      imgObj.src = slot.src + '?t=' + new Date().getTime(); // キャッシュ回避
    }
    imgObj.crossOrigin = 'anonymous';
    images.push(imgObj);
    
    imgObj.onload = () => {
      loadedCount++;
      if (loadedCount === state.slots.length) {
        drawAllImages();
      }
    };
    
    imgObj.onerror = () => {
      loadedCount++;
      console.error(`Failed to load image for slot ${index}`);
      if (loadedCount === state.slots.length) {
        drawAllImages();
      }
    };
  });
  
  function drawAllImages() {
    state.slots.forEach((slot, index) => {
      const img = images[index];
      if (!img || img.naturalWidth === 0) return;
      
      // グリッド上の描画位置を決定
      const col = index % 2;
      const row = Math.floor(index / 2);
      
      const destX = padding + col * (slotWidth + gridGap);
      const destY = headerHeight + row * (slotHeight + gridGap);
      
      // 画像切り出しロジックの計算
      const slotCard = document.querySelector(`.slot-card[data-slot="${index}"]`);
      const viewport = slotCard.querySelector('.viewport');
      
      const vpWidth = viewport.clientWidth;
      const vpHeight = viewport.clientHeight;
      const imgNaturalWidth = img.naturalWidth;
      const imgNaturalHeight = img.naturalHeight;
      
      // プレビュー表示で使用した最終的な拡大倍率 (baseScale * userScale)
      const finalScale = slot.baseScale * slot.scale;
      
      // ビューポートサイズに対するスロット実寸（高解像度）のスケール比
      const scaleCanvasToViewport = slotWidth / vpWidth;
      
      // 実寸画像からの切り出し幅と高さ
      const sourceWidth = slotWidth / (finalScale * scaleCanvasToViewport);
      const sourceHeight = slotHeight / (finalScale * scaleCanvasToViewport);
      
      // ドラッグ移動距離（ビューポート基準）を実寸画像基準に変換
      // (平行移動方向は、ドラッグと画像移動が順方向、切り出し座標は逆方向になるためマイナス)
      const sourceOffsetX = -slot.x / finalScale;
      const sourceOffsetY = -slot.y / finalScale;
      
      // 切り出し開始の左上座標 (画像の中心を起点とする)
      const sourceX = (imgNaturalWidth / 2) - (sourceWidth / 2) + sourceOffsetX;
      const sourceY = (imgNaturalHeight / 2) - (sourceHeight / 2) + sourceOffsetY;
      
      // 枠線を描画（うっすらとしたグレー）
      ctx.strokeStyle = '#e2e5f0';
      ctx.lineWidth = 2;
      ctx.strokeRect(destX, destY, slotWidth, slotHeight);
      
      // Canvasにクリッピングして画像を描画
      ctx.save();
      ctx.beginPath();
      ctx.rect(destX, destY, slotWidth, slotHeight);
      ctx.clip();
      
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight,  // 元画像の切り出し領域
        destX, destY, slotWidth, slotHeight           // 描画先領域
      );
      ctx.restore();
      
      // スロット名を表示 (例: "Original", "Pose 2")
      ctx.fillStyle = 'rgba(15, 17, 26, 0.6)';
      ctx.fillRect(destX + 15, destY + 15, 180, 36);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold 18px 'Outfit', sans-serif`;
      const labels = ["Original", "Scene (Troubled Chart)", "Outfit (Smartphone App)", "Outfit (Beautician)"];
      ctx.fillText(labels[index], destX + 30, destY + 40);
    });
    
    // --- 4. フッターテキスト（タグ）の描画 ---
    const footerY = canvasHeight - footerHeight + 40;
    
    // 下部境界線
    ctx.strokeStyle = '#e2e5f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, footerY - 20);
    ctx.lineTo(canvasWidth - padding, footerY - 20);
    ctx.stroke();
    
    ctx.fillStyle = '#8c92b3';
    ctx.font = `bold 24px 'Outfit', 'Noto Sans JP', sans-serif`;
    ctx.fillText('CHARACTER TAGS', padding, footerY + 10);
    
    // タグバッジの並び描画
    ctx.font = `24px 'Outfit', 'Noto Sans JP', sans-serif`;
    const activeChar = state.characters.find(c => c.id === state.activeCharId) || state.characters[0];
    const tags = (activeChar.charTags || '').split(/[,、]/)
      .map(t => t.trim())
      .filter(t => t.length > 0);
      
    let tagX = padding;
    const tagY = footerY + 55;
    
    tags.forEach(tag => {
      const tagText = `#${tag}  `;
      const textWidth = ctx.measureText(tagText).width;
      
      ctx.fillStyle = '#7a22ff'; // 紫のハッシュタグ風テキスト
      ctx.fillText(tagText, tagX, tagY);
      tagX += textWidth + 20;
    });
    
    // シートの生成元情報のフッター
    ctx.fillStyle = '#b5b9d2';
    ctx.font = `18px 'Outfit', sans-serif`;
    ctx.fillText('Generated by CHAR-MODEL SHEET CREATOR', padding, canvasHeight - 40);
    
    // --- 5. ダウンロード処理 ---
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    const safeName = (activeChar.charName || 'character').replace(/\s+/g, '_');
    link.download = `${safeName}_model_sheet.png`;
    link.href = dataURL;
    link.click();
  }
}

// ==========================================================================
// Dress-Up Studio Logic
// ==========================================================================

const dressUpDatabase = {
  // トップス
  'tshirt': 'references/test1_outfit_summer_casual.jpg', 
  'blouse': 'references/test1.png',
  'knit': 'references/test1_outfit_summer_beautician_knit.jpg',
  'sheer': 'references/test1_outfit_summer_beautician_sheer.jpg',
'mode': 'references/test1_outfit_mode_short.jpg',
  'casual': 'references/test1_outfit_summer_casual.jpg',

  // エプロン系
  'black-apron': 'references/test1_hairdresser.png',
  'beige-apron': 'references/test1_hairdresser_beige_apron.jpg',
  'denim-apron': 'references/test1_hairdresser_denim_apron.jpg',
  'no-apron': 'references/test1.png',

  // アイテム・ポーズ系
  'normal': 'references/test1.png',
  'smartphone': 'references/test1_smartphone.jpg',
  'chart-writing': 'references/test1_chart_trouble.jpg',
  'holding-200g': 'references/test1_holding_200g.jpg',
  'wasting-money': 'references/test1_wasting_money_bucket.jpg',
  'scissor-case': 'references/test1_hairdresser.png',
  'sit-cross': 'references/test1_miniskirt_sit_cross.jpg',
  'sit-knees': 'references/test1_miniskirt_sit_knees_together.jpg',
  'sit-relax': 'references/test1_miniskirt_sit_relax.jpg',
};

function updateDressUpStudioUI() {
  const activeChar = state.characters.find(c => c.id === state.activeCharId);
  const tags = document.querySelectorAll('.dressup-tag');
  
  if (!activeChar || !activeChar.activeTags) {
    tags.forEach(tag => tag.classList.remove('active'));
    return;
  }
  
  tags.forEach(tag => {
    if (activeChar.activeTags.includes(tag.getAttribute('data-tag'))) {
      tag.classList.add('active');
    } else {
      tag.classList.remove('active');
    }
  });
}

function setupDressUpStudio() {
  const tags = document.querySelectorAll('.dressup-tag');
  const aiMsgBox = document.getElementById('ai-prompt-msg');
  const aiPromptText = document.getElementById('ai-prompt-text');

  // カスタムプロンプト入力要素
  const promptCount = document.getElementById('prompt-count');
  const promptScene = document.getElementById('prompt-scene');
  const promptAction = document.getElementById('prompt-action');
  const promptBg = document.getElementById('prompt-bg');
  const designRadios = document.getElementsByName('design-spec');

  const triggerEvaluate = () => {
    evaluateDressUpCombination(aiMsgBox, aiPromptText, promptScene, promptAction, promptBg, designRadios, promptCount);
  };

  // アコーディオンの開閉処理
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      header.parentElement.classList.toggle('open');
    });
  });

  // 全クリアボタン
  const clearAllBtn = document.getElementById('clear-all-tags-btn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      const activeChar = state.characters.find(c => c.id === state.activeCharId);
      if (activeChar) {
        activeChar.activeTags = [];
      }
      document.querySelectorAll('.dressup-tag:not(#prompt-count-tags .dressup-tag)').forEach(tag => tag.classList.remove('active'));
      saveData();
      triggerEvaluate();
    });
  }

  // 生成枚数タグ
  const countTags = document.querySelectorAll('#prompt-count-tags .dressup-tag');
  countTags.forEach(tag => {
    tag.addEventListener('click', () => {
      countTags.forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      triggerEvaluate();
    });
  });

  tags.forEach(tag => {
    // 生成枚数タグは別処理
    if (tag.closest('#prompt-count-tags')) return;

    tag.addEventListener('click', () => {
      const activeChar = state.characters.find(c => c.id === state.activeCharId);
      if (!activeChar) return;
      if (!activeChar.activeTags) activeChar.activeTags = [];

      // ランダムボタンの場合
      if (tag.classList.contains('btn-random')) {
        const container = tag.closest('.dressup-tags');
        const siblingTags = Array.from(container.querySelectorAll('.dressup-tag:not(.btn-random)'));
        if (siblingTags.length > 0) {
          // すべての兄弟タグをオフ
          siblingTags.forEach(t => {
            t.classList.remove('active');
            const tId = t.getAttribute('data-tag');
            activeChar.activeTags = activeChar.activeTags.filter(at => at !== tId);
          });
          
          // ランダムに1つ選択
          const randomTag = siblingTags[Math.floor(Math.random() * siblingTags.length)];
          randomTag.classList.add('active');
          const randomTagId = randomTag.getAttribute('data-tag');
          if (!activeChar.activeTags.includes(randomTagId)) {
            activeChar.activeTags.push(randomTagId);
          }
          
          saveData();
          triggerEvaluate();
        }
        return;
      }

      tag.classList.toggle('active');
      const tagId = tag.getAttribute('data-tag');
      
      if (tag.classList.contains('active')) {
        activeChar.activeTags.push(tagId);
      } else {
        activeChar.activeTags = activeChar.activeTags.filter(t => t !== tagId);
      }

      saveData();
      triggerEvaluate();
    });
  });

  // 自由入力欄の変更時もプロンプトを再構築する
  if (promptScene) promptScene.addEventListener('input', triggerEvaluate);
  if (promptAction) promptAction.addEventListener('input', triggerEvaluate);
  if (promptBg) promptBg.addEventListener('input', triggerEvaluate);
  if (designRadios) {
    designRadios.forEach(radio => radio.addEventListener('change', triggerEvaluate));
  }
  
  // 初期ロード時のUI更新
  updateDressUpStudioUI();
}

function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i data-lucide="check-circle" style="vertical-align: middle; margin-right: 6px; width: 18px; height: 18px;"></i> ${message}`;
  if (window.lucide) window.lucide.createIcons();
  
  toast.classList.add('show');
  
  // Clear any existing timeout
  if (toast.timeoutId) clearTimeout(toast.timeoutId);
  
  toast.timeoutId = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function evaluateDressUpCombination(aiMsgBox, aiPromptText, promptScene, promptAction, promptBg, designRadios, promptCount) {
  const customScene = promptScene ? promptScene.value.trim() : '';
  const customAction = promptAction ? promptAction.value.trim() : '';
  const customBg = promptBg ? promptBg.value.trim() : '';
  
  let designSpec = 'fixed';
  if (designRadios) {
    for (const radio of designRadios) {
      if (radio.checked) {
        designSpec = radio.value;
        break;
      }
    }
  }

  aiMsgBox.classList.add('active');
  
  // === マルチキャラクタープロンプトの構築 ===
  const selectedCheckboxes = document.querySelectorAll('.prompt-char-select:checked');
  const selectedCharIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));
  const selectedChars = selectedCharIds.map(id => state.characters.find(c => c.id === id)).filter(Boolean);
  
  if (selectedChars.length === 0) {
    aiPromptText.innerHTML = "※登場させるキャラクターを少なくとも1人選択してください。";
    return;
  }

  // 1. 世界観
  const styleStr = state.baseStyle ? `\n【共通の画風・世界観】：\n${state.baseStyle}\n` : '';

  // 2. 服装・アイテムの処理 (アクティブなタグ)
  const allUsedTags = [];
  
  // Helper to process tags for a character
  const processCharTags = (char) => {
    const tags = char.activeTags || [];
    const tops = tags.filter(t => ['tshirt', 'blouse', 'knit', 'sheer', 'mode', 'casual', 'hoodie', 'cardigan', 'offshoulder', 'camisole', 'sweater', 'tracksuit', 'dress-shirt', 'tube-top', 'tank-top', 'leather-jacket', 'denim-jacket', 'kimono', 'maid-outfit', 'swimsuit-bikini', 'swimsuit-onepiece', 'random-top'].includes(t));
    const bottoms = tags.filter(t => ['casual', 'pants', 'jeans', 'skirt', 'shortpants', 'tightskirt', 'flareskirt', 'slacks', 'pleated-skirt', 'long-skirt', 'hot-pants', 'sweatpants', 'random-bottom'].includes(t));
    const aprons = tags.filter(t => t.includes('apron'));
    const angles = tags.filter(t => t.startsWith('angle-'));
    const hairs = tags.filter(t => t.startsWith('hair-'));
    const colors = tags.filter(t => t.startsWith('color-'));
    const bangs = tags.filter(t => t.startsWith('bangs-'));
    const stylesRoles = tags.filter(t => t.startsWith('style-') || t.startsWith('role-'));
    const patterns = tags.filter(t => t.startsWith('pattern-') || t.startsWith('tone-'));
    const emotions = tags.filter(t => t.startsWith('emotion-'));
    const scenesBgs = tags.filter(t => t.startsWith('scene-') || t.startsWith('bg-'));
    const lights = tags.filter(t => t.startsWith('light-'));
    const formats = tags.filter(t => t.startsWith('format-'));
    const props = tags.filter(t => !t.startsWith('hair-') && !t.startsWith('color-') && !t.startsWith('bangs-') && !t.startsWith('style-') && !t.startsWith('role-') && !t.startsWith('pattern-') && !t.startsWith('tone-') && !t.startsWith('emotion-') && !t.startsWith('angle-') && !t.startsWith('scene-') && !t.startsWith('bg-') && !t.startsWith('light-') && !t.startsWith('format-') && !tops.includes(t) && !bottoms.includes(t) && !aprons.includes(t));

    const outfitStr = [];
    if (tops.length) outfitStr.push(`トップス: ${document.querySelector(`[data-tag="${tops[0]}"]`)?.textContent}`);
    if (bottoms.length) outfitStr.push(`ボトムス: ${document.querySelector(`[data-tag="${bottoms[0]}"]`)?.textContent}`);
    if (aprons.length) outfitStr.push(`エプロン: ${document.querySelector(`[data-tag="${aprons[0]}"]`)?.textContent}`);

    const itemStr = props.map(p => document.querySelector(`[data-tag="${p}"]`)?.textContent).join(', ');
    const angleTags = angles.map(a => document.querySelector(`[data-tag="${a}"]`)?.textContent);
    const hairStr = hairs.map(h => document.querySelector(`[data-tag="${h}"]`)?.textContent).join(', ');
    const colorStr = colors.map(c => document.querySelector(`[data-tag="${c}"]`)?.textContent).join(', ');
    const bangStr = bangs.map(b => document.querySelector(`[data-tag="${b}"]`)?.textContent).join(', ');
    const styleRoleStr = stylesRoles.map(s => document.querySelector(`[data-tag="${s}"]`)?.textContent).join(', ');
    const patternStr = patterns.map(p => document.querySelector(`[data-tag="${p}"]`)?.textContent).join(', ');
    const emotionStr = emotions.map(e => document.querySelector(`[data-tag="${e}"]`)?.textContent).join(', ');
    
    const sceneBgTags = scenesBgs.map(s => document.querySelector(`[data-tag="${s}"]`)?.textContent);
    const lightTags = lights.map(l => document.querySelector(`[data-tag="${l}"]`)?.textContent);
    const formatTags = formats.map(f => document.querySelector(`[data-tag="${f}"]`)?.textContent);
    
    tags.forEach(t => allUsedTags.push(t));
    
    return { outfitStr, itemStr, angleTags, hairStr, colorStr, bangStr, styleRoleStr, patternStr, emotionStr, sceneBgTags, lightTags, formatTags };
  };

  let globalAngleTags = new Set();
  let globalSceneBgTags = new Set();
  let globalLightTags = new Set();
  let globalFormatTags = new Set();

  // 3. キャラクター情報（人数分）
  let charactersStr = '';
  if (selectedChars.length === 1) {
    const char = selectedChars[0];
    const { outfitStr, itemStr, angleTags, hairStr, colorStr, bangStr, styleRoleStr, patternStr, emotionStr, sceneBgTags, lightTags, formatTags } = processCharTags(char);
    angleTags.forEach(a => globalAngleTags.add(a));
    sceneBgTags.forEach(s => globalSceneBgTags.add(s));
    lightTags.forEach(l => globalLightTags.add(l));
    formatTags.forEach(f => globalFormatTags.add(f));
    
    let finalHair = char.attrHair || '指定なし';
    if (colorStr) finalHair += ` (色変更: ${colorStr})`;
    if (hairStr) finalHair += ` (髪型変更: ${hairStr})`;
    if (bangStr) finalHair += ` (前髪: ${bangStr})`;
    
    charactersStr = `\n【キャラクターの特徴】：
- 髪: ${finalHair}
- 目: ${char.attrEyes || '指定なし'}
- メモ: ${char.charMemo || '特になし'}
${emotionStr ? `- 感情/表情: ${emotionStr}\n` : ''}${styleRoleStr ? `- 系統/役割: ${styleRoleStr}\n` : ''}${char.refImage ? `- 参考画像 (cref): \`${char.refImage}\` を使用\n` : ''}`;

    if (outfitStr.length > 0) charactersStr += `- 服装: ${outfitStr.join(' / ')}\n`;
    if (patternStr) charactersStr += `- 服装の柄/色合い: ${patternStr}\n`;
    if (itemStr.length > 0) charactersStr += `- アクション/アイテム: ${itemStr}\n`;
    
  } else {
    // 複数人の場合
    charactersStr = `\n【登場人物 (${selectedChars.length}人)】：`;
    selectedChars.forEach((char, index) => {
      const { outfitStr, itemStr, angleTags, hairStr, colorStr, bangStr, styleRoleStr, patternStr, emotionStr, sceneBgTags, lightTags, formatTags } = processCharTags(char);
      angleTags.forEach(a => globalAngleTags.add(a));
      sceneBgTags.forEach(s => globalSceneBgTags.add(s));
      lightTags.forEach(l => globalLightTags.add(l));
      formatTags.forEach(f => globalFormatTags.add(f));
      
      let finalHair = char.attrHair || '指定なし';
      if (colorStr) finalHair += ` (色変更: ${colorStr})`;
      if (hairStr) finalHair += ` (髪型変更: ${hairStr})`;
      if (bangStr) finalHair += ` (前髪: ${bangStr})`;
      
      charactersStr += `\n▼ 人物${index + 1} (${char.charName || '名無し'}):
- 髪: ${finalHair}
- 目: ${char.attrEyes || '指定なし'}
- メモ: ${char.charMemo || '特になし'}`;
      if (emotionStr) charactersStr += `\n- 感情/表情: ${emotionStr}`;
      if (styleRoleStr) charactersStr += `\n- 系統/役割: ${styleRoleStr}`;
      if (char.refImage) charactersStr += `\n- 参考画像 (cref): \`${char.refImage}\` を使用`;
      if (outfitStr.length > 0) charactersStr += `\n- 服装: ${outfitStr.join(' / ')}`;
      if (patternStr) charactersStr += `\n- 服装の柄/色合い: ${patternStr}`;
      if (itemStr.length > 0) charactersStr += `\n- アクション/アイテム: ${itemStr}`;
    });
    charactersStr += '\n';
  }

  // 4. シーン・動作・アングル
  const sceneText = customScene ? `\n【シーン】：${customScene}` : '';
  const actionText = customAction ? `\n【動作】：${customAction}` : '';
  const angleText = globalAngleTags.size > 0 ? `\n【アングル/構図】：${Array.from(globalAngleTags).join(', ')}` : '';
  
  // セーフゾーン（リール等での後加工用）の指示を常に追加
  const safeZoneInstruction = '（※重要：後で枠を大きく切り抜くため、キャラクターは画面いっぱいに描かず、周囲に十分な余白（セーフゾーン）を確保して少し引きの構図で描いてください。頭や足先が画面の端に近すぎないようにすること）';
  const bgText = customBg ? `\n【背景】：${customBg} ${safeZoneInstruction}` : `\n【背景】：${safeZoneInstruction}`;

  // 5. デザイン指定
  let designInstruction = designSpec === 'fixed' 
    ? '（※今までと同じデザインの一貫性を保って生成してください）' 
    : '（※服装の形状や柄はおまかせで別のデザインにアレンジしてください）';

  const countTag = document.querySelector('#prompt-count-tags .active');
  const countText = countTag ? countTag.getAttribute('data-count') : '1';
  
  // プロンプトを結合
  const promptInstruction = `以下の内容でイラストを ${countText}枚 生成してください。`;
  const combinedPrompt = `${promptInstruction}${styleStr}${charactersStr}${sceneText}${actionText}${angleText}${bgText}\n${designInstruction}`;
  
  aiPromptText.innerText = combinedPrompt;
  
  // 6. AI連携用: 現在の選択状態をバックエンドに送信
  const currentState = {
    activeTags: allUsedTags,
    requestedPrompt: aiPromptText.innerText,
    generateCount: countText
  };

  fetch('/api/save-state', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(currentState)
  }).catch(err => console.error('AI Integration Error:', err));
}

// === コピー機能の初期化 ===
document.addEventListener('DOMContentLoaded', () => {
  const btnCopyPrompt = document.getElementById('btn-copy-prompt');
  if (btnCopyPrompt) {
    btnCopyPrompt.addEventListener('click', () => {
      const promptText = document.getElementById('ai-prompt-text').innerText;
      if (!promptText) return;
      
      navigator.clipboard.writeText(promptText).then(() => {
        const originalText = btnCopyPrompt.innerHTML;
        btnCopyPrompt.innerHTML = '<i data-lucide="check"></i> コピーしました！';
        if(window.lucide) lucide.createIcons();
        setTimeout(() => {
          btnCopyPrompt.innerHTML = originalText;
          if(window.lucide) lucide.createIcons();
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    });
  }
});

// ==========================================================================
// Dynamic Gallery System
// ==========================================================================
function fetchGeneratedImages() {
  const container = document.getElementById('gallery-grid-container');
  if (!container) return;
  
  fetch('/api/latest-images')
    .then(res => res.json())
    .then(data => {
      if (data.success && data.images) {
        container.innerHTML = '';
        data.images.forEach(imgData => {
          const img = document.createElement('img');
          img.className = 'gallery-thumbnail';
          // Use cache buster for fresh load if needed, but not strictly necessary here
          img.src = `/${imgData.path}?t=${imgData.mtime}`; 
          img.alt = 'Generated Image';
          img.addEventListener('click', () => {
            if (typeof openLightbox === 'function') {
              openLightbox(`/${imgData.path}`);
            }
          });
          container.appendChild(img);
        });
      }
    })
    .catch(err => console.error('Failed to fetch generated images:', err));
}

if (btnReloadImages) {
  btnReloadImages.addEventListener('click', () => {
    fetchGeneratedImages();
    showToast('画像を更新しました');
  });
}

if (btnOpenFolder) {
  btnOpenFolder.addEventListener('click', () => {
    fetch('/api/open-folder', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          showToast('フォルダを開けませんでした: ' + data.error);
        }
      })
      .catch(err => {
        console.error(err);
        showToast('通信エラーが発生しました');
      });
  });
}

// 初期ロード時にギャラリー取得
fetchGeneratedImages();
