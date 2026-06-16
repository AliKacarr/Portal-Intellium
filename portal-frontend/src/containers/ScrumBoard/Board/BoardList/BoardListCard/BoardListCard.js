import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Progress, Popover } from "antd";
import moment from "moment";
import { useIntl } from "react-intl";
import {
  Avatar,
  InfoWrapper,
  Title,
  CreatedAt,
  ProjectInfo,
  MoreActionWrapper,
} from "./BoardListCard.style";
import { IconSvg } from "@iso/components/ScrumBoard/IconSvg/IconSvg";
import MoreIcon from "@iso/assets/images/icon/16.svg";
import PublicIcon from "@iso/assets/images/icon/19.svg";
import SoftwareIcon from "@iso/assets/images/icon/category.svg";
import AvatarIcon from "@iso/assets/images/intelliumlogo1.png";
import { deleteBoard } from "../../../../../Api/ScrumBoardApi";
import { useSelector } from "react-redux";

export default function BoardListCard({ item, onEdit }) {
  const intl = useIntl();
  const [progress, setProgress] = useState(0);
  const loggedUser = useSelector((state) => state.Auth);
  const startDate = item.startDate;
  const endDate = item.endDate;

  useEffect(() => {
    const calculateProgress = () => {
      const now = Date.now();

      const start = Date.parse(startDate);
      const end = Date.parse(endDate);

      const diffDate = Math.abs(end - start);
      const currentDiff = Math.abs(now - start);

      const p = (currentDiff / diffDate) * 100;
      setProgress(p);
    };

    calculateProgress();
  }, [startDate, endDate]);

  const handleDelete = async () => {
    try {
      await deleteBoard(item.id);
      window.location.reload();
    } catch (error) {
      console.error("Proje silme hatası:", error);
    }
  };
  const MoreActions = (
    <MoreActionWrapper>
      <p onClick={onEdit}>{intl.formatMessage({ id: "scrumboard.boardList.edit" })}</p>
      <p onClick={handleDelete}>{intl.formatMessage({ id: "scrumboard.boardList.delete" })}</p>
    </MoreActionWrapper>
  );

  return (
    <tbody>
      <tr>
        <td>
          <Link to={`/dashboard/scrum-board/board/${item.id}`}>
            <ProjectInfo>
              <Avatar src={AvatarIcon} alt={item.name} />
              <InfoWrapper>
                <Title>{item.name}</Title>
                <CreatedAt>
                  {moment(item.endDate).format("DD.MM.YYYY")}
                </CreatedAt>
              </InfoWrapper>
            </ProjectInfo>
          </Link>
        </td>
        <td>
          <div style={{ width: 180 }}>
            <Progress
              percent={progress.toFixed(1)}
              size="small"
              status="active"
              strokeColor={{ "0%": "#108ee9", "100%": "#87d068" }}
            />
          </div>
        </td>

        <td>
          <div style={{ display: "flex", alignItems: "center" }}>
            <img
              src={SoftwareIcon}
              alt="icon"
              style={{
                width: 16,
                height: 16,
                filter:
                  "invert(28%) sepia(90%) saturate(1952%) hue-rotate(190deg)",
              }}
            />
            <span style={{ marginLeft: 8 }}>{item.category.name}</span>
          </div>
        </td>
        <td>
          <>
            <IconSvg src={PublicIcon} border={"none"} />
            {item.privateToProjectMembers
              ? intl.formatMessage({ id: "scrumboard.boardList.private" })
              : intl.formatMessage({ id: "scrumboard.boardList.public" })}
          </>
        </td>

        {(loggedUser.role.roleName === "admin" ||
          item.createdUser.id === loggedUser.id) && (
          <td>
            <Popover placement="bottom" content={MoreActions} trigger="click">
              <img
                src={MoreIcon}
                alt="more options"
                style={{ width: 20, height: 20, cursor: "pointer" }}
              />
            </Popover>
          </td>
        )}
      </tr>
    </tbody>
  );
}
