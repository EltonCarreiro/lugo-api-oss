ALTER TABLE "lugo"."anuncio" ADD COLUMN "codigo" text NOT NULL;--> statement-breakpoint
ALTER TABLE "lugo"."anuncio" ADD CONSTRAINT "anuncio_codigo_unique" UNIQUE("codigo");--> statement-breakpoint
ALTER TABLE "lugo"."pessoa" ADD CONSTRAINT "pessoa_empresa_id_cpf_unique" UNIQUE("empresa_id","cpf");