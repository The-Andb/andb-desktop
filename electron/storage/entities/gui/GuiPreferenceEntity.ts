import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('gui_preferences')
export class GuiPreferenceEntity {
  @PrimaryColumn('text')
  key!: string;

  @Column('text', { nullable: true })
  value!: string | null;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;
}
