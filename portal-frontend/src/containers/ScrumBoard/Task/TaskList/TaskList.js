import React, { PureComponent } from "react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import TaskItem from "../Task";
import { DropZone, Wrapper } from "./TaskList.style";
import { Scrollbars } from "react-custom-scrollbars";

class InnerTaskList extends PureComponent {
  render() {
    const { tasks, taskListId } = this.props;
    return tasks.map((task, index) => (
      <Draggable key={task.id} draggableId={`task-${task.id}`} index={index}>
        {(dragProvided, dragSnapshot) => (
          <TaskItem
            key={index}
            task={task}
            taskListId={taskListId}
            isDragging={dragSnapshot.isDragging}
            isGroupedOver={Boolean(dragSnapshot.combineTargetFor)}
            provided={dragProvided}
          />
        )}
      </Draggable>
    ));
  }
}

const TaskList = ({
  ignoreContainerClipping,
  isDropDisabled,
  isCombineEnabled,
  taskList,
}) => {
  return (
    <Droppable
      droppableId={`${taskList.id}`}
      type="TASK"
      ignoreContainerClipping={ignoreContainerClipping}
      isDropDisabled={isDropDisabled}
      isCombineEnabled={isCombineEnabled}
    >
      {(dropProvided, dropSnapshot) => (
        <Wrapper
          isDraggingOver={dropSnapshot.isDraggingOver}
          isDropDisabled={isDropDisabled}
          {...dropProvided.droppableProps}
        >
          <DropZone ref={dropProvided.innerRef}>
            <Scrollbars autoHide>
              <InnerTaskList tasks={taskList.tasks} taskListId={taskList.id} />
              {dropProvided.placeholder}
            </Scrollbars>
          </DropZone>
        </Wrapper>
      )}
    </Droppable>
  );
};

export default TaskList;
