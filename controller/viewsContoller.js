import { Tour } from './../models/tourModel.js';
import { catchAsync } from './../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';
import { User } from '../models/userModel.js';
import { Booking } from '../models/bookingModel.js';

export const alerts = (req, res, next) => {
  const { alert } = req.query;
  if (alert === 'booking') {
    res.locals.alert =
      "Your booking was successful! Please check your email for a confirmation.  If you booking doesn't show up here immediately, please come back later.";
  }
  next();
};

export const getOveverview = catchAsync(async (req, res, next) => {
  // 1) Get tour data from collection
  const tours = await Tour.find();

  // 2) Build template in Overview.pug

  // 3) Render the template using tour data from step 1.

  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

export const getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name', 404));
  }
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    )
    .render('tour', {
      title: `${tour.name} Tour`, // the tab
      tour,
    });
});

export const getloginForm = (req, res, next) => {
  res
    // .set(
    //   'Content-Security-Policy',
    // "connect-src 'self' https://cdnjs.cloudflare.com"
    // )
    .status(200)
    .render('login', {
      title: 'Log in to your account',
    });
};

export const getSignupForm = (req, res, next) => {
  res.status(200)
  .render('signUp', {
    title: 'Sign up for your account',
  })
}



export const getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

export const getMyTours = catchAsync(async (req, res, next) => {
  // 1) Find all booking documents
  const bookings = await Booking.find({
    user: req.user.id,
  });
  // 2) Find tours with returned IDs
  const tourIds = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIds } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});

export const updateUserData = catchAsync(async (req, res, next) => {
  // console.log('updating', req);
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
  });
});
