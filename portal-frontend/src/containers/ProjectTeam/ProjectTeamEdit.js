import {
  Form,
  Input,
  Select,
  Button,
  Modal,
  message,
  Avatar,
  Space,
  List,
} from "antd";
import { Content } from "antd/lib/layout/layout";
import React, { useEffect, useState } from "react";
import { EditProjectTeam } from "../../Api/ProjectTeamApi";
import { GetAllProjectAsBasic } from "../../Api/ProjectApi";
import { getUserByName } from "../../Api/UserApi";
import { buildApiUrl } from "../../Api/host";
import TextArea from "antd/lib/input/TextArea";
import DebounceSelect from "@iso/components/ScrumBoard/SearchUser/SearchUserSelect";
import { useIntl } from "react-intl";

const resolveProjectRole = (role) => {
  const t = role == null ? "" : String(role).trim();
  return t || "Üye";
};

function ProjectTeamEdit({ projectTeam, refreshList }) {
  const intl = useIntl();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [apiProgress, setApiProgress] = useState(false);
  const [userList, setUserList] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const [removedUserIds, setRemovedUserIds] = useState([]);
  const [addedUserIds, setAddedUserIds] = useState([]);
  const [userTasks, setUserTasks] = useState({});

  const handleTaskChange = (user, task) => {
    setUserTasks({
      ...userTasks,
      [user]: task,
    });
  };

  const getProjectData = async () => {
    try {
      const response = await GetAllProjectAsBasic();
      setProjectList(
        response.data.data.map((project) => ({
          label: `${project.projectName}`,
          value: project.id,
        }))
      );
    } catch (error) {}
  };

  async function SearchUserList(username) {
    if (username === "") return;
    return getUserByName(username).then((response) =>
      response.data.data
        .filter((user) => !userList.some((selected) => selected.value === user.id))
        .map((user) => ({
          label: user.name,
          value: user.id,
          img: user.imageUrl,
        }))
    );
  }

  useEffect(() => {
    getProjectData();
    setUserList(
      projectTeam.members.map((member) => ({
        label: `${member.name}`,
        img: member.imageUrl,
        value: member.id,
      }))
    );
    setUserTasks(
      projectTeam.members.reduce((acc, member) => {
        acc[member.id] = member.projectRole;
        return acc;
      }, {})
    );
  }, [projectTeam]);

  const onMemberDeselect = (member) => {
    if (addedUserIds.includes(member.value)) {
      setAddedUserIds((prevAddUserIds) =>
        prevAddUserIds.filter((userId) => userId !== member.value)
      );
    }
    if (!removedUserIds.includes(member.value)) {
      setRemovedUserIds((prevRemoveUserIds) => [
        ...prevRemoveUserIds,
        member.value,
      ]);
    }
    setUserList((prevUsers) =>
      prevUsers.filter((user) => user.value !== member.value)
    );
  };

  const onMemberSelect = (member) => {
    if (!member || !member.value) return;
    if (
      !addedUserIds.includes(member.value) &&
      !userList.some((user) => user.value === member.value)
    ) {
      setAddedUserIds((prevAddUserIds) => [...prevAddUserIds, member.value]);
      getUserByName(member.label).then((response) => {
        const userData = response.data.data.find(
          (user) => user.id === member.value
        );
        setUserList((prevUsers) => [
          ...prevUsers,
          { ...member, img: userData?.imageUrl || null },
        ]);
      });
    }
    if (removedUserIds.includes(member.value)) {
      setRemovedUserIds((prevRemoveUserIds) =>
        prevRemoveUserIds.filter((userId) => userId !== member.value)
      );
    }
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

  const onFinish = async (values) => {
    const changedMembers = projectTeam.members
      .filter((member) => !removedUserIds.includes(member.id))
      .filter(
        (member) =>
          resolveProjectRole(member.projectRole) !==
          resolveProjectRole(userTasks[member.id])
      );

    const formDataProjectTeam = {
      id: projectTeam.id,
      name: values.projectTeamName,
      projectId: values.project,
      description: values.projectTeamDescription,
      addUserIds: [
        ...addedUserIds.map((userId) => ({
          id: userId,
          projectRole: resolveProjectRole(userTasks[userId]),
        })),
        ...changedMembers.map((member) => ({
          id: member.id,
          projectRole: resolveProjectRole(userTasks[member.id]),
        })),
      ],
      removeUserIds: [
        ...removedUserIds,
        ...changedMembers.map((member) => member.id),
      ],
    };

    setApiProgress(true);
    try {
      await EditProjectTeam(formDataProjectTeam);
      messageApi.open({
        type: "success",
        content: intl.formatMessage({ id: "projectTeam.edit.success" }),
      });
      setAddedUserIds([]);
      setRemovedUserIds([]);
    } catch (e) {
      messageApi.open({
        type: "error",
        content: intl.formatMessage({ id: "projectTeam.edit.error" }),
      });
    }
    setApiProgress(false);
    setIsModalOpen(false);
    refreshList();
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
  return (
    <div>
      {contextHolder}
      <Button type="primary" onClick={showModal}>
        {intl.formatMessage({ id: "projectTeam.edit.button" })}
      </Button>
      <Modal
        width={650}
        title={intl.formatMessage({ id: "projectTeam.edit.title" })}
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
              initialValue={projectTeam.name}
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
              initialValue={projectTeam.project.id}
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
              initialValue={projectTeam.description}
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
              initialValue={userList}
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
            {userList.length > 0 && (
              <List itemLayout="horizontal" size="small" style={{ marginTop: 20 }}>
                {userList.map((user) => (
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
                {intl.formatMessage({ id: "projectTeam.edit.save" })}
              </Button>
            </Form.Item>
          </Form>
        </Content>
      </Modal>
    </div>
  );
}

export default ProjectTeamEdit;
