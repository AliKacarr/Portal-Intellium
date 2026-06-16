import React, { useEffect, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { Link, useParams } from "react-router-dom";
import { DownOutlined } from "@ant-design/icons";
import { Layout, Dropdown, Tooltip, Avatar } from "antd";
import { IconSvg } from "@iso/components/ScrumBoard/IconSvg/IconSvg";
import { variables } from "@iso/assets/styles/variables";
import AvatarIcon from "@iso/assets/images/intelliumlogo1.png";
import PlusIcon from "@iso/assets/images/icon/24.svg";
import { getBoard, getAllBasicBoards } from "../../../../Api/ScrumBoardApi";
import { buildApiUrl } from "../../../../Api/host";
import AddBoardMembersModal from "./AddBoardMembersModal";
import {
  ProjectInfoCard,
  Category,
  Title,
  InfoWrapper,
  AssigneeWrapper,
  DropdownHeader,
  ViewAll,
  CreateProject,
  Header,
} from "./BoardLayout.style";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";


const { Content } = Layout;

const BoardLayout = ({ children }) => {
  const intl = useIntl();
  const [boards, setBoards] = useState([]);
  const { id } = useParams(); // Board Id
  const [currentBoard, setCurrentBoard] = useState({});
  const [prevMembers, setPrevMembers] = useState([]);
  const loggedUser = useSelector((state) => state.Auth);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  const showModal = () => setIsModalVisible(true);
  const closeModal = () => setIsModalVisible(false);
 const history = useHistory();

  useEffect(() => {
    let isMounted = true; // Lokal değişken ile kontrol

    const loadBoards = async () => {
      try {
        const response = await getAllBasicBoards();
        if (isMounted) {
          setBoards(response.data.data);
        }
      } catch (error) {
        console.error("Veri yüklenirken hata oluştu:", error);
      }
    };

    const loadBoard = async () => {
      try {
        const response = await getBoard(id);
        if (isMounted) {
          setCurrentBoard(response.data.data);
          setPrevMembers(response.data.data.boardMembers);
        }
      } catch (error) {
        history.push("/dashboard/scrum-board");
      }
    };

    loadBoards();
    loadBoard();

    return () => {
      isMounted = false; // Cleanup: bileşen kaldırıldığında state güncellenmesini engelle
    };
  }, [id, history]);

  const menuItems = useMemo(
    () => [
      {
        key: "header",
        label: (
          <DropdownHeader>
            {intl.formatMessage({ id: "scrumboard.boardLayout.boards" })}
          </DropdownHeader>
        ),
        type: "group",
      },
      ...boards.map((board) => ({
        key: board.id,
        label: (
          <Link to={`/dashboard/scrum-board/board/${board.id}`}>
            <ProjectInfoCard>
              <Avatar src={AvatarIcon} style={{ margin: "0 10px" }} />
              <InfoWrapper>
                <Title>{board.name}</Title>
                <Category>{board.category.name}</Category>
              </InfoWrapper>
            </ProjectInfoCard>
          </Link>
        ),
      })),
      {
        key: "view-all",
        label: (
          <ViewAll>
            <Link to="/dashboard/scrum-board">
              {intl.formatMessage({ id: "scrumboard.boardLayout.viewAll" })}
            </Link>
          </ViewAll>
        ),
      },
      {
        key: "create-project",
        label: (
          <CreateProject>
            <Link to="/dashboard/scrum-board/new">
              {intl.formatMessage({ id: "scrumboard.boardLayout.createNew" })}
            </Link>
          </CreateProject>
        ),
      },
    ],
    [boards, intl]
  );

  function getColorById(id) {
    const customColors = [
      "#6895D2",
      "#A4CE95",
      "#D04848",
      "#F3B95F",
      "#FDE767",
    ];
    const index = id % customColors.length;
    return customColors[index];
  }
  return (
    <Layout
      style={{
        backgroundColor: `${variables.WHITE_COLOR}`,
        height: "100%",
      }}
    >
      <Header>
        <Dropdown menu={{ items: menuItems }} overlayClassName="project-menu">
          <div>
            <ProjectInfoCard>
              <Avatar src={AvatarIcon} style={{ margin: "0 10px" }} />
              <InfoWrapper>
                <Title>{currentBoard.name}</Title>
                <Category>
                  {currentBoard.category && currentBoard.category.name}
                </Category>
              </InfoWrapper>
              <DownOutlined style={{ marginLeft: 16 }} />
            </ProjectInfoCard>
          </div>
        </Dropdown>

        {/* Avatar ve Icon */}
        <AssigneeWrapper>
          <Avatar.Group
            maxCount={5}
            maxStyle={{ color: "#003092", backgroundColor: "#FFF2DB" }}
          >
            {prevMembers &&
              prevMembers.map((assignee) => (
                <Tooltip
                  key={assignee.id}
                  title={assignee.name}
                  placement="top"
                >
                  {assignee.imageUrl ? (
                    <Avatar
                      src={buildApiUrl(assignee.imageUrl)}
                    />
                  ) : (
                    <Avatar
                      style={{
                        backgroundColor: getColorById(assignee.userId),
                      }}
                    >
                      {assignee.name.charAt(0).toUpperCase()}
                    </Avatar>
                  )}
                </Tooltip>
              ))}
          </Avatar.Group>
          {currentBoard.createdUser &&
            (currentBoard.createdUser.id === loggedUser.id ||
              loggedUser.role.roleName === "admin") && (
              <Tooltip
                title={intl.formatMessage({
                  id: "scrumboard.boardLayout.assignTooltip",
                })}
                placement="bottomRight"
              >
                <IconSvg src={PlusIcon} onClick={showModal} />
              </Tooltip>
            )}
        </AssigneeWrapper>

        {/* Modal Bileşeni */}
        {prevMembers && (
          <AddBoardMembersModal
            visible={isModalVisible}
            onClose={closeModal}
            prevMembers={prevMembers}
            setPrevMembers={setPrevMembers}
            boardId={id}
            createdUser={currentBoard.createdUser}
          />
        )}
      </Header>

      <Content
        style={{
          padding: "0 24px",
          width: "100%",
        }}
      >
        {children}
      </Content>
    </Layout>
  );
};

export default BoardLayout;
