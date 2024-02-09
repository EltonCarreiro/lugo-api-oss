import { db } from '@/data/db';
import { BusinessError } from '@/shared/errors/BusinessError';
import { Senha } from '@/valueObjects/Senha';
import { nanoid } from 'nanoid';
import { SignJWT, jwtVerify } from 'jose';
import { RedisClient } from '@/data/redis';
import { Logger } from '@/logging';

interface LoginArgs {
  email: string;
  senha: string;
}

interface UsuarioLogado {
  codigo: string;
  email: string;
}

interface JWTPayload {
  authToken: string;
}

export interface JWTConfig {
  secret: string;
  algorithm: string;
}

export class AuthUseCases {
  private jwtConfig: JWTConfig;

  constructor(
    jwtConfig: JWTConfig,
    private sessionDurationInSeconds: number,
    private redis: RedisClient,
    private log: Logger
  ) {
    if (jwtConfig.secret.trim().length === 0) {
      throw new Error('Authentication secret must not be empty.');
    }

    if (jwtConfig.algorithm.trim().length === 0) {
      throw new Error('JWT Algorithm must not be empty.');
    }

    if (sessionDurationInSeconds <= 0) {
      throw new Error('Session duration invalid. Value must be positive.');
    }

    this.jwtConfig = jwtConfig;
  }

  public async obterUsuarioLogado(
    jwt: string
  ): Promise<UsuarioLogado | undefined> {
    try {
      this.log.info('Obtendo usuário logado.');
      const codigoUsuario =
        (await this.redis.get(
          this.getRedisKey(await this.getAuthTokenFromJWT(jwt))
        )) ?? undefined;

      if (codigoUsuario === undefined) {
        return undefined;
      }

      const usuarioLogado = await db.query.usuario.findFirst({
        columns: {
          codigo: true,
          email: true
        },
        where: ({ codigo }, { eq }) => eq(codigo, codigoUsuario)
      });

      this.log.info(
        usuarioLogado === undefined
          ? 'Usuário não encontrado.'
          : 'Usuário logado retornado.'
      );
      return usuarioLogado;
    } catch (_error: unknown) {
      this.log.warn('Bad JWT format. Returning undefined user');
      return undefined;
    }
  }

  public async login({ email, senha }: LoginArgs): Promise<string> {
    this.log.info('Realizando login.');
    const senhaHash = new Senha(senha).value;

    const usuarioEncontrado = await db.query.usuario.findFirst({
      columns: {
        codigo: true,
        email: true
      },
      where: (usuario, { and, eq }) =>
        and(eq(usuario.email, email), eq(usuario.senha, senhaHash))
    });

    if (usuarioEncontrado === undefined) {
      this.log.warn('Usuário/Senha incorretos.');
      throw new BusinessError('Usuário/Senha incorretos.');
    }

    const authToken = nanoid();
    this.redis.set(this.getRedisKey(authToken), usuarioEncontrado.codigo, {
      EX: this.sessionDurationInSeconds
    });

    this.log.info('Login feito. Retornando auth-token.');
    return this.signJWT(authToken);
  }

  public async logout(jwt: string): Promise<void> {
    try {
      this.log.info('Realizando logout.');
      this.redis.del(this.getRedisKey(await this.getAuthTokenFromJWT(jwt)));
    } catch (_error) {
      return;
    }
  }

  private get encodedSecret() {
    return new TextEncoder().encode(this.jwtConfig.secret);
  }

  private async getAuthTokenFromJWT(jwt: string) {
    const { payload } = await jwtVerify<JWTPayload>(jwt, this.encodedSecret);
    return payload.authToken;
  }

  private async signJWT(authToken: string) {
    const jwt = await new SignJWT({ authToken })
      .setProtectedHeader({
        alg: this.jwtConfig.algorithm
      })
      .setIssuedAt()
      .sign(this.encodedSecret);

    return jwt;
  }

  private getRedisKey(authToken: string) {
    return `sessions:${authToken}`;
  }
}
