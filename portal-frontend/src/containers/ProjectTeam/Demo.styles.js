import styled from 'styled-components';
import { palette } from 'styled-theme';
import WithDirection from '@iso/lib/helpers/rtl';

const TableDemoStyle = styled.div`
  .ant-tabs-content {
    margin-top: 40px;
  }

  .ant-tabs-nav {
    > div {
      color: ${palette('secondary', 2)};

      &.ant-tabs-ink-bar {
        background-color: ${palette('primary', 0)};
      }

      &.ant-tabs-tab-active {
        color: ${palette('primary', 0)};
      }
    }
  }
`;
const StatusTag = styled.span`
  padding: 0 5px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  background-color: ${palette('primary', 0)};
  font-size: 12px;
  color: #ffffff;
  text-transform: capitalize;

  &.planningphase {
    background-color: ${palette('error', 0)};
  }

  &.inprogress {
    background-color: ${palette('warning', 0)};
  }

  &.done {
    background-color: ${palette('success', 0)};
  }
`;
const Status = WithDirection(StatusTag);
export {Status,TableDemoStyle };