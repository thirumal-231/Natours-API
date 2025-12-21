const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: `${__dirname}/../../config.env` });
const mongoose = require('mongoose');
const Tour = require('../../models/tourModel');
const Review = require('../../models/reviewModel');
const User = require('../../models/userModel');

mongoose
  .connect(process.env.DATABASE_LOCAL)
  .then(() => console.log('DB Connected'))
  .catch(() => {
    console.log('Error DB');
  });

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'),
);

// import
const importAll = async () => {
  //   try {
  await Tour.create(tours);
  await Review.create(reviews, { validateBeforeSave: false });
  await User.create(users, { validateBeforeSave: false });
  console.log('IMPORTED.');
  process.exit();
  //   } catch (error) {
  //   console.log(error);
  //   }
};

// delete
const deleteAll = async () => {
  //   try {
  await Tour.deleteMany();
  await Review.deleteMany();
  await User.deleteMany();
  console.log('DELETED ALL.');
  process.exit();
  //   } catch (error) {
  // console.log(error);
  //   }
};

if (process.argv[2] === '--import') {
  importAll();
} else if (process.argv[2] === '--delete') {
  deleteAll();
}
