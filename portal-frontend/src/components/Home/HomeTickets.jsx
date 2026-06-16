import React, { useEffect, useState } from "react";
import { Avatar, Button, Space, Table, Tag, Tooltip, Badge } from "antd";
import PageHeader from "@iso/components/utility/pageHeader";
import {
     GetLastTickets,
} from "../../Api/TicketApi";
import { buildApiUrl } from "../../Api/host";
import moment from "moment";
import "moment/locale/tr";
import { FileSearchOutlined, SyncOutlined } from "@ant-design/icons";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

moment.locale("tr");

const HomeTickets = () => {
     const [ticketData, setTicketData] = useState([]);

     useEffect(() => {
          fetchData();
     }, []);

     const history = useHistory();
     const handleRowClick = (row) => {
          history.push(`/dashboard/ticketDetail/${row}`);
     };

     const fetchData = async () => {
          try {
               let response = await GetLastTickets(5);

               setTicketData(
                    response.data.data.map((ticket) => {
                         if (ticket.requestType === null) {
                              return { ...ticket, requestType: "" };
                         } else {
                              return ticket;
                         }
                    })
               );
          } catch (error) {
               console.error("Error fetching data:", error);
          }
     };

     function safelyParseJSON(jsonString) {
          try {
               return JSON.parse(jsonString);
          } catch (error) {
               return [];
          }
     }

     // Renkler dizisi
     function getColorById(id) {
          // Renkler dizisi
          const customColors = [
               "#6895D2",
               "#A4CE95",
               "#D04848",
               "#F3B95F",
               "#FDE767",
          ];

          // ID'ye göre indeks hesaplanması
          const index = id % customColors.length;

          // ID'ye göre belirlenen renk döndürülmesi
          return customColors[index];
     }

     function requestColor(requestType) {
          const colors = Object.freeze({
               NEW_FEATURE: "#87AEEE",
               SUPPORT: "#FFA07A",
               IMPROVEMENT: "#88D498",
               ERROR: "#E65C54",
               DEFAULT: "#292D3E",
          });

          // Renkler dizisi
          switch (requestType) {
               case "Report a BUG":
                    return colors.ERROR;
               case "Technical Support":
                    return colors.SUPPORT;
               case "Suggest a New Feature":
                    return colors.NEW_FEATURE;
               case "Suggest Improvement":
                    return colors.IMPROVEMENT;
               default:
                    return colors.DEFAULT;
          }
     }

     // Columns
     const columns = [
          {
               title: "ID",
               dataIndex: "id",
               key: "id",
               sorter: (a, b) => a.id - b.id,
               width: 30,
               align: "center",
          },
          {
               title: "Bilet Adı",
               key: "name",
               width: 160,
               dataIndex: "name",

               render: (name) => (
                    <Tooltip placement="topLeft" title={name}>
                         <div
                              style={{
                                   display: "-webkit-box",
                                   WebkitLineClamp: 2,
                                   WebkitBoxOrient: "vertical",
                                   overflow: "hidden",
                                   textOverflow: "ellipsis",
                              }}
                         >
                              {name}
                         </div>
                    </Tooltip>
               ),
          },


          {
               title: "İstek Tipi",
               align: "center",
               key: "requestType",
               width: 70,
               dataIndex: "requestType",
               sorter: (a, b) => a.requestType.localeCompare(b.requestType),
               render: (requestType) => {
                    const parsedRequestType = safelyParseJSON(requestType);
                    return parsedRequestType.length > 0 ? (
                         parsedRequestType.map((type, index) => (
                              <Tag
                                   key={index}
                                   style={{ minWidth: 70, borderRadius: 3, margin: 4 }}
                                   bordered={false}
                                   color={requestColor(type)}
                              >
                                   {type}
                              </Tag>
                         ))
                    ) : (
                         <SyncOutlined spin />
                    );
               },
          },

          {
               title: "Proje",
               dataIndex: "project",
               key: "project",
               width: 180,

               render: (project) => (
                    <Tooltip placement="topLeft" title={project.projectName}>
                         <div
                              style={{
                                   display: "-webkit-box",
                                   WebkitLineClamp: 2,
                                   WebkitBoxOrient: "vertical",
                                   overflow: "hidden",
                                   textOverflow: "ellipsis",
                              }}
                         >
                              {project.projectName}
                         </div>
                    </Tooltip>
               ),
          },

          {
               title: "Oluşturma Tarihi",
               dataIndex: "creationDate",
               key: "creationDate",
               render: (creationDate) => (
                    <Tooltip title={moment(creationDate).format("HH:mm")}>
                         <span>{moment(creationDate).format("DD MMMM YYYY")}</span>
                    </Tooltip>
               ),
               width: 60,
          },
          {
               defaultSortOrder: "ascend",
               align: "center",
               title: "Bilet Durumu",
               dataIndex: "status",
               key: "status",
               width: 80,
               sorter: (a, b) => a.status - b.status,
               render: (status) => (
                    <Space>
                         {status === 0 ? (
                              <Badge status="processing" color="#5AB2FF" text="Yeni istek" />
                         ) : status === 1 ? (
                              <Badge status="processing" color="#AD88C6" text="Atandı" />
                         ) : (
                              <Badge status="processing" color="#7ABA78" text="Çözümlendi" />
                         )}
                    </Space>
               ),
          },
          {
               align: "center",
               title: "Atanan Kullanıcı",
               width: 40,
               dataIndex: "assignedUser",
               key: "assignedUser",
               render: (assignedUser) =>
                    assignedUser && assignedUser.imageUrl ? (
                         <Tooltip title={assignedUser.name}>
                              <Avatar
                                   size="large"
                                   src={buildApiUrl(assignedUser.imageUrl)}
                              />
                         </Tooltip>
                    ) : assignedUser ? (
                         <Tooltip title={assignedUser.name}>
                              <Avatar
                                   size="large"
                                   style={{ backgroundColor: getColorById(assignedUser.id) }}
                              >
                                   {assignedUser.name.charAt(0).toUpperCase()}
                              </Avatar>
                         </Tooltip>
                    ) : null,
          },
          {
               align: "center",
               width: 40,
               key: "action",
               render: (text, record) => (
                    <Space>
                         <Button type="text" onClick={() => handleRowClick(record.id)}>
                              <FileSearchOutlined />
                         </Button>
                    </Space>
               ),
          },
     ];

     return (
          <div>
               <PageHeader>Son Biletler</PageHeader>
               <Table
                    size="small"
                    columns={columns}
                    dataSource={ticketData}
                    scroll={{
                         x: 750,
                    }}
                    pagination={false}
               >

               </Table>
          </div>
     );
};

export default HomeTickets;
