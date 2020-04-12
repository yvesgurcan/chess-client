import {
    STOCKFISH_URL,
    STOCKFISH_COMMAND_START_UCI,
    STOCKFISH_RESULT_START_UCI_OK,
    STOCKFISH_COMMAND_IS_READY,
    STOCKFISH_RESULT_ALIVE,
    STOCKFISH_EVENT_INIT,
    STOCKFISH_EVENT_READY,
    STOCKFISH_EVENT_UNKNOWN,
    STOCKFISH_EVENT_GET_OPTION,
    STOCKFISH_EVENT_GET_DEPTH,
    STOCKFISH_EVENT_MOVE
} from '../lib/constants';

const DEFAULT_DEBUG_LEVEL = 0; //location.hostname === 'localhost' ? 0 : 2;

let instance = null;

class ArtificialIntelligence {
    constructor() {
        if (instance) {
            return instance;
        }
    }

    init({ eventHandler = () => {}, debugLevel = DEFAULT_DEBUG_LEVEL }) {
        this.debugLevel = debugLevel;
        this.eventHandler = eventHandler;
        this.worker = new Worker(STOCKFISH_URL);
        this.worker.onmessage = ({ data }) => this.onMessage(data);
        this.sendRawCommand(STOCKFISH_COMMAND_START_UCI);
    }

    newGame() {
        this.sendRawCommand('ucinewgame');
    }

    onMessage(message) {
        switch (message) {
            default: {
                if (!message) {
                    return;
                }

                const parsedMessage = this.responseParser(message);
                if (
                    parsedMessage.commandKey1 === 'id' ||
                    parsedMessage.commandKey1 === 'Stockfish'
                ) {
                    // no need to return data about the library
                    return;
                }

                this.emitEvent(parsedMessage);

                // return;
                break;
            }
            case STOCKFISH_RESULT_START_UCI_OK: {
                this.emitEvent({ event: STOCKFISH_EVENT_INIT, debugLevel: 1 });
                return;
            }
            case STOCKFISH_RESULT_ALIVE: {
                this.emitEvent({ event: STOCKFISH_EVENT_READY, debugLevel: 1 });
                return;
            }
        }

        /*
            if (match[1] === 'cp') {
            else if (match[1] === 'mate') {
            (message.match(/\b(upper|lower)bound\b/))
        */
    }

    emitEvent(payload) {
        if (Number(payload.debugLevel || 0) >= this.debugLevel) {
            console.log(payload);
        }
        this.eventHandler(payload);
    }

    sendRawCommand(command) {
        this.worker.postMessage(command);
    }

    computeResponse(move) {
        this.sendRawCommand(`position startpos moves ${move}`);
        this.sendRawCommand(`go depth 15`);
    }

    responseParser(message) {
        const [commandKey1, commandKey2, ...parameters] = message.split(' ');

        // init option info
        if (commandKey1 === 'option' && commandKey2 === 'name') {
            let option = '';
            let count = 0;
            let parameter = parameters[count];
            while (parameter !== 'type') {
                option += parameter;
                count++;
                parameter = parameters[count];
            }

            const optionConfig = parameters.slice(count + 1, parameters.length);
            const [type, ...optionConfigParameters] = optionConfig;

            let defaultValue = '';
            let range = {};
            if (optionConfigParameters.length) {
                const stringDefaultValue = null;
                switch (type) {
                    default: {
                        break;
                    }
                    case 'string': {
                        defaultValue = stringDefaultValue;
                        break;
                    }
                    case 'check': {
                        defaultValue = Boolean(stringDefaultValue);
                        break;
                    }
                    case 'spin': {
                        defaultValue = Number(stringDefaultValue);
                    }
                }
                const rangeParameters = optionConfigParameters.slice(
                    2,
                    optionConfigParameters.length
                );

                if (type === 'spin') {
                    range = {
                        min: Number(rangeParameters[1]),
                        max: Number(rangeParameters[3])
                    };
                }
            }

            return {
                event: STOCKFISH_EVENT_GET_OPTION,
                option,
                type,
                ...{ default: defaultValue },
                ...range,
                debugLevel: 0
            };
        }

        // best move analysis
        if (commandKey1 === 'info' && commandKey2 === 'depth') {
            const [depth, ...analysis] = parameters;
            return {
                event: STOCKFISH_EVENT_GET_DEPTH,
                depth: Number(depth),
                analysis,
                debugLevel: 0
            };
        }

        // best move results
        if (commandKey1 === 'bestmove') {
            return {
                event: STOCKFISH_EVENT_MOVE,
                move: commandKey2,
                debugLevel: 1
            };
        }

        // unknown
        return {
            event: STOCKFISH_EVENT_UNKNOWN,
            commandKey1,
            message,
            debugLevel: 1
        };
    }
}

class MockApp {
    constructor() {
        const artificialIntelligence = new ArtificialIntelligence();
        this.artificialIntelligence = artificialIntelligence;
        this.artificialIntelligence.init({
            eventHandler: this.eventHandler
        });
    }

    eventHandler = payload => {
        switch (payload.event) {
            default: {
                break;
            }
            case STOCKFISH_EVENT_INIT: {
                console.log('Playing first move.');
                this.artificialIntelligence.computeResponse(`e2e4`);
                break;
            }
            case STOCKFISH_EVENT_MOVE: {
                console.log('Received move:', payload.move);
                break;
            }
        }
    };
}

// const mockApp = new MockApp();

export default new ArtificialIntelligence();
