import { db } from '@/data/db';
import { Empresa } from '@/entities/Empresa';
import { empresa as empresaTable, pessoa as pessoaTable } from '@/schema';
import { nanoid } from 'nanoid';
import { PessoaUseCases } from './PessoaUseCases';
import { and, eq } from 'drizzle-orm';
import { Logger } from '@/logging';
import { throwBusinessErrorAndLog } from '@/shared/errors/throwAndLog';
import { Pessoa } from '@/entities/Pessoa';

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

interface AlterarClienteArgs {
  codigoUsuarioRequisitante: string;
  codigo: string;
  nome: string;
  sobrenome: string;
  cpf: string;
}

interface AlterarClienteResult {
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
  constructor(
    private pessoaUseCases: PessoaUseCases,
    private log: Logger
  ) {}

  public criarEmpresa({
    nomeFantasia,
    razaoSocial,
    cnpj,
    codigoUsuarioCriador
  }: CriarEmpresaArgs): Promise<CriarEmpresaResult> {
    this.log.info('Criando empresa.');
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
        return throwBusinessErrorAndLog(this.log, 'Usuário não encontrado.');
      }

      const idEmpresaExistente = usuarioDb.pessoa.idEmpresa ?? undefined;

      if (idEmpresaExistente !== undefined) {
        return throwBusinessErrorAndLog(
          this.log,
          'Usuário já possui empresa associada.'
        );
      }

      const empresaExistente = await trx.query.empresa.findFirst({
        columns: {
          cnpj: true
        },
        where: ({ cnpj }, { eq }) => eq(cnpj, novaEmpresa.cnpj.value)
      });

      if (empresaExistente !== undefined) {
        return throwBusinessErrorAndLog(
          this.log,
          'Empresa já cadastrada com CNPJ informado.'
        );
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
        const errorMessage = 'Erro ao tentar inserir empresa. Retorno vazio.';
        this.log.warn(errorMessage);
        throw new Error(errorMessage);
      }

      await trx.update(pessoaTable).set({
        idEmpresa: empresaInserida.id,
        tipo: 'funcionario'
      });

      this.log.info('Empresa criada com sucesso.');
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
    this.log.info('Alterando empresa.');
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
        return throwBusinessErrorAndLog(this.log, 'Usuário não encontrado.');
      }

      const empresaExistente = await trx.query.empresa.findFirst({
        where: ({ codigo: codigoEmpresaExistente }, { eq }) =>
          eq(codigoEmpresaExistente, codigo)
      });

      if (empresaExistente === undefined) {
        return throwBusinessErrorAndLog(this.log, 'Empresa não encontrada.');
      }

      if (
        usuarioDb.pessoa.empresa?.codigo !== empresaExistente.codigo ||
        usuarioDb.pessoa.tipo !== 'funcionario'
      ) {
        return throwBusinessErrorAndLog(
          this.log,
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

      this.log.info('Empresa alterada com sucesso.');
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
    this.log.info(`Listando clientes da empresa ${codigoEmpresa}`);

    const empresaDb = await db.query.empresa.findFirst({
      with: {
        pessoas: {
          where: ({ tipo }, { eq }) => eq(tipo, 'cliente')
        }
      },
      where: ({ codigo }, { eq }) => eq(codigo, codigoEmpresa)
    });

    if (empresaDb === undefined) {
      return throwBusinessErrorAndLog(this.log, 'Empresa não encontrada.');
    }

    const usuarioSolicitante = await db.query.usuario.findFirst({
      with: {
        pessoa: true
      },
      where: ({ codigo }, { eq }) => eq(codigo, codigoUsuarioSolicitante)
    });

    if (usuarioSolicitante === undefined) {
      return throwBusinessErrorAndLog(this.log, 'Usuário não encontrado');
    }

    if (usuarioSolicitante.pessoa.tipo !== 'funcionario') {
      return throwBusinessErrorAndLog(
        this.log,
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
    this.log.info(`Cadastrando cliente na empresa.`);
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
        return throwBusinessErrorAndLog(this.log, 'Usuário não encontrado.');
      }

      const codigoEmpresa = usuarioRequisitanteDb.pessoa.empresa?.codigo;

      if (codigoEmpresa === undefined) {
        return throwBusinessErrorAndLog(
          this.log,
          'Usuário não possui empresa vinculada.'
        );
      }

      const tipoPessoaRequisitante = usuarioRequisitanteDb.pessoa.tipo;

      if (tipoPessoaRequisitante !== 'funcionario') {
        return throwBusinessErrorAndLog(
          this.log,
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

      this.log.info(
        `Cliente ${criarPessoalResult.codigo} cadastrado na empresa ${codigoEmpresa} com sucesso.`
      );

      return {
        codigo: criarPessoalResult.codigo,
        cpf: criarPessoalResult.cpf,
        nome: criarPessoalResult.nome,
        sobrenome: criarPessoalResult.sobrenome
      };
    });
  }

  public async alterarCliente({
    codigoUsuarioRequisitante,
    codigo: codigoCliente,
    nome,
    sobrenome,
    cpf
  }: AlterarClienteArgs): Promise<AlterarClienteResult> {
    const usuarioRequisitante = await db.query.usuario.findFirst({
      with: {
        pessoa: {
          with: {
            empresa: true
          }
        }
      },
      where: ({ codigo }, { eq }) => eq(codigo, codigoUsuarioRequisitante)
    });

    if (usuarioRequisitante === undefined) {
      return throwBusinessErrorAndLog(
        this.log,
        'Usuário solicitante não encontrado.'
      );
    }

    if (usuarioRequisitante?.pessoa.empresa?.id === undefined) {
      return throwBusinessErrorAndLog(
        this.log,
        'Usuário solicitante não faz parte da empresa.'
      );
    }

    if (usuarioRequisitante.pessoa.tipo !== 'funcionario') {
      return throwBusinessErrorAndLog(
        this.log,
        'Apenas funcionários da empresa podem alterar clientes.'
      );
    }

    const clienteDb = await db.query.pessoa.findFirst({
      with: {
        empresa: true
      },
      where: ({ codigo: codigoClienteExistente, idEmpresa }, { eq }) =>
        and(
          eq(codigoClienteExistente, codigoCliente),
          eq(idEmpresa, usuarioRequisitante?.pessoa.idEmpresa ?? 0)
        )
    });

    if (clienteDb === undefined) {
      return throwBusinessErrorAndLog(this.log, 'Pessoa não encontrada.');
    }

    if (clienteDb.cpf.trim() !== cpf.trim()) {
      const clienteExistenteComMesmoCpf = await db.query.pessoa.findFirst({
        with: {
          empresa: true
        },
        where: ({ cpf: cpfClienteExistente, idEmpresa }, { eq }) =>
          and(
            eq(cpfClienteExistente, cpf),
            eq(idEmpresa, usuarioRequisitante?.pessoa.idEmpresa ?? 0)
          )
      });

      if (clienteExistenteComMesmoCpf !== undefined) {
        return throwBusinessErrorAndLog(this.log, 'CPF já utilizado.');
      }
    }

    const cliente = new Pessoa(
      clienteDb.codigo,
      clienteDb.nome,
      clienteDb.sobrenome,
      clienteDb.cpf,
      clienteDb.empresa?.codigo,
      clienteDb.tipo ?? 'cliente'
    );

    cliente.alterarDados({ nome, sobrenome, cpf });

    await db
      .update(pessoaTable)
      .set({
        nome: cliente.nome,
        sobrenome: cliente.sobrenome,
        cpf: cliente.cpf.value
      })
      .where(
        and(
          eq(pessoaTable.codigo, cliente.codigo),
          eq(pessoaTable.idEmpresa, clienteDb.idEmpresa ?? 0)
        )
      );

    return {
      codigo: cliente.codigo,
      cpf: cliente.cpf.value,
      nome: cliente.nome,
      sobrenome: cliente.sobrenome
    };
  }
}
