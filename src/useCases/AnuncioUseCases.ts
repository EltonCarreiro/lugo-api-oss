import { db } from '@/data/db';
import { Anuncio } from '@/entities/Anuncio';
import BigNumber from 'bignumber.js';
import { nanoid } from 'nanoid';
import { anuncio } from '@/schema';
import { Logger } from '@/logging';
import { throwBusinessErrorAndLog } from '@/shared/errors/throwAndLog';

interface CriarAnuncioArgs {
  codigoUsuarioSolicitante: string;
  codigoImovel: string;
  valor: string;
  valorCondominio: string;
  valorIPTU: string;
}

export class AnuncioUseCases {
  constructor(private log: Logger) {}

  public async criarAnuncio({
    codigoUsuarioSolicitante,
    codigoImovel,
    valor,
    valorCondominio,
    valorIPTU
  }: CriarAnuncioArgs) {
    this.log.info('Criando anúncio.');
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
        const errorMessage = 'Pessoa associada á conta não encontrada.';
        this.log.warn(errorMessage);
        throw new Error(errorMessage);
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
        return throwBusinessErrorAndLog(this.log, 'Imóvel não encontrado.');
      }

      if (
        imovel.dono.codigo !== usuarioDb?.pessoa.codigo &&
        (imovel.dono.empresa?.codigo !== usuarioDb?.pessoa.empresa?.codigo ||
          usuarioDb?.pessoa.tipo !== 'funcionario')
      ) {
        return throwBusinessErrorAndLog(
          this.log,
          'Apenas funcionários da imobiliária ou o dono do imóvel podem criar um anúncio.'
        );
      }

      if (imovel.anuncio !== null) {
        return throwBusinessErrorAndLog(
          this.log,
          'Imóvel já possui anúncio vinculado.'
        );
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

      this.log.info('Anúncio criado com sucesso.');
    });
  }
}
