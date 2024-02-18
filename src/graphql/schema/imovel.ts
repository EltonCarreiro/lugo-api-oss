import { builder } from './builder';

export interface ImovelType {
  codigo: string;
  metrosQuadrados: number | undefined;
  endereco: string;
}

export const Imovel = builder.objectRef<ImovelType>('Imovel').implement({
  description: 'Imóvel cadastrado na imobiliária.',
  fields: (t) => ({
    codigo: t.exposeString('codigo'),
    metrosQuadrados: t.exposeInt('metrosQuadrados', { nullable: true }),
    endereco: t.exposeString('endereco')
  })
});

// TODO: Criar e alterar imóvel
