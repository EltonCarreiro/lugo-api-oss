import { nanoid } from 'nanoid';
import { Imovel } from '../entities/Imovel';
import { db } from '@/data/db';
import { imovel } from '@/schema';
import { eq } from 'drizzle-orm';
import { throwBusinessErrorAndLog } from '@/shared/errors/throwAndLog';
import { Logger } from '@/logging';

interface CriarImovelArgs {
  metrosQuadrados: number;
  endereco: string;
  codigoUsuarioSolicitante: string;
  codigoDono?: string;
}

interface AlterarImovelArgs {
  codigoImovel: string;
  metrosQuadrados: number;
  endereco: string;
  codigoUsuarioSolicitante: string;
}

export class ImovelUseCases {
  constructor(private log: Logger) {}

  public async cadastrarImovel({
    metrosQuadrados,
    endereco,
    codigoUsuarioSolicitante,
    codigoDono
  }: CriarImovelArgs): Promise<string> {
    this.log.info('Cadastrando imóvel.');

    const novoImovel = new Imovel({
      codigo: nanoid(),
      codigoDono: codigoDono ?? codigoUsuarioSolicitante,
      metrosQuadrados,
      endereco
    });

    return db.transaction(async (trx): Promise<string> => {
      const usuarioSolicitante = await trx.query.usuario.findFirst({
        with: {
          pessoa: {
            with: {
              empresa: true
            }
          }
        },
        where: ({ codigo }, { eq }) => eq(codigo, codigoUsuarioSolicitante)
      });

      if (usuarioSolicitante === undefined) {
        return throwBusinessErrorAndLog(
          this.log,
          'Pessoa associada á conta não encontrada.'
        );
      }

      let idDono = usuarioSolicitante.pessoa.id;
      if (
        codigoDono !== undefined &&
        usuarioSolicitante.pessoa.codigo !== codigoDono
      ) {
        const dono = await trx.query.pessoa.findFirst({
          with: {
            empresa: true
          },
          where: ({ codigo }, { eq }) => eq(codigo, codigoDono)
        });

        if (dono === undefined) {
          return throwBusinessErrorAndLog(this.log, 'Dono não encontrado');
        }

        if (usuarioSolicitante.pessoa.tipo !== 'funcionario') {
          return throwBusinessErrorAndLog(
            this.log,
            'Usuário solicitante precisa ser funcionário para cadastrar imóvel para outra pessoa.'
          );
        }

        if (
          usuarioSolicitante.pessoa.empresa?.codigo !== dono.empresa?.codigo
        ) {
          return throwBusinessErrorAndLog(
            this.log,
            'Funcionário só pode alterar imóveis atrelados á própria empresa.'
          );
        }

        idDono = dono.id;
      }

      await db.insert(imovel).values({
        codigo: novoImovel.codigo,
        idDono,
        endereco: novoImovel.endereco,
        metrosQuadrados: novoImovel.metrosQuadrados
      });

      this.log.info(`Imvóvel ${novoImovel.codigo} criado com sucesso.`);
      return novoImovel.codigo;
    });
  }

  alterarImovel({
    codigoImovel,
    metrosQuadrados,
    endereco,
    codigoUsuarioSolicitante
  }: AlterarImovelArgs): Promise<void> {
    this.log.info('Alterando imóvel.');

    return db.transaction(async (trx) => {
      const imovelDb = await trx.query.imovel.findFirst({
        with: {
          dono: {
            with: {
              usuario: true,
              empresa: true
            }
          }
        },
        where: ({ codigo }, { eq }) => eq(codigo, codigoImovel)
      });

      if (imovelDb === undefined) {
        return throwBusinessErrorAndLog(this.log, 'Imóvel não encontrado.');
      }

      if (codigoUsuarioSolicitante !== imovelDb.dono.usuario?.codigo) {
        const usuario = await trx.query.usuario.findFirst({
          with: {
            pessoa: {
              with: {
                empresa: true
              }
            }
          },
          where: ({ codigo }, { eq }) => eq(codigo, codigoUsuarioSolicitante)
        });

        if (usuario === undefined) {
          return throwBusinessErrorAndLog(
            this.log,
            'Usuário solicitante não encontrado.'
          );
        }

        if (
          usuario?.pessoa.tipo !== 'funcionario' ||
          usuario.pessoa.empresa?.codigo !== imovelDb.dono?.empresa?.codigo
        ) {
          return throwBusinessErrorAndLog(
            this.log,
            'Imóvel só pode ser alterado pelo dono ou funcionário da imobiliária.'
          );
        }
      }

      const imovelEntidade = new Imovel({
        codigo: imovelDb.codigo,
        codigoDono: imovelDb.dono.codigo,
        endereco: imovelDb.endereco,
        metrosQuadrados: imovelDb.metrosQuadrados ?? undefined
      });

      imovelEntidade.atualizarCadastro(metrosQuadrados, endereco);

      await trx
        .update(imovel)
        .set({
          metrosQuadrados: imovelEntidade.metrosQuadrados,
          endereco: imovelEntidade.endereco
        })
        .where(eq(imovel.codigo, imovelEntidade.codigo));

      this.log.info(`Imóvel ${imovelEntidade.codigo} alterado com sucesso.`);
    });
  }
}
