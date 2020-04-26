// Dependencies
var express = require("express");
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http, { 'pingInterval': 2000, 'pingTimeout': 5000 });
var port = process.env.PORT || 8080;


// EXPRESS WEB SERVER
app.use('/public', express.static(__dirname + '/public'));
app.use("/images", express.static(__dirname + '/images'));
app.use("/", express.static(__dirname + '/'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

http.listen(port, function () {
  console.log('listening on *:' + port);
});

// the SOCKET handlers
io.on('connection', function (socket) {
  // --------
  socket.emit('client_clear_all_letters');
  send_updates_to_connections();

  // --------
  socket.on('disconnect', function () {
    console.log('user disconnected:', socket.id);
    //if we lose a player clear their socket from the seats object
    seat.forEach(item => {
      if (item.socket == socket.id) {
        // change the player name back to the default
        item.name = 'JOIN TABLE';
      }
    });

    // update the seat names and colors
    io.emit('update_seat_info', seat);

  });

  // --------
  socket.on('server_request_letter_from_bag', function (num_tiles_in_rack) {
    // bag was clicked request    
    // do this as many times as needed to get player rack to 7, or as many as the bag has if under 7



    // move the PLAYER TURN to the next active player
    find_next_turn();
    console.log('current player is now:', server_current_player);
    io.emit('client_update_next_turn', server_current_player);



    for (i = num_tiles_in_rack; i < 7; i++) {
      if (letter_bag.length > 0) {
        the_letter = letter_bag.shift();
        socket.emit('client_place_letter_in_open_rack_space', the_letter);

        // add to this seat rack array - based on current socket.id
        seat.forEach(item => {
          if (item.socket == socket.id) {
            // change add this tile to the seat rack
            item.letters_in_rack.push(the_letter.id)
            //console.log('give letter to seat rack',the_letter.id);

          }
        });
        // tell everyone how many tiles left
        io.emit('client_update_tile_bag_remaining', letter_bag.length);
      }
    }

  });

  socket.on('server_swap_this_tile', function (letter_tile) {
    // add tile back to the array
    console.log('bag before push', letter_bag.length);
    letter_bag.push(letter_tile);
    console.log('bag after push', letter_bag.length);
    //shuffle array
    letter_bag = shuffle(letter_bag);
    console.log('bag after shuffle', letter_bag.length);
    // update bag remaining
    io.emit('client_update_tile_bag_remaining', letter_bag.length);
  });


  // --------  
  socket.on('a_player_seated', function (seat_number, player_name) {   // a player chose a name
    // set an object for this seat with socket.id, rack tiles this seat has, and chosen player name       
    if (seat[seat_number] == null) {
      seat[seat_number] = { socket: socket.id, name: player_name, letters_in_rack: [], score: '0' };
    } else {
      seat[seat_number].socket = socket.id;
      seat[seat_number].name = player_name;
      // send client on this socket the old rack information      
      seat[seat_number].letters_in_rack.forEach(rack_item => {
        //console.log('for each letter in the rack array');
        // lookup the tile        
        tile_library.forEach(letter_item => {
          if (letter_item.id == rack_item) {
            //socket.broadcast.emit('place_letter', letter_item, dz_id);   
            socket.emit('client_place_letter_in_open_rack_space', (letter_item));
          }
        });
      });
    }
    // update seat names
    io.emit('update_seat_info', seat);
  });

  // --------
  socket.on('server_update_scores', function (seat_number, score) {
    // used when a score field loses focus or enter is hit
    // will check old value and if different will send update to the seats
    console.log('seat and score', seat_number, score);
    if (seat[seat_number] != null) {
      console.log('seat not null');
      if (seat[seat_number].score != score) {
        console.log('seat number score != score');
        seat[seat_number].score = score;
        io.emit('update_seat_info', seat);
      }
    }
  });

  // --------
  socket.on('server_letter_drop', function (id, dz_id) {
    // need the letter tile info and the drop zone id    
    tile_library.forEach(item => {
      if (item.id == id) {
        socket.broadcast.emit('place_letter', item, dz_id);
      }
    });

    // need to update the letter location and clear out old entry
    for (var i = 0; i < 225; i++) {
      if (serverside_board['dz' + i] == id) {
        // we have the location
        serverside_board['dz' + i] = 'empty';
        //console.log('dz board item updated');
      }
    };

    // add to the board
    serverside_board[dz_id] = id;

    // if this letter wasnt already on the board we need to check the seat racks  
    // was this current tile in a rack? if so remove it from the rack of this seat    
    seat.forEach(item => {
      item.letters_in_rack.forEach(rack_item => {
        if (rack_item == id) {
          removeA(item.letters_in_rack, rack_item);
        }
      });
    });
  });

  // --------  
  socket.on('server_reset_game', function () {
    // reset the game board array
    serverside_board = create_serverside_board();
    // reset the tile bag
    letter_bag = shuffle(create_all_tiles());
    // clear some of the seat info. we want to still keep the socket and player name
    seat.forEach(item => {
      item.letters_in_rack = [];
      item.score = '0';
    });

    // tell clients to clear the board of letters
    io.emit('client_clear_all_letters');
    send_updates_to_connections();

  });

  // --------
  function send_updates_to_connections() {
    console.log('a user connected:', socket.id);

    // show me seats test
    seat.forEach(item => {
      console.log('--- SEAT DATA ---');
      console.log(item);
      console.log('-----------------');
    });

    // send new player connection on this socket the board -   
    for (var i = 0; i < 225; i++) {
      if (serverside_board['dz' + i] != null) {
        if (serverside_board['dz' + i] != 'empty') {
          tile_library.forEach(item => {
            if (item.id == serverside_board['dz' + i]) {
              letter_tile = item;
            }
          });
          io.emit('place_letter', letter_tile, getKeyByValue(serverside_board, serverside_board['dz' + i]));
        }
      }
    }
    // seat names and scores
    io.emit('update_seat_info', seat);
    //update tile bag remaining 
    io.emit('client_update_tile_bag_remaining', letter_bag.length);

  }

  function find_next_turn() {
    // let people know who is the next turn
    for (i = 1; i <= 4; i++) {
      if (seat[i] != null) {
        if (seat[i].socket == socket.id) {
          if (letter_bag.length == '100') {
            server_current_player = i;
          } else {
            if (server_current_player == i) {
              var done = false;
              var player_count = 0;
              seat.forEach(item => {
                if (item.player_name != 'JOIN TABLE') {
                  player_count++;
                }
              });


              // start the new_ball one plus the current ball and check it for valid player                        
              var new_ball = server_current_player + 1; {
                if (new_ball == 5) new_ball = 1;
              }
              //console.log('new ball0:', new_ball);
              if (player_count != 1) {
                while (!done) {
                  // can i accept having the ball
                  if (server_current_player != 1 && new_ball == 1 && seat[1] != null && seat[1].name != 'JOIN TABLE') {
                    //console.log('not null');
                    server_current_player = 1;
                    done = true;
                    break;
                  } else {
                    // i cant or dont have the ball - pass it on to my buddy
                    new_ball = 2;
                    console.log('new ball1:', new_ball);
                  }

                  if (server_current_player < 2 && new_ball == 2 && seat[2] != null && seat[2].name != 'JOIN TABLE') {
                    console.log('playername', seat[2].name);
                    server_current_player = 2;
                    done = true;
                    break;
                  } else {
                    // i cant or dont have the ball - pass it on to my buddy
                    new_ball = 3;
                    console.log('new ball2:', new_ball);
                  }

                  if (server_current_player < 3 && new_ball == 3 && seat[3] != null && seat[3].name != 'JOIN TABLE') {
                    //console.log('not null');
                    server_current_player = 3;
                    done = true;
                    break;
                  } else {
                    // i cant or dont have the ball - pass it on to my buddy
                    new_ball = 4;
                    console.log('new ball3:', new_ball);
                  }

                  if (server_current_player < 4 && new_ball == 4 && seat[4] != null && seat[4].name != 'JOIN TABLE') {
                    //console.log('not null');
                    server_current_player = 4;
                    done = true;
                    break;
                  } else {
                    // i cant or dont have the ball - pass it on to my buddy
                    new_ball = 1;
                    console.log('new ball4:', new_ball);
                  }
                }
              } else {
                console.log('dump out', player_count);
                server_current_player = i;
              }
            }
          }
        }
      }
    }
  }

});  // END SOCKET


// -----------------  FUNCTIONS (that don't use SOCKET)

var create_serverside_board = function () {
  let array = [];
  for (var i = 0; i < 225; i++) {
    array['dz' + i] = 'empty';
  }
  return array;
}

var create_all_tiles = function () {
  let all_tiles = [];

  for (let i = 0; i < 12; i++) { all_tiles.push({ id: 'E' + i, url: '/images/letters/E.png' }); } // 12 E's 
  for (let i = 0; i < 9; i++) { all_tiles.push({ id: 'A' + i, url: '/images/letters/A.png' }); } // 9 A's 
  for (let i = 0; i < 9; i++) { all_tiles.push({ id: 'I' + i, url: '/images/letters/I.png' }); } // 9 I's 
  for (let i = 0; i < 8; i++) { all_tiles.push({ id: 'O' + i, url: '/images/letters/O.png' }); } // 8 O's 
  for (let i = 0; i < 6; i++) { all_tiles.push({ id: 'N' + i, url: '/images/letters/N.png' }); } // 6 N's 
  for (let i = 0; i < 6; i++) { all_tiles.push({ id: 'R' + i, url: '/images/letters/R.png' }); } // 6 R's 
  for (let i = 0; i < 6; i++) { all_tiles.push({ id: 'T' + i, url: '/images/letters/T.png' }); } // 6 T's 
  for (let i = 0; i < 4; i++) { all_tiles.push({ id: 'L' + i, url: '/images/letters/L.png' }); } // 4 L's 
  for (let i = 0; i < 4; i++) { all_tiles.push({ id: 'S' + i, url: '/images/letters/S.png' }); } // 4 S's 
  for (let i = 0; i < 4; i++) { all_tiles.push({ id: 'U' + i, url: '/images/letters/U.png' }); } // 4 U's 
  for (let i = 0; i < 4; i++) { all_tiles.push({ id: 'D' + i, url: '/images/letters/D.png' }); } // 4 D's 
  for (let i = 0; i < 3; i++) { all_tiles.push({ id: 'G' + i, url: '/images/letters/G.png' }); } // 3 G's 
  for (let i = 0; i < 2; i++) { all_tiles.push({ id: 'B' + i, url: '/images/letters/B.png' }); } // 2 B's 
  for (let i = 0; i < 2; i++) { all_tiles.push({ id: 'C' + i, url: '/images/letters/C.png' }); } // 2 C's 
  for (let i = 0; i < 2; i++) { all_tiles.push({ id: 'M' + i, url: '/images/letters/M.png' }); } // 2 M's 
  for (let i = 0; i < 2; i++) { all_tiles.push({ id: 'P' + i, url: '/images/letters/P.png' }); } // 2 P's 
  for (let i = 0; i < 2; i++) { all_tiles.push({ id: 'F' + i, url: '/images/letters/F.png' }); } // 2 F's 
  for (let i = 0; i < 2; i++) { all_tiles.push({ id: 'H' + i, url: '/images/letters/H.png' }); } // 2 H's 
  for (let i = 0; i < 2; i++) { all_tiles.push({ id: 'V' + i, url: '/images/letters/V.png' }); } // 2 V's 
  for (let i = 0; i < 2; i++) { all_tiles.push({ id: 'W' + i, url: '/images/letters/W.png' }); } // 2 W's 
  for (let i = 0; i < 2; i++) { all_tiles.push({ id: 'Y' + i, url: '/images/letters/Y.png' }); } // 2 Y's 
  for (let i = 0; i < 2; i++) { all_tiles.push({ id: 'BLANK' + i, url: '/images/letters/BLANK.png' }); } // 2 BLANK's 
  all_tiles.push({ id: 'K1', url: '/images/letters/K.png' }); // 1 K
  all_tiles.push({ id: 'J1', url: '/images/letters/J.png' }); // 1 J
  all_tiles.push({ id: 'X1', url: '/images/letters/X.png' }); // 1 X
  all_tiles.push({ id: 'Q1', url: '/images/letters/Q.png' }); // 1 Q
  all_tiles.push({ id: 'Z1', url: '/images/letters/Z.png' }); // 1 Z

  return all_tiles;
};

var shuffle = function (array) {
  var currentIndex = array.length;
  var temporaryValue, randomIndex;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
};

var filter = function (array) {
  const arrFiltered = array.filter(el => {
    return el != null && el != '';
  });
  return arrFiltered;
};

function removeA(arr) {
  var what, a = arguments, L = a.length, ax;
  while (L > 1 && arr.length) {
    what = a[--L];
    while ((ax = arr.indexOf(what)) !== -1) {
      arr.splice(ax, 1);
    }
  }
  return arr;
}

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}


// ---------------------------    INIT 
var serverside_board = create_serverside_board();
var tile_library = create_all_tiles();
var letter_bag = shuffle(create_all_tiles());
var seat = [];
var server_current_player;


