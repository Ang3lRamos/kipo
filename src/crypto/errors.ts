// Errores tipados para que la UI distinga "contraseña incorrecta" de "datos dañados".

export class DecryptionError extends Error {
  constructor() {
    super('No se pudo descifrar: la llave no corresponde o los datos fueron alterados');
    this.name = 'DecryptionError';
  }
}

export class WrongPasswordError extends Error {
  constructor() {
    super('Contraseña maestra incorrecta');
    this.name = 'WrongPasswordError';
  }
}

export class WrongRecoveryKeyError extends Error {
  constructor() {
    super('La clave de recuperación no corresponde a esta bóveda');
    this.name = 'WrongRecoveryKeyError';
  }
}

export class KeyWipedError extends Error {
  constructor() {
    super('La bóveda se bloqueó durante la operación; vuelve a intentarlo');
    this.name = 'KeyWipedError';
  }
}

export class InvalidRecoveryKeyError extends Error {
  constructor() {
    super('La clave de recuperación está incompleta o tiene un error de digitación');
    this.name = 'InvalidRecoveryKeyError';
  }
}
