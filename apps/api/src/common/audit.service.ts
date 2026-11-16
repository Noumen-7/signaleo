import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(action: string, opts: { staffId?: string; reportId?: string; details?: string } = {}) {
    await this.prisma.auditLog.create({
      data: { action, staffId: opts.staffId, reportId: opts.reportId, details: opts.details },
    });
  }
}
