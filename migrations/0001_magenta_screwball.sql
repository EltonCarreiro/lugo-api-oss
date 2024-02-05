DO $$ BEGIN
 CREATE TYPE "tipo_pessoa" AS ENUM('funcionario', 'cliente');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
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
ALTER TABLE "lugo"."pessoa" DROP CONSTRAINT "pessoa_cpf_unique";--> statement-breakpoint
ALTER TABLE "lugo"."imovel" ALTER COLUMN "codigo" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "lugo"."imovel" ALTER COLUMN "endereco" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "lugo"."usuario" ALTER COLUMN "pessoa_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "lugo"."pessoa" ADD COLUMN "empresa_id" integer;--> statement-breakpoint
ALTER TABLE "lugo"."pessoa" ADD COLUMN "tipo" "tipo_pessoa";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lugo"."pessoa" ADD CONSTRAINT "pessoa_empresa_id_empresa_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "lugo"."empresa"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "lugo"."imovel" ADD CONSTRAINT "imovel_codigo_unique" UNIQUE("codigo");--> statement-breakpoint
ALTER TABLE "lugo"."pessoa" ADD CONSTRAINT "pessoa_empresa_id_cpf_unique" UNIQUE("empresa_id","cpf");