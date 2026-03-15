import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateProblemDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsString()
  subject: string;

  @IsString()
  gradeLevel: string;

  @IsOptional()
  @IsString()
  problemType?: string;

  @IsOptional()
  @IsArray()
  knowledgePoints?: string[];
}

export class UpdateProblemDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  gradeLevel?: string;

  @IsOptional()
  @IsString()
  problemType?: string;

  @IsOptional()
  @IsArray()
  knowledgePoints?: string[];

  @IsOptional()
  @IsString()
  status?: 'pending' | 'explaining' | 'completed';
}

export class UpdateFieldDto {
  @IsString()
  field: string;

  value: unknown;
}
