import React from "react";
import clone from "clone";
import TableWrapper from "../Tables/AntTables/AntTables.styles";
import { EditableCell } from "@iso/components/Tables/HelperCells";

export default function (props) {
  const [state, setState] = React.useState({
    columns: createcolumns(clone(props.tableInfo.columns)),
    dataList: props.dataList.getAll(),
  });
  const { columns, dataList } = state;

  function createcolumns(columns) {
    // eslint-disable-next-line no-unused-vars -- editable column hook (table taslak)
    const editColumnRender = (text, record, index) => (
      <EditableCell
        index={index}
        columnsKey={columns[1].key}
        value={text[columns[1].key]}
        onChange={onCellChange}
      />
    );
    return columns;
  }
  function onCellChange(value, columnsKey, index) {
    dataList[index][columnsKey] = value;
    setState({ ...state, dataList });
  }

  return (
    <TableWrapper
      columns={columns}
      dataSource={dataList}
      pagination={{ pageSize: 5 }}
      className="isoEditableTable"
    />
  );
}
