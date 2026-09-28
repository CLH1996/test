const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const sourceTemplatePath = path.join(root, '..', 'dist', 'index.html');
const contentPath = path.join(root, 'content.json');
const outputPath = path.join(root, 'public', 'index.html');
const templatePath = fs.existsSync(sourceTemplatePath) ? sourceTemplatePath : outputPath;
const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
let html = fs.readFileSync(templatePath, 'utf8');

const configTag = /<script id="page-config" type="application\/json">([\s\S]*?)<\/script>/;
const found = html.match(configTag);
if (!found) throw Error('The landing page template has no page configuration.');
const config = JSON.parse(found[1]);

for (const section of ['copy', 'media', 'links']) {
  for (const key of Object.keys(config[section])) {
    if (!content[section] || !Object.hasOwn(content[section], key)) {
      throw Error(`Missing ${section}.${key} in content.json`);
    }
  }
}
for (const [key, asset] of Object.entries(content.media)) {
  if (!/^assets\/[-\w.]+$/.test(asset.src)) throw Error(`Image ${key} is not a local asset.`);
  if (!fs.existsSync(path.join(root, 'public', asset.src))) throw Error(`Missing ${asset.src}`);
}

for (const key of Object.keys(config.copy)) config.copy[key] = content.copy[key];
for (const key of Object.keys(config.media)) {
  const { src, alt, x, y } = content.media[key];
  Object.assign(config.media[key], { src, alt, x, y });
}
for (const key of Object.keys(config.links)) config.links[key].url = content.links[key].url;
config.staticMode = true;

const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
html = html.replace(/(<([a-z][\w-]*) data-copy="([^"]+)"[^>]*>)[\s\S]*?(<\/\2>)/g,
  (whole, open, tag, key, close) => open + escape(config.copy[key]).replaceAll('\n', '<br>') + close);
html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(config.copy.pageTitle)}</title>`);
html = html.replace(/(<meta name="description" content=")[^"]*(")/,
  (_, before, after) => before + escape(config.copy.pageDescription) + after);
html = html.replace(/(<a data-link="([^"]+)"[^>]*href=")[^"]*(")/g,
  (_, before, key, after) => before + escape(config.links[key].url) + after);

// A static Pages deployment cannot publish to the fullstack content service.
const apiCondition = "if (location.protocol !== 'file:') {";
const staticApiCondition = "if (!config.staticMode && location.protocol !== 'file:') {";
if (!html.includes(apiCondition) && !html.includes(staticApiCondition)) throw Error('The template content-loading code changed.');
html = html.replace(apiCondition, staticApiCondition);
const draftRead = "const draft = await draftAction('get');";
const staticDraftRead = "const draft = await Promise.race([draftAction('get'), new Promise(resolve => setTimeout(() => resolve(null), 1200))]);";
if (!html.includes(draftRead) && !html.includes(staticDraftRead)) throw Error('The template draft-loading code changed.');
html = html.replace(draftRead, staticDraftRead);
html = html.replace(/<button[^>]*data-publish[^>]*>[\s\S]*?<\/button>/g, '');
html = html.replace(/<p class="editor-info">[\s\S]*?<\/p>/,
  '<p class="editor-info">此为静态部署版本。修改后可保存本机草稿，或导出完整 HTML；将导出的文件作为 index.html 重新上传即可更新公开页。</p>');
html = html.replace(configTag,
  `<script id="page-config" type="application/json">${JSON.stringify(config).replace(/</g, '\\u003c')}</script>`);

// Keep the pixel in both a fresh build and a rebuild from public/index.html.
if (!html.includes('id="meta-pixel"')) {
  const pixel = `<script id="meta-pixel">
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','585106496384924');
fbq('track','PageView'); fbq('track','ViewContent');
</script>`;
  html = html.replace('</head>', pixel + '</head>');
  html = html.replace('<body>', '<body><noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=585106496384924&amp;ev=PageView&amp;noscript=1" alt=""></noscript>');
}
if (!html.includes('id="meta-lead-clicks"')) {
  const leadClicks = `<script id="meta-lead-clicks">
document.addEventListener('click', function(event) {
  if (event.defaultPrevented || new URLSearchParams(location.search).get('edit') === '1') return;
  const link = event.target.closest('a[data-link]');
  if (!link) return;
  if (typeof fbq === 'function') fbq('track', 'Lead');
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;
  event.preventDefault();
  setTimeout(() => location.assign(link.href), 300);
});
</script>`;
  html = html.replace('</body>', leadClicks + '</body>');
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, html);
console.log(`Built ${outputPath} with ${Object.keys(config.media).length} independent image slots.`);
