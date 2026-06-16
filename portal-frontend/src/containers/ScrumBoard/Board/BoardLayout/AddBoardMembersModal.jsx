import React, { useState } from "react";
import { Modal, List, Avatar, Button, Popconfirm, Divider } from "antd";
import DebounceSelect from "@iso/components/ScrumBoard/SearchUser/SearchUserSelect";
import { getUserByName } from "../../../../Api/UserApi";
import {
  addBoardMembers,
  deleteBoardMember,
  getAllBoardMembers,
} from "../../../../Api/ScrumBoardApi";
import { buildApiUrl } from "../../../../Api/host";
import { useIntl } from "react-intl";

const AddBoardMembersModal = ({
  visible,
  onClose,
  prevMembers,
  setPrevMembers,
  boardId,
  createdUser,
}) => {
  const intl = useIntl();
  const [users, setUsers] = useState([]);
  const [addUserIds, setAddUserIds] = useState([]);
  const [addApiProgress, setAddApiProgress] = useState(false);

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

  const onMemberDeselect = (member) => {
    if (addUserIds.includes(member.value)) {
      setAddUserIds((prevAddUserIds) =>
        prevAddUserIds.filter((userId) => userId !== member.value)
      );
    }
    setUsers((prevUsers) =>
      prevUsers.filter((user) => user.value !== member.value)
    );
  };

  const onMemberSelect = (member) => {
    if (!member || !member.value) return;

    if (prevMembers.some((prev) => prev.userId === member.value)) return;

    if (
      !addUserIds.includes(member.value) &&
      !users.some((user) => user.value === member.value)
    ) {
      setAddUserIds((prevAddUserIds) => [...prevAddUserIds, member.value]);
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

  async function AddNewBoardMembers() {
    const formData = {
      boardId,
      userIds: addUserIds,
    };
    setAddApiProgress(true);
    try {
      await addBoardMembers(formData);
      const membersResponse = await getAllBoardMembers(boardId);
      setPrevMembers(membersResponse.data.data);
    } catch (error) {}
    setAddApiProgress(false);
  }
  const handleOk = async () => {
    await AddNewBoardMembers();
    setUsers([]);
    setAddUserIds([]);
    onClose();
  };

  const deleteMember = async (memberId) => {
    try {
      await deleteBoardMember(memberId);
      setPrevMembers((prevMembers) =>
        prevMembers.filter((member) => memberId !== member.id)
      );
    } catch (error) {}
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

  return (
    <Modal
      title={intl.formatMessage({ id: "scrumboard.membersModal.title" })}
      open={visible}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={addApiProgress}
      okText={intl.formatMessage({ id: "scrumboard.membersModal.save" })}
      cancelText={intl.formatMessage({ id: "scrumboard.membersModal.cancel" })}
    >
      <DebounceSelect
        mode="multiple"
        placeholder={intl.formatMessage({ id: "scrumboard.membersModal.searchPh" })}
        fetchOptions={SearchUserList}
        onDeselect={onMemberDeselect}
        onSelect={onMemberSelect}
        onChange={() => {}}
        value={[]}
        style={{ width: "100%" }}
      />

      {users.length > 0 && (
        <List itemLayout="horizontal" size="small" style={{ marginTop: 20 }}>
          {users.map((user) => (
            <List.Item
              key={user.value}
              actions={[
                <Popconfirm
                  title={intl.formatMessage({
                    id: "scrumboard.membersModal.removeMember",
                  })}
                  onConfirm={() => onMemberDeselect(user)}
                  okText={intl.formatMessage({ id: "scrumboard.common.yes" })}
                  cancelText={intl.formatMessage({ id: "scrumboard.common.no" })}
                >
                  <Button danger type="text">
                    <i className="ion-android-delete" />
                  </Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                style={{ alignItems: "baseline" }}
                avatar={
                  user?.img ? (
                    <Avatar
                      src={buildApiUrl(user.img)}
                    />
                  ) : (
                    <Avatar style={{ backgroundColor: getColorById(user.value) }}>
                      {user?.label?.charAt(0).toUpperCase()}
                    </Avatar>
                  )
                }
                title={user.label}
              />
            </List.Item>
          ))}
        </List>
      )}

      {prevMembers && (
        <>
          <Divider
            orientation="left"
            style={{ fontSize: 15, fontWeight: 500, color: "#6B728E" }}
          >
            {intl.formatMessage({ id: "scrumboard.membersModal.assigned" })}
          </Divider>
          <List itemLayout="horizontal" size="small" style={{ marginTop: 20 }}>
            {prevMembers.map((member) => (
              <List.Item
                key={member.id}
                actions={
                  createdUser.id !== member.userId && [
                    <Popconfirm
                      title={intl.formatMessage({
                        id: "scrumboard.membersModal.removeMember",
                      })}
                      onConfirm={() => deleteMember(member.id)}
                      okText={intl.formatMessage({ id: "scrumboard.common.yes" })}
                      cancelText={intl.formatMessage({ id: "scrumboard.common.no" })}
                    >
                      <Button danger type="text">
                        <i className="ion-android-delete" />
                      </Button>
                    </Popconfirm>,
                  ]
                }
              >
                <List.Item.Meta
                  style={{ alignItems: "baseline" }}
                  avatar={
                    member?.imageUrl ? (
                      <Avatar
                        src={buildApiUrl(member.imageUrl)}
                      />
                    ) : (
                      <Avatar
                        style={{ backgroundColor: getColorById(member.userId) }}
                      >
                        {member?.name?.charAt(0).toUpperCase()}
                      </Avatar>
                    )
                  }
                  title={member.name}
                />
              </List.Item>
            ))}
          </List>
        </>
      )}
    </Modal>
  );
};

export default AddBoardMembersModal;
