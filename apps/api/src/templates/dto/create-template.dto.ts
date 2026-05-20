import { IsEnum, IsArray, ValidateNested, IsString, IsOptional, IsNumber, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { IntegrationType, ContractType, UserRole } from '@prisma/client';

export class BlueprintDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  phaseSequence: number;

  @IsEnum(UserRole)
  ownerRole: UserRole;

  @IsOptional()
  @IsNumber()
  offsetDays?: number;

  @IsOptional()
  @IsString()
  parentKey?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dependsOnKeys?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  checklistItems?: string[];

  @IsOptional()
  @IsArray()
  deliverables?: { title: string; requiredByRole: UserRole }[];

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class CreateTemplateDto {
  @IsEnum(IntegrationType)
  integrationType: IntegrationType;

  @IsEnum(ContractType)
  contractType: ContractType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlueprintDto)
  blueprints: BlueprintDto[];
}
