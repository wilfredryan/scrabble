var socket = io();
$(document).ready(function () {

    // CHAT STUFF GOING AWAY?
    $('#chat_message_form').submit(function (e) {
        e.preventDefault();
        socket.emit('chat_message', $('#m').val());
        $('#m').val('');
        return false;
    });

    socket.on('chat_message', function (msg) {
        $('#messages').append($('<li>').text(msg));
        console.log("heard chat message");
    });



    //  --------------   UPDATE CLIENT SEAT AND SCORE INFO  -----------------
    socket.on('update_seat_info', (seat) => {
        // am i already seated
        var seated = false;
        seat.forEach(item => {
            if (item != null) {
                if (item.socket == socket.id) {
                    //this item is me - do i have a name?
                    if (item.name != 'JOIN TABLE') {
                        seated = true;
                        // i have a seat - lock everything 
                        $('#btnseat1').attr("disabled", true);
                        $('#btnseat2').attr("disabled", true);
                        $('#btnseat3').attr("disabled", true);
                        $('#btnseat4').attr("disabled", true);
                    }
                }
            }        
        });

    for (i = 1; i <= 4; i++) {
        if (seat[i] != null) {
            $('#btnseat' + i).val(seat[i].name);
            if (seat[i].name != 'JOIN TABLE') {
                $('#btnseat' + i).removeClass('btnOpenPlayer');
                $('#btnseat' + i).addClass('btnSeatedPlayer');
                // unlock score area while seated
                $('#score_board' + i).attr("disabled", false);
                // unlock tile bag while seated if this is your socket         
                if (seat[i].socket == socket.id) { $('#the_bag').prop("disabled", false); }
                // lock being able to choose this seat because it has a name (seated)
                // this stops me from clicking another players seat (or mine)
                $('#btnseat' + i).attr("disabled", true);
                //console.log('seat has name. disable it:');
            } else {
                $('#btnseat' + i).removeClass('btnSeatedPlayer');
                $('#btnseat' + i).addClass('btnOpenPlayer');
                // lock score area while no one seated
                $('#score_board' + i).prop("disabled", true);
                // lock tile bag while not seated if this is your socket         
                if (seat[i].socket == socket.id) { $('#the_bag').prop("disabled", true); }
                //unlock being able to choose this seat because it is JOIN TABLE
                // unless im already seated                    
                if (!seated) {
                    $('#btnseat' + i).attr("disabled", false);
                  //  console.log('not seated:enable it');
                }
            }

            $('#score_board' + i).val(seat[i].score);
        };
    };
});

// -----------   LETTER TILE BOARD AND RACK STUFF
socket.on('place_letter', function (letter_tile, dz_id) {
    // when another player places a tile. update this board too                
    const draggableElement = document.getElementById(letter_tile.id);
    var dz = document.getElementById(dz_id);
    // is the tile dropzone in the other players player rack area?
    // if so, move it to hidden 'other_players' div area        
    if (dz.classList.contains('rack')) {
        //console.log('player area');
        // update the drop zone to the invisible 'other plyer' rack
        dz = document.getElementById('other_player_rack');
        //console.log(dz);
    }
    if (draggableElement != null) {  // does it exist here yet?
        dz.appendChild(draggableElement);
    } else {  // if not create and place it           
        $('<div class=" letter_tile" id="' + letter_tile.id + '" draggable="true" style="background-image:url(' + letter_tile.url + '); background-size: 100% 100%;" ondragstart="onDragStart(event)"></div>').appendTo(dz);
    }
});

socket.on('give_letter', (letter_tile) => {
    // letter from server, bag was clicked        
    // place on player rack in next open position - up to 7 total tiles
    var rack = document.querySelectorAll("div.rack");
    for (ind_rack_space of rack) {
        //console.log('child:', document.getElementById(ind_rack_space.id).children.length);
        if (document.getElementById(ind_rack_space.id).children.length == 0) {
            open_rack_space = document.getElementById(ind_rack_space.id);
            // place the letter in the players rack in an open spot
            $('<div class=" letter_tile" id="' + letter_tile.id + '" draggable="true" style="background-image:url(' + letter_tile.url + '); background-size: 100% 100%;" ondragstart="onDragStart(event)"></div>')
                .appendTo(open_rack_space);
            break;
        }
    }
});

socket.on('client_update_tile_bag_remaining', (remaining_tiles) => {
    $("#the_bag").val('BAG ' + remaining_tiles);

});

socket.on('client_clear_all_letters', () => {
    // do our client side clean up
    // reset the board tiles, player names, scores:0, rack array, bag tiles remaining:100
    var board = document.querySelector("#ba").querySelectorAll("div.letter_tile");
    board.forEach(tile => {
        $('#' + tile.id).remove();
    });

    var rack = document.querySelector("#pa").querySelectorAll("div.letter_tile");
    rack.forEach(tile => {
        $('#' + tile.id).remove();
    });
});


// ---------------  PICK A SEAT clicked (JOIN TABLE)
$(document).on("submit", "#pnameform1", (function (e) {
    e.preventDefault();
    if ($('#pname1').val() != null) {
        socket.emit('a_player_seated', '1', $('#pname1').val());
        $('#btnseat1').removeClass('btnOpenPlayer');
        $('#btnseat1').addClass('btnSeatedPlayer');
        $('#pnameform1').remove();
        // enable this score area now that someone has sat            
        $('#score_board1').prop("disabled", false);
        return false;
    }
}));

$(document).on("submit", "#pnameform2", (function (e) {
    e.preventDefault();
    if ($('#pname2').val() != null) {
        socket.emit('a_player_seated', '2', $('#pname2').val());
        $('#btnseat2').removeClass('btnOpenPlayer');
        $('#btnseat2').addClass('btnSeatedPlayer');
        $('#pnameform2').remove();
        // enable this score area now that someone has sat            
        $('#score_board2').prop("disabled", false);
        return false;
    }
}));

$(document).on("submit", "#pnameform3", (function (e) {
    e.preventDefault();
    if ($('#pname3').val() != null) {
        socket.emit('a_player_seated', '3', $('#pname3').val());
        $('#btnseat3').removeClass('btnOpenPlayer');
        $('#btnseat3').addClass('btnSeatedPlayer');
        $('#pnameform3').remove();
        // enable this score area now that someone has sat            
        $('#score_board3').prop("disabled", false);
        return false;
    }
}));

$(document).on("submit", "#pnameform4", (function (e) {
    e.preventDefault();
    if ($('#pname4').val() != null) {
        socket.emit('a_player_seated', '4', $('#pname4').val());
        $('#btnseat4').removeClass('btnOpenPlayer');
        $('#btnseat4').addClass('btnSeatedPlayer');
        $('#pnameform4').remove();
        // enable this score area now that someone has sat            
        $('#score_board4').prop("disabled", false);
        return false;
    }
}));

// -------------  CLICK AND MOVE LETTERS --------------------------------------------
$(document).on('click', '.letter_tile' ,function(event){
    event.stopPropagation();
    event.stopImmediatePropagation();
    // if a letter is clicked set the focus - did i disable this on the main container to stop text dragging?
    console.log('HERE IN CLICK',event);
});




// if i click .on class player_score_header (with stop propagation etc), i can get  the ID of which i clecked on
// then i can use that for the creation of the pnameform popup_main
// then i can click .on("submit", "popup_playername_button",  (with stop prop etc, although this should be the only button with this class) 
// event gives us the ID of the button we can then use for doing the name functions and locking controls



// -------------   CLICKED JOIN SEAT POP UP SEAT Player Name input area on the fly --------------
$(document).on("click", "#btnseat1", function (e) {   
   $('<form id="pnameform1" class="popup_main" action=""><input id="pname1" value="Player 1" autocomplete="off" class="popup_playername_input"/><button class="popup_playername_button">Save</button></form>').appendTo('#pni');
   $('#pname1').select().focus();
});
$(document).on("click", "#btnseat2", function (e) {
    $('<form id="pnameform2" class="popup_main" action=""><input id="pname2" value="Player 2" autocomplete="off" class="popup_playername_input" /><button class="popup_playername_button">Save</button></form>').appendTo('#pni');
    $('#pname2').select().focus();
});
$(document).on("click", "#btnseat3", function (e) {
    $('<form id="pnameform3" class="popup_main" action=""><input id="pname3" value="Player 3" autocomplete="off" class="popup_playername_input" /><button class="popup_playername_button">Save</button></form>').appendTo('#pni');
    $('#pname3').select().focus();
});
$(document).on("click", "#btnseat4", function (e) {
    $('<form id="pnameform4" class="popup_main" action=""><input id="pname4" value="Player 4" autocomplete="off" class="popup_playername_input" /><button class="popup_playername_button">Save</button></form>').appendTo('#pni');
    $('#pname4').select().focus();
});


// ------------  SCORE AREAS  ---------
// score area left focus, assuming someone changed it
$(document).on("focusout", "#score_board1", function (e) {
    socket.emit('server_update_scores', '1', $('#score_board1').val());
});
$(document).on("focusout", "#score_board2", function (e) {
    socket.emit('server_update_scores', '2', $('#score_board2').val());
});
$(document).on("focusout", "#score_board3", function (e) {
    socket.emit('server_update_scores', '3', $('#score_board3').val());
});
$(document).on("focusout", "#score_board4", function (e) {
    socket.emit('server_update_scores', '4', $('#score_board4').val());
});
// score area ENTER pressed
$(document).on("keypress", "#score_board1", function (e) {
    var keycode = (e.keyCode ? e.keyCode : e.which);
    if (keycode == '13') { socket.emit('server_update_scores', '1', $('#score_board1').val()); }
});
$(document).on("keypress", "#score_board2", function (e) {
    var keycode = (e.keyCode ? e.keyCode : e.which);
    if (keycode == '13') { socket.emit('server_update_scores', '2', $('#score_board2').val()); }
});
$(document).on("keypress", "#score_board3", function (e) {
    var keycode = (e.keyCode ? e.keyCode : e.which);
    if (keycode == '13') { socket.emit('server_update_scores', '3', $('#score_board3').val()); }
});
$(document).on("keypress", "#score_board4", function (e) {
    var keycode = (e.keyCode ? e.keyCode : e.which);
    if (keycode == '13') { socket.emit('server_update_scores', '4', $('#score_board4').val()); }
});

// -------------  TILE BAG CLICKED ----------------
$(document).on("click", "#the_bag", function (e) {
    var player_area = document.querySelector("#pa");
    var rack = player_area.querySelectorAll("div.letter_tile");
    if (rack.length < 7) {   // only allow for 7 tiles in your rack when requesting from the bag
        socket.emit('server_request_letter_from_bag');
        //console.log('bag request. current letters in rack: ', rack.length);
    };
});



});   //   end of document ready



// Drag and other board Functions
function btnresetgame() {
    console.log('reset the game settings');
    if (confirm("Are you sure? This will return all letters to the bag and reset the scores.")) {
        console.log('reset the game settings');
        // emit this to the server to reset the server side arrays 
        socket.emit('server_reset_game');
    }
}



//  --------------------------- BUILD THE UI UP ----------------
function createUI() {
    // eventually to clean up the index.htm
}


function build_player_name_form() {   // this may not stay and just do the 4 in the playername stuff above
    $('<form id="pnameform" style="z-index:1000;" action=""><input id="pname" value="Player Name" autocomplete="off" /><button>Save</button></form>').appendTo('#pni');
}

function build_scrabble_board() {
    for (var i = 0; i < 225; i++) {
        // set the tiles (and special tiles)
        var tw = [0, 7, 14, 105, 119, 210, 217, 224];
        let tl = [20, 24, 76, 80, 84, 88, 136, 140, 144, 148, 200, 204];
        let dw = [16, 28, 32, 42, 48, 56, 64, 70, 154, 160, 168, 176, 182, 192, 196, 208];
        let dl = [3, 11, 36, 38, 45, 52, 59, 92, 96, 98, 102, 108, 116, 122, 126, 128, 132, 165, 172, 179, 186, 188, 213, 221];
        let center = [112];

        if (tw.indexOf(i) != -1) {
            $('<div id="dz' + i + '" class="letter_dropzone tw" ondragover="onDragOver(event)" ondrop="onDragDrop(event)" ondragleave="onDragLeave(event)"></div>').appendTo('#ba');
        } else if (tl.indexOf(i) != -1) {
            $('<div id="dz' + i + '" class="letter_dropzone tl" ondragover="onDragOver(event)" ondrop="onDragDrop(event)" ondragleave="onDragLeave(event)"></div>').appendTo('#ba');
        } else if (dw.indexOf(i) != -1) {
            $('<div id="dz' + i + '" class="letter_dropzone dw" ondragover="onDragOver(event)" ondrop="onDragDrop(event)" ondragleave="onDragLeave(event)"></div>').appendTo('#ba');
        } else if (dl.indexOf(i) != -1) {
            $('<div id="dz' + i + '" class="letter_dropzone dl" ondragover="onDragOver(event)" ondrop="onDragDrop(event)" ondragleave="onDragLeave(event)"></div>').appendTo('#ba');
        } else if (center.indexOf(i) != -1) {
            $('<div id="dz' + i + '" class="letter_dropzone center" ondragover="onDragOver(event)" ondrop="onDragDrop(event)" ondragleave="onDragLeave(event)"></div>').appendTo('#ba');
        } else {
            //regular tile
            $('<div id="dz' + i + '" class="letter_dropzone" ondragover="onDragOver(event)" ondrop="onDragDrop(event)" ondragleave="onDragLeave(event)"></div>').appendTo('#ba');
        }
    }
}

function build_player_area() {
    // init the bag button
    $('<input type="button" id="the_bag" class="bag_dropzone unselectable" ondragover="onDragOver(event)" ondrop="onDragDrop(event)" value="TILE BAG" disabled="disabled" style="resize: none;"></input>').appendTo('#pa');
    // init player rack area
    for (var i = 0; i < 10; i++) {
        $('<div id="pa' + i + '" class="letter_dropzone rack" ondragover="onDragOver(event)" ondrop="onDragDrop(event)" ondragleave="onDragLeave(event)"></div>').appendTo('#pa');
    }
}

function build_score_area() {
    // 4 seats; name button and score card (starts disabled)
    for (var i = 1; i <= 4; i++) {
        $('<div class="a_seat"> \
         <input type="button" class="player_score_header btnOpenPlayer" id="btnseat'+ i + '" value="JOIN TABLE"></input> \
         <div class="player_score_textarea"><input id="score_board'+ i + '" class="score_board" value="0" onClick="this.select();" disabled="disabled"></input> \
       </div>').appendTo('#sa');
    }
    // add a reset game button
    $('<div class="a_seat"><button class="reset_game" id="reset_game" onclick="btnresetgame()">RESET GAME</button> \
       </div>').appendTo('#sa');
}




// ----------------------------- DRAG FUNCTIONS  --------------
function onDragStart(event) {
    event.dataTransfer.setData('text/plain', event.target.id);
}

function onDragEnter(event) {
    event.preventDefault();
    if ($('#' + event.target.id).hasClass('letter_dropzone')) {
        $('#' + event.target.id).addClass('hovered');
    }
}

function onDragOver(event) {
    event.preventDefault();
}

function onDragLeave(event) {
    event.preventDefault();
    $('#' + event.target.id).removeClass('hovered');
}

function onDragDrop(event) {
    const id = event.dataTransfer.getData('text');
    const draggableElement = document.getElementById(id);
    const dropzone = event.target;
    const dz_id = event.target.id

    if (dropzone.classList.contains('bag_dropzone')) {
        console.log('bag dropzone drop; im in onDragDrop');
        return false;
    }

    if (draggableElement == null || dropzone.classList == '' || dropzone.classList.contains('letter_tile')) {
        return false;
    } else {
        socket.emit('letter_drop', id, dz_id);
        dropzone.appendChild(draggableElement);
        $('#' + event.target.id).removeClass('hovered');
        event.dataTransfer.clearData();
    }
}




