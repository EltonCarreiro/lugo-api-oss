import { BusinessError } from '@/shared/errors/BusinessError';
import crypto from 'crypto';

export class Senha {
  public value: string;

  constructor(value: string) {
    if (value.length === 0) {
      throw new BusinessError('Senha não pode ser vazia.');
    }

    this.value = this.createMD5Hash(value);
  }

  // This is unsafe, should use PBKDF2 or similar approach. Using MD5 Hash for demonstration purposes only
  private createMD5Hash = (
    value: string,
    digest: 'hex' | 'base64' = 'base64'
  ) => crypto.createHash('md5').update(value).digest(digest);
}
