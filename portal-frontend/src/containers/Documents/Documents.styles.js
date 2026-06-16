import styled from "styled-components";
import { palette } from "styled-theme";
import { Divider } from "antd";
const Wrapper = styled.div`
  background-color: white;
  padding: 30px 31px;
  height: 100%;
`;

export const DocumentContainer = styled.div`
  width: 100%;
  margin-top: 2rem;
  height:90%
`;


export const DocumentContainerHeader = styled.div`
  width: 100% !important;
  display : flex;
  justify-content: space-between;
  align-items: center;
  .ant-typography {
    margin:0 !important;
  }
  
`;
export const DocumentCardVertical = styled.div`

  padding : 1rem !important;
  border-radius : 0.5rem !important;
  display : flex !important;
  flex-direction : column !important; 
  justify-content :center !important;
  align-items: center !important; 
  transition : all 0.1s ease-in;
  &:hover {
    background-color:#edecf0 !important;
  }
  .anticon-folder{
    font-size: 5rem !important;
  }
  .anticon-file-text{
    font-size: 5rem !important;

  }
`;
export const StyledDivider = styled(Divider)`
  background-color: ${palette("secondary", 15)};
  margin: 12px 0px 24px ;
  width: 75%;
`;

export default Wrapper;
