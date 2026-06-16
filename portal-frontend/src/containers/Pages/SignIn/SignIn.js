import React from "react";
import { Link, Redirect } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Input, { InputPassword } from "@iso/components/uielements/input";
import Button from "@iso/components/uielements/button";
import IntlMessages from "@iso/components/utility/intlMessages";
import { useIntl } from "react-intl";
import authAction from "@iso/redux/auth/actions";
import SignInStyleWrapper from "./SignIn.styles";
import message from "@iso/components/Feedback/Message";
import { Login, setAuthorizationHeader } from "../../../Api/AuthApi";
import { AcceptActiveAgreements, GetActiveAgreements } from "../../../Api/AgreementApi";
import {
  AGREEMENT_TYPES,
  getAgreementByType,
  normalizeApiList,
  parseAgreementContent,
} from "../../../utils/agreementContent";
import { Checkbox, Image, Modal } from "antd";
import intelliumlogo from "../../../assets/images/intelliumlogo1.png";

const { login } = authAction;

const isScrolledToBottom = (target) =>
  target.scrollTop + target.clientHeight >= target.scrollHeight - 8;

const getAgreementId = (agreement) => agreement?.id ?? agreement?.Id;

const getLoginErrorMessage = (error, intl) => {
  const backendError = error.response?.data;
  const status = error.response?.status;

  if (!error.response) {
    return intl.formatMessage({ id: "pages.auth.errorNetwork" });
  }

  if (status === 500 && backendError) {
    console.error("Backend 500 hatası detayı:", backendError);
  }

  return (
    backendError?.message ||
    backendError?.title ||
    (status === 500
      ? intl.formatMessage({ id: "pages.auth.errorServer" })
      : intl.formatMessage({ id: "pages.auth.errorInvalidCredentials" }))
  );
};

export default function SignIn() {
  const intl = useIntl();
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state) => state.Auth.isLoggedIn);

  const [apiProgress, setApiProgress] = React.useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [redirectToReferrer, setRedirectToReferrer] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pendingAgreementUser, setPendingAgreementUser] = React.useState(null);
  const [activeAgreements, setActiveAgreements] = React.useState([]);
  const [agreementLoading, setAgreementLoading] = React.useState(false);
  const [activeLegalModal, setActiveLegalModal] = React.useState(null);
  const [kvkkRead, setKvkkRead] = React.useState(false);
  const [consentRead, setConsentRead] = React.useState(false);
  const [kvkkAccepted, setKvkkAccepted] = React.useState(false);
  const [consentAccepted, setConsentAccepted] = React.useState(false);
  const legalTextRef = React.useRef(null);

  React.useEffect(() => {
    if (isLoggedIn && !pendingAgreementUser) {
      setRedirectToReferrer(true);
    }
  }, [isLoggedIn, pendingAgreementUser]);

  React.useEffect(() => {
    if (!activeLegalModal) return;

    const timer = window.setTimeout(() => {
      const el = legalTextRef.current;
      if (!el) return;
      el.scrollTop = 0;

      if (el.scrollHeight <= el.clientHeight + 8) {
        if (activeLegalModal === "kvkk") setKvkkRead(true);
        if (activeLegalModal === "consent") setConsentRead(true);
      }
    }, 50);

    return () => window.clearTimeout(timer);
  }, [activeLegalModal]);

  const fetchActiveAgreements = async () => {
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

  const handleLogin = async () => {
    try {
      setApiProgress(true);
      const credentials = {
        email,
        password,
      };
      const user = (await Login(credentials)).data;
      if (user?.requiresAgreementUpdate || user?.RequiresAgreementUpdate) {
        setKvkkRead(false);
        setConsentRead(false);
        setKvkkAccepted(false);
        setConsentAccepted(false);
        setPendingAgreementUser(user);
        setAuthorizationHeader({ accessToken: user.accessToken, isLoggedIn: true });
        await fetchActiveAgreements();
        setApiProgress(false);
        return;
      }

      dispatch(login(user));
    } catch (error) {
      messageApi.open({
        type: "error",
        content: getLoginErrorMessage(error, intl),
      });
      setApiProgress(false);
    }
  };

  const openLegalModal = (type) => {
    const agreement = type === "kvkk"
      ? getAgreementByType(activeAgreements, AGREEMENT_TYPES.KVKK)
      : getAgreementByType(activeAgreements, AGREEMENT_TYPES.ACIK_RIZA);

    if (!agreement) {
      messageApi.open({ type: "error", content: "Güncel sözleşme metni bulunamadı." });
      return;
    }

    setActiveLegalModal(type);
  };

  const closeLegalModal = () => setActiveLegalModal(null);

  const markActiveLegalModalAsRead = () => {
    if (activeLegalModal === "kvkk") setKvkkRead(true);
    if (activeLegalModal === "consent") setConsentRead(true);
  };

  const acceptActiveModal = () => {
    if (activeLegalModal === "kvkk") setKvkkAccepted(true);
    if (activeLegalModal === "consent") setConsentAccepted(true);
    closeLegalModal();
  };

  const handleAcceptAgreements = async () => {
    const kvkkAgreement = getAgreementByType(activeAgreements, AGREEMENT_TYPES.KVKK);
    const consentAgreement = getAgreementByType(activeAgreements, AGREEMENT_TYPES.ACIK_RIZA);
    const requiredAgreementIds = (pendingAgreementUser?.requiredAgreementIds ?? pendingAgreementUser?.RequiredAgreementIds ?? [])
      .map((id) => Number(id));
    const kvkkRequired = requiredAgreementIds.includes(Number(getAgreementId(kvkkAgreement)));
    const consentRequired = requiredAgreementIds.includes(Number(getAgreementId(consentAgreement)));

    if ((kvkkRequired && !kvkkAgreement) || (consentRequired && !consentAgreement)) {
      messageApi.open({ type: "error", content: "Güncel sözleşme metni bulunamadı." });
      return;
    }

    if ((kvkkRequired && !kvkkAccepted) || (consentRequired && !consentAccepted)) {
      messageApi.open({
        type: "error",
        content: "Devam etmek için güncellenen sözleşme metnini okuyup onaylamalısınız.",
      });
      return;
    }

    try {
      setAgreementLoading(true);
      await AcceptActiveAgreements({ agreementIds: requiredAgreementIds });
      setPendingAgreementUser(null);
      dispatch(login({ ...pendingAgreementUser, requiresAgreementUpdate: false, RequiresAgreementUpdate: false }));
      setRedirectToReferrer(true);
    } catch (error) {
      messageApi.open({
        type: "error",
        content: error?.response?.data?.message || error?.response?.data || "Sözleşme onayı kaydedilemedi.",
      });
    } finally {
      setAgreementLoading(false);
    }
  };

  const handleEmailKeyDown = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const root = document.getElementById("sign-in-password-input");
    const input =
      root && root.tagName === "INPUT"
        ? root
        : root?.querySelector?.("input.ant-input");
    input?.focus?.();
  };

  const handlePasswordKeyDown = (e) => {
    if (e.key !== "Enter" || apiProgress) return;
    e.preventDefault();
    handleLogin();
  };

  if (redirectToReferrer) {
    return <Redirect to="/dashboard" />;
  }
  const kvkkAgreement = getAgreementByType(activeAgreements, AGREEMENT_TYPES.KVKK);
  const consentAgreement = getAgreementByType(activeAgreements, AGREEMENT_TYPES.ACIK_RIZA);
  const requiredAgreementIds = (pendingAgreementUser?.requiredAgreementIds ?? pendingAgreementUser?.RequiredAgreementIds ?? [])
    .map((id) => Number(id));
  const kvkkRequired = requiredAgreementIds.includes(Number(getAgreementId(kvkkAgreement)));
  const consentRequired = requiredAgreementIds.includes(Number(getAgreementId(consentAgreement)));
  const requiredAgreementsResolved = requiredAgreementIds.every((id) =>
    activeAgreements.some((agreement) => Number(getAgreementId(agreement)) === id)
  );
  const agreementsReady = activeAgreements.length > 0
    && requiredAgreementIds.length > 0
    && requiredAgreementsResolved
    && (!kvkkRequired || Boolean(kvkkAgreement))
    && (!consentRequired || Boolean(consentAgreement));
  const requiredAgreementsAccepted =
    (!kvkkRequired || kvkkAccepted) && (!consentRequired || consentAccepted);
  const legalModalTitle =
    activeLegalModal === "kvkk"
      ? "KVKK Aydınlatma Metni"
      : activeLegalModal === "consent"
        ? "Açık Rıza Metni"
        : "";
  const legalModalAgreement = activeLegalModal === "kvkk" ? kvkkAgreement : consentAgreement;
  const legalModalText = parseAgreementContent(legalModalAgreement?.content ?? legalModalAgreement?.Content ?? "");
  const activeModalRead = activeLegalModal === "kvkk" ? kvkkRead : consentRead;

  return (
    <SignInStyleWrapper className="isoSignInPage">
      {contextHolder}
      <div className="isoLoginContentWrapper">
        <div className="isoLoginContent">
          <div className="isoLogoWrapper">
            <Image preview={false} width={100} src={intelliumlogo} />
          </div>
          <div className="isoSignInForm">
            <form>
              <div className="isoInputWrapper">
                <Input
                  size="large"
                  placeholder={intl.formatMessage({ id: "pages.auth.emailPlaceholder" })}
                  autoComplete="true"
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                  onKeyDown={handleEmailKeyDown}
                />
              </div>

              <div className="isoInputWrapper">
                <InputPassword
                  id="sign-in-password-input"
                  size="large"
                  placeholder={intl.formatMessage({ id: "pages.auth.passwordPlaceholder" })}
                  autoComplete="false"
                  onChange={(e) => {
                    setPassword(e.target.value);
                  }}
                  onKeyDown={handlePasswordKeyDown}
                />
              </div>

              <div className="isoInputWrapper isoLeftRightComponent">
                <Button
                  type="primary"
                  onClick={handleLogin}
                  loading={apiProgress}
                >
                  <IntlMessages id="page.signInButton" />
                </Button>

                <Link to="/forgotpassword" className="isoForgotPass">
                  <IntlMessages id="page.signInForgotPass" />
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Modal
        title="Sözleşme Metni Güncellendi"
        open={Boolean(pendingAgreementUser)}
        closable={false}
        maskClosable={false}
        keyboard={false}
        centered
        width={720}
        footer={[
          <Button
            key="accept"
            type="primary"
            loading={agreementLoading}
            disabled={!agreementsReady || !requiredAgreementsAccepted}
            onClick={handleAcceptAgreements}
          >
            Onayla ve Devam Et
          </Button>,
        ]}
        getContainer={false}
      >
        <div className="agreementUpdateNotice">
          Sistemimizdeki sözleşme metinlerinden biri güncellenmiştir. Devam etmek için sadece güncellenen metni onaylamanız gerekmektedir.
        </div>

        <div className="legalConsentSection">
          {kvkkRequired && (
            <div className="legalConsentRow">
              <div className="legalIcon">KV</div>
              <Checkbox
                checked={kvkkAccepted}
                disabled={!kvkkRead || !kvkkAgreement}
                onChange={(e) => setKvkkAccepted(e.target.checked)}
              />
              <button
                type="button"
                className="legalTextButton"
                disabled={agreementLoading || !kvkkAgreement}
                onClick={() => openLegalModal("kvkk")}
              >
                <strong>KVKK Aydınlatma Metni</strong>
                <span>Metni aç, sonuna kadar oku ve onayla</span>
              </button>
              <span className={kvkkAccepted ? "legalStatus accepted" : "legalStatus"}>
                {kvkkAccepted ? "Onaylandı" : kvkkRead ? "Okundu" : "Okunmadı"}
              </span>
            </div>
          )}

          {consentRequired && (
            <div className="legalConsentRow">
              <div className="legalIcon consent">AR</div>
              <Checkbox
                checked={consentAccepted}
                disabled={!consentRead || !consentAgreement}
                onChange={(e) => setConsentAccepted(e.target.checked)}
              />
              <button
                type="button"
                className="legalTextButton"
                disabled={agreementLoading || !consentAgreement}
                onClick={() => openLegalModal("consent")}
              >
                <strong>Açık Rıza Metni</strong>
                <span>Metni aç, sonuna kadar oku ve onayla</span>
              </button>
              <span className={consentAccepted ? "legalStatus accepted" : "legalStatus"}>
                {consentAccepted ? "Onaylandı" : consentRead ? "Okundu" : "Okunmadı"}
              </span>
            </div>
          )}
        </div>
      </Modal>

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
          <Button key="accept" type="primary" onClick={acceptActiveModal} disabled={!activeModalRead}>
            Okudum ve Onaylıyorum
          </Button>,
        ]}
        width={720}
        className="legalConsentModal"
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
    </SignInStyleWrapper>
  );
}
