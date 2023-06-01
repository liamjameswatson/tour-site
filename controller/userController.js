import { AppError } from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { User } from './../models/userModel.js';
import * as factory from './handlerFactory.js';
import multer from 'multer'; // package for uploading files
import sharp from 'sharp'; //img processing libary for node.js

// const multerStroage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const extension = file.mimetype.split('/')[1]; //from req.file = .jpeg
//     cb(null, `user-${req.user.id}-${Date.now()}.${extension}`); // unique file for every upload = user-id-timestamp.jpeg
//   },
// });

const multerStorage = multer.memoryStorage(); // stores it as a buffer

const multerFilter = (req, file, cb) => {
  // filter for only allowing image files to be uploaded.
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

export const uploadUserPhoto = upload.single('photo');

export const resizeUserphoto = catchAsync( async(req, res, next) => {
  // if there is no photo on the request do nothing and next()
  if (!req.file) return next();
  else {
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`; // unique file for every upload = user-id-timestamp.jpeg
    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/users/${req.file.filename}`);
  }
  next();
});

const filteredObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

export const getME = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

export const updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'You cannot change password here. Please go to /updateMyPassword',
        400
      )
    );
  }

  //2) Filter out unwanted field names that not allowed to be updated
  const filteredBody = filteredObj(req.body, 'name', 'email');

  if (req.file) filteredBody.photo = req.file.filename;

  //3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    data: { user: updatedUser },
  });
});

export const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { isActive: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

export const createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead',
  });
};

export const getAllUsers = factory.getAll(User);
export const getUser = factory.getOne(User);
export const updateUser = factory.updateOne(User); //Do NOT update passwords with updateUser
export const deleteUser = factory.deleteOne(User);
