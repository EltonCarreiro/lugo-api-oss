import { BusinessError } from '@/shared/errors/BusinessError';
import { NON_DIGITS_REGEX } from './shared';

export class Cnpj {
  public value: string;

  constructor(value: string) {
    const digitsOnlyValue = value.replace(NON_DIGITS_REGEX, '');

    if (digitsOnlyValue.length !== 14) {
      throw new BusinessError('CNPJ Inválido.');
    }

    this.value = digitsOnlyValue;
  }
}
