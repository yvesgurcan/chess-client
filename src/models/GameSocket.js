import {
    WEB_SOCKET_SERVER_URL,
    WEBSOCKET_EVENT_JOIN,
    MAX_SOCKET_CONNECTION_RETRIES
} from '../lib/constants';

/**
 * @class
 * @example const gameSocket = new GameSocket();
 */
export default class GameSocket {
    connectionRetries = 0;
    connectionOpened = false;

    init({ eventHandler } = {}) {
        this.eventHandler = eventHandler;
        const socket = new WebSocket(WEB_SOCKET_SERVER_URL);
        socket.onopen = () => this.onOpen();
        socket.onclose = event => this.onClose(event);
        socket.onmessage = payload => this.onMessage(payload);
        this.socket = socket;
    }

    onOpen() {
        console.info('GameSocket server has opened the connection.');
        this.connectionRetries = 0;
        this.sendMessage({ event: WEBSOCKET_EVENT_JOIN });
    }

    onClose(event) {
        console.log('Connection to GameSocket server is closed.', {
            code: event.code
        });
        switch (event.code) {
            default: {
                return;
            }
            case 1006: {
                setTimeout(() => {
                    if (
                        this.connectionRetries < MAX_SOCKET_CONNECTION_RETRIES
                    ) {
                        console.log('Reconnecting to GameSocket...');
                        this.init({ eventHandler: this.eventHandler });
                        this.connectionRetries += 1;
                        return;
                    }
                }, 1000);
                return;
            }
        }
    }

    onMessage(payload) {
        if (this.eventHandler) {
            const parsedPayload = JSON.parse(payload.data);
            this.eventHandler(parsedPayload);
        }
    }

    sendMessage(payload) {
        const parsedPayload = JSON.stringify({
            gameId: this.gameId,
            playerId: this.playerId,
            ...payload
        });
        this.socket.send(parsedPayload);
    }
}
