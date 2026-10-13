import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { CONFIG, type AppConfig, type Role } from '../config';

export type AccessUser = {
  sub: string;
  email: string;
  role: Role;
};

type AccessPayload = {
  sub: string;
  email: string;
  role: Role;
};

@Injectable()
export class TokenService {
  constructor(@Inject(CONFIG) private readonly config: AppConfig) {}

  signAccess(user: { id: string; email: string; role: Role }): string {
    const payload: AccessPayload = { sub: user.id, email: user.email, role: user.role };
    return jwt.sign(payload, this.config.accessSecret, {
      expiresIn: this.config.accessTtlSeconds,
    });
  }

  verifyAccess(token: string): AccessUser {
    try {
      const payload = jwt.verify(token, this.config.accessSecret);
      if (typeof payload === 'string' || !payload.sub || !payload.email || !payload.role) {
        throw new Error('payload');
      }
      return {
        sub: payload.sub,
        email: String(payload.email),
        role: payload.role as Role,
      };
    } catch {
      throw new UnauthorizedException('Sessão inválida');
    }
  }
}
