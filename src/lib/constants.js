/* Debug */

export const DEBUG = location.hostname === 'localhost';
export const DEBUG_BACKEND = DEBUG && true;
export const STOCKFISH_DEFAULT_DEBUG_LEVEL = DEBUG ? 0 : 2;

/* Services */

export const WEB_SOCKET_SERVER_URL = DEBUG
    ? 'ws://localhost:3000'
    : 'wss://chess-socket.herokuapp.com';

export const CHESS_API = DEBUG_BACKEND
    ? 'http://localhost:9000'
    : 'https://chess-functions.netlify.app/.netlify/functions';

/* Game State */

export const PLAYER1 = 0;
export const PLAYER2 = 1;

export const PLAYER_COLORS = ['white', 'black'];
export const FEN_ACTIVE_COLORS = ['w', 'b'];

export const HUMAN_PLAYER = 'Human';
export const AI_PLAYER = 'AI';

export const YOU = 'You';

export const KING = 'king';
export const QUEEN = 'queen';
export const ROOK = 'rook';
export const KNIGHT = 'knight';
export const BISHOP = 'bishop';
export const PAWN = 'pawn';

export const KING_AREA = 9;

export const KNIGHT_MOVE_DIMENSION1 = 2;
export const KNIGHT_MOVE_DIMENSION2 = 1;

export const LATERAL_BACK_ROW_PIECES = [ROOK, KNIGHT, BISHOP];
export const LEFT_BACK_ROW_PIECES = [...LATERAL_BACK_ROW_PIECES, QUEEN];
export const RIGHT_BACK_ROW_PIECES = [
    KING,
    ...LATERAL_BACK_ROW_PIECES.reverse()
];

export const ONGOING = 'ongoing';
export const DRAW = 'draw';
export const CHECKMATE = 'checkmate';

export const KINGSIDE = 'kingside';
export const QUEENSIDE = 'queenside';

export const ONE_SECOND = 1000;

export const BOARD_SIDE_SIZE = 7;

/* Stockfish */

export const STOCKFISH_URL = 'stockfish.js';
export const STOCKFISH_COMMAND_START_UCI = 'uci';
export const STOCKFISH_RESULT_START_UCI_OK = 'uciok';

export const STOCKFISH_COMMAND_IS_READY = 'isready';
export const STOCKFISH_RESULT_ALIVE = 'readyok';

export const STOCKFISH_COMMAND_GO = 'go';

export const STOCKFISH_DEFAULT_DEPTH = 14;
export const STOCKFISH_MIN_DEPTH = 1;
export const STOCKFISH_MAX_DEPTH = 50;

export const STOCKFISH_EVENT_ENGINE = 'STOCKFISH_ENGINE';
export const STOCKFISH_EVENT_INIT = 'STOCKFISH_INIT';
export const STOCKFISH_EVENT_READY = 'STOCKFISH_READY';
export const STOCKFISH_EVENT_UNKNOWN = 'STOCKFISH_UNKNOWN';
export const STOCKFISH_EVENT_GET_OPTION = 'STOCKFISH_GET_OPTION';
export const STOCKFISH_EVENT_GET_DEPTH = 'STOCKFISH_GET_DEPTH';
export const STOCKFISH_EVENT_MOVE = 'STOCKFISH_MOVE';

/* Websocket */

export const MAX_SOCKET_CONNECTION_RETRIES = 3;
export const WEBSOCKET_EVENT_JOIN = 'WEBSOCKET_EVENT_JOIN';
export const WEBSOCKET_EVENT_DISCONNECTED = 'WEBSOCKET_EVENT_DISCONNECTED';
export const WEBSOCKET_EVENT_SELECT = 'WEBSOCKET_EVENT_SELECT';
export const WEBSOCKET_EVENT_SET_OPTION = 'WEBSOCKET_EVENT_SET_OPTION';
export const WEBSOCKET_EVENT_SET_ARTIFICIAL_INTELLIGENCE_OPTION =
    'WEBSOCKET_EVENT_SET_ARTIFICIAL_INTELLIGENCE_OPTION';
