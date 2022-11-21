import Web3 from "web3";
import { newKitFromWeb3 } from "@celo/contractkit";

import chatRoomAbi from '../contract/marketplace.abi.json'
import { Input } from "@mui/material";


const MPContractAddress = "0x40374Fbf011F8d64530B1F7c725e05DD98DaA59D"

let kit;
let contract
let messages =[]

const connectCeloWallet = async function () {
  if (window.celo) {
    notification("⚠️ Please approve this DApp to use it.");
    try {
      await window.celo.enable();
      notificationOff();

      const web3 = new Web3(window.celo);
      kit = newKitFromWeb3(web3);

      const accounts = await kit.web3.eth.getAccounts();
      kit.defaultAccount = accounts[0];

      contract = new kit.web3.eth.Contract(chatRoomAbi, MPContractAddress)
    } catch (error) {
      notification(`⚠️ ${error}.`);
    }
  } else {
    notification("⚠️ Please install the CeloExtensionWallet.");
  }
};
function notification(_text) {
  document.querySelector(".alert").style.display = "block";
  document.querySelector("#notification").textContent = _text;
}

function notificationOff() {
  document.querySelector(".alert").style.display = "none";
}


window.addEventListener('load', async () => {
    notification("⌛ Loading...")
    await connectCeloWallet()
    await getMessages()
    notificationOff()
});


// get the messages from the smart contract server
const getMessages = async function() {
    const _messageLength = await contract.methods.getMessageLength().call()
    const _messages = []  
    for (let i = 0; i < _messageLength; i++) {
        let _message = new Promise(async (resolve, reject) => {
          let p = await contract.methods.viewMessages(i).call()
          resolve({
            index: i,
            owner: p[0],
            name: p[1],
            message: p[2],
            date: p[3],
            rating: p[4],
          })
        })
        _messages.push(_message)
      }
      messages = await Promise.all(_messages)
      rendermessages()
    }


function messageTemplate (_message){
        return `
        <div class="message my-message">
        <div class="container">
          <div class="name">${_message.name}</div>
          <div class="text">${_message.message}</div>
          <div class="date">${datetojs(_message.date)}</div>
          <div class="rating">
              <p>rating: ${_message.rating[0]} by ${_message.rating[1]}</p>
              <div class="dropdown">
              
              <a class="btn btn-dark rounded-pill rate btn"
              data-bs-toggle="modal"
              data-bs-target="#myModal" 
              id=${_message.index}>
                  Rate
              </a>
              <div class="dropdown-content">
                <a class="rate" id=${_message.index}>1</a>
                <a class="rate" id=${_message.index}>2</a>
                <a class="rate" id=${_message.index}>3</a>
                <a class="rate" id=${_message.index}>4</a>
                <a class="rate" id=${_message.index}>5</a>
              </div>
          </div>
          </div>
        `
    }
  // render the messages 
    function rendermessages() {
        document.getElementById("messagecard").innerHTML = ""
        messages.forEach((_message) => {
          const newDiv = document.createElement("div")
          newDiv.className = "message my-message"
          newDiv.innerHTML = messageTemplate(_message)
          document.getElementById("messagecard").appendChild(newDiv)
        })
    }
    
// get the log in page details
// get the login elements
const app = document.querySelector(".app");
// the username to be shared throughout the system.
let uname;
app.querySelector(".join-screen #join-user").addEventListener("click", function(){
  let username = app.querySelector(".join-screen #username").value;
      if (username.length == 0){
        return;
      }
      //save the username
      uname = username;
      // change from login screen to chat screen
      app.querySelector(".join-screen").classList.remove("active");
      app.querySelector(".chat-screen").classList.add("active");
      app.querySelector("#user").innerHTML= uname;
    });


// create a new message
document
  .querySelector("#send-message")
  .addEventListener("click", async (e) => {
    // put the user name and in the message 
    const params = [
      uname,
      document.getElementById("message-input").value,
    ]
    notification(`⌛ Adding "${params[0]}"...`)
    document.getElementById("message-input").innerHTML= " "
    // send the messages
  try {
    const result = await contract.methods
      .createMessage(...params)
      .send({ from: kit.defaultAccount })
  } catch (error) {
    notification(`⚠️ ${error}.`)
  }
  notification(`🎉 You successfully sent message.`)
  notificationOff()

  getMessages()
})

// convert the solidity date to a string
function datetojs(timestamp){
    var test = new Date(timestamp*1000);
    return test.toLocaleString()
}

// write the rating of the message in the contract
document
  .querySelector("#messagecard")
  .addEventListener("click", async (e) => {
    if(e.target.className.includes("rate")){
      
        // extract the rating from the contract    
          const index = e.target.id
          //check if the user has already rated the message  
          if (messages[index].rating[3] == 0){
            const params = [
              index,
              e.target.textContent,
            ]
            // write the rating in the contract
            try {
              const result = await contract.methods
                .writeRating(...params)
                .send({ from: kit.defaultAccount })
            } catch (error) {
              notification(`⚠️ ${error}.`)
              notificationOff()
            }
              count += 1;    
            }else{
              // error if already rated
              notification("can rate only once")
            }
      }
      getMessages();

})
















