import React, { useEffect, useMemo, useState } from "react";
import { SafetyCertificateOutlined } from "@ant-design/icons";
import {
  Avatar,
  Breadcrumb,
  Card,
  Col,
  Descriptions,
  Empty,
  Row,
  Space,
  Tag,
} from "antd";
import Title from "antd/lib/typography/Title";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import Box from "@iso/components/utility/box";
import { useSelector } from "react-redux";
import { useIntl } from "react-intl";
import defaultAvatar from "@iso/assets/images/avatar/0.png";
import { ContentWrapper } from "./Profile.styles";
import { getProfileUserBasic } from "../../Api/ProfileApi";
import { buildApiUrl } from "../../Api/host";
import { formatPhoneNumber } from "../../library/helpers/validators/formatPhoneNumber";
import SecureLS from "secure-ls";
import { resolveUiRole } from "@iso/lib/helpers/jwtRoles";
import MyProfile from "./Profile";

const ProfileUser = () => {
  const intl = useIntl();
  const [profileUser, setProfileUser] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const loggedUser = useSelector((state) => state.Auth);
  const ls = useMemo(() => new SecureLS({ encodingType: "aes" }), []);
  const reduxRole = useSelector((state) => {
    const r = state?.Auth?.role;
    if (!r) return null;
    if (typeof r === "string") return r;
    return r?.roleName ?? r?.RoleName ?? r?.name ?? r?.Name ?? null;
  });
  const accessToken = useSelector((state) => state?.Auth?.accessToken) || ls.get("accessToken");
  const uiRole = useMemo(() => resolveUiRole({ reduxRole, accessToken }), [reduxRole, accessToken]);

  useEffect(() => {
    if (uiRole === "worker-outsource") return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const response = await getProfileUserBasic();
        if (cancelled) return;
        if (response?.data?.data) {
          setProfileUser(response.data.data);
          setError(false);
        } else {
          setError(true);
        }
      } catch (err) {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uiRole]);

  if (uiRole === "worker-outsource") {
    return <MyProfile />;
  }

  const resolveAvatarSrc = () => {
    const imageValue = profileUser?.imageUrl || loggedUser?.imageUrl;
    if (!imageValue) return defaultAvatar;

    if (imageValue.startsWith("data:image")) {
      return imageValue;
    }

    if (imageValue.startsWith("http://") || imageValue.startsWith("https://")) {
      return imageValue;
    }

    return buildApiUrl(imageValue);
  };

  const safeText = (v) => {
    if (v === null || v === undefined) return "-";
    const s = String(v).trim();
    return s ? s : "-";
  };

  if (loading) {
    return (
      <LayoutWrapper>
        <Box>
          <p>{intl.formatMessage({ id: "profile.loading" })}</p>
        </Box>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <Box style={{ marginTop: "-20px" }}>
        <Breadcrumb style={{ marginBottom: "20px" }}>
          <Breadcrumb.Item>{intl.formatMessage({ id: "profile.breadcrumb.profile" })}</Breadcrumb.Item>
          <Breadcrumb.Item>{intl.formatMessage({ id: "profile.breadcrumb.personal" })}</Breadcrumb.Item>
        </Breadcrumb>

        <Row justify="center" gutter={[24, 24]} style={{ padding: "10px 0" }}>
          <Col xs={24} sm={24} md={24} lg={8}>
            <Card style={{ borderRadius: 2, height: "100%" }}>
              <Row
                justify="center"
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Col xs={24} sm={24} style={{ textAlign: "center" }}>
                  <Avatar
                    src={resolveAvatarSrc()}
                    size={120}
                    style={{
                      border: "5px solid white",
                      marginTop: 30,
                      marginBottom: 20,
                    }}
                  />
                </Col>

                <Col xs={24} sm={24} style={{ textAlign: "center" }}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Title level={4}>{loggedUser?.name}</Title>
                    <Title style={{ fontSize: 14, fontWeight: 400, color: "#666" }}>{profileUser?.jobTitle}</Title>
                    <Tag
                      style={{
                        border: "none",
                        borderRadius: "5px",
                        background: "linear-gradient(125deg, #4e54c8,  #8f94fb)",
                        margin: "15px 5px",
                        padding: "3px 8px",
                      }}
                      icon={<SafetyCertificateOutlined />}
                      color="#55acee"
                    >
                      {loggedUser?.customer?.customerName}
                    </Tag>
                  </Space>
                </Col>
              </Row>
            </Card>
          </Col>

          <Col xs={24} sm={24} md={24} lg={16}>
            <ContentWrapper>
              <div>
                {error || !profileUser ? (
                  <Card style={{ borderRadius: 2, height: "100%" }}>
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={intl.formatMessage({ id: "profile.empty.profileDetail" })}
                    />
                  </Card>
                ) : (
                  <Descriptions bordered size="small" column={1} labelStyle={{ width: "150px" }}>
                    <Descriptions.Item label={intl.formatMessage({ id: "profile.personal.name" })}>
                      {safeText(profileUser.name)}
                    </Descriptions.Item>
                    <Descriptions.Item label={intl.formatMessage({ id: "profile.personal.surname" })}>
                      {safeText(profileUser.surname)}
                    </Descriptions.Item>
                    <Descriptions.Item label={intl.formatMessage({ id: "profile.personal.preferredName" })}>
                      {safeText(profileUser.preferredName)}
                    </Descriptions.Item>
                    <Descriptions.Item label={intl.formatMessage({ id: "profile.personal.gender" })}>
                      {safeText(profileUser.sex)}
                    </Descriptions.Item>
                    <Descriptions.Item label={intl.formatMessage({ id: "profile.job.jobTitle" })}>
                      {safeText(profileUser.jobTitle)}
                    </Descriptions.Item>
                    <Descriptions.Item label={intl.formatMessage({ id: "profile.contact.address" })}>
                      {safeText(profileUser.address)}
                    </Descriptions.Item>
                    <Descriptions.Item label={intl.formatMessage({ id: "profile.contact.country" })}>
                      {safeText(profileUser.country)}
                    </Descriptions.Item>
                    <Descriptions.Item label={intl.formatMessage({ id: "profile.contact.province" })}>
                      {safeText(profileUser.province)}
                    </Descriptions.Item>
                    <Descriptions.Item label={intl.formatMessage({ id: "profile.contact.district" })}>
                      {safeText(profileUser.district)}
                    </Descriptions.Item>
                    <Descriptions.Item label={intl.formatMessage({ id: "profile.contact.mobile" })}>
                      <span>{profileUser?.telNo ? formatPhoneNumber(profileUser.telNo) : "-"}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label={intl.formatMessage({ id: "profile.contact.office" })}>
                      <span>{profileUser?.office ? formatPhoneNumber(profileUser.office) : "-"}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label={intl.formatMessage({ id: "profile.contact.email" })}>
                      {safeText(profileUser.email ?? profileUser.Email ?? loggedUser?.email)}
                    </Descriptions.Item>
                  </Descriptions>
                )}
              </div>
            </ContentWrapper>
          </Col>
        </Row>
      </Box>
    </LayoutWrapper>
  );
};

export default ProfileUser;
