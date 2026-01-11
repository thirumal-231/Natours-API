const mongoose = require('mongoose');
const validator = require('validator');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Please specify your name.'] },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    unique: [true, 'Email is already used'],
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    default:
      'https://res.cloudinary.com/dmvbudba3/image/upload/v1768107107/default_wjbkc4.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please enter your password.'],
    validate: [validator.isStrongPassword, 'Password is not strong'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      message: 'Passwords are not same.',
      validator: function (val) {
        return val === this.password;
      },
    },
  },
  passwordChangedAt: Date,
  passwordForgetToken: String,
  passwordForgetTokenExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// comment this while importing
userSchema.pre('save', async function () {
  // encrypt only if password is modified
  if (!this.isModified('password')) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
  this.passwordConfirm = undefined;
});

userSchema.pre('save', async function () {
  if (!this.isModified('password') || this.isNew) return;
  this.passwordChangedAt = Date.now() - 1000;
});

userSchema.pre(/^find/, function () {
  this.find({ active: { $ne: false } });
});

userSchema.methods.correctPassword = async function (
  passwordTobeChecked,
  actualPassword,
) {
  return await bcrypt.compare(passwordTobeChecked, actualPassword);
};

userSchema.methods.isPasswordChagedAftertokenIssue = function (JWTTimesStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    console.log('PASS CHANGED');
    return JWTTimesStamp < changedTimeStamp;
  }
  return false;
};

userSchema.methods.sendPasswordForgetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordForgetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordForgetToken);

  this.passwordForgetTokenExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
