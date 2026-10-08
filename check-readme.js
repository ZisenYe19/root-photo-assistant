// README 格式与美观性检查：标题层级、空行规范、代码块围栏配对、表格列数一致性
const fs = require('fs');
const md = fs.readFileSync('README.md', 'utf8').split('\n');

let h1 = 0, h2 = 0, h3 = 0;
const warns = [];
let prevBlank = true;
let fence = 0, fenceLang = [];

md.forEach((l, i) => {
  const n = i + 1;
  if (/^```/.test(l)) {
    fence++;
    if (fence % 2 === 1) fenceLang.push((l.slice(3).trim() || '(无语言标注)') + ' @' + n);
    return;
  }
  if (fence % 2 === 1) return;   // 代码块内部不检查
  if (/^# /.test(l)) h1++;
  if (/^## /.test(l)) { h2++; if (!prevBlank) warns.push(`第 ${n} 行：## 标题前缺空行`); }
  if (/^### /.test(l)) { h3++; if (!prevBlank) warns.push(`第 ${n} 行：### 标题前缺空行`); }
  if (/^#{4,} /.test(l)) warns.push(`第 ${n} 行：标题层级过深（建议不超过 ###）`);
  prevBlank = l.trim() === '';
});

// 表格列数一致性：连续的 | 行应同为一张表，列数须相同
let table = [], tableStart = 0;
const flushTable = () => {
  if (table.length >= 2) {
    const counts = table.map(r => r.split('|').length);
    const uniq = [...new Set(counts)];
    if (uniq.length > 1) warns.push(`第 ${tableStart} 行起的表格列数不一致: ${uniq.join(' / ')}`);
    // 分隔行应为 |---|---|
    if (!/^\s*\|[\s:|-]+\|\s*$/.test(table[1])) warns.push(`第 ${tableStart + 1} 行：表格缺少分隔行`);
  }
  table = [];
};
md.forEach((l, i) => {
  if (/^\|/.test(l)) { if (!table.length) tableStart = i + 1; table.push(l); }
  else flushTable();
});
flushTable();

console.log(`标题层级: H1=${h1}  H2=${h2}  H3=${h3}`);
console.log(`代码块围栏: ${fence} 个${fence % 2 ? ' ✗ 未配对！' : ' ✓ 配对'}`);
console.log(`代码块语言标注: ${fenceLang.join(', ') || '无'}`);
console.log(`总行数: ${md.length}`);
const longLines = md.map((l, i) => [i + 1, l.length]).filter(([, len]) => len > 200);
console.log(`超长行(>200字符): ${longLines.length ? longLines.map(([n, len]) => `第${n}行(${len})`).join(', ') : '无'}`);
console.log(warns.length ? '\n格式提示:\n  - ' + warns.join('\n  - ') : '\n格式检查通过');
