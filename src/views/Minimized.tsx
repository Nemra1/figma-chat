// store
import { observer } from 'mobx-react';
import React, { FunctionComponent } from 'react';
import { Redirect } from 'react-router-dom';
import styled from 'styled-components';
import Header from '../components/Header';
import { ConnectionEnum } from '../shared/interfaces';
import { useStore } from '../store';

const MinimizedView: FunctionComponent = () => {
  const store = useStore();

  return (
    <>
      <Header minimized />
      <Minimized>
        {!store.isMinimized && <Redirect to="/" />}
        {store.status === ConnectionEnum.ERROR && (
          <Redirect to="/connection-error" />
        )}
        <Users>
          {store.online.map((user) => (
            <User key={user.id} className="user" color={user.color || '#000'}>
              {user.avatar || user.name.substr(0, 2)}
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
  border-radius: 14px 14px 3px 14px;
  width: 41px;
  height: 41px;
  font-size: 22px;
  text-align: center;
  line-height: 43px;
  color: #fff;
  background-color: ${(props) => props.color};
`;

export default observer(MinimizedView);
