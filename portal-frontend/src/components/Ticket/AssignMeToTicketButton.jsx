import { Button, message, Modal, Select } from "antd";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { AssignUserToTicket } from "../../Api/TicketApi";
import { AimOutlined } from "@ant-design/icons";
import { getAllBoards, getTaskListWithTasks } from "../../Api/ScrumBoardApi";

const AssignMeToTicketButton = ({ ticketId, projectId, refreshDetail }) => {
  const loggedUser = useSelector((state) => state.Auth);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiProgress, setApiProgress] = useState(false);
  const [boards, setBoards] = useState([]);
  const [listOptions, setListOptions] = useState([{ label: "Biletler", value: "default_biletler" }]);
  const [selectedBoardId, setSelectedBoardId] = useState(undefined);
  const [selectedTaskListId, setSelectedTaskListId] = useState("default_biletler");

  useEffect(() => {
    if (!isModalOpen || !projectId) return;
    const loadBoards = async () => {
      try {
        const response = await getAllBoards();
        const filteredBoards = (response.data.data || []).filter(
          (board) => board?.project?.id === projectId
        );
        setBoards(filteredBoards.map((board) => ({ label: board.name, value: board.id })));
      } catch (error) {
        setBoards([]);
      }
    };
    loadBoards();
  }, [isModalOpen, projectId]);

  const onBoardChange = async (boardId) => {
    setSelectedBoardId(boardId);
    setSelectedTaskListId("default_biletler");
    try {
      const response = await getTaskListWithTasks(boardId);
      const dynamicLists = (response.data.data || []).map((taskList) => ({
        label: taskList.name,
        value: taskList.id,
      }));
      const uniqueLists = dynamicLists.filter((list) => list.label !== "Biletler");
      setListOptions([{ label: "Biletler", value: "default_biletler" }, ...uniqueLists]);
    } catch (error) {
      setListOptions([{ label: "Biletler", value: "default_biletler" }]);
    }
  };

  const AssignMe = async () => {
    const data = {
      id: ticketId,
      assignedUserId: loggedUser.id,
      targetBoardId: selectedBoardId || null,
      targetTaskListId:
        selectedTaskListId && selectedTaskListId !== "default_biletler"
          ? selectedTaskListId
          : null,
    };
    try {
      setApiProgress(true);
      const response = await AssignUserToTicket(data);
      if (response.data.success) {
        message.success(response.data.message);
        setIsModalOpen(false);
        refreshDetail(true);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error("Atama işlemi sırasında bir hata meydana geldi.");
    } finally {
      setApiProgress(false);
    }
  };

  return (
    <div>
      <Button
        icon={<AimOutlined />}
        onClick={() => setIsModalOpen(true)}
        shape="round"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Beni Ata
      </Button>
      <Modal
        title="Görev kartı hedefi"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={AssignMe}
        okText="Ata ve oluştur"
        cancelText="İptal"
        confirmLoading={apiProgress}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <Select
            allowClear
            placeholder="Projedeki tüm panolar"
            options={boards}
            value={selectedBoardId}
            onChange={onBoardChange}
          />
          <Select
            disabled={!selectedBoardId}
            placeholder="Liste seçiniz"
            options={listOptions}
            value={selectedTaskListId}
            onChange={setSelectedTaskListId}
          />
        </div>
      </Modal>
    </div>
  );
};

export default AssignMeToTicketButton;
