// 静态自检：JS 语法 + $(id) 引用是否都能在 DOM 里找到，避免改样式改坏结构
// 用法：node diag-check.js [文件...]，默认检查 index.html 与 index-light.html
const fs = require('fs');
const files = process.argv.slice(2).length ? process.argv.slice(2) : ['index.html', 'index-light.html'];

for (const file of files) {
  if (!fs.existsSync(file)) { console.log(`${file}: 不存在，跳过`); continue; }
  const h = fs.readFileSync(file, 'utf8');
  console.log(`\n=== ${file} ===`);

  const script = h.match(/<script>([\s\S]*?)<\/script>/);
  if (!script) { console.log('未找到内联脚本'); continue; }
  try { new Function(script[1]); console.log('JS 语法 OK'); }
  catch (e) { console.log('JS 语法错误: ' + e.message); process.exitCode = 1; continue; }

  const used = [...new Set([...h.matchAll(/\$\('([a-zA-Z0-9_-]+)'\)/g)].map(m => m[1]))];
  const domIds = new Set([...h.matchAll(/id="([a-zA-Z0-9_-]+)"/g)].map(m => m[1]));
  const missing = used.filter(i => !domIds.has(i));
  console.log(missing.length ? '缺失的 id: ' + missing.join(', ') : `JS 里 $(id) 引用的 ${used.length} 个元素全部存在`);

  const css = h.slice(h.indexOf('<style>'), h.indexOf('</style>'));
  const vars = [...new Set([...css.matchAll(/--([a-z0-9-]+)\s*:/g)].map(m => m[1]))];
  console.log(`CSS 设计变量: ${vars.length} 个`);

  // 只报"写了样式但页面没用到"的可疑项（JS 里动态拼的类会被排除）
  const cssClasses = [...new Set([...css.matchAll(/\.([a-z][a-z0-9-]{2,})/g)].map(m => m[1]))]
    .filter(c => !c.includes('webkit') && c !== 'hidden');
  const body = h.slice(h.indexOf('<body>'));
  const unused = cssClasses.filter(c => !new RegExp(`class="[^"]*\\b${c}\\b`).test(body) && !new RegExp(`'\\.?${c}\\b|"\\.?${c}\\b`).test(script[1]));
  console.log(unused.length ? '样式已定义但页面未使用（可能是历史残留）: ' + unused.join(', ') : 'CSS 类全部有对应元素');
}
