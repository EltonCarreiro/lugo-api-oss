import { BusinessError } from '@/shared/errors/BusinessError';

export interface UsuarioConstructorArgs {
  codigo: string;
  email: string;
  senha: string;
}

export class Usuario {
  public get codigo() {
    return this._codigo;
  }

  public get email() {
    return this._email;
  }

  public get senha() {
    return this._senha;
  }

  private _codigo: string;
  private _email: string;
  private _senha: string;

  constructor({ codigo, email, senha }: UsuarioConstructorArgs) {
    if (codigo.length === 0) {
      throw new BusinessError('Código de usuário obrigatório.');
    }

    if (email.length === 0) {
      throw new BusinessError('Email vazio não permitido.');
    }

    if (senha.length === 0) {
      throw new BusinessError('Senha vazia não permitida.');
    }

    this._codigo = codigo;
    this._email = email;
    this._senha = senha;
  }

  public alterarSenha(novaSenha: string, confirmacaoNovaSenha: string) {
    if (novaSenha.length === 0) {
      throw new BusinessError('Senha vazia não permitida.');
    }

    if (novaSenha !== confirmacaoNovaSenha) {
      throw new BusinessError('Senhas não coincidem.');
    }

    this._senha = novaSenha;
  }
}
