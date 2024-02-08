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
      expect(
        usuarioUseCases.criarUsuario({
          codigoPessoa: mockData.pessoa.codigo,
          email: 'new@mail.com',
          senha: '123',
          confirmacaoSenha: '123'
        })
      ).rejects.toThrow('Pessoa já possui usuário cadastrado.');
    });

    it('não deve criar usuário caso a email já esteja sendo utilizado (da mesma empresa ou n˜åo).', () => {
      expect(
        usuarioUseCases.criarUsuario({
          codigoPessoa: mockData.pessoa2.codigo,
          email: mockData.usuario.email,
          senha: '123',
          confirmacaoSenha: '123'
        })
      ).rejects.toThrow('Email já cadastrado.');

      expect(
        usuarioUseCases.criarUsuario({
          codigoPessoa: mockData.pessoaSemEmpresa.codigo,
          email: mockData.usuario.email,
          senha: '123',
          confirmacaoSenha: '123'
        })
      ).rejects.toThrow('Email já cadastrado.');
    });
  });

  describe('ao alterar senha', () => {
    it('não deve permitir alterar senha caso as novas senhas não coincidam.', () => {
      expect(() =>
        usuarioUseCases.alterarSenha({
          email: mockData.usuario.email,
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
      const result = await usuarioUseCases.alterarSenha({
        email: mockData.usuario.email,
        senha: 'new_passw0rd',
        confirmacaoSenha: 'new_passw0rd'
      });

      const queryResult = await db.query.usuario.findFirst({
        where: ({ codigo }, { eq }) => eq(codigo, mockData.usuario.codigo)
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
      const empresaAssociada = await usuarioUseCases.obterEmpresaAssociada(
        mockData.usuarioSemEmpresa.codigo
      );

      expect(empresaAssociada).toBeUndefined();
    });

    it('deve retornar empresa associada corretamente.', async () => {
      const empresaAssociada = await usuarioUseCases.obterEmpresaAssociada(
        mockData.usuario.codigo
      );

      expect(empresaAssociada?.cnpj).toBe(mockData.empresa.cnpj);
      expect(empresaAssociada?.codigo).toBe(mockData.empresa.codigo);
      expect(empresaAssociada?.nomeFantasia).toBe(
        mockData.empresa.nomeFantasia
      );
      expect(empresaAssociada?.razaoSocial).toBe(mockData.empresa.razaoSocial);
    });
  });
});
