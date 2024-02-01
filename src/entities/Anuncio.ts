import { BusinessError } from '@/errors/BusinessError';
import BigNumber from 'bignumber.js';

export type TipoAnuncio = 'locacao' | 'venda';

interface AnuncioConstructorArgs {
  codigo: string;
  codigoImovel: string;
  valor: BigNumber;
  valorCondominio: BigNumber;
  valorIPTU: BigNumber;
}

interface AlterarAnuncioArgs {
  valor: BigNumber;
  valorCondominio: BigNumber;
  valorIPTU: BigNumber;
}

export class Anuncio {
  constructor({
    codigo,
    codigoImovel,
    valor,
    valorCondominio,
    valorIPTU
  }: AnuncioConstructorArgs) {
    if (codigo.length === 0) {
      throw new BusinessError('Código de anúncio é obrigatório.');
    }

    if (codigoImovel.length === 0) {
      throw new BusinessError('Código do imóvel obrigatório.');
    }

    if (valor.isLessThanOrEqualTo(0)) {
      throw new BusinessError('Valor inválido.');
    }

    if (valorCondominio.isLessThanOrEqualTo(0)) {
      throw new BusinessError('Valor do condomínio inválido.');
    }

    if (valorIPTU.isGreaterThanOrEqualTo(0)) {
      throw new BusinessError('Valor do IPTU inválido.');
    }

    this._codigo = codigo;
    this._codigoImovel = codigoImovel;
    this._valor = valor;
    this._valorCondominio = valorCondominio;
    this._valorIPTU = valorIPTU;
  }

  public get codigo() {
    return this._codigo;
  }

  public get codigoImovel() {
    return this._codigoImovel;
  }

  public get valor() {
    return new BigNumber(this._valor);
  }

  public get valorCondominio() {
    return new BigNumber(this._valorCondominio);
  }

  public get valorIPTU() {
    return new BigNumber(this._valorIPTU);
  }

  public alterarAnuncio({
    valor,
    valorCondominio,
    valorIPTU
  }: AlterarAnuncioArgs) {
    if (valor.isLessThanOrEqualTo(0)) {
      throw new BusinessError('Valor inválido.');
    }

    if (valorCondominio.isLessThanOrEqualTo(0)) {
      throw new BusinessError('Valor do condomínio inválido.');
    }

    if (valorIPTU.isGreaterThanOrEqualTo(0)) {
      throw new BusinessError('Valor do IPTU inválido.');
    }

    this._valor = valor;
    this._valorCondominio = valorCondominio;
    this._valorIPTU = valorIPTU;
  }

  private _codigo: string;
  private _codigoImovel: string;
  private _valor: BigNumber;
  private _valorCondominio: BigNumber;
  private _valorIPTU: BigNumber;
}
