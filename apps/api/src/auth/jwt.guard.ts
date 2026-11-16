import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

export type StaffRoleT = 'RESPONSABLE' | 'ADMIN';
export interface StaffPayload {
  sub: string;
  email: string;
  role: StaffRoleT;
  name: string;
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: StaffRoleT[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers['authorization'];
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException();
    try {
      req.staff = await this.jwt.verifyAsync<StaffPayload>(header.slice(7));
    } catch {
      throw new UnauthorizedException('Session expirée');
    }
    const roles = this.reflector.getAllAndOverride<StaffRoleT[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (roles && !roles.includes(req.staff.role)) {
      throw new ForbiddenException('Accès non autorisé pour ce rôle');
    }
    return true;
  }
}
