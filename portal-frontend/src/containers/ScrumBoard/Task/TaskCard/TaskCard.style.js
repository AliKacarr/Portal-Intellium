import styled from 'styled-components';

export const CardAttachment = styled.div`
  display: flex;
  align-items: center;
  margin-right: 16px;
  font-size: 12px;
`;
export const CardComment = styled.div`
  display: flex;
  font-size: 12px;
  align-items: center;
`;
export const FooterLeft = styled.div`
  display: flex;
  align-items: center;
  font-size: 14px;
  line-height: 30px;
  color: #788195;
`;

export const CardTitle = styled.h2`
  font-size: 15px;
  color: #2d3446;
`;

export const CardIcon = styled.img`
  width: 12px;
  height: 12px;
  margin-right: ${props => props.mr && props.mr}px;
`;

