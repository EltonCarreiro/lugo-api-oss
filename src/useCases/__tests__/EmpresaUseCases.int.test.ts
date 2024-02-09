import { db, sql } from '@/data/db';
import { EmpresaUseCases } from '../EmpresaUseCases';
import { PessoaUseCases } from '../PessoaUseCases';
import { MockData, gerarCnpj, gerarCpf, setupData } from './utils';

describe('Empresa use cases testes', () => {
  const empresaUseCases = new EmpresaUseCases(new PessoaUseCases());
  let mockData: MockData;

  beforeEach(async () => {
    mockData = await setupData();
  });

  afterAll(async () => {
    await sql.end();
  });

  describe('ao criar uma empresa', () => {
    it('não deve permitir criar empresa se usuário soliciatente não for encontrado', () => {
      expect(
        empresaUseCases.criarEmpresa({
          codigoUsuarioCriador: 'not_found',
          nomeFantasia: 'nome_fantasia',
          cnpj: gerarCnpj(),
          razaoSocial: 'razao_social'
        })
      ).rejects.toThrow('Usuário não encontrado.');
    });

    it('não deve permitir criar empresa se usuário solicitante já possuir empresa associada', () => {
      const pessoa = mockData.empresas[0].pessoas[0];

      expect(
        empresaUseCases.criarEmpresa({
          codigoUsuarioCriador: pessoa.usuario?.codigo ?? '',
          nomeFantasia: 'nome_fantasia',
          cnpj: gerarCnpj(),
          razaoSocial: 'razao_social'
        })
      ).rejects.toThrow('Usuário já possui empresa associada.');
    });

    it('não deve permitir criar empresa se CNPJ já for utilizado', () => {
      const pessoa = mockData.pessoas[0];

      expect(
        empresaUseCases.criarEmpresa({
          codigoUsuarioCriador: pessoa.usuario?.codigo ?? '',
          nomeFantasia: 'nome_fantasia',
          cnpj: mockData.empresas[0].cnpj,
          razaoSocial: 'razao_social'
        })
      ).rejects.toThrow('Empresa já cadastrada com CNPJ informado.');
    });

    it('deve criar empresa com dados corretos e associar usuario', async () => {
      const pessoa = mockData.pessoas[0];

      const cnpj = gerarCnpj();
      const result = await empresaUseCases.criarEmpresa({
        codigoUsuarioCriador: pessoa.usuario?.codigo ?? '',
        nomeFantasia: 'nome_fantasia',
        cnpj,
        razaoSocial: 'razao_social'
      });

      const queryResult = await db.query.empresa.findFirst({
        where: ({ codigo }, { eq }) => eq(codigo, result.codigo)
      });

      const pessoaQueryResult = await db.query.pessoa.findFirst({
        where: ({ codigo }, { eq }) => eq(codigo, pessoa.codigo)
      });

      expect(queryResult?.codigo).toBe(result.codigo);
      expect(queryResult?.nomeFantasia).toBe('nome_fantasia');
      expect(queryResult?.razaoSocial).toBe('razao_social');
      expect(queryResult?.cnpj).toBe(cnpj);

      expect(pessoaQueryResult?.idEmpresa).toBe(queryResult?.id);
      expect(pessoaQueryResult?.tipo).toBe('funcionario');
    });
  });

  describe('ao alterar uma empresa', () => {
    it('não deve alterar empresa se usuário solicitante não for encontrado', () => {
      expect(
        empresaUseCases.alterarEmpresa({
          codigoUsuarioSolicitante: 'not_existing',
          codigo: mockData.empresas[0].codigo,
          cnpj: gerarCnpj(),
          nomeFantasia: 'nome_fantasia_edited',
          razaoSocial: 'razao_social_edited'
        })
      ).rejects.toThrow('Usuário não encontrado.');
    });

    it('não deve alterar empresa se a mesma não for encontrada', () => {
      const pessoa = mockData.pessoas[0];

      expect(
        empresaUseCases.alterarEmpresa({
          codigoUsuarioSolicitante: pessoa.usuario?.codigo ?? '',
          codigo: 'non_existing',
          cnpj: gerarCnpj(),
          nomeFantasia: 'nome_fantasia_edited',
          razaoSocial: 'razao_social_edited'
        })
      ).rejects.toThrow('Empresa não encontrada.');
    });

    it('não deve permitir alterar empresa se usuário não fizer parte da mesma', async () => {
      const pessoa = mockData.pessoas[0];

      await expect(
        empresaUseCases.alterarEmpresa({
          codigoUsuarioSolicitante: pessoa.usuario?.codigo ?? '',
          codigo: mockData.empresas[0].codigo,
          cnpj: gerarCnpj(),
          nomeFantasia: 'nome_fantasia_edited',
          razaoSocial: 'razao_social_edited'
        })
      ).rejects.toThrow(
        'Apenas funcionários da imobiliária podem alterar os dados da empresa.'
      );
    });

    it('não deve permitir alterar empresa se usuário fizer parte da mesma mas não for funcionário', async () => {
      const pessoa4 = mockData.empresas[0].pessoas[3];

      await expect(
        empresaUseCases.alterarEmpresa({
          codigoUsuarioSolicitante: pessoa4.usuario?.codigo ?? '',
          codigo: mockData.empresas[0].codigo,
          cnpj: gerarCnpj(),
          nomeFantasia: 'nome_fantasia_edited',
          razaoSocial: 'razao_social_edited'
        })
      ).rejects.toThrow(
        'Apenas funcionários da imobiliária podem alterar os dados da empresa.'
      );
    });

    it('deve alterar empresa com dados corretos', async () => {
      const empresa = mockData.empresas[0];
      const pessoa = empresa.pessoas[0];

      const novoCnpj = gerarCnpj();

      const result = await empresaUseCases.alterarEmpresa({
        codigoUsuarioSolicitante: pessoa.usuario?.codigo ?? '',
        codigo: empresa.codigo,
        cnpj: novoCnpj,
        nomeFantasia: 'nome_fantasia_edited',
        razaoSocial: 'razao_social_edited'
      });

      const queryResult = await db.query.empresa.findFirst({
        where: ({ codigo }, { eq }) => eq(codigo, result.codigo)
      });

      expect(queryResult?.codigo).toBe(result.codigo);
      expect(queryResult?.nomeFantasia).toBe('nome_fantasia_edited');
      expect(queryResult?.razaoSocial).toBe('razao_social_edited');
      expect(queryResult?.cnpj).toBe(novoCnpj);
    });
  });

  describe('ao listar clientes', () => {
    it('não deve listar clientes se empresa não for encontrada', () => {
      const pessoa = mockData.empresas[0].pessoas[0];

      expect(
        empresaUseCases.listarClientes({
          codigoEmpresa: 'non_existing',
          codigoUsuarioSolicitante: pessoa.usuario?.codigo ?? ''
        })
      ).rejects.toThrow('Empresa não encontrada.');
    });

    it('não deve listar clientes caso usuário solicitante não seja encontrado', () => {
      expect(
        empresaUseCases.listarClientes({
          codigoEmpresa: mockData.empresas[0].codigo,
          codigoUsuarioSolicitante: 'not_existing'
        })
      ).rejects.toThrow('Usuário não encontrado');
    });

    it('não deve listar clientes caso usuário solicitante não seja funcionário', async () => {
      const empresa = mockData.empresas[0];
      const pessoa4 = empresa.pessoas[3];

      await expect(
        empresaUseCases.listarClientes({
          codigoEmpresa: empresa.codigo,
          codigoUsuarioSolicitante: pessoa4.usuario?.codigo ?? ''
        })
      ).rejects.toThrow(
        'Apenas funcionários da empresa podem ver seus clientes.'
      );
    });

    it('deve listar clientes com sucesso', async () => {
      const empresa = mockData.empresas[0];
      const pessoa = empresa.pessoas[0];

      const pessoa4 = empresa.pessoas[3];

      const clientes = await empresaUseCases.listarClientes({
        codigoEmpresa: empresa.codigo,
        codigoUsuarioSolicitante: pessoa.usuario?.codigo ?? ''
      });

      expect(clientes).toHaveLength(1);
      expect(clientes[0].codigo).toBe(pessoa4.codigo);
      expect(clientes[0].nome).toBe(pessoa4.nome);
      expect(clientes[0].sobrenome).toBe(pessoa4.sobrenome);
    });
  });

  describe('ao cadastrar cliente', () => {
    it('não deve cadastrar cliente caso o usuário solicitante não seja encontrado', () => {
      return expect(
        empresaUseCases.cadastrarCliente({
          codigoUsuarioRequisitante: 'not_existing',
          cpf: gerarCpf(),
          nome: 'nome_fake',
          sobrenome: 'sobrenome_fake'
        })
      ).rejects.toThrow('Usuário não encontrado.');
    });

    it('não deve cadastrar cliente caso usuário solicitante não faça parte da empresa', () => {
      const pessoa = mockData.pessoas[0];

      return expect(
        empresaUseCases.cadastrarCliente({
          codigoUsuarioRequisitante: pessoa.usuario?.codigo ?? '',
          cpf: gerarCpf(),
          nome: 'nome_fake',
          sobrenome: 'sobrenome_fake'
        })
      ).rejects.toThrow('Usuário não possui empresa vinculada.');
    });

    it('não deve cadastrar cliente se usuário solicitante faz parte da empresa mas não é funcionário', () => {
      const pessoa4 = mockData.empresas[0].pessoas[3];

      return expect(
        empresaUseCases.cadastrarCliente({
          codigoUsuarioRequisitante: pessoa4.usuario?.codigo ?? '',
          cpf: gerarCpf(),
          nome: 'nome_fake',
          sobrenome: 'sobrenome_fake'
        })
      ).rejects.toThrow(
        'Apenas funcionários da empresa podem cadastrar clientes.'
      );
    });

    it('deve criar novo cliente com os dados corretos', async () => {
      const empresa = mockData.empresas[0];
      const pessoa = empresa.pessoas[0];

      const cpf = gerarCpf();
      const result = await empresaUseCases.cadastrarCliente({
        codigoUsuarioRequisitante: pessoa.usuario?.codigo ?? '',
        cpf,
        nome: 'fake_nome',
        sobrenome: 'fake_sobrenome'
      });

      const queryResult = await db.query.pessoa.findFirst({
        where: ({ codigo }, { eq }) => eq(codigo, result.codigo)
      });

      expect(queryResult?.cpf).toBe(cpf);
      expect(queryResult?.nome).toBe('fake_nome');
      expect(queryResult?.sobrenome).toBe('fake_sobrenome');
      expect(queryResult?.tipo).toBe('cliente');
    });
  });
});
