import React from 'react';
import styled from 'styled-components';
import { Button, Popconfirm, Spin } from 'antd';
import { useIntl } from 'react-intl';
import { IconSvg } from '@iso/components/ScrumBoard/IconSvg/IconSvg';
import RemoveIcon from '@iso/assets/images/icon/02-icon.svg';
import ArrowIcon from '@iso/assets/images/icon/04-icon.svg';

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 69px;
  background-color: #ffffff;
  border-bottom: 1px solid #e9e9e9;
`;

const ActionButtons = styled.div`
  > img {
    margin-right: 15px;
    border: none;
    width: 40px;
    margin-left: -5px;
  }
`;

const IconButtons = styled.div`
  > img {
    margin-left: 15px;
    margin-right: 0;
  }
`;
export default function CreateTaskHeader({
  values,
  onCancel,
  onDelete,
  onEditCancel,
  apiProgress,
  hideDelete,
}) {
  const intl = useIntl();
  return (
    <Container>
      {apiProgress ? <Spin /> :
        <>
          <ActionButtons>
            <IconSvg
              src={ArrowIcon}
              onClick={onCancel}
              style={{ transform: 'rotate(180deg)' }}
            />
            {apiProgress ? <Spin /> :
              <Button htmlType="submit" type="primary">
                {values && !values.editing
                  ? intl.formatMessage({ id: 'scrumboard.taskHeader.save' })
                  : intl.formatMessage({ id: 'scrumboard.taskHeader.update' })}
              </Button>
            }
            {values && values.editing && onEditCancel && (
              <Button
                type="default"
                onClick={onEditCancel}
                style={{ marginLeft: 16 }}
              >
                {intl.formatMessage({ id: 'scrumboard.taskHeader.cancel' })}
              </Button>
            )}
          </ActionButtons>
          <IconButtons>
            {values && values.editing && !hideDelete && (
              <Popconfirm
                title={intl.formatMessage({ id: 'scrumboard.taskHeader.deleteConfirm' })}
                placement='bottomRight'
                okText={intl.formatMessage({ id: 'scrumboard.common.yes' })}
                cancelText={intl.formatMessage({ id: 'scrumboard.common.no' })}
                onConfirm={onDelete}
              >
                <IconSvg src={RemoveIcon} />
              </Popconfirm>
            )}
          </IconButtons>
        </>
      }


    </Container>
  );
}
