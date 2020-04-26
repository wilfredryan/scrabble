var socket = io();
var focus_holder;

$(document).ready(function () {



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
            console.log('player area');
            // update the drop zone to the invisible 'other player' rack
            dz = document.getElementById('other_player_rack');
            //console.log(dz);
        }
        if (draggableElement != null) {  // does it exist here yet?
            dz.appendChild(draggableElement);
        } else {  // if not create and place it           
            $('<div class=" letter_tile" id="' + letter_tile.id + '" draggable="true" style="background-image:url(' + letter_tile.url + '); background-size: 100% 100%;" ondragstart="onDragStart(event)"></div>')
                .appendTo(dz);
        }
    });

    socket.on('client_place_letter_in_open_rack_space', (letter_tile) => {
        // brand new letter from server (bag was clicked)
        // create on player rack in next open position
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

    socket.on('client_update_next_turn', (server_current_player) => {
        // move the highlight on player name class to next active player
        // find if anyone is current_player start with seat1 as the default if no one does
console.log (server_current_player);
        // server says this is the guy to be the current player - set the class and clear the others                           
        for (i=1; i <=4; i++) {
            if (server_current_player == i) {
                console.log (' im eq');
                $('#a_seat'+i).addClass('current_turn');
            } else {
                $('#a_seat'+i).removeClass('current_turn');
            }
        }
    });

    // -------------  CLICK AND MOVE LETTERS ----(also in the tile bag event)------------
    $(document).on('click', '.letter_tile', function (event) {
        event.stopPropagation();
        event.stopImmediatePropagation();
        // remove any dashed border on letter tiles. this one was just clicked and should be the only one dashed        
        $('.click_dashed_border').removeClass('click_dashed_border');

        // set the dashed border box for this since its selected by a click
        $(event.target).addClass('click_dashed_border');
    });

    $(document).on('click', '.letter_dropzone', function (event) {
        event.stopPropagation();
        event.stopImmediatePropagation();
        // anything currently clicked?
        if ($('.click_dashed_border').hasClass('click_dashed_border')) {
            letter_tile = document.querySelector('.click_dashed_border');
            dz = document.getElementById(event.target.id);
            start_id = document.querySelector('.click_dashed_border').id

            dz.appendChild(letter_tile);
            socket.emit('server_letter_drop', start_id, event.target.id);
            $('.click_dashed_border').removeClass('click_dashed_border');
        }
    });

    $(document).on('click', function (event) {
        // remove the dashed border on anything letter that was clicked
        event.stopPropagation();
        event.stopImmediatePropagation();
        $('.click_dashed_border').removeClass('click_dashed_border');
    });




    // ------------  SCORE AREAS  (change focus and pressed enter)---------
    $(document).on("focusout", ".score_board", function (event) {
        event.stopPropagation();
        event.stopImmediatePropagation();
        //console.log('Player score focusout id: ', event.target.id.substr((event.target.id.length - 1), 1));
        id = event.target.id.substr((event.target.id.length - 1), 1);
        socket.emit('server_update_scores', id, $('#score_board' + id).val());
    });

    $(document).on("keypress", ".score_board", function (e) {
        event.stopPropagation();
        event.stopImmediatePropagation();
        //console.log('Player score press enter id: ', event.target.id.substr((event.target.id.length - 1), 1));
        id = event.target.id.substr((event.target.id.length - 1), 1);
        var keycode = (e.keyCode ? e.keyCode : e.which);
        if (keycode == '13') { socket.emit('server_update_scores', id, $('#score_board' + id).val()); }
    });



    // -------------  TILE BAG CLICKED ----(and click/move)------------
    $(document).on("click", "#the_bag", function (e) {
        // was this a click/move for a swap or a click for tiles
        event.stopPropagation();
        event.stopImmediatePropagation();
        // anything currently clicked?
        if ($('.click_dashed_border').hasClass('click_dashed_border')) {
            letter_tile = document.querySelector('.click_dashed_border');
            $('.click_dashed_border').removeClass('click_dashed_border');
            if (create_tile_swap_popup()) {
                // populate first tile slot with the letter that was dropped onto the bag           
                document.getElementById('swap0').appendChild(letter_tile);
                $('#' + letter_tile.id).removeClass('letter_drag');
            }            

        } else {  // regular click - get tiles from server
            var player_area = document.querySelector("#pa");
            var rack = player_area.querySelectorAll("div.letter_tile");
            socket.emit('server_request_letter_from_bag', rack.length);

        }
    });


    // ---------------  PICK A SEAT clicked (JOIN TABLE)
    $(document).on("click", ".player_score_header", function (event) {
        // player clicked name button JOIN TABLE; setup the popup to enter name for appropriate seat (1-4)
        event.stopPropagation();
        event.stopImmediatePropagation();
        //console.log('Player seat name id: ', event.target.id.substr((event.target.id.length - 1), 1));
        id = event.target.id.substr((event.target.id.length - 1), 1);
        $('<form id="pnameform' + id + '" class="popup_main_playername" action=""> \
            <input id="pname' + id + '" value="Player ' + id + '" \
            autocomplete="off" class="popup_playername_input" /> \
            <button id="btn_save_playername" class="popup_playername_button_okay">Save</button> \
            <button id="btn_cancel_playername" class="popup_playername_button_cancel">Cancel</button> \
            </form>').appendTo('#pni');

        $('#pname' + id + '').select().focus();

        // disable the join tables so we dont get multiple popups
        for (i = 1; i <= 4; i++) { $('#btnseat' + i).prop("disabled", true); }
    });


    // --------- SUBMIT SAVE PLAYER NAME (JOIN TABLE)---------------------
    $(document).on("submit", ".popup_main_playername", (function (event) {
        // player clicked save button for popup player name form for appropriate seat (1-4)
        // event gives us the ID of the button we can then use for doing the name functions and locking controls
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        if ($(document.activeElement).attr('id') == "btn_save_playername") {
            //console.log('Player form name id: ', event.target.id.substr((event.target.id.length - 1), 1));
            id = event.target.id.substr((event.target.id.length - 1), 1);
            console.log(id);
            if ($('#pname' + id).val() != null) {
                socket.emit('a_player_seated', id, $('#pname' + id).val());
                $('#btnseat' + id).removeClass('btnOpenPlayer');
                $('#btnseat' + id).addClass('btnSeatedPlayer');
                // enable this score area now that someone has sat            
                $('#score_board' + id).prop("disabled", false);
            }
        }
        $('#pnameform' + id).remove();
        for (i = 1; i <= 4; i++) { if ($('#btnseat' + id).hasClass('btnOpenPlayer')) { $('#btnseat' + i).prop("disabled", false); } }
        return false;
    }));


    // -------------   SUBMIT SAVE SWAP TILE --------------
    $(document).on("submit", ".popup_main_swap", (function (event) {
        // player clicked save button for popup player name form for appropriate seat (1-4)
        // event gives us the ID of the button we can then use for doing the name functions and locking controls
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        //console.log('Player form name id: ', event.target.id.substr((event.target.id.length - 1), 1));
        var swap_rack = document.querySelector("#swaptilesholder").querySelectorAll("div.letter_tile");
        if ($(document.activeElement).attr('id') == "btn_save_swap") {
            // request new tiles from server (do first )
            var player_area = document.querySelector("#pa");
            var rack = player_area.querySelectorAll("div.letter_tile");                
            socket.emit('server_request_letter_from_bag', rack.length);

            // send the tiles to server for processing
            swap_rack.forEach(letter_tile => {
                socket.emit('server_swap_this_tile', letter_tile);
            });
            $('#the_bag').prop('disabled', false);
            $('#swaptilesform').remove();            

        } else {
            // return the tiles to the rack                           
            swap_rack.forEach(letter_tile => {
                place_letter_in_open_rack_space(letter_tile);
            });
            $('#the_bag').prop('disabled', false);
            $('#swaptilesform').remove();
        }
    }));




});   //   end of document ready


// Drag and other board Functions
function create_tile_swap_popup() {
    // player dropped a tile on the bag ; id= the letter_tile id
    $('#the_bag').prop('disabled', true);
    // if bag has 7 or more left -    
    if ($("#the_bag").val().substr(4) > 6) {
        // open popup with 7 tile slots and a okay and cancel button
        $('<form id="swaptilesform" class="popup_main_swap" action=""> \
           <div id="swaptilesholder" class="popup_swaptilesholder">').appendTo('#pni');
        for (var i = 0; i < 7; i++) {
            $('<div id="swap' + i + '" class="popup_swaptile_tiles letter_dropzone" ondragover="onDragOver(event)" ondrop="onDragDrop(event)" ondragleave="onDragLeave(event)"></div>').appendTo('#swaptilesholder');
        }
        $('<button id="btn_save_swap" class="popup_swap_button_swap">SWAP</button>').appendTo('#swaptilesholder');
        $('<button id="btn_cancel_swap" class="popup_swap_button_cancel">CANCEL</button>').appendTo('#swaptilesholder');
        $('</div></form>').appendTo('#pni');
        return true;
    }
    return false;
}

function place_letter_in_open_rack_space(letter_tile) {
    var rack = document.querySelectorAll("div.rack");
    for (ind_rack_space of rack) {
        console.log('letter tile', letter_tile);
        if (document.getElementById(ind_rack_space.id).children.length == 0) {
            open_rack_space = document.getElementById(ind_rack_space.id);
            // place the letter in the players rack in an open spot 
            console.log('open rack', open_rack_space);
            $("#" + letter_tile.id).appendTo(open_rack_space);
            break;
        }
    }
}


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
    // ?? eventually to clean up the index.htm
}


//function build_player_name_form() {   // this may not stay and just do the 4 in the playername stuff above
//    $('<form id="pnameform" style="z-index:1000;" action=""><input id="pname" value="Player Name" autocomplete="off" /><button>Save</button></form>').appendTo('#pni');
//}

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
        $('<div id="a_seat'+i+'" class="a_seat"> \
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
    $('#' + event.target.id).addClass('letter_drag');
    return false;
}

function onDragEnter(event) {
    event.preventDefault();
    if ($('#' + event.target.id).hasClass('letter_dropzone')) {
        $('#' + event.target.id).addClass('hovered');
    }
    return false;
}

function onDragOver(event) {
    event.preventDefault();
    return false;
}

function onDragLeave(event) {
    event.preventDefault();
    $('#' + event.target.id).removeClass('hovered');
    return false;
}

function onDragDrop(event) {
    const id = event.dataTransfer.getData('text');
    const draggableElement = document.getElementById(id);
    const dropzone = event.target;
    const dz_id = event.target.id

    // for the tile bag swap
    if (dropzone.classList.contains('bag_dropzone')) {
        if (document.getElementById('swaptilesform') == null) {
            create_tile_swap_popup();
            // populate first tile slot with the letter that was dropped onto the bag           
            document.getElementById('swap0').appendChild(draggableElement);
            
        }
        $('#' + draggableElement.id).removeClass('letter_drag');
        return false;
    }

    if (draggableElement == null || dropzone.classList == '' || dropzone.classList.contains('letter_tile')) {
        
    } else {
        socket.emit('server_letter_drop', id, dz_id);
        dropzone.appendChild(draggableElement);
        $('#' + event.target.id).removeClass('hovered');
        $('#' + draggableElement.id).removeClass('click_dashed_border');
        event.dataTransfer.clearData();
    }
    $('#' + draggableElement.id).removeClass('letter_drag');
    $('#' + draggableElement.id).removeClass('hovered');


}




