import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { env } from '../env';
import { CryptoService } from './crypto.service';
import { PrismaService } from './prisma.service';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 10 * 1024 * 1024;

@Injectable()
export class StorageService implements OnModuleInit {
  constructor(
    private readonly crypto: CryptoService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    await fs.mkdir(env.uploadDir, { recursive: true });
  }

  validateImage(file?: Express.Multer.File) {
    if (!file) return;
    if (!ALLOWED.has(file.mimetype)) {
      throw new BadRequestException('Type de fichier non autorisé. Images JPEG, PNG ou WebP uniquement.');
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('Fichier trop volumineux (maximum 10 Mo).');
    }
  }

  async saveForReport(reportId: string, file: Express.Multer.File) {
    this.validateImage(file);
    const storageName = `${randomUUID()}.bin`;
    const enc = this.crypto.encryptBytes(file.buffer);
    await fs.writeFile(path.join(env.uploadDir, storageName), enc, 'utf8');
    return this.prisma.attachment.create({
      data: {
        reportId,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storageName,
        nameEnc: this.crypto.encrypt(file.originalname || 'image'),
      },
    });
  }

  async listMeta(reportId: string) {
    const rows = await this.prisma.attachment.findMany({
      where: { reportId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((a) => ({
      id: a.id,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      name: this.crypto.decrypt(a.nameEnc),
      createdAt: a.createdAt,
    }));
  }

  async readDecrypted(attachmentId: string) {
    const a = await this.prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!a) return null;
    const raw = await fs.readFile(path.join(env.uploadDir, a.storageName), 'utf8');
    return {
      mimeType: a.mimeType,
      name: this.crypto.decrypt(a.nameEnc),
      buffer: this.crypto.decryptBytes(raw),
    };
  }
}
