import styled from 'styled-components';
export const ParentContainer = styled.div`
  height: ${({ height }) => height};
  overflow-x: hidden;
  overflow-y: auto;
`;

/* like display:flex but will allow bleeding over the window width */
export const Container = styled.div`
  min-height: 500px;
  min-width: 100%;
  display: inline-flex;
  overflow-x: auto;
`;

export const AddListButton = styled.button`
  width: 120px;
  height: 48px;
  border-radius: 10px;
  border: none;
  background-color: #f8f9fe;
  font-size: 14px;
  color: #788195;
  font-family: 'Roboto';
  font-weight: 500;
  margin: 10px 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:focus,
  &:hover {
    outline: none;
    background-color: #edeff8;
  }
`;
