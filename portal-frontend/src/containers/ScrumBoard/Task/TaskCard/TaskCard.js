import React from 'react';
import { Card, Badge } from 'antd';
import moment from 'moment';
import { HrBar, CardFooter, CardBody } from '../Task.style';
import ClockIcon from '@iso/assets/images/icon/17.svg';
import CommentsIcon from '@iso/assets/images/icon/09-icon.svg';
import AttachmentIcon from '@iso/assets/images/icon/01-icon.svg';
import {
  CardAttachment,
  CardComment,
  FooterLeft,
  CardTitle,
  CardIcon,
  CardLabel,
} from './TaskCard.style';

const TaskCard = ({ task, showDrawer }) => {

  const CardHeader = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontSize: "12px" }}>
        <CardIcon src={ClockIcon} alt="Clock Icon" mr={8} />
        {moment(task.startDate || task.createdDate).format('DD.MM.YYYY')} - {moment(task.dueDate).format('DD.MM.YYYY')}
      </div>
      <div>
        {task.taskLabels.map(label => (
          <Badge key={label.id} color={`#${label.color}`} style={{ marginRight: 8 }} />
        ))}
      </div>

    </div>
  );



  return (
    <Card
      style={{
        width: '100%',
        borderRadius: '10px',
        backgroundColor: '#ffffff',
      }}
      bodyStyle={{ padding: 0 }}
      headStyle={{ borderBottom: 'none', fontSize: 14, color: '#788195' }}
      bordered={false}
      title={CardHeader}
    >
      <CardBody onClick={showDrawer}>
        <CardTitle>{task.name}</CardTitle>
      </CardBody>
      <CardFooter>
        <FooterLeft>
          <CardAttachment>
            <CardIcon src={AttachmentIcon} mr={5} /> {task.attachmentCount}
          </CardAttachment>
          <CardComment>
            <CardIcon src={CommentsIcon} mr={5} /> {task.commentCount}
          </CardComment>
        </FooterLeft>
      </CardFooter>
    </Card>
  );
};
export default TaskCard;
