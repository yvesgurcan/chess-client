import React, { Component } from 'react';
import styled from 'styled-components';

export default class Home extends Component {
    render() {
        return <Heading>Bonjour, monde.</Heading>;
    }
}

const Heading = styled.h1``;
