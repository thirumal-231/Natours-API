const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: `${__dirname}/../../config.env` });
const mongoose = require('mongoose');
const Tour = require('../../models/tourModel');
const Review = require('../../models/reviewModel');
const User = require('../../models/userModel');

// Replace the password placeholder just like you did in server.js
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(
    DB,
    //   {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true,
    // }
  )
  .then(() => console.log('DB Connected to Atlas'))
  .catch((err) => console.log('Error DB:', err));

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours-copy.json`, 'utf-8'),
);
const users = JSON.parse(
  fs.readFileSync(`${__dirname}/users-copy.json`, 'utf-8'),
);
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'),
);

// import
const importAll = async () => {
  try {
    // Add the validation flag here to bypass the schema errors
    await Tour.create(tours, { validateBeforeSave: false });
    await Review.create(reviews, { validateBeforeSave: false });
    await User.create(users, { validateBeforeSave: false });

    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
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
