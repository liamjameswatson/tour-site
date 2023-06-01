import { readFileSync } from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Tour } from './../../models/tourModel.js';
import { User } from './../../models/userModel.js';
import { Review } from './../../models/reviewModel.js';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE_STRING.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log('DB connection successful!');
  });

// READ JSON FILE
const tours = JSON.parse(readFileSync(`${__dirname}/tours.json`, 'utf-8')); //creates array of js objects
const users = JSON.parse(readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

//IMPORT DATA INTO DATABASE
const importData = async () => {
  try {
    await Tour.create(tours); //creates a new object for each object in array
    await User.create(users, {validateBeforeSave: false});
    await Review.create(reviews);
    console.log('Data successfully imported');
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

// DELETE ALL DATA FROM COLLECTION IN DATABASE - deleteMany()
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data successfully deleted');
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

console.log(process.argv);

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

//now open terminal, go to this file and run --importData or --deleteData
