const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('--- Rozpoczynanie budowania Nextcloud Talk Enhancer ---');

const logoBuffer = fs.readFileSync(path.join(__dirname, 'img', 'huriko-logo.png'));
const logoBase64 = 'data:image/png;base64,' + logoBuffer.toString('base64');

// Create a dedicated logo module
fs.writeFileSync(path.join(__dirname, 'src', 'logo.js'), 'export const HURIKO_LOGO = ' + JSON.stringify(logoBase64) + ';\n');

// Resolve esbuild
let esbuild;
try {
  esbuild = require('esbuild');
} catch (e) {
  try {
    esbuild = require('B:/Projekty/talk-desktop/node_modules/esbuild');
  } catch (e2) {
    esbuild = require(path.join(process.cwd(), 'node_modules', 'esbuild'));
  }
}

esbuild.buildSync({
  entryPoints: [path.join(__dirname, 'src', 'index.js')],
  bundle: true,
  outfile: path.join(__dirname, 'js', 'talk_enhancer.js'),
  minify: true,
  format: 'iife',
  nodePaths: ['B:/Projekty/talk-desktop/node_modules', path.join(process.cwd(), 'node_modules')]
});

const jsStat = fs.statSync(path.join(__dirname, 'js', 'talk_enhancer.js'));
console.log('✓ Zbudowano js/talk_enhancer.js, rozmiar:', jsStat.size, 'bajtów');

// 2. Prepare staging directory
const stagingBase = path.join(__dirname, 'dist');
const appDir = path.join(stagingBase, 'talk_enhancer');

if (fs.existsSync(stagingBase)) {
  fs.rmSync(stagingBase, { recursive: true, force: true });
}
fs.mkdirSync(appDir, { recursive: true });

// Directories to copy
const dirsToCopy = ['appinfo', 'css', 'img', 'js', 'lib', 'templates'];
dirsToCopy.forEach(dir => {
  const src = path.join(__dirname, dir);
  const dest = path.join(appDir, dir);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
  }
});

console.log('✓ Przygotowano strukturę w folderze dist/talk_enhancer');

// 3. Create .tar.gz and .zip archives
const tarOut = path.join(__dirname, 'talk_enhancer.tar.gz');
const zipOut = path.join(__dirname, 'talk_enhancer.zip');

if (fs.existsSync(tarOut)) fs.unlinkSync(tarOut);
if (fs.existsSync(zipOut)) fs.unlinkSync(zipOut);

// Create tar.gz using native bsdtar
try {
  execSync(`tar -czvf "${tarOut}" -C "${stagingBase}" talk_enhancer`, { stdio: 'inherit' });
  console.log('✓ Utworzono archiwum:', tarOut, '(', fs.statSync(tarOut).size, 'bajtów)');
} catch (e) {
  console.error('Błąd tworzenia tar.gz:', e.message);
}

// Create zip using PowerShell Compress-Archive
try {
  execSync(`powershell -Command "Compress-Archive -Path '${appDir}' -DestinationPath '${zipOut}' -Force"`, { stdio: 'inherit' });
  console.log('✓ Utworzono archiwum:', zipOut, '(', fs.statSync(zipOut).size, 'bajtów)');
} catch (e) {
  console.error('Błąd tworzenia zip:', e.message);
}

console.log('--- Budowanie zakończone sukcesem! ---');
