import { db, sql } from '@/data/db';
import { EmpresaUseCases } from '../EmpresaUseCases';
import { PessoaUseCases } from '../PessoaUseCases';
import { MockData, gerarCnpj, gerarCpf, setupData } from './utils';
import { createLogger } from '@/logging';

describe('Empresa use cases testes', () => {
  const log = createLogger({ trace_id: 'integration_test' });
  const empresaUseCases = new EmpresaUseCases(new PessoaUseCases(log), log);
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
      const cliente = mockData.empresas[0].clientes[0];

      await expect(
        empresaUseCases.alterarEmpresa({
          codigoUsuarioSolicitante: cliente.usuario?.codigo ?? '',
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
      const cliente = empresa.clientes[0];

      await expect(
        empresaUseCases.listarClientes({
          codigoEmpresa: empresa.codigo,
          codigoUsuarioSolicitante: cliente.usuario?.codigo ?? ''
        })
      ).rejects.toThrow(
        'Apenas funcionários da empresa podem ver seus clientes.'
      );
    });

    it('deve listar clientes com sucesso', async () => {
      const empresa = mockData.empresas[0];
      const pessoa = empresa.pessoas[0];

      const cliente = empresa.clientes[0];
      const cliente2 = empresa.clientes[1];

      const clientes = await empresaUseCases.listarClientes({
        codigoEmpresa: empresa.codigo,
        codigoUsuarioSolicitante: pessoa.usuario?.codigo ?? ''
      });

      expect(clientes).toHaveLength(2);
      expect(clientes[0].codigo).toBe(cliente.codigo);
      expect(clientes[0].nome).toBe(cliente.nome);
      expect(clientes[0].sobrenome).toBe(cliente.sobrenome);
      expect(clientes[1].codigo).toBe(cliente2.codigo);
      expect(clientes[1].nome).toBe(cliente2.nome);
      expect(clientes[1].sobrenome).toBe(cliente2.sobrenome);
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
      const cliente = mockData.empresas[0].clientes[0];

      return expect(
        empresaUseCases.cadastrarCliente({
          codigoUsuarioRequisitante: cliente.usuario?.codigo ?? '',
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

  describe.only('ao alterar cliente', () => {
    it('não deve cadastrar cliente caso o usuário solicitante não seja encontrado', () => {
      const cliente = mockData.empresas[0].clientes[1];

      return expect(
        empresaUseCases.alterarCliente({
          codigoUsuarioRequisitante: 'not_existing',
          codigo: cliente.codigo,
          cpf: gerarCpf(),
          nome: 'nome_fake',
          sobrenome: 'sobrenome_fake'
        })
      ).rejects.toThrow('Usuário solicitante não encontrado.');
    });

    it('não deve cadastrar cliente caso usuário solicitante não faça parte da empresa', () => {
      const cliente = mockData.empresas[0].clientes[0];
      const pessoa = mockData.pessoas[0];

      return expect(
        empresaUseCases.alterarCliente({
          codigoUsuarioRequisitante: pessoa.usuario?.codigo ?? '',
          codigo: cliente.codigo,
          cpf: gerarCpf(),
          nome: 'nome_fake',
          sobrenome: 'sobrenome_fake'
        })
      ).rejects.toThrow('Usuário solicitante não faz parte da empresa.');
    });

    it('não deve cadastrar cliente se usuário solicitante faz parte da empresa mas não é funcionário', () => {
      const cliente1 = mockData.empresas[0].clientes[0];
      const cliente2 = mockData.empresas[0].clientes[1];

      return expect(
        empresaUseCases.alterarCliente({
          codigoUsuarioRequisitante: cliente1.usuario?.codigo ?? '',
          codigo: cliente2.codigo,
          cpf: gerarCpf(),
          nome: 'nome_fake',
          sobrenome: 'sobrenome_fake'
        })
      ).rejects.toThrow(
        'Apenas funcionários da empresa podem alterar clientes.'
      );
    });

    it('não deve permitir alterar para um cpf já utilizado por alguém da mesma empresa', () => {
      const funcionario = mockData.empresas[0].pessoas[0];
      const cliente1 = mockData.empresas[0].clientes[0];
      const cliente2 = mockData.empresas[0].clientes[1];

      return expect(
        empresaUseCases.alterarCliente({
          codigoUsuarioRequisitante: funcionario.usuario?.codigo ?? '',
          codigo: cliente1.codigo,
          cpf: cliente2.cpf,
          nome: 'nome_fake',
          sobrenome: 'sobrenome_fake'
        })
      ).rejects.toThrow('CPF já utilizado.');
    });

    it('não deve permitir alterar pessoa caso não esteja cadastrada', () => {
      const funcionario = mockData.empresas[0].pessoas[0];

      return expect(
        empresaUseCases.alterarCliente({
          codigoUsuarioRequisitante: funcionario.usuario?.codigo ?? '',
          codigo: 'non_existing',
          cpf: gerarCpf(),
          nome: 'nome_fake',
          sobrenome: 'sobrenome_fake'
        })
      ).rejects.toThrow('Pessoa não encontrada.');
    });

    it('deve alterar dados com sucesso', async () => {
      const funcionario = mockData.empresas[0].pessoas[0];
      const cliente = mockData.empresas[0].clientes[0];

      const result = await empresaUseCases.alterarCliente({
        codigoUsuarioRequisitante: funcionario.usuario?.codigo ?? '',
        codigo: cliente.codigo,
        cpf: gerarCpf(),
        nome: 'new_nome_fake',
        sobrenome: 'new_sobrenome_fake'
      });

      const queryResult = await db.query.pessoa.findFirst({
        where: ({ codigo }, { eq }) => eq(codigo, result.codigo)
      });

      expect(result.codigo).toBe(queryResult?.codigo);
      expect(result.nome).toBe(queryResult?.nome);
      expect(result.sobrenome).toBe(queryResult?.sobrenome);
      expect(result.cpf).toBe(queryResult?.cpf);
    });
  });
});
