import {
    STOCKFISH_URL,
    STOCKFISH_COMMAND_START_UCI,
    STOCKFISH_RESULT_START_UCI_OK,
    STOCKFISH_COMMAND_IS_READY,
    STOCKFISH_COMMAND_GO,
    STOCKFISH_RESULT_ALIVE,
    STOCKFISH_DEFAULT_DEPTH,
    STOCKFISH_MIN_DEPTH,
    STOCKFISH_MAX_DEPTH,
    STOCKFISH_EVENT_ENGINE,
    STOCKFISH_EVENT_INIT,
    STOCKFISH_EVENT_READY,
    STOCKFISH_EVENT_UNKNOWN,
    STOCKFISH_EVENT_GET_OPTION,
    STOCKFISH_EVENT_GET_DEPTH,
    STOCKFISH_EVENT_MOVE
} from '../lib/constants';

const DEFAULT_DEBUG_LEVEL = location.hostname === 'localhost' ? 0 : 2;

let instance = null;

/**
 * @class
 * @example
 * const eventHandler = (payload) => console.log(payload);
 * artificialIntelligence.init({ eventHandler });
 */
class ArtificialIntelligence {
    constructor() {
        if (instance) {
            return instance;
        }
    }

    /**
     * Initializes Stockfish-js.
     * @returns {instance}
     */
    init({ eventHandler = () => {}, debugLevel = DEFAULT_DEBUG_LEVEL }) {
        this.debugLevel = debugLevel;
        this.eventHandler = eventHandler;
        this.worker = new Worker(STOCKFISH_URL);
        this.worker.onmessage = ({ data }) => this.onMessage(data);
        this.sendRawCommand(STOCKFISH_COMMAND_START_UCI);
        this.sendRawCommand(STOCKFISH_COMMAND_IS_READY);
        this.depth = STOCKFISH_DEFAULT_DEPTH;
        this.options = [];
        instance = this;
        return instance;
    }

    /**
     * Using this method before playing is required to support more than one game.
     * @returns {undefined}
     */
    startGame() {
        this.sendRawCommand('ucinewgame');
        this.sendRawCommand(STOCKFISH_COMMAND_IS_READY);
    }

    /**
     * Sends a command to Stockfish-js.
     * @param {string} command
     * @returns {undefined}
     */
    sendRawCommand(command) {
        this.worker.postMessage(command);
    }

    /**
     * Returns whether this event should be emitted or not.
     * @param {object} message
     * @returns {boolean}
     */
    static isIgnoredMessage(message) {
        if (message.firstWord === 'Stockfish') {
            return true;
        }

        // ignore the option to write a log file for now
        if (message.name === 'Debug Log File') {
            return true;
        }

        // multi-threading is not supported for web workers
        if (message.name === 'Threads') {
            return true;
        }

        // hash table size can not be changed
        if (message.name === 'Hash') {
            return true;
        }

        // no need to let users clear hash table
        if (message.name === 'Clear Hash') {
            return true;
        }

        // available node time is not relevant to production
        // https://chess.stackexchange.com/questions/23155/how-to-use-nodestime-option-in-stockfish-10
        if (message.name === 'nodestime') {
            return true;
        }

        // move overhead is for laggy connection but since we're doing this in the client we shouldn't need this
        // http://www.talkchess.com/forum3/viewtopic.php?t=71355
        if (message.name === 'Move Overhead') {
            return true;
        }

        return false;
    }

    /**
     * Parses UCI output into an event.
     * @param {string} message
     * @returns {object}
     */
    static responseParser(message) {
        const [commandKey1, commandKey2, ...parameters] = message.split(' ');

        // engine info
        if (commandKey1 === 'id') {
            return {
                event: STOCKFISH_EVENT_ENGINE,
                [commandKey2]: parameters.join(' '),
                debugLevel: 0
            };
        }

        // init option info
        if (commandKey1 === 'option' && commandKey2 === 'name') {
            let name = '';
            let count = 0;
            let parameter = parameters[count];
            while (parameter !== 'type') {
                name += parameter + ' ';
                count++;
                parameter = parameters[count];
            }

            // remove extra space
            name = name.substring(0, name.length - 1);

            const optionConfig = parameters.slice(count + 1, parameters.length);
            const [type, ...optionConfigParameters] = optionConfig;

            let value = null;
            let range = {};
            let select = [];
            if (optionConfigParameters.length) {
                const stringValue = optionConfigParameters[1];
                switch (type) {
                    default: {
                        break;
                    }
                    case 'string': {
                        value = stringValue;
                        break;
                    }
                    case 'check': {
                        value = Boolean(stringValue);
                        break;
                    }
                    case 'spin': {
                        value = Number(stringValue);
                        break;
                    }
                    case 'combo': {
                        value = stringValue;
                        break;
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

                if (type === 'combo') {
                    const [_, __, ...selectParameters] = optionConfigParameters;

                    let count = 0;
                    let parameter = selectParameters[count];
                    while (parameter === 'var') {
                        select.push(selectParameters[count + 1]);
                        count += 2;
                        parameter = selectParameters[count];
                    }
                }
            }

            return {
                event: STOCKFISH_EVENT_GET_OPTION,
                name,
                type,
                ...(value !== null && { value }),
                ...range,
                ...(select.length > 0 && { select }),
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
            firstWord: commandKey1,
            message,
            debugLevel: 10
        };
    }

    sortOptions(options) {
        return [
            {
                name: 'Depth',
                value: this.depth,
                type: 'spin',
                min: STOCKFISH_MIN_DEPTH,
                max: STOCKFISH_MAX_DEPTH
            },
            ...options
        ].sort((optionA, optionB) => {
            if (optionA.name === 'Skill Level') {
                return -1;
            }

            if (optionB.name === 'Skill Level') {
                return 1;
            }

            if (optionA.type !== 'button' && optionB.type === 'button') {
                return -1;
            }
            if (optionA.type === 'button' && optionB.type !== 'button') {
                return 1;
            }

            if (optionA.type !== 'check' && optionB.type === 'check') {
                return -1;
            }
            if (optionA.type === 'check' && optionB.type !== 'check') {
                return 1;
            }

            return 0;
        });
    }

    /**
     * Handles messages sent by Stockfish-js.
     * @param {string} message
     * @returns {undefined}
     */
    onMessage(message) {
        switch (message) {
            default: {
                if (!message) {
                    return;
                }

                const parsedMessage = ArtificialIntelligence.responseParser(
                    message
                );
                const ignoreMessage = ArtificialIntelligence.isIgnoredMessage(
                    parsedMessage
                );

                if (ignoreMessage) {
                    return;
                }

                if (parsedMessage.event === STOCKFISH_EVENT_GET_OPTION) {
                    const { event, ...option } = parsedMessage;
                    this.options = [...this.options, { ...option }];

                    if (option.name === 'Skill Level') {
                        let updatedOption = { ...option };
                        const middle = Math.ceil(
                            (updatedOption.max - updatedOption.min) / 2
                        );
                        updatedOption.value = middle;
                        this.setOption(updatedOption);
                    }

                    if (option.name === 'Ponder') {
                        let updatedOption = { ...option };
                        updatedOption.value = false;
                        this.setOption(updatedOption);
                    }
                }

                this.emitEvent(parsedMessage);

                return;
            }
            case STOCKFISH_RESULT_START_UCI_OK: {
                this.options = this.sortOptions(this.options);
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

    /**
     * Sends payloads to the event handler.
     * @returns {undefined}
     */
    emitEvent({ debugLevel, ...payload }) {
        if (Number(debugLevel || 0) >= this.debugLevel) {
            if (payload.event === STOCKFISH_EVENT_UNKNOWN) {
                console.error(payload);
            } else {
                console.log(payload);
            }
        }
        this.eventHandler(payload);
    }

    /**
     * Asks to Stockfish-js to compute the best response to this move.
     * @param {string} move
     * @param {string | undefined} fenstring
     * @returns {undefined}
     */
    computeNextMove(move, fenstring) {
        let command = '';
        if (fenstring) {
            command = `position fen ${fenstring}`;
        } else {
            command = `position startpos moves ${move}`;
        }
        this.sendRawCommand(command);
        this.sendRawCommand(`go depth ${this.depth}`);
    }

    getOption(name) {
        return this.options.find(option => option.name === name);
    }

    /**
     * Changes an option of the chess engine.
     */
    setOption({ name, value }) {
        let updated = false;
        if (name === 'Depth') {
            this.depth = value;
            updated = true;
        } else {
            const option = this.getOption(name);
            if (option.value !== value) {
                const command = `setoption name ${name} value ${String(value)}`;
                this.sendRawCommand(command);
                this.sendRawCommand(STOCKFISH_COMMAND_GO);
                updated = true;
            }
            console.log(option);
        }

        if (updated) {
            for (let i = 0; i < this.options.length; i++) {
                let updatedOption = this.options[i];
                if (updatedOption.name === name) {
                    updatedOption.value = value;
                    this.options[i] = updatedOption;
                    break;
                }
            }
        }
    }
}

export default new ArtificialIntelligence();
