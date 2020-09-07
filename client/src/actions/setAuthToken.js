import axios from 'axios';

const setAuthToken = token => {

    const api = axios.create;
    if (token) {
      api.defaults.headers.common['x-auth-token'] = token;
      localStorage.setItem('token', token);
    } else {
      delete api.defaults.headers.common['x-auth-token'];
      localStorage.removeItem('token');
    }
  };
  
  export default setAuthToken;