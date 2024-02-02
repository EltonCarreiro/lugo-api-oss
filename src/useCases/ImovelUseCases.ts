import { nanoid } from 'nanoid';
import { Imovel } from '../entities/Imovel';
import { BusinessError } from '@/shared/errors/BusinessError';
import { db } from '@/db';
import { imovel } from '@/schema';

interface CriarImovelArgs {
  metrosQuadrados: number;
  endereco: string;
  codigoUsuarioSolicitante: string;
}

interface AlterarImovelArgs {
  codigoImovel: string;
  metrosQuadrados: number;
  endereco: string;
  codigoUsuarioSolicitante: string;
}

export class ImovelUseCases {
  _imoveis: Imovel[] = [];

  public async cadastrarImovel({
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

    return db.transaction(async (trx): Promise<string> => {
      const dono = await trx.query.usuario.findFirst({
        with: {
          pessoa: true
        }
      });

      if (dono === undefined) {
        throw new BusinessError('Pessoa associada á conta não encontrada.');
      }

      await db.insert(imovel).values({
        codigo: novoImovel.codigo,
        idDono: dono.id,
        endereco: novoImovel.endereco,
        metrosQuadrados: novoImovel.metrosQuadrados
      });

      return novoImovel.codigo;
    });
  }

  alterarImovel({
    codigoImovel,
    metrosQuadrados,
    endereco,
    codigoUsuarioSolicitante
  }: AlterarImovelArgs): Promise<void> {
    return db.transaction(async (trx) => {
      const imovelDb = await trx.query.imovel.findFirst({
        with: {
          dono: {
            with: {
              usuario: true
            }
          }
        },
        where: ({ codigo }, { eq }) => eq(codigo, codigoImovel)
      });

      if (imovelDb === undefined) {
        throw new BusinessError('Imóvel não encontrado');
      }

      const dono = imovelDb.dono ?? undefined;
      const usuario = dono?.usuario ?? undefined;

      if (
        dono === undefined ||
        usuario === undefined ||
        usuario.codigo !== codigoUsuarioSolicitante
      ) {
        throw new BusinessError(
          'Alteração cadastral só pode ser feita pelo dono do imóvel.'
        );
      }

      const imovelEntidade = new Imovel({
        codigo: imovelDb.codigo,
        codigoDono: dono.codigo,
        endereco: imovelDb.endereco,
        metrosQuadrados: imovelDb.metrosQuadrados ?? undefined
      });

      imovelEntidade.atualizarCadastro(metrosQuadrados, endereco);

      await trx.update(imovel).set({
        metrosQuadrados: imovelEntidade.metrosQuadrados,
        endereco: imovelEntidade.endereco
      });
    });
  }
}
