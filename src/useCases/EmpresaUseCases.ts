import { db } from '@/data/db';
import { Empresa } from '@/entities/Empresa';
import { empresa as empresaTable } from '@/schema';
import { BusinessError } from '@/shared/errors/BusinessError';
import { nanoid } from 'nanoid';

interface CriarEmpresaArgs {
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
}

type CriarEmpresaResult = CriarEmpresaArgs & { codigo: string };

interface AlterarEmpresaArgs {
  codigo: string;
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
}

type AlterarEmpresaResult = AlterarEmpresaArgs;

export class EmpresaUseCases {
  public criarEmpresa({
    nomeFantasia,
    razaoSocial,
    cnpj
  }: CriarEmpresaArgs): Promise<CriarEmpresaResult> {
    const codigo = nanoid();
    const novaEmpresa = new Empresa(codigo, nomeFantasia, razaoSocial, cnpj);

    return db.transaction(async (trx): Promise<CriarEmpresaResult> => {
      const empresaExistente = await trx.query.empresa.findFirst({
        columns: {
          cnpj: true
        },
        where: ({ cnpj }, { eq }) => eq(cnpj, novaEmpresa.cnpj.value)
      });

      if (empresaExistente !== undefined) {
        throw new BusinessError('Empresa já cadastrada com CNPJ informado.');
      }

      await trx.insert(empresaTable).values({
        codigo: novaEmpresa.codigo,
        cnpj: novaEmpresa.cnpj.value,
        nomeFantasia: novaEmpresa.nomeFantasia,
        razaoSocial: novaEmpresa.razaoSocial
      });

      return {
        codigo: novaEmpresa.codigo,
        cnpj: novaEmpresa.cnpj.value,
        nomeFantasia: novaEmpresa.nomeFantasia,
        razaoSocial: novaEmpresa.razaoSocial
      };
    });
  }

  public alterarEmpresa({
    codigo,
    nomeFantasia,
    razaoSocial,
    cnpj
  }: AlterarEmpresaArgs): Promise<AlterarEmpresaResult> {
    return db.transaction(async (trx): Promise<AlterarEmpresaResult> => {
      const empresaExistente = await trx.query.empresa.findFirst({
        where: ({ codigo: codigoEmpresaExistente }, { eq }) =>
          eq(codigoEmpresaExistente, codigo)
      });

      if (empresaExistente === undefined) {
        throw new BusinessError('Empresa não encontrada.');
      }

      const empresa = new Empresa(
        empresaExistente.codigo,
        empresaExistente.nomeFantasia,
        empresaExistente.razaoSocial,
        empresaExistente.cnpj
      );

      empresa.alterarDados(nomeFantasia, razaoSocial, cnpj);

      await trx.update(empresaTable).set({
        nomeFantasia: empresa.nomeFantasia,
        razaoSocial: empresa.razaoSocial,
        cnpj: empresa.cnpj.value
      });

      return {
        codigo: empresa.codigo,
        nomeFantasia: empresa.nomeFantasia,
        razaoSocial: empresa.razaoSocial,
        cnpj: empresa.cnpj.value
      };
    });
  }
}
