import { db } from '@/db';
import { Anuncio } from '@/entities/Anuncio';
import { BusinessError } from '@/shared/errors/BusinessError';
import BigNumber from 'bignumber.js';
import { nanoid } from 'nanoid';
import { anuncio } from 'schema';

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
      const registroDb = await trx.query.usuario.findFirst({
        with: {
          pessoa: {
            with: {
              imoveis: {
                where: ({ codigo: codigoImovelExistente }, { eq }) =>
                  eq(codigoImovelExistente, codigoImovel)
              }
            }
          }
        },
        where: ({ codigo: codigoUsuario }, { eq }) =>
          eq(codigoUsuario, codigoUsuarioSolicitante)
      });

      const pessoa = registroDb?.pessoa ?? undefined;

      if (pessoa === undefined) {
        throw new Error('Pessoa associada á conta não encontrada.');
      }

      const imovel = pessoa.imoveis[0];

      if (imovel === undefined) {
        throw new BusinessError('Imóvel não encontrado.');
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
