import React, { FunctionComponent } from 'react';
import { Redirect, useHistory, Link } from 'react-router-dom';
import styled from 'styled-components';
import { state, view } from '../shared/state';
import Header from '../components/header';

const MinimizedView: FunctionComponent = () => {
  const { push } = useHistory();

  return (
    <>
      <Header
        title={
          <div
            style={{
              color: state.settings.color || '#000'
            }}
          >
            {state.settings.name}
          </div>
        }
        left={
          <div onClick={state.toggleMinimizeChat}>
            <div className="icon icon--plus" />
          </div>
        }
      />
      <Minimized>
        {!state.isMinimized && <Redirect to="/" />}

        <Users>
          {state.online.map(user => (
            <User key={user.id} className="user" color={user.color || '#000'}>
              {user.name.substr(0, 2)}
            </User>
          ))}
        </Users>
      </Minimized>
    </>
  );
};

const Minimized = styled.div`
  display: grid;
  text-align: center;
  min-height: calc(100vh - 33px);
  max-width: 100vw;
  font-size: 14px;
  div {
    align-self: center;
  }
  button {
    cursor: pointer;
  }
`;

const Users = styled.div`
  overflow-y: auto;
  display: grid;
  grid-gap: 10px;
  grid-template-columns: repeat(3, 1fr);
  padding: 10px;
`;

const User = styled.div`
  width: 40px;
  height: 40px;
  padding: 11px 0;
  align-items: center;
  text-align: center;
  border-radius: 100%;
  color: #fff;
  background-color: ${props => props.color};
`;

export default view(MinimizedView);
