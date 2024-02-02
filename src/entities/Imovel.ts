import { BusinessError } from '@/shared/errors/BusinessError';

interface ImovelConstructorArgs {
  codigo: string;
  codigoDono: string;
  metrosQuadrados: number | undefined;
  endereco: string;
}

export class Imovel {
  public constructor({
    codigo,
    codigoDono,
    metrosQuadrados,
    endereco
  }: ImovelConstructorArgs) {
    if (codigo.length === 0) {
      throw new BusinessError('Código não pode ser vazio.');
    }

    if (codigoDono.length === 0) {
      throw new BusinessError('Código do dono obrigatório.');
    }

    if (metrosQuadrados !== undefined && metrosQuadrados <= 0) {
      throw new BusinessError('Metragem do imóvel inválida.');
    }

    if (endereco.length === 0) {
      throw new BusinessError('Endereço obrigatório');
    }

    this._codigo = codigo;
    this._codigoDono = codigoDono;
    this._metrosQuadrados = metrosQuadrados;
    this._endereco = endereco;
  }

  public get codigo() {
    return this._codigo;
  }

  public get codigoDono() {
    return this._codigoDono;
  }

  public get metrosQuadrados() {
    return this._metrosQuadrados;
  }

  public get endereco() {
    return this._endereco;
  }

  public atualizarCadastro(
    novaMetragem: number | undefined,
    novoEndereco: string
  ) {
    if (novaMetragem !== undefined && novaMetragem <= 0) {
      throw new BusinessError('Metragem do imóvel inválida.');
    }

    if (novoEndereco.length === 0) {
      throw new BusinessError('Endereço obrigatório');
    }

    this._metrosQuadrados = novaMetragem;
    this._endereco = novoEndereco;
  }

  private _codigo: string;
  private _codigoDono: string;
  private _metrosQuadrados: number | undefined;
  private _endereco: string;
}
