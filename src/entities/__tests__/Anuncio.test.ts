import BigNumber from 'bignumber.js';
import { Anuncio, AnuncioConstructorArgs } from '../Anuncio';

describe('Anúncio testes', () => {
  describe('ao criar um anúncio', () => {
    it('não deve permitir anúcio com código vazio', () => {
      expect(() => criarAnuncioFake({ codigo: '' })).toThrow(
        'Código de anúncio é obrigatório.'
      );
    });

    it('não deve permitir anúcio com código de imóvel vazio', () => {
      expect(() => criarAnuncioFake({ codigoImovel: '' })).toThrow(
        'Código do imóvel obrigatório.'
      );
    });

    it('não deve permitir anúcio com valor menor ou igual a 0', () => {
      expect(() => criarAnuncioFake({ valor: new BigNumber(0) })).toThrow(
        'Valor inválido.'
      );
      expect(() => criarAnuncioFake({ valor: new BigNumber(-1) })).toThrow(
        'Valor inválido.'
      );
    });

    it('não deve permitir anúcio com valor de condomínio menor ou igual a 0', () => {
      expect(() =>
        criarAnuncioFake({ valorCondominio: new BigNumber(0) })
      ).toThrow('Valor do condomínio inválido.');
      expect(() =>
        criarAnuncioFake({ valorCondominio: new BigNumber(-1) })
      ).toThrow('Valor do condomínio inválido.');
    });

    it('não deve permitir anúcio com valor de IPTU menor ou igual a 0', () => {
      expect(() => criarAnuncioFake({ valorIPTU: new BigNumber(0) })).toThrow(
        'Valor do IPTU inválido.'
      );
      expect(() => criarAnuncioFake({ valorIPTU: new BigNumber(-1) })).toThrow(
        'Valor do IPTU inválido.'
      );
    });

    it('deve criar anúncio com valores corretos', () => {
      const args = criarArgumentosAnuncioFake({});
      const anuncio = criarAnuncioFake(args);

      expect(anuncio.codigo).toBe(args.codigo);
      expect(anuncio.codigoImovel).toBe(args.codigoImovel);
      expect(anuncio.valor.toString()).toBe(args.valor.toString());
      expect(anuncio.valorCondominio.toString()).toBe(
        args.valorCondominio.toString()
      );
      expect(anuncio.valorIPTU.toString()).toBe(args.valorIPTU.toString());
    });
  });

  describe('ao alterar anúncio', () => {
    it('não deve permitir valor menor ou igual a 0', () => {
      const args = criarArgumentosAnuncioFake({});
      const anuncio = criarAnuncioFake(args);
      expect(() =>
        anuncio.alterarAnuncio({
          valor: new BigNumber(0),
          valorCondominio: anuncio.valorCondominio,
          valorIPTU: anuncio.valorIPTU
        })
      ).toThrow('Valor inválido.');

      expect(() =>
        anuncio.alterarAnuncio({
          valor: new BigNumber(-1),
          valorCondominio: anuncio.valorCondominio,
          valorIPTU: anuncio.valorIPTU
        })
      ).toThrow('Valor inválido.');
    });

    it('não deve permitir valor de condomínio menor ou igual a 0', () => {
      const args = criarArgumentosAnuncioFake({});
      const anuncio = criarAnuncioFake(args);
      expect(() =>
        anuncio.alterarAnuncio({
          valor: anuncio.valor,
          valorCondominio: new BigNumber(0),
          valorIPTU: anuncio.valorIPTU
        })
      ).toThrow('Valor do condomínio inválido.');

      expect(() =>
        anuncio.alterarAnuncio({
          valor: anuncio.valor,
          valorCondominio: new BigNumber(-1),
          valorIPTU: anuncio.valorIPTU
        })
      ).toThrow('Valor do condomínio inválido.');
    });

    it('não deve permitir valor de IPTU menor ou igual a 0', () => {
      const args = criarArgumentosAnuncioFake({});
      const anuncio = criarAnuncioFake(args);
      expect(() =>
        anuncio.alterarAnuncio({
          valor: anuncio.valor,
          valorCondominio: anuncio.valorCondominio,
          valorIPTU: new BigNumber(0)
        })
      ).toThrow('Valor do IPTU inválido.');

      expect(() =>
        anuncio.alterarAnuncio({
          valor: anuncio.valor,
          valorCondominio: anuncio.valorCondominio,
          valorIPTU: new BigNumber(-1)
        })
      ).toThrow('Valor do IPTU inválido.');
    });

    it('deve alterar anúncio corretamente', () => {
      const args = criarArgumentosAnuncioFake({});
      const anuncio = criarAnuncioFake(args);

      expect(() =>
        anuncio.alterarAnuncio({
          valor: new BigNumber(100),
          valorCondominio: new BigNumber(75),
          valorIPTU: new BigNumber(25)
        })
      ).not.toThrow();
    });
  });
});

// create args
const criarArgumentosAnuncioFake = (
  args: Partial<AnuncioConstructorArgs>
): AnuncioConstructorArgs => ({
  codigo: 'fake_cod',
  codigoImovel: 'fake_cod_imovel',
  valor: new BigNumber(1),
  valorCondominio: new BigNumber(1),
  valorIPTU: new BigNumber(1),
  ...args
});

// create entity
const criarAnuncioFake = (args: Partial<AnuncioConstructorArgs>) => {
  const { codigo, codigoImovel, valor, valorCondominio, valorIPTU } =
    criarArgumentosAnuncioFake(args);
  return new Anuncio({
    codigo,
    codigoImovel,
    valor,
    valorCondominio,
    valorIPTU
  });
};
