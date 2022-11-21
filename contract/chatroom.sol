// SPDX-License-Identifier: MIT  

pragma solidity >=0.7.0 <0.9.0;

contract ClassGroupChat{
    uint internal messageLength = 0;
    struct MessageRating{
        uint current_rate;
        uint total_raters;
        uint total_rate;
        uint rated;
    }

    struct Message{
        address payable owner;
        string name;
        string message;
        uint date;
        MessageRating rating;
    }


    mapping (uint => Message) internal messages;

    function createMessage(
		string memory _name,
		string memory _message
	) public {
        uint _date = block.timestamp;

		messages[messageLength] = Message(
			payable(msg.sender),
			_name,
			_message,
            _date,
            MessageRating(0,0,0,0)
		);
        messageLength++;
	}

    function viewMessages(uint _index) public view returns (
		address payable,
		string memory, 
		string memory,
        uint,
        MessageRating memory
	) {
		return (
			messages[_index].owner, 
			messages[_index].name, 
			messages[_index].message,
			messages[_index].date,
			messages[_index].rating
		);
	}


// calculate the rating of a product upon rating 
    function writeRating(uint _index, uint rate ) public{
       if (messages[_index].rating.rated == 0){
            messages[_index].rating.total_rate += rate;
            messages[_index].rating.total_raters += 1;
            messages[_index].rating.current_rate =messages[_index].rating.total_rate /messages[_index].rating.total_raters;
            messages[_index].rating.rated = 1;
       }
    }

// generate the message lengths
	function getMessageLength() public view returns (uint) {
		return (messageLength);
	}

}