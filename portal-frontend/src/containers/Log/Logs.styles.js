import styled from 'styled-components';
import WithDirection from '@iso/lib/helpers/rtl';
import BoxComponent from '@iso/components/utility/box';

const BoxWrapper = styled(BoxComponent)`
  .isoProjectTableBtn {
    display: flex;
    margin-bottom: 30px;
    a {
      margin-left: auto;
    }
  }
`;

const Box = WithDirection(BoxWrapper);
export { Box };