import { DatabaseSync } from 'node:sqlite';

import { searchTextFor } from '@/secrets/secret-rules';
import type { SecretData } from '@/types/secret';

import { migration005 } from './migrations/005-secrets';

// Prueba las consultas de secrets-repo.ts y secrets-sync.ts contra SQLite real (node:sqlite).
// Lo más importante: la búsqueda nunca encuentra una clave por su contraseña o sus notas.

const BS = '\\';
const db = new DatabaseSync(':memory:');
db.exec(migration005);

function add(id: string, title: string, data: SecretData) {
  db.prepare(
    'INSERT INTO secrets (id, kind, title, data, search_text, created_at, updated_at) VALUES (?,?,?,?,?,?,?)',
  ).run(id, data.kind, title, JSON.stringify(data), searchTextFor({ title, data }), 'x', 'x');
}

// Misma construcción que listSecrets.
function list(query: string): string[] {
  const words = query
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const conditions = words.map(() => `search_text LIKE ? ESCAPE '${BS}'`).join(' AND ');
  const params = words.map((w) => `%${w.replace(/[\\%_]/g, (c) => BS + c)}%`);
  return db
    .prepare(
      `SELECT id FROM secrets WHERE deleted_at IS NULL ${conditions ? `AND ${conditions}` : ''}
       ORDER BY title COLLATE NOCASE`,
    )
    .all(...params)
    .map((row) => String(row.id));
}

beforeAll(() => {
  add('s1', 'Router de la casa', {
    kind: 'login',
    username: 'admin',
    password: 'Clave-Secreta-99',
    url: 'http://192.168.1.1',
    totp: '',
    notes: 'wifi: OtraClave',
  });
  add('s2', 'Alarma', { kind: 'note', body: 'PIN 4471' });
  add('s3', 'Visa', {
    kind: 'card',
    bank: 'Bancolombia',
    last4: '4242',
    holder: 'Angel',
    notes: '',
  });
});

describe('búsqueda de claves (SQLite real)', () => {
  it('encuentra por nombre, usuario, sitio y banco', () => {
    expect(list('router')).toEqual(['s1']);
    expect(list('admin 192.168')).toEqual(['s1']);
    expect(list('bancolombia')).toEqual(['s3']);
  });

  it('NUNCA encuentra por la contraseña, las notas ni el contenido de una nota', () => {
    expect(list('Secreta')).toEqual([]);
    expect(list('wifi')).toEqual([]);
    expect(list('4471')).toEqual([]);
  });

  it('% y _ no actúan como comodines', () => {
    expect(list('%')).toEqual([]);
    expect(list('_')).toEqual([]);
  });

  it('al borrar, sale de la lista y se vacían sus datos', () => {
    db.prepare(
      `UPDATE secrets SET deleted_at = ?, updated_at = ?, data = '{}', search_text = '' WHERE id = ?`,
    ).run('y', 'y', 's2');
    expect(list('alarma')).toEqual([]);
    expect(db.prepare("SELECT data FROM secrets WHERE id = 's2'").get()).toEqual({ data: '{}' });
  });

  it('el upsert desde la nube actualiza y deja la clave sincronizada', () => {
    db.prepare(
      `INSERT INTO secrets (id, kind, title, data, search_text, created_at, updated_at, synced_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7)
       ON CONFLICT(id) DO UPDATE SET kind = ?2, title = ?3, data = ?4, search_text = ?5,
         updated_at = ?7, deleted_at = NULL, synced_at = ?7`,
    ).run('s1', 'login', 'Router nuevo', '{}', 'router nuevo', 'x', 'z');
    expect(
      db
        .prepare("SELECT title, synced_at = updated_at AS synced FROM secrets WHERE id = 's1'")
        .get(),
    ).toEqual({ title: 'Router nuevo', synced: 1 });
  });
});
