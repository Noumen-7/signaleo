import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../common/audit.service';
import { StaffPayload } from './jwt.guard';

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const GENERIC_ERROR = 'Identifiants invalides';
const MIN_PASSWORD_LENGTH = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.staffUser.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) throw new UnauthorizedException(GENERIC_ERROR);

    if (!user.active) {
      throw new UnauthorizedException('Ce compte a été désactivé. Contactez l’administrateur.');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        `Compte verrouillé après ${MAX_ATTEMPTS} tentatives. Réessayez plus tard ou contactez l'administrateur.`,
      );
    }

    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      throw new UnauthorizedException(GENERIC_ERROR);
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      await this.registerFailure(user.id, user.failedAttempts);
      throw new UnauthorizedException(GENERIC_ERROR);
    }

    await this.prisma.staffUser.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockedUntil: null },
    });
    await this.audit.log('LOGIN_SUCCESS', { staffId: user.id });

    const payload: StaffPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.displayName,
    };
    return {
      accessToken: await this.jwt.signAsync(payload),
      user: { email: user.email, role: user.role, name: user.displayName },
    };
  }

  private async registerFailure(userId: string, failedAttempts: number) {
    const attempts = failedAttempts + 1;
    const lock = attempts >= MAX_ATTEMPTS;
    await this.prisma.staffUser.update({
      where: { id: userId },
      data: {
        failedAttempts: lock ? 0 : attempts,
        lockedUntil: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
      },
    });
    await this.audit.log(lock ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED', { staffId: userId });
    if (lock) {
      throw new UnauthorizedException(
        `Compte verrouillé pour ${LOCK_MINUTES} minutes après ${MAX_ATTEMPTS} tentatives échouées.`,
      );
    }
  }
}
