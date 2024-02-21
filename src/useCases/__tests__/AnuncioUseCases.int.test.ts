import { db, sql } from '@/data/db';
import { AnuncioUseCases } from '../AnuncioUseCases';
import { ImovelUseCases } from '../ImovelUseCases';
import { MockData, setupData } from './utils';
import { createLogger } from '@/logging';

describe('Anuncio use cases testes', () => {
  const log = createLogger({ trace_id: 'integration_test' });

  const imovelUseCases = new ImovelUseCases(log);
  const anuncioUseCases = new AnuncioUseCases(log);

  let mockData: MockData;

  beforeEach(async () => {
    mockData = await setupData();
  });

  afterAll(async () => {
    await sql.end();
  });

  describe('ao criar anúncio', () => {
    it('não deve permitir criar anúncio se usuário solicitante não for encontrado', async () => {
      const pessoa = mockData.empresas[0].pessoas[0];

      const imovelCodigo = await imovelUseCases.cadastrarImovel({
        codigoUsuarioSolicitante: pessoa.usuario?.codigo ?? '',
        endereco: 'endereco',
        metrosQuadrados: 222
      });

      await expect(
        anuncioUseCases.criarAnuncio({
          codigoUsuarioSolicitante: 'non_existing',
          codigoImovel: imovelCodigo,
          valor: '2',
          valorCondominio: '1',
          valorIPTU: '1'
        })
      ).rejects.toThrow('Pessoa associada á conta não encontrada.');
    });

    it('não deve permitir criar anúncio se o imóvel não for encontrado', () => {
      const pessoa = mockData.empresas[0].pessoas[0];

      return expect(
        anuncioUseCases.criarAnuncio({
          codigoUsuarioSolicitante: pessoa.usuario?.codigo ?? '',
          codigoImovel: 'non_existing',
          valor: '2',
          valorCondominio: '1',
          valorIPTU: '1'
        })
      ).rejects.toThrow('Imóvel não encontrado.');
    });

    it('não deve permitir criar anúncio se usuário solicitante não for funcionário da imobiliária', async () => {
      const pessoa = mockData.empresas[0].pessoas[0];
      const cliente = mockData.empresas[0].clientes[0];

      const codigoImovel = await imovelUseCases.cadastrarImovel({
        codigoUsuarioSolicitante: pessoa.usuario?.codigo ?? '',
        endereco: 'endereco',
        metrosQuadrados: 222
      });

      await expect(
        anuncioUseCases.criarAnuncio({
          codigoUsuarioSolicitante: cliente.usuario?.codigo ?? '',
          codigoImovel,
          valor: '2',
          valorCondominio: '1',
          valorIPTU: '1'
        })
      ).rejects.toThrow(
        'Apenas funcionários da imobiliária ou o dono do imóvel podem criar um anúncio.'
      );
    });

    it('não deve permitir criar anúncio caso imóvel já possua anúncio', async () => {
      const pessoa = mockData.empresas[0].pessoas[0];

      const codigoImovel = await imovelUseCases.cadastrarImovel({
        codigoUsuarioSolicitante: pessoa.usuario?.codigo ?? '',
        endereco: 'endereco',
        metrosQuadrados: 222
      });

      await anuncioUseCases.criarAnuncio({
        codigoUsuarioSolicitante: pessoa.usuario?.codigo ?? '',
        codigoImovel,
        valor: '1',
        valorCondominio: '2',
        valorIPTU: '3'
      });

      await expect(
        anuncioUseCases.criarAnuncio({
          codigoUsuarioSolicitante: pessoa.usuario?.codigo ?? '',
          codigoImovel,
          valor: '1',
          valorCondominio: '2',
          valorIPTU: '3'
        })
      ).rejects.toThrow('Imóvel já possui anúncio vinculado.');
    });

    it('deve criar anúncio com dados corretos', async () => {
      const pessoa = mockData.empresas[0].pessoas[0];

      const codigoImovel = await imovelUseCases.cadastrarImovel({
        codigoUsuarioSolicitante: pessoa.usuario?.codigo ?? '',
        endereco: 'endereco',
        metrosQuadrados: 222
      });

      const anuncioCriado = await anuncioUseCases.criarAnuncio({
        codigoUsuarioSolicitante: pessoa.usuario?.codigo ?? '',
        codigoImovel,
        valor: '1',
        valorCondominio: '2',
        valorIPTU: '3'
      });

      const queryResult = await db.query.imovel.findFirst({
        with: {
          anuncio: true
        },
        where: ({ codigo }, { eq }) => eq(codigo, codigoImovel)
      });

      expect(queryResult?.anuncio.idImovel).toBe(queryResult?.id);
      expect(queryResult?.anuncio.valor).toBe(1);
      expect(queryResult?.anuncio.valorCondominio).toBe(2);
      expect(queryResult?.anuncio.valorIPTU).toBe(3);

      expect(queryResult?.anuncio.codigo).toBe(anuncioCriado.codigo);
      expect(queryResult?.anuncio.valor.toString()).toBe(anuncioCriado.valor);
      expect(queryResult?.anuncio.valorCondominio.toString()).toBe(
        anuncioCriado.valorCondominio
      );
      expect(queryResult?.anuncio.valorIPTU.toString()).toBe(
        anuncioCriado.valorIPTU
      );
    });
  });

  describe('ao alterar anúncio', () => {
    it('não deve alterar anúncio se usuário solicitante não for encontrado', async () => {
      const pessoa = mockData.empresas[0].pessoas[0];

      const codigoImovel = await imovelUseCases.cadastrarImovel({
        codigoUsuarioSolicitante: pessoa.usuario?.codigo ?? '',
        endereco: 'endereco',
        metrosQuadrados: 222
      });

      const anuncio = await anuncioUseCases.criarAnuncio({
        codigoUsuarioSolicitante: pessoa.usuario?.codigo ?? '',
        codigoImovel,
        valor: '2',
        valorCondominio: '1',
        valorIPTU: '1'
      });

      return expect(
        anuncioUseCases.alterarAnuncio({
          codigoUsuarioSolicitante: 'non_existing',
          codigoAnuncio: anuncio.codigo,
          valor: '3',
          valorCondominio: '4',
          valorIPTU: '5'
        })
      ).rejects.toThrow('Pessoa associada á conta não encontrada.');
    });

    it('não deve alterar anúncio caso anúncio não seja encontrado', async () => {
      const pessoa = mockData.empresas[0].pessoas[0];

      await expect(
        anuncioUseCases.alterarAnuncio({
          codigoUsuarioSolicitante: pessoa.usuario?.codigo ?? '',
          codigoAnuncio: 'non_existing',
          valor: '3',
          valorCondominio: '4',
          valorIPTU: '5'
        })
      ).rejects.toThrow('Anúncio não encontrado.');
    });

    it('não deve permitir alterar anúncio se usuário solicitante não for funcionário da imobiliária', async () => {
      const empresa = mockData.empresas[0];
      const pessoa = empresa.pessoas[0];

      const codigoImovel = await imovelUseCases.cadastrarImovel({
        codigoUsuarioSolicitante: pessoa.usuario?.codigo ?? '',
        endereco: 'endereco',
        metrosQuadrados: 222
      });

      const anuncio = await anuncioUseCases.criarAnuncio({
        codigoUsuarioSolicitante: pessoa.usuario?.codigo ?? '',
        codigoImovel,
        valor: '2',
        valorCondominio: '1',
        valorIPTU: '1'
      });

      const cliente = empresa.clientes[0];

      await expect(
        anuncioUseCases.alterarAnuncio({
          codigoUsuarioSolicitante: cliente.usuario?.codigo ?? '',
          codigoAnuncio: anuncio.codigo,
          valor: '3',
          valorCondominio: '4',
          valorIPTU: '5'
        })
      ).rejects.toThrow(
        'Alteração só pode ser feita por funcionário da imobiliária ou dono do imóvel.'
      );
    });

    it('deve alterar anúncio com dados corretos pelo dono do imóvel', async () => {
      const cliente = mockData.empresas[0].clientes[0];

      const codigoImovel = await imovelUseCases.cadastrarImovel({
        codigoUsuarioSolicitante: cliente.usuario?.codigo ?? '',
        endereco: 'endereco',
        metrosQuadrados: 222
      });

      const anuncio = await anuncioUseCases.criarAnuncio({
        codigoUsuarioSolicitante: cliente.usuario?.codigo ?? '',
        codigoImovel,
        valor: '2',
        valorCondominio: '1',
        valorIPTU: '1'
      });

      const alteracaoResult = await anuncioUseCases.alterarAnuncio({
        codigoUsuarioSolicitante: cliente.usuario?.codigo ?? '',
        codigoAnuncio: anuncio.codigo,
        valor: '3',
        valorCondominio: '4',
        valorIPTU: '5'
      });

      const queryResult = await db.query.anuncio.findFirst({
        where: ({ codigo }, { eq }) => eq(codigo, anuncio.codigo)
      });

      expect(queryResult?.valor).toBe('3');
      expect(queryResult?.valorCondominio).toBe('4');
      expect(queryResult?.valorIPTU).toBe('5');

      expect(alteracaoResult.valor).toBe('3');
      expect(alteracaoResult.valorCondominio).toBe('4');
      expect(alteracaoResult.valorIPTU).toBe('5');
    });

    it('deve alterar anúncio com dados corretos pelo funcionário da empresa', async () => {
      const empresa = mockData.empresas[0];
      const cliente = empresa.clientes[0];

      const codigoImovel = await imovelUseCases.cadastrarImovel({
        codigoUsuarioSolicitante: cliente.usuario?.codigo ?? '',
        endereco: 'endereco',
        metrosQuadrados: 222
      });

      const anuncio = await anuncioUseCases.criarAnuncio({
        codigoUsuarioSolicitante: cliente.usuario?.codigo ?? '',
        codigoImovel,
        valor: '2',
        valorCondominio: '1',
        valorIPTU: '1'
      });

      const funcionario = empresa.pessoas[0];

      const alteracaoResult = await anuncioUseCases.alterarAnuncio({
        codigoUsuarioSolicitante: funcionario.usuario?.codigo ?? '',
        codigoAnuncio: anuncio.codigo,
        valor: '3',
        valorCondominio: '4',
        valorIPTU: '5'
      });

      const queryResult = await db.query.anuncio.findFirst({
        where: ({ codigo }, { eq }) => eq(codigo, anuncio.codigo)
      });

      expect(queryResult?.valor).toBe('3');
      expect(queryResult?.valorCondominio).toBe('4');
      expect(queryResult?.valorIPTU).toBe('5');

      expect(alteracaoResult.valor).toBe('3');
      expect(alteracaoResult.valorCondominio).toBe('4');
      expect(alteracaoResult.valorIPTU).toBe('5');
    });
  });

  describe('ao obter anuncio do imovel', () => {
    it('deve lançar erro caso imóvel não seja encontrado', () => {
      return expect(
        anuncioUseCases.obterAnuncioDoImovel('non_existing')
      ).rejects.toThrow('Imóvel não encontrado.');
    });

    it('não deve retornar nada caso imóvel não possua anúncio cadastrado', async () => {
      const pessoa = mockData.empresas[0].pessoas[0];

      const codigoImovel = await imovelUseCases.cadastrarImovel({
        codigoUsuarioSolicitante: pessoa.usuario?.codigo ?? '',
        endereco: 'endereco',
        metrosQuadrados: 10
      });

      const anuncio = await anuncioUseCases.obterAnuncioDoImovel(codigoImovel);
      expect(anuncio).toBeUndefined();
    });

    it('deve retornar anúncio corretamente', async () => {
      const pessoa = mockData.empresas[0].pessoas[0];

      const codigoImovel = await imovelUseCases.cadastrarImovel({
        codigoUsuarioSolicitante: pessoa.usuario?.codigo ?? '',
        endereco: 'endereco',
        metrosQuadrados: 10
      });

      const criacaoAnuncioResult = await anuncioUseCases.criarAnuncio({
        codigoUsuarioSolicitante: pessoa.usuario?.codigo ?? '',
        codigoImovel,
        valor: '10',
        valorCondominio: '20',
        valorIPTU: '30'
      });

      const anuncio = await anuncioUseCases.obterAnuncioDoImovel(codigoImovel);

      expect(anuncio?.codigo).toBe(criacaoAnuncioResult.codigo);
      expect(anuncio?.valor).toBe('10');
      expect(anuncio?.valorCondominio).toBe('20');
      expect(anuncio?.valorIPTU).toBe('30');
    });
  });
});
