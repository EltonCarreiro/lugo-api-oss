import { createYoga } from 'graphql-yoga';
import { createServer } from 'http';
import { buildSchema } from './schema';
import { AuthUseCases, JWTConfig } from '@/useCases/AuthUseCases';
import { SchemaType } from './schema/builder';
import { UsuarioUseCases } from '@/useCases/UsuarioUseCases';
import { UsuarioPessoaUseCases } from '@/useCases/UsuarioPessoaUseCases';
import { useCookies } from '@whatwg-node/server-plugin-cookies';
import { getRedisClient } from '@/data/redis';
import { EmpresaUseCases } from '@/useCases/EmpresaUseCases';
import { PessoaUseCases } from '@/useCases/PessoaUseCases';
import { createLogger } from '@/logging';
import { nanoid } from 'nanoid';

export const setup = async (
  jwtConfig: JWTConfig,
  sessionDurationInSeconds: number
) => {
  const log = createLogger({ trace_id: nanoid() });
  log.debug('Setting up graphql...');

  const redis = await getRedisClient();
  log.debug('Redis client created.');

  log.debug('Building GraphQL schema...');

  const yoga = createYoga({
    schema: buildSchema(),
    context: async ({ request }): Promise<SchemaType['Context']> => {
      const requestLogger = createLogger({ trace_id: nanoid() });

      const authUseCases = new AuthUseCases(
        jwtConfig,
        sessionDurationInSeconds,
        redis,
        requestLogger
      );
      const usuarioUseCases = new UsuarioUseCases(requestLogger);
      const usuarioPessoaUseCases = new UsuarioPessoaUseCases(requestLogger);
      const pessoaUseCases = new PessoaUseCases(requestLogger);
      const empresaUseCases = new EmpresaUseCases(
        pessoaUseCases,
        requestLogger
      );

      const jwt = (await request.cookieStore?.get('z'))?.value ?? '';

      return {
        useCases: {
          auth: authUseCases,
          usuario: usuarioUseCases,
          usuarioPessoa: usuarioPessoaUseCases,
          empresa: empresaUseCases
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

  log.debug('GraphQL schema built successfully.');

  const server = createServer(yoga);

  const port = process.env.PORT ?? 3000;

  server.listen(port, () => {
    log.info(`Visit http://localhost:${port}/graphql`);
  });
};
