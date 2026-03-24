import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('workspace_tabs')
export class WorkspaceTabEntity {
  @PrimaryColumn('text')
  id!: string;

  @Column('text')
  type!: string;

  @Column('text', { nullable: true })
  title!: string;

  @Column('text', { nullable: true })
  state_json!: string | null;

  @Column('integer', { default: 0 })
  order_index!: number;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;
}
