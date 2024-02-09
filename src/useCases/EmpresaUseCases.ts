import { db } from '@/data/db';
import { Empresa } from '@/entities/Empresa';
import { empresa as empresaTable, pessoa } from '@/schema';
import { BusinessError } from '@/shared/errors/BusinessError';
import { nanoid } from 'nanoid';
import { PessoaUseCases } from './PessoaUseCases';
import { eq } from 'drizzle-orm';

interface CriarEmpresaArgs {
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
  codigoUsuarioCriador: string;
}

type CriarEmpresaResult = Omit<CriarEmpresaArgs, 'codigoUsuarioCriador'> & {
  codigo: string;
};

interface AlterarEmpresaArgs {
  codigoUsuarioSolicitante: string;
  codigo: string;
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
}

interface AlterarEmpresaResult {
  codigo: string;
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
}

interface ClienteEmpresa {
  codigo: string;
  nome: string;
  sobrenome: string;
}

interface CadastrarClienteArgs {
  codigoUsuarioRequisitante: string;
  nome: string;
  sobrenome: string;
  cpf: string;
}

interface CadastrarClienteResult {
  codigo: string;
  nome: string;
  sobrenome: string;
  cpf: string;
}

interface ListarClientesArgs {
  codigoEmpresa: string;
  codigoUsuarioSolicitante: string;
}

export class EmpresaUseCases {
  constructor(private pessoaUseCases: PessoaUseCases) {}

  public criarEmpresa({
    nomeFantasia,
    razaoSocial,
    cnpj,
    codigoUsuarioCriador
  }: CriarEmpresaArgs): Promise<CriarEmpresaResult> {
    const codigo = nanoid();
    const novaEmpresa = new Empresa(codigo, nomeFantasia, razaoSocial, cnpj);

    return db.transaction(async (trx): Promise<CriarEmpresaResult> => {
      const usuarioDb = await trx.query.usuario.findFirst({
        with: {
          pessoa: true
        },
        where: ({ codigo }, { eq }) => eq(codigo, codigoUsuarioCriador)
      });

      if (usuarioDb === undefined) {
        throw new BusinessError('Usuário não encontrado.');
      }

      const idEmpresaExistente = usuarioDb.pessoa.idEmpresa ?? undefined;

      if (idEmpresaExistente !== undefined) {
        throw new BusinessError('Usuário já possui empresa associada.');
      }

      const empresaExistente = await trx.query.empresa.findFirst({
        columns: {
          cnpj: true
        },
        where: ({ cnpj }, { eq }) => eq(cnpj, novaEmpresa.cnpj.value)
      });

      if (empresaExistente !== undefined) {
        throw new BusinessError('Empresa já cadastrada com CNPJ informado.');
      }

      const insertionResult = await trx
        .insert(empresaTable)
        .values({
          codigo: novaEmpresa.codigo,
          cnpj: novaEmpresa.cnpj.value,
          nomeFantasia: novaEmpresa.nomeFantasia,
          razaoSocial: novaEmpresa.razaoSocial
        })
        .returning({
          id: empresaTable.id
        });

      const empresaInserida = insertionResult[0];

      if (empresaInserida === undefined) {
        throw new Error('Erro ao tentar inserir empresa. Retorno vazio.');
      }

      await trx.update(pessoa).set({
        idEmpresa: empresaInserida.id,
        tipo: 'funcionario'
      });

      return {
        codigo: novaEmpresa.codigo,
        cnpj: novaEmpresa.cnpj.value,
        nomeFantasia: novaEmpresa.nomeFantasia,
        razaoSocial: novaEmpresa.razaoSocial
      };
    });
  }

  public alterarEmpresa({
    codigoUsuarioSolicitante,
    codigo,
    nomeFantasia,
    razaoSocial,
    cnpj
  }: AlterarEmpresaArgs): Promise<AlterarEmpresaResult> {
    return db.transaction(async (trx): Promise<AlterarEmpresaResult> => {
      const usuarioDb = await trx.query.usuario.findFirst({
        with: {
          pessoa: {
            with: {
              empresa: true
            }
          }
        },
        where: ({ codigo }, { eq }) => eq(codigo, codigoUsuarioSolicitante)
      });

      if (usuarioDb === undefined) {
        throw new BusinessError('Usuário não encontrado.');
      }

      const empresaExistente = await trx.query.empresa.findFirst({
        where: ({ codigo: codigoEmpresaExistente }, { eq }) =>
          eq(codigoEmpresaExistente, codigo)
      });

      if (empresaExistente === undefined) {
        throw new BusinessError('Empresa não encontrada.');
      }

      if (
        usuarioDb.pessoa.empresa?.codigo !== empresaExistente.codigo ||
        usuarioDb.pessoa.tipo !== 'funcionario'
      ) {
        throw new BusinessError(
          'Apenas funcionários da imobiliária podem alterar os dados da empresa.'
        );
      }

      const empresa = new Empresa(
        empresaExistente.codigo,
        empresaExistente.nomeFantasia,
        empresaExistente.razaoSocial,
        empresaExistente.cnpj
      );

      empresa.alterarDados(nomeFantasia, razaoSocial, cnpj);

      await trx
        .update(empresaTable)
        .set({
          nomeFantasia: empresa.nomeFantasia,
          razaoSocial: empresa.razaoSocial,
          cnpj: empresa.cnpj.value
        })
        .where(eq(empresaTable.codigo, empresa.codigo));

      return {
        codigo: empresa.codigo,
        nomeFantasia: empresa.nomeFantasia,
        razaoSocial: empresa.razaoSocial,
        cnpj: empresa.cnpj.value
      };
    });
  }

  public async listarClientes({
    codigoEmpresa,
    codigoUsuarioSolicitante
  }: ListarClientesArgs): Promise<ClienteEmpresa[]> {
    const empresaDb = await db.query.empresa.findFirst({
      with: {
        pessoas: {
          where: ({ tipo }, { eq }) => eq(tipo, 'cliente')
        }
      },
      where: ({ codigo }, { eq }) => eq(codigo, codigoEmpresa)
    });

    if (empresaDb === undefined) {
      throw new BusinessError('Empresa não encontrada.');
    }

    const usuarioSolicitante = await db.query.usuario.findFirst({
      with: {
        pessoa: true
      },
      where: ({ codigo }, { eq }) => eq(codigo, codigoUsuarioSolicitante)
    });

    if (usuarioSolicitante === undefined) {
      throw new BusinessError('Usuário não encontrado');
    }

    if (usuarioSolicitante.pessoa.tipo !== 'funcionario') {
      throw new BusinessError(
        'Apenas funcionários da empresa podem ver seus clientes.'
      );
    }

    return empresaDb.pessoas.map((cliente) => ({
      codigo: cliente.codigo,
      nome: cliente.nome,
      sobrenome: cliente.sobrenome
    }));
  }

  public cadastrarCliente({
    codigoUsuarioRequisitante,
    nome,
    sobrenome,
    cpf
  }: CadastrarClienteArgs): Promise<CadastrarClienteResult> {
    return db.transaction(async (trx): Promise<CadastrarClienteResult> => {
      const usuarioRequisitanteDb = await trx.query.usuario.findFirst({
        with: {
          pessoa: {
            with: {
              empresa: true
            }
          }
        },
        where: ({ codigo }, { eq }) => eq(codigo, codigoUsuarioRequisitante)
      });

      if (usuarioRequisitanteDb === undefined) {
        throw new BusinessError('Usuário não encontrado.');
      }

      const codigoEmpresa = usuarioRequisitanteDb.pessoa.empresa?.codigo;

      if (codigoEmpresa === undefined) {
        throw new BusinessError('Usuário não possui empresa vinculada.');
      }

      const tipoPessoaRequisitante = usuarioRequisitanteDb.pessoa.tipo;

      if (tipoPessoaRequisitante !== 'funcionario') {
        throw new BusinessError(
          'Apenas funcionários da empresa podem cadastrar clientes.'
        );
      }

      const criarPessoalResult = await this.pessoaUseCases.criarPessoa(
        {
          nome,
          sobrenome,
          cpf,
          codigoEmpresa,
          tipoPessoaEmpresa: 'cliente'
        },
        trx
      );

      return {
        codigo: criarPessoalResult.codigo,
        cpf: criarPessoalResult.cpf,
        nome: criarPessoalResult.nome,
        sobrenome: criarPessoalResult.sobrenome
      };
    });
  }
}
