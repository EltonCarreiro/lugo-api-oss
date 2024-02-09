import { db, sql } from '@/data/db';
import { ImovelUseCases } from '../ImovelUseCases';
import { MockData, setupData } from './utils';
import { createLogger } from '@/logging';

describe('Imovel use cases testes', () => {
  let mockData: MockData;
  const log = createLogger({ trace_id: 'integration_test' });
  const imovelUseCases = new ImovelUseCases(log);

  beforeEach(async () => {
    mockData = await setupData();
  });

  afterAll(async () => {
    await sql.end();
  });

  describe('ao cadastrar imóvel', () => {
    it('não deve permitir associar conta caso pessoa não seja encontrada', () => {
      expect(
        imovelUseCases.cadastrarImovel({
          codigoUsuarioSolicitante: 'non_existing_user',
          endereco: 'fake_endereco',
          metrosQuadrados: 1
        })
      ).rejects.toThrow('Pessoa associada á conta não encontrada.');
    });

    it('não deve permitir cadastrar caso usuario solicitante não seja o dono e não seja funcionário', () => {
      const pessoa = mockData.empresas[0].pessoas[0];
      const pessoaSemEmpresa = mockData.pessoas[0];

      expect(
        imovelUseCases.cadastrarImovel({
          codigoUsuarioSolicitante: pessoaSemEmpresa.usuario?.codigo ?? '',
          codigoDono: pessoa.codigo,
          endereco: 'fake_endereco',
          metrosQuadrados: 123
        })
      ).rejects.toThrow(
        'Usuário solicitante precisa ser funcionário para cadastrar imóvel para outra pessoa.'
      );
    });

    it('não deve permitir cadastrar caso usuario seja funcionário de uma empresa diferente da do usuário solicitante', () => {
      const pessoa = mockData.empresas[0].pessoas[0];
      const pessoaSemEmpresa = mockData.pessoas[0];

      expect(
        imovelUseCases.cadastrarImovel({
          codigoUsuarioSolicitante: pessoa.usuario?.codigo ?? '',
          codigoDono: pessoaSemEmpresa.codigo,
          endereco: 'fake_endereco',
          metrosQuadrados: 123
        })
      ).rejects.toThrow(
        'Funcionário só pode alterar imóveis atrelados á própria empresa.'
      );
    });

    it('deve cadastrar imóvel com dados corretos e tornar usuario solicitante o dono', async () => {
      const pessoa = mockData.empresas[0].pessoas[0];

      const codigoImovelCadastrado = await imovelUseCases.cadastrarImovel({
        codigoUsuarioSolicitante: pessoa.usuario?.codigo ?? '',
        endereco: 'fake_endereco',
        metrosQuadrados: 123
      });

      const queryResult = await db.query.imovel.findFirst({
        where: ({ codigo }, { eq }) => eq(codigo, codigoImovelCadastrado)
      });

      expect(queryResult?.codigo).toBe(codigoImovelCadastrado);
      expect(queryResult?.endereco).toBe('fake_endereco');
      expect(queryResult?.metrosQuadrados).toBe(123);
      expect(queryResult?.idDono).toBe(pessoa.id);
    });

    it('deve cadastrar imóvel com conta de funcionário associado á mesma empresa e associar a dono existente', async () => {
      const empresa = mockData.empresas[0];
      const pessoa = empresa.pessoas[0];
      const pessoa2 = empresa.pessoas[1];

      const codigoImovelCadastrado = await imovelUseCases.cadastrarImovel({
        codigoUsuarioSolicitante: pessoa.usuario?.codigo ?? '',
        codigoDono: pessoa2.codigo,
        endereco: 'fake_endereco',
        metrosQuadrados: 123
      });

      const queryResult = await db.query.imovel.findFirst({
        where: ({ codigo }, { eq }) => eq(codigo, codigoImovelCadastrado)
      });

      expect(queryResult?.codigo).toBe(codigoImovelCadastrado);
      expect(queryResult?.endereco).toBe('fake_endereco');
      expect(queryResult?.metrosQuadrados).toBe(123);
      expect(queryResult?.idDono).toBe(pessoa2.id);
    });
  });

  describe('ao alterar imóvel', () => {
    it('não deve alterar imóvel caso o usuário solicitante não seja encontrado', async () => {
      const pessoa = mockData.empresas[0].pessoas[0];

      const codigoImovel = await imovelUseCases.cadastrarImovel({
        codigoUsuarioSolicitante: pessoa.usuario?.codigo ?? '',
        endereco: 'fake_endereco',
        metrosQuadrados: 321
      });

      await expect(
        imovelUseCases.alterarImovel({
          codigoImovel: codigoImovel,
          codigoUsuarioSolicitante: 'non_existing_usuario',
          endereco: 'fake_endereco_atualizado',
          metrosQuadrados: 555
        })
      ).rejects.toThrow('Usuário solicitante não encontrado.');
    });

    it('não deve alterar imóvel caso o mesmo não seja encontrado', () => {
      const pessoa = mockData.empresas[0].pessoas[0];

      expect(
        imovelUseCases.alterarImovel({
          codigoImovel: 'non_existing_imovel',
          codigoUsuarioSolicitante: pessoa.usuario?.codigo ?? '',
          endereco: 'fake_endereco',
          metrosQuadrados: 1
        })
      ).rejects.toThrow('Imóvel não encontrado.');
    });

    it('não deve alterar imóvel caso alteração seja feita por usuário cliente que não seja dono do imóvel', async () => {
      const pessoa = mockData.empresas[0].pessoas[0];
      const pessoa4 = mockData.empresas[0].pessoas[3];

      const codigoImovel = await imovelUseCases.cadastrarImovel({
        codigoUsuarioSolicitante: pessoa.usuario?.codigo ?? '',
        endereco: 'fake_endereco',
        metrosQuadrados: 321
      });

      await expect(
        imovelUseCases.alterarImovel({
          codigoImovel: codigoImovel,
          codigoUsuarioSolicitante: pessoa4.usuario?.codigo ?? '',
          endereco: 'fake_endereco_atualizado',
          metrosQuadrados: 555
        })
      ).rejects.toThrow(
        'Imóvel só pode ser alterado pelo dono ou funcionário da imobiliária.'
      );
    });

    it('não deve alterar imóvel caso alteração seja feita por usuário funcionário que não esteja associado á mesma empresa', async () => {
      const pessoa1Empresa1 = mockData.empresas[0].pessoas[0];
      const pessoa1Empresa2 = mockData.empresas[1].pessoas[0];

      const codigoImovel = await imovelUseCases.cadastrarImovel({
        codigoUsuarioSolicitante: pessoa1Empresa1.usuario?.codigo ?? '',
        endereco: 'fake_endereco',
        metrosQuadrados: 321
      });

      return expect(
        imovelUseCases.alterarImovel({
          codigoImovel: codigoImovel,
          codigoUsuarioSolicitante: pessoa1Empresa2.usuario?.codigo ?? '',
          endereco: 'fake_endereco_atualizado',
          metrosQuadrados: 555
        })
      ).rejects.toThrow(
        'Imóvel só pode ser alterado pelo dono ou funcionário da imobiliária.'
      );
    });

    it('deve permitir alterar imóvel corretamente pelo dono do imóvel', async () => {
      const pessoa = mockData.empresas[0].pessoas[0];

      const codigoImovel = await imovelUseCases.cadastrarImovel({
        codigoUsuarioSolicitante: pessoa.usuario?.codigo ?? '',
        endereco: 'fake_endereco',
        metrosQuadrados: 321
      });

      await imovelUseCases.alterarImovel({
        codigoImovel,
        codigoUsuarioSolicitante: pessoa.usuario?.codigo ?? '',
        endereco: 'novo_endereco',
        metrosQuadrados: 333
      });

      const queryResult = await db.query.imovel.findFirst({
        where: ({ codigo }, { eq }) => eq(codigo, codigoImovel)
      });

      expect(queryResult?.codigo).toBe(codigoImovel);
      expect(queryResult?.endereco).toBe('novo_endereco');
      expect(queryResult?.metrosQuadrados).toBe(333);
      expect(queryResult?.idDono).toBe(pessoa.id);
    });

    it('deve permitir alterar imóvel corretamente por algum funcionário', async () => {
      const pessoa = mockData.empresas[0].pessoas[0];
      const pessoa3 = mockData.empresas[0].pessoas[2];

      const codigoImovel = await imovelUseCases.cadastrarImovel({
        codigoUsuarioSolicitante: pessoa.usuario?.codigo ?? '',
        endereco: 'fake_endereco',
        metrosQuadrados: 321
      });

      await imovelUseCases.alterarImovel({
        codigoImovel,
        codigoUsuarioSolicitante: pessoa3.usuario?.codigo ?? '',
        endereco: 'novo_endereco',
        metrosQuadrados: 333
      });

      const queryResult = await db.query.imovel.findFirst({
        where: ({ codigo }, { eq }) => eq(codigo, codigoImovel)
      });

      expect(queryResult?.codigo).toBe(codigoImovel);
      expect(queryResult?.endereco).toBe('novo_endereco');
      expect(queryResult?.metrosQuadrados).toBe(333);
      expect(queryResult?.idDono).toBe(pessoa.id);
    });
  });
});
