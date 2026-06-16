import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux"; // ✅ useDispatch eklendi
import NoBoardFounds from "../BoardNotFound/BoardNotFound";
import BoardListCard from "./BoardListCard/BoardListCard";
import AppLayout from "../../AppLayout/AppLayout";
import { Table } from "./BoardList.style";
import { getAllBoards } from "../../../../Api/ScrumBoardApi";
import { Spin } from "antd";

// ✅ YENİ: DeepLink Slice importu (Dosya konumuna göre 4 üst klasöre çıkıyoruz)
import { selectDeepLink, clearDeepLink } from "../../../../redux/deepLink/deepLinkSlice";

function BoardLists({ deleteBoardWatcher, history, match }) {
  const [apiProgress, setApiProgress] = useState(false);
  const [boards, setBoards] = useState(null);
  const [filterBoards, setFilterBoards] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // ✅ YENİ: Redux Hooks
  const dispatch = useDispatch();
  const deepLink = useSelector(selectDeepLink);

  const searchText = useSelector(
    (state) => state.scrumBoard.filterBoardsearchText
  );
  const searchBoardCategory = useSelector(
    (state) => state.scrumBoard.filterBoardCategory
  );

  // ✅ ADIM 10: DeepLink Kontrolü (Scrum İçin)
  useEffect(() => {
    // notificationRouting.js dosyasında 'scrum-board' demiştik
    if (deepLink?.route === 'scrum-board' && deepLink?.deepLinkId) {
        // autolist başlığı ile gelenler AppLayout'taki otomatik listelemeye düşer
        if (String(deepLink.deepLinkId).startsWith('autolist')) {
            return;
        }

        const targetId = deepLink.deepLinkId;

        // Redux'ı temizle ki döngüye girmesin
        dispatch(clearDeepLink());

        // Direkt panonun içine yönlendir
        history.push(`/dashboard/scrum-board/board/${targetId}`);
    }
  }, [deepLink, dispatch, history]);
  // -----------------------------------------------------------

  useEffect(() => {
    if (boards) {
      const filteredBoards = boards.filter((board) => {
        if (searchBoardCategory.length > 0 && board.category) {
          if (searchText.length > 0) {
            return (
              searchBoardCategory.includes(board.category.id) &&
              board.name.toLowerCase().includes(searchText.toLowerCase())
            );
          } else {
            return searchBoardCategory.includes(board.category.id);
          }
        }
        if (searchText.length > 0) {
          return board.name.toLowerCase().includes(searchText.toLowerCase());
        }
        return true;
      });

      setFilterBoards(filteredBoards);
    }
  }, [searchText, searchBoardCategory]);

  useEffect(() => {
    const loadBoards = async () => {
      if (isMountedRef.current) {
        setApiProgress(true);
      }
      try {
        const response = await getAllBoards();
        if (isMountedRef.current) {
          setBoards(response.data.data);
        }
      } catch (error) {
        console.error("Veri yüklenirken hata oluştu:", error);
      } finally {
        if (isMountedRef.current) {
          setApiProgress(false);
        }
      }
    };
    loadBoards();
  }, []);

  const handleEdit = (board) => {
    history.push(`/dashboard/scrum-board/edit/${board.id}`);
  };

  return (
    <AppLayout history={history} match={match}>
      {apiProgress ? (
        <Spin />
      ) : (
        <>
          {boards ? (
            <Table>
              {filterBoards === null
                ? boards.map((board) => (
                    <BoardListCard
                      key={board.id}
                      item={board}
                      onDelete={() => deleteBoardWatcher(board.id)}
                      onEdit={() => handleEdit(board)}
                    />
                  ))
                : filterBoards.map((board) => (
                    <BoardListCard
                      key={board.id}
                      item={board}
                      onDelete={() => deleteBoardWatcher(board.id)}
                      onEdit={() => handleEdit(board)}
                    />
                  ))}
            </Table>
          ) : (
            <NoBoardFounds history={history} match={match} />
          )}
        </>
      )}
    </AppLayout>
  );
}

export default BoardLists;