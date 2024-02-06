import { Imovel, ImovelConstructorArgs } from '../Imovel';

describe('Imóvel testes', () => {
  describe('ao criar um imóvel', () => {
    it('não deve permitir código vazio', () => {
      expect(() => criarImovelFake({ codigo: '' })).toThrow(
        'Código não pode ser vazio.'
      );
    });

    it('não deve permitir código do dono vazio', () => {
      expect(() => criarImovelFake({ codigoDono: '' })).toThrow(
        'Código do dono obrigatório.'
      );
    });

    it('não deve permitir metragem do imóvel inválida', () => {
      expect(() => criarImovelFake({ metrosQuadrados: 0 })).toThrow(
        'Metragem do imóvel inválida.'
      );
      expect(() => criarImovelFake({ metrosQuadrados: -1 })).toThrow(
        'Metragem do imóvel inválida.'
      );
    });

    it('não deve permitir endereço vazio', () => {
      expect(() => criarImovelFake({ endereco: '' })).toThrow(
        'Endereço obrigatório.'
      );
    });

    it('deve criar imóvel corretamente', () => {
      const args = criarArgumentosImovelFake({});
      const imovel = criarImovelFake(args);

      expect(imovel.codigo).toBe(args.codigo);
      expect(imovel.codigoDono).toBe(args.codigoDono);
      expect(imovel.metrosQuadrados).toBe(args.metrosQuadrados);
      expect(imovel.endereco).toBe(args.endereco);
    });

    describe('ao atualizar imóvel', () => {
      it('não deve permitir metragem do imóvel inválida', () => {
        const imovel = criarImovelFake({});

        expect(() => imovel.atualizarCadastro(0, 'fake_endereco')).toThrow(
          'Metragem do imóvel inválida.'
        );
        expect(() => imovel.atualizarCadastro(-1, 'fake_endereco')).toThrow(
          'Metragem do imóvel inválida.'
        );
      });

      it('não deve permitir endereço vazio', () => {
        const imovel = criarImovelFake({});

        expect(() => imovel.atualizarCadastro(1, '')).toThrow(
          'Endereço obrigatório.'
        );
      });

      it('deve alterar dados corretamente', () => {
        const imovel = criarImovelFake({});
        imovel.atualizarCadastro(1, 'novo_fake_endereco');

        expect(imovel.metrosQuadrados).toBe(1);
        expect(imovel.endereco).toBe('novo_fake_endereco');
      });
    });
  });
});

const criarArgumentosImovelFake = (
  args: Partial<ImovelConstructorArgs>
): ImovelConstructorArgs => ({
  codigo: 'fake_cod',
  codigoDono: 'fake_cod_dono',
  endereco: 'fake_endereco',
  metrosQuadrados: undefined,
  ...args
});

const criarImovelFake = (args: Partial<ImovelConstructorArgs>) => {
  const { codigo, codigoDono, endereco, metrosQuadrados } =
    criarArgumentosImovelFake(args);
  return new Imovel({
    codigo,
    codigoDono,
    endereco,
    metrosQuadrados
  });
};
