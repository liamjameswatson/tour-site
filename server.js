import dotenv from 'dotenv';
import app from './app.js';
import mongoose from 'mongoose';

process.on('uncaughtException', (err) => {
  console.log('UNHANDLER EXCEPTION! 💥💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE_STRING.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

const options = { useUnifiedTopology: true, useNewUrlParser: true };

mongoose.connect(DB, options).then(() => {
  console.log('DB connection successful');
  // console.log(process.env);
  // console.log(process.env.NODE_ENV);
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log(err);
  console.log('UNHANDLER REJECTION! 💥💥 Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log(`👋 SIGTERM RECIEVED, Shutting down gracefully`)
  server.close(()=>{
    console.log('💥 Process terminated!')
  })
})
