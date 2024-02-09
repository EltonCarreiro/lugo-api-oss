import {
  pgSchema,
  serial,
  text,
  integer,
  decimal,
  pgEnum,
  unique
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const schema = pgSchema('lugo');

export const empresa = schema.table('empresa', {
  id: serial('id').primaryKey(),
  codigo: text('codigo').notNull().unique(),
  cnpj: text('cnpj').notNull().unique(),
  nomeFantasia: text('nome_fantasia').notNull(),
  razaoSocial: text('razao_social').notNull()
});

export const empresaRelations = relations(empresa, ({ many }) => ({
  pessoas: many(pessoa)
}));

export const tipoPessoaEnum = pgEnum('tipo_pessoa', ['funcionario', 'cliente']);

export const pessoa = schema.table(
  'pessoa',
  {
    id: serial('id').primaryKey(),
    codigo: text('codigo').unique().notNull(),
    idEmpresa: integer('empresa_id').references(() => empresa.id),
    nome: text('nome').notNull(),
    sobrenome: text('sobrenome').notNull(),
    cpf: text('cpf').notNull(),
    tipo: tipoPessoaEnum('tipo')
  },
  (t) => ({
    uniqueNomeEmpresa: unique().on(t.idEmpresa, t.cpf)
  })
);

export const pessoaRelations = relations(pessoa, ({ one, many }) => ({
  empresa: one(empresa, {
    fields: [pessoa.idEmpresa],
    references: [empresa.id]
  }),
  usuario: one(usuario),
  imoveis: many(imovel)
}));

export const usuario = schema.table('usuario', {
  id: serial('id').primaryKey(),
  idPessoa: integer('pessoa_id')
    .notNull()
    .references(() => pessoa.id),
  codigo: text('codigo').unique().notNull(),
  email: text('email').notNull(),
  senha: text('senha').notNull()
});

export const usuarioRelations = relations(usuario, ({ one }) => ({
  pessoa: one(pessoa, {
    fields: [usuario.idPessoa],
    references: [pessoa.id]
  })
}));

export const imovel = schema.table('imovel', {
  id: serial('id').primaryKey(),
  idDono: integer('dono_id')
    .notNull()
    .references(() => pessoa.id),
  codigo: text('codigo').unique().notNull(),
  metrosQuadrados: integer('metros_quadrados'),
  endereco: text('endereco').notNull()
});

export const imovelRelations = relations(imovel, ({ one }) => ({
  dono: one(pessoa, {
    fields: [imovel.idDono],
    references: [pessoa.id]
  }),
  anuncio: one(anuncio, {
    fields: [imovel.id],
    references: [anuncio.idImovel]
  })
}));

export const anuncio = schema.table('anuncio', {
  id: serial('id').primaryKey(),
  idImovel: integer('imovel_id')
    .notNull()
    .references(() => imovel.id),
  valor: decimal('valor').notNull(),
  valorCondominio: decimal('valor_condominio').notNull(),
  valorIPTU: decimal('valor_iptu').notNull()
});

export const anuncioRelations = relations(anuncio, ({ one }) => ({
  imovel: one(imovel, {
    fields: [anuncio.idImovel],
    references: [imovel.id]
  })
}));
