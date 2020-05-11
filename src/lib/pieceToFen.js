// A CommonJS module so that it can be executed from an NPM script
module.exports = piece => {
    let letter = '';
    switch (piece.type) {
        default: {
            letter = piece.type.substring(0, 1);
            break;
        }
        case 'knight': {
            letter = 'n';
            break;
        }
    }

    switch (piece.player) {
        default: {
            return letter;
        }
        case 0: {
            return letter.toUpperCase();
        }
    }
};
