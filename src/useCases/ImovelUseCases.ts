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

interface ObterDonoArgs {
  codigoUsuarioSolicitante: string;
  codigoImovel: string;
}

interface ObterDonoResult {
  codigo: string;
  nome: string;
  sobrenome: string;
}

interface ObterImoveisDonoArgs {
  codigoUsuarioSolicitante: string;
  codigoDono: string;
}

interface InformacoesImovel {
  codigo: string;
  metrosQuadrados: number | undefined;
  endereco: string;
}

export class ImovelUseCases {
  constructor(private log: Logger) {}

  public cadastrarImovel({
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

  public alterarImovel({
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

  public async obterDono({
    codigoImovel,
    codigoUsuarioSolicitante
  }: ObterDonoArgs): Promise<ObterDonoResult> {
    const imovelDb = await db.query.imovel.findFirst({
      with: {
        dono: {
          with: {
            empresa: true
          }
        }
      },
      where: ({ codigo }, { eq }) => eq(codigo, codigoImovel)
    });

    if (imovelDb === undefined) {
      return throwBusinessErrorAndLog(this.log, 'Imóvel não encontrado.');
    }

    const usuarioSolicitanteDb = await db.query.usuario.findFirst({
      with: {
        pessoa: {
          with: {
            empresa: true
          }
        }
      },
      where: ({ codigo }, { eq }) => eq(codigo, codigoUsuarioSolicitante)
    });

    const solicitanteEDaMesmaEmpresa =
      imovelDb.dono.empresa?.codigo ===
      usuarioSolicitanteDb?.pessoa.empresa?.codigo;

    const solicitanteEFuncionario =
      usuarioSolicitanteDb?.pessoa.tipo === 'funcionario';

    if (!solicitanteEDaMesmaEmpresa || !solicitanteEFuncionario) {
      return throwBusinessErrorAndLog(this.log, 'Imóvel não encontrado.');
    }

    return {
      codigo: imovelDb.dono.codigo,
      nome: imovelDb.dono.nome,
      sobrenome: imovelDb.dono.sobrenome
    };
  }

  public async obterImoveisDono({
    codigoUsuarioSolicitante,
    codigoDono
  }: ObterImoveisDonoArgs): Promise<InformacoesImovel[]> {
    const usuarioSolicitanteDb = await db.query.usuario.findFirst({
      with: {
        pessoa: {
          with: {
            empresa: true
          }
        }
      },
      where: ({ codigo }, { eq }) => eq(codigo, codigoUsuarioSolicitante)
    });

    console.log(codigoDono);

    if (usuarioSolicitanteDb === undefined) {
      return throwBusinessErrorAndLog(
        this.log,
        'Usuário solicitante não encontrado.'
      );
    }

    const donoDb = await db.query.pessoa.findFirst({
      with: {
        empresa: true,
        imoveis: true
      },
      where: ({ codigo }, { eq }) => eq(codigo, codigoDono)
    });

    if (donoDb === undefined) {
      return throwBusinessErrorAndLog(
        this.log,
        'Dono do imóvel não encontrado.'
      );
    }

    const usuarioEDonoSaoDaMesmaEmpresa =
      usuarioSolicitanteDb.pessoa.empresa?.codigo === donoDb.empresa?.codigo;

    const usuarioSolicitanteEFuncionario =
      usuarioSolicitanteDb.pessoa.tipo === 'funcionario';

    if (!usuarioEDonoSaoDaMesmaEmpresa || !usuarioSolicitanteEFuncionario) {
      return throwBusinessErrorAndLog(
        this.log,
        'Apenas o dono do imóvel ou funcionário da imobiliária podem visualizar um imóvel.'
      );
    }

    return donoDb.imoveis.map((imovel) => ({
      codigo: imovel.codigo,
      metrosQuadrados: imovel.metrosQuadrados ?? undefined,
      endereco: imovel.endereco
    }));
  }
}
