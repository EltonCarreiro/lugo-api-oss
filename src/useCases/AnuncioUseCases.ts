import { db } from '@/data/db';
import { Anuncio } from '@/entities/Anuncio';
import BigNumber from 'bignumber.js';
import { nanoid } from 'nanoid';
import { anuncio as anuncioTable } from '@/schema';
import { Logger } from '@/logging';
import { throwBusinessErrorAndLog } from '@/shared/errors/throwAndLog';
import { eq } from 'drizzle-orm';

interface CriarAnuncioArgs {
  codigoUsuarioSolicitante: string;
  codigoImovel: string;
  valor: string;
  valorCondominio: string;
  valorIPTU: string;
}

interface AlterarAnuncioArgs {
  codigoUsuarioSolicitante: string;
  codigoAnuncio: string;
  valor: string;
  valorCondominio: string;
  valorIPTU: string;
}

interface CriarAlterarAnuncioResult {
  codigo: string;
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
  }: CriarAnuncioArgs): Promise<CriarAlterarAnuncioResult> {
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

      const codigo = nanoid();

      await trx.insert(anuncioTable).values({
        idImovel: imovel.id,
        codigo,
        valor: novoAnuncio.valor.toString(),
        valorCondominio: novoAnuncio.valorCondominio.toString(),
        valorIPTU: novoAnuncio.valorIPTU.toString()
      });

      this.log.info('Anúncio criado com sucesso.');

      return {
        codigo,
        valor: novoAnuncio.valor.toString(),
        valorCondominio: novoAnuncio.valorCondominio.toString(),
        valorIPTU: novoAnuncio.valorIPTU.toString()
      };
    });
  }

  public async alterarAnuncio({
    codigoUsuarioSolicitante,
    codigoAnuncio,
    valor,
    valorCondominio,
    valorIPTU
  }: AlterarAnuncioArgs): Promise<CriarAlterarAnuncioResult> {
    this.log.info(`Alterando anúncio ${codigoAnuncio}`);

    const usuarioSolicitabteDb = await db.query.usuario.findFirst({
      with: {
        pessoa: {
          with: {
            empresa: true
          }
        }
      },
      where: ({ codigo }, { eq }) => eq(codigo, codigoUsuarioSolicitante)
    });

    if (usuarioSolicitabteDb === undefined) {
      return throwBusinessErrorAndLog(
        this.log,
        'Pessoa associada á conta não encontrada.'
      );
    }

    const anuncioDb = await db.query.anuncio.findFirst({
      with: {
        imovel: {
          with: {
            dono: {
              with: {
                empresa: true
              }
            }
          }
        }
      },
      where: ({ codigo }, { eq }) => eq(codigo, codigoAnuncio)
    });

    if (anuncioDb === undefined) {
      return throwBusinessErrorAndLog(this.log, 'Anúncio não encontrado.');
    }

    const usuarioEDaMesmaEmpresa =
      anuncioDb.imovel.dono.empresa?.codigo ===
      usuarioSolicitabteDb.pessoa.empresa?.codigo;

    const usuarioEDono =
      anuncioDb.imovel.dono.codigo === usuarioSolicitabteDb.pessoa.codigo;

    const usuarioSolicitanteEFuncionario =
      usuarioSolicitabteDb.pessoa.tipo === 'funcionario';

    if (
      !usuarioEDono &&
      (!usuarioEDaMesmaEmpresa || !usuarioSolicitanteEFuncionario)
    ) {
      return throwBusinessErrorAndLog(
        this.log,
        'Alteração só pode ser feita por funcionário da imobiliária ou dono do imóvel.'
      );
    }

    const anuncio = new Anuncio({
      codigo: anuncioDb.codigo,
      codigoImovel: anuncioDb.imovel.codigo,
      valor: new BigNumber(anuncioDb.valor),
      valorCondominio: new BigNumber(anuncioDb.valorCondominio),
      valorIPTU: new BigNumber(anuncioDb.valorIPTU)
    });

    anuncio.alterarAnuncio({
      valor: new BigNumber(valor),
      valorCondominio: new BigNumber(valorCondominio),
      valorIPTU: new BigNumber(valorIPTU)
    });

    await db
      .update(anuncioTable)
      .set({
        valor: anuncio.valor.toString(),
        valorCondominio: anuncio.valorCondominio.toString(),
        valorIPTU: anuncio.valorIPTU.toString()
      })
      .where(eq(anuncioTable.codigo, codigoAnuncio));

    return {
      codigo: codigoAnuncio,
      valor: anuncio.valor.toString(),
      valorCondominio: anuncio.valorCondominio.toString(),
      valorIPTU: anuncio.valorIPTU.toString()
    };
  }
}
