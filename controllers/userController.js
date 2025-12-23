const multer = require('multer');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const cloudinary = require('../utils/cloudinary');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Ony image upload possible.'), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadUserPhoto = upload.single('photo');

const filterObj = (obj, ...allowedFields) => {
  const filteredObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) filteredObj[el] = obj[el];
  });
  return filteredObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1. Block password updates
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not defined for password updates. Please use /updateMyPassword',
        400,
      ),
    );
  }

  // 2. Filter allowed fields
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3. Upload photo if present
  if (req.file) {
    const uploadToCloudinary = () =>
      new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: 'users',
              width: 500,
              height: 500,
              crop: 'fill',
              gravity: 'face',
              public_id: `user-${req.user.id}`,
              overwrite: true,
            },
            (error, uploadResult) => {
              if (error) reject(error);
              resolve(uploadResult);
            },
          )
          .end(req.file.buffer);
      });

    const uploadResult = await uploadToCloudinary();
    filteredBody.photo = uploadResult.secure_url;
  }

  // 4. Update user
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.deleteMe = catchAsync(async (req, res, next) => {
  // 1. find user from req.user
  const userToBeDeleted = await User.findByIdAndUpdate(req.user.id, {
    active: false,
  });

  // 2. change the lable to inactive

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
