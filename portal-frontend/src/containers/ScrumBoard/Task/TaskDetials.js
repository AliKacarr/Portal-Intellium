import React, { Fragment } from 'react';
import { UserOutlined } from '@ant-design/icons';
import { Badge, Button, Avatar } from 'antd';
import { useIntl } from 'react-intl';
import TaskForm from '@iso/components/scrumBoard/TaskForm';
import Comments from '@iso/components/scrumBoard/Comments';
import { CardHeader } from './style';
const TaskDetials = ({ task, onDelete, onEdit, onCancel }) => {
  const intl = useIntl();
  return (
    <div style={{ marginTop: 24 }}>
      {task.editing ? (
        <TaskForm initials={task} onCancel={onCancel} />
      ) : (
        <>
          <CardHeader>
            <p>{intl.formatMessage({ id: 'scrumboard.taskDetials.title' })}{task.title}</p>
            <p>
              <Button type="warning" onClick={onEdit}>
                {intl.formatMessage({ id: 'scrumboard.taskDetials.edit' })}
              </Button>
              <Button
                type="danger"
                onClick={onDelete}
                style={{ marginLeft: 16 }}
              >
                {intl.formatMessage({ id: 'scrumboard.taskDetials.delete' })}
              </Button>
            </p>
          </CardHeader>
          <p>
            <strong>{intl.formatMessage({ id: 'scrumboard.taskDetials.labels' })}</strong>
            {task.labels.map((label) => (
              <Badge
                key={label}
                status={label}
                text={`${label[0].toUpperCase()}${label.slice(1)}`}
                style={{ margin: 10 }}
              />
            ))}
          </p>
          <p>
            <strong>{intl.formatMessage({ id: 'scrumboard.taskDetials.description' })}</strong> {task.description}
          </p>
          <p>
            <strong>{intl.formatMessage({ id: 'scrumboard.taskDetials.assignees' })}</strong>
            {task.assignees.map((assignee) => (
              <Fragment key={assignee}>
                <Avatar icon={<UserOutlined />} />
              </Fragment>
            ))}
          </p>
          <p>
            <strong>{intl.formatMessage({ id: 'scrumboard.taskDetials.dueDate' })}</strong>
            {task.due_date}
          </p>

          <Comments />
        </>
      )}
    </div>
  );
};

export default TaskDetials;
