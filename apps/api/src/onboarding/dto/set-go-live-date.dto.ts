import { IsDateString } from 'class-validator';

export class SetGoLiveDateDto {
  @IsDateString()
  targetGoLiveDate: string;
}
