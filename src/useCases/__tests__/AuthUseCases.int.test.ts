import { getRedisClient } from '@/data/redis';
import { AuthUseCases } from '../AuthUseCases';
import { MockData, setupData } from './utils';
import { sql } from '@/data/db';

describe('Auth use cases testes', () => {
  let authUseCases: AuthUseCases;
  let mockData: MockData;

  beforeAll(async () => {
    const redis = await getRedisClient();
    authUseCases = new AuthUseCases(
      {
        algorithm: 'HS256',
        secret: 'my-secret'
      },
      1,
      redis
    );
  });

  afterAll(async () => {
    await sql.end();
    const redis = await getRedisClient();
    await redis.quit();
  });

  beforeEach(async () => {
    mockData = await setupData();
  });

  describe('ao realizar login', () => {
    it('deve retornar usuario ou senha incorretos caso usuário não exista', () => {
      expect(
        authUseCases.login({
          email: 'non_existing@mail.com',
          senha: 'passw0rd'
        })
      ).rejects.toThrow('Usuário/Senha incorretos.');
    });

    it('deve retornar usuario ou senha incorretos caso senha esteja incorreta', () => {
      const pessoa = mockData.empresas[0].pessoas[0];

      expect(
        authUseCases.login({
          email: pessoa.usuario?.email ?? '',
          senha: 'wrong_passw0rd'
        })
      ).rejects.toThrow('Usuário/Senha incorretos.');
    });

    it('deve realizar login e retornar usuario logado corretamente', async () => {
      const pessoa = mockData.empresas[0].pessoas[0];

      const jwt = await authUseCases.login({
        email: pessoa.usuario?.email ?? '',
        senha: pessoa.usuario?.senha ?? ''
      });

      const usuarioLogado = await authUseCases.obterUsuarioLogado(jwt);
      expect(usuarioLogado?.codigo).toBe(pessoa.usuario?.codigo);
      expect(usuarioLogado?.email).toBe(pessoa.usuario?.email);
    });
  });

  describe('ao realizar logout', () => {
    it('não deve fazer nada caso jwt esteja inválido', () => {
      expect(authUseCases.logout('invalid_jwt')).resolves.not.toThrow();
    });

    it('deve realizar logout com sucesso', async () => {
      const pessoa = mockData.empresas[0].pessoas[0];

      const jwt = await authUseCases.login({
        email: pessoa.usuario?.email ?? '',
        senha: pessoa.usuario?.senha ?? ''
      });

      await authUseCases.logout(jwt);

      const usuarioLogado = await authUseCases.obterUsuarioLogado(jwt);
      expect(usuarioLogado).toBeUndefined();
    });
  });
});
