import { IsEmail } from 'class-validator';

export class InvitePartnerDto {
  @IsEmail()
  email: string;
}
