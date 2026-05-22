import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('instant_compares')
export class InstantCompareEntity {
  @PrimaryColumn('text')
  id!: string;

  @Column('text', { nullable: true, name: 'project_id' })
  project_id!: string | null;

  @Column('text')
  name!: string;

  @Column('text', { nullable: true, name: 'source_path' })
  source_path!: string | null;

  @Column('text', { nullable: true, name: 'target_path' })
  target_path!: string | null;

  @Column('text', { nullable: true })
  status!: string | null;

  @Column('text', { nullable: true })
  type!: string | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;
}
