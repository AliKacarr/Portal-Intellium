import styled from "styled-components";
import { palette } from "styled-theme";

const Wrapper = styled.div`
    padding:50px 31px;
    background-color: white;
    .larger {
    font-size: 24px; /* Adjust the font size as needed */
    }
    .ant-typography{
        margin : 0 !important;
    }
.job-header{
    display : flex;
    flex-direction : column;
    gap : 2rem;
   

}
.darkened {
  color: #333; 
}
.des-header{
    display : flex;
    justify-content: space-between;
    align-items: center;
    .ant-btn{
        border-radius : 2rem !important;
    }
    .job-header-buttons{
        display : flex;
        justify-content: space-around;
        align-items: center;
        gap : 0.7rem;
    }
}
`;

export const ContentWrapper = styled.div`
  padding: 30px 0;
`;

export default Wrapper;
