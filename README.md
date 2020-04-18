♞ JavaScript mobile-first chess client.

-   [Play](https://chess.yvesgurcan.com)
-   [Documentation](https://chess.yvesgurcan.com/doc)
-   [Changelog](./CHANGELOG.md)

## How does it work?

-   The game state and the game view are separated.
-   The view re-renders as the state changes.
-   Projections are used to validate whether a move is legal or not.
-   Vectors are used to translate the position of the pieces.

## Artificial Intelligence

Uses [Stockfish-js](https://github.com/niklasf/stockfish.js/), a JavaScript version of [Stockfish](https://github.com/official-stockfish/Stockfish) compiled with WebAssembly. Stockfish-js takes the form of a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers).

Stockfish relies on the [universal chess interface (UCI) protocol](http://wbec-ridderkerk.nl/html/UCIProtocol.html).

Computer Chess wiki: http://computer-chess.org/doku.php

## Contribute

### Setup

You know the drill. `npm i` and all that :)
