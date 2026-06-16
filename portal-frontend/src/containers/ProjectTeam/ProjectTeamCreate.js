import React, { useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Form,
  Input,
  List,
  Modal,
  Select,
  Space,
  message,
} from "antd";
import { Content } from "antd/lib/layout/layout";
import { PlusCircleOutlined } from "@ant-design/icons";
import { AddProjectTeam } from "../../Api/ProjectTeamApi";
import { getUserByName } from "../../Api/UserApi";
import { GetLeaderProjects } from "../../Api/ProjectApi";
import { buildApiUrl } from "../../Api/host";
import TextArea from "antd/lib/input/TextArea";
import DebounceSelect from "@iso/components/ScrumBoard/SearchUser/SearchUserSelect";
import { useIntl } from "react-intl";

const resolveProjectRole = (role) => {
  const t = role == null ? "" : String(role).trim();
  return t || "Üye";
};

export default function CreateProjectTeam({ refreshList }) {
  const intl = useIntl();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [apiProgress, setApiProgress] = useState(false);

  const [projectList, setProjectList] = useState([]);
  const [users, setUsers] = useState([]);
  const [userTasks, setUserTasks] = useState({});

  const handleTaskChange = (user, task) => {
    setUserTasks({
      ...userTasks,
      [user]: task,
    });
  };

  const getProjectData = async () => {
    try {
      const response = await GetLeaderProjects();
      setProjectList(
        response.data.data.map((project) => ({
          label: `${project.projectName}`,
          value: project.id,
        }))
      );
    } catch (error) {}
  };

  useEffect(() => {
    getProjectData();
  }, []);

  const onFinish = async (values) => {
    const membersFromForm = Array.isArray(values.users) ? values.users : [];
    const memberList = users.length > 0 ? users : membersFromForm;

    const formDataProjectTeam = {
      name: values.projectTeamName,
      projectId: values.project,
      description: values.projectTeamDescription,
      addedUsers: memberList.map((user) => ({
        id: user.value,
        projectRole: resolveProjectRole(userTasks[user.value]),
      })),
    };

    setApiProgress(true);
    try {
      await AddProjectTeam(formDataProjectTeam);
      messageApi.open({
        type: "success",
        content: intl.formatMessage({ id: "projectTeam.create.success" }),
      });
    } catch (e) {
      messageApi.open({
        type: "error",
        content: intl.formatMessage({ id: "projectTeam.create.error" }),
      });
    }
    setApiProgress(false);
    refreshList();
    setIsModalOpen(false);
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const tailLayout = {
    wrapperCol: {
      offset: 8,
      span: 16,
    },
  };

  function getColorById(id) {
    const customColors = [
      "#6895D2",
      "#A4CE95",
      "#D04848",
      "#F3B95F",
      "#FDE767",
    ];
    const index = id % customColors.length;
    return customColors[index];
  }

  async function SearchUserList(username) {
    if (username === "") return;
    return getUserByName(username).then((response) =>
      response.data.data
        .filter((user) => !users.some((selected) => selected.value === user.id))
        .map((user) => ({
          label: user.name,
          value: user.id,
          img: user.imageUrl,
        }))
    );
  }

  const onMemberSelect = (member) => {
    if (!member || !member.value) return;
    if (!users.includes(member.value)) {
      getUserByName(member.label).then((response) => {
        const userData = response.data.data.find(
          (user) => user.id === member.value
        );
        setUsers((prevUsers) => [
          ...prevUsers,
          { ...member, img: userData?.imageUrl || null },
        ]);
      });
    }
  };
  const onMemberDeselect = (member) => {
    setUsers((prevUsers) =>
      prevUsers.filter((user) => user.value !== member.value)
    );
  };

  return projectList && projectList.length > 0 ? (
    <div>
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: "10px",
        }}
      >
        {contextHolder}
        <Button
          className="custom-button"
          type="primary"
          onClick={showModal}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Space
            size={8}
            align="center"
            style={{ display: "inline-flex", alignItems: "center", lineHeight: 1 }}
          >
            <PlusCircleOutlined
              style={{ fontSize: 15, lineHeight: 1, display: "flex" }}
            />
            <span style={{ lineHeight: 1.2 }}>
              {intl.formatMessage({ id: "projectTeam.create.button" })}
            </span>
          </Space>
        </Button>
      </div>
      <Modal
        width={650}
        title={intl.formatMessage({ id: "projectTeam.create.title" })}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Content style={{ padding: "10px 20px" }}>
          <Form
            onFinish={onFinish}
            labelCol={{
              span: 8,
            }}
            wrapperCol={{
              span: 16,
            }}
            layout="horizontal"
            style={{
              maxWidth: 650,
            }}
          >
            <Form.Item
              label={intl.formatMessage({ id: "projectTeam.field.teamName" })}
              name="projectTeamName"
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({
                    id: "projectTeam.validation.teamName",
                  }),
                },
              ]}
              style={{ marginBottom: 18 }}
            >
              <Input
                placeholder={intl.formatMessage({
                  id: "projectTeam.field.teamNamePh",
                })}
              />
            </Form.Item>

            <Form.Item
              label={intl.formatMessage({ id: "projectTeam.field.project" })}
              name="project"
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({
                    id: "projectTeam.validation.project",
                  }),
                },
              ]}
              style={{ marginBottom: 18 }}
            >
              <Select
                showSearch
                placeholder={intl.formatMessage({
                  id: "projectTeam.field.projectPh",
                })}
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={projectList}
              />
            </Form.Item>

            <Form.Item
              label={intl.formatMessage({ id: "projectTeam.field.description" })}
              name="projectTeamDescription"
              maxLength="400"
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({
                    id: "projectTeam.validation.description",
                  }),
                },
              ]}
              style={{ marginBottom: 18 }}
            >
              <TextArea
                placeholder={intl.formatMessage({
                  id: "projectTeam.field.descriptionPh",
                })}
              />
            </Form.Item>

            <Form.Item
              name="users"
              label={intl.formatMessage({ id: "projectTeam.field.members" })}
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({
                    id: "projectTeam.validation.members",
                  }),
                  type: "array",
                },
              ]}
            >
              <DebounceSelect
                mode="multiple"
                placeholder={intl.formatMessage({
                  id: "projectTeam.field.membersSearchPh",
                })}
                fetchOptions={SearchUserList}
                onSelect={onMemberSelect}
                onDeselect={onMemberDeselect}
                onChange={() => {}}
                value={[]}
                style={{ width: "100%" }}
              />
            </Form.Item>

            {users.length > 0 && (
              <List
                itemLayout="horizontal"
                size="small"
                style={{ marginTop: 20 }}
              >
                {users.map((user) => (
                  <Form.Item
                    key={user.value}
                    labelAlign="left"
                    label={
                      <Space size="small">
                        {user.img ? (
                          <Avatar
                            src={buildApiUrl(user.img)}
                          />
                        ) : (
                          <Avatar
                            style={{
                              backgroundColor: getColorById(user.value),
                            }}
                          >
                            {user.label.charAt(0).toUpperCase()}
                          </Avatar>
                        )}
                        {user.label}
                      </Space>
                    }
                  >
                    <Input
                      placeholder={intl.formatMessage({
                        id: "projectTeam.field.rolePh",
                      })}
                      value={userTasks[user.value] || ""}
                      onChange={(e) =>
                        handleTaskChange(user.value, e.target.value)
                      }
                    />
                  </Form.Item>
                ))}
              </List>
            )}

            <Form.Item {...tailLayout} style={{ marginBottom: 0 }}>
              <Button
                style={{ float: "right" }}
                type="primary"
                htmlType="submit"
                loading={apiProgress}
              >
                {intl.formatMessage({ id: "projectTeam.create.submit" })}
              </Button>
            </Form.Item>
          </Form>
        </Content>
      </Modal>
    </div>
  ) : null;
}
