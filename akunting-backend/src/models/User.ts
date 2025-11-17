import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  password: string;
  name?: string;
  createdAt: Date;
  credentials: Array<{
    credentialID: string;
    publicKey: string;
    counter: number;
  }>;
  currentChallenge?: string;
}

const CredentialSchema = new Schema({
  credentialID: { type: String, required: true },
  publicKey: { type: String, required: true },
  counter: { type: Number, required: true },
});

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String },
    credentials: [CredentialSchema],
    currentChallenge: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema, "tm_user");
