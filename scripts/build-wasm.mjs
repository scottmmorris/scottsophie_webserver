import { execFileSync } from 'node:child_process';
import { access, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const root = process.cwd();
const eigenDir = resolve(root, 'node_modules/.cache/eigen-3.4.0');
const outputDir = resolve(root, 'public/wasm');
const eigenHeader = resolve(eigenDir, 'Eigen/Core');

try {
  execFileSync('em++', ['--version'], {
    stdio: 'ignore',
    shell: process.platform === 'win32',
  });
} catch {
  throw new Error('Emscripten is required. Install and activate the Emscripten SDK so em++ is on PATH.');
}

try {
  await access(eigenHeader);
} catch {
  await rm(eigenDir, { recursive: true, force: true });
  await mkdir(dirname(eigenDir), { recursive: true });
  execFileSync('git', [
    'clone', '--depth', '1', '--branch', '3.4.0',
    'https://gitlab.com/libeigen/eigen.git', eigenDir,
  ], { stdio: 'inherit' });
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
execFileSync('em++', [
  resolve(root, 'src/kalman_filter.cpp'),
  '-std=c++17', '-O2', '--bind',
  '-I', eigenDir,
  '-sMODULARIZE=1', '-sEXPORT_ES6=1', '-sENVIRONMENT=web',
  '-sALLOW_MEMORY_GROWTH=1',
  '-o', resolve(outputDir, 'kalman_filter.js'),
], { stdio: 'inherit', shell: process.platform === 'win32' });