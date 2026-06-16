import React, { useEffect, useState, useMemo } from "react";
import { Avatar, Breadcrumb, Card, Col, Row, Space, Tabs, Tag } from "antd";
import { useIntl } from "react-intl";
import { ContentWrapper } from "./Profile.styles";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import Box from "@iso/components/utility/box";
import PersonalInfo from "./personalInfo";
import JobInfo from "./jobInfo";
import ContactInfo from "./contactInfo";
import EduInfo from "./educationInfo";
import LangInfo from "./languageInfo";
import CertificateInfo from "./certificateInfo";
import FamilyInfo from "./familyInfo";
import {
  getProfileByUserId,
  getJobByUserId,
  getEduByUserId,
  getJobExperienceByUserId,
  getLanguageByUserId,
  getCertificateByUserId,
  getFamilyByUserId,
} from "../../Api/ProfileApi";
import { buildApiUrl } from "../../Api/host";
import { UserDetail } from "../../Api/UserApi";
import { useSelector } from "react-redux";
import defaultAvatar from "@iso/assets/images/avatar/0.png";
import { SafetyCertificateOutlined } from "@ant-design/icons";
import Title from "antd/lib/typography/Title";

const MyProfile = () => {
  const intl = useIntl();
  const loggedUser = useSelector((state) => state.Auth);

  const [personalInformation, setPersonalInformation] = useState();
  const [jobInfo, setJobInfo] = useState();
  const [eduInfo, setEduInfo] = useState();
  const [experience, setExperience] = useState();
  const [language, setLanguage] = useState();
  const [certificate, setCertificate] = useState();
  const [family, setFamily] = useState();
  const [currentUserImageUrl, setCurrentUserImageUrl] = useState(loggedUser?.imageUrl || null);

  useEffect(() => {
    const fetchData = async () => {
      const [
        profileResponse,
        jobResponse,
        eduResponse,
        experienceResponse,
        languageResponse,
        certificateResponse,
        familyResponse,
        userResponse,
      ] = await Promise.all([
        getProfileByUserId(loggedUser.id),
        getJobByUserId(loggedUser.id),
        getEduByUserId(loggedUser.id),
        getJobExperienceByUserId(loggedUser.id),
        getLanguageByUserId(loggedUser.id),
        getCertificateByUserId(loggedUser.id),
        getFamilyByUserId(loggedUser.id),
        UserDetail(loggedUser.id),
      ]);

      setPersonalInformation(profileResponse.data.data);
      setJobInfo(jobResponse.data.data);
      setEduInfo(eduResponse.data.data);
      setExperience(experienceResponse.data.data);
      setLanguage(languageResponse.data.data);
      setCertificate(certificateResponse.data.data);
      setFamily(familyResponse.data.data);
      setCurrentUserImageUrl(userResponse?.data?.data?.imageUrl || null);
    };

    fetchData();
  }, [loggedUser.id]);

  const resolveAvatarSrc = () => {
    const imageValue = currentUserImageUrl || personalInformation?.imageUrl || loggedUser?.imageUrl;
    if (!imageValue) return defaultAvatar;

    if (imageValue.startsWith("data:image")) {
      return imageValue;
    }

    if (imageValue.startsWith("http://") || imageValue.startsWith("https://")) {
      return imageValue;
    }

    return buildApiUrl(imageValue);
  };

  const tabsItems = useMemo(
    () => [
      {
        key: "1",
        label: intl.formatMessage({ id: "profile.tab.profileDetail" }),
        children: <PersonalInfo personalInformation={personalInformation ?? null} />,
      },
      {
        key: "2",
        label: intl.formatMessage({ id: "profile.tab.job" }),
        children: <JobInfo jobInfo={jobInfo} experience={experience} />,
      },
      {
        key: "3",
        label: intl.formatMessage({ id: "profile.tab.contact" }),
        children: <ContactInfo personalInformation={personalInformation} />,
      },
      {
        key: "4",
        label: intl.formatMessage({ id: "profile.tab.education" }),
        children: <EduInfo eduInfo={eduInfo} />,
      },
      {
        key: "5",
        label: intl.formatMessage({ id: "profile.tab.language" }),
        children: <LangInfo language={language} />,
      },
      {
        key: "6",
        label: intl.formatMessage({ id: "profile.tab.certificates" }),
        children: <CertificateInfo certificate={certificate} />,
      },
      {
        key: "7",
        label: intl.formatMessage({ id: "profile.tab.family" }),
        children: <FamilyInfo family={family} />,
      },
    ],
    [intl, personalInformation, jobInfo, experience, eduInfo, language, certificate, family]
  );

  return (
    <LayoutWrapper>
      <Box style={{ marginTop: "-20px" }}>
        <Breadcrumb style={{ marginBottom: "20px" }}>
          <Breadcrumb.Item>{intl.formatMessage({ id: "profile.breadcrumb.profile" })}</Breadcrumb.Item>

          <Breadcrumb.Item>{intl.formatMessage({ id: "profile.breadcrumb.personal" })}</Breadcrumb.Item>
        </Breadcrumb>

        <Row justify="center" gutter={[24, 24]} style={{ padding: "10px 0" }}>
          <Col xs={24} sm={24} md={24}>
            <Card size="small">
              <Row
                justify="center"
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Col xs={24} sm={24} md={8} lg={4} style={{ textAlign: "center" }}>
                  <Avatar
                    src={resolveAvatarSrc()}
                    size={120}
                    style={{
                      border: "5px solid white",
                    }}
                  />
                </Col>

                <Col xs={24} sm={24} md={16} lg={20}>
                  <Space
                    direction="vertical"
                    style={{ width: "100%" }}
                    align={window.innerWidth < 768 ? "center" : "start"}
                  >
                    <Title level={4} style={{ margin: 0 }}>
                      {loggedUser?.name}
                    </Title>
                    <Title style={{ fontSize: 14, fontWeight: 400, color: "#666" }}>{loggedUser?.jobTitle}</Title>

                    <Tag
                      style={{
                        border: "none",
                        borderRadius: "5px",
                        background: "linear-gradient(125deg, #4e54c8,  #8f94fb)",
                        margin: "10px 0",
                        padding: "3px 8px",
                      }}
                      icon={<SafetyCertificateOutlined />}
                      color="#55acee"
                    >
                      {loggedUser?.customer.customerName}
                    </Tag>
                  </Space>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        <ContentWrapper>
          <Box>
            <Tabs defaultActiveKey="1" centered style={{ marginTop: "-20px" }} items={tabsItems} />
          </Box>
        </ContentWrapper>
      </Box>
    </LayoutWrapper>
  );
};

export default MyProfile;
