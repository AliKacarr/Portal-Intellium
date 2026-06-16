import React, { useEffect } from "react";
import { Checkbox, Modal, Select, Tag, Table, Switch, Button, Spin } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { ModalField, ModalForm, ModalLabel } from "../Notes.styles";

function NotesModals({
  texts,
  shareModalVisible,
  shareUserId,
  shareReadOnly,
  sharedUsersList,
  sharedUsersLoading,
  fetchSharedUsers,
  toggleSharedUserReadOnly,
  removeSharedUser,
  editTagsModalVisible,
  allTags,
  allUsers,
  currentUserId,
  selectedNoteId,
  selectedTagIdsDraft,
  accessToken,
  handleUnauthorized,
  onShareUserIdChange,
  onShareReadOnlyChange,
  onSelectedTagIdsDraftChange,
  onCancelShare,
  onSubmitShare,
  onCancelEditTags,
  onSubmitEditTags,
}) {
  const selectedTagIdKeys = new Set((selectedTagIdsDraft || []).map((id) => String(id)));
  const selectedTags = (allTags || []).filter((tag) =>
    selectedTagIdKeys.has(String(tag.id))
  );

  const sharedUserIdsSet = new Set((sharedUsersList || []).map(r => String(r.userId)));

  const userOptions = (allUsers || [])
    .map((user) => {
      const userId = user?.id ?? user?.Id ?? user?.userId ?? user?.UserId;
      if (userId == null) return null;
      if (String(userId) === String(currentUserId)) return null;
      if (sharedUserIdsSet.has(String(userId))) return null;
      return {
        value: String(userId),
        label:
          user?.name ||
          user?.Name ||
          user?.fullName ||
          user?.FullName ||
          user?.email ||
          user?.Email ||
          `${texts.userFallbackLabel} ${userId}`,
      };
    })
    .filter(Boolean);

  useEffect(() => {
    if (shareModalVisible && selectedNoteId && accessToken) {
      if (fetchSharedUsers) fetchSharedUsers();
    }
  }, [shareModalVisible, selectedNoteId, accessToken, fetchSharedUsers]);

  const columns = [
    {
      title: texts.shareUserIdLabel,
      dataIndex: "userName",
      key: "userName",
      render: (_, record) => (
        <span>
          {record.userName}
          {record.userEmail ? ` (${record.userEmail})` : ""}
        </span>
      ),
    },
    {
      title: texts.sharedUsersReadOnly,
      dataIndex: "readOnly",
      key: "readOnly",
      width: 120,
      render: (readOnly, record) => {
        const uid = record.userId ?? record.UserId ?? record.id;
        return (
          <Switch
            checked={!!readOnly}
            onChange={(checked) => toggleSharedUserReadOnly && toggleSharedUserReadOnly(uid, checked)}
          />
        );
      },
    },
    {
      title: "",
      key: "remove",
      width: 130,
      render: (_, record) => {
        const uid = record.userId ?? record.UserId ?? record.id;
        return (
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: texts.sharedUsersConfirmRemove,
                content: null,
                okText: texts.deleteTagConfirmOk,
                cancelText: texts.deleteTagConfirmCancel,
                onOk: () => {
                  if (removeSharedUser) removeSharedUser(uid);
                }
              });
            }}
          >
            {texts.sharedUsersRemove}
          </Button>
        );
      },
    },
  ];

  return (
    <>
      <Modal
        title={texts.shareNote}
        open={shareModalVisible}
        onCancel={onCancelShare}
        onOk={onSubmitShare}
        okText={texts.shareButton}
        width={600}
      >
        <ModalForm>
          <ModalField>
            <ModalLabel>{texts.shareUserIdLabel}</ModalLabel>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Select
                showSearch
                style={{ flex: 1 }}
                placeholder={texts.selectUserPlaceholder}
                optionFilterProp="label"
                value={shareUserId || undefined}
                onChange={onShareUserIdChange}
                options={userOptions}
              />
              <Checkbox
                checked={shareReadOnly}
                onChange={(event) => onShareReadOnlyChange(event.target.checked)}
              >
                {texts.readOnly}
              </Checkbox>
            </div>
          </ModalField>
        </ModalForm>

        <div style={{ marginTop: 24, borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
          <h4 style={{ marginBottom: 16 }}>{texts.sharedUsersTitle}</h4>
          {sharedUsersLoading ? (
            <div style={{ textAlign: "center", padding: 24 }}>
              <Spin />
              <div style={{ marginTop: 8 }}>{texts.sharedUsersLoading}</div>
            </div>
          ) : sharedUsersList && sharedUsersList.length === 0 ? (
            <div style={{ padding: 24, color: "#9ca3af", textAlign: "center" }}>
              {texts.sharedUsersEmpty}
            </div>
          ) : (
            <Table
              dataSource={sharedUsersList}
              columns={columns}
              rowKey={(row) => String(row.userId ?? row.UserId ?? row.id)}
              pagination={false}
              size="small"
            />
          )}
        </div>
      </Modal>

      <Modal
        title={texts.editTags}
        open={editTagsModalVisible}
        onCancel={onCancelEditTags}
        onOk={onSubmitEditTags}
        okText={texts.saveButton}
      >
        <ModalForm>
          <ModalField>
            <ModalLabel>{texts.selectExistingTags}</ModalLabel>
            <Select
              mode="multiple"
              placeholder={texts.selectTag}
              value={selectedTagIdsDraft}
              onChange={onSelectedTagIdsDraftChange}
              options={(allTags || []).map((tag) => ({
                value: tag.id,
                label: tag.name,
              }))}
              optionFilterProp="label"
              style={{ width: "100%" }}
            />
          </ModalField>

          <ModalField>
            <ModalLabel>{texts.selectedTags}</ModalLabel>
            {selectedTags.length === 0 ? (
              <span style={{ fontSize: 12, color: "#9ca3af" }}>{texts.noTagSelected}</span>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {selectedTags.map((tag) => (
                  <Tag
                    key={tag.id}
                    color={tag.color}
                    closable
                    onClose={(event) => {
                      event.preventDefault();
                      onSelectedTagIdsDraftChange(
                        (selectedTagIdsDraft || []).filter(
                          (id) => String(id) !== String(tag.id)
                        )
                      );
                    }}
                    style={{ borderRadius: 999, padding: "2px 10px" }}
                  >
                    {tag.name}
                  </Tag>
                ))}
              </div>
            )}
          </ModalField>
        </ModalForm>
      </Modal>
    </>
  );
}

export default NotesModals;
