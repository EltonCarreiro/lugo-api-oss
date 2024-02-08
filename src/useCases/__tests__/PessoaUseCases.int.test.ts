import { db } from '@/data/db';
import { PessoaUseCases } from '../PessoaUseCases';
import { MockData, cleanupData, setupData } from './utils';

describe('PessoaUseCases testes', () => {
  const pessoaUseCases = new PessoaUseCases();
  let mockData: MockData;

  beforeEach(async () => {
    mockData = await setupData();
  });

  afterEach(async () => {
    await cleanupData();
  });

  describe('ao criar pessoa', () => {
    it('não deve permitir cadastrar com mesmo CPF e mesma empresa', () => {
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

    it('deve permitir cadastrar com mesmo CPF porém sem empresa ou de empresa diferente', async () => {
      const insertPessoaResult = await pessoaUseCases.criarPessoa({
        codigoEmpresa: undefined,
        cpf: mockData.pessoa.cpf,
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

    it('não deve permitir alterar para um cpf já utilizado por alguém da mesma empresa', () => {
      expect(
        pessoaUseCases.alterarPessoa({
          codigo: mockData.pessoa.codigo,
          cpf: mockData.pessoa2.cpf,
          nome: 'peter',
          sobrenome: 'parker'
        })
      ).rejects.toThrow('CPF já utilizado.');
    });

    it('deve permitir alterar mesmo com CPF utilizado por alguém de empresa diferente', async () => {
      await pessoaUseCases.alterarPessoa({
        codigo: mockData.pessoaSemEmpresa.codigo,
        cpf: mockData.pessoa2.cpf,
        nome: 'peter',
        sobrenome: 'parker'
      });

      const pessoaDb = await db.query.pessoa.findFirst({
        where: ({ codigo }, { eq }) =>
          eq(codigo, mockData.pessoaSemEmpresa.codigo)
      });

      expect(pessoaDb?.cpf).toBe(mockData.pessoa2.cpf);
      expect(pessoaDb?.nome).toBe('peter');
      expect(pessoaDb?.sobrenome).toBe('parker');
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
});
