import { Router } from 'express';
import {
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  getToursWithin,
  getDistances,
  uploadTourImages,
  resizeTourImages,
} from '../controller/tourController.js';
import { protect, restrictTo } from '../controller/authController.js';
// import { createReview } from './../controller/reviewController.js';
// import reviewRouter from './../routes/reviewRoutes.js';
import reviewRouter from './reviewRoutes.js';

const router = Router();

//POST /tour/2354fggfssg/reviews
//GET /tour/2354fggfssg/reviews

router.use('/:tourId/reviews', reviewRouter);

router.route('/top-5-cheap').get(aliasTopTours, getAllTours); //getAllTours request but change in middleware, to match params for top 5 tours.

router.route('/tour-stats').get(getTourStats);
router
  .route('/monthly-plan/:year')
  .get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(getDistances);

router
  .route('/')
  .get(getAllTours)
  .post(protect, restrictTo('admin', 'lead-guide'), createTour);

router
  .route('/:id')
  .get(getTour)
  .patch(
    protect,
    restrictTo('admin', 'lead-guide'),
    uploadTourImages,
    resizeTourImages,
    updateTour
  )
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

export default router;
