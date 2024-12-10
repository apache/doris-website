import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'node_modules/@easyops-cn/docusaurus-search-local/dist/client/client/theme/worker.js',
  output: {
    file: 'worker.js',
    format: 'iife',
    name: 'MyBundle',
  },
  plugins: [
    resolve({
      browser: true,      // 针对浏览器解析依赖
      preferBuiltins: false, // 不优先使用 Node.js 内置模块
    }),
    commonjs({
      transformMixedEsModules: true, // 支持混合 ESM 和 CommonJS
    }),
  ],
};
