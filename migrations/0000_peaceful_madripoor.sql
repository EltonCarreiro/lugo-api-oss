CREATE SCHEMA "lugo";
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "tipo_pessoa" AS ENUM('funcionario', 'cliente');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lugo"."anuncio" (
	"id" serial PRIMARY KEY NOT NULL,
	"imovel_id" integer NOT NULL,
	"valor" numeric NOT NULL,
	"valor_condominio" numeric NOT NULL,
	"valor_iptu" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lugo"."empresa" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" text NOT NULL,
	"cnpj" text NOT NULL,
	"nome_fantasia" text NOT NULL,
	"razao_social" text NOT NULL,
	CONSTRAINT "empresa_codigo_unique" UNIQUE("codigo"),
	CONSTRAINT "empresa_cnpj_unique" UNIQUE("cnpj")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lugo"."imovel" (
	"id" serial PRIMARY KEY NOT NULL,
	"dono_id" integer NOT NULL,
	"codigo" text NOT NULL,
	"metros_quadrados" integer,
	"endereco" text NOT NULL,
	CONSTRAINT "imovel_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lugo"."pessoa" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" text NOT NULL,
	"empresa_id" integer,
	"nome" text NOT NULL,
	"sobrenome" text NOT NULL,
	"cpf" text NOT NULL,
	"tipo" "tipo_pessoa",
	CONSTRAINT "pessoa_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lugo"."usuario" (
	"id" serial PRIMARY KEY NOT NULL,
	"pessoa_id" integer NOT NULL,
	"codigo" text NOT NULL,
	"email" text NOT NULL,
	"senha" text NOT NULL,
	CONSTRAINT "usuario_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lugo"."anuncio" ADD CONSTRAINT "anuncio_imovel_id_imovel_id_fk" FOREIGN KEY ("imovel_id") REFERENCES "lugo"."imovel"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lugo"."imovel" ADD CONSTRAINT "imovel_dono_id_pessoa_id_fk" FOREIGN KEY ("dono_id") REFERENCES "lugo"."pessoa"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lugo"."pessoa" ADD CONSTRAINT "pessoa_empresa_id_empresa_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "lugo"."empresa"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lugo"."usuario" ADD CONSTRAINT "usuario_pessoa_id_pessoa_id_fk" FOREIGN KEY ("pessoa_id") REFERENCES "lugo"."pessoa"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
