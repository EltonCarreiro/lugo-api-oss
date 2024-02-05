import { Cnpj } from '../Cnpj';

describe('CNPJ testes', () => {
  it('não deve permitir CPF com mais/menos de 14 dígitos numéricos', () => {
    expect(() => new Cnpj('12.345.678/0001-000')).toThrow('CNPJ Inválido.');
  });

  it('deve criar CPF válido', () => {
    expect(() => new Cnpj('12.345.678/0001-00')).not.toThrow('CNPJ Inválido.');
  });

  it('deve retornar cpf sem dígitos', () => {
    expect(new Cnpj('12.345.678/0001-00').value).toBe('12345678000100');
  });
});
