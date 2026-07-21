import { defineConfig } from 'tsup';

/**
 * Embeddable third-party bundle — IIFE only, no Next/dashboard deps.
 * Output: dist/widget.js (minified), loadable via <script src=".../widget.js">.
 */
export default defineConfig({
  entry: { widget: 'src/index.ts' },
  format: ['iife'],
  globalName: 'GenieWidget',
  minify: true,
  clean: true,
  sourcemap: true,
  target: 'es2018',
  platform: 'browser',
  outExtension() {
    return { js: '.js' };
  },
});
