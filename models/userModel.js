import mongoose from 'mongoose';
import crypto from 'crypto';
import validator from 'validator';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, 'Please tell us your name'],
  },
  email: {
    type: String,
    trim: true,
    reuried: [true, 'Please provide your email'],
    unique: true,
    lowercase: true, //convert to lowercase
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false, //not sent to client in the res       good for SENSATIVE DATA
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREATE and SAVE!
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!',
    },
  },
  isActive: {
    type: Boolean,
    default: true,
    select: false,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

userSchema.pre('save', async function (next) {
  // if not password has been modified, return and run next()         this points at the user document
  if (!this.isModified('password')) return next();
  // encrypt password
  this.password = await bcrypt.hash(this.password, 12);
  // delete passwordConfirm  -- undefined does not get saved - only used for validation not saving -- only input is required
  this.passwordConfirm = undefined;
  next();
});

// if password changed or password is new change the passwordChangedAt value
userSchema.pre('save', async function (next) {
  // if password hasn't been changed or user just been created (document is new), just go to next()
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; //set to one second in past  to ensure token is always created after password has been changed. Token is created now().
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  // < this.password > will not work because in the schema it is set to false
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.pre(/^find/, function (next) {
  // this points to current query
  this.find({ isActive: { $ne: false } });
  next();
});

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // console.log(changedTimeStamp, JWTTimestamp);
    return JWTTimestamp < changedTimeStamp; // if changedTime is more than issued time - set to true. means password was changed after issued
  }
  // False means password has not been changed
  return false;
};

//  bcrypt.compare(compares canidate password (inputted) with (encrypted db password.)) Without this you can't compare.

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //now + 10 mins
  return resetToken;
};

export const User = mongoose.model('User', userSchema);
