import React from "react";
import { Formik } from "formik";
import CreateBoardForm from "@iso/components/ScrumBoard/CreateOrUpdateBoardForm/CreateBoardForm";
import { IconSvg } from "@iso/components/ScrumBoard/IconSvg/IconSvg";
import ArrowIcon from "@iso/assets/images/icon/04-icon.svg";
import CloseIcon from "@iso/assets/images/icon/07-icon.svg";
import { Wrapper, FormWrapper, TopBar } from "./BoardCreateOrUpdate.style";

const BoardCreate = (props) => {
  return (
    <Wrapper>
      <TopBar>
        <IconSvg
          src={ArrowIcon}
          border="none"
          padding={"0"}
          alt="Arrow Icon"
          style={{ transform: "rotateY(180deg)" }}
          onClick={() => window.history.back()}
        />
        <IconSvg
          src={CloseIcon}
          border="none"
          padding={"0"}
          alt="Close Icon"
          onClick={() => props.history.push(`/dashboard/scrum-board`)}
        />
      </TopBar>
      <FormWrapper>
        <Formik component={CreateBoardForm} />
      </FormWrapper>
    </Wrapper>
  );
};
export default BoardCreate;
