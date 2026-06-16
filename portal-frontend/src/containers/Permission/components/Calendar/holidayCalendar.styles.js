import styled from 'styled-components';


export const CalendarStyles = styled("div")`
  @media only screen and (max-width: 700px) {
    margin-bottom: 25px;  //* İhtiyaca göre background boşluk ayarlama *//
    .rbc-calendar {
      box-sizing: border-box;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  }

 margin-top: ${props => (props.compact ? '0px' : '29px')}; 
  .rbc-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    font-size: 14px;
  }

  .rbc-btn-group {
    display: flex;
    align-items: center;
  }

  .rbc-btn {
    margin: 0 5px;
  }

  .rbc-toolbar-label {
    flex-grow: 1;
    padding: 2px 1px;
    text-align: center;
  }

  .rbc-toolbar .rbc-toolbar-label {
    flex-grow: 1;
    padding: 1 1px;
    text-align: center;
  }
`;

export const CalendarContainer = styled('div')`
  margin-bottom: 25px; /* İhtiyaca göre background boşluk ayarlama */
`;

