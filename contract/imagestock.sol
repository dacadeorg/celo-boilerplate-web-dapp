// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
  function transfer(address, uint256) external returns (bool);
  function approve(address, uint256) external returns (bool);
  function transferFrom(address, address, uint256) external returns (bool);
  function totalSupply() external view returns (uint256);
  function balanceOf(address) external view returns (uint256);
  function allowance(address, address) external view returns (uint256);

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract ImageStock {

    uint internal imageCount = 0;
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    struct Image {
        address payable author;
        string title;
        string image;
        string description;
        uint supporters;
        uint raised;
        bool premium;
    }

    mapping (uint => Image) internal images;

    function addImage(
        string memory _title,
        string memory _image,
        string memory _description
    ) public {
        images[imageCount] = Image(
            payable(msg.sender),
            _title,
            _image,
            _description,
            0,
            0,
            false
        );
        imageCount++;
    }

    function fetchImage(uint _index) public view returns (
        address payable,
        string memory, 
        string memory, 
        string memory,
        bool,
        uint,
        uint
    ) {
        return (
            images[_index].author,
            images[_index].title, 
            images[_index].image,
            images[_index].description,
            images[_index].premium,
            images[_index].raised,
            images[_index].supporters
        );
    }
    
    function supportImage(uint _index, uint _amount) public payable  {

        if(images[_index].premium) {

            require(_amount > 1, 'you must send at least 1 cUSD');


            require(
                IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                images[_index].author,
                _amount), "Transfer failed."
            );

        }

        images[_index].supporters += 1;
        images[_index].raised += _amount;
    }
    
    function getImageCount() public view returns (uint) {
        return (imageCount);
    }

    function makeImageNonPremium(uint _index) public {

        require(images[_index].author == payable(msg.sender), 'only author can modify image');

        images[_index].premium = false; 

    }

    function makeImagePremium(uint _index) public {

        require(images[_index].author == payable(msg.sender), 'only author can modify image');

        images[_index].premium = true; 

    }
}