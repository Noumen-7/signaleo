import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CryptoService } from '../common/crypto.service';
import { StorageService } from '../common/storage.service';
import { AuthorMessageDto, CreateReportDto } from './reports.dto';

export const NEUTRAL_TRACK_RESPONSE = {
  ok: false,
  message:
    "Aucun suivi ne peut être affiché pour ce code. Vérifiez votre saisie ou effectuez un nouveau signalement.",
} as const;

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly storage: StorageService,
  ) {}

  async create(dto: CreateReportDto, file?: Express.Multer.File) {
    if (file) this.storage.validateImage(file);

    for (let i = 0; i < 5; i++) {
      const trackingCode = this.crypto.generateTrackingCode();
      const trackingCodeHash = this.crypto.hashTrackingCode(trackingCode);
      try {
        const report = await this.prisma.report.create({
          data: {
            trackingCodeHash,
            type: dto.type,
            authorOrigin: dto.authorOrigin,
            gravity: dto.gravity ?? 'MOYENNE',
            incidentDate: new Date(dto.date),
            lieuEnc: this.crypto.encrypt(dto.lieu),
            personnesEnc: this.crypto.encrypt(dto.personnes),
            descriptionEnc: this.crypto.encrypt(dto.description),
          },
        });
        if (file) await this.storage.saveForReport(report.id, file);
        // Le code clair n'est renvoyé qu'une seule fois et n'est jamais stocké
        return { trackingCode };
      } catch (e: any) {
        if (e?.code !== 'P2002') throw e;
      }
    }
    throw new Error('Impossible de générer un code de suivi');
  }

  private async findByCode(code: string) {
    if (!this.crypto.isPlausibleCode(code)) return null;
    return this.prisma.report.findUnique({
      where: { trackingCodeHash: this.crypto.hashTrackingCode(code) },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        attachments: { select: { id: true } },
      },
    });
  }

  async track(code: string) {
    const report = await this.findByCode(code);
    if (!report) return NEUTRAL_TRACK_RESPONSE;
    return {
      ok: true,
      status: report.status,
      type: report.type,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      hasAttachment: report.attachments.length > 0,
      messages: report.messages.map((m) => ({
        id: m.id,
        author: m.author,
        content: this.crypto.decrypt(m.contentEnc),
        createdAt: m.createdAt,
      })),
    };
  }

  async addAuthorMessage(code: string, dto: AuthorMessageDto) {
    const report = await this.findByCode(code);
    if (!report) return NEUTRAL_TRACK_RESPONSE;
    if (report.status === 'CLOS') {
      return { ok: false, message: 'Ce signalement est clos, la messagerie est fermée.' };
    }
    await this.prisma.message.create({
      data: {
        reportId: report.id,
        author: dto.author ?? 'ELEVE',
        contentEnc: this.crypto.encrypt(dto.content),
      },
    });
    return { ok: true };
  }
}
