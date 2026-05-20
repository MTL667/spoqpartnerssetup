import {
  Controller, Post, UseGuards, UseInterceptors,
  UploadedFile, Req, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ExcelImportService, ImportResult } from './excel-import.service';
import { UserRole } from '@prisma/client';

@Controller('admin/import')
@UseGuards(RolesGuard)
export class AdminImportController {
  constructor(private importService: ExcelImportService) {}

  @Post('excel')
  @Roles(UserRole.ADMIN, UserRole.BDM)
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!file.originalname.match(/\.xlsx?$/i)) {
        cb(new BadRequestException('Alleen .xlsx bestanden zijn toegestaan'), false);
      } else {
        cb(null, true);
      }
    },
  }))
  async importExcel(@UploadedFile() file: Express.Multer.File, @Req() req: any): Promise<ImportResult> {
    if (!file) throw new BadRequestException('Geen bestand geüpload');
    return this.importService.importExcel(file.buffer, req.user.id);
  }
}
