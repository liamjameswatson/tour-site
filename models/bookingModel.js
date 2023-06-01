import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId, // each booking has a tour id, coming from tour id
    ref: 'Tour',
    required: [true, 'Booking must belong to a Tour'],
  },
  user: {
    type: mongoose.Schema.ObjectId, // each booking has a user id, coming from user model
    ref: 'User',
    required: [true, 'Booking must belong to a user'],
  },
  price: {
    type: Number, // each booking must have a price
    require: [true, 'Booking must have a price'],
  },
  createdAt: {
    // each booking must have a timestamp
    type: Date,
    default: Date.now(),
  },
  paid: {
    // each booking will have a paid boolean. In case someone pays another way eg, not on stripe, in a shop with cash, or something.
    type: Boolean,
    default: true,
  },
});

// populate the fields with user and tour. Populate both on the same, as url won't be called often, only by admins and guides.
bookingSchema.pre(/^find/, function (next) {
  this.populate('user').populate({
    path: 'tour',
    select: 'name',
  });
  next();
});

export const Booking = mongoose.model('Booking', bookingSchema);
