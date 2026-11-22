import type { SQLiteDatabase } from 'expo-sqlite';

import { createDocument } from '@/db/documents-repo';
import type { DocumentInput } from '@/types/document';

import { addDays, todayIso } from './dates';

// Documentos de prueba para validar la fase 1. Solo se ofrecen en modo desarrollo.
function samples(today: string): DocumentInput[] {
  const doc = (d: Partial<DocumentInput> & Pick<DocumentInput, 'title' | 'category'>) => ({
    tags: [],
    physicalLocation: null,
    issuedAt: null,
    expiresAt: null,
    notes: null,
    ...d,
  });
  return [
    doc({
      title: 'Cédula de ciudadanía',
      category: 'identidad',
      tags: ['personal', 'original'],
      physicalLocation: 'Billetera',
    }),
    doc({
      title: 'Pasaporte',
      category: 'identidad',
      tags: ['viaje'],
      physicalLocation: 'Carpeta azul, cajón del escritorio',
      expiresAt: addDays(today, 45),
    }),
    doc({
      title: 'Licencia de conducción',
      category: 'vehiculo',
      tags: ['transito'],
      physicalLocation: 'Billetera',
      expiresAt: addDays(today, 400),
    }),
    doc({
      title: 'SOAT',
      category: 'vehiculo',
      tags: ['seguro', 'carro'],
      physicalLocation: 'Guantera del carro',
      expiresAt: addDays(today, 12),
    }),
    doc({
      title: 'Revisión técnico-mecánica',
      category: 'vehiculo',
      tags: ['carro'],
      physicalLocation: 'Guantera del carro',
      expiresAt: addDays(today, -3),
    }),
    doc({
      title: 'Carné de la EPS Sura',
      category: 'salud',
      tags: ['eps'],
      physicalLocation: 'Billetera',
      notes: 'Afiliación como cotizante',
    }),
    doc({
      title: 'Certificado de vacunas',
      category: 'salud',
      tags: ['vacunas'],
      physicalLocation: 'Carpeta roja',
    }),
    doc({
      title: 'Extracto tarjeta de crédito',
      category: 'finanzas',
      tags: ['banco'],
      physicalLocation: 'Correo electrónico',
    }),
    doc({
      title: 'Garantía del televisor',
      category: 'garantias',
      tags: ['electrodomestico', 'factura'],
      physicalLocation: 'Caja de garantías, clóset',
      expiresAt: addDays(today, 200),
    }),
    doc({
      title: 'Contrato de arrendamiento',
      category: 'hogar',
      tags: ['arriendo', 'contrato'],
      physicalLocation: 'Carpeta azul, cajón del escritorio',
      expiresAt: addDays(today, 58),
    }),
  ];
}

export async function insertSampleDocuments(db: SQLiteDatabase): Promise<void> {
  for (const input of samples(todayIso())) {
    await createDocument(db, input);
  }
}
