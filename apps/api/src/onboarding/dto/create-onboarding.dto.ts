import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { IntegrationType, ContractType } from '@prisma/client';

export class CreateOnboardingDto {
  @IsString()
  @MinLength(2)
  companyName: string;

  @IsEmail()
  contactEmail: string;

  @IsEnum(IntegrationType)
  integrationType: IntegrationType;

  @IsEnum(ContractType)
  contractType: ContractType;
}
