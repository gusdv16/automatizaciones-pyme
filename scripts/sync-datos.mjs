// Copia las muestras de datos-sucios/ a web/public/datos/ para que las demos web puedan cargarlas.
// Uso: node scripts/sync-datos.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const origen = path.join(raiz, 'datos-sucios');
const destino = path.join(raiz, 'web', 'public', 'datos');

fs.mkdirSync(destino, { recursive: true });
for (const f of fs.readdirSync(origen)) {
  fs.copyFileSync(path.join(origen, f), path.join(destino, f));
}
console.log(`Copiados ${fs.readdirSync(destino).length} archivos de ejemplo a web/public/datos/`);
