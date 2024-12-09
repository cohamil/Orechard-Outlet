import { build } from 'esbuild';
import babel from 'esbuild-plugin-babel';

build({
  entryPoints: ['src/main.js'],
  bundle: true,
  outfile: 'docs/bundle.min.js',
  plugins: [babel({
    filter: /\.js$/,
    namespace: '',
    config: {
      presets: ['@babel/preset-env'],
      plugins: ['@babel/plugin-syntax-dynamic-import']
    }
  })],
  target: ['chrome58', 'edge16', 'firefox57', 'safari11'],
  external: ['i18next', 'i18next-browser-languagedetector', 'yaml'], // Exclude node modules
  format: 'esm', // Ensure the output format is ES module
}).catch(() => process.exit(1));