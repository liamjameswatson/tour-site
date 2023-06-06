/* eslint-disable */
import axios from 'axios';
import Stripe from 'stripe';
import { showAlert } from './alerts';
const stripe = Stripe(
  'pk_test_51NCk7XHsEhTZcNCRwFCQsqbJ9QLcmrw2b0iOAB8sDOXAsWoeUrvua9Sqra3g5lK2NmOaxpQEaxP1XV8DCyAgfHeO00nT8ec2Jv'
);

export const bookTour = async (tourId) => {
  try {
    //1) Get checkout session from API endpoint

    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    console.log(session);
    //2) open the stripe checkout page (provided by the session.url)
    window.location.assign(session.data.session.url);
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
