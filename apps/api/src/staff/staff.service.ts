import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma.service';
import { CryptoService } from '../common/crypto.service';
import { AuditService } from '../common/audit.service';
import { StorageService } from '../common/storage.service';
import { CreateAccountDto, ListReportsQuery, UpdateAccountDto, UpdateStatusDto } from './staff.dto';

const MIN_PASSWORD_LENGTH = 12;

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
  ) {}

  /** Liste sans contenu sensible (métadonnées uniquement) */
  async list(q: ListReportsQuery) {
    const where: Prisma.ReportWhereInput = {};
    if (q.type) where.type = q.type;
    if (q.gravity) where.gravity = q.gravity;
    if (q.status) where.status = q.status;
    if (q.from || q.to) {
      where.createdAt = {};
      if (q.from) where.createdAt.gte = new Date(q.from);
      if (q.to) where.createdAt.lte = new Date(new Date(q.to).getTime() + 86_399_999);
    }

    const order = q.order ?? 'desc';
    const sort = q.sort ?? 'gravity';
    // Tri par défaut : urgents d'abord puis plus récents
    const orderBy: Prisma.ReportOrderByWithRelationInput[] =
      sort === 'gravity'
        ? [{ gravity: order }, { createdAt: 'desc' }]
        : [{ [sort]: order }, { createdAt: 'desc' }];

    const reports = await this.prisma.report.findMany({
      where,
      orderBy,
      select: {
        id: true,
        type: true,
        authorOrigin: true,
        gravity: true,
        status: true,
        incidentDate: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true, attachments: true } },
      },
    });
    return reports.map(({ _count, ...r }) => ({
      ...r,
      messageCount: _count.messages,
      attachmentCount: _count.attachments,
    }));
  }

  async detail(id: string, staffId: string) {
    const r = await this.prisma.report.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        internalNotes: {
          orderBy: { createdAt: 'asc' },
          include: { staff: { select: { displayName: true, email: true } } },
        },
      },
    });
    if (!r) throw new NotFoundException('Signalement introuvable');
    await this.audit.log('VIEW_REPORT', { staffId, reportId: id });
    const attachments = await this.storage.listMeta(id);
    return {
      id: r.id,
      type: r.type,
      authorOrigin: r.authorOrigin,
      gravity: r.gravity,
      status: r.status,
      incidentDate: r.incidentDate,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      lieu: this.crypto.decrypt(r.lieuEnc),
      personnes: this.crypto.decrypt(r.personnesEnc),
      description: this.crypto.decrypt(r.descriptionEnc),
      attachments,
      messages: r.messages.map((m) => ({
        id: m.id,
        author: m.author,
        content: this.crypto.decrypt(m.contentEnc),
        createdAt: m.createdAt,
      })),
      internalNotes: r.internalNotes.map((n) => ({
        id: n.id,
        content: this.crypto.decrypt(n.contentEnc),
        author: n.staff.displayName,
        createdAt: n.createdAt,
      })),
    };
  }

  async getAttachment(reportId: string, attachmentId: string, staffId: string) {
    const meta = await this.prisma.attachment.findFirst({
      where: { id: attachmentId, reportId },
    });
    if (!meta) throw new NotFoundException('Pièce jointe introuvable');
    const file = await this.storage.readDecrypted(attachmentId);
    if (!file) throw new NotFoundException('Pièce jointe introuvable');
    await this.audit.log('VIEW_ATTACHMENT', { staffId, reportId });
    return file;
  }

  async updateStatus(id: string, dto: UpdateStatusDto, staffId: string) {
    const before = await this.prisma.report.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Signalement introuvable');
    const updated = await this.prisma.report.update({
      where: { id },
      data: { status: dto.status, ...(dto.gravity ? { gravity: dto.gravity } : {}) },
      select: { id: true, status: true, gravity: true, updatedAt: true },
    });
    const changes = [`statut ${before.status} → ${updated.status}`];
    if (dto.gravity && dto.gravity !== before.gravity) {
      changes.push(`gravité ${before.gravity} → ${updated.gravity}`);
    }
    await this.audit.log('UPDATE_STATUS', { staffId, reportId: id, details: changes.join(', ') });
    return updated;
  }

  async reply(id: string, content: string, staffId: string) {
    const r = await this.prisma.report.findUnique({ where: { id }, select: { id: true } });
    if (!r) throw new NotFoundException('Signalement introuvable');
    const m = await this.prisma.message.create({
      data: { reportId: id, author: 'STAFF', contentEnc: this.crypto.encrypt(content) },
    });
    await this.audit.log('STAFF_REPLY', { staffId, reportId: id });
    return { id: m.id, author: m.author, content, createdAt: m.createdAt };
  }

  /** Note interne — jamais renvoyée par le suivi public */
  async addInternalNote(id: string, content: string, staffId: string) {
    const r = await this.prisma.report.findUnique({ where: { id }, select: { id: true } });
    if (!r) throw new NotFoundException('Signalement introuvable');
    const n = await this.prisma.internalNote.create({
      data: { reportId: id, staffId, contentEnc: this.crypto.encrypt(content) },
      include: { staff: { select: { displayName: true } } },
    });
    await this.audit.log('INTERNAL_NOTE', { staffId, reportId: id });
    return {
      id: n.id,
      content,
      author: n.staff.displayName,
      createdAt: n.createdAt,
    };
  }

  async auditLogs() {
    const logs = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { staff: { select: { email: true } } },
    });
    return logs.map((l) => ({
      id: l.id,
      action: l.action,
      reportId: l.reportId,
      details: l.details,
      staff: l.staff?.email ?? null,
      createdAt: l.createdAt,
    }));
  }

  /** Liste des comptes (admin) */
  async listAccounts() {
    return this.prisma.staffUser.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        active: true,
        createdAt: true,
        lockedUntil: true,
      },
    });
  }

  async createAccount(dto: CreateAccountDto, adminId: string) {
    if (dto.password.length < MIN_PASSWORD_LENGTH) {
      throw new BadRequestException(`Mot de passe : minimum ${MIN_PASSWORD_LENGTH} caractères`);
    }
    const email = dto.email.toLowerCase().trim();
    const exists = await this.prisma.staffUser.findUnique({ where: { email } });
    if (exists) throw new ConflictException('Cet e-mail est déjà utilisé');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.staffUser.create({
      data: {
        email,
        passwordHash,
        displayName: dto.displayName.trim(),
        role: dto.role,
        totpSecret: null,
        active: true,
      },
      select: { id: true, email: true, displayName: true, role: true, active: true, createdAt: true },
    });
    await this.audit.log('ACCOUNT_CREATE', {
      staffId: adminId,
      details: `${user.email} (${user.role})`,
    });
    return user;
  }

  async updateAccount(id: string, dto: UpdateAccountDto, adminId: string) {
    const user = await this.prisma.staffUser.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Compte introuvable');
    if (id === adminId && dto.active === false) {
      throw new BadRequestException('Vous ne pouvez pas désactiver votre propre compte');
    }
    const updated = await this.prisma.staffUser.update({
      where: { id },
      data: {
        ...(dto.active !== undefined ? { active: dto.active } : {}),
        ...(dto.displayName ? { displayName: dto.displayName.trim() } : {}),
        ...(dto.role ? { role: dto.role } : {}),
      },
      select: { id: true, email: true, displayName: true, role: true, active: true },
    });
    await this.audit.log('ACCOUNT_UPDATE', {
      staffId: adminId,
      details: `${updated.email} active=${updated.active}`,
    });
    return updated;
  }
}
