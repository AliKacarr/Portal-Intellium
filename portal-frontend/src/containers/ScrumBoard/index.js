import React from "react";
import { Switch, Route, useRouteMatch } from "react-router-dom";

import Board from "./Board/Board";
import ModalRoot from "./rootModal";
import DrawerRoot from "./rootDrawer";
import BoardLists from "./Board/BoardList/BoardList";
import CreateBoard from "./Board/BoardCreateOrUpdate/BoardCreate";
import UpdateBoard from "./Board/BoardCreateOrUpdate/BoardUpdate";

export default function ScrumBoard() {
  const match = useRouteMatch();
  return (
    <>
      <Switch>
        <Route exact path={`${match.path}`} component={BoardLists} />
        <Route exact path={`${match.path}/new`} component={CreateBoard} />
        <Route
          exact
          path={`${match.path}/edit/:boardId`}
          component={UpdateBoard}
        />
        <Route path={`${match.path}/board/:id`} component={Board} />
      </Switch>
      <ModalRoot />
      <DrawerRoot />
    </>
  );
}
