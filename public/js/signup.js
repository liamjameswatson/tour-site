import { showAlert } from './alerts';
import axios from 'axios';
export const signup = async ({ name, email, password, passwordConfirm }) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data: {
        name,
        email,
        password,
        passwordConfirm,
      },
    });

    if (res.data.status === 'success') {
      showAlert('Signup successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }

    console.log(res);
  } catch (error) {
    showAlert(error.response.data.message);
    console.log(error.response.data.message);
    console.log(error);
  }
};

// document.querySelector('.form--signup').addEventListener('submit', (e) => {
//   e.preventDefault();

//   const name = document.getElementById('name').value;
//   const email = document.getElementById('email').value;
//   const password = document.getElementById('password').value;
//   const passwordConfirm = document.getElementById('passwordConfirm').value;
//   signup(name, email, password, passwordConfirm);
// });
