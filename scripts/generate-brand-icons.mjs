// Genera src/secrets/brand-icons.ts con los logos de Simple Icons (licencia CC0) que usa Kipo.
// Se incluyen solo estos servicios: la colección completa pesa 16 MB y la app no debe
// descargar logos de internet (eso revelaría qué cuentas tiene el usuario).
//
// Uso:  npm pack simple-icons && tar -xzf simple-icons-*.tgz
//       node scripts/generate-brand-icons.mjs <carpeta "package" de simple-icons>

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// slug de Simple Icons → palabras con las que se reconoce (en el nombre, servicio o sitio).
const brands = {
  netflix: ['netflix'],
  spotify: ['spotify'],
  youtube: ['youtube', 'youtu.be'],
  youtubemusic: ['youtube music'],
  google: ['google', 'gmail.com'],
  gmail: ['gmail'],
  googledrive: ['google drive'],
  facebook: ['facebook', 'fb.com'],
  instagram: ['instagram'],
  whatsapp: ['whatsapp'],
  x: ['twitter', 'x.com'],
  tiktok: ['tiktok'],
  apple: ['apple', 'apple id'],
  icloud: ['icloud'],
  applemusic: ['apple music'],
  hbo: ['hbo'],
  max: ['hbo max', 'max.com'],
  paramountplus: ['paramount'],
  crunchyroll: ['crunchyroll'],
  deezer: ['deezer'],
  tidal: ['tidal'],
  vimeo: ['vimeo'],
  twitch: ['twitch'],
  discord: ['discord'],
  telegram: ['telegram'],
  signal: ['signal.org', 'signal app'],
  pinterest: ['pinterest'],
  reddit: ['reddit'],
  snapchat: ['snapchat'],
  github: ['github'],
  gitlab: ['gitlab'],
  dropbox: ['dropbox'],
  notion: ['notion.so', 'notion'],
  zoom: ['zoom'],
  duolingo: ['duolingo'],
  claude: ['claude'],
  anthropic: ['anthropic'],
  paypal: ['paypal'],
  mercadopago: ['mercado pago', 'mercadopago'],
  nubank: ['nubank', 'nu colombia'],
  revolut: ['revolut'],
  wise: ['wise.com', 'transferwise'],
  coinbase: ['coinbase'],
  binance: ['binance'],
  visa: ['visa'],
  mastercard: ['mastercard'],
  americanexpress: ['american express', 'amex'],
  uber: ['uber'],
  airbnb: ['airbnb'],
  bookingdotcom: ['booking.com', 'booking'],
  steam: ['steam'],
  playstation: ['playstation', 'psn'],
  epicgames: ['epic games'],
  samsung: ['samsung'],
  huawei: ['huawei'],
  xiaomi: ['xiaomi'],
  motorola: ['motorola'],
  proton: ['proton'],
  protonmail: ['proton mail', 'protonmail'],
  bitwarden: ['bitwarden'],
  '1password': ['1password'],
  lastpass: ['lastpass'],
};

const root = process.argv[2];
if (!root) throw new Error('Falta la carpeta del paquete simple-icons');
const data = JSON.parse(readFileSync(join(root, 'data', 'simple-icons.json'), 'utf8'));
const list = Array.isArray(data) ? data : data.icons;
const bySlug = new Map(list.map((icon) => [icon.slug, icon]));

const entries = [];
for (const [slug, keywords] of Object.entries(brands)) {
  const meta = bySlug.get(slug);
  if (!meta) {
    console.warn(`No existe en Simple Icons: ${slug}`);
    continue;
  }
  const svg = readFileSync(join(root, 'icons', `${slug}.svg`), 'utf8');
  const path = /<path d="([^"]+)"/.exec(svg)?.[1];
  if (!path) throw new Error(`Sin path en ${slug}.svg`);
  entries.push({ slug, title: meta.title, hex: meta.hex, keywords, path });
}

const body = entries
  .map(
    (e) =>
      `  ${JSON.stringify(e.slug)}: {\n    title: ${JSON.stringify(e.title)},\n    hex: '#${e.hex}',\n    keywords: ${JSON.stringify(e.keywords)},\n    path: ${JSON.stringify(e.path)},\n  },`,
  )
  .join('\n');

writeFileSync(
  'src/secrets/brand-icons.ts',
  `// GENERADO por scripts/generate-brand-icons.mjs a partir de Simple Icons (CC0). No editar a mano.
// Logos de marcas para identificar claves. Las marcas pertenecen a sus dueños.

export type BrandIcon = { title: string; hex: string; keywords: string[]; path: string };

export const brandIcons: Record<string, BrandIcon> = {
${body}
};
`,
);
console.log(`Generados ${entries.length} logos`);
