CREATE SCHEMA "lugo";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lugo"."anuncio" (
	"id" serial PRIMARY KEY NOT NULL,
	"imovel_id" integer NOT NULL,
	"valor" numeric NOT NULL,
	"valor_condominio" numeric NOT NULL,
	"valor_iptu" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lugo"."imovel" (
	"id" serial PRIMARY KEY NOT NULL,
	"dono_id" integer NOT NULL,
	"codigo" text,
	"metros_quadrados" integer,
	"endereco" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lugo"."pessoa" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" text NOT NULL,
	"nome" text NOT NULL,
	"sobrenome" text NOT NULL,
	"cpf" text NOT NULL,
	CONSTRAINT "pessoa_codigo_unique" UNIQUE("codigo"),
	CONSTRAINT "pessoa_cpf_unique" UNIQUE("cpf")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lugo"."usuario" (
	"id" serial PRIMARY KEY NOT NULL,
	"pessoa_id" integer,
	"codigo" text NOT NULL,
	"email" text,
	"senha" text,
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
 ALTER TABLE "lugo"."usuario" ADD CONSTRAINT "usuario_pessoa_id_pessoa_id_fk" FOREIGN KEY ("pessoa_id") REFERENCES "lugo"."pessoa"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
