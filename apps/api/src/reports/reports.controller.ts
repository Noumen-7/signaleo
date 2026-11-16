import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ReportsService } from './reports.service';
import { AuthorMessageDto, CreateReportDto } from './reports.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  /** JSON ou multipart (fichier image optionnel `file`) */
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  create(@Body() dto: CreateReportDto, @UploadedFile() file?: Express.Multer.File) {
    return this.reports.create(dto, file);
  }

  /** Code invalide ou inconnu → 200 + message neutre */
  @Get('track/:code')
  track(@Param('code') code: string) {
    return this.reports.track(code);
  }

  @Post('track/:code/messages')
  @HttpCode(200)
  addMessage(@Param('code') code: string, @Body() dto: AuthorMessageDto) {
    return this.reports.addAuthorMessage(code, dto);
  }
}
