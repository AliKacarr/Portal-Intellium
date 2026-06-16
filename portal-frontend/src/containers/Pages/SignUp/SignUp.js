import React from "react";
import { Link } from "react-router-dom";
import Input from "@iso/components/uielements/input";
import Checkbox from "@iso/components/uielements/checkbox";
import Button from "@iso/components/uielements/button";
import intelliumlogo from "../../../assets/images/intelliumlogo1.png";
import IntlMessages from "@iso/components/utility/intlMessages";
import { useIntl } from "react-intl";
import SignUpStyleWrapper from "./SignUp.styles";
import { Image } from "antd";

//const { login } = authAction;
//const { clearMenu } = appActions;

export default function SignUp() {
  const intl = useIntl();
  //const dispatch = useDispatch();
  //const history = useHistory();

  // const handleLogin = (token = false) => {
  //   console.log(token, "handlelogin");
  //   if (token) {
  //     dispatch(login(token));
  //   } else {
  //     dispatch(login());
  //   }
  //   dispatch(clearMenu());
  //   history.push("/dashboard");
  // };

  return (
    <SignUpStyleWrapper className="isoSignUpPage">
      <div className="isoSignUpContentWrapper">
        <div className="isoSignUpContent">
          <div className="isoLogoWrapper">
            <Image preview={false} width={100} src={intelliumlogo} />
          </div>

          <div className="isoSignUpForm">
            <div className="isoInputWrapper isoLeftRightComponent">
              <Input size="large" placeholder={intl.formatMessage({ id: "pages.signUp.firstNamePlaceholder" })} />
              <Input size="large" placeholder={intl.formatMessage({ id: "pages.signUp.lastNamePlaceholder" })} />
            </div>

            <div className="isoInputWrapper">
              <Input size="large" placeholder={intl.formatMessage({ id: "pages.signUp.usernamePlaceholder" })} />
            </div>

            <div className="isoInputWrapper">
              <Input size="large" placeholder={intl.formatMessage({ id: "pages.signUp.emailPlaceholder" })} />
            </div>

            <div className="isoInputWrapper">
              <Input size="large" type="password" placeholder={intl.formatMessage({ id: "pages.signUp.passwordPlaceholder" })} />
            </div>

            <div className="isoInputWrapper">
              <Input
                size="large"
                type="password"
                placeholder={intl.formatMessage({ id: "pages.signUp.confirmPasswordPlaceholder" })}
              />
            </div>

            <div className="isoInputWrapper" style={{ marginBottom: "50px" }}>
              <Checkbox>
                <IntlMessages id="page.signUpTermsConditions" />
              </Checkbox>
            </div>

            <div className="isoInputWrapper">
              <Button type="primary">
                <IntlMessages id="page.signUpButton" />
              </Button>
            </div>
            {/* <div className="isoInputWrapper isoOtherLogin">
              <Button
                onClick={handleLogin}
                type="primary"
                className="btnFacebook"
              >
                <IntlMessages id="page.signUpFacebook" />
              </Button>
              <Button
                onClick={handleLogin}
                type="primary"
                className="btnGooglePlus"
              >
                <IntlMessages id="page.signUpGooglePlus" />
              </Button>
              <Button
                onClick={() => {
                  Auth0.login();
                }}
                type="primary"
                className="btnAuthZero"
              >
                <IntlMessages id="page.signUpAuth0" />
              </Button>

              <FirebaseSignUpForm
                signup={true}
                history={history}
                login={() => dispatch(login())}
              />
            </div> */}
            <div className="isoInputWrapper isoCenterComponent isoHelperWrapper">
              <Link to="/signin">
                <IntlMessages id="page.signUpAlreadyAccount" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </SignUpStyleWrapper>
  );
}
