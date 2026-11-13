// Copia las muestras de datos-sucios/ a web/public/datos/ para que las demos web puedan cargarlas.
// Uso: node scripts/sync-datos.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const origen = path.join(raiz, 'datos-sucios');
const destino = path.join(raiz, 'web', 'public', 'datos');

fs.mkdirSync(destino, { recursive: true });
fs.cpSync(origen, destino, { recursive: true });
console.log(`Sincronizado datos-sucios/ -> web/public/datos/`);
