import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('project_connections')
export class ProjectConnectionEntity {
  @PrimaryColumn('text')
  id!: string;

  @Column('text')
  name!: string;

  @Column('text', { nullable: true })
  environment!: string | null;

  @Column('text', { default: 'mysql' })
  type!: string;

  @Column('text', { nullable: true })
  host!: string | null;

  @Column('integer', { nullable: true })
  port!: number | null;

  @Column('text', { nullable: true })
  database!: string | null;

  @Column('text', { nullable: true })
  username!: string | null;

  @Column('text', { nullable: true })
  password!: string | null;

  @Column('text', { nullable: true })
  ssh_config_json!: string | null;

  @Column('text', { nullable: true })
  permissions_json!: string | null;

  @Column('text', { nullable: true })
  templateId!: string | null;

  @Column('text', { nullable: true })
  domain_mapping_json!: string | null;

  @Column('text', { nullable: true })
  product_settings_json!: string | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;
}
