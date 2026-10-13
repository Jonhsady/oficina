import { createHash, randomBytes, randomUUID } from 'crypto';
import { Inject, Injectable, type OnModuleInit, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { CONFIG, type AppConfig } from '../config';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from './token.service';

type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'tecnico';
};

@Injectable()
export class AuthService implements OnModuleInit {
  private dummyHash = '';

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    @Inject(CONFIG) private readonly config: AppConfig,
  ) {}

  async onModuleInit() {
    this.dummyHash = await argon2.hash(randomBytes(16).toString('hex'));
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    const hash = user?.passwordHash ?? this.dummyHash;
    const matches = await argon2.verify(hash, password);
    if (!user || !matches) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }
    return this.issueSession(user);
  }

  async refresh(rawToken: string) {
    const current = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(rawToken) },
      include: { user: true },
    });

    if (!current || current.revokedAt || current.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh inválido');
    }

    const next = await this.persistRefresh(current.userId);
    const revoked = await this.prisma.refreshToken.updateMany({
      where: { id: current.id, revokedAt: null },
      data: { revokedAt: new Date(), replacedById: next.id },
    });

    if (revoked.count !== 1) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: current.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh reutilizado');
    }

    return this.session(current.user, next.raw);
  }

  async logout(rawToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hash(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Sessão inválida');
    return this.toPublic(user);
  }

  private async issueSession(user: PublicUser & { passwordHash?: string }) {
    const refresh = await this.persistRefresh(user.id);
    return this.session(user, refresh.raw);
  }

  private session(user: { id: string; name: string; email: string; role: 'admin' | 'tecnico' }, refreshToken: string) {
    return {
      accessToken: this.tokens.signAccess(user),
      refreshToken,
      expiresIn: this.config.accessTtlSeconds,
      user: this.toPublic(user),
    };
  }

  private async persistRefresh(userId: string) {
    const raw = randomBytes(32).toString('base64url');
    const id = randomUUID();
    await this.prisma.refreshToken.create({
      data: {
        id,
        userId,
        tokenHash: this.hash(raw),
        expiresAt: new Date(Date.now() + this.config.refreshTtlSeconds * 1000),
      },
    });
    return { id, raw };
  }

  private toPublic(user: { id: string; name: string; email: string; role: 'admin' | 'tecnico' }): PublicUser {
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}
