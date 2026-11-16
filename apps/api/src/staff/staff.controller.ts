import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtGuard, Roles, StaffPayload } from '../auth/jwt.guard';
import { StaffService } from './staff.service';
import {
  CreateAccountDto,
  InternalNoteDto,
  ListReportsQuery,
  StaffMessageDto,
  UpdateAccountDto,
  UpdateStatusDto,
} from './staff.dto';

type StaffRequest = { staff: StaffPayload };

/**
 * RESPONSABLE : accès complet aux signalements.
 * ADMIN : métadonnées + journal d'audit + comptes, jamais le contenu des dossiers.
 */
@Controller('staff')
@UseGuards(JwtGuard)
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get('reports')
  @Roles('RESPONSABLE', 'ADMIN')
  list(@Query() q: ListReportsQuery) {
    return this.staff.list(q);
  }

  @Get('reports/:id')
  @Roles('RESPONSABLE')
  detail(@Param('id', ParseUUIDPipe) id: string, @Req() req: StaffRequest) {
    return this.staff.detail(id, req.staff.sub);
  }

  @Get('reports/:id/attachments/:attachmentId')
  @Roles('RESPONSABLE')
  async attachment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
    @Req() req: StaffRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.staff.getAttachment(id, attachmentId, req.staff.sub);
    if (!file) throw new NotFoundException();
    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(file.name)}"`,
      'Cache-Control': 'no-store',
    });
    return new StreamableFile(file.buffer);
  }

  @Patch('reports/:id/status')
  @Roles('RESPONSABLE')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
    @Req() req: StaffRequest,
  ) {
    return this.staff.updateStatus(id, dto, req.staff.sub);
  }

  @Post('reports/:id/messages')
  @Roles('RESPONSABLE')
  reply(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: StaffMessageDto,
    @Req() req: StaffRequest,
  ) {
    return this.staff.reply(id, dto.content, req.staff.sub);
  }

  @Post('reports/:id/notes')
  @Roles('RESPONSABLE')
  addNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: InternalNoteDto,
    @Req() req: StaffRequest,
  ) {
    return this.staff.addInternalNote(id, dto.content, req.staff.sub);
  }

  @Get('audit')
  @Roles('ADMIN', 'RESPONSABLE')
  audit() {
    return this.staff.auditLogs();
  }

  @Get('accounts')
  @Roles('ADMIN')
  accounts() {
    return this.staff.listAccounts();
  }

  @Post('accounts')
  @Roles('ADMIN')
  createAccount(@Body() dto: CreateAccountDto, @Req() req: StaffRequest) {
    return this.staff.createAccount(dto, req.staff.sub);
  }

  @Patch('accounts/:id')
  @Roles('ADMIN')
  updateAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAccountDto,
    @Req() req: StaffRequest,
  ) {
    return this.staff.updateAccount(id, dto, req.staff.sub);
  }
}
