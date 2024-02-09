import { DbTransaction, db } from '@/data/db';
import { Pessoa } from '../entities/Pessoa';
import { nanoid } from 'nanoid';
import { pessoa as pessoaTable } from '@/schema';
import { eq } from 'drizzle-orm';
import { Logger } from '@/logging';
import { throwBusinessErrorAndLog } from '@/shared/errors/throwAndLog';

export interface CriarPessoaArgs {
  nome: string;
  sobrenome: string;
  cpf: string;
  codigoEmpresa: string | undefined;
  tipoPessoaEmpresa: 'cliente' | 'funcionario';
}

export interface AlterarPessoaArgs {
  codigo: string;
  nome: string;
  sobrenome: string;
  cpf: string;
}

interface CriarAlterarPessoaResult {
  codigo: string;
  codigoEmpresa: string | undefined;
  nome: string;
  sobrenome: string;
  cpf: string;
  tipoPessoaEmpresa: 'cliente' | 'funcionario';
}

export class PessoaUseCases {
  constructor(private log: Logger) {}

  public async criarPessoa(
    { nome, sobrenome, cpf, codigoEmpresa, tipoPessoaEmpresa }: CriarPessoaArgs,
    transaction?: DbTransaction
  ): Promise<CriarAlterarPessoaResult> {
    const hasOngoingTransaction = transaction !== undefined;

    this.log.info(
      `Criando pessoa ${hasOngoingTransaction ? '(com transaction existente)' : ''}`
    );
    const codigo = nanoid();
    const novaPessoa = new Pessoa(
      codigo,
      nome,
      sobrenome,
      cpf,
      codigoEmpresa,
      tipoPessoaEmpresa
    );

    if (transaction !== undefined) {
      return this.internalCriarPessoa(novaPessoa, transaction);
    }

    return db.transaction(
      async (trx): Promise<CriarAlterarPessoaResult> =>
        this.internalCriarPessoa(novaPessoa, trx)
    );
  }

  public async alterarPessoa({
    codigo,
    cpf,
    nome,
    sobrenome
  }: AlterarPessoaArgs): Promise<CriarAlterarPessoaResult> {
    return await db.transaction(
      async (trx): Promise<CriarAlterarPessoaResult> => {
        this.log.info('Alterando dados da pessoa.');
        const pessoaExistenteDb = await trx.query.pessoa.findFirst({
          with: {
            empresa: true
          },
          where: ({ codigo: codigoPessoaExistente }, { eq }) =>
            eq(codigoPessoaExistente, codigo)
        });

        if (pessoaExistenteDb === undefined) {
          return throwBusinessErrorAndLog(this.log, 'Pessoa não encontrada.');
        }

        const pessoa = new Pessoa(
          pessoaExistenteDb.codigo,
          pessoaExistenteDb.nome,
          pessoaExistenteDb.sobrenome,
          pessoaExistenteDb.cpf,
          pessoaExistenteDb.empresa?.codigo ?? undefined,
          pessoaExistenteDb.tipo ?? undefined
        );

        pessoa.alterarDados({ nome, sobrenome, cpf });

        const idEmpresaExistente = pessoaExistenteDb.idEmpresa ?? undefined;

        if (cpf !== pessoaExistenteDb.cpf) {
          const pessoaExistentePorCpf = await trx.query.pessoa.findFirst({
            columns: {
              cpf: true,
              idEmpresa: true
            },
            where: (
              { cpf: cpfPessoaExistente, idEmpresa },
              { eq, and, isNull }
            ) => {
              const comparacaoCpf = eq(cpfPessoaExistente, pessoa.cpf.value);

              if (idEmpresaExistente !== undefined) {
                return and(comparacaoCpf, eq(idEmpresa, idEmpresaExistente));
              }

              return and(comparacaoCpf, isNull(idEmpresa));
            }
          });

          if (pessoaExistentePorCpf !== undefined) {
            return throwBusinessErrorAndLog(this.log, 'CPF já utilizado.');
          }
        }

        await trx
          .update(pessoaTable)
          .set({
            cpf: pessoa.cpf.value,
            nome: pessoa.nome,
            sobrenome: pessoa.sobrenome
          })
          .where(eq(pessoaTable.codigo, pessoa.codigo));

        this.log.info('Pessoa alterada com sucesso.');
        return {
          codigo: pessoa.codigo,
          codigoEmpresa: pessoa.codigoEmpresa,
          cpf: pessoa.cpf.value,
          nome: pessoa.nome,
          sobrenome: pessoa.sobrenome,
          tipoPessoaEmpresa: pessoa.tipoPessoaEmpresa
        };
      }
    );
  }

  private async internalCriarPessoa(
    novaPessoa: Pessoa,
    trx: DbTransaction
  ): Promise<CriarAlterarPessoaResult> {
    const pessoaExistente = await trx.query.pessoa.findFirst({
      columns: {
        cpf: true
      },
      with: {
        empresa: {
          columns: {
            codigo: true
          }
        }
      },
      where: ({ cpf }, { eq }) => eq(cpf, novaPessoa.cpf.value)
    });

    if (
      pessoaExistente !== undefined &&
      pessoaExistente.empresa?.codigo === novaPessoa.codigoEmpresa
    ) {
      return throwBusinessErrorAndLog(
        this.log,
        'Pessoa já cadastrada com o CPF informado.'
      );
    }

    const codigoEmpresa = novaPessoa.codigoEmpresa;
    let idEmpresa: number | undefined;

    if (codigoEmpresa !== undefined) {
      this.log.info(
        'Código de empresa encontrado. Obtendo empresa para associar pessoa.'
      );
      const empresa = await trx.query.empresa.findFirst({
        columns: {
          id: true
        },
        where: ({ codigo }, { eq }) => eq(codigo, codigoEmpresa)
      });

      if (empresa === undefined) {
        return throwBusinessErrorAndLog(
          this.log,
          'Empresa informada não encontrada.'
        );
      }

      idEmpresa = empresa.id;
    }

    await trx.insert(pessoaTable).values({
      codigo: novaPessoa.codigo,
      cpf: novaPessoa.cpf.value,
      nome: novaPessoa.nome,
      sobrenome: novaPessoa.sobrenome,
      idEmpresa: idEmpresa,
      tipo: novaPessoa.tipoPessoaEmpresa
    });

    this.log.info('Pessoa criada com sucesso.');
    return {
      codigo: novaPessoa.codigo,
      codigoEmpresa: novaPessoa.codigoEmpresa,
      cpf: novaPessoa.cpf.value,
      nome: novaPessoa.nome,
      sobrenome: novaPessoa.sobrenome,
      tipoPessoaEmpresa: novaPessoa.tipoPessoaEmpresa
    };
  }
}
