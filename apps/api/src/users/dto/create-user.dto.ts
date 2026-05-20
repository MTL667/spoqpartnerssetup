import { IsEmail, IsEnum, IsString, MinLength, IsOptional } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  partnerId?: string;
}
