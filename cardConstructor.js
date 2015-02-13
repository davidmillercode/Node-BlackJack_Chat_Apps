/**
 * Created by D on 12/30/2014.
 */
//card constructor
function Card(cardId, suit) { //card constructor 0=2, 12=Ace. suit: 0=diamond, 1=club, 2=heart, 3=spade.
    //cardId and suit will be used to assign images to cards
    //convert cardId into blackjack value.
    var nonAceCard = (cardId < 8) ? cardId + 2 : 10; //cardId of 7 corresponds to a 9 of X
    //if card is an ace give it val of 11 if not, give it val of nonAceCard calculated above
    this.value = (cardId === 12) ? 11 : nonAceCard;
    this.cardImgSrc = ""; //this will direct to the associated card image

    //makes the cardId and suit into a format that matches a card img src
    var fixCardNames = function () {
        switch(cardId) {
            case 9:
                cardId = "jack";
                break;
            case 10:
                cardId = "queen";
                break;
            case 11:
                cardId = "king";
                break;
            case 12:
                cardId = "ace";
                break;
        }

        if (cardId < 9) {
            cardId += 2; //makes a two (which had value of 0 previously) into a two and so on
        }

        switch(suit) {
            case 0:
                suit = "diamonds";
                break;
            case 1:
                suit = "clubs";
                break;
            case 2:
                suit = "hearts";
                break;
            case 3:
                suit = "spades";
                break;
        }
    };
    fixCardNames();

    //creates the img src
    this.cardImgSrc = "img/" + cardId + "_of_" + suit + ".jpg";
}

exports.CardConstructor = Card;