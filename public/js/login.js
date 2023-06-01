import '@babel/polyfill';
import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: {
        email,
        password,
      },
      withCredentials: true,
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 700);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logOut = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/logout',
    });
    // if success reload the page, to clear the cookie
    if (res.data.status === 'success') {
      // location.reload(true);
      window.setTimeout(() => {
        location.assign('/');
      }, 700);
    }
  } catch (err) {
    // might be error if no internet connection
    showAlert('error', 'Error loggin out. Please try again.');
  }
};
