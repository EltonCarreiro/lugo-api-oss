import { Senha } from '../Senha';

// TODO: Rework the Senha class so it uses a safe encryption algorithm for the password
describe('Senha testes', () => {
  it('não deve permitir senh vazia.', () => {
    expect(() => new Senha('')).toThrow('Senha não pode ser vazia.');
  });

  it('deve criar senha corretamente', () => {
    const senha = new Senha('passw0rd');
    expect(senha.value).toBe('vtEoNlIWwBmYiRXtOt11+w==');
  });
});
