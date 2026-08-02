const fs = require('fs');

const categories = [
  {
    title: "生成枚数 (Count)",
    id: "count",
    isOpen: true,
    html: `
      <div id="prompt-count-tags" class="dressup-tags" style="margin-bottom: 0;">
        ${[1,2,3,4,5,6,7,8,9,10].map(i => `<span class="dressup-tag" data-count="${i}">${i}枚</span>`).join('\n        ')}
      </div>
    `
  },
  {
    title: "髪型 (Hair Style)",
    id: "hairstyle",
    isOpen: false,
    tags: [
      { id: "hair-random", name: "🎲 ランダム (毎枚変更)", isRandom: true },
      { id: "hair-long-wavy", name: "ロングウェーブ (基本)" },
      { id: "hair-short-bob", name: "ショートボブ" },
      { id: "hair-ponytail", name: "ポニーテール" },
      { id: "hair-twintails", name: "ツインテール" },
      { id: "hair-straight-long", name: "ストレートロング" },
      { id: "hair-bun", name: "お団子ヘア" },
      { id: "hair-braid", name: "三つ編み" },
      { id: "hair-hime", name: "姫カット" },
      { id: "hair-wolf", name: "ウルフカット" },
      { id: "hair-mushroom", name: "マッシュルームヘア" },
      { id: "hair-halfup", name: "ハーフアップ" },
      { id: "hair-veryshort", name: "ベリーショート" },
      { id: "hair-messybun", name: "無造作お団子" },
      { id: "hair-sidetail", name: "サイドテール" },
      { id: "hair-curly", name: "カーリーヘア" }
    ]
  },
  {
    title: "前髪 (Bangs)",
    id: "bangs",
    isOpen: false,
    tags: [
      { id: "bangs-random", name: "🎲 ランダム (毎枚変更)", isRandom: true },
      { id: "bangs-blunt", name: "ぱっつん" },
      { id: "bangs-parted", name: "センター分け" },
      { id: "bangs-swept", name: "流し前髪" },
      { id: "bangs-seethrough", name: "シースルー" },
      { id: "bangs-up", name: "かき上げ" },
      { id: "bangs-asym", name: "アシメ" }
    ]
  },
  {
    title: "髪色・特徴 (Hair Color)",
    id: "haircolor",
    isOpen: false,
    tags: [
      { id: "color-random", name: "🎲 ランダム (毎枚変更)", isRandom: true },
      { id: "color-pink", name: "ピンク系" },
      { id: "color-brown", name: "ブラウン系" },
      { id: "color-black", name: "黒髪" },
      { id: "color-blonde", name: "金髪・ブロンド" },
      { id: "color-silver", name: "シルバー・アッシュ" },
      { id: "color-gradient", name: "グラデーションカラー" },
      { id: "color-inner", name: "インナーカラー" },
      { id: "color-mesh", name: "メッシュ・ハイライト" }
    ]
  },
  {
    title: "服装・トップス (Tops)",
    id: "tops",
    isOpen: false,
    tags: [
      { id: "random-top", name: "🎲 ランダム (毎枚変更)", isRandom: true },
      { id: "tshirt", name: "Tシャツ" },
      { id: "blouse", name: "ブラウス" },
      { id: "knit", name: "ニット" },
      { id: "sheer", name: "シアートップス" },
      { id: "mode", name: "モード系トップス" },
      { id: "casual", name: "カジュアルシャツ" },
      { id: "hoodie", name: "パーカー" },
      { id: "cardigan", name: "カーディガン" },
      { id: "offshoulder", name: "オフショルダー" },
      { id: "camisole", name: "キャミソール" },
      { id: "sweater", name: "セーター" },
      { id: "tracksuit", name: "ジャージ" },
      { id: "dress-shirt", name: "ワイシャツ" },
      { id: "tube-top", name: "チューブトップ" },
      { id: "tank-top", name: "タンクトップ" },
      { id: "leather-jacket", name: "レザージャケット" },
      { id: "denim-jacket", name: "デニムジャケット" },
      { id: "kimono", name: "着物・浴衣" },
      { id: "maid-outfit", name: "メイド服" },
      { id: "swimsuit-bikini", name: "水着(ビキニ)" },
      { id: "swimsuit-onepiece", name: "水着(ワンピース)" }
    ]
  },
  {
    title: "服装・ボトムス (Bottoms)",
    id: "bottoms",
    isOpen: false,
    tags: [
      { id: "random-bottom", name: "🎲 ランダム (毎枚変更)", isRandom: true },
      { id: "pants", name: "パンツスタイル" },
      { id: "jeans", name: "ジーンズ" },
      { id: "skirt", name: "スカート" },
      { id: "shortpants", name: "ショートパンツ" },
      { id: "tightskirt", name: "タイトスカート" },
      { id: "flareskirt", name: "フレアスカート" },
      { id: "slacks", name: "スラックス" },
      { id: "pleated-skirt", name: "プリーツスカート" },
      { id: "long-skirt", name: "ロングスカート" },
      { id: "hot-pants", name: "ホットパンツ" },
      { id: "sweatpants", name: "スウェットパンツ" }
    ]
  },
  {
    title: "服装の柄・色合い (Pattern & Tone)",
    id: "pattern-tone",
    isOpen: false,
    tags: [
      { id: "pattern-random", name: "🎲 ランダム (毎枚変更)", isRandom: true },
      { id: "pattern-plain", name: "無地" },
      { id: "pattern-check", name: "チェック柄" },
      { id: "pattern-stripe", name: "ストライプ" },
      { id: "pattern-border", name: "ボーダー" },
      { id: "pattern-floral", name: "花柄" },
      { id: "pattern-dot", name: "水玉・ドット" },
      { id: "tone-pastel", name: "淡め・パステル" },
      { id: "tone-vivid", name: "ビビッド" },
      { id: "tone-monochrome", name: "モノトーン" },
      { id: "tone-dark", name: "ダークトーン" },
      { id: "tone-light", name: "ライトトーン" }
    ]
  },
  {
    title: "全体系統・役割 (Style & Role)",
    id: "style-role",
    isOpen: false,
    tags: [
      { id: "style-random", name: "🎲 ランダム (毎枚変更)", isRandom: true },
      { id: "style-casual", name: "カジュアル系" },
      { id: "style-yurufuwa", name: "ゆるふわ系" },
      { id: "style-morigirl", name: "森ガール" },
      { id: "style-rock", name: "ロック系" },
      { id: "style-punk", name: "パンク系" },
      { id: "style-gyaru", name: "ギャル系" },
      { id: "style-onee", name: "お姉系" },
      { id: "style-mode", name: "モード系" },
      { id: "role-beautician", name: "美容師" },
      { id: "role-office", name: "OL・オフィス" },
      { id: "role-student", name: "学生" },
      { id: "role-maid", name: "メイド" },
      { id: "role-model", name: "モデル" }
    ]
  },
  {
    title: "感情・表情 (Emotion & Expression)",
    id: "emotion",
    isOpen: false,
    tags: [
      { id: "emotion-random", name: "🎲 ランダム (毎枚変更)", isRandom: true },
      { id: "emotion-smile", name: "笑顔" },
      { id: "emotion-happy", name: "喜ぶ" },
      { id: "emotion-sad", name: "悲しむ" },
      { id: "emotion-angry", name: "怒る" },
      { id: "emotion-frustrated", name: "悔しい" },
      { id: "emotion-hard", name: "難しい" },
      { id: "emotion-easy", name: "簡単" },
      { id: "emotion-yay", name: "イエーイ" },
      { id: "emotion-surprised", name: "驚く" },
      { id: "emotion-wink", name: "ウィンク" }
    ]
  },
  {
    title: "サロンでの施術 (Salon Service)",
    id: "salon-service",
    isOpen: false,
    tags: [
      { id: "service-random", name: "🎲 ランダム (毎枚変更)", isRandom: true },
      { id: "service-cut", name: "カットしている" },
      { id: "service-color", name: "カラーしている" },
      { id: "service-perm", name: "パーマしている" },
      { id: "service-dry", name: "髪を乾かしている" },
      { id: "service-blow", name: "ドライヤーしている" },
      { id: "service-combing", name: "コーミング・クシとかしている" },
      { id: "service-styling", name: "スタイリングしている" },
      { id: "service-iron", name: "コテで巻いている" }
    ]
  },
  {
    title: "エプロン (美容師)",
    id: "apron",
    isOpen: false,
    tags: [
      { id: "random-apron", name: "🎲 ランダム (毎枚変更)", isRandom: true },
      { id: "no-apron", name: "エプロンなし" },
      { id: "black-apron", name: "黒エプロン" },
      { id: "beige-apron", name: "ベージュ" },
      { id: "denim-apron", name: "デニム" }
    ]
  },
  {
    title: "アイテム・ポーズ (Props & Actions)",
    id: "props",
    isOpen: false,
    tags: [
      { id: "prop-random", name: "🎲 ランダム (毎枚変更)", isRandom: true },
      { id: "normal", name: "標準（立ち姿）" },
      { id: "scissor-case", name: "シザーケース" },
      { id: "smartphone", name: "スマホ操作" },
      { id: "prop-smartphone-front", name: "スマホを前に向ける" },
      { id: "color-cup", name: "カラーカップを持つ" },
      { id: "prop-color-check", name: "カラーのチェックポイント" },
      { id: "chart-writing", name: "カルテ記入で悩む" },
      { id: "wasting-money", name: "お金を流して嘆く" },
      { id: "holding-200g", name: "200gの文字を持つ" },
      { id: "prop-attention", name: "注目させる" },
      { id: "sit-cross", name: "ミニスカート（脚組み）" },
      { id: "sit-knees", name: "ミニスカート（膝揃え）" },
      { id: "sit-relax", name: "ミニスカート（リラックス）" }
    ]
  },
  {
    title: "アングル・構図 (Angle)",
    id: "angle",
    isOpen: false,
    tags: [
      { id: "angle-random", name: "🎲 ランダム (毎枚変更)", isRandom: true },
      { id: "angle-bust", name: "胸上 (Bust up)" },
      { id: "angle-waist", name: "腰上 (Waist up)" },
      { id: "angle-knee", name: "膝上 (Knee up)" },
      { id: "angle-full", name: "全身 (Full body)" },
      { id: "angle-back", name: "背中越し (From behind)" },
      { id: "angle-side", name: "横顔 (Profile)" },
      { id: "angle-high", name: "俯瞰 (High angle)" },
      { id: "angle-low", name: "アオリ (Low angle)" },
      { id: "angle-face", name: "顔アップ (Close-up)" }
    ]
  },
  {
    title: "シーン・背景 (Scene & Background)",
    id: "scene-bg",
    isOpen: false,
    tags: [
      { id: "scene-random", name: "🎲 ランダム (毎枚変更)", isRandom: true },
      { id: "scene-salon", name: "美容室のセット面" },
      { id: "scene-shampoo", name: "シャンプー台" },
      { id: "scene-cafe", name: "カフェ" },
      { id: "scene-street", name: "街角" },
      { id: "scene-park", name: "公園" },
      { id: "scene-studio", name: "撮影スタジオ" },
      { id: "scene-room", name: "自分の部屋" },
      { id: "bg-white", name: "白背景" },
      { id: "bg-transparent", name: "透過背景（リール用）" },
      { id: "bg-simple", name: "シンプルな単色" }
    ]
  },
  {
    title: "ライティング・画面比率 (Lighting & Format)",
    id: "lighting-format",
    isOpen: false,
    tags: [
      { id: "light-random", name: "🎲 ランダム (毎枚変更)", isRandom: true },
      { id: "light-natural", name: "自然光" },
      { id: "light-studio", name: "スタジオ照明" },
      { id: "light-neon", name: "ネオンライト" },
      { id: "light-sunset", name: "夕暮れ・エモい" },
      { id: "light-cinematic", name: "シネマティック" },
      { id: "format-16-9", name: "横長 (16:9)" },
      { id: "format-9-16", name: "縦長 (9:16)" },
      { id: "format-reel-optimized", name: "縦長リール特化 (丸文字・中央揃え)" },
      { id: "format-1-1", name: "正方形 (1:1)" }
    ]
  }
];

let html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Character Model Sheet Creator</title>
  <!-- Google Fonts: Outfit -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Noto+Sans+JP:wght@300;400;700&display=swap" rel="stylesheet">
  <!-- Stylesheet -->
  <link rel="stylesheet" href="styles.css">
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body>
  <div class="app-main">
    <!-- 左カラム: プレビュー -->
    <main class="preview-section card">
      <div class="card-header">
        <h2><i data-lucide="image"></i> ギャラリープレビュー</h2>
      </div>

      <div class="canvas-container" id="canvas-container">
        <!-- 生成された画像がここにグリッド表示されます -->
        <div id="gallery-grid-container" class="gallery-grid">
          <div class="gallery-placeholder">
            <i data-lucide="image" style="width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
            <p>画像フォルダ (references) にある画像がここに表示されます</p>
          </div>
        </div>
      </div>
      
      <div class="controls-container">
        <div class="control-row">
          <label for="zoom-slider"><i data-lucide="zoom-in"></i> ズーム</label>
          <input type="range" id="zoom-slider" min="0.2" max="4" step="0.01" value="1.0">
          <span id="zoom-value">100%</span>
        </div>

        <div class="control-actions">
          <button id="btn-refresh" class="btn btn-primary" style="flex: 1;">
            <i data-lucide="refresh-cw"></i> 画像を更新
          </button>
        </div>
      </div>
    </main>

    <div class="right-column" style="display: flex; flex-direction: column; gap: 24px;">
      <!-- 着せ替え＆アイテム選択スタジオ -->
      <section class="dressup-studio card">
        <div class="dressup-header">
          <h3><i data-lucide="scissors"></i> Dress-Up & Props Studio</h3>
        </div>
        <p class="section-desc" style="margin-bottom: 12px;">キャラクターの服装、髪型、ポーズなどを細かく指定できます。</p>
        <div style="margin-bottom: 20px;">
          <button id="clear-all-tags-btn" class="btn btn-secondary" style="width: 100%;"><i data-lucide="trash-2"></i> 全てのタグ選択をクリア</button>
        </div>
`;

categories.forEach(cat => {
  const isOpenClass = cat.isOpen ? " open" : "";
  let innerHtml = cat.html ? cat.html : `
          <div class="dressup-tags" data-category="${cat.id}">
            ${cat.tags.map(t => `<span class="dressup-tag${t.isRandom ? ' dressup-tag-random' : ''}" data-tag="${t.id}">${t.name}</span>`).join('\n            ')}
          </div>`;
  
  html += `
        <div class="dressup-category accordion${isOpenClass}">
          <div class="accordion-header">
            <h4>${cat.title}</h4>
            <i data-lucide="chevron-down" class="accordion-icon"></i>
          </div>
          <div class="accordion-content">
${innerHtml}
          </div>
        </div>
`;
});

html += `
        <!-- カスタムプロンプトビルダー -->
        <div class="custom-prompt-section">
          <h4><i data-lucide="edit-3"></i> AIへのカスタム指示</h4>
          
          <div class="design-toggle-group">
            <label class="design-toggle-label">
              <input type="radio" name="design-spec" value="fixed" checked>
              今までと同じデザインで生成（指定を完全再現）
            </label>
            <label class="design-toggle-label">
              <input type="radio" name="design-spec" value="random">
              デザインはおまかせで生成（形状や柄をランダムに変更）
            </label>
          </div>

          <!-- 登場キャラクター選択 -->
          <div class="multi-char-selector">
            <label class="multi-char-label"><i data-lucide="users"></i> 登場させるキャラクターを選択 (複数可):</label>
            <div id="prompt-char-checkboxes" class="char-checkbox-group">
              <!-- JavaScriptで動的生成 -->
            </div>
          </div>

          <div class="custom-input-group">
            <div class="custom-input-row">
              <label for="prompt-scene">シーン (場面)</label>
              <input type="text" id="prompt-scene" placeholder="例: 営業終了後の美容室、休日のカフェ など">
            </div>
            <div class="custom-input-row">
              <label for="prompt-action">させたい動作</label>
              <input type="text" id="prompt-action" placeholder="例: コーヒーを飲んでホッとしている など">
            </div>
            <div class="custom-input-row">
              <label for="prompt-bg">背景</label>
              <input type="text" id="prompt-bg" placeholder="例: おしゃれなレンガ調の壁、夕焼け など">
            </div>
          </div>
        </div>

        <!-- AIプロンプトメッセージ表示エリア -->
        <div id="ai-prompt-msg" class="ai-prompt-msg">
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 0.5rem;">
            <p style="margin: 0;">💡 以下の依頼文をコピーして、AIチャットでお願いしてください！</p>
            <button id="btn-copy-prompt" class="btn btn-primary" style="padding: 0.25rem 0.75rem; font-size: 0.875rem;"><i data-lucide="copy"></i> コピー</button>
          </div>
          <div id="ai-prompt-text" class="ai-prompt-text" contenteditable="true"></div>
        </div>
      </section>

      <!-- 右カラム: キャラクター情報とシートエクスポート -->
      <section class="info-section card">
        <div class="card-header">
          <h2><i data-lucide="users"></i> キャラクター管理 & 設定</h2>
        </div>

        <!-- 全体設定(世界観) -->
        <div class="form-group world-setting-group">
          <label for="world-style"><i data-lucide="globe"></i> 共通スタイル (全員に適用される世界観・画風)</label>
          <textarea id="world-style" rows="2" placeholder="例: Soft watercolor style, anime art style, 4k resolution...">Soft watercolor style. 4k high quality.</textarea>
        </div>

        <!-- キャラクター名簿（タブ） -->
        <div class="character-roster">
          <div class="roster-tabs" id="roster-tabs">
            <!-- JavaScriptで動的生成 -->
          </div>
          <button type="button" id="btn-add-character" class="btn btn-outline btn-sm"><i data-lucide="plus"></i> キャラ追加</button>
        </div>

        <form id="profile-form" class="profile-form">
          <!-- リファレンス画像 -->
          <div class="form-group ref-image-group">
            <label>リファレンス画像 (キャラ固有の参考画像)</label>
            <div class="ref-image-upload-area" id="ref-image-upload-area">
              <input type="file" id="ref-image-input" accept="image/*" style="display: none;">
              <img id="ref-image-preview" src="" style="display: none;" alt="Reference">
              <div class="ref-image-placeholder" id="ref-image-placeholder">
                <i data-lucide="image-plus"></i>
                <span>クリックして画像を設定</span>
              </div>
              <button type="button" id="btn-remove-ref" class="btn-remove-ref" style="display: none;" title="画像を削除"><i data-lucide="x"></i></button>
            </div>
            <p class="help-text" style="font-size:0.75rem; color:var(--color-text-muted); margin-top:4px;">※画像生成AIの --cref などに使用するベース画像を保存できます。</p>
          </div>

          <!-- キャラクター名 / シート名 -->
          <div class="form-group name-group">
            <label for="char-name">キャラクター名 / シートタイトル</label>
            <input type="text" id="char-name" placeholder="例: Pink Hair Girl (モデルシート)" required autocomplete="off" value="Pink Hair Character">
          </div>

          <!-- クイックタグ -->
          <div class="form-group">
            <label for="char-tags">タグ (カンマ区切りでシート下部に印刷)</label>
            <input type="text" id="char-tags" placeholder="例: Pink Hair, Soft Watercolor, Character Design Sheet" autocomplete="off" value="Pink Hair, Soft Watercolor, Multi-Pose, Character Sheet">
            <div id="tags-preview" class="tags-container"></div>
          </div>

          <!-- 詳細属性グリッド -->
          <div class="attributes-grid">
            <div class="form-group">
              <label for="attr-hair">髪色・特徴</label>
              <input type="text" id="attr-hair" placeholder="例: ライトピンク、ウェーブロング" autocomplete="off" value="Light Pink, Wavy Long">
            </div>
            <div class="form-group">
              <label for="attr-eyes">目の色・特徴</label>
              <input type="text" id="attr-eyes" placeholder="例: 笑顔、優しげな目元" autocomplete="off" value="Gentle Smile">
            </div>
          </div>

          <!-- 設定メモ -->
          <div class="form-group memo-group">
            <label for="char-memo">キャラクターデザイン設定メモ</label>
            <textarea id="char-memo" rows="4" placeholder="AI読み込み用の追加プロンプトや、デザイン上の一貫性を保つための注意書きを入力してください...">Soft watercolor style. Wavy light pink long hair. Gentle and happy expressions. Height: ~160cm.</textarea>
          </div>

          <!-- エクスポートとセーブのアクション -->
          <div class="sheet-actions">
            <button type="submit" class="btn btn-secondary btn-block">
              <i data-lucide="save"></i> 設定データを保存
            </button>
            
            <button type="button" id="btn-export" class="btn btn-primary btn-block btn-lg">
              <i data-lucide="download-cloud"></i> モデルシート画像をエクスポート
            </button>
          </div>
        </form>
      </section>
    </div>
  </div>

  <!-- 非表示のキャンバス (画像結合用) -->
  <canvas id="export-canvas" style="display: none;"></canvas>

  <!-- Lightbox Modal (拡大表示・ダウンロード用) -->
  <div id="lightbox-modal" class="lightbox-modal" style="display: none;">
    <div class="lightbox-overlay" id="lightbox-overlay"></div>
    <div class="lightbox-content">
      <button id="lightbox-close" class="lightbox-close" title="閉じる"><i data-lucide="x"></i></button>
      <div class="lightbox-image-container">
        <img id="lightbox-img" src="" alt="Enlarged view">
      </div>
      <div class="lightbox-actions" style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
        <button id="btn-lightbox-download" class="btn btn-primary btn-lg">
          <i data-lucide="download"></i> 元画像を保存
        </button>
        <button id="btn-lightbox-download-transparent" class="btn btn-secondary btn-lg" style="background: rgba(0, 240, 255, 0.1); color: var(--accent-cyan); border: 1px solid rgba(0, 240, 255, 0.3);">
          <i data-lucide="droplet"></i> 縁をフワッと透過化して保存 (リール用)
        </button>
      </div>
    </div>
  </div>

  <!-- JavaScript -->
  <script src="app.js" type="module"></script>
</body>
</html>`;

fs.writeFileSync('index.html', html, 'utf8');
console.log('Successfully generated index.html!');
