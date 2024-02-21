import { Anuncio, AnuncioType } from './anuncio';
import { builder } from './builder';

export interface ImovelType {
  codigo: string;
  metrosQuadrados: number | undefined;
  endereco: string;
  anuncio: AnuncioType | undefined;
}

export const Imovel = builder.objectRef<ImovelType>('Imovel').implement({
  description: 'Imóvel cadastrado na imobiliária.',
  fields: (t) => ({
    codigo: t.exposeString('codigo'),
    metrosQuadrados: t.exposeInt('metrosQuadrados', { nullable: true }),
    endereco: t.exposeString('endereco'),
    anuncio: t.field({
      type: Anuncio,
      description: 'Anúncio associado ao imóvel',
      nullable: true,
      resolve: (parent, _, ctx) => {
        return ctx.useCases.anuncio.obterAnuncioDoImovel(parent.codigo);
      }
    })
  })
});

builder.mutationField('criarImovel', (t) =>
  t.field({
    type: Imovel,
    description: 'Cria um imóvel',
    args: {
      endereco: t.arg.string({ required: true }),
      metrosQuadrados: t.arg.int({ required: true }),
      codigoDono: t.arg.string()
    },
    resolve: async (_, { endereco, metrosQuadrados, codigoDono }, ctx) => {
      const codigoUsuarioSolicitante = ctx.usuarioLogado?.codigo;

      if (!codigoUsuarioSolicitante) {
        throw new Error('Usuário não autenticado');
      }

      const codigoImovel = await ctx.useCases.imovel.cadastrarImovel({
        codigoUsuarioSolicitante,
        endereco,
        metrosQuadrados,
        codigoDono: codigoDono ?? undefined
      });

      // TODO: Make routine return whole data rather than just code, this can lead to bugs
      return {
        codigo: codigoImovel,
        endereco,
        metrosQuadrados,
        anuncio: undefined
      };
    }
  })
);

builder.mutationField('alterarImovel', (t) =>
  t.field({
    type: Imovel,
    description: 'Altera um imóvel',
    args: {
      codigoImovel: t.arg.string({ required: true }),
      endereco: t.arg.string({ required: true }),
      metrosQuadrados: t.arg.int({ required: true })
    },
    resolve: async (_, { codigoImovel, endereco, metrosQuadrados }, ctx) => {
      const codigoUsuarioSolicitante = ctx.usuarioLogado?.codigo;

      if (!codigoUsuarioSolicitante) {
        throw new Error('Usuário não autenticado');
      }

      await ctx.useCases.imovel.alterarImovel({
        codigoUsuarioSolicitante,
        codigoImovel,
        endereco,
        metrosQuadrados
      });

      // TODO: Make routine return whole data rather than just code, this can lead to bugs
      return {
        codigo: codigoImovel,
        endereco,
        metrosQuadrados,
        anuncio: undefined
      };
    }
  })
);
