import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccessLogsModule } from './access-logs/access-logs.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AuthModule } from './auth/auth.module';
import { DoctorsModule } from './doctors/doctors.module';
import { PatientsModule } from './patients/patients.module';
import { ReportsModule } from './reports/reports.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // En producción (Render + Neon) se usa DATABASE_URL con SSL;
        // en desarrollo, las variables DB_* individuales sin SSL
        const url = config.get<string>('DATABASE_URL');
        const connection = url
          ? { url, ssl: { rejectUnauthorized: false } }
          : {
              host: config.get('DB_HOST', 'localhost'),
              port: config.get<number>('DB_PORT', 5432),
              username: config.get('DB_USER', 'medicitas'),
              password: config.get('DB_PASSWORD', 'medicitas'),
              database: config.get('DB_NAME', 'medicitas'),
            };
        return {
          type: 'postgres' as const,
          ...connection,
          autoLoadEntities: true,
          // synchronize solo en proyecto académico; en producción real se usarían migraciones
          synchronize: true,
        };
      },
    }),
    UsersModule,
    AccessLogsModule,
    AuthModule,
    PatientsModule,
    DoctorsModule,
    AppointmentsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
