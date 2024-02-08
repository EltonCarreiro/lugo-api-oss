import { MockData, setupData } from './utils';
import { UsuarioUseCases } from '../UsuarioUseCases';
import { nanoid } from 'nanoid';
import { db } from '@/data/db';

describe('Usuario use cases testes', () => {
  let mockData: MockData;
  let usuarioUseCases: UsuarioUseCases;

  beforeAll(async () => {
    usuarioUseCases = new UsuarioUseCases();
  });

  beforeEach(async () => {
    mockData = await setupData();
  });

  describe('ao criar usuário', () => {
    it('não deve permitir criar usuário quando a pessoa não for encontrada.', () => {
      expect(
        usuarioUseCases.criarUsuario({
          codigoPessoa: nanoid(),
          email: 'new@mail.com',
          senha: '123',
          confirmacaoSenha: '123'
        })
      ).rejects.toThrow('Pessoa não encontrada.');
    });

    it('não deve criar usuário caso a pessoa já possua usuário cadastrado.', () => {
      const pessoa = mockData.empresas[0].pessoas[0];

      expect(
        usuarioUseCases.criarUsuario({
          codigoPessoa: pessoa.codigo,
          email: 'new@mail.com',
          senha: '123',
          confirmacaoSenha: '123'
        })
      ).rejects.toThrow('Pessoa já possui usuário cadastrado.');
    });

    it('não deve criar usuário caso a email já esteja sendo utilizado (da mesma empresa ou não).', () => {
      const pessoa = mockData.empresas[0].pessoas[0];
      const pessoa2 = mockData.empresas[0].pessoas[1];
      const pessoaSemEmpresa = mockData.pessoas[0];

      expect(
        usuarioUseCases.criarUsuario({
          codigoPessoa: pessoa2.codigo,
          email: pessoa.usuario?.email ?? '',
          senha: '123',
          confirmacaoSenha: '123'
        })
      ).rejects.toThrow('Email já cadastrado.');

      expect(
        usuarioUseCases.criarUsuario({
          codigoPessoa: pessoa2.codigo,
          email: pessoaSemEmpresa.usuario?.email ?? '',
          senha: '123',
          confirmacaoSenha: '123'
        })
      ).rejects.toThrow('Email já cadastrado.');
    });
  });

  describe('ao alterar senha', () => {
    it('não deve permitir alterar senha caso as novas senhas não coincidam.', () => {
      const pessoa = mockData.empresas[0].pessoas[0];

      expect(() =>
        usuarioUseCases.alterarSenha({
          email: pessoa.usuario?.email ?? '',
          senha: '12',
          confirmacaoSenha: '1'
        })
      ).rejects.toThrow('Senhas não coincidem.');
    });

    it('não deve alterar senha caso usuário não seja encontrado.', () => {
      expect(() =>
        usuarioUseCases.alterarSenha({
          email: 'non_existing_email@mail.com',
          senha: '123',
          confirmacaoSenha: '123'
        })
      ).rejects.toThrow('Usuário não encontrado.');
    });

    it('deve alterar senha corretamente.', async () => {
      const pessoa = mockData.empresas[0].pessoas[0];

      const result = await usuarioUseCases.alterarSenha({
        email: pessoa.usuario?.email ?? '',
        senha: 'new_passw0rd',
        confirmacaoSenha: 'new_passw0rd'
      });

      const queryResult = await db.query.usuario.findFirst({
        where: ({ codigo }, { eq }) => eq(codigo, pessoa.usuario?.codigo ?? '')
      });

      expect(queryResult?.codigo).toBe(result.codigo);
      expect(queryResult?.email).toBe(result.email);
      // md5_hash(new_passw0rd) = s9BTXLhDqQsTJWPGyE1LWg==
      expect(queryResult?.senha).toBe('s9BTXLhDqQsTJWPGyE1LWg==');
    });
  });

  describe('ao obter empresa associada', () => {
    it('não deve retornar empresa caso usuário não seja encontrado.', () => {
      expect(
        usuarioUseCases.obterEmpresaAssociada('non_existing_user')
      ).rejects.toThrow('Usuário não encontrado.');
    });

    it('deve retornar undefined caso usuário não possua empresa associada.', async () => {
      const pessoaSemEmpresa = mockData.pessoas[0];
      const empresaAssociada = await usuarioUseCases.obterEmpresaAssociada(
        pessoaSemEmpresa.usuario?.codigo ?? ''
      );

      expect(empresaAssociada).toBeUndefined();
    });

    it('deve retornar empresa associada corretamente.', async () => {
      const empresa = mockData.empresas[0];
      const pessoa = empresa.pessoas[0];

      const empresaAssociada = await usuarioUseCases.obterEmpresaAssociada(
        pessoa.usuario?.codigo ?? ''
      );

      expect(empresaAssociada?.cnpj).toBe(empresa.cnpj);
      expect(empresaAssociada?.codigo).toBe(empresa.codigo);
      expect(empresaAssociada?.nomeFantasia).toBe(empresa.nomeFantasia);
      expect(empresaAssociada?.razaoSocial).toBe(empresa.razaoSocial);
    });
  });
});
