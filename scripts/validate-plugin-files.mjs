#!/usr/bin/env node
/**
 * 文件级插件校验：manifest 语法、组件存在性、frontmatter、
 * 市场条目一致性、密钥泄漏扫描、模板占位符核查。
 * CI 与本地共用：node scripts/validate-plugin-files.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pluginDir = path.join(root, 'plugins', 'terra-wiki');
let fail = 0;

const ok = (m) => console.log('PASS', m);
const bad = (m) => { fail++; console.log('FAIL', m); };

// 1. manifest 语法
const plugPath = path.join(pluginDir, '.zcode-plugin', 'plugin.json');
const mkPath = path.join(root, 'plugins', 'marketplace.json');
let plug, mkt;
try { plug = JSON.parse(fs.readFileSync(plugPath, 'utf8')); ok('plugin.json 语法合法'); }
catch (e) { bad('plugin.json: ' + e.message); process.exit(1); }
try { mkt = JSON.parse(fs.readFileSync(mkPath, 'utf8')); ok('marketplace.json 语法合法'); }
catch (e) { bad('marketplace.json: ' + e.message); process.exit(1); }

// 2. name 合法且与目录名一致
const nameOk = /^[a-z0-9][a-z0-9._-]{0,127}$/.test(plug.name);
nameOk && path.basename(pluginDir) === plug.name
  ? ok(`name 合法且目录名一致: ${plug.name}`)
  : bad('name 模式不合法或目录名不一致');

// 3. 声明的组件目录存在
for (const key of ['skills', 'commands']) {
  if (!plug[key]) continue;
  const d = path.join(pluginDir, plug[key]);
  fs.existsSync(d) && fs.statSync(d).isDirectory()
    ? ok(`${key} 目录存在: ${plug[key]}`)
    : bad(`${key} 目录缺失: ${plug[key]}`);
}

// 4. 每个 skill 有 SKILL.md 且 frontmatter 含 name/description
const skillsDir = path.join(pluginDir, plug.skills || 'skills');
if (fs.existsSync(skillsDir)) {
  for (const d of fs.readdirSync(skillsDir)) {
    const f = path.join(skillsDir, d, 'SKILL.md');
    if (!fs.existsSync(f)) { bad(`缺少 SKILL.md: ${d}`); continue; }
    const fm = fs.readFileSync(f, 'utf8').match(/^---\n([\s\S]*?)\n---/);
    if (!fm) { bad(`frontmatter 缺失: ${d}`); continue; }
    (/^name: /m.test(fm[1]) && /^description: /m.test(fm[1]))
      ? ok(`skill frontmatter OK: ${d}`)
      : bad(`skill frontmatter 不完整(需 name+description): ${d}`);
  }
}

// 5. 命令文件有 description frontmatter
const cmdDir = path.join(pluginDir, plug.commands || 'commands');
if (fs.existsSync(cmdDir)) {
  for (const f of fs.readdirSync(cmdDir)) {
    const fm = fs.readFileSync(path.join(cmdDir, f), 'utf8').match(/^---\n([\s\S]*?)\n---/);
    (!fm || !/^description: /m.test(fm[1]))
      ? bad(`命令 frontmatter 缺 description: ${f}`)
      : ok(`命令 frontmatter OK: ${f}`);
  }
}

// 6. marketplace 条目与 manifest 的 name/version/description 一致，source 可解析
const entry = (mkt.plugins || []).find((p) => p.name === plug.name);
if (!entry) bad('marketplace 缺少插件条目');
else {
  entry.version === plug.version
    ? ok(`marketplace 版本同步: ${plug.version}`)
    : bad(`marketplace 版本不同步: 清单 ${plug.version} vs 市场 ${entry.version}`);
  entry.description === plug.description
    ? ok('marketplace description 同步')
    : bad('marketplace description 不同步');
  fs.existsSync(path.join(root, 'plugins', entry.source))
    ? ok(`marketplace source 可解析: ${entry.source}`)
    : bad(`marketplace source 不存在: ${entry.source}`);
}

// 7. 密钥泄漏扫描（整个插件目录）
const SECRET = /(ghp_[A-Za-z0-9]{20,}|gho_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|Bearer [0-9a-f]{32,})/;
(function scan(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) { scan(p); continue; }
    if (SECRET.test(fs.readFileSync(p, 'utf8'))) bad(`疑似密钥泄漏: ${path.relative(root, p)}`);
  }
})(pluginDir);
ok('密钥扫描完成');

// 8. 模板占位符核查：${...} 只允许出现在 plugin.json 且形如 ${user_config.*}
(function scanPlaceholders(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) { scanPlaceholders(p); continue; }
    if (!p.endsWith('.json') && !p.endsWith('.md')) continue;
    const rel = path.relative(root, p);
    for (const m of fs.readFileSync(p, 'utf8').matchAll(/\$\{[^}]*\}/g)) {
      if (p === plugPath && m[0].startsWith('${user_config.')) continue;
      bad(`未预期的模板占位符 ${m[0]} 于 ${rel}`);
    }
  }
})(pluginDir);
ok('占位符核查完成');

console.log(fail === 0 ? '\n== ALL CHECKS PASSED ==' : `\n== ${fail} CHECK(S) FAILED ==`);
process.exit(fail === 0 ? 0 : 1);
