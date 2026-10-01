// 校验工作流：YAML 结构 + 引用的脚本/文件确实存在且已纳入 git（Actions 失败最常见的原因）
const fs = require('fs');
const { execFileSync } = require('child_process');

const file = '.github/workflows/build-apk.yml';
const src = fs.readFileSync(file, 'utf8');
const lines = src.split('\n');

const bad = [];
lines.forEach((l, i) => {
  if (l.includes('\t')) bad.push(`第 ${i + 1} 行含制表符（YAML 不允许）`);
  if (/\s+$/.test(l)) bad.push(`第 ${i + 1} 行行尾有空格`);
});
for (const key of ['name:', 'on:', 'jobs:', 'runs-on:', 'steps:']) {
  if (!src.includes(key)) bad.push(`缺少必需字段 ${key}`);
}
console.log(bad.length ? 'YAML 问题:\n  ' + bad.join('\n  ') : 'YAML 结构检查通过');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
for (const s of [...src.matchAll(/npm run ([\w:-]+)/g)].map(m => m[1])) {
  console.log(`  npm run ${s}: ${pkg.scripts[s] ? '存在' : '缺失！'}`);
}

const tracked = new Set(execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n').map(s => s.trim()));
for (const f of ['package-lock.json', 'package.json', 'capacitor.config.json', 'vite.config.js', 'index.html', 'src/bridge.js', file]) {
  const exists = fs.existsSync(f);
  const inGit = tracked.has(f);
  console.log(`  ${f}: ${exists ? '存在' : '不存在！'}${inGit ? ' / 已纳入 git' : ' / 未纳入 git！'}`);
}

const cap = JSON.parse(fs.readFileSync('capacitor.config.json', 'utf8'));
console.log(`  webDir=${cap.webDir}（vite 产物目录，Actions 里由 build:web 生成）  appId=${cap.appId}`);

const deps = Object.keys(pkg.dependencies);
console.log(`  原生依赖: ${deps.filter(d => d.startsWith('@capacitor/')).join(', ')}`);
