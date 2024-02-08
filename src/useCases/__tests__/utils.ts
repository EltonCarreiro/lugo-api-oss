import { db } from '@/data/db';
import {
  empresa as empresaTable,
  pessoa as pessoaTable,
  usuario as usuarioTable
} from '@/schema';

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

    const pessoa: typeof pessoaTable.$inferInsert = {
      codigo: 'fake_pessoa_1',
      idEmpresa,
      cpf: '11111111111',
      nome: 'john',
      sobrenome: 'doe',
      tipo: 'funcionario'
    };

    const pessoaInsertResult = await trx
      .insert(pessoaTable)
      .values(pessoa)
      .returning({ id: pessoaTable.id });

    const idPessoa = pessoaInsertResult[0]?.id;

    const pessoa2: typeof pessoaTable.$inferInsert = {
      codigo: 'fake_pessoa_2',
      idEmpresa,
      cpf: '11111111112',
      nome: 'john',
      sobrenome: 'doe',
      tipo: 'funcionario'
    };

    const pessoaInsertResult2 = await trx
      .insert(pessoaTable)
      .values(pessoa2)
      .returning({ id: pessoaTable.id });

    const idPessoa2 = pessoaInsertResult2[0]?.id;

    const pessoaSemEmpresa: typeof pessoaTable.$inferInsert = {
      codigo: 'fake_pessoa_3',
      idEmpresa: undefined,
      cpf: '11111111113',
      nome: 'John (sem empresa)',
      sobrenome: 'Doe (sem empresa)',
      tipo: 'funcionario'
    };

    const pessoaSemEmpresaResult = await trx
      .insert(pessoaTable)
      .values(pessoaSemEmpresa)
      .returning({ id: pessoaTable.id });

    const idPessoaSemEmpresa = pessoaSemEmpresaResult[0]?.id;

    const pessoaUsuario: typeof usuarioTable.$inferInsert = {
      idPessoa: idPessoa,
      codigo: 'fake_pessoa_1_usuario',
      email: 'fake_pessoa_1@mail.com',
      senha: 'passw0rd'
    };

    const usuarioResult = await trx
      .insert(usuarioTable)
      .values(pessoaUsuario)
      .returning({ id: usuarioTable.id });

    const idUsuario = usuarioResult[0]?.id;

    const usuarioSemEmpresa: typeof usuarioTable.$inferInsert = {
      idPessoa: idPessoaSemEmpresa,
      codigo: 'fake_pessoa_3_usuario',
      email: 'fake_pessoa_3@mail.com',
      senha: 'passw0rd'
    };

    const usuarioSemEmpresaResult = await trx
      .insert(usuarioTable)
      .values(usuarioSemEmpresa)
      .returning({ id: usuarioTable.id });

    const idUsuarioSemEmpresa = usuarioSemEmpresaResult[0]?.id;

    return {
      empresa: { ...empresa, id: idEmpresa },
      usuario: { ...pessoaUsuario, id: idUsuario },
      pessoa: { ...pessoa, id: idPessoa },
      pessoa2: { ...pessoa2, id: idPessoa2 },
      pessoaSemEmpresa: { ...pessoaSemEmpresa, id: idPessoaSemEmpresa },
      usuarioSemEmpresa: { ...usuarioSemEmpresa, id: idUsuarioSemEmpresa }
    };
  });
};

export const cleanupData = () => {
  return db.transaction(async (trx) => {
    await trx.delete(usuarioTable);
    await trx.delete(pessoaTable);
    await trx.delete(empresaTable);
  });
};
