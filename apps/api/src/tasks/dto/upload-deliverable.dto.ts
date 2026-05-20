import { IsString, MinLength } from 'class-validator';

export class UploadDeliverableDto {
  @IsString()
  @MinLength(1)
  requirementId: string;

  @IsString()
  @MinLength(1)
  fileName: string;

  @IsString()
  @MinLength(1)
  storageRef: string;
}
