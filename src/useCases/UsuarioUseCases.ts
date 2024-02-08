import { BusinessError } from '@/shared/errors/BusinessError';
import { Usuario } from '../entities/Usuario';
import { DbTransaction, db } from '@/data/db';
import { Senha } from '@/valueObjects/Senha';
import { usuario } from '@/schema';
import { nanoid } from 'nanoid';
import { Empresa } from '@/entities/Empresa';

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
  public async criarUsuario(
    criarUsuarioArgs: CriarUsuarioArgs,
    transaction?: DbTransaction
  ): Promise<CriarAlterarUsuarioResult> {
    if (transaction !== undefined) {
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
      // TODO: Move this to domain layer
      const senhaHash = new Senha(senha).value;
      const confirmacaoSenhaHash = new Senha(confirmacaoSenha).value;

      if (senhaHash !== confirmacaoSenhaHash) {
        throw new BusinessError('Senhas não coincidem.');
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
        throw new BusinessError('Usuário não encontrado.');
      }

      const usuarioEncontrado = new Usuario({
        codigo: usuarioDb.codigo,
        email: usuarioDb.email,
        senha: usuarioDb.senha
      });

      usuarioEncontrado.alterarSenha(senhaHash, confirmacaoSenhaHash);

      await trx.update(usuario).set({
        senha: usuarioEncontrado.senha
      });

      return {
        codigo: usuarioEncontrado.codigo,
        email: usuarioEncontrado.email
      };
    });
  }

  public async obterEmpresaAssociada(
    codigoUsuario: string
  ): Promise<EmpresaAssociada | undefined> {
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
      throw new BusinessError('Usuário não encontrado.');
    }

    const empresaDb = usuarioDb.pessoa?.empresa ?? undefined;

    if (empresaDb === undefined) {
      return undefined;
    }

    const empresaAssociada = new Empresa(
      empresaDb.codigo,
      empresaDb.nomeFantasia,
      empresaDb.razaoSocial,
      empresaDb.cnpj
    );

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
      throw new BusinessError('Pessoa não encontrada.');
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
      if (usuarioExistente.idPessoa === pessoaExistente.id) {
        throw new BusinessError('Pessoa já possui usuário cadastrado.');
      } else {
        throw new BusinessError('Email já cadastrado.');
      }
    }

    const senhaHash = new Senha(senha).value;
    const confirmacaoSenhaHash = new Senha(confirmacaoSenha).value;

    if (senhaHash !== confirmacaoSenhaHash) {
      throw new BusinessError('Senhas não coincidem.');
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

    return {
      codigo: novoUsuario.codigo,
      email: novoUsuario.email
    };
  }
}
