import { Button, Input, Popconfirm, Spin, message } from 'antd';
import HeadingWithIcon from '@iso/components/ScrumBoard/HeadingWithIcon/HeadingWithIcon';
import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { updateTaskTodoList } from '../../../../Api/ScrumBoardApi';
import './TaskTodoList.css';
import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import TaskTodos from '../TaskTodos/TaskTodos';

const TaskTodoList = ({ todoList, key, onDeleteTaskTodoList, deleteTodoListApiProgress }) => {

    const intl = useIntl();
    const [editTodoList, setEditTodoList] = useState(false);
    const [updateTodoListTitle, setUpdateTodoListTitle] = useState();
    const [updateApiProgress, setUpdateApiProgress] = useState(false);



    const onChange = async (e) => {
        setUpdateTodoListTitle(e.target.value);
    }

    const onCancel = () => {
        setEditTodoList(false);
    }

    const updateTodoList = async () => {
        setUpdateApiProgress(true);
        try {
            const updated = {
                id: todoList.id,
                title: updateTodoListTitle
            }
            await updateTaskTodoList(updated);
            todoList.title = updateTodoListTitle;
        } catch (error) {
            message.error(intl.formatMessage({ id: "scrumboard.taskTodoList.updateError" }));
        }
        setUpdateApiProgress(false);
        setEditTodoList(false);
    }
    return (
        <>
            <ul key={key} style={{ marginBottom: 30 }}>
                {!editTodoList ?
                    <div className='todoList'>
                        <HeadingWithIcon heading={todoList.title} />
                        <div className='btnContainer'>
                            <Button className='editBtn' icon={<EditOutlined />} onClick={() => setEditTodoList(true)} />
                            {deleteTodoListApiProgress ? <Spin /> :
                                <Popconfirm
                                    placement='topRight'
                                    title={intl.formatMessage({ id: "scrumboard.taskTodoList.deleteConfirm" })}
                                    okText={intl.formatMessage({ id: "scrumboard.common.yes" })}
                                    cancelText={intl.formatMessage({ id: "scrumboard.common.no" })}
                                    onConfirm={() => onDeleteTaskTodoList(todoList.id)}
                                >
                                    <div>
                                        <Button icon={<DeleteOutlined />} />
                                    </div>
                                </Popconfirm>
                            }
                        </div>
                    </div>

                    :

                    <div className='todoList'>
                        <Input className='editor' onChange={onChange} defaultValue={todoList.title} />
                        <div className='btnContainer'>
                            <Button className='editBtn' icon={<CheckOutlined />} onClick={updateTodoList} loading={updateApiProgress} />
                            <Button icon={<CloseOutlined />} onClick={onCancel} />
                        </div>
                    </div>
                }


                <TaskTodos todos={todoList.taskTodos} todoListId={todoList.id} />

            </ul>

        </>
    );
};

export default TaskTodoList;
