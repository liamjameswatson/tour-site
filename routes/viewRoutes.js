import express from 'express';
import {
  getOveverview,
  getTour,
  getloginForm,
  getSignupForm,
  getAccount,
  updateUserData,
  getMyTours,
  alerts,
} from '../controller/viewsContoller.js';
import { isLoggedIn, protect } from '../controller/authController.js';

const router = express.Router();

router.use(alerts);

router.get('/', isLoggedIn, getOveverview);
router.get('/tour/:slug', isLoggedIn, getTour);
router.get('/login', isLoggedIn, getloginForm);
router.get('/signup', getSignupForm);
router.get('/me', protect, getAccount);

router.get('/my-tours', protect, getMyTours);

router.post('/submit-user-data', protect, updateUserData);

export default router;
