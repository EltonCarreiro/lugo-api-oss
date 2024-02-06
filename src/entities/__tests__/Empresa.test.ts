import { Empresa } from '../Empresa';

describe('Empresa testes', () => {
  describe('ao criar uma empresa', () => {
    it('não deve permitir código vazio', () => {
      expect(() => criarEmpresaFake({ codigo: '' })).toThrow(
        'Código é obrigatório.'
      );
    });

    it('não deve permitir nome fantasia vazio', () => {
      expect(() => criarEmpresaFake({ nomeFantasia: '' })).toThrow(
        'Nome Fantasia é obrigatório.'
      );
    });

    it('não deve permitir razao social vazia', () => {
      expect(() => criarEmpresaFake({ razaoSocial: '' })).toThrow(
        'Razao Social é obrigatória.'
      );
    });

    describe('ao alterar dados', () => {
      it('não deve permitir nome fantasia vazio', () => {
        const empresa = criarEmpresaFake({});

        expect(() =>
          empresa.alterarDados('', 'fake_razao_sozial', '12.345.678/0001-00')
        ).toThrow('Nome Fantasia é obrigatório.');
      });

      it('não deve permitir razao social vazia', () => {
        const empresa = criarEmpresaFake({});

        expect(() =>
          empresa.alterarDados('fake_nome_fantasia', '', '12.345.678/0001-00')
        ).toThrow('Razao Social é obrigatória.');
      });

      it('deve alterar valores corretamente', () => {
        const args = criarArgumentosEmpresaFake({});
        const empresa = criarEmpresaFake(args);
        empresa.alterarDados(
          'new_fake_nome_fantasia',
          'new_fake_razao_social',
          '12.345.678/0001-00'
        );
        expect(empresa.codigo).toBe(args.codigo);
        expect(empresa.nomeFantasia).toBe('new_fake_nome_fantasia');
        expect(empresa.razaoSocial).toBe('new_fake_razao_social');
        expect(empresa.cnpj.value).toBe('12345678000100');
      });
    });
  });
});

interface EmpresaConstructorArgs {
  codigo: string;
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
}

// create args
const criarArgumentosEmpresaFake = (
  args: Partial<EmpresaConstructorArgs>
): EmpresaConstructorArgs => ({
  codigo: 'fake_cod',
  cnpj: '12.345.678/0001-00',
  nomeFantasia: 'fake_nome_fantasia',
  razaoSocial: 'fake_razao_social',
  ...args
});

const criarEmpresaFake = (args: Partial<EmpresaConstructorArgs>) => {
  const { codigo, nomeFantasia, razaoSocial, cnpj } =
    criarArgumentosEmpresaFake(args);
  return new Empresa(codigo, nomeFantasia, razaoSocial, cnpj);
};
