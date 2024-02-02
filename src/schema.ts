import { pgSchema, serial, text, integer, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const schema = pgSchema('lugo');

export const pessoa = schema.table('pessoa', {
  id: serial('id').primaryKey(),
  codigo: text('codigo').unique().notNull(),
  nome: text('nome').notNull(),
  sobrenome: text('sobrenome').notNull(),
  cpf: text('cpf').unique().notNull()
});

export const pessoaRelations = relations(pessoa, ({ one, many }) => ({
  usuario: one(usuario),
  imoveis: many(imovel)
}));

export const usuario = schema.table('usuario', {
  id: serial('id').primaryKey(),
  idPessoa: integer('pessoa_id').references(() => pessoa.id),
  codigo: text('codigo').unique().notNull(),
  email: text('email').notNull(),
  senha: text('senha').notNull()
});

export const usuarioRelations = relations(usuario, ({ one }) => ({
  pessoa: one(pessoa)
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
  dono: one(pessoa),
  anuncio: one(anuncio)
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
