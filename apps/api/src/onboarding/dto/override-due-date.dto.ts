import { IsDateString } from 'class-validator';

export class OverrideDueDateDto {
  @IsDateString()
  dueDate: string;
}
