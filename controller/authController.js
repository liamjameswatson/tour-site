import { promisify } from 'util';
import { User } from './../models/userModel.js';
import { catchAsync } from '../utils/catchAsync.js';
import jwt from 'jsonwebtoken';
import { AppError } from './../utils/appError.js';
import { Email } from './../utils/email.js';
import crypto from 'crypto';

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);
  // console.log('token =,', token);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  };

  // remove the password from the output
  user.password = undefined;
  user.isActive = undefined;
  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

export const signUp = catchAsync(async (req, res, next) => {
  console.log(req.body);
  const newUser = await User.create(req.body);
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  // console.log(url)
  createSendToken(newUser, 201, req, res);
});

export const login = catchAsync(async (req, res, next) => {
  // const email = req.body.email;
  // const password = req.body.password
  const { email, password } = req.body; //object descruturing

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  //2) Check if user exists && password is correct
  const user = await User.findOne({ email: email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // If everything ok, send token to client
  // 3) send back token
  createSendToken(user, 200, req, res);
});

export const logout = (req, res) => {
  res.cookie('jwt', '', {
    expires: new Date(Date.now() + 10 * 1000), //10 seconds
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

export const protect = catchAsync(async (req, res, next) => {
  // 1) Does token exist
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt && req.cookies.jwt !== 'loggedout') {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError('you are not logged in! Please log in to get access', 401)
    );
  }

  // 2) Check if token is valid, not been manipulated or expired
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Does user still exist? Has user been deleted?
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging this token does no longer exist', 401)
    );
  }

  // 4) Did user change password after was token was issued?
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    //iat = issued at - the timestamp
    return next(
      new AppError('User recently changed password! Please log in again', 401)
    );
  }
  // Only if user passes all these checks, grant access to protect route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

//Only for rendered pages, no errors!
export const isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      // 1) Verify the token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Does user still exist? Has user been deleted?
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Did user change password after was token was issued?
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        //iat = issued at - the timestamp
        return next();
      }
      // Only if user passes all these checks, there is a logged in user
      res.locals.user = currentUser; //res.locals is what the templates have access to.
      return next();
    }
  } catch (err) {
    next();
  }
  next();
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

export const forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address', 404));
  }
  // 2) Generate a random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send token to email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});
export const resetPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //3) Update changedPassword propert for the user

  //4) Log the user in, send JWT
  createSendToken(user, 200, req, res);
});

export const updatePassword = catchAsync(async (req, res, next) => {
  //1) Get the user from the collection
  const user = await User.findById(req.user.id).select('+password');

  //2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  //3) If correct, update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //4) Log user in, send JWT
  createSendToken(user, 200, req, res);
});
