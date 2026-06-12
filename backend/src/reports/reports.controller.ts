import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';

// Accesible para ADMIN y RECEPCIONISTA
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('appointments.pdf')
  async appointmentsPdf(
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('doctorId') doctorId?: string,
  ) {
    const buffer = await this.service.appointmentsPdf({
      from,
      to,
      doctorId: doctorId ? Number(doctorId) : undefined,
    });
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="reporte-citas.pdf"',
      'Content-Length': String(buffer.length),
    });
    res.send(buffer);
  }

  @Get('stats')
  stats() {
    return this.service.stats();
  }
}
