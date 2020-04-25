import React, { FunctionComponent, useEffect } from 'react';
import { store } from 'react-easy-state';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { version, repository } from '../../package.json';
// shared
import { ConnectionEnum } from '../shared/interfaces';
import { withSocketContext } from '../shared/SocketProvider';
import { state, view } from '../shared/state';
import { DEFAULT_SERVER_URL } from '../shared/constants';
// components
import Checkbox from '../components/Checkbox';

interface SettingsProps {
  socket: SocketIOClient.Socket;
  init?: (serverUrl: any) => void;
}

const SettingsView: FunctionComponent<SettingsProps> = (props) => {
  const isConnected = state.status === ConnectionEnum.CONNECTED;

  const history = useHistory();
  const settings = store({
    name: '',
    url: '',
    enableNotificationTooltip: true,
    enableNotificationSound: true,
  });

  useEffect(() => {
    if (state.isMinimized) {
      state.toggleMinimizeChat();
    }
  }, []);

  const saveSettings = () => {
    if (
      state.settings.name !== settings.name ||
      state.settings.enableNotificationTooltip !==
        settings.enableNotificationTooltip ||
      state.settings.enableNotificationSound !==
        settings.enableNotificationSound
    ) {
      state.addNotification('Successfully updated settings', 'success');
    }

    state.persistSettings(settings, props.socket, props.init);

    if (isConnected) {
      history.push('/');
    }
  };

  useEffect(() => {
    settings.name = state.settings.name
    settings.url = state.settings.url;
    settings.enableNotificationTooltip =
      state.settings.enableNotificationTooltip;
    settings.enableNotificationSound = state.settings.enableNotificationSound;
  }, [settings]);

  return (
    <>
      <Settings>
        <div className="fields">
          <h4>Username</h4>
          <input
            type="text"
            value={settings.name}
            onChange={({ target }: any) =>
              (settings.name = target.value.substr(0, 20))
            }
            placeholder="Username ..."
          />
          <br />

          <Checkboxes>
            <Checkbox
              title="Enable tooltips"
              name="notificationTooltipCheckbox"
              checked={settings.enableNotificationTooltip}
              onChange={() =>
                (settings.enableNotificationTooltip = !settings.enableNotificationTooltip)
              }
            />
          </Checkboxes>

          <h4>
            Server URL
            <span onClick={() => (settings.url = DEFAULT_SERVER_URL)}>
              reset
            </span>
          </h4>

          <input
            type="text"
            value={settings.url}
            onChange={({ target }: any) =>
              (settings.url = target.value.substr(0, 255))
            }
            placeholder="Server-URL ..."
          />
        </div>

        <div className="delete-history">
          <button
            type="submit"
            onClick={state.removeAllMessages}
            className="button button--secondary"
          >
            Delete history
          </button>
        </div>

        <div className="save-button">
          <button
            type="submit"
            onClick={saveSettings}
            className="button button--secondary"
          >
            save
          </button>
        </div>

        <VersionNote target="_blank" href={repository.url}>
          version: {version}
        </VersionNote>
      </Settings>
    </>
  );
};

const VersionNote = styled.a`
  margin-top: 10px;
  width: 100%;
  color: #fff;
  text-align: right;
  text-decoration: none;
  font-size: 10px;
  display: block;
  &:hover {
    text-decoration: underline;
  }
`;

const Checkboxes = styled.div`
  margin: 25px 0 25px;
  .checkbox__label {
    margin-bottom: 5px;
    &:before {
      margin: 2px 10px 0 0;
    }
  }
`;

const Settings = styled.div`
  position: relative;
  z-index: 1;
  transform: translateY(-318px);
  padding: 20px;
  color: #fff;

  h4 {
    margin: 20px 0 15px;
    &:first-child {
      margin-top: 0;
    }
  }
  span {
    opacity: 0.8;
    margin: 0 0 0 8px;
    font-size: 10px;
    cursor: pointer;
  }
  input[type='text'] {
    font-size: 11px;
    width: 100%;
    border-width: 0 0 1px 0;
    border-color: #fff;
    border-style: solid;
    background-color: transparent;
    color: #fff;
    padding: 5px 4px;
    outline: none;
  }
  .fields {
    margin-bottom: 20px;
  }

  .save-button,
  .delete-history {
    button {
      width: 100%;
      cursor: pointer;
      background-color: #000;
      color: #fff;
      opacity: 0.9;
      &:hover {
        opacity: 1;
      }
    }
  }
  .delete-history {
    button {
      background-color: rgba(0, 0, 0, 0.3);
      border-color: rgba(0, 0, 0, 0.2);
      margin-bottom: 8px;
    }
  }
`;

export default withSocketContext(view(SettingsView));
