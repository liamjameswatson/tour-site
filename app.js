import express from 'express';
import morgan from 'morgan';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

import tourRouter from './routes/tourRoutes.js';
import userRouter from './routes/userRoutes.js';
import reviewRouter from './routes/reviewRoutes.js';
import viewRouter from './routes/viewRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';

import { AppError } from './utils/appError.js';
import globalErrorHandler from './controller/errorController.js';

import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//* serving static files
// connect to static file
app.use(express.static(path.join(__dirname, 'public')));

// A series of functions that turns a request into a response. Modifies code from server to be able to be read by front end, and vicer/versa
//? 1) Global Middlewares
//* Set security HTTP headers

// app.use(helmet({ contentSecurityPolicy: false }));

// Put helmet at top so it will set the rest of the headers
// app.use(helmet());

// Further HELMET configuration for Security Policy (CSP)
const scriptSrcUrls = [
  'https://api.tiles.mapbox.com/',
  'https://api.mapbox.com/',
  'cdnjs.cloudflare.com',
  'unpkg.com',
  'https://js.stripe.com/v3/',
];
const styleSrcUrls = [
  'https://api.mapbox.com/',
  'https://api.tiles.mapbox.com/',
  'https://fonts.googleapis.com/',
  'cdnjs.cloudflare.com',
];
const connectSrcUrls = [
  'https://api.mapbox.com/',
  'https://a.tiles.mapbox.com/',
  'https://b.tiles.mapbox.com/',
  'https://events.mapbox.com/',
  'http://127.0.0.1:3000/',
];
const fontSrcUrls = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'maxcdn.bootstrapcdn.com',
];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      scriptSrcElem: ["'self'", ...scriptSrcUrls],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: [],
      imgSrc: ["'self'", 'blob:', 'data:'],
      fontSrc: ["'self'", ...fontSrcUrls],
    },
  })
);

app.use(
  helmet.crossOriginResourcePolicy({
    policy: 'same-origin',
  })
);

//* Development Logging
// console.log(`the value of process.env.NODE_ENV is ${process.env.NODE_ENV}`, typeof(process.env.NODE_ENV));
if (process.env.NODE_ENV.trim() === 'development') {
  // console.log('Using Morgan middleware');
  app.use(morgan('dev'));
} else {
  // console.log('NODE_ENV is not "development"');
}

//* Limit requests from same address
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // 100 requests per hour
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

//* body parser, reading data from the body into req.body
app.use(express.json({ limit: '10kb' }));

app.use(
  express.urlencoded({
    extended: true,
    limit: '10kb',
  })
);
app.use(cookieParser());

// Enable CORS using cors middleware
app.use(
  cors({
    origin: 'http://127.0.0.1:3000/',
    credentials: true, // Allows sending cookies across domains
  })
);

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:3000/');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

//  Data sanitization goes here is perfect after the data has been parsed
//* Data sanitization against NOSQL query injection
app.use(mongoSanitize());

//* Data sanitization against XSS
app.use(xss());

//* Prevent paramete pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

app.use(compression());

// * Test middleware
app.use((req, res, next) => {
  console.log('heello from the middleware👋');
  next();
});

// Use middleware to add a time to the request
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//* 3 ROUTES - Mount the routes here
// app.use(the route, the variable)
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// * is for everything else. put at bottom
app.all('*', (req, res, next) => {
  //   const err = new Error(`cannot find ${req.originalUrl} on this server. `)
  //   err.status = 'fail'
  //   err.StatusCode = 404;
  next(new AppError(`cannot find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;

/* Status Responses:

200 = ok
201 = created
404 = not found
500 = error ( can be good for a placeholder)

*/
