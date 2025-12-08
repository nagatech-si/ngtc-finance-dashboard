import mongoose, { Document, Schema } from 'mongoose';
import { IBudget } from './Budget';

export interface IBudgetUsage extends Document {
  budget_id: mongoose.Types.ObjectId;
  amount_used: number;
  description: string;
  attachment?: string;
  usage_date: Date;
  status_aktv: boolean;
  input_date: Date;
  update_date: Date;
  delete_date: Date | null;
  input_by: string;
  update_by: string | null;
  delete_by: string | null;
}

const BudgetUsageSchema: Schema = new Schema({
  budget_id: { type: Schema.Types.ObjectId, ref: 'Budget', required: true },
  amount_used: { type: Number, required: true },
  description: { type: String, required: true },
  attachment: { type: String, default: null },
  usage_date: { type: Date, required: true },
  status_aktv: { type: Boolean, default: true },
  active: { type: Boolean, default: true },
  input_date: { type: Date, default: Date.now },
  update_date: { type: Date, default: Date.now },
  delete_date: { type: Date, default: null },
  deleted_at: { type: Date, default: null },
  input_by: { type: String, required: true },
  update_by: { type: String, default: null },
  delete_by: { type: String, default: null },
  deleted_by: { type: String, default: null },
});

export default mongoose.model<IBudgetUsage>('BudgetUsage', BudgetUsageSchema, 'tm_budget_usage');