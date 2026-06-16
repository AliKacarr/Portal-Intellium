import React, { useEffect, useState } from "react";
import {
  DatePicker,
  Form,
  Input,
  Radio,
  Select,
  Space,
  Button,
  Tooltip,
  Tag,
  Row,
  Col,
  message,
  Skeleton,
} from "antd";
import { ExclamationCircleOutlined, ManOutlined, WomanOutlined } from "@ant-design/icons";
import { useIntl } from "react-intl";
import { kan } from "../../Data/kanData";
import { ulke } from "../../Data/ulkeData";
import { addProfileDetail, getProfileByUserId, UserProfileEdit, getJobByUserId, UserJobEdit, addUserJob } from "../../Api/ProfileApi";
import moment from "moment";
import IbanInput from "../../components/IbanNo";
import { sehirler } from "../../Data/cityNamesTR";
import { districts } from "../../Data/districtNamesTR";

const { Option } = Select;
const { TextArea } = Input;

const getTurkeyPhoneNationalDigits = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  const withoutCountryCode = digits.startsWith("90") ? digits.slice(2) : digits;
  const withoutLeadingZero = withoutCountryCode.startsWith("0")
    ? withoutCountryCode.slice(1)
    : withoutCountryCode;

  return withoutLeadingZero.slice(0, 10);
};

const formatTurkeyPhone = (value) => {
  const digits = getTurkeyPhoneNationalDigits(value);
  const groups = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 8), digits.slice(8, 10)]
    .filter(Boolean);

  return groups.length ? `+90 ${groups.join(" ")}` : "";
};

const TurkishPhoneInput = ({ value, onChange, placeholder }) => {
  const handleChange = (event) => {
    const digits = getTurkeyPhoneNationalDigits(event.target.value);
    onChange?.(digits ? `+90${digits}` : undefined);
  };

  return (
    <Input
      value={formatTurkeyPhone(value)}
      onChange={handleChange}
      placeholder={placeholder || "+90 555 555 55 55"}
      maxLength={17}
      addonBefore={
        <span
          style={{
            display: "inline-block",
            minWidth: 18,
            textAlign: "center",
            color: "#000",
            fontSize: 12,
            fontWeight: 500,
            lineHeight: "16px",
          }}
        >
          TR
        </span>
      }
    />
  );
};

const KisiselBilgiler = ({ userId, isUserRole }) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const sexValue = Form.useWatch("sex", form);

  const [messageApi, contextHolder] = message.useMessage();

  const [getLoading, setGetLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileDetail, setProfileDetail] = useState({});
  const [handicappedState, setHandicappedState] = useState();
  const [showOtherInput, setShowOtherInput] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [districtOptions, setDistrictOptions] = useState([]);
  const [workDetail, setWorkDetail] = useState({});

  const req = intl.formatMessage({ id: "profileDetailAdmin.validation.required" });

  const handleCountryChange = (value) => {
    setSelectedCountry(value);
    form.setFieldValue("province", "");
    form.setFieldValue("district", "");
  };

  const handleCityChange = (value) => {
    setSelectedCity(value);
    const districtsForCity = districts[sehirler.find((city) => city.name === value)?.code] || [];
    setDistrictOptions(districtsForCity);
    form.setFieldValue("district", "");

    if (selectedCity && selectedCity.code) {
      const d2 = districts[selectedCity.code] || [];
      setDistrictOptions(d2);
    }
  };

  const getProfile = async () => {
    setGetLoading(true);
    try {
      const response = await getProfileByUserId(userId);
      if (response.data.success) {
        form.setFieldsValue(response.data.data);
        form.setFieldValue("militaryDate", moment(response.data.data.militaryDate));
        form.setFieldValue("birthDate", moment(response.data.data.birthDate));
        setProfileDetail(response.data.data);
        setShowOtherInput(response.data.data.militaryCase === "Tecilli");
        setHandicappedState(response.data.data.handicappedState);
        setSelectedCountry(response.data.data.country);
        setSelectedCity(response.data.data.province);
        const districtsForCity =
          districts[sehirler.find((city) => city.name === response.data.data.province)?.code] || [];
        setDistrictOptions(districtsForCity);
      }
    } catch (error) {}
    setGetLoading(false);
  };

  const getJob = async () => {
    try {
      const response = await getJobByUserId(userId);
      if (response.data.success) {
        const jobData = response.data.data;
        form.setFieldsValue({ jobTitle: jobData.jobTitle });
        setWorkDetail(jobData);
      }
    } catch (error) {
      console.error("Error fetching job data:", error);
    }
  };

  useEffect(() => {
    setHandicappedState("Yok");
    getProfile();
    if (isUserRole) getJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount
  }, []);

  useEffect(() => {
    if (sexValue && sexValue !== "Erkek") {
      form.setFieldsValue({ militaryCase: undefined, militaryDate: undefined });
      setShowOtherInput(false);
    }
  }, [sexValue, form]);

  const handleRadioChange = (e) => {
    setShowOtherInput(e.target.value === "Tecilli");
  };

  const siraliUlke = ulke.sort((a, b) => a.ad.localeCompare(b.ad));

  const onFinish = async (values) => {
    const isMaleUser = String(values.sex ?? profileDetail.sex ?? "").trim().toLowerCase() === "erkek";
    const hiddenUserRoleFields = isUserRole
      ? {
          bankAccountNo: profileDetail.bankAccountNo || "",
          bankName: profileDetail.bankName || "",
          birthPlace: profileDetail.birthPlace || "",
          birthDate: profileDetail.birthDate || "1900-01-01T00:00:00",
          bloodType: profileDetail.bloodType || "",
          condition: profileDetail.condition || "",
          handicappedState: profileDetail.handicappedState || "Yok",
          ibanNo: profileDetail.ibanNo || "",
          militaryCase: isMaleUser
            ? profileDetail.militaryCase || "Tamamlandı"
            : profileDetail.militaryCase || "",
          militaryDate: profileDetail.militaryDate ?? null,
          nationality: profileDetail.nationality || "",
          postCode: profileDetail.postCode || "",
          tc: profileDetail.tc || "",
        }
      : {};
    const formDataUser = {
      ...(isUserRole ? profileDetail : {}),
      ...values,
      ...hiddenUserRoleFields,
      id: profileDetail.id,
      userId: userId,
      handicappedState: isUserRole ? hiddenUserRoleFields.handicappedState : handicappedState,
      province: selectedCity || values.province || profileDetail.province,
    };
    setLoading(true);

    try {
      if (formDataUser.id) {
        await UserProfileEdit(formDataUser);
        messageApi.open({
          type: "success",
          content: intl.formatMessage({ id: "profileDetailAdmin.message.userUpdated" }),
        });
      } else {
        await addProfileDetail(formDataUser);
        messageApi.open({
          type: "success",
          content: intl.formatMessage({ id: "profileDetailAdmin.message.userAdded" }),
        });
      }

      if (isUserRole) {
        const formDataUserJob = {
          id: workDetail.id || 0,
          userId: userId,
          jobTitle: values.jobTitle,
          isActive: true,
        };
        if (workDetail.id) {
          await UserJobEdit(formDataUserJob);
        } else {
          await addUserJob(formDataUserJob);
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("User profile update failed:", e?.response?.data ?? e);
      const errorMessage =
        e?.response?.data?.message ||
        intl.formatMessage({ id: "profileDetailAdmin.message.userUpdateFailed" });
      messageApi.open({
        type: "error",
        content: errorMessage,
      });
    }
    setLoading(false);
  };

  return (
    <div>
      {contextHolder}
      {getLoading ? (
        <Skeleton active />
      ) : (
        <Form
          onFinish={onFinish}
          form={form}
          labelCol={
            isUserRole
              ? {
                  xs: { span: 24 },
                  sm: { span: 9 },
                  lg: { span: 8 },
                }
              : {
                  xs: { span: 6 },
                  sm: { span: 8 },
                  lg: { span: 8 },
                }
          }
          wrapperCol={
            isUserRole
              ? {
                  xs: { span: 24 },
                  sm: { span: 15 },
                  lg: { span: 16 },
                }
              : {
                  xs: { span: 24 },
                  sm: { span: 24 },
                  lg: { span: 24 },
                }
          }
          layout="horizontal"
          style={
            isUserRole
              ? { margin: "20px auto 0", maxWidth: 980 }
              : { marginTop: 20, marginRight: "2rem" }
          }
        >
          {isUserRole ? (
            <>
              <Row gutter={[32, 0]} justify="center">
                <Col xs={24} md={12}>
                  <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.label.name" })} name="name" rules={[{ required: true, message: req }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.label.surname" })} name="surname" rules={[{ required: true, message: req }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item
                    label={intl.formatMessage({ id: "profileDetailAdmin.label.preferredName" })}
                    name="preferredName"
                    rules={[{ required: true, message: req }]}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.label.gender" })} name="sex" rules={[{ required: true, message: req }]}>
                    <Radio.Group size="medium">
                      <Radio.Button value="Erkek">
                        <ManOutlined /> {intl.formatMessage({ id: "profileDetailAdmin.male" })}
                      </Radio.Button>
                      <Radio.Button value="Kadın">
                        <WomanOutlined /> {intl.formatMessage({ id: "profileDetailAdmin.female" })}
                      </Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.label.jobTitle" })} name="jobTitle">
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name="otherEmail"
                    label={intl.formatMessage({ id: "profileDetailAdmin.label.otherEmail" })}
                    rules={[
                      {
                        type: "email",
                        message: intl.formatMessage({ id: "profileDetailAdmin.validation.emailInvalid" }),
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="adress" label={intl.formatMessage({ id: "profileDetailAdmin.label.address" })} rules={[{ required: true }]}>
                    <TextArea rows={3} />
                  </Form.Item>
                  <Form.Item
                    label={intl.formatMessage({ id: "profileDetailAdmin.label.country" })}
                    name="country"
                    rules={[{ required: true, message: intl.formatMessage({ id: "profileDetailAdmin.validation.countryRequired" }) }]}
                  >
                    <Select showSearch style={{ width: "100%" }} onChange={handleCountryChange} value={selectedCountry}>
                      {siraliUlke.map((ulkeObj, index) => (
                        <Option key={index} value={ulkeObj.ad}>
                          {ulkeObj.ad}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item
                    label={intl.formatMessage({ id: "profileDetailAdmin.label.city" })}
                    name="province"
                    rules={[{ required: true, message: intl.formatMessage({ id: "profileDetailAdmin.validation.cityRequired" }) }]}
                  >
                    {selectedCountry === "Türkiye" ? (
                      <Select showSearch filterOption={selectedCity} style={{ width: "100%" }} onChange={handleCityChange} value={selectedCity}>
                        {sehirler.map((city) => (
                          <Select.Option key={city.code} value={city.name}>
                            {city.name}
                          </Select.Option>
                        ))}
                      </Select>
                    ) : (
                      <Input placeholder={intl.formatMessage({ id: "profileDetailAdmin.placeholder.city" })} />
                    )}
                  </Form.Item>
                  <Form.Item
                    label={intl.formatMessage({ id: "profileDetailAdmin.label.district" })}
                    name="district"
                    rules={[{ required: true, message: intl.formatMessage({ id: "profileDetailAdmin.validation.districtRequired" }) }]}
                  >
                    {selectedCountry === "Türkiye" ? (
                      <Select showSearch filterOption={selectedCountry} style={{ width: "100%" }}>
                        {districtOptions.length > 0 ? (
                          districtOptions.map((district, index) => (
                            <Select.Option key={index} value={district}>
                              {district}
                            </Select.Option>
                          ))
                        ) : (
                          <Select.Option disabled>{intl.formatMessage({ id: "profileDetailAdmin.noDistricts" })}</Select.Option>
                        )}
                      </Select>
                    ) : (
                      <Input placeholder={intl.formatMessage({ id: "profileDetailAdmin.placeholder.district" })} />
                    )}
                  </Form.Item>
                  <Form.Item name="telNo" label={intl.formatMessage({ id: "profileDetailAdmin.label.mobile" })} rules={[{ required: true }]}>
                    <TurkishPhoneInput placeholder={intl.formatMessage({ id: "profileDetailAdmin.placeholder.mobile" })} />
                  </Form.Item>
                  <Form.Item name="office" label={intl.formatMessage({ id: "profileDetailAdmin.label.office" })} rules={[{ required: false }]}>
                    <TurkishPhoneInput placeholder={intl.formatMessage({ id: "profileDetailAdmin.placeholder.office" })} />
                  </Form.Item>
                </Col>
              </Row>

              <Row justify="center">
                <Col>
                  <Form.Item style={{ marginTop: 8 }}>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      {intl.formatMessage({ id: "profileDetailAdmin.save" })}
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
            </>
          ) : (
          <Row gutter={16}>
            <Col sm={24} md={24} lg={12}>
              <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.label.name" })} name="name" rules={[{ required: true, message: req }]}>
                <Input />
              </Form.Item>
              <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.label.surname" })} name="surname" rules={[{ required: true, message: req }]}>
                <Input />
              </Form.Item>
              <Form.Item
                label={intl.formatMessage({ id: "profileDetailAdmin.label.preferredName" })}
                name="preferredName"
                rules={[{ required: true, message: req }]}
              >
                <Input />
              </Form.Item>

              {!isUserRole && (
                <>
                  <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.label.birthPlace" })} name="birthPlace" rules={[{ required: true, message: req }]}>
                    <Input style={{ width: "100%" }} />
                  </Form.Item>

                  <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.label.birthDate" })} name="birthDate" style={{ marginBottom: 18 }} rules={[{ required: true, message: req }]}>
                    <DatePicker style={{ width: "100%" }} format={"DD.MM.YYYY"} />
                  </Form.Item>

                  <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.label.tc" })} name="tc" rules={[{ required: true, message: req }]}>
                    <Input placeholder={intl.formatMessage({ id: "profileDetailAdmin.placeholder.tc" })} minLength={11} maxLength={11} style={{ width: "100%" }} />
                  </Form.Item>

                  <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.label.nationality" })} name="nationality" rules={[{ required: true, message: req }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.label.maritalStatus" })} name="condition" rules={[{ required: true, message: req }]}>
                    <Radio.Group size="medium">
                      <Radio.Button value="Evli">{intl.formatMessage({ id: "profileDetailAdmin.married" })}</Radio.Button>
                      <Radio.Button value="Bekar">{intl.formatMessage({ id: "profileDetailAdmin.single" })}</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                </>
              )}

              <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.label.gender" })} name="sex" rules={[{ required: true, message: req }]}>
                <Radio.Group size="medium">
                  <Radio.Button value="Erkek">
                    <ManOutlined /> {intl.formatMessage({ id: "profileDetailAdmin.male" })}
                  </Radio.Button>
                  <Radio.Button value="Kadın">
                    <WomanOutlined /> {intl.formatMessage({ id: "profileDetailAdmin.female" })}
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>
              {!isUserRole && (
                <>
                  <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.label.disability" })} name="handicappedState">
                    <Space.Compact style={{ width: "100%" }}>
                      <Select value={handicappedState} onChange={(value) => setHandicappedState(value)} style={{ flex: 1 }}>
                        <Select.Option value="Yok">{intl.formatMessage({ id: "profileDetailAdmin.disabilityNone" })}</Select.Option>
                        <Select.Option value="1. Derece">{intl.formatMessage({ id: "profileDetailAdmin.disabilityDeg1" })}</Select.Option>
                        <Select.Option value="2. Derece">{intl.formatMessage({ id: "profileDetailAdmin.disabilityDeg2" })}</Select.Option>
                        <Select.Option value="3. Derece">{intl.formatMessage({ id: "profileDetailAdmin.disabilityDeg3" })}</Select.Option>
                      </Select>
                      <Tooltip
                        title={
                          <div style={{ whiteSpace: "pre-line", maxWidth: 300 }}>
                            {intl.formatMessage({ id: "profileDetailAdmin.disabilityTooltip" })}
                          </div>
                        }
                      >
                        <Tag style={{ padding: 5 }} icon={<ExclamationCircleOutlined />} color="processing">
                          {intl.formatMessage({ id: "profileDetailAdmin.disabilityInfoTag" })}
                        </Tag>
                      </Tooltip>
                    </Space.Compact>
                  </Form.Item>
                  <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.label.bloodType" })} name="bloodType" rules={[{ required: true, message: req }]}>
                    <Select style={{ width: "100%" }} options={kan} />
                  </Form.Item>
                  <Form.Item noStyle shouldUpdate={(prev, cur) => prev.sex !== cur.sex}>
                    {({ getFieldValue }) => {
                      const sex = getFieldValue("sex");
                      if (sex !== "Erkek") return null;

                      return (
                        <>
                          <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.label.militaryStatus" })} name="militaryCase" rules={[{ required: true, message: req }]}>
                            <Radio.Group onChange={handleRadioChange}>
                              <Radio value="Tamamlandı"> {intl.formatMessage({ id: "profileDetailAdmin.militaryDone" })} </Radio>
                              <Radio value="Tecilli"> {intl.formatMessage({ id: "profileDetailAdmin.militaryDeferred" })} </Radio>
                            </Radio.Group>
                          </Form.Item>

                          {showOtherInput && (
                            <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.label.deferDate" })} name="militaryDate">
                              <DatePicker style={{ width: "100%" }} format={"DD.MM.YYYY"} />
                            </Form.Item>
                          )}
                        </>
                      );
                    }}
                  </Form.Item>

                  <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.label.bankName" })} name="bankName" rules={[{ required: true, message: req }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.label.bankAccount" })} name="bankAccountNo" rules={[{ required: true, message: req }]}>
                    <Input />
                  </Form.Item>
                  <IbanInput label={intl.formatMessage({ id: "profileDetailAdmin.label.iban" })} name="ibanNo" />
                </>
              )}
            </Col>
            <Col sm={24} md={24} lg={12}>
              {isUserRole && (
                <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.label.jobTitle" })} name="jobTitle">
                  <Input />
                </Form.Item>
              )}

              <Form.Item name="adress" label={intl.formatMessage({ id: "profileDetailAdmin.label.address" })} rules={[{ required: true }]}>
                <TextArea rows={4} />
              </Form.Item>
              <Form.Item
                label={intl.formatMessage({ id: "profileDetailAdmin.label.country" })}
                name="country"
                rules={[{ required: true, message: intl.formatMessage({ id: "profileDetailAdmin.validation.countryRequired" }) }]}
              >
                <Select showSearch style={{ width: "100%" }} onChange={handleCountryChange} value={selectedCountry}>
                  {siraliUlke.map((ulkeObj, index) => (
                    <Option key={index} value={ulkeObj.ad}>
                      {ulkeObj.ad}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label={intl.formatMessage({ id: "profileDetailAdmin.label.city" })}
                name="province"
                rules={[{ required: true, message: intl.formatMessage({ id: "profileDetailAdmin.validation.cityRequired" }) }]}
              >
                {selectedCountry === "Türkiye" ? (
                  <Select showSearch filterOption={selectedCity} style={{ width: "100%" }} onChange={handleCityChange} value={selectedCity}>
                    {sehirler.map((city) => (
                      <Select.Option key={city.code} value={city.name}>
                        {city.name}
                      </Select.Option>
                    ))}
                  </Select>
                ) : (
                  <Input placeholder={intl.formatMessage({ id: "profileDetailAdmin.placeholder.city" })} />
                )}
              </Form.Item>

              <Form.Item
                label={intl.formatMessage({ id: "profileDetailAdmin.label.district" })}
                name="district"
                rules={[{ required: true, message: intl.formatMessage({ id: "profileDetailAdmin.validation.districtRequired" }) }]}
              >
                {selectedCountry === "Türkiye" ? (
                  <Select showSearch filterOption={selectedCountry} style={{ width: "100%" }}>
                    {districtOptions.length > 0 ? (
                      districtOptions.map((district, index) => (
                        <Select.Option key={index} value={district}>
                          {district}
                        </Select.Option>
                      ))
                    ) : (
                      <Select.Option disabled>{intl.formatMessage({ id: "profileDetailAdmin.noDistricts" })}</Select.Option>
                    )}
                  </Select>
                ) : (
                  <Input placeholder={intl.formatMessage({ id: "profileDetailAdmin.placeholder.district" })} />
                )}
              </Form.Item>
              {!isUserRole && (
                <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.label.postalCode" })} name="postCode" rules={[{ required: true, message: req }]}>
                  <Input style={{ minWidth: "80px", maxWidth: "120px" }} maxLength={5} />
                </Form.Item>
              )}
              <Form.Item name="telNo" label={intl.formatMessage({ id: "profileDetailAdmin.label.mobile" })} rules={[{ required: true }]}>
                <TurkishPhoneInput placeholder={intl.formatMessage({ id: "profileDetailAdmin.placeholder.mobile" })} />
              </Form.Item>
              {!isUserRole && (
                <Form.Item name="homePhone" label={intl.formatMessage({ id: "profileDetailAdmin.label.home" })} rules={[{ required: false }]}>
                  <TurkishPhoneInput placeholder={intl.formatMessage({ id: "profileDetailAdmin.placeholder.home" })} />
                </Form.Item>
              )}
              <Form.Item name="office" label={intl.formatMessage({ id: "profileDetailAdmin.label.office" })} rules={[{ required: false }]}>
                <TurkishPhoneInput placeholder={intl.formatMessage({ id: "profileDetailAdmin.placeholder.office" })} />
              </Form.Item>
              {!isUserRole && (
                <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.label.extension" })} name="interphone">
                  <Input style={{ minWidth: "80px", maxWidth: "120px" }} />
                </Form.Item>
              )}
              <Form.Item
                name="otherEmail"
                label={intl.formatMessage({ id: "profileDetailAdmin.label.otherEmail" })}
                rules={[
                  {
                    type: "email",
                    message: intl.formatMessage({ id: "profileDetailAdmin.validation.emailInvalid" }),
                  },
                  {
                    required: false,
                    message: intl.formatMessage({ id: "profileDetailAdmin.validation.emailOptionalHint" }),
                  },
                ]}
              >
                <Input />
              </Form.Item>
              {!isUserRole && (
                <>
                  <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.label.github" })} name="githubUrl">
                    <Input placeholder={intl.formatMessage({ id: "profileDetailAdmin.placeholder.github" })} />
                  </Form.Item>
                  <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.label.linkedin" })} name="linkedInUrl">
                    <Input placeholder={intl.formatMessage({ id: "profileDetailAdmin.placeholder.linkedin" })} />
                  </Form.Item>
                </>
              )}
              <Form.Item wrapperCol={{ offset: 8 }}>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {intl.formatMessage({ id: "profileDetailAdmin.save" })}
                </Button>
              </Form.Item>
            </Col>
          </Row>
          )}
        </Form>
      )}
    </div>
  );
};

export default KisiselBilgiler;
