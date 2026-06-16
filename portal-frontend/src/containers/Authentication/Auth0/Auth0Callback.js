import React, { useEffect } from 'react';
import Auth0 from './Auth0';
import authActions from '@iso/redux/auth/actions';
import IntlMessages from '@iso/components/utility/intlMessages';
const Auth0Callback = () => {
  useEffect(() => {
    Auth0.handleAuthentication();
    authActions.login();
  }, []);

  return <p><IntlMessages id="authentication.auth0.loading" /></p>;
};

export default Auth0Callback;
