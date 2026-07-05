const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  isOnline: {
    type: Boolean,
    default: false,
  },
  avatar: {
    type: String,
    default: '',
  },
  about: {
    type: String,
    default: 'Hey there! I am using ChatHive.',
  },
  tags: [
    {
      type: String,
    },
  ],
  isProfileComplete: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);