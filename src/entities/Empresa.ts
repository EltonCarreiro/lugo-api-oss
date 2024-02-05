import { BusinessError } from '@/shared/errors/BusinessError';
import { Cnpj } from '@/valueObjects/Cnpj';

export class Empresa {
  public cnpj: Cnpj;

  constructor(
    public codigo: string,
    public nomeFantasia: string,
    public razaoSocial: string,
    cnpj: string
  ) {
    if (codigo.length === 0) {
      throw new BusinessError('Código é obrigatório.');
    }

    if (nomeFantasia.length === 0) {
      throw new BusinessError('Nome Fantasia é obrigatório.');
    }

    if (razaoSocial.length === 0) {
      throw new BusinessError('Razao Social é obrigatória.');
    }

    this.cnpj = new Cnpj(cnpj);
  }

  public alterarDados(
    novoNomeFantasia: string,
    novaRazaoSocial: string,
    novoCnpj: string
  ) {
    if (novoNomeFantasia.length === 0) {
      throw new BusinessError('Nome Fantasia é obrigatório.');
    }

    if (novaRazaoSocial.length === 0) {
      throw new BusinessError('Razao Social é obrigatória.');
    }

    this.nomeFantasia = novoNomeFantasia;
    this.razaoSocial = novaRazaoSocial;
    this.cnpj = new Cnpj(novoCnpj);
  }
}
