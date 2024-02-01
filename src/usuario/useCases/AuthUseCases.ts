import { db } from '@/db/index';
import { BusinessError } from '@/shared/errors/BusinessError';
import { Senha } from '@/shared/valueObjects/Senha';
import { nanoid } from 'nanoid';

interface LoginArgs {
  email: string;
  senha: string;
}

interface UsuarioLogado {
  codigo: string;
  email: string;
}

type InMemoryAuthTokenRecord = Map<string, UsuarioLogado>;

export class AuthUseCases {
  private usuariosLogados: InMemoryAuthTokenRecord = new Map();

  public obterUsuarioLogado(
    authToken: string
  ): Promise<UsuarioLogado | undefined> {
    const usuarioLogado = this.usuariosLogados.get(authToken);

    return Promise.resolve(usuarioLogado);
  }

  public async login({ email, senha }: LoginArgs): Promise<string> {
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
      throw new BusinessError('Usuário não encontrado');
    }

    const authToken = nanoid();
    this.usuariosLogados.set(authToken, usuarioEncontrado);

    return authToken;
  }

  public async logout(authToken: string): Promise<void> {
    this.usuariosLogados.delete(authToken);

    return Promise.resolve();
  }
}
