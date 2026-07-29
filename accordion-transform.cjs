const fs = require('fs');

// --- 1. Modify index.html ---
let html = fs.readFileSync('index.html', 'utf8');

// The structure is:
// <div class="dressup-category">
//   <h4>Title</h4>
//   <div class="dressup-tags"...> ... </div>
// </div>
//
// We want to transform it to:
// <div class="dressup-category accordion">
//   <div class="accordion-header">
//     <h4>Title</h4>
//     <i data-lucide="chevron-down" class="accordion-icon"></i>
//   </div>
//   <div class="accordion-content">
//     <div class="dressup-tags"...> ... </div>
//   </div>
// </div>

const regex = /<div class="dressup-category">\s*<h4>(.*?)<\/h4>\s*(<div class="dressup-tags"[\s\S]*?<\/div>)\s*<\/div>/g;

html = html.replace(regex, (match, title, tagsHtml) => {
  // We'll leave the 'Count' category open by default
  const isOpenClass = title.includes('生成枚数') ? ' open' : '';
  
  return `<div class="dressup-category accordion${isOpenClass}">
  <div class="accordion-header">
    <h4>${title}</h4>
    <i data-lucide="chevron-down" class="accordion-icon"></i>
  </div>
  <div class="accordion-content">
    ${tagsHtml}
  </div>
</div>`;
});

fs.writeFileSync('index.html', html, 'utf8');


// --- 2. Modify styles.css ---
let css = fs.readFileSync('styles.css', 'utf8');

const accordionStyles = `
/* Accordion Styles */
.accordion {
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 8px;
}
.accordion:last-child {
  border-bottom: none;
}
.accordion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 12px 0;
  user-select: none;
  transition: opacity 0.2s;
}
.accordion-header:hover {
  opacity: 0.8;
}
.accordion-header h4 {
  margin: 0 !important; /* Override existing h4 margin */
}
.accordion-icon {
  width: 20px;
  height: 20px;
  transition: transform 0.3s ease;
  color: var(--color-text-secondary);
}
.accordion.open .accordion-icon {
  transform: rotate(180deg);
}
.accordion-content {
  display: none;
  padding-bottom: 16px;
  animation: fadeIn 0.3s ease;
}
.accordion.open .accordion-content {
  display: block;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

if (!css.includes('.accordion-header')) {
  css += accordionStyles;
  fs.writeFileSync('styles.css', css, 'utf8');
}

console.log('Transform complete.');
