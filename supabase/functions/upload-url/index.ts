// Devuelve una URL PUT prefirmada (5 minutos) para subir un archivo YA CIFRADO a R2.
import { presignHandler } from '../_shared/presign.ts';

Deno.serve(presignHandler('put'));
