import React from 'react';
import { Button } from 'antd';
import { useIntl } from 'react-intl';
import { Wrapper, Title, Text, Icon } from './NoBoardFounds.style';
import emptyProjectPlaceHolder from '@iso/assets/images/icon/12.svg';
export default function NoBoardFounds({ history, match }) {
  const intl = useIntl();
  return (
    <Wrapper>
      <Icon src={emptyProjectPlaceHolder} />
      <Title>{intl.formatMessage({ id: 'scrumboard.boardNotFound.title' })}</Title>
      <Text>{intl.formatMessage({ id: 'scrumboard.boardNotFound.subtitle' })}</Text>
      <Button type="primary" onClick={() => history.push(`${match.url}/new`)}>
        {intl.formatMessage({ id: 'scrumboard.boardNotFound.cta' })}
      </Button>
    </Wrapper>
  );
}
