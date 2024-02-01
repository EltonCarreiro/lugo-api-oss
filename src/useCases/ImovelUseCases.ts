import { nanoid } from 'nanoid';
import { Imovel } from '../entities/Imovel';
import { BusinessError } from '@/errors/BusinessError';

interface CriarImovelArgs {
  metrosQuadrados: number;
  endereco: string;
  codigoUsuarioSolicitante: string;
}

interface AlterarImovelArgs {
  codigo: string;
  metrosQuadrados: number;
  endereco: string;
  codigoUsuarioSolicitante: string;
}

export class ImovelUseCases {
  _imoveis: Imovel[] = [];

  cadastrarImovel({
    metrosQuadrados,
    endereco,
    codigoUsuarioSolicitante
  }: CriarImovelArgs): Promise<string> {
    const novoImovel = new Imovel({
      codigo: nanoid(),
      codigoDono: codigoUsuarioSolicitante,
      metrosQuadrados,
      endereco
    });

    this._imoveis.push(novoImovel);
    return Promise.resolve(novoImovel.codigo);
  }

  alterarImovel({
    codigo,
    metrosQuadrados,
    endereco,
    codigoUsuarioSolicitante
  }: AlterarImovelArgs): Promise<void> {
    const imovel = this._imoveis.find(
      ({ codigo: codigoImovel }) => codigoImovel === codigo
    );

    if (imovel === undefined) {
      throw new BusinessError('Imóvel não encontrado');
    }

    if (imovel.codigoDono !== codigoUsuarioSolicitante) {
      throw new BusinessError(
        'Alteração cadastral só pode ser feita pelo dono do imóvel.'
      );
    }

    this._imoveis = this._imoveis.map((imovel) => {
      if (imovel.codigo === codigo) {
        imovel.atualizarCadastro(metrosQuadrados, endereco);
      }

      return imovel;
    });

    return Promise.resolve();
  }
}
