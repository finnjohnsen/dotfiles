#!/usr/bin/env node
// ACP path-translating proxy for running OpenCode (in WSL) from a Windows ACP
// client such as JetBrains Rider.
//
// Rider is a Windows process, so it sends Windows paths (e.g. the project cwd
// "C:\\Users\\finn\\Proj") over the ACP JSON-RPC stream. OpenCode runs inside
// WSL and cannot chdir into a "C:\\..." path, so session/new fails with
// "OpenCode service failure". This proxy rewrites path-like fields:
//   client -> agent :  C:\x -> /mnt/c/x   ,  \\wsl$\Ubuntu\home\finn -> /home/finn
//   agent  -> client:  /mnt/c/x -> C:\x   ,  /home/finn -> \\wsl.localhost\Ubuntu\home\finn
//
// Point acp.json at this script (see the accompanying acp.json).

const { spawn } = require('child_process');
const readline = require('readline');

const DISTRO = process.env.WSL_DISTRO_NAME || 'Ubuntu';
const OPENCODE = process.env.OPENCODE_BIN || '/home/finn/.opencode/bin/opencode';

// Keys whose string values are treated as filesystem paths and translated.
const PATH_KEYS = new Set([
  'cwd', 'path', 'uri', 'root', 'rootUri', 'rootPath', 'dir', 'directory',
  'filePath', 'absolutePath', 'abspath', 'oldPath', 'newPath', 'file',
]);

function winToWsl(s) {
  if (typeof s !== 'string') return s;
  let str = s;
  const fileUri = str.startsWith('file://');
  if (fileUri) {
    // file:///C:/Users/... or file://wsl.localhost/Ubuntu/...
    try { str = decodeURIComponent(str.replace(/^file:\/\//, '')); } catch { str = str.replace(/^file:\/\//, ''); }
    str = str.replace(/^\/(?=[A-Za-z]:)/, ''); // strip leading slash before drive
  }
  // \\wsl$\Distro\... or \\wsl.localhost\Distro\...  -> /...
  let m = str.match(/^\\\\wsl(?:\.localhost|\$)\\[^\\]+\\?(.*)$/i);
  if (m) return '/' + m[1].replace(/\\/g, '/');
  // Drive letter: C:\... or C:/...
  m = str.match(/^([A-Za-z]):[\\/](.*)$/);
  if (m) return '/mnt/' + m[1].toLowerCase() + '/' + m[2].replace(/\\/g, '/');
  m = str.match(/^([A-Za-z]):$/);
  if (m) return '/mnt/' + m[1].toLowerCase();
  return s; // not a Windows path, leave untouched
}

function wslToWin(s) {
  if (typeof s !== 'string') return s;
  // /mnt/c/... -> C:\...
  let m = s.match(/^\/mnt\/([a-zA-Z])(\/.*)?$/);
  if (m) return m[1].toUpperCase() + ':' + (m[2] ? m[2].replace(/\//g, '\\') : '\\');
  // other absolute WSL path -> UNC \\wsl.localhost\Distro\...
  if (s.startsWith('/')) return '\\\\wsl.localhost\\' + DISTRO + s.replace(/\//g, '\\');
  return s;
}

function translate(obj, fn) {
  if (Array.isArray(obj)) { for (let i = 0; i < obj.length; i++) obj[i] = translate(obj[i], fn); return obj; }
  if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      if (typeof obj[k] === 'string' && PATH_KEYS.has(k)) obj[k] = fn(obj[k]);
      else obj[k] = translate(obj[k], fn);
    }
  }
  return obj;
}

// Returns a rewritten JSON line, or null if the line is not JSON-RPC (in which
// case it must be dropped so it can't corrupt the peer's protocol parser).
function rewriteLine(line, fn) {
  const t = line.trim();
  if (!t) return null;
  let msg;
  try { msg = JSON.parse(t); } catch {
    process.stderr.write('[acp-wsl-proxy] dropped non-JSON line: ' + t + '\n');
    return null;
  }
  translate(msg, fn);
  return JSON.stringify(msg);
}

const child = spawn(OPENCODE, ['acp', ...process.argv.slice(2)], {
  stdio: ['pipe', 'pipe', 'inherit'],
});

// Rider -> OpenCode : Windows paths become WSL paths
readline.createInterface({ input: process.stdin }).on('line', (line) => {
  const out = rewriteLine(line, winToWsl);
  if (out !== null) child.stdin.write(out + '\n');
});
process.stdin.on('end', () => child.stdin.end());

// OpenCode -> Rider : WSL paths become Windows paths
readline.createInterface({ input: child.stdout }).on('line', (line) => {
  const out = rewriteLine(line, wslToWin);
  if (out !== null) process.stdout.write(out + '\n');
});

child.on('exit', (code) => process.exit(code === null ? 1 : code));
