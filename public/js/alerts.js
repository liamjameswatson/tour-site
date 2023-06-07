export const hideAlert = () => {
  // select element with alert class and remove it
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

// create a html div element with a class of alert, and either 'success' or 'error and put in the message
//type is 'success' or 'error
export const showAlert = (type, message, time = 7) => {
  hideAlert(); // do this before showing a new alert.
  const markup = `<div class="alert alert--${type}">${message}</div>`;
  // insert this div inside the body element, at the beginning
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert, time * 1000); // hides alert after 5 seconds
};
