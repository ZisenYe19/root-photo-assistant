// 静态自检：JS 语法 + $(id) 引用是否都能在 DOM 里找到，避免改样式改坏结构
const fs = require('fs');
const h = fs.readFileSync('index.html', 'utf8');

const script = h.match(/<script>([\s\S]*?)<\/script>/);
if (!script) { console.log('未找到内联脚本'); process.exit(1); }
try { new Function(script[1]); console.log('JS 语法 OK'); }
catch (e) { console.log('JS 语法错误: ' + e.message); process.exit(1); }

const used = [...new Set([...h.matchAll(/\$\('([a-zA-Z0-9_-]+)'\)/g)].map(m => m[1]))];
const domIds = new Set([...h.matchAll(/id="([a-zA-Z0-9_-]+)"/g)].map(m => m[1]));
const missing = used.filter(i => !domIds.has(i));
console.log(missing.length ? '缺失的 id: ' + missing.join(', ') : 'JS 里 $(id) 引用的 ' + used.length + ' 个元素全部存在');

// 检查 CSS 里引用的 class 是否还有对应元素（只报"写了样式但页面没用到"的可疑项）
const css = h.slice(h.indexOf('<style>'), h.indexOf('</style>'));
const cssClasses = [...new Set([...css.matchAll(/\.([a-z][a-z0-9-]{2,})/g)].map(m => m[1]))]
  .filter(c => !c.includes('webkit') && !c.startsWith('hidden'));
const body = h.slice(h.indexOf('<body>'));
const unused = cssClasses.filter(c => !new RegExp(`class="[^"]*\\b${c}\\b`).test(body) && !new RegExp(`'\\.?${c}\\b|"\\.?${c}\\b`).test(script[1]));
console.log(unused.length ? '样式已定义但页面未使用（可能是历史残留）: ' + unused.join(', ') : 'CSS 类全部有对应元素');
