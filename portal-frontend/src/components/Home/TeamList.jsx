import React, { useEffect, useState } from "react";
import { GetProjectTeams } from "../../Api/ProjectTeamApi";
import { buildApiUrl } from "../../Api/host";
import { Avatar, Table, Tooltip } from "antd";
import PageHeader from "@iso/components/utility/pageHeader";

const TeamList = ({ loggedUser }) => {
     /// Badge color
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

     const [dataSource, setDataSource] = useState([]);
     const fetchData = async () => {
          try {
               let response = await GetProjectTeams(loggedUser);

               const modifiedData = response.data.data.map((item) => ({
                    ...item,
                    key: item.id, // Set the 'key' property to the 'id' for each item
               }));
               setDataSource(modifiedData);
          } catch (error) {
               console.error("Error fetching data:", error);
          }
     };

     useEffect(() => {
          fetchData();
     }, []);

     const columns = [
          {
               title: "Proje Ekip Adı",
               dataIndex: "name",
               key: "name",
               width: 150,
          },
          {
               title: "Proje Adı",
               dataIndex: "projectName",
               key: "projectName",
               width: 130,
               render: (projectName) => (
                    <Tooltip placement="topLeft" title={projectName}>
                         <div
                              style={{
                                   display: "-webkit-box",
                                   WebkitLineClamp: 2,
                                   WebkitBoxOrient: "vertical",
                                   overflow: "hidden",
                                   textOverflow: "ellipsis",
                              }}
                         >
                              {projectName}
                         </div>
                    </Tooltip>
               ),
          },
          {
               title: "Kişiler ",
               dataIndex: "members",
               key: "projeEkibi",
               width: 70,
               render: (users) => (
                    <Avatar.Group
                         maxCount={3}
                         maxStyle={{ color: "#0d47a1", backgroundColor: "#bbdefb" }}
                    >
                         {users &&
                              users.map((user) => (
                                   <Tooltip key={user.id ?? user.name} title={user.name} placement="top">
                                        {user.imageUrl ? (
                                             <Avatar
                                                  key={`av-${user.id ?? user.name}-img`}
                                                  src={buildApiUrl(user.imageUrl)}
                                             />
                                        ) : (
                                             <Avatar
                                                  key={`av-${user.id ?? user.name}-txt`}
                                                  style={{
                                                       backgroundColor: getColorById(user.id), // Fonksiyonun döndürdüğü değer
                                                  }}
                                             >
                                                  {user.name.charAt(0).toUpperCase()}
                                             </Avatar>
                                        )}
                                   </Tooltip>
                                   ////
                              ))}
                    </Avatar.Group>
               ),
          },
     ];
     return (
          <div style={{ height: "350px" }}>
               <PageHeader>Ekip</PageHeader>
               <Table
                    size="small"
                    dataSource={dataSource}
                    pagination={{
                         pageSize: 4,
                    }}
                    columns={columns}
               ></Table>
          </div>
     );
};

export default TeamList;
