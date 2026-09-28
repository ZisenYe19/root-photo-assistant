import { defineConfig } from 'vite';

export default defineConfig({
  base: './',                       // 相对路径：file:// 双击与 WebView 都能用
  build: {
    rollupOptions: {
      input: { index: 'index.html', bridge: 'src/bridge.js' },
      // 固定文件名，省掉一份哈希对照表
      output: { entryFileNames: 'assets/[name].js', chunkFileNames: 'assets/[name].js' },
    },
  },
});
