/**
 * Created by D on 12/30/2014.
 */
//***THIS SECTION DEALS WITH THE ACTUAL BJ GAME BETWEEN PLAYER AND DEALER***
//this will control both the player, dealer, and deck
//we pass in the userID, total chips, wager for this bet, playerCards as array, and dealer cards as array
function PlayerDealerConstructor(DeckConstructor, CardConstructor, userIDIn, totalIn, wagerIn, playerCardIn, dealerCardIn) {
    //this will be the deck that the dealer distributes cards from (8 decks)
    var superDeck = new DeckConstructor(CardConstructor, 8);

    //STARTING CONDITIONS SET FROM SERVER
    var userID = userIDIn;
    //player chipCount element/chip count
    var chipCount = totalIn; //player starting chip count
    //wager element/wager
    var wagerAmt = wagerIn;
    var playerCards = playerCardIn;
    var dealerCards = dealerCardIn;

    var playerScore, dealerScore;
    var countDealerPendingDelivery = 0;

    //true if game is active, false if game is over
    var activeGame = true;

    //will report on final result of player game | * will also be used to tell if hand is over
    var result = null;

    //this function will count the total score of the player/dealer cards
    var myCount = function (playerNameCards) { //card score counting function
        var score = 0;
        //check every card in playerNameCards
        for (var i = 0; i < playerNameCards.length; i++){
            score += playerNameCards[i].value; //playerNameCards must be a 1D array for this to work
        }
        // this block will properly adjust score to account for aces which can have a 1 or 11 value
        if (score > 21 && aceCount(playerNameCards) > 0) {
            score = score - ((aceCount(playerNameCards) - 1) * 10); //makes all but one ace's value === 1
            if (score > 21) { //if the score is still greater than 21, change last ace's value from 11 to 1
                score = score - 10;
            }
        }
        return score;
    };

    //returns the number of aces in the handArray.  vital to myCount success
    var aceCount = function(deckArray){
        var aces = 0;//number of aces, value to be returned
        for (var i = 0; i < deckArray.length; i++) {
            if (deckArray[i].value === 11) {
                aces += 1;
            }
        }
        return aces;
    };

    //takes an array from superDeck() and returns just the card object
    var giveOneCard = function() {
        //deal one card (in an array) and return that card object
        return superDeck.dealt(1)[0];
    };

    //deals one card to dealer, updates the # of card srcs that need to be passed to client
    var dealDealer = function() {
        var dealtCard = giveOneCard(); //get card from deck
        dealerCards.push(dealtCard); //add card to dealer's hand
        countDealerPendingDelivery += 1;
    };

    var dealPlayer = function() {
        var dealtCard = giveOneCard(); //get card from deck
        playerCards.push(dealtCard); //add card to player's hand
        playerScore = myCount(playerCards); //update score
    };

    //4 functions that handle the four possible game outcomes (for player). result is the amount of chips the dealer
    //hands the player at end of hand.
    var updatePlayerWin = function() {
        result = wagerAmt; //profit
        chipCount += 2 * result; //total chips they get back
    };

    var updatePlayerPush = function() {
        result = 0;
        chipCount += result; //total chips they get back
    };

    var updatePlayerLoss = function(){
        result = -wagerAmt;
    };

    var updatePlayerBlackjack = function() {
        result = wagerAmt * 1.5;
        chipCount += 2.5 * result; //total chips they get back
    };

    //compares the dealer/player scores and determines the winner.  Then rewards winner.
    var scoreAnalyzer = function () {
        playerScore = myCount(playerCards);
        dealerScore = myCount(dealerCards);

        //dealer busts
        if (dealerScore > 21) {
            updatePlayerWin();
        }
        //tie score: push
        else if (dealerScore === playerScore) {
            updatePlayerPush();
        }
        //player has blackjack
        else if (playerScore === 21 && playerCards.length === 2) {
            updatePlayerBlackjack();
        }
        //player has higher score
        else if (dealerScore < playerScore) {
            updatePlayerWin();
        }
        //dealer has higher score/player bust
        else {
            updatePlayerLoss();
        }
    };

    //****THIS IS THE STARTING POINT OF EVERY HAND!!!!!****
    //at the start of each new hand, function will deal two cards to both the player and the dealer and display these
    //card values.  After it will check the player then dealer for blackjack.  Finally it shows the buttons such as
    //"hit", "stand", etc. and determines if split should be visible
    this.dealGame = function() {
        result = null; //used by client to determine if game is still ongoing

        //deal first two cards as 1D array with two card objs
        playerCards = superDeck.dealt(2);
        dealerCards = superDeck.dealt(2);

        playerScore = myCount(playerCards);
        dealerScore = myCount(dealerCards);

        //keep track of # of cards owed to dealer from above
        countDealerPendingDelivery = 2;

        //player blackjack checker
        if (playerScore === 21) {
            runDealer();
        }
        //dealer blackjack checker
        else if(dealerScore === 21){
            runDealer();
        }
    };

    //adds one card and determines if the player has busted/got 21/can still hit
    this.hit = function () {
        //gives player card
        dealPlayer();

        //if have score of 21 or greater after the dealt card then player's turn is over & the dealer will run
        if (myCount(playerCards) >= 21) {
            runDealer();
        }
    };

    //assign this to a stand button
    this.stand = function () {
        runDealer();
    };

    //similar to hit function except that the player can only recieve one card and then it's the dealer's turn
    this.doubleDown = function () {

        //adjust chipCount and wagerAmt for double down bet
        chipCount = chipCount - wagerAmt;
        wagerAmt = wagerAmt * 2;

        //deals player card, updates player score
        dealPlayer();
        //end player turn, run dealer
        runDealer();
    };

    //THIS RUNS WHEN THE PLAYER HAS FINISHED THEIR TURN
    //deals dealer remaining cards, figures out who won, rewards winner, empties player/dealer hands,
    var runDealer = function(){  //this is the dealer's turn

        //checks to make sure player has not busted and that the player does not have blackjack
        if (myCount(playerCards) <= 21 && (myCount(playerCards) !== 21 || playerCards.length > 2)) {
            //add cards until dealer has 17 or greater (delay this animation on the client-side)
            while (myCount(dealerCards) < 17) {
                dealDealer();
            }
        }
        //compares dealer score vs player score, updates scores, and properly compensates winner
        scoreAnalyzer();
        //game is over
        activeGame = false;
        //must remove dealer and player cards later b/c they still need to be added
    };


    //convert card objs array into array of src so it can be easily passed back to client
    function convertToSrc(myArray){
        var length = myArray.length;
        var srcArray =[];
        for (var i=0; i<length; i++) {
            srcArray.push(myArray[i].cardImgSrc);
        }
        return srcArray;
    }

    //THIS GATHERS ALL PERTINENT DATA TO BE SENT TO CLIENT DEPENDING ON IF HAND IS ONGOING OR OVER
    this.getClientData = function(){
        //if hand is ongoing | result tells how much player is owed (null when hand not done)
        if(result ===null){
            return [userID, [dealerCards[0].cardImgSrc, 'img/cardBack.jpg'], convertToSrc(playerCards),
                dealerCards[0].value, playerScore, result];
        } else{ //=='end'
            return [userID, convertToSrc(dealerCards), convertToSrc(playerCards), dealerScore, playerScore, result];
        }
    };


    //THIS GATHERS ALL PERTINENT DATA TO BE SENT TO DB
    //userID, total, wager, playerCards, dealerCards
    this.getDBData = function(){
        if (result === null) {
            return {
                userID: userID,
                total: chipCount,
                wager: wagerAmt,
                playerCards: playerCards,
                dealerCards: dealerCards
            };
        } else { //if @ end hand store player/dealer hands as empty arrays (to be filled on next round)
            return {
                userID: userID,
                total: chipCount,
                wager: wagerAmt,
                playerCards: [],
                dealerCards: []
            };
        }

    };
}

exports.PlayerDealerConstructor = PlayerDealerConstructor;