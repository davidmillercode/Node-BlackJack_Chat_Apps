

//First hand dealt housekeeping
hideButtons();
document.getElementById("one_more_hand_button").style.visibility = "hidden";
document.getElementById("chip_count").value = 1000;


//set userID after first hand, which will be used to keep track of the player on the server
var encodedUserID;
//keeps track of how many cards the dealer and player are holding
var dealCardNumb= 0, playCardNumb= 0;

//get nickname or if none provided ask again
function getNick(){
    var person = prompt("Please enter your name", "Anonymous");
    if (person != null) {
        return person;
    }
    else{
        setTimeout(getNick, 0);
    }
}
//ALL GAME ACTIONS WILL RECEIVE AN ARRAY W/ 6 ELEMENTS FROM SERVER
//[0]==User ID; [1]==array of cards the dealer holds represented by srcs; [2]==player equiv of [1];
//[3]==dealer score; [4]==player score; [5]==chips to be given to players(null until end)

//this will be the function to be triggered on the first press of begin game button
//will get two cards for the player and two cards for the dealer and update their scores and graphics
function startGame() {
    //lock: wager;  hide: startButton; scroll to center for mobile devices***
    document.getElementById('wager_amt').disabled = true;
    document.getElementById("start_button").style.visibility = "hidden";

    //get wager amount
    var wagerAmt = +document.getElementById('wager_amt').value;
    //if bet is bigger than total tell user they cannot do this and show the start button/unlock wager textbox
    if (wagerAmt > 1000){
        alert('Your bet cannot be greater than all your chips!');
        //return to original settings
        document.getElementById('wager_amt').disabled = false;
        document.getElementById("start_button").style.visibility = "visible";
        return;
    }

    //ask for nickname
    var nickname = encodeURIComponent(getNick());
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET","/start?name=" + nickname + "&wager=" + wagerAmt, true);
    //this will receive a JSON string
    xmlhttp.onreadystatechange = function(){
        // if no blackjack-> receive userID, dealer cards, player cards, dealer 1-card score, player score
        // set: userID; display: play/deal cards, scores; show: hit,stand,doubledown
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200){
            // handle JSON data
            var data205 = JSON.parse(xmlhttp.responseText);
            encodedUserID = encodeURIComponent(data205[0]);

            var winnings = data205[5];
            if (winnings === null){ //this means that game is not over (no BJ)
                var dealerCardsArray205 = data205[1];
                var playerCardsArray205 = data205[2];
                var dealerScore205 = data205[3];
                var playerScore205 = data205[4];

                updateDealer(dealerCardsArray205, dealerScore205); // display: play/deal cards, scores
                updatePlayer(playerCardsArray205, playerScore205);
                // show: hit,stand,doubledown (if wager amount isn't more than chip total)
                showButtons(wagerAmt);

            } else{ //means someone got BJ
                endGame(data205, true);
            }
        }
    };
    xmlhttp.send();
}

//stand function
function stand(){
    hideButtons();
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET","/stand?ID=" + encodedUserID, true);
    //this will receive a JSON string
    xmlhttp.onreadystatechange = function(){
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200){
            var data = JSON.parse(xmlhttp.responseText);
            endGame(data);
        }
    };
    xmlhttp.send();
}

//hit function
function hit(){
    hideButtons('doubleDown');
    //need if logic where in one case it gets told that it can keep hitting/stand and in case 2 it calls endGame

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET","/hit?ID=" + encodedUserID, true);

    //this will receive a JSON string
    xmlhttp.onreadystatechange = function(){
        //if user hasn't gotten 21 or more
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200){
            var hitData = JSON.parse(xmlhttp.responseText);
            var winnings = hitData[5];

            if(winnings=== null){ //then the player has 20 or under and can hit again
                var playerCards = hitData[2];
                var playerScore = hitData[4];
                updatePlayer(playerCards, playerScore);
            } else{
                endGame(hitData);
            }
        }
    };
    xmlhttp.send();
}

//doubleDown function (only visible when user can double)
function doubleDown(){
    var wagerAmt = +document.getElementById('wager_amt').value;
    var chipCount = +document.getElementById('chip_count').value;
    if (chipCount < wagerAmt*2){
        alert('You do not have enough chips to make this bet.');
        hideButtons('double down button');
        return;
    }
    hideButtons();
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET","/doubledown?ID=" + encodedUserID, true);
    //this will receive a JSON string
    xmlhttp.onreadystatechange = function(){
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200){
            var data = JSON.parse(xmlhttp.responseText);
            endGame(data);
        }
    };
    xmlhttp.send();
}

//function playAgain
function playAgain(){
    document.getElementById('wager_amt').disabled = true;
    document.getElementById("one_more_hand_button").style.visibility = "hidden"; //play again button
    var wagerAmt = +document.getElementById('wager_amt').value;
    var chipCount = +document.getElementById('chip_count').value;

    //if bet is bigger than total tell user they cannot do this and show the start button/unlock wager textbox
    if (wagerAmt > chipCount){
        alert('Your bet cannot be greater than all your chips!');
        //return to original settings
        document.getElementById('wager_amt').disabled = false;
        document.getElementById("one_more_hand_button").style.visibility = "visible";
        return;
    }

    //clear cards that are on table
    clearTable();

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET","/playagain?ID=" + encodedUserID + "&wager=" + wagerAmt, true);
    //this will receive a JSON string
    xmlhttp.onreadystatechange = function() {
        // if no blackjack-> receive userID, dealer cards, player cards, dealer 1-card score, player score
        // set: userID; display: play/deal cards, scores; show: hit,stand,doubledown
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            // handle JSON data

            var data270 = JSON.parse(xmlhttp.responseText);
            var winnings = data270[5]; //if winnings === null then the game is still active

            if(winnings===null){    //game is still active
                var dealerCardsArray270 = data270[1];
                var playerCardsArray270 = data270[2];
                var dealerScore270 = data270[3];
                var playerScore270 = data270[4];

                // display: play/deal cards, scores
                updateDealer(dealerCardsArray270, dealerScore270);
                updatePlayer(playerCardsArray270, playerScore270);


                // show: hit,stand,doubledown (if wager amount isn't more than chip total)
                showButtons(wagerAmt);
            } else{    //someone got BJ
                endGame(data270, true);
            }
        }
    };
    xmlhttp.send();
}

//end game function with different outcomes depending on which function calls it
//isBlackjack is true when player or dealer blackjack happens
//dataArray's first element is userID
function endGame(dataArray, bJ){
    hideButtons();

    var dealerCardsArray = dataArray[1];
    var playerCardsArray = dataArray[2];
    var dealerScore = dataArray[3];
    var playerScore = dataArray[4];
    var chipsWon = dataArray[5];

    if (!bJ) { //if there is no BJ remove card, if there is BJ, then both dealer cards dealt face up so no remove
        //remove face-down card + subtract one from dealCardNumb to show that only one dealer card is showing now
        unCoverDealerCard();
    }

    // display: play/deal cards, scores, winning amt, newTotal
    updateDealer(dealerCardsArray, dealerScore);
    updatePlayer(playerCardsArray, playerScore);

    //**** need to do graphic for showing chips won still****
    showWinnings();
    updateChipCount(chipsWon);
    dealCardNumb=0;
    playCardNumb=0;

    // show:playAgainButton;
    showPlayButton();
    //allow user to enter wager
    document.getElementById('wager_amt').disabled = false;
}

/***************************************************
 * GRAPHICS UPDATES
 ***************************************************/
//dealerCardElement and playerCardElement are the divs that hold the card images
var dealerCardElement = document.getElementById("dealer_card_images");
var playerCardElement = document.getElementById("player_card_images");

//show player cards and update score (ALSO keep track of the number of cards that have been added)
function updatePlayer(cardArray, score){
    var numCardsToAdd = cardArray.length - playCardNumb; //add all NEW cards
    var startingIndex = playCardNumb; //not redundant
    //add card images
    for (var i =0; i<numCardsToAdd; i++){
        var img = document.createElement("img");
        img.src = cardArray[i + startingIndex]; //add only new cards
        img.style.height = "100%"; //100% of container
        document.getElementById("player_card_images").appendChild(img);
        moveCardLeft(img);
        playCardNumb += 1;
    }

    //update score
    document.getElementById("user_score").value = score;

}

//show dealer cards and update score (ALSO keep track of the number of cards that have been added)
function updateDealer(cardArray, score){
    var numCardsToAdd = cardArray.length - dealCardNumb; //add all NEW cards
    var startingIndex = dealCardNumb;  //not redundant
    //add card images
    for (var i =0; i < numCardsToAdd; i++){
        var img = document.createElement("img");
        img.src = cardArray[i + startingIndex]; //will start adding from the first card that hasn't been displayed
        img.style.height = "100%"; //100% of container
        document.getElementById("dealer_card_images").appendChild(img);
        moveCardLeft(img);
        dealCardNumb +=1;
    }


    //update score
    document.getElementById("dealer_score").value = score;

}

// move the card to the left partially over the other card next to it if not the first card added
function moveCardLeft(img){
    //if not the first card, move slightly to left
    if (img.parentNode.childNodes[0] != img) {
        img.style.marginLeft = "-55px";
    }
}

//remove face-down card from dealer pile
function unCoverDealerCard(){
    dealerCardElement.removeChild(dealerCardElement.lastChild);
    dealCardNumb = dealCardNumb-1; //this will let the program know that one less card is graphically displayed
}

function clearTable(){
    //delete previously dealt cards until div is empty
    while (dealerCardElement.childNodes.length > 0) {
        dealerCardElement.removeChild(dealerCardElement.childNodes[0]);
    }
    while (playerCardElement.childNodes.length > 0) {
        playerCardElement.removeChild(playerCardElement.childNodes[0]);
    }
}

// show buttons(hit,stand,doubledown)
function showButtons(initialWager){

    document.getElementById('stand_button').style.visibility = "visible";
    document.getElementById('hit_button').style.visibility = "visible";
    //show double_down_button only if player has enough chips left to make a second bet (recheck on server)
    if (+document.getElementById("chip_count").value >= initialWager){
        document.getElementById('double_down_button').style.visibility = "visible";
    }
}

// hide buttons(hit, stand, doubledown)
function hideButtons(whichButton){
    //if no parameter given hide all
    if (!whichButton){
        document.getElementById('stand_button').style.visibility = "hidden";
        document.getElementById('hit_button').style.visibility = "hidden";
        document.getElementById('double_down_button').style.visibility = "hidden";
    }
    //otherwise hide just the double_down_button
    else {
        document.getElementById('double_down_button').style.visibility = "hidden";
    }
}

//show playAgainButton
function showPlayButton(){
    document.getElementById("one_more_hand_button").style.visibility = "visible";
}

//show winnings(losings)
function showWinnings(){
    //add small graphic in center of player cards saying (Lost x / Won x)
}

//update total chips
function updateChipCount(chipsWon){
    document.getElementById("chip_count").value= +document.getElementById("chip_count").value + chipsWon;
}

/***************************************************
 * EVENT LISTENERS
 ***************************************************/
var EventUtil = {
    getEvent: function(event) {
        return event ? event : window.event;
    },
    getCharCode: function(event) {
        if (typeof event.charCode == "number"){
            return event.charCode;
        } else {
            return event.keyCode;
        }
    },
    preventDefault: function(event){
        if(event.preventDefault){
            event.preventDefault();
        } else {
            event.returnValue = false;
        }
    }
};

function wagerHandler(event){
    event = EventUtil.getEvent();
    var charCode = EventUtil.getCharCode(event);
    //if 1. is not a # and 2. is not a special character(like backspace) and 3. is not the control key...
    //it will not run.  Only want #s or pasted inputted
    if(!/\d/.test(String.fromCharCode(charCode)) && charCode > 9 && !event.ctrlKey) {
        EventUtil.preventDefault(event); //prevents text from being entered
    }
}

$('#wager_amt').keypress(function(event){wagerHandler(event);});
$('#start_button').one('click', startGame);
$('#stand_button').on('click', stand);
$('#one_more_hand_button').on('click', playAgain);
$('#hit_button').on('click', hit);
$('#double_down_button').on('click', doubleDown);
