import { IsString, MinLength, IsOptional, IsArray } from 'class-validator';

export class PartnerCommentDto {
  @IsString()
  @MinLength(1)
  text: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentionUserIds?: string[];
}
