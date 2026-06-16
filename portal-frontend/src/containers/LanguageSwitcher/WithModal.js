import React from "react";
import { useDispatch, useSelector } from "react-redux";
import Modal from "@iso/components/Feedback/Modal";
import Button from "@iso/components/uielements/button";
import actions from "@iso/redux/languageSwitcher/actions";
import config from "./config";
import { useIntl } from "react-intl";

const { switchActivation, changeLanguage } = actions;

export default function LanguageSwitcher({ isActivated }) {
  const intl = useIntl();
  const dispatch = useDispatch();
  const { language } = useSelector((state) => state.LanguageSwitcher);
  // const {
  //   isActivated,
  //   switchActivation,
  //   changeLanguage,
  // } = this.props;
  return (
    <div className="isoButtonWrapper">
      <Button
        type="primary"
        className=""
        onClick={() => dispatch(switchActivation())}
      >
        {intl.formatMessage({ id: "languageSwitcher.switchLanguage" })}
      </Button>

      <Modal
        title={intl.formatMessage({ id: "languageSwitcher.selectLanguage" })}
        open={isActivated}
        onCancel={() => dispatch(switchActivation())}
        cancelText={intl.formatMessage({ id: "languageSwitcher.cancel" })}
        footer={[]}
      >
        <div>
          {config.options.map((option) => {
            const { languageId, textKey } = option;
            const type =
              languageId === language.languageId ? "primary" : "success";
            return (
              <Button
                type={type}
                key={languageId}
                onClick={() => {
                  dispatch(changeLanguage(languageId));
                }}
              >
                {intl.formatMessage({ id: textKey })}
              </Button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
