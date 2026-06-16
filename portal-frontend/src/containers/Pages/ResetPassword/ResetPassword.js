import React, { useEffect, useRef, useState } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import { InputPassword } from "@iso/components/uielements/input";
import Button from "@iso/components/uielements/button";
import Checkbox from "@iso/components/uielements/checkbox";
import { Modal } from "antd";
import IntlMessages from "@iso/components/utility/intlMessages";
import ResetPasswordStyleWrapper from "./ResetPassword.styles";
import message from "@iso/components/Feedback/Message";
import {
  ChangePasswordToForgotPassword,
  ForgotPasswordLinkCheck,
} from "../../../Api/AuthApi";
import { GetActiveAgreements } from "../../../Api/AgreementApi";
import {
  AGREEMENT_TYPES,
  getAgreementByType,
  normalizeApiList,
  parseAgreementContent,
} from "../../../utils/agreementContent";
import { useIntl } from "react-intl";

const isScrolledToBottom = (target) =>
  target.scrollTop + target.clientHeight >= target.scrollHeight - 8;

export default function () {
  const intl = useIntl();
  const history = useHistory();
  const location = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLinkValid, setIsLinkValid] = useState(false);
  const [linkChecked, setLinkChecked] = useState(false);
  const [agreementLoading, setAgreementLoading] = useState(false);
  const [activeAgreements, setActiveAgreements] = useState([]);
  const [kvkkRead, setKvkkRead] = useState(false);
  const [consentRead, setConsentRead] = useState(false);
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState(null);
  const legalTextRef = useRef(null);
  const [messageApi, contextHolder] = message.useMessage();

  const token = new URLSearchParams(location.search).get("value");

  useEffect(() => {
    const fetchAgreements = async () => {
      try {
        setAgreementLoading(true);
        const response = await GetActiveAgreements();
        setActiveAgreements(normalizeApiList(response));
      } catch (error) {
        messageApi.open({
          type: "error",
          content: "Güncel KVKK ve açık rıza metinleri yüklenemedi.",
        });
      } finally {
        setAgreementLoading(false);
      }
    };

    const checkLink = async () => {
      if (!token) {
        messageApi.open({
          type: "error",
          content: intl.formatMessage({ id: "pages.resetPassword.invalidLink" }),
        });
        setLinkChecked(true);
        return;
      }

      try {
        await ForgotPasswordLinkCheck(token);
        setIsLinkValid(true);
      } catch (error) {
        const errorMessage =
          error?.response?.data || intl.formatMessage({ id: "pages.resetPassword.linkExpired" });
        messageApi.open({ type: "error", content: errorMessage });
      } finally {
        setLinkChecked(true);
      }
    };

    checkLink();
    fetchAgreements();
  }, [token, messageApi, intl]);

  useEffect(() => {
    if (!activeLegalModal) return;

    const timer = window.setTimeout(() => {
      const el = legalTextRef.current;
      if (!el) return;
      el.scrollTop = 0;

      // Çok büyük ekranlarda metin scroll üretmezse kullanıcıyı kilitleme.
      if (el.scrollHeight <= el.clientHeight + 8) {
        if (activeLegalModal === "kvkk") setKvkkRead(true);
        if (activeLegalModal === "consent") setConsentRead(true);
      }
    }, 50);

    return () => window.clearTimeout(timer);
  }, [activeLegalModal]);

  const handleReset = async () => {
    if (!isLinkValid) return;

    const kvkkAgreement = getAgreementByType(activeAgreements, AGREEMENT_TYPES.KVKK);
    const consentAgreement = getAgreementByType(activeAgreements, AGREEMENT_TYPES.ACIK_RIZA);

    if (!kvkkAgreement || !consentAgreement) {
      messageApi.open({
        type: "error",
        content: "Güncel KVKK ve açık rıza metinleri bulunamadı.",
      });
      return;
    }

    if (!kvkkAccepted || !consentAccepted) {
      messageApi.open({
        type: "error",
        content: "Devam etmek için KVKK ve açık rıza metinlerini sonuna kadar okuyup onaylamalısınız.",
      });
      return;
    }

    if (!password || password.length < 4) {
      messageApi.open({
        type: "error",
        content: intl.formatMessage({ id: "pages.resetPassword.passwordMin" }),
      });
      return;
    }

    if (password !== confirmPassword) {
      messageApi.open({
        type: "error",
        content: intl.formatMessage({ id: "pages.resetPassword.passwordMismatch" }),
      });
      return;
    }

    try {
      setLoading(true);
      await ChangePasswordToForgotPassword({
        value: token,
        password,
        legalConsentAcceptedAt: new Date().toISOString(),
        agreementIds: [kvkkAgreement.id, consentAgreement.id],
      });
      messageApi.open({
        type: "success",
        content: intl.formatMessage({ id: "pages.resetPassword.success" }),
      });
      setTimeout(() => history.push("/signin"), 1200);
    } catch (error) {
      const errorMessage = error?.response?.data || intl.formatMessage({ id: "pages.resetPassword.errorUpdate" });
      messageApi.open({ type: "error", content: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const openLegalModal = (type) => {
    const agreement = type === "kvkk"
      ? getAgreementByType(activeAgreements, AGREEMENT_TYPES.KVKK)
      : getAgreementByType(activeAgreements, AGREEMENT_TYPES.ACIK_RIZA);

    if (!agreement) {
      messageApi.open({
        type: "error",
        content: "Güncel sözleşme metni bulunamadı.",
      });
      return;
    }

    setActiveLegalModal(type);
  };

  const closeLegalModal = () => {
    setActiveLegalModal(null);
  };

  const legalModalTitle =
    activeLegalModal === "kvkk"
      ? "KVKK Aydınlatma Metni"
      : activeLegalModal === "consent"
        ? "Açık Rıza Metni"
        : "";
  const kvkkAgreement = getAgreementByType(activeAgreements, AGREEMENT_TYPES.KVKK);
  const consentAgreement = getAgreementByType(activeAgreements, AGREEMENT_TYPES.ACIK_RIZA);
  const legalModalAgreement = activeLegalModal === "kvkk" ? kvkkAgreement : consentAgreement;
  const legalModalText = parseAgreementContent(legalModalAgreement?.content ?? legalModalAgreement?.Content ?? "");
  const activeModalRead = activeLegalModal === "kvkk" ? kvkkRead : consentRead;
  const agreementsReady = Boolean(kvkkAgreement && consentAgreement);
  const markActiveLegalModalAsRead = () => {
    if (activeLegalModal === "kvkk") setKvkkRead(true);
    if (activeLegalModal === "consent") setConsentRead(true);
  };
  const acceptActiveModal = () => {
    if (activeLegalModal === "kvkk") {
      setKvkkAccepted(true);
    }
    if (activeLegalModal === "consent") {
      setConsentAccepted(true);
    }
    closeLegalModal();
  };

  return (
    <ResetPasswordStyleWrapper className="isoResetPassPage">
      {contextHolder}
      <div className="isoFormContentWrapper">
        <div className="isoFormContent">
          <div className="isoLogoWrapper">
            <Link to="/dashboard">
              <IntlMessages id="page.resetPassTitle" />
            </Link>
          </div>

          <div className="isoFormHeadText">
            <h3>
              <IntlMessages id="page.resetPassSubTitle" />
            </h3>
          </div>

          <div className="isoResetPassForm">
            <div className="isoInputWrapper">
              <InputPassword
                size="large"
                placeholder={intl.formatMessage({ id: "pages.resetPassword.newPasswordPlaceholder" })}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!linkChecked || !isLinkValid}
              />
            </div>

            <div className="isoInputWrapper">
              <InputPassword
                size="large"
                placeholder={intl.formatMessage({ id: "pages.resetPassword.confirmPasswordPlaceholder" })}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onPressEnter={handleReset}
                disabled={!linkChecked || !isLinkValid}
              />
            </div>

            <div className="legalConsentSection">
              <div className="legalConsentRow">
                <div className="legalIcon">KV</div>
                <Checkbox
                  checked={kvkkAccepted}
                  disabled={!kvkkRead || !linkChecked || !isLinkValid || !kvkkAgreement}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setKvkkAccepted(checked);
                  }}
                />
                <button
                  type="button"
                  className="legalTextButton"
                  disabled={!linkChecked || !isLinkValid || agreementLoading || !kvkkAgreement}
                  onClick={() => openLegalModal("kvkk")}
                >
                  <strong>KVKK Aydınlatma Metni</strong>
                  <span>Metni aç, sonuna kadar oku ve onayla</span>
                </button>
                <span className={kvkkAccepted ? "legalStatus accepted" : "legalStatus"}>
                  {kvkkAccepted ? "Onaylandı" : kvkkRead ? "Okundu" : "Okunmadı"}
                </span>
              </div>

              <div className="legalConsentRow">
                <div className="legalIcon consent">AR</div>
                <Checkbox
                  checked={consentAccepted}
                  disabled={!consentRead || !linkChecked || !isLinkValid || !consentAgreement}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setConsentAccepted(checked);
                  }}
                />
                <button
                  type="button"
                  className="legalTextButton"
                  disabled={!linkChecked || !isLinkValid || agreementLoading || !consentAgreement}
                  onClick={() => openLegalModal("consent")}
                >
                  <strong>Açık Rıza Metni</strong>
                  <span>Metni aç, sonuna kadar oku ve onayla</span>
                </button>
                <span className={consentAccepted ? "legalStatus accepted" : "legalStatus"}>
                  {consentAccepted ? "Onaylandı" : consentRead ? "Okundu" : "Okunmadı"}
                </span>
              </div>
            </div>

            <div className="isoInputWrapper">
              <Button
                type="primary"
                onClick={handleReset}
                loading={loading}
                disabled={!linkChecked || !isLinkValid || agreementLoading || !agreementsReady || !kvkkAccepted || !consentAccepted}
              >
                <IntlMessages id="page.resetPassSave" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        title={
          <div className="legalModalTitle">
            <span>{legalModalTitle}</span>
            <small>Devam etmek için metnin sonuna kadar inin.</small>
          </div>
        }
        open={Boolean(activeLegalModal)}
        onCancel={closeLegalModal}
        footer={[
          <Button key="close" onClick={closeLegalModal}>
            Kapat
          </Button>,
          <Button
            key="accept"
            type="primary"
            onClick={acceptActiveModal}
            disabled={!activeModalRead}
          >
            Okudum ve Onaylıyorum
          </Button>,
        ]}
        width={720}
        className="legalConsentModal"
        wrapClassName="resetPasswordLegalModal"
        centered
        bodyStyle={{ padding: 0 }}
        getContainer={false}
        destroyOnClose
      >
        <div
          ref={legalTextRef}
          className="legalModalText"
          onScroll={(e) => {
            if (isScrolledToBottom(e.currentTarget)) markActiveLegalModalAsRead();
          }}
        >
          <div className="legalModalLead">
            Lütfen aşağıdaki metni okuyun. Metnin sonuna indiğinizde onay butonu aktifleşir.
          </div>
          <div className="legalModalParagraphs">
            {legalModalText.map((block, index) => {
              if (block.type === "title") {
                return <h3 key={`${activeLegalModal}-${index}`}>{block.text}</h3>;
              }

              if (block.type === "list") {
                return (
                  <ul key={`${activeLegalModal}-${index}`}>
                    {block.items.map((item, itemIndex) => (
                      <li key={`${activeLegalModal}-${index}-${itemIndex}`}>{item}</li>
                    ))}
                  </ul>
                );
              }

              return <p key={`${activeLegalModal}-${index}`}>{block.text}</p>;
            })}
          </div>
        </div>
        {!activeModalRead ? (
          <div className="legalModalHint">Onaylamak için metni sonuna kadar kaydırın.</div>
        ) : (
          <div className="legalModalHint success">Metin sonuna kadar okundu. Onaylayabilirsiniz.</div>
        )}
      </Modal>
    </ResetPasswordStyleWrapper>
  );
}
