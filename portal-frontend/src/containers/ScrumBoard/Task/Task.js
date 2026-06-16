import React from "react";
import { connect } from "react-redux";
import scrumBoardActions from "@iso/redux/scrumBoard/actions";
import drawerActions from "@iso/redux/drawer/actions";
import { Container } from "./Task.style";
import TaskCard from "./TaskCard/TaskCard";

class TaskItem extends React.PureComponent {
  render() {
    const {
      task,
      key,
      isDragging,
      isGroupedOver,
      provided,
      taskListId,
      openDrawer,
      closeDrawer,
    } = this.props;

    return (
      <Container
        isDragging={isDragging}
        isGroupedOver={isGroupedOver}
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
      >
        <TaskCard
        key={key}
          isDragging={isDragging}
          {...provided.dragHandleProps}
          task={task}
          showDrawer={() =>
            openDrawer({
              drawerType: "CARD_DETAILS",
              drawerProps: {
                task: task,
                columnId: taskListId,
              },
            })
          }
          closeDrawer={() => closeDrawer()}
        />
      </Container>
    );
  }
}

export default connect(null, { ...scrumBoardActions, ...drawerActions })(
  TaskItem
);
