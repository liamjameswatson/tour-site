import { Tour } from '../models/tourModel.js';
import { catchAsync } from '../utils/catchAsync.js';
import Stripe from 'stripe';
import { Booking } from '../models/bookingModel.js';
import * as factory from './handlerFactory.js';

export const getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get current booked tour
  const tour = await Tour.findById(req.params.tourId);
  // 2) Create checkout sessions
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.create({
    //info about session
    mode: 'payment',
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`, //home url
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`, //back to their tour page
    customer_email: req.user.email, //it's proteted so user email already on the req
    client_reference_id: req.params.tourId,
    // info about product that user is about to puchase
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name}`,
            description: `${tour.summary}`,
            images: [
              `https://www.natours.dev/img/tours/${tour.imageCover}.jpg`,
            ],
          },
        },
      },
    ],
  });
  // 3) Send checkout session to client
  res.status(200).json({
    status: 'success',
    session,
  });
});

export const createBookingCheckout = catchAsync(async (req, res, next) => {
  // This is unsecure, everyone can make a booking without paying
  // console.log(req);
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();
  await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split('?')[0]);
});

export const createBooking = factory.createOne(Booking)
export const getBooking = factory.getOne(Booking)
export const getAllBookings = factory.getAll(Booking)
export const updateBooking = factory.updateOne(Booking)
export const deleteBooking = factory.deleteOne(Booking)
