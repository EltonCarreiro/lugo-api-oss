import { DbTransaction, db } from '@/data/db';
import {
  anuncio as anuncioTable,
  empresa as empresaTable,
  imovel as imovelTable,
  pessoa as pessoaTable,
  usuario as usuarioTable
} from '@/schema';
import { Senha } from '@/valueObjects/Senha';
import { customAlphabet, nanoid } from 'nanoid';

export type MockData = Awaited<ReturnType<typeof setupData>>;

export const setupData = async () => {
  await cleanupData();
  return db.transaction(async (trx) => {
    const empresa: typeof empresaTable.$inferInsert = {
      cnpj: '12345678000100',
      codigo: 'empresa_fake_1',
      nomeFantasia: 'nome_fantasia',
      razaoSocial: 'razao_social'
    };

    const empresaInsertResult = await trx
      .insert(empresaTable)
      .values(empresa)
      .returning({ id: empresaTable.id });

    const idEmpresa = empresaInsertResult[0]?.id;

    const empresa2: typeof empresaTable.$inferInsert = {
      cnpj: '12345678000101',
      codigo: 'empresa_fake_2',
      nomeFantasia: 'nome_fantasia_2',
      razaoSocial: 'razao_social_2'
    };

    const empresa2InsertResult = await trx
      .insert(empresaTable)
      .values(empresa2)
      .returning({ id: empresaTable.id });

    const idEmpresa2 = empresa2InsertResult[0]?.id;

    const result = {
      empresas: [
        {
          ...empresa,
          id: idEmpresa,
          pessoas: [
            await criarPessoa(
              {
                idEmpresa,
                tipo: 'funcionario',
                includeUser: true
              },
              trx
            ),
            await criarPessoa(
              {
                idEmpresa,
                tipo: 'funcionario',
                includeUser: false
              },
              trx
            ),
            await criarPessoa(
              {
                idEmpresa,
                tipo: 'funcionario',
                includeUser: true
              },
              trx
            )
          ],
          clientes: [
            await criarPessoa(
              {
                idEmpresa,
                tipo: 'cliente',
                includeUser: true
              },
              trx
            ),
            await criarPessoa(
              {
                idEmpresa,
                tipo: 'cliente',
                includeUser: false
              },
              trx
            )
          ]
        },
        {
          ...empresa2,
          id: idEmpresa2,
          pessoas: [
            await criarPessoa(
              {
                idEmpresa: idEmpresa2,
                tipo: 'funcionario',
                includeUser: true
              },
              trx
            )
          ],
          clientes: []
        }
      ],
      pessoas: [
        await criarPessoa(
          {
            idEmpresa: undefined,
            tipo: 'cliente',
            includeUser: true
          },
          trx
        )
      ],
      clientes: []
    };

    return result;
  });
};

export const cleanupData = () => {
  return db.transaction(async (trx) => {
    await trx.delete(usuarioTable);
    await trx.delete(anuncioTable);
    await trx.delete(imovelTable);
    await trx.delete(pessoaTable);
    await trx.delete(empresaTable);
  });
};

const criarPessoa = async (
  {
    idEmpresa,
    tipo,
    includeUser = false
  }: {
    idEmpresa?: number;
    tipo: 'cliente' | 'funcionario';
    includeUser?: boolean;
  },
  trx: DbTransaction
) => {
  const pessoa: typeof pessoaTable.$inferInsert = {
    codigo: nanoid(),
    idEmpresa,
    cpf: gerarCpf(),
    nome: nanoid(),
    sobrenome: nanoid(),
    tipo
  };

  const pessoaInsertResult = await trx
    .insert(pessoaTable)
    .values(pessoa)
    .returning({ id: pessoaTable.id });

  const idPessoa = pessoaInsertResult[0]?.id;

  let usuarioRes:
    | (typeof usuarioTable.$inferInsert & { id: number })
    | undefined;

  if (includeUser) {
    const usuario: typeof usuarioTable.$inferInsert = {
      idPessoa: idPessoa,
      codigo: nanoid(),
      email: `${nanoid()}@mail.com`,
      senha: 'passw0rd'
    };

    const usuarioInsertResult = await trx
      .insert(usuarioTable)
      .values({ ...usuario, senha: new Senha(usuario.senha).value })
      .returning({ id: usuarioTable.id });

    const idUsuario = usuarioInsertResult[0]?.id;

    usuarioRes = { ...usuario, id: idUsuario };
  }

  const result = { ...pessoa, id: idPessoa, usuario: usuarioRes };

  return result;
};

export const gerarCpf = () => customAlphabet('0123456789', 11)(11);
export const gerarCnpj = () => customAlphabet('0123456789', 14)(14);
