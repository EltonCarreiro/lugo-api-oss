import { Usuario } from '../entities/Usuario';
import { DbTransaction, db } from '@/data/db';
import { Senha } from '@/valueObjects/Senha';
import { usuario } from '@/schema';
import { nanoid } from 'nanoid';
import { Empresa } from '@/entities/Empresa';
import { eq } from 'drizzle-orm';
import { Logger } from '@/logging';
import { throwBusinessErrorAndLog } from '@/shared/errors/throwAndLog';

interface CriarUsuarioArgs {
  codigoPessoa: string;
  email: string;
  senha: string;
  confirmacaoSenha: string;
}

interface CriarAlterarUsuarioArgs {
  email: string;
  senha: string;
  confirmacaoSenha: string;
}

interface CriarAlterarUsuarioResult {
  codigo: string;
  email: string;
}

interface EmpresaAssociada {
  codigo: string;
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
}

export class UsuarioUseCases {
  constructor(private log: Logger) {}

  public async criarUsuario(
    criarUsuarioArgs: CriarUsuarioArgs,
    transaction?: DbTransaction
  ): Promise<CriarAlterarUsuarioResult> {
    const hasOngoingTransaction = transaction !== undefined;
    this.log.info(
      `Criando usuário ${hasOngoingTransaction ? '(com transaction existente)' : ''}`
    );

    if (hasOngoingTransaction) {
      return this.internalCriarUsuario(criarUsuarioArgs, transaction);
    }

    return db.transaction((trx) =>
      this.internalCriarUsuario(criarUsuarioArgs, trx)
    );
  }

  public alterarSenha({
    email,
    senha,
    confirmacaoSenha
  }: CriarAlterarUsuarioArgs): Promise<CriarAlterarUsuarioResult> {
    return db.transaction(async (trx): Promise<CriarAlterarUsuarioResult> => {
      this.log.info('Alterando senha de usuário.');
      // TODO: Move this to domain layer
      const senhaHash = new Senha(senha).value;
      const confirmacaoSenhaHash = new Senha(confirmacaoSenha).value;

      if (senhaHash !== confirmacaoSenhaHash) {
        return throwBusinessErrorAndLog(this.log, 'Senhas não coincidem.');
      }

      const usuarioDb = await trx.query.usuario.findFirst({
        columns: {
          codigo: true,
          email: true,
          senha: true
        },
        where: ({ email: emailUsuarioExistente }, { eq }) =>
          eq(emailUsuarioExistente, email)
      });

      if (usuarioDb === undefined) {
        return throwBusinessErrorAndLog(this.log, 'Usuário não encontrado.');
      }

      const usuarioEncontrado = new Usuario({
        codigo: usuarioDb.codigo,
        email: usuarioDb.email,
        senha: usuarioDb.senha
      });

      usuarioEncontrado.alterarSenha(senhaHash, confirmacaoSenhaHash);

      await trx
        .update(usuario)
        .set({
          senha: usuarioEncontrado.senha
        })
        .where(eq(usuario.codigo, usuarioEncontrado.codigo));

      this.log.info('Senha alterada com sucesso.');
      return {
        codigo: usuarioEncontrado.codigo,
        email: usuarioEncontrado.email
      };
    });
  }

  public async obterEmpresaAssociada(
    codigoUsuario: string
  ): Promise<EmpresaAssociada | undefined> {
    this.log.info('Obtendo empresa associada.');
    const usuarioDb = await db.query.usuario.findFirst({
      with: {
        pessoa: {
          with: {
            empresa: true
          }
        }
      },
      where: ({ codigo }, { eq }) => eq(codigo, codigoUsuario)
    });

    if (usuarioDb === undefined) {
      return throwBusinessErrorAndLog(this.log, 'Usuário não encontrado.');
    }

    const empresaDb = usuarioDb.pessoa?.empresa ?? undefined;

    if (empresaDb === undefined) {
      this.log.info('Empresa não encontrada.');
      return undefined;
    }

    const empresaAssociada = new Empresa(
      empresaDb.codigo,
      empresaDb.nomeFantasia,
      empresaDb.razaoSocial,
      empresaDb.cnpj
    );

    this.log.info('Retornando empresa associada.');
    return {
      codigo: empresaAssociada.codigo,
      nomeFantasia: empresaAssociada.nomeFantasia,
      razaoSocial: empresaAssociada.razaoSocial,
      cnpj: empresaAssociada.cnpj.value
    };
  }

  private async internalCriarUsuario(
    { codigoPessoa, email, senha, confirmacaoSenha }: CriarUsuarioArgs,
    trx: DbTransaction
  ): Promise<CriarAlterarUsuarioResult> {
    const pessoaExistente = await trx.query.pessoa.findFirst({
      columns: {
        id: true,
        codigo: true
      },
      where: ({ codigo: codigoPessoaExistente }, { eq }) =>
        eq(codigoPessoaExistente, codigoPessoa)
    });

    if (pessoaExistente === undefined) {
      return throwBusinessErrorAndLog(this.log, 'Pessoa não encontrada.');
    }

    const usuarioExistente = await trx.query.usuario.findFirst({
      columns: {
        idPessoa: true,
        email: true
      },
      where: ({ email: emailUsuarioExistente, idPessoa }, { eq, or }) =>
        or(eq(emailUsuarioExistente, email), eq(idPessoa, pessoaExistente.id))
    });

    if (usuarioExistente !== undefined) {
      return throwBusinessErrorAndLog(
        this.log,
        usuarioExistente.idPessoa === pessoaExistente.id
          ? 'Pessoa já possui usuário cadastrado.'
          : 'Email já cadastrado.'
      );
    }

    const senhaHash = new Senha(senha).value;
    const confirmacaoSenhaHash = new Senha(confirmacaoSenha).value;

    if (senhaHash !== confirmacaoSenhaHash) {
      return throwBusinessErrorAndLog(this.log, 'Senhas não coincidem.');
    }

    const novoUsuario = new Usuario({
      codigo: nanoid(),
      email,
      senha: senhaHash
    });

    await trx.insert(usuario).values({
      codigo: novoUsuario.codigo,
      email: novoUsuario.email,
      senha: novoUsuario.senha,
      idPessoa: pessoaExistente.id
    });

    this.log.info('Usuário criado com sucesso.');
    return {
      codigo: novoUsuario.codigo,
      email: novoUsuario.email
    };
  }
}
