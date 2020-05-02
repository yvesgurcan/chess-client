import styled from 'styled-components';

export default styled.div`
    width: 240px;
    position: absolute;
    margin-top: -10px;
    padding: 10px;
    background: ${props => props.theme.background2};
    opacity: 0.95;
    color: ${props => props.theme.color2};
    border: 1px solid black;
    z-index: 1;
`;
