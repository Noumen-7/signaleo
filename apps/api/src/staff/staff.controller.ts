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
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard, Roles, StaffPayload } from '../auth/jwt.guard';
import { StaffService } from './staff.service';
import {
  InternalNoteDto,
  ListReportsQuery,
  StaffMessageDto,
  UpdateAccountDto,
  UpdateStatusDto,
} from './staff.dto';

type StaffRequest = { staff: StaffPayload };

/**
 * RESPONSABLE : signalements + proposition de comptes (en attente).
 * ADMIN : validation / désactivation des comptes + journal — jamais les dossiers.
 */
@Controller('staff')
@UseGuards(JwtGuard)
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get('reports')
  @Roles('RESPONSABLE')
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
  ) {
    const file = await this.staff.getAttachment(id, attachmentId, req.staff.sub);
    if (!file) throw new NotFoundException();
    const safeName = file.name.replace(/[\r\n"]/g, '_') || 'image';
    return new StreamableFile(Buffer.from(file.buffer), {
      type: file.mimeType,
      disposition: `inline; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      length: file.buffer.length,
    });
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
  @Roles('ADMIN')
  audit() {
    return this.staff.auditLogs();
  }

  @Get('accounts')
  @Roles('ADMIN')
  accounts() {
    return this.staff.listAccounts();
  }

  /** Admin valide, désactive ou réactive — sans jamais fixer le mot de passe. */
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
