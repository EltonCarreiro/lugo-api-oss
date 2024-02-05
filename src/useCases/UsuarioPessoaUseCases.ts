import { PessoaUseCases } from '@/useCases/PessoaUseCases';
import { UsuarioUseCases } from './UsuarioUseCases';
import { db } from '@/data/db';

interface CriarPessoaEUsuarioArgs {
  nome: string;
  sobrenome: string;
  cpf: string;
  email: string;
  senha: string;
  confirmacaoSenha: string;
}

interface CriarPessoaEUsuarioResult {
  codigoPessoa: string;
  codigoUsuario: string;
  nome: string;
  sobrenome: string;
  cpf: string;
  email: string;
}

export class UsuarioPessoaUseCases {
  private pessoaUseCases: PessoaUseCases;
  private usuarioUseCases: UsuarioUseCases;

  constructor() {
    this.pessoaUseCases = new PessoaUseCases();
    this.usuarioUseCases = new UsuarioUseCases();
  }

  public async criarPessoaEUsuario({
    nome,
    sobrenome,
    cpf,
    email,
    senha,
    confirmacaoSenha
  }: CriarPessoaEUsuarioArgs): Promise<CriarPessoaEUsuarioResult> {
    return await db.transaction(
      async (trx): Promise<CriarPessoaEUsuarioResult> => {
        const criarPessoaResult = await this.pessoaUseCases.criarPessoa(
          { nome, sobrenome, cpf, codigoEmpresa: undefined },
          trx
        );
        const criarUsuarioResult = await this.usuarioUseCases.criarUsuario(
          {
            codigoPessoa: criarPessoaResult.codigo,
            senha,
            confirmacaoSenha,
            email
          },
          trx
        );

        return {
          codigoPessoa: criarPessoaResult.codigo,
          codigoUsuario: criarUsuarioResult.codigo,
          cpf: criarPessoaResult.cpf,
          nome: criarPessoaResult.nome,
          sobrenome: criarPessoaResult.sobrenome,
          email: criarUsuarioResult.email
        };
      }
    );
  }
}
