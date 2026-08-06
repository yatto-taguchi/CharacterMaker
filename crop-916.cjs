/**
 * crop-916.cjs
 * 生成された画像を 9:16 のアスペクト比に中央クロップするスクリプト
 * 
 * 使い方: node crop-916.cjs <画像パス1> [画像パス2] ...
 * 引数なしで実行すると references/もも/momo_reel_*.png を対象にする
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const TARGET_RATIO = 9 / 16; // 0.5625

async function cropTo916(inputPath) {
  const metadata = await sharp(inputPath).metadata();
  const { width, height } = metadata;

  console.log(`\n処理中: ${path.basename(inputPath)} (${width}x${height})`);

  let cropWidth, cropHeight, left, top;

  // 現在の比率を確認
  const currentRatio = width / height;

  if (Math.abs(currentRatio - TARGET_RATIO) < 0.01) {
    console.log(`  → 既に9:16です。スキップ。`);
    return;
  }

  if (currentRatio > TARGET_RATIO) {
    // 横が広すぎる → 横をトリミング
    cropHeight = height;
    cropWidth = Math.round(height * TARGET_RATIO);
    left = Math.round((width - cropWidth) / 2);
    top = 0;
  } else {
    // 縦が長すぎる → 縦をトリミング
    cropWidth = width;
    cropHeight = Math.round(width / TARGET_RATIO);
    left = 0;
    top = Math.round((height - cropHeight) / 2);
  }

  console.log(`  → クロップ: ${cropWidth}x${cropHeight} (左: ${left}, 上: ${top})`);

  // 出力ファイル名（_cropped を追加）
  const ext = path.extname(inputPath);
  const baseName = path.basename(inputPath, ext);
  const dir = path.dirname(inputPath);
  const outputPath = path.join(dir, `${baseName}_cropped${ext}`);

  await sharp(inputPath)
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .toFile(outputPath);

  console.log(`  ✅ 保存: ${path.basename(outputPath)} (${cropWidth}x${cropHeight})`);
  return outputPath;
}

async function main() {
  let files = process.argv.slice(2);

  // 引数なしの場合、デフォルトで references/もも/momo_reel_*.png を対象にする
  if (files.length === 0) {
    const momoDir = path.join(__dirname, 'references', 'もも');
    if (fs.existsSync(momoDir)) {
      const allFiles = fs.readdirSync(momoDir);
      files = allFiles
        .filter(f => f.startsWith('momo_reel_') && f.endsWith('.png') && !f.includes('_cropped'))
        .map(f => path.join(momoDir, f));
    }
  }

  if (files.length === 0) {
    console.log('対象ファイルが見つかりません。');
    console.log('使い方: node crop-916.cjs <画像パス1> [画像パス2] ...');
    return;
  }

  console.log(`=== 9:16 クロップ処理 ===`);
  console.log(`対象: ${files.length} ファイル`);

  for (const file of files) {
    try {
      await cropTo916(file);
    } catch (err) {
      console.error(`  ❌ エラー: ${err.message}`);
    }
  }

  console.log(`\n完了！`);
}

main();
