import React from "react";
import { UploadOutlined } from "@ant-design/icons";
import {
  Button,
  Form,
  Input,
  Upload,
  Breadcrumb,
  Divider,
  message,
  Select,
} from "antd";
import { Box } from "./Ticket.styles";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import Editor from "@iso/components/uielements/editor";
import { useState, useEffect } from "react";
import LastTickets from "./LastTickets";
import { GetAllProjectAsBasic } from "../../Api/ProjectApi";
import { CreateTicket } from "../../Api/TicketApi";
import { useSelector } from "react-redux";
// Editör impoort
import PropTypes from "prop-types";
import "react-quill/dist/quill.snow.css";
import "react-quill/dist/quill.bubble.css";
import "react-quill/dist/quill.core.css";
import MarkdownEditor from "../../components/Custom/MarkdownEditor/MarkdownEditor";
import { useIntl } from "react-intl";

function AddTicket() {
  const intl = useIntl();
  const [projects, setProjects] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const [apiProgress, setApiProgress] = useState(false);
  const [refreshList, setRefreshList] = useState(false);
  const [form] = Form.useForm();
  const loggedUser = useSelector((state) => state.Auth);

  const handleDescriptionChange = (value) => {
    form.setFieldsValue({ description: value });
  };

  // Açıklama alanı kontrolü
  const validateDescription = (_, value) => {
    if (!value || value.replace(/<(.|\n)*?>/g, "").trim() === "") {
      return Promise.reject(
        new Error(
          intl.formatMessage({
            id: "tickets.add.form.description.required",
          })
        )
      );
    }
    return Promise.resolve();
  };
  const onRefreshList = () => {
    setRefreshList(!refreshList);
  };

  const onUploadChange = async ({ fileList }) => {
    if (fileList.length > 0) {
      try {
        message.destroy();
        message.success(
          intl.formatMessage({ id: "tickets.add.toast.fileUploaded" })
        );
      } catch (error) {
        message.destroy();
        message.warn(
          intl.formatMessage({ id: "tickets.add.toast.fileTooLarge" })
        );
      }
    }
  };

  // Form OnFinish
  const onFinish = async (values) => {
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("description", values.description);
    formData.append("projectId", values.project);
    formData.append("customerId", loggedUser.customer.customerId);
    formData.append("creatorUserId", loggedUser.id);
    (values.attachments || []).forEach((file) => {
      const rawFile = file.originFileObj || file;
      if (rawFile) {
        formData.append("attachments", rawFile, rawFile.name || file.name);
      }
    });

    setApiProgress(true);
    try {
      await CreateTicket(formData);
      messageApi.open({
        type: "success",
        content: intl.formatMessage({ id: "tickets.add.toast.created" }),
      });
    } catch (e) {
      messageApi.open({
        type: "error",
        content: intl.formatMessage({ id: "tickets.add.toast.error" }),
      });
    }
    onRefreshList();
    setApiProgress(false);
    form.resetFields();
  };

  // Projeleri listeleme
  const getProjects = async () => {
    try {
      let response = await GetAllProjectAsBasic();

      setProjects(
        response.data.data.map((project) => ({
          label: `${project.projectName}`,
          value: project.id,
        }))
      );
    } catch (error) {
      console.log("error: ", error);
    }

  };
  useEffect(() => {
    getProjects();
  }, []);

  // Editor modül ve formatlar
  Editor.modules = {
    toolbar: [["bold", "underline"], [{ list: "bullet" }]],
    clipboard: {
      matchVisual: false,
    },
  };
  Editor.formats = ["bold", "italic", "underline", "strike", "list"];
  Editor.propTypes = {
    placeholder: PropTypes.string,
  };

  return (
    <LayoutWrapper>
      {contextHolder}
      <Box style={{ marginTop: "-20px" }}>
        <Breadcrumb style={{ margin: "6px 0 25px 0px" }}>
          <Breadcrumb.Item>{intl.formatMessage({ id: "tickets.add.breadcrumb.ticket" })}</Breadcrumb.Item>
          <Breadcrumb.Item>{intl.formatMessage({ id: "tickets.add.breadcrumb.create" })}</Breadcrumb.Item>
        </Breadcrumb>

        <Form
          onFinish={onFinish}
          form={form}
          labelCol={{
            span: 4,
          }}
          wrapperCol={{
            span: 20,
          }}
          layout="horizontal"
          style={{
            maxWidth: 1024,
            margin: "10px 20px",
          }}
        >
          <Form.Item
            label={intl.formatMessage({ id: "tickets.add.form.name.label" })}
            name="name"
            rules={[
              {
                max: 120,
                message: intl.formatMessage({
                  id: "tickets.add.form.name.maxError",
                }),
              },
              {
                required: true,
                message: intl.formatMessage({
                  id: "tickets.add.form.name.required",
                }),
              },
            ]}
          >
            <Input placeholder={intl.formatMessage({ id: "tickets.add.form.name.placeholder" })} />
          </Form.Item>
          <Form.Item
            label={intl.formatMessage({ id: "tickets.add.form.project.label" })}
            name="project"
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: "tickets.add.form.project.required" }),
              },
            ]}
          >
            <Select
              showSearch
              style={{
                width: "100%",
              }}
              placeholder={intl.formatMessage({ id: "tickets.add.form.project.placeholder" })}
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input)
              }
              filterSort={(optionA, optionB) =>
                (optionA?.label ?? "")
                  .toLowerCase()
                  .localeCompare((optionB?.label ?? "").toLowerCase())
              }
              options={projects}
            />
          </Form.Item>

          <Form.Item
            label={intl.formatMessage({ id: "tickets.add.form.description.label" })}
            name="description"
            rules={[{ validator: validateDescription }]}
          >
            <MarkdownEditor
              onChange={handleDescriptionChange}
              placeholder={intl.formatMessage({ id: "tickets.add.form.description.placeholder" })}
              minHeight={50}
            />
          </Form.Item>

          <Form.Item
            name="attachments"
            label={intl.formatMessage({ id: "tickets.add.form.attachments.label" })}
            valuePropName="fileList"
            getValueFromEvent={(e) => e?.fileList}
          >
            <Upload
              id="upload-input"
              listType="picture-card"
              className="ticketUploadCompact"
              onChange={onUploadChange}
              maxCount={2}
              beforeUpload={() => false}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <UploadOutlined />
                <span>{intl.formatMessage({ id: "tickets.add.upload.add" })}</span>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item
            wrapperCol={{
              span: 20,
              offset: 4,
            }}
          >
            <Button type="primary" htmlType="submit" loading={apiProgress}>
              {intl.formatMessage({ id: "tickets.add.button" })}
            </Button>
          </Form.Item>
        </Form>
        <Divider></Divider>
        <LastTickets refreshList={refreshList} onRefreshList={onRefreshList} />
      </Box>
    </LayoutWrapper>
  );
}

export default AddTicket;
