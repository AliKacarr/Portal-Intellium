import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Switch,
  message,
  Space,
  Spin,
  Typography,
  Divider,
} from "antd";
import { EditOutlined, PlusOutlined, MinusCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import moment from "moment";
import { GetPollById, UpdatePoll } from "../../Api/PollApi";
import { GetAllDepartments } from "../../Api/DepartmentApi";
import { pickBolumDepartmentsFromApi, unwrapDepartmentList } from "../../Data/jobBolumleri";
import {
  NEWS_AUDIENCE_EVERYONE_VALUE,
  resolveNewsAudienceForSubmit,
} from "../News/newsAudience";

const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

const EditPoll = ({ pollId, refreshList, buttonType = "default", buttonSize, showLabel = true }) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiProgress, setApiProgress] = useState(false);
  const [bolumDepartments, setBolumDepartments] = useState([]);
  const [pollLoading, setPollLoading] = useState(false);

  useEffect(() => {
    if (!isModalOpen) return;
    setPollLoading(true);

    Promise.all([GetPollById(pollId), GetAllDepartments()])
      .then(([pollRes, deptRes]) => {
        const poll = pollRes.data?.data ?? pollRes.data?.Data;
        if (!poll) throw new Error("not_found");

        setBolumDepartments(pickBolumDepartmentsFromApi(unwrapDepartmentList(deptRes)));

        const audience =
          poll.isGeneral && !poll.departmentId
            ? NEWS_AUDIENCE_EVERYONE_VALUE
            : poll.departmentId;

        const questions = (poll.questions || []).map((q) => ({
          text: q.text,
          options: (q.options || []).map((o) => ({ text: o.text })),
        }));

        form.setFieldsValue({
          title: poll.title,
          content: poll.content || "",
          dateRange: [moment(poll.startDate), moment(poll.endDate)],
          audience,
          isActive: poll.isActive,
          questions: questions.length > 0
            ? questions
            : [{ text: "", options: [{ text: "" }, { text: "" }] }],
        });
      })
      .catch(() => {
        messageApi.open({
          type: "error",
          content: intl.formatMessage({ id: "polls.detail.loadError" }),
        });
        setIsModalOpen(false);
      })
      .finally(() => setPollLoading(false));
  }, [isModalOpen]);

  const handleOpen = (e) => {
    e.stopPropagation();
    setPollLoading(true);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const onFinish = async (values) => {
    const questions = (values.questions || [])
      .filter((q) => q && q.text && q.text.trim())
      .map((q) => ({
        text: q.text.trim(),
        options: (q.options || [])
          .filter((o) => o && o.text && o.text.trim())
          .map((o) => o.text.trim()),
      }));

    const invalidQuestion = questions.find((q) => q.options.length < 2);
    if (invalidQuestion) {
      messageApi.open({
        type: "warning",
        content: intl.formatMessage({ id: "polls.add.optionsMinWarning" }),
      });
      return;
    }

    const { isGeneral, departmentId } = resolveNewsAudienceForSubmit(values);

    const formData = {
      id: pollId,
      title: values.title,
      content: values.content || null,
      startDate: values.dateRange[0].startOf("day").toISOString(),
      endDate: values.dateRange[1].endOf("day").toISOString(),
      isGeneral,
      isActive: values.isActive ?? true,
      departmentId,
      questions,
    };

    setApiProgress(true);
    try {
      await UpdatePoll(formData);
      messageApi.open({
        type: "success",
        content: intl.formatMessage({ id: "polls.edit.success" }),
      });
      refreshList();
      handleClose();
    } catch (err) {
      const errMsg =
        err?.response?.data?.message ||
        intl.formatMessage({ id: "polls.edit.error" });
      messageApi.open({ type: "error", content: errMsg });
    }
    setApiProgress(false);
  };

  return (
    <>
      {contextHolder}
      <Button
        type={buttonType}
        size={buttonSize}
        icon={<EditOutlined />}
        onClick={handleOpen}
      >
        {showLabel ? intl.formatMessage({ id: "polls.detail.editButton" }) : undefined}
      </Button>
      <Modal
        width={720}
        title={intl.formatMessage({ id: "polls.edit.title" })}
        open={isModalOpen}
        onCancel={handleClose}
        footer={null}
        destroyOnClose
        styles={{ body: { maxHeight: "75vh", overflowY: "auto", paddingRight: 4 } }}
      >
        {pollLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin />
          </div>
        ) : (
          <Form
            form={form}
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 18 }}
            layout="horizontal"
            onFinish={onFinish}
          >
            <Form.Item
              name="title"
              label={intl.formatMessage({ id: "polls.form.title" })}
              rules={[{ required: true, message: intl.formatMessage({ id: "polls.form.titleRequired" }) }]}
            >
              <Input placeholder={intl.formatMessage({ id: "polls.form.titlePlaceholder" })} />
            </Form.Item>

            <Form.Item name="content" label={intl.formatMessage({ id: "polls.form.content" })}>
              <TextArea rows={2} placeholder={intl.formatMessage({ id: "polls.form.contentPlaceholder" })} />
            </Form.Item>

            <Form.Item
              name="dateRange"
              label={intl.formatMessage({ id: "polls.form.dateRange" })}
              rules={[{ required: true, message: intl.formatMessage({ id: "polls.form.dateRangeRequired" }), type: "array" }]}
            >
              <RangePicker style={{ width: "100%" }} format="DD.MM.YYYY" />
            </Form.Item>

            <Form.Item
              name="isActive"
              label={intl.formatMessage({ id: "polls.form.isActive" })}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="audience"
              label={intl.formatMessage({ id: "polls.form.department" })}
              rules={[{ required: true, message: intl.formatMessage({ id: "polls.form.departmentRequired" }) }]}
            >
              <Select
                placeholder={intl.formatMessage({ id: "polls.form.departmentPlaceholder" })}
                allowClear
                showSearch
                optionFilterProp="children"
              >
                <Option value={NEWS_AUDIENCE_EVERYONE_VALUE}>
                  {intl.formatMessage({ id: "polls.form.audienceEveryone" })}
                </Option>
                {bolumDepartments.map((d) => (
                  <Option key={d.id} value={d.id}>
                    {d.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Divider orientation="left" orientationMargin={0}>
              <Typography.Text strong style={{ fontSize: 13 }}>
                {intl.formatMessage({ id: "polls.form.questions" })}
              </Typography.Text>
            </Divider>

            <Form.List name="questions">
              {(questionFields, { add: addQuestion, remove: removeQuestion }) => (
                <>
                  {questionFields.map((qField, qIndex) => (
                    <Card
                      key={qField.key}
                      size="small"
                      style={{ marginBottom: 12, background: "#fafafa", borderRadius: 8 }}
                      title={
                        <span style={{ fontSize: 13, fontWeight: 600 }}>
                          {intl.formatMessage({ id: "polls.form.questionLabel" }, { n: qIndex + 1 })}
                        </span>
                      }
                      extra={
                        questionFields.length > 1 ? (
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => removeQuestion(qField.name)}
                          />
                        ) : null
                      }
                    >
                      <Form.Item
                        {...qField}
                        name={[qField.name, "text"]}
                        label={intl.formatMessage({ id: "polls.form.questionText" })}
                        labelCol={{ span: 6 }}
                        wrapperCol={{ span: 18 }}
                        rules={[{ required: true, message: intl.formatMessage({ id: "polls.form.questionRequired" }) }]}
                        style={{ marginBottom: 8 }}
                      >
                        <TextArea
                          rows={2}
                          placeholder={intl.formatMessage({ id: "polls.form.questionPlaceholder" })}
                        />
                      </Form.Item>

                      <Form.Item
                        label={intl.formatMessage({ id: "polls.form.options" })}
                        labelCol={{ span: 6 }}
                        wrapperCol={{ span: 18 }}
                        required
                        style={{ marginBottom: 0 }}
                      >
                        <Form.List name={[qField.name, "options"]}>
                          {(optFields, { add: addOpt, remove: removeOpt }) => (
                            <>
                              {optFields.map((oField, oIndex) => (
                                <Form.Item key={oField.key} style={{ marginBottom: 6 }}>
                                  <Space align="baseline" style={{ width: "100%" }}>
                                    <Form.Item
                                      {...oField}
                                      name={[oField.name, "text"]}
                                      noStyle
                                      rules={[{ required: true, message: intl.formatMessage({ id: "polls.form.optionRequired" }) }]}
                                    >
                                      <Input
                                        placeholder={intl.formatMessage(
                                          { id: "polls.form.optionPlaceholder" },
                                          { n: oIndex + 1 }
                                        )}
                                        style={{ width: 340 }}
                                      />
                                    </Form.Item>
                                    {optFields.length > 2 && (
                                      <MinusCircleOutlined
                                        onClick={() => removeOpt(oField.name)}
                                        style={{ color: "#ff4d4f" }}
                                      />
                                    )}
                                  </Space>
                                </Form.Item>
                              ))}
                              {optFields.length < 6 && (
                                <Button
                                  type="dashed"
                                  onClick={() => addOpt()}
                                  icon={<PlusOutlined />}
                                  size="small"
                                  style={{ marginTop: 2 }}
                                >
                                  {intl.formatMessage({ id: "polls.form.addOption" })}
                                </Button>
                              )}
                            </>
                          )}
                        </Form.List>
                      </Form.Item>
                    </Card>
                  ))}

                  {questionFields.length < 5 && (
                    <Button
                      type="dashed"
                      onClick={() => addQuestion({ text: "", options: [{ text: "" }, { text: "" }] })}
                      icon={<PlusOutlined />}
                      block
                      style={{ marginBottom: 12 }}
                    >
                      {intl.formatMessage({ id: "polls.form.addQuestion" })}
                    </Button>
                  )}
                </>
              )}
            </Form.List>

            <Form.Item wrapperCol={{ offset: 6, span: 18 }} style={{ marginTop: 12, marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" loading={apiProgress}>
                {intl.formatMessage({ id: "polls.form.submitUpdate" })}
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </>
  );
};

export default EditPoll;
