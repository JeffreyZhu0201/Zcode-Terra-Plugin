#!/usr/bin/env node
/**
 * 文件级插件校验：manifest 语法、组件存在性、frontmatter、
 * 市场条目一致性、密钥泄漏扫描、模板占位符核查。
 * 仓库根即插件根（单插件市场仓库结构）。
 * CI 与本地共用：node scripts/validate-plugin-files.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let fail = 0;

const ok = (m) => console.log('PASS', m);
const bad = (m) => { fail++; console.log('FAIL', m); };

// 插件组件范围（文档/CI 等仓库级文件不参与占位符与密钥扫描）
const PLUGIN_SCOPES = ['.zcode-plugin', 'skills', 'commands', '.mcp.json'];

// 1. manifest 语法
const plugPath = path.join(root, '.zcode-plugin', 'plugin.json');
const mkPath = path.join(root, 'marketplace.json');
let plug, mkt;
try { plug = JSON.parse(fs.readFileSync(plugPath, 'utf8')); ok('plugin.json 语法合法'); }
catch (e) { bad('plugin.json: ' + e.message); process.exit(1); }
try { mkt = JSON.parse(fs.readFileSync(mkPath, 'utf8')); ok('marketplace.json 语法合法'); }
catch (e) { bad('marketplace.json: ' + e.message); process.exit(1); }

// 2. name 合法
/^[a-z0-9][a-z0-9._-]{0,127}$/.test(plug.name)
  ? ok(`name 合法: ${plug.name}`)
  : bad('name 模式不合法');

// 3. 声明的组件目录存在
for (const key of ['skills', 'commands']) {
  if (!plug[key]) continue;
  const d = path.join(root, plug[key]);
  fs.existsSync(d) && fs.statSync(d).isDirectory()
    ? ok(`${key} 目录存在: ${plug[key]}`)
    : bad(`${key} 目录缺失: ${plug[key]}`);
}

// 3b. 根级 .mcp.json 存在（MCP 声明的标准位置）
fs.existsSync(path.join(root, '.mcp.json'))
  ? ok('.mcp.json 存在')
  : bad('缺少根级 .mcp.json');

// 4. 每个 skill 有 SKILL.md 且 frontmatter 含 name/description
const skillsDir = path.join(root, plug.skills || 'skills');
for (const d of fs.readdirSync(skillsDir)) {
  const f = path.join(skillsDir, d, 'SKILL.md');
  if (!fs.existsSync(f)) { bad(`缺少 SKILL.md: ${d}`); continue; }
  const fm = fs.readFileSync(f, 'utf8').match(/^---\n([\s\S]*?)\n---/);
  if (!fm) { bad(`frontmatter 缺失: ${d}`); continue; }
  (/^name: /m.test(fm[1]) && /^description: /m.test(fm[1]))
    ? ok(`skill frontmatter OK: ${d}`)
    : bad(`skill frontmatter 不完整(需 name+description): ${d}`);
}

// 5. 命令文件有 description frontmatter
const cmdDir = path.join(root, plug.commands || 'commands');
for (const f of fs.readdirSync(cmdDir)) {
  const fm = fs.readFileSync(path.join(cmdDir, f), 'utf8').match(/^---\n([\s\S]*?)\n---/);
  (!fm || !/^description: /m.test(fm[1]))
    ? bad(`命令 frontmatter 缺 description: ${f}`)
    : ok(`命令 frontmatter OK: ${f}`);
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
  fs.existsSync(path.join(root, entry.source))
    ? ok(`marketplace source 可解析: ${entry.source}`)
    : bad(`marketplace source 不存在: ${entry.source}`);
}

// 7. 密钥泄漏扫描（仅插件组件范围）
const SECRET = /(ghp_[A-Za-z0-9]{20,}|gho_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|Bearer [0-9a-f]{32,})/;
for (const scope of PLUGIN_SCOPES) {
  const p = path.join(root, scope);
  const scan = (dir) => {
    if (fs.statSync(dir).isFile()) {
      if (SECRET.test(fs.readFileSync(dir, 'utf8'))) bad(`疑似密钥泄漏: ${path.relative(root, dir)}`);
      return;
    }
    for (const name of fs.readdirSync(dir)) {
      const child = path.join(dir, name);
      fs.statSync(child).isDirectory() ? scan(child) : null;
      if (fs.statSync(child).isFile()) scan(child);
    }
  };
  scan(p);
}
ok('密钥扫描完成');

// 8. 模板占位符核查：${...} 只允许形如 ${user_config.*}，且只出现在清单/.mcp.json
for (const scope of PLUGIN_SCOPES) {
  const p = path.join(root, scope);
  const scan = (file) => {
    if (fs.statSync(file).isDirectory()) {
      for (const name of fs.readdirSync(file)) scan(path.join(file, name));
      return;
    }
    if (!file.endsWith('.json') && !file.endsWith('.md')) return;
    const rel = path.relative(root, file);
    for (const m of fs.readFileSync(file, 'utf8').matchAll(/\$\{[^}]*\}/g)) {
      if (m[0].startsWith('${user_config.')) continue;
      bad(`未预期的模板占位符 ${m[0]} 于 ${rel}`);
    }
  };
  scan(p);
}
ok('占位符核查完成');

console.log(fail === 0 ? '\n== ALL CHECKS PASSED ==' : `\n== ${fail} CHECK(S) FAILED ==`);
process.exit(fail === 0 ? 0 : 1);
