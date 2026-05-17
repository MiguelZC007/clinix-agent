import { Module } from '@nestjs/common';
import { PdfModule } from '../pdf/pdf.module';
import { ClinicHistoryService } from './clinic-history.service';
import {
  ClinicHistoryController,
  PatientClinicHistoriesController,
} from './clinic-history.controller';

@Module({
  imports: [PdfModule],
  controllers: [ClinicHistoryController, PatientClinicHistoriesController],
  providers: [ClinicHistoryService],
  exports: [ClinicHistoryService],
})
export class ClinicHistoryModule {}
