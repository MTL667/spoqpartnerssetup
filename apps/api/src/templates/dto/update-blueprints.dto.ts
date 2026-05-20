import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BlueprintDto } from './create-template.dto';

export class UpdateBlueprintsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlueprintDto)
  blueprints: BlueprintDto[];
}
