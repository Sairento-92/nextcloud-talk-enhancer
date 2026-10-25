const fs = require('fs');
const path = require('path');

const logoBuffer = fs.readFileSync(path.join(__dirname, 'img', 'huriko-logo.png'));
const logoBase64 = 'data:image/png;base64,' + logoBuffer.toString('base64');

// Create a dedicated logo module
fs.writeFileSync(path.join(__dirname, 'src', 'logo.js'), 'export const HURIKO_LOGO = ' + JSON.stringify(logoBase64) + ';\n');

// Read index.js and ensure it imports HURIKO_LOGO
let indexContent = fs.readFileSync(path.join(__dirname, 'src', 'index.js'), 'utf8');

if (!indexContent.includes('import { HURIKO_LOGO }')) {
  indexContent = 'import { HURIKO_LOGO } from "./logo.js";\n' + indexContent;
}

// Ensure injectBrandingPill uses HURIKO_LOGO
indexContent = indexContent.replace(
  /<img src="[^"]*" alt="Huriko"/,
  '<img src="' + '${HURIKO_LOGO}' + '" alt="Huriko"'
);

fs.writeFileSync(path.join(__dirname, 'src', 'index.js'), indexContent);

// Bundle with esbuild
const esbuild = require('B:/Projekty/talk-desktop/node_modules/esbuild');
esbuild.buildSync({
  entryPoints: [path.join(__dirname, 'src', 'index.js')],
  bundle: true,
  outfile: path.join(__dirname, 'js', 'talk_enhancer.js'),
  minify: true,
  format: 'iife',
  nodePaths: ['B:/Projekty/talk-desktop/node_modules']
});

console.log('Successfully bundled js/talk_enhancer.js, size:', fs.statSync(path.join(__dirname, 'js', 'talk_enhancer.js')).size);
