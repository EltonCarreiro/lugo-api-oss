import { BusinessError } from '@/shared/errors/BusinessError';

export interface ImovelConstructorArgs {
  codigo: string;
  codigoDono: string;
  metrosQuadrados: number | undefined;
  endereco: string;
}

export class Imovel {
  public codigo: string;
  public codigoDono: string;
  public metrosQuadrados: number | undefined;
  public endereco: string;

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
      throw new BusinessError('Endereço obrigatório.');
    }

    this.codigo = codigo;
    this.codigoDono = codigoDono;
    this.metrosQuadrados = metrosQuadrados;
    this.endereco = endereco;
  }

  public atualizarCadastro(
    novaMetragem: number | undefined,
    novoEndereco: string
  ) {
    if (novaMetragem !== undefined && novaMetragem <= 0) {
      throw new BusinessError('Metragem do imóvel inválida.');
    }

    if (novoEndereco.length === 0) {
      throw new BusinessError('Endereço obrigatório.');
    }

    this.metrosQuadrados = novaMetragem;
    this.endereco = novoEndereco;
  }
}
