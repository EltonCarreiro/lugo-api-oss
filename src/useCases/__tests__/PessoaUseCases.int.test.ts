import { db } from '@/data/db';
import { PessoaUseCases } from '../PessoaUseCases';
import { empresa as empresaTable, pessoa as pessoaTable } from '@/schema';

describe('PessoaUseCases testes', () => {
  const pessoaUseCases = new PessoaUseCases();
  let mockData: Awaited<ReturnType<typeof setupData>>;

  beforeEach(async () => {
    mockData = await setupData();
  });

  afterEach(async () => {
    await cleanupData();
  });

  describe('ao criar pessoa', () => {
    it('não deve permitir cadastrar com mesmo CPF', () => {
      expect(
        pessoaUseCases.criarPessoa({
          codigoEmpresa: mockData.empresa.codigo,
          cpf: mockData.pessoa.cpf,
          nome: 'peter',
          sobrenome: 'parker',
          tipoPessoaEmpresa: 'cliente'
        })
      ).rejects.toThrow('Pessoa já cadastrada com o CPF informado.');
    });

    it('não deve permitir cadastrar caso empresa informada não seja encontrada', () => {
      expect(
        pessoaUseCases.criarPessoa({
          codigoEmpresa: 'non_existing_empresa',
          cpf: '12345678901',
          nome: 'peter',
          sobrenome: 'parker',
          tipoPessoaEmpresa: 'cliente'
        })
      ).rejects.toThrow('Empresa informada não encontrada.');
    });

    it('deve cadastrar com dados corretos', async () => {
      const insertPessoaResult = await pessoaUseCases.criarPessoa({
        codigoEmpresa: mockData.empresa.codigo,
        cpf: '12345678901',
        nome: 'peter',
        sobrenome: 'parker',
        tipoPessoaEmpresa: 'cliente'
      });

      const queryResult = await db.query.pessoa.findFirst({
        where: ({ codigo }, { eq }) => eq(codigo, insertPessoaResult.codigo)
      });

      expect(insertPessoaResult.codigo).toBe(queryResult?.codigo);
      expect(insertPessoaResult.cpf).toBe(queryResult?.cpf);
      expect(insertPessoaResult.nome).toBe(queryResult?.nome);
      expect(insertPessoaResult.sobrenome).toBe(queryResult?.sobrenome);
    });
  });

  describe('ao alterar pessoa', () => {
    it('não deve permitir alterar pessoa caso não esteja cadastrada', () => {
      expect(
        pessoaUseCases.alterarPessoa({
          codigo: 'non_existing_empresa',
          cpf: '12345678901',
          nome: 'peter',
          sobrenome: 'parker'
        })
      ).rejects.toThrow('Pessoa não encontrada.');
    });

    it('não deve permitir alterar para um cpf já utilizado', () => {
      expect(
        pessoaUseCases.alterarPessoa({
          codigo: mockData.pessoa.codigo,
          cpf: mockData.pessoa2.cpf,
          nome: 'peter',
          sobrenome: 'parker'
        })
      ).rejects.toThrow('CPF já utilizado.');
    });

    it('deve alterar dados com sucesso', async () => {
      await pessoaUseCases.alterarPessoa({
        codigo: mockData.pessoa.codigo,
        cpf: '12345678901',
        nome: 'peter_edited',
        sobrenome: 'parker_edited'
      });

      const pessoaDb = await db.query.pessoa.findFirst({
        where: ({ codigo }, { eq }) => eq(codigo, mockData.pessoa.codigo)
      });

      expect(pessoaDb?.cpf).toBe('12345678901');
      expect(pessoaDb?.nome).toBe('peter_edited');
      expect(pessoaDb?.sobrenome).toBe('parker_edited');
    });
  });

  describe('e utilizar transaction externa', () => {});
});

const setupData = async () => {
  await cleanupData();
  return db.transaction(async (trx) => {
    const empresa: typeof empresaTable.$inferInsert = {
      cnpj: '12345678000100',
      codigo: 'empresa_fake_1',
      nomeFantasia: 'nome_fantasia',
      razaoSocial: 'razao_social'
    };

    const empresaInsertResult = await trx
      .insert(empresaTable)
      .values(empresa)
      .returning({ id: empresaTable.id });

    const idEmpresa = empresaInsertResult[0]?.id;

    const pessoa: typeof pessoaTable.$inferInsert = {
      codigo: 'fake_pessoa_1',
      idEmpresa,
      cpf: '11111111111',
      nome: 'john',
      sobrenome: 'doe',
      tipo: 'funcionario'
    };

    const pessoaInsertResult = await trx
      .insert(pessoaTable)
      .values(pessoa)
      .returning({ id: pessoaTable.id });

    const idPessoa = pessoaInsertResult[0]?.id;

    const pessoa2: typeof pessoaTable.$inferInsert = {
      codigo: 'fake_pessoa_2',
      idEmpresa,
      cpf: '11111111112',
      nome: 'john',
      sobrenome: 'doe',
      tipo: 'funcionario'
    };

    const pessoaInsertResult2 = await trx
      .insert(pessoaTable)
      .values(pessoa2)
      .returning({ id: pessoaTable.id });

    const idPessoa2 = pessoaInsertResult2[0]?.id;

    return {
      empresa: { ...empresa, id: idEmpresa },
      pessoa: { ...pessoa, id: idPessoa },
      pessoa2: { ...pessoa2, id: idPessoa2 }
    };
  });
};

const cleanupData = () => {
  console.log('Cleaning up data...');
  return db.transaction(async (trx) => {
    await trx.delete(pessoaTable);
    await trx.delete(empresaTable);
  });
};
