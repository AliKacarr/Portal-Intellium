import styled from 'styled-components';
import { palette } from 'styled-theme';
import WithDirection from '@iso/lib/helpers/rtl';
import BoxComponent from '@iso/components/utility/box';

const ProjectPageWrapper= styled.div`
    
.ProjectTableBtn {
    
    display: flex;
    justify-content: ${(props) => (props['data-rtl'] === 'rtl' ? 'flex-start' : 'flex-end')};
    align-items: ${(props) => (props['data-rtl'] === 'rtl' ? 'flex-start' : 'flex-end')};
    margin-top: 15px;

    .ProjectEditAddBtn {
      background: ${palette('blue', 14)};
      color: #fff;
    }
  }



`
const BoxWrapper = styled(BoxComponent)`
  .isoProjectTableBtn {
    display: flex;
    margin-bottom: 30px;
    a {
      margin-left: auto;
    }
  }
`;

const CardWrapper = styled.div`
  width: auto;
  overflow: inherit;
  position: relative;
  .isoProjectTable {
    table {
      tbody {
        tr {
          td {
            .isoProjectBtnView {
              display: flex;
              flex-direction: row;
              > a {
                margin: ${props =>
                  props['data-rtl'] === 'rtl' ? '0 0 0 15px' : '0 15px 0 0'};
              }
            }
          }
          &:hover {
            .isoProjectBtnView {
              ${'' /* opacity: 1; */};
            }
          }
        }
      }
    }
  }

  .projectListTable {
    .ant-dropdown-menu-item,
    .ant-dropdown-menu-submenu-title {
      &:hover {
        background-color: ${palette('secondary', 1)};
      }
    }

    .projectViewBtn {
      color: ${palette('text', 3)};

      &:hover {
        color: ${palette('primary', 0)};
      }
    }

    .projectDltBtn {
      font-size: 18px;
      border: 0;
      color: ${palette('error', 0)};

      &:hover {
        border: 0;
        color: ${palette('error', 2)};
      }
    }
  }
`;

const Box = WithDirection(BoxWrapper);
export { Box, ProjectPageWrapper };
export default WithDirection(CardWrapper);
export { CardWrapper };