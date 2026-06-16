import React from "react";
import Countdown from "react-count-down";
import Input from "@iso/components/uielements/input";
import Button from "@iso/components/uielements/button";
import Image from "@iso/assets/images/rob.png";
import IntlMessages from "@iso/components/utility/intlMessages";
import { useIntl } from "react-intl";
import FourZeroFourStyleWrapper from "./404.styles";

const validateEmail = (email) => {
  const regax =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return regax.test(email);
};

export default function () {
  const intl = useIntl();
  const [state, setState] = React.useState({
    email: "",
    disabled: true,
  });
  const options = {
    endDate: "03/01/2019 10:55 AM",
    prefix: intl.formatMessage({ id: "pages.comingSoon.countdownPrefix" }),
  };
  const { email, disabled } = state;
  const onChange = (event) => {
    const value = event.target.value;
    setState({ disabled: !validateEmail(value), email: value });
  };
  return (
    <FourZeroFourStyleWrapper className="iso404Page">
      <div className="iso404Content">
        <h1>{intl.formatMessage({ id: "pages.comingSoon.title" })}</h1>
        <h3>{intl.formatMessage({ id: "pages.comingSoon.subtitle" })}</h3>
        <Countdown options={options} />
        <h3>{intl.formatMessage({ id: "pages.comingSoon.subscribeHint" })}</h3>
        <p>
          <IntlMessages id="page404.description" />
        </p>
        <Input value={email} onChange={onChange} />
        <Button type="button" disabled={disabled}>
          {intl.formatMessage({ id: "pages.comingSoon.subscribe" })}
        </Button>
      </div>

      <div className="iso404Artwork">
        <img alt="#" src={Image} />
      </div>
    </FourZeroFourStyleWrapper>
  );
}
