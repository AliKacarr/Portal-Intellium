// src/containers/EmergencyContact/EmergencyContact.styles.js
import styled from "styled-components";
import { palette } from "styled-theme";
import { Divider } from "antd";

const Wrapper = styled.div`
  background-color: white;
  padding: 30px 31px;
  height: 100%;
`;

export const ContentWrapper = styled.div`
  margin-top: 2.5rem;
`;

export const StyledDivider = styled(Divider)`
  background-color: ${palette("secondary", 15)};
  margin: 12px 0px 24px !important;
  width: 75%;
`;

export const ContactCard = styled.div`
  width: 100%;
  height: auto;
  min-height: 165px;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0px 8px 25px -5px rgba(0, 0, 0, 0.08);
  position: relative;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  overflow: hidden;
  border: 2px solid transparent; /* Varsayılan olarak transparan kenarlık */

  &.primary-contact {
    box-shadow: 0px 8px 25px -5px rgba(135, 208, 104, 0.3);
    border: 2px solid #87d068; /* Gölge yerine ince yeşil kenarlık */
  }
`;

export const CardHeader = styled.div`
  height: 80px;
  background: linear-gradient(135deg, #2d3446, #3f4780);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: -50%;
    width: 200%;
    height: 80px;
    background: #ffffff;
    border-radius: 50%;
    transform: translateY(50%);
  }
`;

export const Avatar = styled.div`
  width: 65px;
  height: 65px;
  border-radius: 50%;
  background: ${props => props.bgColor || '#f5f5f5'}; 
  position: absolute;
  top: 45px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
`;

export const CardContent = styled.div`
  padding: 35px 20px 15px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  flex-grow: 1;

  .ant-typography {
    &.ant-typography-h5 {
      font-size: 18px;
    }
  }
`;

export const ActionMenu = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 20;
  display: flex;
  gap: 8px;
  align-items: center;
`;

export const CardBody = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: left;
`;

export const ContactInfoRow = styled.div`
  display: flex;
  align-items: start;
  gap: 12px;
  padding: 2px 0;

  .anticon {
    color: #888;
    font-size: 16px;
    flex-shrink: 0;
    margin-top: 3px;
  }

  .ant-typography {
    margin: 0;
    color: #333;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 14px;
  }

  .address-text {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

export const InfoAction = styled.div`
  margin-left: auto;
  cursor: pointer;
  color: #aaa;
  font-size: 16px;
  
  &:hover {
    color: #00b4e6;
  }
`;

export default Wrapper;