import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['Admin', 'Editor', 'Marker', 'Watcher'],
    required: true,
  },
  isBlocked: { type: Boolean, default: false },
}, { timestamps: true });

export const User = mongoose.model('User', UserSchema);
export default User;
