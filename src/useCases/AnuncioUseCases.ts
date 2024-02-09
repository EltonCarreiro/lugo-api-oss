import { db } from '@/data/db';
import { Anuncio } from '@/entities/Anuncio';
import { BusinessError } from '@/shared/errors/BusinessError';
import BigNumber from 'bignumber.js';
import { nanoid } from 'nanoid';
import { anuncio } from '@/schema';

interface CriarAnuncioArgs {
  codigoUsuarioSolicitante: string;
  codigoImovel: string;
  valor: string;
  valorCondominio: string;
  valorIPTU: string;
}

export class AnuncioUseCases {
  public async criarAnuncio({
    codigoUsuarioSolicitante,
    codigoImovel,
    valor,
    valorCondominio,
    valorIPTU
  }: CriarAnuncioArgs) {
    return db.transaction(async (trx) => {
      const usuarioDb = await trx.query.usuario.findFirst({
        with: {
          pessoa: {
            with: {
              empresa: true
            }
          }
        },
        where: ({ codigo: codigoUsuario }, { eq }) =>
          eq(codigoUsuario, codigoUsuarioSolicitante)
      });

      const pessoa = usuarioDb?.pessoa ?? undefined;

      if (pessoa === undefined) {
        throw new Error('Pessoa associada á conta não encontrada.');
      }

      const imovel = await trx.query.imovel.findFirst({
        with: {
          dono: {
            with: {
              empresa: true
            }
          },
          anuncio: true
        },
        where: ({ codigo }, { eq }) => eq(codigo, codigoImovel)
      });

      if (imovel === undefined) {
        throw new BusinessError('Imóvel não encontrado.');
      }

      if (
        imovel.dono.codigo !== usuarioDb?.pessoa.codigo &&
        (imovel.dono.empresa?.codigo !== usuarioDb?.pessoa.empresa?.codigo ||
          usuarioDb?.pessoa.tipo !== 'funcionario')
      ) {
        throw new BusinessError(
          'Apenas funcionários da imobiliária ou o dono do imóvel podem criar um anúncio.'
        );
      }

      if (imovel.anuncio !== null) {
        throw new BusinessError('Imóvel já possui anúncio vinculado.');
      }

      const novoAnuncio = new Anuncio({
        codigo: nanoid(),
        codigoImovel: imovel.codigo,
        valor: new BigNumber(valor),
        valorCondominio: new BigNumber(valorCondominio),
        valorIPTU: new BigNumber(valorIPTU)
      });

      await trx.insert(anuncio).values({
        idImovel: imovel.id,
        valor: novoAnuncio.valor.toString(),
        valorCondominio: novoAnuncio.valorCondominio.toString(),
        valorIPTU: novoAnuncio.valorIPTU.toString()
      });
    });
  }
}
