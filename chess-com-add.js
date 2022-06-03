var chessIntId = 0;
chessIntId = setInterval(function () {
    if (chesscom_translations && chesscom_translations.moves) {
        localStorage.setItem('chesscom_moves', JSON.stringify(chesscom_translations.moves));
        clearInterval(chessIntId);
    }
}, 100);
