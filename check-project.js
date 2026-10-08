// 全项目一致性检查：README 内部链接、文件清单引用、版本号、提交材料对应关系
const fs = require('fs');
const path = require('path');

const problems = [];
const notes = [];

// ---------- 1. README 里引用的文件是否都存在 ----------
const readme = fs.readFileSync('README.md', 'utf8');
const links = [...readme.matchAll(/\]\(([^)]+)\)/g)].map(m => m[1])
  .filter(u => !/^https?:/.test(u) && !u.startsWith('#'));
console.log('README 内部链接检查：');
[...new Set(links)].forEach(u => {
  const p = decodeURIComponent(u);
  const ok = fs.existsSync(p);
  console.log(`  ${ok ? '✓' : '✗'} ${u}`);
  if (!ok) problems.push(`README 链接指向不存在的文件: ${u}`);
});

// ---------- 2. README 里的文件结构树是否覆盖了实际文件 ----------
console.log('\n项目结构树 vs 实际交付文件：');
const tracked = require('child_process').execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split('\n').map(s => s.trim()).filter(Boolean);
const treeSection = readme.slice(readme.indexOf('## 八、项目结构'), readme.indexOf('## 九、'));
const undocumented = tracked.filter(f => {
  const base = path.basename(f);
  return !treeSection.includes(base) && f !== '个人简介.md';
});
tracked.forEach(f => {
  const base = path.basename(f);
  const inTree = treeSection.includes(base);
  if (!inTree && f !== '个人简介.md') notes.push(`结构树未列出: ${f}`);
});
console.log(`  受版本控制的文件: ${tracked.length} 个`);
console.log(`  结构树未提及: ${notes.length ? notes.map(n => n.replace('结构树未列出: ', '')).join(', ') : '无'}`);

// ---------- 3. 版本号与 package.json ----------
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
console.log(`\npackage.json: name=${pkg.name} version=${pkg.version}`);
const indexHtml = fs.readFileSync('index.html', 'utf8');
const titleMatch = indexHtml.match(/<title>([^<]+)<\/title>/);
console.log(`index.html 标题: ${titleMatch ? titleMatch[1] : '未找到'}`);

// ---------- 4. 关键内容在 README 中是否都写了 ----------
console.log('\nREADME 必备小节：');
[['AI 工具使用说明与来源标注', '实验室要求如实说明 AI 使用'],
 ['已知边界', '评审关注"主动分析并解决问题"'],
 ['实现中遇到的问题与解决', '同上'],
 ['后续方向', '体现思考'],
 ['License', '开源仓库需要'],
].forEach(([k, why]) => {
  const ok = readme.includes(k);
  console.log(`  ${ok ? '✓' : '✗'} ${k}（${why}）`);
  if (!ok) problems.push(`README 缺少小节: ${k}`);
});

// ---------- 5. 个人简介是否还有未填占位 ----------
const bio = fs.readFileSync('个人简介.md', 'utf8');
const blanks = [...bio.matchAll(/【[^】]*】/g)].map(m => m[0]);
console.log(`\n个人简介：${blanks.length ? '仍有 ' + blanks.length + ' 处未填: ' + blanks.join(' ') : '已填写完整 ✓'}`);
if (blanks.length) problems.push(`个人简介仍有未填占位: ${blanks.join(' ')}`);
if (/<!--/.test(bio)) notes.push('个人简介仍含 HTML 注释（渲染时不显示，但源码可见）');

// ---------- 6. 邮件主题格式（实验室原文：学号—姓名—项目名称）----------
const subj = readme.match(/邮件主题：`([^`]+)`/);
console.log(`\n邮件主题: ${subj ? subj[1] : '未找到'}`);
if (subj) {
  const s = subj[1];
  const okFormat = /^\d+—.+—.+$/.test(s);
  console.log(`  ${okFormat ? '✓' : '✗'} 格式为 学号—姓名—项目名称`);
  if (!okFormat) problems.push('邮件主题格式可能不符: ' + s);
  if (/2026270010/.test(s)) console.log('  ✓ 已填入学号');
  else notes.push('邮件主题里还是"学号"占位字，提交前需替换为你自己的学号');
}

// ---------- 7. 邮箱地址 ----------
const mails = [...new Set([...readme.matchAll(/[\w.]+@[\w.]+\.\w+/g)].map(m => m[0]))];
console.log(`\nREADME 中出现的邮箱: ${mails.join(', ')}`);
if (!mails.includes('szu.cpoe.ilab@outlook.com')) problems.push('README 未写实验室邮箱');

console.log('\n' + '='.repeat(60));
console.log(problems.length ? '发现的问题:\n  - ' + problems.join('\n  - ') : '检查通过：未发现硬性问题');
console.log(notes.length ? '\n提示（非问题）:\n  - ' + notes.join('\n  - ') : '');
