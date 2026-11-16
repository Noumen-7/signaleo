import { IsDateString, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import {
  AUTHOR_ORIGINS,
  AuthorOriginT,
  GRAVITIES,
  GravityT,
  REPORT_TYPES,
  ReportTypeT,
} from '../common/enums';

/**
 * Formulaire anonyme : aucun champ d'identité.
 * Tout champ non déclaré ici est rejeté (forbidNonWhitelisted).
 */
export class CreateReportDto {
  @IsIn(REPORT_TYPES)
  type: ReportTypeT;

  /** Origine : victime ou parent (pas une identité) */
  @IsIn(AUTHOR_ORIGINS)
  authorOrigin: AuthorOriginT;

  @IsDateString()
  date: string;

  @IsString()
  @MinLength(2)
  @MaxLength(300)
  lieu: string;

  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  personnes: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description: string;

  @IsOptional()
  @IsIn(GRAVITIES)
  gravity?: GravityT;
}

export class AuthorMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;

  @IsOptional()
  @IsIn(['ELEVE', 'PARENT'])
  author?: 'ELEVE' | 'PARENT';
}
