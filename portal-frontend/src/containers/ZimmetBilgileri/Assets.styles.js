import styled from "styled-components";
import { palette } from "styled-theme";
import { Divider } from "antd";
const Wrapper = styled.div`
    background-color:white;
    padding:30px 31px;
    height:100%;
`;

export const ContentWrapper = styled.div`
    margin-top:2.5rem;
`;

export const EContactsWrapper = styled.div`
  width: 100% !important;
  padding: 30px;
  justify-self: start !important;
  align-self: start !important;
  .profile__econtacts-header {
    &.ant-typography-title {
      background-color: red;
    }
  }
`;

export const StyledDivider = styled(Divider)`
  background-color: ${palette("secondary", 15)};
  margin: 12px 0px 24px !important;
  width:75%;
`;


export default Wrapper;
