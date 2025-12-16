import mongoose, { Document, Schema } from 'mongoose';

export interface ITTVps extends Document {
  periode: string; // YYYY-MM
  estimasi: number; // sum of total_harga
  realisasi: number; // sum of total_harga where status DONE
  open: number; // derived (confirm: OPEN sum or estimasi - realisasi)
  total_toko: number; // number of detail items (or unique toko if required)
  updated_at: Date;
  // audit fields (following existing models' convention)
  input_date: Date;
  update_date: Date;
  delete_date: Date | null;
  input_by: string;
  update_by: string | null;
  delete_by: string | null;
}

const TTVpsSchema: Schema = new Schema(
  {
    periode: { type: String, required: true },
    estimasi: { type: Number, required: true, default: 0 },
    realisasi: { type: Number, required: true, default: 0 },
    open: { type: Number, required: true, default: 0 },
    total_toko: { type: Number, required: true, default: 0 },
    updated_at: { type: Date, default: Date.now },
    input_date: { type: Date, default: Date.now },
    update_date: { type: Date, default: Date.now },
    delete_date: { type: Date, default: null },
    input_by: { type: String, required: true },
    update_by: { type: String, default: null },
    delete_by: { type: String, default: null },
  },
  { minimize: true }
);

TTVpsSchema.index({ periode: 1 }, { unique: true });

export default mongoose.model<ITTVps>('TTVps', TTVpsSchema, 'tt_vps');
