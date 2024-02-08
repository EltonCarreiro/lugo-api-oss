import { Cpf } from '@/valueObjects/Cpf';
import { BusinessError } from '@/shared/errors/BusinessError';

export type TipoPessoaEmpresa = 'funcionario' | 'cliente';

interface AlterarDadosArgs {
  nome: string;
  sobrenome: string;
  cpf: string;
}

export class Pessoa {
  public cpf: Cpf;

  constructor(
    public codigo: string,
    public nome: string,
    public sobrenome: string,
    cpf: string,
    public codigoEmpresa?: string,
    public tipoPessoaEmpresa: TipoPessoaEmpresa = 'cliente'
  ) {
    if (codigo.length === 0) {
      throw new BusinessError('Código é obrigatório.');
    }

    if (nome.length === 0) {
      throw new BusinessError('Nome é obrigatório.');
    }

    if (sobrenome.length === 0) {
      throw new BusinessError('Sobrenome é obrigatório.');
    }

    if (codigoEmpresa !== undefined && codigoEmpresa.length === 0) {
      throw new BusinessError('Código da empresa inválido.');
    }

    this.cpf = new Cpf(cpf);
  }

  public alterarDados({ nome, sobrenome, cpf }: AlterarDadosArgs) {
    if (nome.length === 0) {
      throw new BusinessError('Nome é obrigatório.');
    }

    if (sobrenome.length === 0) {
      throw new BusinessError('Sobrenome é obrigatório.');
    }

    this.nome = nome;
    this.sobrenome = sobrenome;
    this.cpf = new Cpf(cpf);
  }
}
