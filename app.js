// ==========================================================================
// Application State & Constants
// ==========================================================================
const STATE_KEY = 'char_model_sheet_data';

// デフォルトの状態
let state = {
  aspectRatio: '9-16', // '3-4' | '9-16' | '1-1'
  charName: 'Pink Hair Character',
  charTags: 'Pink Hair, Soft Watercolor, Multi-Pose, Character Sheet',
  attrHair: 'Light Pink, Wavy Long',
  attrEyes: 'Gentle Smile',
  charMemo: 'Soft watercolor style. Wavy light pink long hair. Gentle and happy expressions. Height: ~160cm.',
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

// フォーム要素
const profileForm = document.getElementById('profile-form');
const charNameInput = document.getElementById('char-name');
const charTagsInput = document.getElementById('char-tags');
const tagsPreview = document.getElementById('tags-preview');
const attrHairInput = document.getElementById('attr-hair');
const attrEyesInput = document.getElementById('attr-eyes');
const charMemoInput = document.getElementById('char-memo');

// ==========================================================================
// Event Listeners Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // データの読み込み
  loadSavedData();

  // ギャラリーの初期化とレンダリング
  renderGallery();
  setupLightbox();

  // 各種リスナー設定
  if (btnReloadImages) {
    btnReloadImages.addEventListener('click', forceReloadImages);
  }
  setupSlotSelection();
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
// File Input & Image Loader
// ==========================================================================
function setupFileInput() {
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target.result;
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
    };
    reader.readAsDataURL(file);
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

  const inputs = [charNameInput, attrHairInput, attrEyesInput, charMemoInput];
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
  if (!tagsString.trim()) return;

  const tags = tagsString.split(',')
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
  state.charName = charNameInput.value;
  state.charTags = charTagsInput.value;
  state.attrHair = attrHairInput.value;
  state.attrEyes = attrEyesInput.value;
  state.charMemo = charMemoInput.value;

  localStorage.setItem(STATE_KEY, JSON.stringify(state));
  markAsSaved();

  const card = document.querySelector('.info-section');
  card.style.borderColor = 'var(--accent-green)';
  setTimeout(() => {
    card.style.borderColor = 'var(--border-color)';
  }, 500);
}

function loadSavedData() {
  const saved = localStorage.getItem(STATE_KEY);
  if (!saved) {
    updateTagsPreview(state.charTags);
    return;
  }

  try {
    const data = JSON.parse(saved);
    
    // 互換性担保（スロット数が同じか）
    if (data.slots && data.slots.length === state.slots.length) {
      state = { ...state, ...data };
    } else {
      // スロット情報以外をマージ
      const { slots, ...otherData } = data;
      state = { ...state, ...otherData };
    }

    // 不正な数値 (NaNなど) のバリデーションと補正
    state.slots.forEach(slot => {
      if (typeof slot.x !== 'number' || isNaN(slot.x)) slot.x = 0;
      if (typeof slot.y !== 'number' || isNaN(slot.y)) slot.y = 0;
      if (typeof slot.scale !== 'number' || isNaN(slot.scale) || slot.scale <= 0) slot.scale = 1.0;
      if (typeof slot.baseScale !== 'number' || isNaN(slot.baseScale) || slot.baseScale <= 0) slot.baseScale = 1.0;
      
      // 古いカジュアル画像を美容師風画像に自動マイグレーション
      if (slot.src === 'references/test1_pose4.png') {
        slot.src = 'references/test1_hairdresser.png';
        slot.x = 0;
        slot.y = 0;
        slot.scale = 1.0;
      }

      // 古い本持ち画像をカルテ悩み画像に自動マイグレーション
      if (slot.src === 'references/test1_pose3.png') {
        slot.src = 'references/test1_chart_trouble.jpg';
        slot.x = 0;
        slot.y = 0;
        slot.scale = 1.0;
      }
    });

    charNameInput.value = state.charName;
    charTagsInput.value = state.charTags;
    attrHairInput.value = state.attrHair;
    attrEyesInput.value = state.attrEyes;
    charMemoInput.value = state.charMemo;

    updateTagsPreview(state.charTags);

    // アスペクト比ボタンのアクティブ切り替え
    const aspectButtons = document.querySelectorAll('.btn-aspect');
    aspectButtons.forEach(btn => {
      if (btn.dataset.ratio === state.aspectRatio) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const viewports = document.querySelectorAll('.poses-grid-container .viewport');
    viewports.forEach(vp => {
      vp.className = `viewport aspect-${state.aspectRatio}`;
    });

    markAsSaved();
  } catch (e) {
    console.error('Failed to load state:', e);
    markAsUnsaved();
  }
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
  // タイトル (キャラクター名)
  ctx.fillStyle = '#0f111a';
  ctx.font = `bold 64px 'Outfit', 'Noto Sans JP', sans-serif`;
  ctx.fillText(state.charName || 'Character Model Sheet', padding, 100);
  
  // サブタイトル / 属性情報
  ctx.fillStyle = '#656a8a';
  ctx.font = `28px 'Outfit', 'Noto Sans JP', sans-serif`;
  const infoText = `Hair: ${state.attrHair || 'N/A'}  |  Eyes: ${state.attrEyes || 'N/A'}`;
  ctx.fillText(infoText, padding, 150);
  
  // メモテキストの描画
  ctx.fillStyle = '#4a4f6d';
  ctx.font = `italic 24px 'Outfit', 'Noto Sans JP', sans-serif`;
  const memoText = state.charMemo || '';
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
    const tags = (state.charTags || '').split(',')
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
    link.download = `${state.charName.replace(/\s+/g, '_')}_model_sheet.png`;
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

  let activeTags = [];

  const triggerEvaluate = () => {
    evaluateDressUpCombination(activeTags, aiMsgBox, aiPromptText, promptScene, promptAction, promptBg, designRadios, promptCount);
  };

  tags.forEach(tag => {
    tag.addEventListener('click', () => {
      // Toggle active class
      tag.classList.toggle('active');
      
      const tagId = tag.getAttribute('data-tag');
      if (tag.classList.contains('active')) {
        activeTags.push(tagId);
      } else {
        activeTags = activeTags.filter(t => t !== tagId);
      }

      triggerEvaluate();
    });
  });

  // 自由入力欄の変更時もプロンプトを再構築する
  if (promptCount) promptCount.addEventListener('change', triggerEvaluate);
  if (promptScene) promptScene.addEventListener('input', triggerEvaluate);
  if (promptAction) promptAction.addEventListener('input', triggerEvaluate);
  if (promptBg) promptBg.addEventListener('input', triggerEvaluate);
  if (designRadios) {
    designRadios.forEach(radio => radio.addEventListener('change', triggerEvaluate));
  }
}

function evaluateDressUpCombination(activeTags, aiMsgBox, aiPromptText, promptScene, promptAction, promptBg, designRadios, promptCount) {
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

  const hasCustomInput = customScene !== '' || customAction !== '' || customBg !== '';

  if (activeTags.length === 0 && !hasCustomInput) {
    aiMsgBox.classList.remove('active');
    return;
  }

  // 1. 基本となるキーを生成 (最後にクリックされたものを主軸にする等の簡単な実装)
  let imagePath = null;
  const lastTag = activeTags[activeTags.length - 1];
  
  // 2. 特殊な組み合わせの完全一致を優先チェック
  if (activeTags.includes('chart-writing')) {
    if (activeTags.includes('tshirt')) imagePath = 'references/test1_chart_trouble_tshirt.jpg';
    else if (activeTags.includes('knit')) imagePath = 'references/test1_chart_trouble_knit.jpg';
    else if (activeTags.includes('sheer')) imagePath = 'references/test1_chart_trouble_sheer.jpg';
    else if (activeTags.includes('denim-apron')) imagePath = 'references/test1_chart_trouble_denim_apron.jpg';
    else imagePath = 'references/test1_chart_trouble.jpg';
  }
  else if (activeTags.includes('color-cup')) {
    if (activeTags.includes('beige-apron')) imagePath = 'references/test1_wasting_money_cup_beige.jpg';
    else if (activeTags.includes('denim-apron')) imagePath = 'references/test1_wasting_money_cup_denim.jpg';
    else if (activeTags.includes('mode')) imagePath = 'references/test1_wasting_money_cup_black.jpg';
    else imagePath = null; // カラーカップ単体の画像はないためプロンプト表示
  }
  else {
    // 組み合わせが見つからなければ、単体タグで検索
    imagePath = dressUpDatabase[lastTag];
  }

  // 3. 組み合わせが未知で画像がない場合の判定 (またはカスタム入力がある場合)
  // カスタム入力（シーン、動作など）が1つでも入力されていれば、強制的に「未生成」扱いにしてプロンプトを生成させる
  if (hasCustomInput) {
    imagePath = null;
  } else if (activeTags.length > 1 && !imagePath && !activeTags.includes('chart-writing') && !activeTags.includes('color-cup')) {
     imagePath = null; 
  }

  // 4. 結果の反映
  if (imagePath) {
    // 画像が存在する場合、現在のスロットの画像を更新
    aiMsgBox.classList.remove('active');
    
    const slotCard = document.querySelector(`.slot-card[data-slot="${activeSlotIndex}"]`);
    const img = slotCard.querySelector('.slot-img');
    
    // UI側の更新
    img.style.opacity = '0.3';
    img.src = imagePath;
    
    // キャッシュ対策とロード完了後の表示
    img.onload = () => {
      img.style.opacity = '1';
      calculateBaseScale(activeSlotIndex, img);
      updateSlotImageTransform(activeSlotIndex);
    };
    
    // ステートの更新
    state.slots[activeSlotIndex].src = imagePath;
    saveData();
    
  } else {
    // 画像が存在しない（またはカスタム入力がある）場合、AIプロンプトを構築して表示
    aiMsgBox.classList.add('active');
    
    const hairTags = [];
    const outfitTags = [];
    activeTags.forEach(t => {
      const el = document.querySelector(`.dressup-tag[data-tag="${t}"]`);
      if (el) {
        if (t.startsWith('hair-') || t.startsWith('color-')) {
          hairTags.push(el.innerText);
        } else {
          outfitTags.push(el.innerText);
        }
      }
    });
    
    const outfitText = outfitTags.length > 0 ? outfitTags.join('、') : '特になし';
    const hairText = hairTags.length > 0 ? hairTags.join('、') : '基本のまま';
    
    const designText = designSpec === 'random' ? '（※形状や柄はおまかせで別のデザインにして！）' : '（※今までと同じデザインで完全再現）';
    const countText = promptCount ? promptCount.value : '1';
    
    let promptLines = [
      `このキャラクターで以下の内容のイラストを ${countText}枚 生成してください。`,
      `【髪型・髪色】：${hairText}`,
      `【服装・アイテム】：${outfitText} ${designText}`
    ];

    if (customScene) promptLines.push(`【シーン】：${customScene}`);
    if (customAction) promptLines.push(`【動作】：${customAction}`);
    if (customBg) promptLines.push(`【背景】：${customBg}`);
    
    aiPromptText.innerText = promptLines.join('\n');
  }

  // 5. AI連携用: 現在の選択状態をバックエンドに送信
  const currentState = {
    activeTags: activeTags,
    requestedPrompt: aiMsgBox.classList.contains('active') ? aiPromptText.innerText : null,
    generateCount: promptCount ? promptCount.value : '1'
  };

  fetch('/api/save-state', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(currentState)
  }).catch(err => console.error('AI Integration Error:', err));
}

