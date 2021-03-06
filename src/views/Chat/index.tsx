import { toJS } from 'mobx';

import { observer, useLocalStore } from 'mobx-react';
import React, { useEffect, useState, FunctionComponent } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import styled from 'styled-components';
import Header from '../../components/Header';
import Message from '../../components/Message';
import { withSocketContext } from '../../shared/SocketProvider';
import Chatbar from './components/Chatbar';

import { IS_PROD, MAX_MESSAGES } from '../../shared/constants';
import { sendMainMessage } from '../../shared/utils';
import { useStore } from '../../store';
import TodoList from './components/TodoList';

interface ChatProps {
  socket: SocketIOClient.Socket;
}

const ChatView: FunctionComponent<ChatProps> = (props) => {
  const store = useStore();
  const [containerIsHidden, setContainerIsHidden] = useState(false);

  const chatState = useLocalStore(() => ({
    textMessage: '',
    selectionIsChecked: false,
    messagesToShow: MAX_MESSAGES,
    get hideMoreButton() {
      return (
        chatState.messagesToShow >= store.messages.length ||
        chatState.filteredMessages.length >= store.messages.length
      );
    },
    get filteredMessages() {
      return [...store.messages].slice(-chatState.messagesToShow);
    },
  }));

  const sendMessage = (e = null) => {
    if (e) {
      e.preventDefault();
    }
    if (store.roomName) {
      let data = {
        text: chatState.textMessage,
        date: new Date(),
      };

      if (store.selectionCount > 0) {
        if (chatState.selectionIsChecked) {
          data = {
            ...data,
            ...{
              selection: store.selection,
            },
          };
        }
      }

      if (!chatState.textMessage && !chatState.selectionIsChecked) {
        store.addNotification(
          'Please enter a text or select something',
          'error'
        );
      } else {
        const message = store.encryptor.encrypt(JSON.stringify(data));

        props.socket.emit('chat message', {
          roomName: store.roomName,
          message,
        });

        store.addMessage(message);

        chatState.textMessage = '';
        chatState.selectionIsChecked = false;
      }
    }
  };

  // All messages from main
  onmessage = (message) => {
    const pmessage = message.data.pluginMessage;

    if (pmessage) {
      // set selection
      if (pmessage.type === 'selection') {
        const hasSelection =
          pmessage.payload?.length > 0 || pmessage.payload?.nodes?.length > 0;

        store.selection = hasSelection ? pmessage.payload : {};

        if (!hasSelection) {
          chatState.selectionIsChecked = false;
        }
      }

      if (pmessage.type === 'root-data') {
        const {
          roomName: dataRoomName = '',
          secret: dataSecret = '',
          history: messages = [],
          selection = {
            page: '',
            nodes: [],
          },
          settings = {},
          instanceId = '',
        } = {
          ...pmessage.payload,
          ...(!IS_PROD
            ? {
                secret: 'thisismysecretkey',
                roomName: 'dev',
              }
            : {}),
        };

        store.secret = dataSecret;
        store.roomName = dataRoomName;
        store.messages = messages;
        store.instanceId = instanceId;
        store.selection = selection;

        store.persistSettings(settings, props.socket, true);
      }

      if (pmessage.type === 'relaunch-message') {
        chatState.selectionIsChecked = true;

        store.selection = pmessage.payload.selection || {};

        if (store.selectionCount) {
          sendMessage();
          sendMainMessage('notify', 'Selection sent successfully');
        }
      }
    }
  };

  useEffect(() => {
    store.scrollToBottom();
  }, [store.messages]);

  const showMore = () => {
    if (
      chatState.filteredMessages.length + MAX_MESSAGES >=
      store.messages.length
    ) {
      chatState.messagesToShow = store.messages.length;
    } else {
      chatState.messagesToShow += MAX_MESSAGES;
    }
  };

  return (
    <>
      <Header />
      {!store.settings.name ? (
        <TodoList />
      ) : (
        <Chat hasSelection={store.selectionCount > 0}>
          <Messages
            onAnimationEnd={() => setContainerIsHidden(!containerIsHidden)}
            ref={store.messagesRef}
            isBottom={store.disableAutoScroll}
            onWheel={() => {
              const { current } = toJS(store.messagesRef);
              if (current.scrollTop <= current.scrollHeight * 0.2) {
                showMore();
              }
              store.disableAutoScroll =
                current.scrollHeight -
                  (current.scrollTop + current.clientHeight) >
                0;
            }}
          >
            <TransitionGroup>
              {chatState.filteredMessages.map((m, i) => (
                <CSSTransition
                  key={m.message.date}
                  timeout={400}
                  classNames={`message-${
                    m.id === store.instanceId ? 'self' : 'other'
                  }`}
                >
                  <>
                    <Message data={m} instanceId={store.instanceId} />
                    {(i + 1) % MAX_MESSAGES === 0 &&
                    i + 1 !== chatState.filteredMessages.length ? (
                      <MessageSeperator>
                        <span>older messages</span>
                      </MessageSeperator>
                    ) : (
                      ''
                    )}
                  </>
                </CSSTransition>
              ))}
            </TransitionGroup>
          </Messages>

          <Chatbar
            sendMessage={sendMessage}
            setTextMessage={(text) => (chatState.textMessage = text)}
            textMessage={chatState.textMessage}
            setSelectionIsChecked={(isChecked) =>
              (chatState.selectionIsChecked = isChecked)
            }
            selectionIsChecked={chatState.selectionIsChecked}
          />
        </Chat>
      )}
    </>
  );
};

const MessageSeperator = styled.div`
  border-width: 1px 0 0 0;
  border-color: ${(p) => p.theme.secondaryBackgroundColor};
  border-style: solid;
  margin: 5px 0 17px;
  text-align: center;
  position: relative;
  span {
    position: absolute;
    top: -8px;
    left: 50%;
    color: ${(p) => p.theme.secondaryBackgroundColor};
    background-color: ${(p) => p.theme.backgroundColor};
    padding: 0 14px;
    transform: translateX(-50%);
    font-size: 10px;
    text-transform: uppercase;
  }
`;

const Chat = styled.div`
  display: grid;
  grid-template-rows: 397px 55px;
`;

const Messages = styled.div`
  padding: 14px 14px 0;
  overflow-x: hidden;
  overflow-y: auto;
  display: grid;
  &::after {
    content: '';
    transition: opacity 0.3s;
    opacity: ${(p) => (p.isBottom ? 1 : 0)};
    position: fixed;
    bottom: 41px;
    left: 14px;
    right: 14px;
    background: transparent;
    height: 14px;
    pointer-events: none;
    box-shadow: 0 3px 10px 14px ${(p) => p.theme.backgroundColor};
    border-radius: 40px;
  }
  > div {
    align-self: end;
    > div {
      width: 100%;
      &:last-child {
        .message {
          margin-bottom: 14px;
        }
      }
    }
  }
  .message {
    &-self {
      &-enter {
        opacity: 0;
        transform: translateX(60px);
      }
      &-enter-active {
        opacity: 1;
        transition: opacity 200ms ease-in, transform 200ms ease-in;
        transform: translateX(0px);
      }
      &-exit {
        opacity: 1;
        transform: translateX(0px);
      }
      &-exit-active {
        opacity: 0;
        transition: opacity 200ms ease-in, transform 200ms ease-in;
        transform: translateX(60px);
      }
    }
    &-other {
      &-enter {
        opacity: 0;
        transform: translateX(-60px);
      }
      &-enter-active {
        opacity: 1;
        transition: opacity 200ms ease-in, transform 200ms ease-in;
        transform: translateX(0px);
      }
      &-exit {
        opacity: 1;
        transform: translateX(0px);
      }
      &-exit-active {
        opacity: 0;
        transition: opacity 200ms ease-in, transform 200ms ease-in;
        transform: translateX(-60px);
      }
    }
  }
`;

export default withSocketContext(observer(ChatView));
