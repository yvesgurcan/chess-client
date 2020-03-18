export const ONE_SECOND = 1000;

export const BOARD_SIDE_SIZE = 7;

export const PLAYER1 = 0;
export const PLAYER2 = 1;

export const PLAYER_COLORS = ['white', 'black'];

export const KING = 'king';
export const QUEEN = 'queen';
export const ROOK = 'rook';
export const KNIGHT = 'knight';
export const BISHOP = 'bishop';
export const PAWN = 'pawn';

export const PIECE_VALUES = {
    [QUEEN]: 9,
    [ROOK]: 5,
    [KNIGHT]: 3,
    [BISHOP]: 3,
    [PAWN]: 1
};

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
