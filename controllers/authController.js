/* eslint-disable import/no-extraneous-dependencies */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const sendEmail = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
    passwordChangedAt: req.body.passwordChangedAt,
  });
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2. check if user exists and password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!(await user.correctPassword(password, user.password))) {
    console.log('Pass:', password, 'new:', user.password);
    // 401 unauthorised
    return next(new AppError('Incorrect Email or Password!', 401));
  }

  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1. Get token and check is this there
  console.log('COOKIES', req.cookies);
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  // console.log('TOKEN', req.cookies.jwt);
  if (!token) {
    return next(new AppError("You're not logged in, Please log in.", 401));
  }
  // 2. Verify token
  const decodedPayload = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET,
  );
  // console.log(decodedPayload);

  // 3. check if user still exists
  const currentUser = await User.findById(decodedPayload.id);
  if (!currentUser) {
    return next(new AppError('The user no longer exists.', 401));
  }

  // 4. Check if user has changed password after the token is issued
  if (currentUser.isPasswordChagedAftertokenIssue(decodedPayload.iat)) {
    return next(
      new AppError('Password has been changed. Please log in again', 401),
    );
  }
  req.user = currentUser;
  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You dont have permission to do so.', 403));
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with the email address.', 404));
  }
  // 2. Generate the random reset token
  const forgetToken = user.sendPasswordForgetToken();
  await user.save({ validateBeforeSave: false });

  // 3. Send it to users email
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${forgetToken}`;
  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to:${resetURL}.\nIf you did not forget your password, Please ignore this email.`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token valid for 10mins',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (error) {
    // no need for passwordForetToken and expires if token is not sent right
    user.passwordForgetToken = undefined;
    user.passwordForgetTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later.',
        500,
      ),
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Take token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // console.log(hashedToken);

  // 2. See if user exists and forget token not expired
  const user = await User.findOne({
    passwordForgetToken: hashedToken,
    passwordForgetTokenExpires: { $gt: Date.now() },
  });

  // console.log(user);

  // 3. See if token expires otherwise change password
  if (!user) {
    // bad request
    return next(new AppError('Password reset Token expired or invalid', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  // if password is changed forgot token and expires are not required anymore
  user.passworForgetToken = undefined;
  user.passworForgetTokenExpires = undefined;
  await user.save();

  // 4. update passwordchanged at

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2. check if posted current password is correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3. if so update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  // findByIdAndUpdate will not work as intended because this will not be defined when we update
  await user.save();

  createSendToken(user, 200, res);
});
