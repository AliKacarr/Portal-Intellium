import styled from "styled-components";
const Wrapper = styled.div``;

export const Banner = styled.div`
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  height: 200px;
  position: relative;
  &::after {
    content: "";
    height: 200px;
    width: 100%;
    position: relative;
    bottom: 0;
    left: 0;
    background: linear-gradient(rgba(255, 255, 255, 0), rgba(0, 0, 0, 0.41));
  }

  @media only screen and (max-width: 767px) {
    height: 150px;
  }
`;

export const ContentWrapper = styled.div`
  padding: 0;
`;

export const AvatarContainer = styled.div`
 
height: 200px;
position: relative;
z-index: 1;
padding: 15px;

@media only screen and (max-width: 767px) {
    height: 100px;
    line-height: 24px;
  }
  h3 {
    font-size: 26px;
    line-height: 26px;
    font-weight: 400;
    color: #ffffff;
    pointer-events: all;
    @media only screen and (max-width: 767px) {
      font-size: 24px;
      line-height: 24px;
    }
  }

  @media only screen and (max-width: 767px) {
    width: calc(100% - 100px);
  }
  .avatar-card {
    position: relative;
    pointer-events: none;
    width: calc(100% - 30px);
    @media only screen and (max-width: 767px) {
      margin-top: 10px;
    }
    .avatar {
      @media only screen and (max-width: 767px) {
        width: 100px !important;
        height: 100px !important;
        bottom: 0 !important;
      }
     
      
    }

`;
export default Wrapper;
