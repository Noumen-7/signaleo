import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  GRAVITIES,
  GravityT,
  REPORT_TYPES,
  ReportTypeT,
  STATUSES,
  StatusT,
} from '../common/enums';

export const SORT_FIELDS = ['gravity', 'createdAt', 'incidentDate', 'status', 'type'] as const;

export class ListReportsQuery {
  @IsOptional() @IsIn(REPORT_TYPES) type?: ReportTypeT;
  @IsOptional() @IsIn(GRAVITIES) gravity?: GravityT;
  @IsOptional() @IsIn(STATUSES) status?: StatusT;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @IsIn(SORT_FIELDS) sort?: (typeof SORT_FIELDS)[number];
  @IsOptional() @IsIn(['asc', 'desc']) order?: 'asc' | 'desc';
}

export class UpdateStatusDto {
  @IsIn(STATUSES)
  status: StatusT;

  @IsOptional()
  @IsIn(GRAVITIES)
  gravity?: GravityT;
}

export class StaffMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;
}

export class InternalNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content: string;
}

export class CreateAccountDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(12)
  @MaxLength(200)
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  displayName: string;

  @IsIn(['RESPONSABLE', 'ADMIN'])
  role: 'RESPONSABLE' | 'ADMIN';
}

export class UpdateAccountDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  displayName?: string;

  @IsOptional()
  @IsIn(['RESPONSABLE', 'ADMIN'])
  role?: 'RESPONSABLE' | 'ADMIN';
}
