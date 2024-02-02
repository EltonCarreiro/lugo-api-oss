import { BusinessError } from '../shared/errors/BusinessError';

const NON_DIGITS_REGEX = /\D/g;

export class Cpf {
  public value: string;

  constructor(value: string) {
    const digitsOnlyValue = value.replace(NON_DIGITS_REGEX, '');

    if (digitsOnlyValue.length !== 11) {
      throw new BusinessError('CPF Inválido');
    }

    this.value = value;
  }
}
