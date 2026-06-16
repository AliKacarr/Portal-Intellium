import React, { useState } from 'react';
import { addTaskTodo, deleteTaskTodo } from '../../../../Api/ScrumBoardApi';
import './TaskTodos.css';
import { Button, message } from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import scrumBoardActions from '@iso/redux/scrumBoard/actions';
import { isEmptyArray } from 'formik';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import TaskTodo from '../../../../components/ScrumBoard/TaskTodo/TaskTodo';

const TaskTodos = ({ todos, todoListId }) => {

    const intl = useIntl();
    const dispatch = useDispatch();
    const [showAddTaskTodoEditor, setShowAddTaskTodoEditor] = useState(false);
    const [addApiProgress, setAddApiProgress] = useState(false);
    const [editorValue, setEditorValue] = useState();

    const onDeleteTodo = async (todoId) => {
        try {
            await deleteTaskTodo(todoId);
            dispatch(scrumBoardActions.reloadTaskTodoLists(true));
        } catch (error) {
            message.error(intl.formatMessage({ id: "scrumboard.taskTodos.error" }));
        }
    }

    const onAddTodo = async () => {
        setAddApiProgress(true);
        try {
            const todo = {
                taskTodoListId: todoListId,
                content: editorValue
            }
            await addTaskTodo(todo);
            setEditorValue(undefined);
            setShowAddTaskTodoEditor(false);
            dispatch(scrumBoardActions.reloadTaskTodoLists(true));

        } catch (error) {
            console.log(error)
        }
        setAddApiProgress(false);
    }

    return (
        <>
            {!isEmptyArray(todos) &&
                todos.map((todo, index) => (
                    <TaskTodo
                        todo={todo}
                        key={index}
                        onDeleteTodo={onDeleteTodo}
                    />
                ))
            }

            <div style={{ marginTop: 10 }}>
                {
                    showAddTaskTodoEditor ?
                        <>
                            <TextArea
                                autoSize={{ minRows: 2 }}
                                onChange={(e) => setEditorValue(e.target.value)}
                                value={editorValue}
                            />
                            <Button type='primary' className='addTaskTodoButton' onClick={onAddTodo} loading={addApiProgress}>{intl.formatMessage({ id: "scrumboard.taskTodos.add" })}</Button>
                            <Button onClick={() => setShowAddTaskTodoEditor(false)}>{intl.formatMessage({ id: "scrumboard.taskTodos.cancel" })}</Button>
                        </>
                        :
                        <Button onClick={() => setShowAddTaskTodoEditor(true)}>{intl.formatMessage({ id: "scrumboard.taskTodos.addItem" })}</Button>
                }
            </div>
        </>
    );
};

export default TaskTodos;
