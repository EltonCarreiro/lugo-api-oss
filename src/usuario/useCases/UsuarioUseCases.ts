import { BusinessError } from 'shared/errors/BusinessError';
import { Usuario } from '../entities/Usuario';
import { nanoid } from 'nanoid';

interface CriarAlterarUsuarioArgs {
  email: string;
  senha: string;
  confirmacaoSenha: string;
}

export class UsuarioUseCases {
  private _usuarios: Usuario[] = [];

  public criarUsuario({
    email,
    senha,
    confirmacaoSenha
  }: CriarAlterarUsuarioArgs): Promise<string> {
    if (senha !== confirmacaoSenha) {
      throw new BusinessError('Senhas não coincidem.');
    }

    const novoUsuario = new Usuario({ codigo: nanoid(), email, senha });

    if (
      this._usuarios.some(
        ({ email: emailExistente }) => emailExistente === novoUsuario.email
      )
    ) {
      throw new BusinessError('Usuário já cadastrado');
    }

    this._usuarios.push(novoUsuario);

    return Promise.resolve(novoUsuario.codigo);
  }

  public alterarSenha({
    email,
    senha,
    confirmacaoSenha
  }: CriarAlterarUsuarioArgs): Promise<void> {
    if (senha !== confirmacaoSenha) {
      throw new BusinessError('Senhas não coincidem.');
    }

    const usuario = this._usuarios.find(
      ({ email: emailExistente }) => emailExistente === email
    );

    if (usuario === undefined) {
      throw new BusinessError('Usuário não encontrado');
    }

    this._usuarios = this._usuarios.map((usuarioExistente) => {
      if (usuarioExistente.email === usuario.email) {
        usuarioExistente.alterarSenha(senha, confirmacaoSenha);
      }

      return usuarioExistente;
    });

    return Promise.resolve();
  }
}
