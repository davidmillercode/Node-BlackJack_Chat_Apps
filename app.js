/**
 * Created by D on 1/23/2015.
 */
var express = require('express');
var app= express();
var hbs = require('hbs'); //get handlebars
var bodyParser = require('body-parser');
var http = require('http').Server(app),
    mongoose = require('mongoose'),
    port = process.env.PORT || 8080;
var io = require('socket.io')(http);

//GET LOCAL MODULES
//get Card Constructor
var Card = require('./cardConstructor.js').CardConstructor;
//get Deck Constructor
var Deck = require('./deckConstructor.js').DeckConstructor;
//get Player Dealer Constructor
var PlayerDealer = require('./PlayerDealerConstructor.js').PlayerDealerConstructor;
var highScorers=[]; //this is an array of objs w/ score, name of topscorers


//DB INITIALIZATION
// create db schema, connect to db
var Schema = mongoose.Schema;
var bjSchema,
    Player;

mongoose.connect(process.env.MONGO_URL); //connect to DB on Modulus
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    bjSchema = new Schema(
        {
            userID: String,
            total: Number,
            wager: Number,
            playerCards: Array,
            dealerCards: Array
        }
    );
    Player = mongoose.model('OnePlayerDoc', bjSchema);
});

//GENERATE SERVER W/ EXPRESS
//.set() makes html dynamic
app.set('view engine', 'html');
//fires up the engine
app.engine('html', hbs.__express);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); //will look in public folder first for css files

app.get('/', function(req, res) {
    res.render('index', {highscorers: highScorers});
});
app.get('/chat', function(req, res){
    res.render('chat');
});

//BJ EVENTS TO HANDLE
app.get('/playagain', function(req, response){
    getTopThree(); //updates who the top three scorers are
    playAgainResponse(response, req.query);

});

app.get('/hit', function(req, response){
    hitResponse(response, req.query);
});

app.get('/stand', function(req, response){
    standResponse(response, req.query);
});

app.get('/doubledown', function(req, response){
    doubleDownResponse(response, req.query);
});

app.get('/start', function(req, response){
    startResponse(response, req.query);
});

http.listen(port);

//
//SERVER METHODS
function startResponse(response, queryResult){
    //give player unique userID from chosen nickname + check that it is (max 11char str) otherwise change to 'anonymous'
    var userID;
    var wager = +queryResult.wager;
    //make sure player has enough chips to make their bet, if they do not make their bet equal to all their chips
    if (wager > 1000){
        wager = 1000;
    }
    if (typeof queryResult.name == 'string' && queryResult.name.length <= 11) {
        userID = queryResult.name + (Math.floor(Math.random() * 1000000000));
    } else {
        userID = 'anonymous' + (Math.floor(Math.random() * 1000000000));
    }

    //brain obj controls all actions in the game such as keeping score, dealing cards, & tracking player's profits
    //to see list of methods view 'PlayerDealerConstructor.js'
    var tempBrain = new PlayerDealer(Deck, Card, userID, 1000 - wager, wager, [], []);

    //deal cards: this will start the game
    tempBrain.dealGame();

    //get the client data
    var clientData = tempBrain.getClientData();

    //send JSON str to client
    response.send(clientData);

    //now send the data to the db
    var dataToStore = tempBrain.getDBData();
    var playerToAdd = new Player(dataToStore);
    //save to DB
    playerToAdd.save(function(err){
        if(err){console.log('error');}
    });
}

//THIS WILL BE CALLED TO GET THE DATA FROM THE DB FOR SPECIFIC USER
function queryDBData(ID, handleCommand) {
    var query = Player.findOne({userID: ID});
    query.select('userID total wager playerCards dealerCards');
    //return array of values
    query.exec(function(err, player) {
        var data = [ID, player.total, player.wager, player.playerCards, player.dealerCards];
        handleCommand(data);
    });
}

//Gets top 3 player scores and sends to user at end of their turn
function getTopThree(){
    //sort according to total and get only top 3
    var sortedQuery = Player.find().sort({total: 'desc'}).limit(3);
    //Only want to look at userID and total
    sortedQuery.select('userID total');
    sortedQuery.exec(function(err, top3){
        var topScorersArray = []; //[name, score] for all three top scorers in one array
        for (var i=0; i<top3.length; i++){
            var scorerName = top3[i].userID.slice(0, 12); //get first twelve characters of name
            topScorersArray.push({name: scorerName, score: top3[i].total});
        }
        highScorers = topScorersArray; //set new high scorers
    });

}

function doubleDownResponse(response, queryResult){
    var id= queryResult.ID;

    var passToAsync = function(data){
        //create player obj from data
        var tempBrain = new PlayerDealer(Deck, Card, data[0], data[1], data[2], data[3], data[4]);

        //run dealer double down method
        tempBrain.doubleDown();

        //get data for client + DB
        var clientData = tempBrain.getClientData();
        var dbData = tempBrain.getDBData();

        //pass info to client
        response.send(clientData);

        //update DB
        Player.findOneAndUpdate({userID: id}, dbData, {upsert: true, new: true}, function(data){});
    };

    //query db for ID match
    queryDBData(id, passToAsync);

}

function hitResponse(response, queryResult){
    var id= queryResult.ID;
    //query db for ID match
    var passToAsync = function(data){
        //create player obj from data
        var tempBrain = new PlayerDealer(Deck, Card, data[0], data[1], data[2], data[3], data[4]);

        //run hit method
        tempBrain.hit();

        //get data for client + DB
        var clientData = tempBrain.getClientData();
        var dbData = tempBrain.getDBData();

        response.send(clientData);

        //update DB
        Player.findOneAndUpdate({userID: id}, dbData, {upsert: true, new: true}, function(data){});

    };
    queryDBData(id, passToAsync);
}

function standResponse(response, queryResult){
    var id= queryResult.ID;
    var dataToHandle = function(data) {
        //create player obj from data
        var tempBrain = new PlayerDealer(Deck, Card, data[0], data[1], data[2], data[3], data[4]);

        //run hit method
        tempBrain.stand();

        //get data for client + DB
        var clientData = tempBrain.getClientData();
        var dbData = tempBrain.getDBData();

        response.send(clientData);

        //update DB
        Player.findOneAndUpdate({userID: id}, dbData, {upsert: true, new: true}, function(data){});
    };

    //query db for ID match
    queryDBData(id, dataToHandle);
}

function playAgainResponse(response, queryResult){
    var id= queryResult.ID;
    var wager = +queryResult.wager;

    var dataToHandle = function(data){
        //make sure player has enough chips to make their bet, if they do not make their bet equal to all their chips
        if (wager > data[1]){
            wager = data[1];
        }
        //create player obj from DB data
        var tempBrain = new PlayerDealer(Deck, Card, data[0], data[1] - wager, wager, [], []);

        //run hit method
        tempBrain.dealGame();

        //get data for client + DB
        var clientData = tempBrain.getClientData();
        var dbData = tempBrain.getDBData();

        response.send(clientData);

        //update DB
        Player.findOneAndUpdate({userID: id}, dbData, {upsert: true, new: true}, function(data){});
    };

    //query db for ID match
    queryDBData(id, dataToHandle);
}

//
//SOCKET I/O
var users={'undefined': '', 'null': ''}; //finds socket id by name (undefined/null just prevent user from choosing)
var clients={}; //finds name by socket id

io.on('connection', function(socket){ //on user connection (persistent)
    //1.) Receive socket question on whether the nickname they have chosen is unique
    //****a.)if unique name, send back message to socket confirming this + tell all other connected new user joined
    //****** and add name + socket.id to users/clients variables so we know whom is connected
    //****b.)if !unique name, send back message to socket that name is taken + have socket try a different name
    socket.on('nameCheck', function(name) {
        var wasItFound; //bool to track if name found

        var tempName = name.toLowerCase();
        //if name not found in usedNicks array, add it to array and change bool var to false
        if (!users[tempName]) {
            wasItFound = false;
            //now add the name and this socketID to users hash
            users[tempName]= socket.id;
            clients[socket.id]=tempName;
            socket.emit('checkedName', wasItFound);
            socket.broadcast.emit('notice', {style: {'font-style':'italic', 'color':'#38f'}, msg: name + ' has joined the chatroom.'});
        }else{
            wasItFound = true; //says nick was found in use/wasn't a string
            //emit the event and if the nick it was found
            socket.emit('checkedName', wasItFound);
        }
    });

    //2.) Receive socket request to send out message
    //****a.) if it is a private message, only send to the specified user | if user not found tell socket this
    //****b.) if normal message, send out message to all sockets except sender
    socket.on('send', function(dataObj) {
        //emit message event w/ data
        var data = dataObj.data;
        if(dataObj.type == 'pm'){ //if this is a private message only send to recipient
            //search users to see if name is found, if so assign recieverID to user's socketID
            var receiverID = users[data.recipient.toLowerCase()];
            if (receiverID){ //if user is found to receive msg
                io.to(receiverID).emit('msg', data);

            }else{//tell sender that user wasn't found to recieve msg
                socket.emit('notice', {style: {'font-style': 'normal', 'color':'red'},
                    msg: data.recipient + ' was not found'});
            }

        }else {
            socket.broadcast.emit('msg', data); //send msg to all
        }
    });

    //3.) Recieve socket request for list of connected members + emit notice with members' names
    socket.on('members', function(){
        var userList=[];
        for (var key in clients){
            if (clients.hasOwnProperty(key)){ //if part of original obj (not proto)
                userList.push(' ' + clients[key]);
            }
        }
        socket.emit('notice', {style: {}, msg: userList});
    });

    //4.) Clean up users when they leave + send notice that the user has left the room to connected sockets
    socket.on('disconnect', function () {
        if (clients[socket.id] != undefined){ //when user enters wrong name they get undefined label (this wont send if so)
            socket.broadcast.emit('notice', {style: {'font-style': 'italic', 'color': '#3d8'},
                msg: clients[socket.id] + ' has left the room.'});
            delete users[clients[socket.id]]; //find name then delete connection
            delete clients[socket.id]; // remove connected user & socket.id
        }
    });
});
