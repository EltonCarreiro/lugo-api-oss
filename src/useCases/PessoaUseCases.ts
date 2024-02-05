import { DbTransaction, db } from '@/data/db';
import { Pessoa } from '../entities/Pessoa';
import { nanoid } from 'nanoid';
import { BusinessError } from '@/shared/errors/BusinessError';
import { pessoa } from 'schema';

interface CriarPessoaArgs {
  nome: string;
  sobrenome: string;
  cpf: string;
}

type AlterarPessoaArgs = CriarPessoaArgs & { codigo: string };

interface CriarAlterarPessoaResult {
  codigo: string;
  nome: string;
  sobrenome: string;
  cpf: string;
}

export class PessoaUseCases {
  public async criarPessoa(
    { nome, sobrenome, cpf }: CriarPessoaArgs,
    transaction?: DbTransaction
  ): Promise<CriarAlterarPessoaResult> {
    const codigo = nanoid();
    const novaPessoa = new Pessoa(codigo, nome, sobrenome, cpf);

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
    const pessoaAtualizada = new Pessoa(codigo, nome, sobrenome, cpf);

    return await db.transaction(
      async (trx): Promise<CriarAlterarPessoaResult> => {
        const pessoaExistente = await trx.query.pessoa.findFirst({
          columns: {
            cpf: true
          },
          where: ({ codigo }, { eq }) => eq(codigo, pessoaAtualizada.codigo)
        });

        if (pessoaExistente === undefined) {
          throw new BusinessError('Pessoa não encontrada.');
        }

        if (cpf !== pessoaExistente.cpf) {
          const pessoaExistentePorCpf = await trx.query.pessoa.findFirst({
            columns: {
              cpf: true
            },
            where: ({ cpf: cpfPessoaExistente }, { eq }) =>
              eq(cpfPessoaExistente, pessoaAtualizada.cpf.value)
          });

          if (pessoaExistentePorCpf !== undefined) {
            throw new BusinessError('CPF já utilizado');
          }
        }

        await trx.update(pessoa).set({
          cpf: pessoaAtualizada.cpf.value,
          nome: pessoaAtualizada.nome,
          sobrenome: pessoaAtualizada.sobrenome
        });

        return {
          codigo: pessoaAtualizada.codigo,
          cpf: pessoaAtualizada.cpf.value,
          nome: pessoaAtualizada.nome,
          sobrenome: pessoaAtualizada.sobrenome
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
      where: ({ cpf }, { eq }) => eq(cpf, novaPessoa.cpf.value)
    });

    if (pessoaExistente !== undefined) {
      throw new BusinessError('Pessoa já cadastrada com o CPF informado.');
    }

    await trx.insert(pessoa).values({
      codigo: novaPessoa.codigo,
      cpf: novaPessoa.cpf.value,
      nome: novaPessoa.nome,
      sobrenome: novaPessoa.sobrenome
    });

    return {
      codigo: novaPessoa.codigo,
      cpf: novaPessoa.cpf.value,
      nome: novaPessoa.nome,
      sobrenome: novaPessoa.sobrenome
    };
  }
}
