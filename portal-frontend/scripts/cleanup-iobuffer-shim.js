/**
 * Eski patch'in oluşturduğu yanlış küçük harfli iobuffer.js dosyalarını siler.
 * Doğru dosya adı: IOBuffer.js (jspdf / fast-png zinciri bunu bekler).
 */
const fs = require('fs');
const path = require('path');

const pkgRoot = path.join(__dirname, '..', 'node_modules', 'iobuffer');
if (!fs.existsSync(pkgRoot)) {
  process.exit(0);
}

const checkAndRemoveWrongCase = (dirPath) => {
  let removedCount = 0;
  if (!fs.existsSync(dirPath)) return 0;

  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    // Sadece tam olarak 'iobuffer.js' adındaki dosyaları siliyoruz (case-sensitive)
    if (file === 'iobuffer.js') {
      fs.unlinkSync(path.join(dirPath, file));
      removedCount += 1;
    }
  }
  return removedCount;
};

let removed = 0;
removed += checkAndRemoveWrongCase(path.join(pkgRoot, 'lib'));
removed += checkAndRemoveWrongCase(path.join(pkgRoot, 'lib-esm'));

if (removed > 0) {
  console.log(`[cleanup-iobuffer-shim] ${removed} yanlış iobuffer.js dosyası silindi.`);
}

const correctEsm = path.join(pkgRoot, 'lib-esm', 'IOBuffer.js');
const correctCjs = path.join(pkgRoot, 'lib', 'IOBuffer.js');
if (!fs.existsSync(correctEsm) || !fs.existsSync(correctCjs)) {
  console.warn(
    '[cleanup-iobuffer-shim] IOBuffer.js eksik. Çalıştırın: npm install iobuffer@5.4.0 --legacy-peer-deps --no-save'
  );
}
