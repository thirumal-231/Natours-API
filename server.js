const dotenv = require('dotenv');
const mongoose = require('mongoose');

process.on('uncaughtException', (err) => {
  console.log('\n\n\n🚨 Uncaught exception! Shutting down.');
  console.log(err.name, err.message, err.stack);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

// server.js
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(
    DB,
    //   {
    //   useNewUrlParser: true, // Fixes the first DeprecationWarning
    //   useUnifiedTopology: true, // Recommended for modern drivers
    // }
  )
  .then(() => console.log('DB connection successful!'));

mongoose.connect(DB).then((con) => {
  console.log('DB Connected');
});

const port = process.env.PORT || 3003;
const server = app.listen(port, () => {
  console.log(`LISTENING ON PORT: ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log('\n\n\n🚨 Unhandled rejection! Shutting down.');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
