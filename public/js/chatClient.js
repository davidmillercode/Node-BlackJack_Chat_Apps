/**
 * Created by D on 1/27/2015.
 */
$(document).ready(function(){
    var socket = io();
    var checkedName;
    var nickName; //user nickname that will be unique per server session
    var $messageList = $('#messages'); //these are all the displayed messages the client receives

    //get the person to enter their name | if greater than 12 characters, prompt for new shorter name
    function setValidName(promptText) {
        var name = prompt(promptText);
        if (name == null){ //if user chooses cancel name will get set to null
            setValidName('You must enter a name to use this app.');
        } else {
            if (name.length <= 12 && name.length > 0) {
                checkedName = name; //this is the name that gets checked
            } else {
                setValidName("Names must be between 1-12 characters in length! Choose a shorter name please.");
            }
        }
    }
    //get user nickname
    function getNickname(promptText){
        setValidName(promptText); //only returns 12 char max name
        var name = checkedName; //gets name that was set in func call above

        socket.emit('nameCheck', name); //ask other connected for their name to see if new user's name is OK
        socket.on('checkedName', function(duplicateNick){
            socket.removeAllListeners('checkedName'); //removes checkedName listener
            if (!duplicateNick) { //so if nobody has the same name accept the name
                nickName = name; //set user's nickname for session
                //add notice to user that they have successfully joined chat
                $messageList.prepend($('<div class="notice">').text('Welcome to the chat, ' + nickName + '.')
                    .css('color', '#111'));

            }  else { //if name is a duplicate in system
                getNickname("Sorry that name is in use. Please enter a different nickname: ");
            }
        });
    }
    getNickname("Please enter your nickname: ");


    var ourStyling = {'font-style': 'normal', 'color': 'black'}; //this is how the user will style their messages

    //creates html message from a data obj w/ sender/time/msg info and adds to client page
    function createMessage(data, selfSent){ //if selfSent then change header background color
        //data will contain name of sender(sender), date sent(timeSent), and message(msg)
        var $sender = $('<div class="sender">').text(data.sender);
        var $timeSent = $('<div class="time_sent">').text(data.timeSent);
        var $msg = $('<div class="msg">').text(data.msg).css(data.style);
        var $header = $('<div class="msg_header">').append($sender).append($timeSent);
        var $completeMsg = $('<li>').append($header).append($msg);
        $messageList.prepend($completeMsg);
        if (selfSent==='self sent'){
            $header.css('background-color', '#13a966');
        }
    }
    function isValidMsg(message) {
        return (message.length > 0 && message.length < 100);
    }

    //if the message starts with a / then we know the user is entering a command (not a message)
    function isCommand(message){
        return (message[0]=='/' && message.length > 1);
    }

    //submit client generated message (clear input text)
    function sendMessage(){
        if (nickName===undefined){ //make sure that the user has entered a nickname (they should have before this)
            return; //user declined to enter nickname
        }
        var $userInput = $('#user_input'); //text that user entered
        if(isValidMsg($userInput.val() + "")){ //if msg is of proper length
            var msg = $userInput.val() +"";
            var data = {sender: nickName, timeSent: new Date(), msg: $userInput.val() + "", style: ourStyling}; //create data

            //if the user sent a normal(broadcast) message to the other chat members
            if (!isCommand(msg)){
                //send the data out to server
                socket.emit('send', {type: 'msg', data: data});
                //add message on client's page
                createMessage(data, 'self sent');

            } else { //if user entered a command, determine which command and take appropriate action
                var msgCommand = msg.split(' '); //msgCommand[0] will be the command
                //instructions for different commands
                //each different command should provide feedback to user that something changed/didn't change
                switch (msgCommand[0]){
                    case '/pm': //**private message    | '/pm dave this is my message'
                        var recipient = msgCommand[1];
                        msgCommand.splice(0, 2); //remove command + recipient part
                        var privateMsg = msgCommand.join(' ');
                        //create data for pm with recipient in data
                        var privateData = {sender: nickName + '(private)', recipient: recipient, timeSent: new Date(),
                            msg: privateMsg,
                            style: {}};
                        //emit message for single user
                        socket.emit('send', {type: 'pm', data: privateData});
                        $messageList.prepend($('<div class="notice">').text('Private message sent to ' + recipient +
                        ': ' + privateMsg + ' @' + new Date()));//send message with whole /pm name in message
                        break;
                    case '/color': //**change font color  | '/color green'
                        //change color of font
                        var colorWanted = msgCommand[1];
                        $userInput.css('color', colorWanted);
                        ourStyling.color = colorWanted; //changes obj responsible for styling
                        $messageList.prepend($('<div class="notice">').text('Font color changed to ' + colorWanted + '.'));
                        break;
                    case '/italic': //**change font style to italics for message   | '/italic'
                        $userInput.css('font-style', 'italic');
                        ourStyling['font-style'] = 'italic'; //changes obj responsible for styling
                        $messageList.prepend($('<div class="notice">').text('You are now writing in italics.'));
                        break;
                    case '/normal': // change font to normal style
                        $userInput.css('font-style', 'normal');
                        ourStyling['font-style']='normal'; //changes obj responsible for styling
                        $messageList.prepend($('<div class="notice">').text('You are now writing with a normal font.'));
                        break;
                    case '/members':
                        socket.emit('members'); //will receive data as a notice in its event listener
                        break;
                    case '/help': //provide a list of commands to the user
                        $messageList.prepend($('<div class="notice">').text('To send a private message: /pm Name '
                        + ' Hey, Name, did you get this private message?  |'
                        + '  To change the color, enter a color or hex code like so: ' +
                            '/color red  |'
                        + '  To change to italics, enter this:  /italic  | '
                            +' To change back to normal font, enter: /normal  | '
                            +' To see what other members are in the room, enter: /members |'
                        + ' To ask for help:  /help'));
                        break;

                    default:
                        $messageList.prepend($('<div class="notice">').text('That command was not recognized. ' +
                            'Type /help for a list of commands.'));
                }
            }
        } else { //the message was not a proper format (not sent)
            $messageList.prepend($('<div class="notice">').text('That message is either blank or too long! ' +
                '100 characters max.'));
        }
        //clear sent message from user input
        $userInput.val('');
        //only allow user to send message once every 0.3 seconds
        setTimeout($('#send_msg_button').one('click', sendMessage), 300);
    }

    // when a message is received from the server add it to page
    socket.on('msg', function(data) {
        createMessage(data);
    });

    //when you get a notice from server (someone enters room, leaves room, instructions, etc.)
    socket.on('notice', function(data) {
        $messageList.prepend($('<div class="notice">').text(data.msg).css(data.style));

    });

    //add listener to send button
    $('#send_msg_button').one('click', sendMessage); //handler gets added again in sendMessage() after .3 seconds
    $('body').on('keyup', function(event){ //if user presses enter press send message button
        if(event.keyCode ==13){
            $('#send_msg_button').click();
        }
    });
});