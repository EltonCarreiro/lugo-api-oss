import { nanoid } from 'nanoid';
import { Imovel } from '../entities/Imovel';
import { BusinessError } from '@/shared/errors/BusinessError';
import { db } from '@/data/db';
import { imovel } from '@/schema';
import { eq } from 'drizzle-orm';

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
  _imoveis: Imovel[] = [];

  public async cadastrarImovel({
    metrosQuadrados,
    endereco,
    codigoUsuarioSolicitante,
    codigoDono
  }: CriarImovelArgs): Promise<string> {
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
        throw new BusinessError('Pessoa associada á conta não encontrada.');
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
          throw new BusinessError('Dono não encontrado');
        }

        if (usuarioSolicitante.pessoa.tipo !== 'funcionario') {
          throw new BusinessError(
            'Usuário solicitante precisa ser funcionário para cadastrar imóvel para outra pessoa.'
          );
        }

        if (
          usuarioSolicitante.pessoa.empresa?.codigo !== dono.empresa?.codigo
        ) {
          throw new BusinessError(
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
              usuario: true,
              empresa: true
            }
          }
        },
        where: ({ codigo }, { eq }) => eq(codigo, codigoImovel)
      });

      if (imovelDb === undefined) {
        throw new BusinessError('Imóvel não encontrado.');
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
          throw new BusinessError('Usuário solicitante não encontrado.');
        }

        if (
          usuario?.pessoa.tipo !== 'funcionario' ||
          usuario.pessoa.empresa?.codigo !== imovelDb.dono?.empresa?.codigo
        ) {
          throw new BusinessError(
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
    });
  }
}
