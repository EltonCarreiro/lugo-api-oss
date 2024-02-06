import { Usuario, UsuarioConstructorArgs } from '../Usuario';

describe('Usuario tests', () => {
  describe('ao criar um usuário', () => {
    it('não deve permitir código vazio', () => {
      expect(() => criarUsurarioFake({ codigo: '' })).toThrow(
        'Código de usuário obrigatório.'
      );
    });

    it('não deve permitir email vazio', () => {
      expect(() => criarUsurarioFake({ email: '' })).toThrow(
        'Email vazio não permitido.'
      );
    });

    it('não deve permitir senha vazia', () => {
      expect(() => criarUsurarioFake({ senha: '' })).toThrow(
        'Senha vazia não permitida.'
      );
    });

    it('deve criar usuário com dados corretos', () => {
      const args = criarArgumentosUsuarioFake({});
      const usuario = criarUsurarioFake(args);

      expect(usuario.codigo).toBe(args.codigo);
      expect(usuario.email).toBe(args.email);
      expect(usuario.senha).toBe(args.senha);
    });
  });

  describe('ao alterar senha', () => {
    it('não deve permitir senha vazia', () => {
      const usuario = criarUsurarioFake({});

      expect(() => usuario.alterarSenha('', '')).toThrow(
        'Senha vazia não permitida.'
      );
    });

    it('não deve permitir senhas divergentes', () => {
      const usuario = criarUsurarioFake({});

      expect(() => usuario.alterarSenha('passw0rd', 'new_passw0rd')).toThrow(
        'Senhas não coincidem.'
      );
    });

    it('deve alterar senha corretamente', () => {
      const usuario = criarUsurarioFake({});
      usuario.alterarSenha('new_passw0rd', 'new_passw0rd');

      expect(usuario.senha).toBe('new_passw0rd');
    });
  });
});

// create args
const criarArgumentosUsuarioFake = (
  args: Partial<UsuarioConstructorArgs>
): UsuarioConstructorArgs => ({
  codigo: 'fake_cod',
  email: 'fake@email.com',
  senha: 'fake_passw0rd',
  ...args
});

// create entity
const criarUsurarioFake = (args: Partial<UsuarioConstructorArgs>) => {
  const { codigo, email, senha } = criarArgumentosUsuarioFake(args);
  return new Usuario({
    codigo,
    email,
    senha
  });
};
