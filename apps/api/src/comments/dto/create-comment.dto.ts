import { IsString, MinLength, IsOptional, IsEnum, IsArray } from 'class-validator';
import { CommentVisibility } from '@prisma/client';

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  text: string;

  @IsOptional()
  @IsEnum(CommentVisibility)
  visibilityScope?: CommentVisibility;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentionUserIds?: string[];
}
