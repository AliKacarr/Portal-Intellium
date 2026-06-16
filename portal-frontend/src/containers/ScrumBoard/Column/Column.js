import React, { useState } from "react";
import { Popconfirm, Popover } from "antd";
import { useIntl } from "react-intl";
import { Draggable } from "react-beautiful-dnd";
import TaskList from "../Task/TaskList/TaskList";
import { IconSvg } from "@iso/components/ScrumBoard/IconSvg/IconSvg";
import Title from "@iso/components/ScrumBoard/Title";
import CreateOrUpdateColumn from "./ColumnCreateOrUpdate/ColumnCreateOrUpdate";
import { connect, useDispatch } from "react-redux";
import scrumBoardActions from "@iso/redux/scrumBoard/actions";
import drawerActions from "@iso/redux/drawer/actions";
import modalActions from "@iso/redux/modal/actions";
import MoreIcon from "@iso/assets/images/icon/16.svg";
import Plus from "@iso/assets/images/icon/24.svg";
import {
  Container,
  Header,
  PlusIcon,
  MoreActionsWrapper,
} from "./Column.style";
import { deleteTaskList } from "../../../Api/ScrumBoardApi";

const Column = ({
  openModal,
  taskList,
  index,
  boardId,
  cancelEditColumn,
  openDrawer,
}) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const [popoverOpen, setPopoverOpen] = useState(false);

  const deleteList = async () => {
    try {
      await deleteTaskList(taskList.id);
      dispatch(scrumBoardActions.refreshTask(true));
    } catch (error) {}
  };

  const handlePopoverOpenChange = (newOpen) => {
    setPopoverOpen(newOpen);
  };

  const MoreActions = (
    <MoreActionsWrapper>
      <p
        onClick={() => {
          openModal({
            modalType: "CREATE_COLUMN",
            modalProps: { taskList, editing: true },
          });
          setPopoverOpen(false);
        }}
      >
        {intl.formatMessage({ id: "scrumboard.column.rename" })}
      </p>
      <p>
        <Popconfirm
          title={intl.formatMessage({ id: "scrumboard.column.deleteConfirm" })}
          okText={intl.formatMessage({ id: "scrumboard.common.yes" })}
          cancelText={intl.formatMessage({ id: "scrumboard.common.no" })}
          onConfirm={deleteList}
        >
          {intl.formatMessage({ id: "scrumboard.column.deleteLink" })}
        </Popconfirm>
      </p>
    </MoreActionsWrapper>
  );
  return (
    <Draggable draggableId={`list-${taskList.id}`} index={index} key={taskList.id}>
      {(provided, snapshot) => (
        <Container
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          {taskList.editing ? (
            <CreateOrUpdateColumn
              taskList={taskList}
              boardId={boardId}
              onCancel={() => cancelEditColumn(taskList)}
            />
          ) : (
            <Header isDragging={snapshot.isDragging}>
              <Title
                isDragging={snapshot.isDragging}
                {...provided.dragHandleProps}
              >
                {taskList.name}
              </Title>
              <PlusIcon
                src={Plus}
                onClick={() =>
                  openDrawer({
                    drawerType: "CREATE_OR_EDIT_TASK",
                    drawerProps: { columnId: taskList.id },
                  })
                }
              />
              <Popover
                placement="bottom"
                content={MoreActions}
                trigger="click"
                open={popoverOpen}
                onOpenChange={handlePopoverOpenChange}
              >
                <IconSvg src={MoreIcon} border="none" padding="0" mr={"0"}  />
              </Popover>
            </Header>
          )}
          <TaskList
            taskList={taskList}
          />
        </Container>
      )}
    </Draggable>
  );
};

export default connect(null, {
  ...scrumBoardActions,
  ...drawerActions,
  ...modalActions,
})(Column);
