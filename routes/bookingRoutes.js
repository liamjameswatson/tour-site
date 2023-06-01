import { Router } from 'express';
import { protect, restrictTo } from '../controller/authController.js';
import {
  createBooking,
  deleteBooking,
  getAllBookings,
  getBooking,
  updateBooking,
} from '../controller/bookingController.js';

import { getCheckoutSession } from '../controller/bookingController.js';

const router = Router();

router.use(protect);

router.get('/checkout-session/:tourId', getCheckoutSession);

router.use(restrictTo('admin', 'lead-guide'));

router.route('/').get(getAllBookings).post(createBooking);

router.route('/:id').get(getBooking).patch(updateBooking).delete(deleteBooking);

export default router;
