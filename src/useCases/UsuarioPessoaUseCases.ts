import { PessoaUseCases } from '@/useCases/PessoaUseCases';
import { UsuarioUseCases } from './UsuarioUseCases';
import { db } from '@/data/db';
import { Logger } from '@/logging';

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

  constructor(private log: Logger) {
    this.pessoaUseCases = new PessoaUseCases(log);
    this.usuarioUseCases = new UsuarioUseCases(log);
  }

  public async criarPessoaEUsuario({
    nome,
    sobrenome,
    cpf,
    email,
    senha,
    confirmacaoSenha
  }: CriarPessoaEUsuarioArgs): Promise<CriarPessoaEUsuarioResult> {
    this.log.info('Criando pessoa e usuário.');
    return await db.transaction(
      async (trx): Promise<CriarPessoaEUsuarioResult> => {
        const criarPessoaResult = await this.pessoaUseCases.criarPessoa(
          {
            nome,
            sobrenome,
            cpf,
            codigoEmpresa: undefined,
            tipoPessoaEmpresa: 'cliente'
          },
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

        this.log.info('Pessoa e usuário criados com sucesso.');
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
