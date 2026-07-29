const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const replacements = {
  'hairstyle': 'hair-random',
  'pattern-tone': 'pattern-random',
  'emotion': 'emotion-random',
  'bangs': 'bangs-random',
  'style-role': 'style-random',
  'haircolor': 'color-random',
  'tops': 'random-top',
  'bottoms': 'random-bottom',
  'apron': 'random-apron',
  'salon-service': 'service-random',
  'props': 'prop-random',
  'angle': 'angle-random',
  'scene-bg': 'scene-random',
  'lighting-format': 'light-random'
};

for (const [category, tagAttr] of Object.entries(replacements)) {
  const regex = new RegExp(`(data-category="${category}"[\\s\\S]*?)<span class="dressup-tag btn-random">🎲 ランダム</span>`);
  html = html.replace(regex, `$1<span class="dressup-tag dressup-tag-random" data-tag="${tagAttr}">🎲 ランダム (毎枚変更)</span>`);
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('Done');
