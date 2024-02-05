import { Cpf } from '../Cpf';

describe('CPF testes', () => {
  it('não deve permitir CPF com mais/menos de 11 dígitos numéricos', () => {
    expect(() => new Cpf('123.123.123-123')).toThrow('CPF Inválido.');
  });

  it('deve criar CPF válido', () => {
    expect(() => new Cpf('123.123.123-12')).not.toThrow('CPF Inválido.');
  });

  it('deve retornar cpf sem dígitos', () => {
    expect(new Cpf('123.123.123-12').value).toBe('12312312312');
  });
});
