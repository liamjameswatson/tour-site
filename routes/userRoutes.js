import { Router } from 'express';
import {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getME,
  uploadUserPhoto,
  resizeUserphoto,
} from '../controller/userController.js';
import {
  signUp,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
  restrictTo,
  logout,
} from '../controller/authController.js';

const router = Router();
router.post('/signup', signUp);
router.post('/login', login); // its post because you post the login credetionals
router.get('/logout', logout);

router.patch('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword); // patch because it modifies the password property in user object

//Protect all routes after this middleware
router.use(protect);

router.patch('/updateMyPassword', updatePassword);

router.get('/me', getME, getUser);
router.patch('/updateMe', uploadUserPhoto, resizeUserphoto, updateMe);
router.delete('/deleteMe', deleteMe);

// USER ROUTES
router.use(restrictTo('admin'));

router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

export default router;
