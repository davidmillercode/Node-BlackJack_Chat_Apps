/**
 * Created by D on 12/30/2014.
 */


//SuperDeck constructor.  +Should hold decks as a 1D array. +Shuffle deck. +Count remaining cards.
// +Remove cards from deck to discard array. +Deal. +Add discard cards to original deck when down to a certain
//number of cards. +Reshuffle deck (don't need to repeat this method).
function SuperDeck(CardConstructor, deckCount){
    //generates dealer card supply
    var discardPile = []; //empty array for dealt cards

    //masterDeck holds all the cards in the dealer's deck (not dealt cards)
    var masterDeck = (function createDeck() {
        var theDeck = [];
        for (var i =0; i < deckCount; i++) { //if more than one deck this loop will iterate and create x decks
            for (var j = 0; j < 13; j++) { //creates one deck of 52 cards
                for (var k = 0; k < 4; k++) {
                    theDeck[theDeck.length] = new CardConstructor(j, k);
                }
            }
        }
        return theDeck;
    })();

    //shuffles deck
    function shuffleCards() {
        masterDeck.sort(function(a, b){ return 0.5-Math.random(); }); //randomizes the sort
    }
    shuffleCards();

    //this function removes cards from masterDeck and returns them.  It also updates the discardPile and will
    //add the discardPile back to the masterDeck once the masterDeck is too low to deal from
    this.dealt = function dealt(numCards){
        var dealtCards = []; //will reset dealtCards each time dealt is called.  these are cards to be dealt this turn
        var poppedCard; //will hold one popped card and is then reset on every for loop iteration

        //places cards in dealtCards and returns them. Also keeps track of discard pile and if the masterDeck is
        //more than 75% finished, it adds discardPile back in and reshuffles
        for (var i=0; i < numCards; i++) {
            poppedCard = masterDeck.pop(); //one card obj removed from end of masterDeck
            dealtCards.push(poppedCard); //adds to dealt cards pile
            discardPile.push(poppedCard); //adds to discard pile to keep track of dealt (reference)
        }
        //if deck is below 25% of initial cards we need to reshuffle old cards into masterDeck
        if (masterDeck.length / (masterDeck.length + discardPile.length) <= 0.25) {
            masterDeck = masterDeck.concat(discardPile); //makes new deck
            shuffleCards(); //now new deck is shuffled and ready to go
        }
        return dealtCards; //gives someone x cards in an array
    };
}

exports.DeckConstructor = SuperDeck;