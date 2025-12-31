import mongoose, { Document, Schema } from 'mongoose';

export type VpsStatus = 'OPEN' | 'DONE';

export interface IVpsDetailItem {
  _id?: mongoose.Types.ObjectId; // Mongoose subdocument _id
  chain_id?: string; // grouping id for a schedule chain
  ref_id?: string; // link to VpsSubscription _id for sync
  toko: string;
  program: string;
  daerah: string;
  start: string; // YYYY-MM-DD
  bulan: number;
  tempo: string; // YYYY-MM-DD
  harga: number;
  jumlah_harga: number;
  diskon: number;
  diskon_percent: number;
  total_harga: number;
  status: VpsStatus;
  tgl_lunas?: string; // YYYY-MM-DD, only set if status is DONE
}

export interface ITTVpsDetail extends Document {
  periode: string; // YYYY-MM
  detail: IVpsDetailItem[];
  // audit fields (following existing models' convention)
  input_date: Date;
  update_date: Date;
  delete_date: Date | null;
  input_by: string;
  update_by: string | null;
  delete_by: string | null;
}

const VpsDetailItemSchema = new Schema<IVpsDetailItem>({
  chain_id: { type: String, required: false },
  ref_id: { type: String, required: false },
  toko: { type: String, required: true },
  program: { type: String, required: true },
  daerah: { type: String, required: true },
  start: { type: String, required: true },
  bulan: { type: Number, required: true, min: 1 },
  tempo: { type: String, required: true },
  harga: { type: Number, required: true, min: 0 },
  jumlah_harga: { type: Number, required: true, min: 0 },
  diskon: { type: Number, required: true, min: 0, default: 0 },
  diskon_percent: { type: Number, required: true, min: 0, default: 0 },
  total_harga: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['OPEN', 'DONE'], default: 'OPEN' },
  tgl_lunas: { type: String, required: false },
});

const TTVpsDetailSchema: Schema = new Schema(
  {
    periode: { type: String, required: true }, // e.g. 2025-12
    detail: { type: [VpsDetailItemSchema], default: [] },
    input_date: { type: Date, default: Date.now },
    update_date: { type: Date, default: Date.now },
    delete_date: { type: Date, default: null },
    input_by: { type: String, required: true },
    update_by: { type: String, default: null },
    delete_by: { type: String, default: null },
  },
  { minimize: true }
);

TTVpsDetailSchema.index({ periode: 1 }, { unique: true });

export default mongoose.model<ITTVpsDetail>(
  'TTVpsDetail',
  TTVpsDetailSchema,
  'tt_vps_details'
);
