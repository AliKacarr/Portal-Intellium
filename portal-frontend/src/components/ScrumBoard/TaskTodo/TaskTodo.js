import { Button, Checkbox, message, Popconfirm, Popover } from 'antd';
import React, { useState } from 'react';
import { changeStateTaskTodo, updateTaskTodo } from '../../../Api/ScrumBoardApi';
import { MoreOutlined } from '@ant-design/icons';
import './TaskTodo.css';
import TextArea from 'antd/lib/input/TextArea';

const TaskTodo = ({ todo, key, onDeleteTodo }) => {

    const [editTodo, setEditTodo] = useState(false);
    const [todoChecked, setTodoChecked] = useState();
    const [updateTodoContent, setUpdateTodoContent] = useState();
    const [updateApiProgress, setUpdateApiProgress] = useState(false);

    const onUpdateTodo = async () => {
        setUpdateApiProgress(true);

        const updateTodo = {
            id: todo.id,
            content: updateTodoContent
        }
        try {
            await updateTaskTodo(updateTodo);
            todo.content = updateTodoContent

        } catch (error) {
            message.error('Bir hata oluştu');
        }
        setEditTodo(false);
        setUpdateApiProgress(false);
    }

    const todoOnChange = async (e) => {
        try {
            setTodoChecked(e.target.checked);
            await changeStateTaskTodo(todo.id, e.target.checked);
        } catch (error) {
            setTodoChecked(todo.state);
        }
    };

    const onCancel = () => {
        setEditTodo(false);
    }

    const MoreActions = () => (
        <div>
            <p onClick={() => setEditTodo(true)} className='moreActions'>Düzenle</p>
            <Popconfirm
                title="Silmek istediğinizden emin misiniz?"
                okText="Evet"
                cancelText="Hayır"
                className='moreActions'
                onConfirm={() => onDeleteTodo(todo.id)}
            >
                Sil
            </Popconfirm>
        </div>
    );


    return (
        <li key={key} className='taskTodo'>

            {editTodo ?
                <>
                    <TextArea
                        autoSize={{ minRows: 2 }}
                        defaultValue={todo.content}
                        onChange={(e) => setUpdateTodoContent(e.target.value)}
                    />
                    <Button onClick={onUpdateTodo} className='editTodoButton' type='primary' loading={updateApiProgress}>Kaydet</Button>
                    <Button onClick={onCancel}>İptal et</Button>
                </>

                :

                <>
                    <Checkbox
                        defaultChecked={todo.state}
                        checked={todoChecked}
                        onChange={todoOnChange}
                        style={{ marginRight: 10 }}
                    />
                    <span>
                        {todo.content}
                    </span>

                    <div className='moreButton' >
                        <Popover content={() => MoreActions(todo.id)} placement="bottom" trigger="click" >
                            <MoreOutlined />
                        </Popover>
                    </div>
                </>
            }

        </li>
    );
};

export default TaskTodo;