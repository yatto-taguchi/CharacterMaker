const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const lines = html.split('\n');

const correctLines = `          <!-- リファレンス画像 -->
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
    </main>
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
      </div>`;

// Replace lines 523 (index 522) to 598 (index 597)
lines.splice(522, 598 - 522 + 1, ...correctLines.split('\n'));

fs.writeFileSync('index.html', lines.join('\n'), 'utf8');
console.log('Fixed index.html');
