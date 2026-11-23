// Devuelve una URL GET prefirmada (5 minutos) para bajar un archivo cifrado de R2.
import { presignHandler } from '../_shared/presign.ts';

Deno.serve(presignHandler('get'));
