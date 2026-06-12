import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum AccessEvent {
  INGRESO = 'INGRESO',
  SALIDA = 'SALIDA',
}

// Auditoría inmutable: sin borrado lógico a propósito
@Entity('access_logs')
export class AccessLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Column()
  ip: string;

  @Column({ type: 'enum', enum: AccessEvent })
  event: AccessEvent;

  @Column()
  browser: string;

  @CreateDateColumn()
  createdAt: Date;
}
