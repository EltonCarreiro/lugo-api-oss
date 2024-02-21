import { builder } from './builder';

export interface AnuncioType {
  codigo: string;
  valor: string;
  valorCondominio: string;
  valorIPTU: string;
}

export const Anuncio = builder.objectRef<AnuncioType>('Anuncio').implement({
  description: 'Imóvel cadastrado na imobiliária.',
  fields: (t) => ({
    codigo: t.exposeString('codigo'),
    valor: t.exposeString('valor'),
    valorCondominio: t.exposeString('valorCondominio'),
    valorIPTU: t.exposeString('valorIPTU')
  })
});

builder.mutationField('criarAnuncio', (t) =>
  t.field({
    type: Anuncio,
    description: 'Cria um anúncio',
    args: {
      codigoImovel: t.arg.string({ required: true }),
      valor: t.arg.string({ required: true }),
      valorCondominio: t.arg.string({ required: true }),
      valorIPTU: t.arg.string({ required: true })
    },
    resolve: async (
      _,
      { codigoImovel, valor, valorCondominio, valorIPTU },
      ctx
    ) => {
      const codigoUsuarioSolicitante = ctx.usuarioLogado?.codigo;

      if (!codigoUsuarioSolicitante) {
        throw new Error('Usuário não autenticado');
      }

      return ctx.useCases.anuncio.criarAnuncio({
        codigoUsuarioSolicitante,
        codigoImovel,
        valor,
        valorCondominio,
        valorIPTU
      });
    }
  })
);

builder.mutationField('alterarAnuncio', (t) =>
  t.field({
    type: Anuncio,
    description: 'Altera um anúncio',
    args: {
      codigoAnuncio: t.arg.string({ required: true }),
      valor: t.arg.string({ required: true }),
      valorCondominio: t.arg.string({ required: true }),
      valorIPTU: t.arg.string({ required: true })
    },
    resolve: async (
      _,
      { codigoAnuncio, valor, valorCondominio, valorIPTU },
      ctx
    ) => {
      const codigoUsuarioSolicitante = ctx.usuarioLogado?.codigo;

      if (!codigoUsuarioSolicitante) {
        throw new Error('Usuário não autenticado');
      }

      return ctx.useCases.anuncio.alterarAnuncio({
        codigoUsuarioSolicitante,
        codigoAnuncio,
        valor,
        valorCondominio,
        valorIPTU
      });
    }
  })
);
