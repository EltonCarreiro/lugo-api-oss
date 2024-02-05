import { createYoga } from 'graphql-yoga';
import { createServer } from 'http';
import { buildSchema } from './schema';
import { AuthUseCases, JWTConfig } from '@/useCases/AuthUseCases';
import { SchemaType } from './schema/builder';
import { UsuarioUseCases } from '@/useCases/UsuarioUseCases';
import { UsuarioPessoaUseCases } from '@/useCases/UsuarioPessoaUseCases';
import { useCookies } from '@whatwg-node/server-plugin-cookies';
import { getRedisClient } from '@/data/redis';

export const setup = async (jwtConfig: JWTConfig) => {
  const redis = await getRedisClient();

  const authUseCases = new AuthUseCases(jwtConfig, redis);
  const usuarioUseCases = new UsuarioUseCases();
  const usuarioPessoaUseCases = new UsuarioPessoaUseCases();

  const yoga = createYoga({
    schema: buildSchema(),
    context: async ({ request }): Promise<SchemaType['Context']> => {
      const jwt = (await request.cookieStore?.get('z'))?.value ?? '';

      return {
        useCases: {
          auth: authUseCases,
          usuario: usuarioUseCases,
          usuarioPessoa: usuarioPessoaUseCases
        },
        jwt,
        usuarioLogado:
          jwt === undefined
            ? undefined
            : await authUseCases.obterUsuarioLogado(jwt)
      };
    },
    plugins: [useCookies()]
  });

  const server = createServer(yoga);

  const port = process.env.PORT ?? 3000;

  server.listen(port, () => {
    console.log(`Visit http://localhost:${port}/graphql`);
  });
};
