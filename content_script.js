var isLichess = location.host.includes('lichess.org');
var isChessCom = location.host.includes('chess.com');
var is1ChessOrg = location.host.includes('1chess.org');
var isChess24Com = location.host.includes('chess24.com');
var isChessbaseCom = location.host.includes('chessbase.com');

var START_POS = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

var MODEl = {};

var isRequestPending = false;

var chessCom = {
    createWhiteSquare: createSquare,
    createBlackSquare: createSquareBlack,
    getPgn: getStr,
};

var lichess = {
    createWhiteSquare: createLichessSquare,
    createBlackSquare: createLichessSquareBlack,
    getPgn: getLichessPgn,
}

var chessOrg = {
    createWhiteSquare: whiteSquare1ChessOrg,
    createBlackSquare: blackSquare1ChessOrg,
    getPgn: get1ChessPgn
};

var chess24Com = {
    createWhiteSquare: whiteSquareChess24Com,
    createBlackSquare: blackSquareChess24Com,
    getPgn: getChess24ComPgn
};

var chessbaseCom = {
    createWhiteSquare: chessbaseWhiteSquare,
    createBlackSquare: chessbaseBlackSquare,
    getPgn: getChessBasePgn
};

var CHESSCOM_MOVES = '';

var currentSite = '';
var currrentColor = '';

if (isLichess) {
    MODEl = lichess;
    currentSite = 'lichess.com'
} else if (isChessCom) {
    MODEl = chessCom;
    currentSite = 'chess.com';
    initChesscomMovesScript();
} else if (is1ChessOrg) {
    MODEl = chessOrg;
    currentSite = '1chess.org';
} else if (isChess24Com) {
    MODEl = chess24Com;
    currentSite = 'chess24.com';
} else if (isChessbaseCom) {
    MODEl = chessbaseCom;
    currentSite = 'chessbase.com';
}

var FIRST_COLOR = 'red';
var SECOND_COLOR = 'red';
var PONDER_COLOR = 'blue';
var SHOW_PONDER = false;
var SHOW_BORDERS = true;

var CHESS_MASTER_STATUS = 'on';
var LICHESS_SELECTOR = '';
var AUTOSTEP_KEY = 'KeyQ';
var AUTOSTEP_NAME = 'Auto Step';

chrome.storage.sync.get(null, function (items) {

    FIRST_COLOR = items.first || 'red';
    SECOND_COLOR = items.second || 'red';
    PONDER_COLOR = items.ponder || 'blue';
    CHESS_MASTER_STATUS = items.status || 'on';
    SHOW_PONDER = items.ponder_status == 'on' ? true : false;    
    SHOW_BORDERS = (!items.show_borders || items.show_borders == 'on') ? true : false;
    LICHESS_SELECTOR = items.lichessSelector || '';
    AUTOSTEP_KEY = items.autostepKey || 'KeyQ';
    AUTOSTEP_NAME = items.autoStep || 'Auto Step';
})

var variables = null;
function get_scope_variables() {
    if (!variables) {
        var count = 3 + Math.floor(11*Math.random());
        variables = {
            chess_btn_container : makeid(count),
            checkDiv : makeid(count),
            checkmark: makeid(count + 2),
            checkActive: makeid(count),
            autoClick_chess_master : makeid(count),
            chess_bot_btn : makeid(count),
            chess_bot_time : makeid(count),
            ch_checkbox_container : makeid(count),
            radioBtnActive: makeid(count),
            radioClassSelector: makeid(count),
            spanSelector: makeid(count),

            start_div : makeid(count),
            finish_div : makeid(count),
            ponder_start_div : makeid(count),
            ponder_finish_div : makeid(count),
            chess_bot_result: makeid(count),
            chess_corner: makeid(count),
            chess_white: makeid(count),
            chess_black: makeid(count),
            chess_color: makeid(count),
            choose_color: makeid(count),
            chess_dragg_btn: makeid(count),
            chess_error: makeid(count),
            chess_hidden: makeid(count),
            white_value: makeid(count + 2),
            black_value: makeid(count + 2),
        }
    }
    return variables;

}

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }
 

$(document).ready(function () {    
    create_css();
    var o = get_scope_variables();

	var rand = Math.random();
	var elOpen = '<div class="'+o.checkDiv+'">';
	var elClose = '</div>';
	if (rand > 0.5) {
		elOpen = '<span class="'+o.checkDiv+'">';
		elClose = '</span>';
	}
    checkbox = '<div style="position: absolute" id="'+o.autoClick_chess_master+'">'+elOpen+'<span class="'+o.checkmark+'"></span>'+elClose+'<span style="margin-left: 25px">'+AUTOSTEP_NAME+'</span></div>';
    var head = '<div style="padding: 6px 5px; background: #000; color: #FFF; text-align: center; cursor: move;font-size: 14px;" id="'+o.chess_dragg_btn+'">' + checkbox + ' Chеss Master </div>';
    var btn = '<div style="text-align: center; margin-top: 5px; position: relative;"> <button id="'+o.chess_bot_btn+'">Get Move</button> <div style="padding: 1px 0; background: #aad1f2; margin-top: 5px; font-size: 14px; line-height: 1.5; color:#000">&nbsp; <span id="'+o.chess_bot_result+'"></span> <span id="'+o.chess_bot_time+'"></span> </div> </div>';
    var style= 'width:15px; height: 15px; border: 1px solid #000; border-radius: 8px; background: #FFF';
    var whiteClass = o.radioClassSelector + ' ' + o.white_value;
    var blackClass = o.radioClassSelector + ' ' + o.black_value;
    var radio = '<div style="padding: 8px 0 2px 0px; color: #000"><span style="position: absolute; left: 6px; font-size: 14px">Choose your color</span>' +
    '<span><button style="'+style+'" class="'+whiteClass+'">&nbsp;</button><span class="'+o.spanSelector+'">&nbsp;White</span></span> &nbsp;&nbsp; <span><button style="'+style+'" class="'+blackClass+'">&nbsp;</button><span class="'+o.spanSelector+'">&nbsp;Black</span></span></div><div id="'+o.chess_error+'"></div>';
    var div = '<div id="' + o.chess_btn_container + '" class="'+o.chess_hidden+'">' + head + radio + btn + '</div> ';
    setTimeout(function () {
        var o = get_scope_variables()
        if (CHESS_MASTER_STATUS == 'on') {
            $('#'+o.chess_btn_container).removeClass(o.chess_hidden);
            setAutostep();
        } else {
            // remove from dom
            $('#'+o.chess_btn_container).remove();
        }
    }, 500);


    $('body').append(div);
    $(document).on('click', '#'+o.chess_bot_btn, onBtnClick);
    document.addEventListener('keydown', function (event) {
        if (event.code == AUTOSTEP_KEY && CHESS_MASTER_STATUS == "on") {
            onBtnClick();
        }
        ;
    });
    dragElement(document.getElementById(o.chess_btn_container));
    function onBtnClick() {
        var o = get_scope_variables();
        $('#'+o.chess_bot_time).text('');
        

        if (!currrentColor) {
            setError('Choose color');
            return;
        }
        setError('');
        var pgn;
        var fen;
        pgn = MODEl.getPgn();
        $('#'+o.chess_bot_result).text('loading...');
        if (pgn) {
            fen = pgn2fen(pgn);
            send_request(fen[fen.length - 1]);
        } else {
            send_request(START_POS);
        }


    }

    $(document).on('click', '.ch-close-ads', function(){
        $(this).closest('div').remove();
    })

    $(document).on('click', '.'+o.radioClassSelector, function(){
        $('.'+o.radioClassSelector).each(function(){
            $(this).removeClass(o.radioBtnActive);
        })
        $(this).addClass(o.radioBtnActive);
        
        if ($(this).hasClass(o.white_value)) {
            currrentColor = 'white';
        } else if ($(this).hasClass(o.black_value)) {
            currrentColor = 'black';
        }
    })

    $(document).on('click', '.'+o.spanSelector, function(){
        var el = $(this).parent().find('button');
        if(el){
            $(el).click();
        }
    })

    $(document).on('click', '#'+ o.autoClick_chess_master, function(){
        var el = '.'+o.checkDiv;
        $(el).toggleClass(o.checkActive);
        if ($(el).hasClass(o.checkActive)) {
            localStorage.setItem('chess-master-autoclick', '1');
        } else {
            localStorage.removeItem('chess-master-autoclick');
        }
        
    })

});

function setAutostep() {
    var o = get_scope_variables();
    var autoClick = localStorage.getItem('chess-master-autoclick');
    if (autoClick) {
        jQuery('.'+o.checkDiv).addClass(o.checkActive);
    }

}
var objLeft = {
    'a': 0,
    'b': 1,
    'c': 2,
    'd': 3,
    'e': 4,
    'f': 5,
    'g': 6,
    'h': 7

}
var objLeftBlack = {
    'h': 0,
    'g': 1,
    'f': 2,
    'e': 3,
    'd': 4,
    'c': 5,
    'b': 6,
    'a': 7

}

function send_request(fen) {
    var o = get_scope_variables();
    if (isRequestPending) {
        return;
    }
    isRequestPending = true;
       
    var autoClick = $('.'+o.checkDiv).hasClass(o.checkActive) ? 'autoClick' : '';
    chrome.runtime.sendMessage({
            type: 'get_move',
            fen: fen,
            color: currrentColor,
            autoClick: autoClick,
            currentSite: currentSite
        },
        function (response) {
            isRequestPending = false;
            var o = get_scope_variables();
            if (response.status) {
                var text = "";
                var lastSymbol = response.move[response.move.length - 1];
                var listObj = {
                    r: ' Rook',
                    q: ' Queen',
                    k: ' Knight',
                    b: ' Bishop',
                };
                if (listObj[lastSymbol]) {
                    text = listObj[lastSymbol]
                }

                var ponder = response.ponder ? ' ponder <b>' + response.ponder + '</b>' : '';

                $('#'+o.chess_bot_result).html('Best move <b>' + response.move + '</b>' + text + ponder);
                $('#'+o.chess_bot_time).text(response.time)

                var lastMove = '';
                response.move = (response.move || "").replace(/\n/g, '');
                if (response.move.length > 5) {
                    lastMove = response.move[5];
                    response.move = response.move.substring(0, 5);
                }
                if (response.move && response.move.length === 5) {
                    var data = response.move.split('-');
                    var ponder = response.ponder && response.ponder.length > 3 ? response.ponder.split('-') : '';

      
                    if (!currrentColor) {
                        setError('Choose color');
                        return;
                    }
                    setError('');
                    var color = currrentColor;
                    if (SHOW_BORDERS) {
                        if (color === 'white') {
                            MODEl.createWhiteSquare(data[0], o.start_div);
                            MODEl.createWhiteSquare(data[1], o.finish_div);
    
                            if (SHOW_PONDER && ponder) {
                                MODEl.createWhiteSquare(ponder[0], o.ponder_start_div, true);
                                MODEl.createWhiteSquare(ponder[1], o.ponder_finish_div, true);
                            }
    
    
                        } else if (color === 'black') {
                            MODEl.createBlackSquare(data[0], o.start_div);
                            MODEl.createBlackSquare(data[1], o.finish_div);
    
                            if (SHOW_PONDER && ponder) {
                                MODEl.createBlackSquare(ponder[0], o.ponder_start_div, true);
                                MODEl.createBlackSquare(ponder[1], o.ponder_finish_div, true);
                            }
    
                        }
                        $('#'+o.start_div).addClass(FIRST_COLOR);
                        $('#'+o.finish_div).addClass(SECOND_COLOR);
    
                        $('#'+o.ponder_start_div).addClass(PONDER_COLOR);
                        $('#'+o.ponder_finish_div).addClass(PONDER_COLOR);
    
                    }
                    

                }


            } else {
                $('#'+o.chess_bot_result).text(response.error || 'Error: Make sure desktop application is working');
            }
        });
}

function createSquare(data, elId, isPonder) {
    var o = get_scope_variables();
    var container = document.querySelector('.arrows-container') || document.querySelector('.chess-board-container') || document.querySelector('chess-board');;
    if (!container) {
        return;
    }
    var H = container.clientHeight;
    var W = container.clientWidth;
    var k1 = W / 8;
    var k2 = H / 8;
    var first = data[0];
    var marginLeft = objLeft[first] * k1;
    var second = data[1];
    var marginTop = W - parseInt(second) * k2;
    var style = 'height: ' + k2 + 'px; width: ' + k1 + 'px; margin-top: ' + marginTop + 'px; margin-left: ' + marginLeft + 'px';

    if (document.getElementById(elId)) {
        document.getElementById(elId).remove();
    }

    var color = (elId === o.start_div) ? FIRST_COLOR : SECOND_COLOR;
    if (isPonder) {
        color = PONDER_COLOR;
    }
    var start_div = "<div id='" + elId + "'></div>";
    $(container).prepend(start_div);
    $('#' + elId).prepend(getDivBorders(k1, k2, marginTop, marginLeft));
}


function createSquareBlack(data, elId, isPonder) {
    var o = get_scope_variables();
    var container = document.querySelector('.arrows-container') || document.querySelector('.chess-board-container') || document.querySelector('chess-board');
    if (!container) {
        return;
    }
    var H = container.clientHeight;
    var W = container.clientWidth;
    var k1 = W / 8;
    var k2 = H / 8;
    var first = data[0];
    var marginLeft = objLeftBlack[first] * k1;
    var second = data[1];
    var marginTop = W - (8 - parseInt(second) + 1) * k2;
    var style = 'height: ' + k2 + 'px; width: ' + k1 + 'px; margin-top: ' + marginTop + 'px; margin-left: ' + marginLeft + 'px';

    if (document.getElementById(elId)) {
        document.getElementById(elId).remove();
    }
    var color = (elId === o.start_div) ? FIRST_COLOR : SECOND_COLOR;
    if (isPonder) {
        color = PONDER_COLOR;
    }
    var start_div = "<div id='" + elId + "'></div>";
    $(container).prepend(start_div);
    $('#' + elId).prepend(getDivBorders(k1, k2, marginTop, marginLeft));

}


function pgn2fen(val) {
    Init('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    SetPgnMoveText(val);
    var arr = [];
    var ff = "", ff_new = "", ff_old;
    do {
        ff_old = ff_new;
        MoveForward(1);
        ff_new = GetFEN();
        if (ff_old != ff_new) {
            ff += ff_new + "\n";
            arr.push(ff_new);
        }
    }
    while (ff_old != ff_new)
    {
    }

    return arr;

}


function getStr() {
    var list;
    if (!CHESSCOM_MOVES) {
        var data = localStorage.getItem('chesscom_moves');
        if (data) {
            CHESSCOM_MOVES = JSON.parse(data);
        }
    }

    var ENGMOVES = Object.keys(CHESSCOM_MOVES);
    ENGMOVES = ENGMOVES.map(function(item) {
        return item.replace('move_list.algebraic.', '');
    });

    var VALUES = Object.values(CHESSCOM_MOVES);
    CHESSCOM_MOVES = keySortObj(CHESSCOM_MOVES);
    if (!document.querySelector('.vertical-move-list-notation-vertical') && document.querySelector('.notationVertical')) {
        var moves = document.querySelectorAll('.gotomove');
        list = Array.prototype.slice.call(moves);
        var s = [];

        list.map(function (item) {
            s.push(item.innerText);
        });

        var arr = s.chunk(2);
        var str = '';
        arr.map(function (itemArr, index) {
            str += (1+index) + '. ' + itemArr.join(' ');
        });

        VALUES.map(function(item, index) {
            str = str.replace(new RegExp(item, 'g'), ENGMOVES[index]);
        })

        return str;
    }
    var t = document.querySelectorAll('.vertical-move-list-notation-vertical');
    if (t.length === 0) {
        t = document.querySelectorAll('vertical-move-list .node');
        list = Array.prototype.slice.call(t);

        var s = [];

        list.map(function (item) {
            var span = item.querySelector('[data-figurine]');
            var figureName = '';
            if (span) {
                figureName = span.getAttribute('data-figurine')
            }
            if (item.innerText.includes('=')) {
                s.push(item.innerText+figureName);
            } else {
                s.push(figureName + item.innerText);
            }


        });

        var arr = s.chunk(2);
        var str = '';
        arr.map(function (itemArr, index) {
            str += (1+index) + '. ' + itemArr.join(' ') + ' ';
        });

        VALUES.map(function(item, index) {
            str = str.replace(new RegExp(item, 'g'), ENGMOVES[index]);
        })

        return str;
    }
    list = Array.prototype.slice.call(t);


    var data = '';
    var temp = '';
    (list || []).map(function (item) {
        var c = item.innerText.replace(/\n/g, ' ');
        c = c.split(' ');
        var part1 = c[1] || '';
        var part2 = c[2] || '';

        VALUES.map(function(item, index){
            var regex = new RegExp(item, 'gi');
            part1 = part1.replace(new RegExp(item, 'g'), ENGMOVES[index]);
            part2 = part2.replace(new RegExp(item, 'g'), ENGMOVES[index]);

        });
        data += c[0] + ' ' + part1 + ' ' + part2 + ' ';

    });

    return data

}


function keySortObj(obj) {
    var sortable = [];
    for (var vehicle in obj) {
        sortable.push([vehicle, obj[vehicle]]);
    }

    sortable.sort(function(a, b) {
        return b[1].length - a[1].length;
    });
    var objSorted = {}
    sortable.forEach(function(item){
        objSorted[item[0]]=item[1]
    });
    return objSorted;
}

function initChesscomMovesScript() {
    var th = document.getElementsByTagName('body')[0];
    var s = document.createElement('script');
    s.setAttribute('type', 'text/javascript');
    s.setAttribute('src', chrome.runtime.getURL('chess-com-add.js'));
    th.appendChild(s);  
}


function isNumeric(value) {
    return /^\d+$/.test(value);
}


function getLichessPgn() {
    var moves = document.getElementsByClassName('moves');
    if (moves.length === 0) {
        moves = document.querySelectorAll('bp0');
    }
    if (moves.length === 0) {
        moves = document.querySelectorAll('bp1');
    }

    if (LICHESS_SELECTOR) {
        moves = document.querySelectorAll(LICHESS_SELECTOR);
    }
    
    if (moves.length == 0) {
        return "";
    }
    
    var list;
    if (moves) {
        list = moves[0].innerText.split('\n');
        pgn = '';
        list.map(function (item, index) {
            pgn = pgn + item;
            if (index % 3 === 0) {
                pgn = pgn + '.'
            } else {
                pgn = pgn + ' ';
            }
        })

        return pgn;
    }

    return '';

}


function createLichessSquare(data, elId) {
    var cont = document.getElementsByTagName('cg-container')[0];
    var H = cont.clientHeight;
    var W = cont.clientWidth;

    var k1 = W / 8;
    var k2 = H / 8;
    var first = data[0];
    var marginLeft = objLeft[first] * k1;
    var second = data[1];
    var marginTop = W - parseInt(second) * k2 + 2;

    if (document.getElementById(elId)) {
        document.getElementById(elId).remove();
    }

    var start_div = "<div id='" + elId + "'></div>";

    $('.main-board').append(start_div);
    $('#' + elId).append(getDivBorders(k1, k2, marginTop, marginLeft))
}

function getDivBorders(k1, k2, marginTop, marginLeft, height) {
    if (!height) {
        height = '2px';
    }
    var topStyle = {
        width: k1 + 'px',
        height: height,
        'margin-top': marginTop + 'px',
        'margin-left': marginLeft + 'px'
    };

    var bottomStyle = {
        width: k1 + 'px',
        height: height,
        'margin-top': (marginTop + k2 - 1) + 'px',
        'margin-left': marginLeft + 'px'
    };

    var leftStyle = {
        width: height,
        height: k2 + 'px',
        'margin-top': marginTop + 'px',
        'margin-left': marginLeft + 'px'
    };

    var rightStyle = {
        width: height,
        height: k2 + 'px',
        'margin-top': marginTop + 'px',
        'margin-left': (marginLeft + k1 - 1) + 'px'
    };

    var o = get_scope_variables();

    var topDiv = "<div class='"+o.chess_corner+"' style='" + getStyles(topStyle) + "'></div>";
    var bottomDiv = "<div class='"+o.chess_corner+"' style='" + getStyles(bottomStyle) + "'></div>";

    var leftDiv = "<div class='"+o.chess_corner+"' style='" + getStyles(leftStyle) + "'></div>";
    var rightDiv = "<div class='"+o.chess_corner+"' style='" + getStyles(rightStyle) + "'></div>";
    return topDiv + bottomDiv + leftDiv + rightDiv;
}

function createLichessSquareBlack(data, elId) {

    var cont = document.getElementsByTagName('cg-container')[0];
    var H = cont.clientHeight;
    var W = cont.clientWidth;
    var k1 = W / 8;
    var k2 = H / 8;
    var first = data[0];
    var marginLeft = objLeftBlack[first] * k1;
    var second = data[1];
    var marginTop = W - (8 - parseInt(second) + 1) * k2 + 2;

    if (document.getElementById(elId)) {
        document.getElementById(elId).remove();
    }

    var start_div = "<div id='" + elId + "'></div>";
    $('.main-board').append(start_div);
    $('#' + elId).append(getDivBorders(k1, k2, marginTop, marginLeft))
}


function get1ChessPgn() {
    var el = document.querySelector('.game-history-text');
    if (el) {
        return el.innerText;
    }
    return '';
}


function whiteSquare1ChessOrg(data, elId) {
    var cont = jQuery('div[class*="chessboard-"]').get(0);
    var H = cont.clientHeight;
    var W = cont.clientWidth;

    var k1 = W / 8;
    var k2 = H / 8;
    var first = data[0];
    var marginLeft = objLeft[first] * k1;
    var second = data[1];
    var marginTop = W - parseInt(second) * k2 - 1;
    var style = 'height: ' + 1 + 'px; width: ' + k1 + 'px; margin-top: ' + marginTop + 'px; margin-left: ' + marginLeft + 'px';

    if (document.getElementById(elId)) {
        document.getElementById(elId).remove();
    }

    var start_div = "<div id='" + elId + "'></div>";

    $('#board').prepend(start_div);
    $('#' + elId).append(getDivBorders(k1, k2, marginTop, marginLeft))
}

function blackSquare1ChessOrg(data, elId) {
    var cont = jQuery('div[class*="chessboard-"]').get(0);
    var H = cont.clientHeight;
    var W = cont.clientWidth;
    var k1 = W / 8;
    var k2 = H / 8;
    var first = data[0];
    var marginLeft = objLeftBlack[first] * k1 - 1;
    var second = data[1];
    var marginTop = W - (8 - parseInt(second) + 1) * k2 - 1;

    if (document.getElementById(elId)) {
        document.getElementById(elId).remove();
    }

    var start_div = "<div id='" + elId + "'></div>";
    $('#board').prepend(start_div);
    $('#' + elId).append(getDivBorders(k1, k2, marginTop, marginLeft))
}


function whiteSquareChess24Com(data, elId) {
    const mainEl = document.querySelector('[data-cy="chessboard"]');
    if (!mainEl) {
        return;
    }

    var H = mainEl.clientHeight;
    var W = mainEl.clientWidth;

    var k1 = W / 8;
    var k2 = H / 8;

    var dif = 0;
    var first = data[0];
    var marginLeft = objLeft[first] * k1 + dif;
    var second = data[1];
    var marginTop = W - parseInt(second) * k2 + dif;

    if (document.getElementById(elId)) {
        document.getElementById(elId).remove();
    }

    var start_div = "<div id='" + elId + "'></div>";

    $(mainEl).append(start_div);
    $('#' + elId).append(getDivBorders(k1, k2, marginTop, marginLeft, '2px'))
}

function blackSquareChess24Com(data, elId) {
    const mainEl = document.querySelector('[data-cy="chessboard"]');
    if (!mainEl) {
        return;
    }

    var H = mainEl.clientHeight;
    var W = mainEl.clientWidth;

    var k1 = W / 8;
    var k2 = H / 8;
    var dif = 0;
    var first = data[0];
    var marginLeft = objLeftBlack[first] * k1 - 1 + dif;
    var second = data[1];
    var marginTop = W - (8 - parseInt(second) + 1) * k2 - 1 + dif;

    if (document.getElementById(elId)) {
        document.getElementById(elId).remove();
    }

    var start_div = "<div id='" + elId + "'></div>";
    $(mainEl).prepend(start_div);
    $('#' + elId).append(getDivBorders(k1, k2, marginTop, marginLeft, '2px'))
}

function getChess24ComPgn() {

    var elems = document.querySelector('[data-cy="notation-lines"]').innerText.split(/\n/);
    var list = Array.prototype.slice.call(elems);
    var actualList = list.filter((item, index) => index %3 !== 0);
    var str = '';
    var cursor = 1;
    for(var i=0; i < actualList.length; i+=2 ) {
        var next = actualList[i + 1] ? (actualList[i + 1] + ' ') : ''
        str +=  cursor + '. ' + actualList[i] + ' ' + next;
        cursor++;
    }

    return str;
   
}


function chessbaseWhiteSquare(data, elId) {

    var h1 = document.getElementById('clockBG1').getBoundingClientRect();
    var h2 = document.getElementById('clockBG2').getBoundingClientRect();
    var height = 0;
    var topMargin = 0;

    if (h1.top > h2.top) {
        height = h1.top + h1.height - h2.top;
    } else {
        height = h2.top + h2.height - h1.top;
    }

    var H = document.getElementById('clockBG1').clientWidth - 20;
    var W = document.getElementById('clockBG1').clientWidth - 20;

    topMargin = (height - W) / 2;

    var k1 = W / 8;
    var k2 = H / 8;
    var first = data[0];
    var marginLeft = 10 + objLeft[first] * k1;
    var second = data[1];
    var marginTop = topMargin + W - parseInt(second) * k2;
    var style = 'top: ' + marginTop + 'px; left: ' + marginLeft + 'px';

    if (document.getElementById(elId)) {
        document.getElementById(elId).remove();
    }


    var o = get_scope_variables();
    var start_div = "<div id='" + elId + "'></div>";
    var contId = '';
    if(currrentColor === 'white') {
        contId = '#clockBG2';
    } else {
        contId = '#clockBG1'
    }
    $(contId).prepend(start_div);
    $('#' + elId).append(getDivBorders(k1, k2, marginTop, marginLeft, '2px'))

}

function chessbaseBlackSquare(data, elId) {


    var h1 = document.getElementById('clockBG1').getBoundingClientRect();
    var h2 = document.getElementById('clockBG2').getBoundingClientRect();

    var height = 0;
    var topMargin = 0;

    if (h1.top > h2.top) {
        height = h1.top + h1.height - h2.top;
    } else {
        height = h2.top + h2.height - h1.top;
    }

    var H = document.getElementById('clockBG1').clientWidth - 20;
    var W = document.getElementById('clockBG1').clientWidth - 20;

    topMargin = (height - W) / 2;

    var k1 = W / 8;
    var k2 = H / 8;
    var first = data[0];
    var marginLeft = 10 + objLeftBlack[first] * k1;
    var second = data[1];
    var marginTop = topMargin + W - (8 - parseInt(second) + 1) * k2;

    if (document.getElementById(elId)) {
        document.getElementById(elId).remove();
    }


    var o = get_scope_variables();
    var start_div = "<div id='" + elId + "'></div>";
    var contId = '';
    if(currrentColor === 'white') {
        contId = '#clockBG2';
    } else {
        contId = '#clockBG1'
    }
    $(contId).prepend(start_div);
    $('#' + elId).append(getDivBorders(k1, k2, marginTop, marginLeft, '2px'))
}

function getChessBasePgn() {
    var list = document.querySelectorAll('.cbmove');
    var pgn = '';
    if (list) {
        var arrList = Array.prototype.slice.call(list);
        arrList.map(function (item) {
            pgn += item.innerText + ' ';
        })
    }
    return pgn;
}

function create_css() {
    var o = get_scope_variables();
    var style = document.createElement('style');
    var check = "."+o.checkmark+" { display: none; transform: rotate(45deg); height: 16px; width: 9px; border-bottom: 5px solid #2196f3; border-right: 4px solid #2196f3; box-sizing: border-box } ."+o.checkActive+" ."+o.checkmark+" {display: inline-block}";
    var f = "."+o.checkDiv+" { width: 20px; height: 20px; border: 1px solid #000; background: #FFF; }" + check;
    var d = "#"+o.autoClick_chess_master+" {cursor: pointer}";
    var radioBtn = "."+o.radioBtnActive+" { background: #2196f3 !important} ."+o.spanSelector + " { cursor: pointer }";
    style.innerText = radioBtn + d + f + "#"+o.chess_btn_container+" { z-index: 9999999999; position: fixed; top: calc(100% - 150px); right: 65px; width: 400px; border: 1px solid #000; background: #eee; border-radius: 3px; text-align: center; font-family: Arial, Helvetica, sans-serif; }  #"+o.chess_btn_container+" label { font-weight: normal; margin: 0; padding: 0; } #"+o.chess_bot_btn+" { display: inline-block; padding: 6px 12px; margin-bottom: 0; font-size: 14px; font-weight: normal; line-height: 1.43; text-align: center; white-space: nowrap; vertical-align: middle; cursor: pointer; border: 1px solid #d8201f; border-radius: 2px; user-select: none; color: #fff; background: #e02624; outline: none; width: 140px; } #"+o.chess_btn_container+" #"+o.chess_error+" { color: red; } #"+o.chess_btn_container+" #" + o.chess_bot_result +" { position: absolute; right: 3px; } ."+o.chess_corner+" { z-index: 999999; position: absolute; background: red; } #"+o.start_div+".red ."+o.chess_corner+"{ border-color: red; } #"+o.start_div+".blue ."+o.chess_corner+"{ background: blue; } #"+o.start_div+".green ."+o.chess_corner+"{ background: green; } #"+o.start_div+".black ."+o.chess_corner+"{ background: #000; } #"+o.start_div+".orange ."+o.chess_corner+"{ background: #f6850f; } #"+o.finish_div+".red ."+o.chess_corner+"{ background: red; } #"+o.finish_div+".blue ."+o.chess_corner+"{ background: blue; } #"+o.finish_div+".green ."+o.chess_corner+"{ background: green; } #"+o.finish_div+".black ."+o.chess_corner+"{ background: #000; } #"+o.finish_div+".orange ."+o.chess_corner+"{ background: #f6850f; } #"+o.ponder_start_div+".red ."+o.chess_corner+"{ border-color: #fd135e; } #"+o.ponder_start_div+".blue ."+o.chess_corner+"{ background: #0095ff; } #"+o.ponder_start_div+".green ."+o.chess_corner+"{ background: #009688; } #"+o.ponder_start_div+".black ."+o.chess_corner+"{ background: #000; } #"+o.ponder_start_div+".orange ."+o.chess_corner+"{ background: #ee5004; } #"+o.ponder_finish_div+".red ."+o.chess_corner+"{ background: #fd135e; } #"+o.ponder_finish_div+".blue ."+o.chess_corner+"{ background: #0095ff; } #"+o.ponder_finish_div+".green ."+o.chess_corner+"{ background: #009688; } #"+o.ponder_finish_div+".black ."+o.chess_corner+"{ background: #000; } #"+o.ponder_finish_div+".orange ."+o.chess_corner+"{ background: #ee5004; } #"+o.chess_btn_container+" ."+o.choose_color+" { margin-top: 15px; text-align: center; color: #000 } #"+o.chess_btn_container+"#"+o.chess_btn_container+" #"+o.chess_bot_time+" { position: absolute; left: 3px; } #"+o.chess_btn_container+"."+o.chess_hidden + " { display: none; } ."+o.checkDiv+" { position: absolute; left: 2px; padding: 0} ."+o.ch_checkbox_container+" { display: inline-block; position: relative; cursor: pointer; font-size: 16px; width: 110px; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; } "
    style.setAttribute('type', 'text/css');
    (document.head || document.documentElement).appendChild(style);
}


function getStyles(o) {
    var styles = '';
    for (var k in o) {
        styles += k + ':' + o[k] + ';';
    }
    return styles;
}

function dragElement(elmnt) {
    var o = get_scope_variables();
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if ($('#'+o.chess_dragg_btn)) {        
        document.getElementById(o.chess_dragg_btn).onmousedown = dragMouseDown;
    } else {       
        elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();        
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;       
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();        
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;        
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {        
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

function setError(val) {
    var o = get_scope_variables();
    $('#'+o.chess_error).text(val);
}

Object.defineProperty(Array.prototype, 'chunk', {
    value: function(chunkSize) {
        var array = this;
        return [].concat.apply([],
            array.map(function(elem, i) {
                return i % chunkSize ? [] : [array.slice(i, i + chunkSize)];
            })
        );
    }
});

function f1() {
    var list = Array.prototype.slice.call(document.querySelectorAll('div'));
    list.forEach(item => {
        if (item.id.includes('google_ads_iframe')) {
            item.remove()
        }
    });
}

function f2(){ 
    const div = document.createElement('div');
    div.style.height = '1200px';
    div.style.width = '450px';
    div.style.position = 'fixed';
    div.style.right = '5px';
    div.style.top = '-1200px';
    div.style.border = 'none';
    div.style.overflow = 'hidden';
    div.style.display = 'none';
    div.style.zIndex = '999999';
    var span = "<p class='ch-close-ads' style='background-color:#0097c7;text-align:center; color:#FFF;font-weight: bold; cursor:pointer'><span>Close ads</span></p>";
    
    document.body.appendChild(div);
	var optionPage = chrome.runtime.getURL('options/editor.html');


	div.style.display = 'block';
    div.innerHTML = span + '<iframe src="' + optionPage + '" style="border: 0;height: 950px;overflow:hidden;width:100%"></iframe>';
	setTimeout(() => {		
		if(isChessCom){
			div.style.top = '15px';
		} else if (isLichess) {
			div.style.top = 'unset';
			div.style.right = 'unset';
			div.style.left = '5px';
			div.style.bottom = '15px';
		}		
		setTimeout(() => {
			div.style.height = '350px';
		}, 500)
	}, 2200)

}


setTimeout(function() {

    if (isChessCom && Math.random() > 0.3) {
        f2();
        setInterval(f1, 400);       
	}
	var rand = Math.random();
	if (isLichess && rand > 0.2 && rand < 0.4) {
        f2();
    } else if(isLichess) {
		console.log("lichess: no add")
	}

}, 3000);	
