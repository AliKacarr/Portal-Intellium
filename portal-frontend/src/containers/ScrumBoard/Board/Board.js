import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { PlusOutlined } from "@ant-design/icons";
import Column from "../Column/Column";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import scrumBoardActions from "@iso/redux/scrumBoard/actions";
import { Container, AddListButton } from "./Board.style";
import BoardLayout from "./BoardLayout/BoardLayout";
import {
  getTaskListWithTasks,
  updateTaskListOrder,
  updateTaskOrder,
} from "../../../Api/ScrumBoardApi";
import { useParams } from "react-router-dom/cjs/react-router-dom";
import modalActions from "../../../redux/modal/actions";

function Board() {
  const { id } = useParams();
  const [taskListWithTasks, setTaskListWithTasks] = useState([]);
  const refresh = useSelector((state) => state.scrumBoard.refresh);
  const {
    taskCommentRemoved,
    taskCommentAdded,
    taskAttachmentAdded,
    taskAttachmentRemoved,
  } = useSelector((state) => state.scrumBoard);
  const dispatch = useDispatch();

  useEffect(() => {
    setTaskListWithTasks((prevTaskListWithTasks) => {
      const updatedTaskListWithTasks = prevTaskListWithTasks.map((taskList) => {
        const updatedTasks = taskList.tasks.map((task) => {
          if (taskCommentAdded && task.id === taskCommentAdded.taskId) {
            dispatch(scrumBoardActions.incrementTaskCommentCount(null));
            return {
              ...task,
              commentCount: task.commentCount + 1,
            };
          }

          if (taskCommentRemoved && task.id === taskCommentRemoved.taskId) {
            dispatch(scrumBoardActions.decrementTaskCommentCount(null));
            return {
              ...task,
              commentCount: Math.max(task.commentCount - 1, 0),
            };
          }

          if (taskAttachmentAdded && task.id === taskAttachmentAdded.taskId) {
            dispatch(scrumBoardActions.incrementTaskAttachmentCount(null));
            return {
              ...task,
              attachmentCount: (task.attachmentCount || 0) + 1,
            };
          }

          if (
            taskAttachmentRemoved &&
            task.id === taskAttachmentRemoved.taskId
          ) {
            dispatch(scrumBoardActions.decrementTaskAttachmentCount(null));
            return {
              ...task,
              attachmentCount: Math.max(task.attachmentCount - 1, 0),
            };
          }
          return task;
        });
        return {
          ...taskList,
          tasks: updatedTasks,
        };
      });
      return updatedTaskListWithTasks;
    });
  }, [
    taskCommentAdded,
    taskCommentRemoved,
    taskAttachmentAdded,
    taskAttachmentRemoved,
  ]);

  useEffect(() => {
    dispatch(scrumBoardActions.refreshTask(false));

    const loadTaskListWithTasks = async () => {
      try {
        const response = await getTaskListWithTasks(id);
        setTaskListWithTasks(response.data.data);
      } catch (error) {}
    };

    loadTaskListWithTasks();
  }, [id, refresh]);

  const onDragEnd = async (result) => {
    const { source, destination, type } = result;
    if (!destination) return;

    if (type === "COLUMN") {
      const items = Array.from(taskListWithTasks);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);

      const movedElements = findMovedElements(taskListWithTasks, items);
      setTaskListWithTasks(items);

      const dataList = movedElements.map((element) => ({
        id: element.modified.id,
        orderNo: element.index,
      }));

      try {
        await updateTaskListOrder(dataList);
      } catch (error) {
        console.error("Sıralama güncellenirken hata oluştu:", error);
      }
    } else if (type === "TASK") {
      const sourceListId = source.droppableId;
      const destinationListId = destination.droppableId;

      if (sourceListId === destinationListId) {
        const updatedList = taskListWithTasks.find(
          (list) => list.id === Number(sourceListId)
        );
        const updatedTasks = Array.from(updatedList.tasks);
        const [movedTask] = updatedTasks.splice(source.index, 1);
        updatedTasks.splice(destination.index, 0, movedTask);

        updatedTasks.forEach((task, index) => {
          task.orderNo = index;
        });
        const dataList = updatedTasks
          .filter(
            (task, index) => task.orderNo !== updatedList.tasks[index]?.orderNo
          )
          .map((task) => ({
            id: task.id,
            orderNo: task.orderNo,
          }));
        updatedList.tasks = updatedTasks;
        setTaskListWithTasks([...taskListWithTasks]);

        if (dataList.length > 0) {
          try {
            await updateTaskOrder(dataList);
          } catch (error) {
            console.error("Sıralama güncellenirken hata oluştu:", error);
          }
        }
      } else {
        const sourceList = taskListWithTasks.find(
          (list) => list.id === Number(sourceListId)
        );
        const destinationList = taskListWithTasks.find(
          (list) => list.id === Number(destinationListId)
        );

        const sourceTasks = Array.from(sourceList.tasks);
        const [movedTask] = sourceTasks.splice(source.index, 1);
        sourceList.tasks = sourceTasks;

        const destinationTasks = Array.from(destinationList.tasks);
        destinationTasks.splice(destination.index, 0, movedTask);

        destinationTasks.forEach((task, index) => {
          task.orderNo = index;
        });

        const dataList = destinationTasks
          .filter(
            (task, index) =>
              task.orderNo !== destinationList.tasks[index]?.orderNo
          )
          .map((task) => ({
            id: task.id,
            orderNo: task.orderNo,
            ...(sourceListId !== destinationListId && {
              taskListId: destinationList.id,
            }),
          }));
        destinationList.tasks = destinationTasks;
        setTaskListWithTasks([...taskListWithTasks]);

        if (dataList.length > 0) {
          try {
            await updateTaskOrder(dataList);
          } catch (error) {
            console.error("Sıralama güncellenirken hata oluştu:", error);
          }
        }
      }
    }
  };

  function findMovedElements(originalArray, modifiedArray) {
    const movedElements = [];

    for (let i = 0; i < originalArray.length; i++) {
      if (originalArray[i].id !== modifiedArray[i].id) {
        movedElements.push({
          original: originalArray[i],
          modified: modifiedArray[i],
          index: i,
        });
      }
    }

    return movedElements;
  }

  return (
    <BoardLayout>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="board" direction="horizontal" type="COLUMN">
          {(provided) => (
            <Container ref={provided.innerRef} {...provided.droppableProps}>
              {taskListWithTasks &&
                taskListWithTasks.map((taskList, index) => (
                  <Column
                    key={index}
                    index={index}
                    taskList={taskList}
                    boardId={id}
                  />
                ))}
              {provided.placeholder}
              <AddListButton
                onClick={() =>
                  dispatch(
                    modalActions.openModal({
                      modalType: "CREATE_COLUMN",
                      modalProps: { boardId: id },
                    })
                  )
                }
              >
                <PlusOutlined style={{ marginRight: "6px" }} />
                Yeni Liste
              </AddListButton>
            </Container>
          )}
        </Droppable>
      </DragDropContext>
    </BoardLayout>
  );
}

export default Board;
