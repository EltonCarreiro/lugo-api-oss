import { Cpf } from '@/shared/valueObjects/Cpf';
import { BusinessError } from '@/shared/errors/BusinessError';

export class Pessoa {
  public cpf: Cpf;

  constructor(
    public codigo: string,
    public nome: string,
    public sobrenome: string,
    cpf: string
  ) {
    if (codigo.length === 0) {
      throw new BusinessError('Código é obrigatório.');
    }

    if (nome.length === 0) {
      throw new BusinessError('Nome é obrigatório.');
    }

    if (sobrenome.length === 0) {
      throw new BusinessError('Sobrenome é obrigatório');
    }

    this.cpf = new Cpf(cpf);
  }
}
