import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { env } from './env';
import { PrismaService } from './common/prisma.service';
import { CryptoService } from './common/crypto.service';
import { AuditService } from './common/audit.service';
import { StorageService } from './common/storage.service';
import { ReportsController } from './reports/reports.controller';
import { ReportsService } from './reports/reports.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtGuard } from './auth/jwt.guard';
import { StaffController } from './staff/staff.controller';
import { StaffService } from './staff/staff.service';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: env.jwtSecret,
      signOptions: { expiresIn: env.jwtExpiresIn as any },
    }),
  ],
  controllers: [ReportsController, AuthController, StaffController],
  providers: [
    PrismaService,
    CryptoService,
    AuditService,
    StorageService,
    ReportsService,
    AuthService,
    StaffService,
    JwtGuard,
  ],
})
export class AppModule {}

