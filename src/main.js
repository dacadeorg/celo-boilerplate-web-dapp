import Web3 from "web3";
import { newKitFromWeb3 } from "@celo/contractkit";
import BigNumber from "bignumber.js";
import erc20Abi from "../contract/erc20.abi.json";
import ImageStockAbi from "../contract/imagestock.abi.json";
require('arrive');

const ERC20_DECIMALS = 18;
const cUSDContractAddress = "0xb053651858F145b3127504C1045a1FEf8976BFfB";
const ISContractAddress = "0x2e243862d8ef857455CF913c66f4eD2d0cD092e1";

let kit;
let contract;
let images = [];

const connectCeloWallet = async function () {
  console.log("connecting celo");
  if (window.celo) {
    try {
      notification("⚠️ Please approve this DApp to connect to your wallet.");
      const celo = await window.celo.enable();
      console.log("celo", celo);
      notificationOff();
      const web3 = new Web3(window.celo);
      kit = newKitFromWeb3(web3);

      const accounts = await kit.web3.eth.getAccounts();
      kit.defaultAccount = accounts[0];

      contract = new kit.web3.eth.Contract(ImageStockAbi, ISContractAddress);
    } catch (error) {
      notification(`⚠️ ${error}.`);
    }
  } else {
    notification("⚠️ Please install the CeloExtensionWallet.");
  }
};

async function approve(_price) {
  const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress);

  const result = await cUSDContract.methods
    .approve(ISContractAddress, _price)
    .send({ from: kit.defaultAccount });
  return result;
}

const getBalance = async function () {
  const totalBalance = await kit.getTotalBalance(kit.defaultAccount);
  const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2);
  document.getElementById("balance").innerHTML = cUSDBalance;
  return cUSDBalance;
};

document.querySelector("#newImageBtn").addEventListener("click", async (e) => {
  const params = [
    document.getElementById("newTitle").value,
    document.getElementById("newImage").value,
    document.getElementById("newDescription").value,
  ];

  notification(`⌛ Adding "${params[0]}"...`);
  try {
    const result = await contract.methods
      .addImage(...params)
      .send({ from: kit.defaultAccount });
    console.log("launch result", result);
  } catch (error) {
    notification(`⚠️ ${error}.`);
  }
  notification(`🎉 You successfully added "${params[0]}".`);
  getImages();
});

async function supportImage(index) {
  const amount = new BigNumber(document.getElementById(`supportAmount${index}`).value)
    .shiftedBy(ERC20_DECIMALS)
    .toString();

  const params = [index, amount];

  notification("⌛ Waiting for payment approval...");
  try {
    await approve(amount);
  } catch (error) {
    notification(`⚠️ ${error}.`);
    console.log(error);
  }

  notification(`⌛ Awaiting payment for "${images[index].title}"...`);

  try {
    const result = await contract.methods
      .downloadImage(...params)
      .send({ from: kit.defaultAccount });

    console.log("Support Result:", result);

    notification(`🎉 You successfully supported "${images[index].title}".`);

    getImages();
    getBalance();
  } catch (error) {
    notification(`⚠️ ${error}.`);
  }
}

const getImages = async function () {
  const _imageCount = await contract.methods.getImageCount().call();
  const _images = [];

  console.log("Images: " + _imageCount);
  for (let i = 0; i < _imageCount; i++) {
    let _image = new Promise(async (resolve, reject) => {
      let image = await contract.methods.fetchImage(i).call();

      resolve({
        index: i,
        author: image[0],
        title: image[1],
        image: image[2],
        description: image[3],
        premium: image[4],
        raised: new BigNumber(image[5]),
        supporters: image[6],
      });
    });

    _images.push(_image);
  }

  images = await Promise.all(_images);

  renderImages();
};

function renderImages() {
  document.getElementById("imageList").innerHTML = "";

  console.log(images);
  images.forEach((_image) => {
    const newDiv = document.createElement("div");
    newDiv.className = "col-md-4";
    newDiv.innerHTML = `
          ${imageTemplate(_image)}        <div class="imageTemplates">
          </div>`;

    document.getElementById("imageList").appendChild(newDiv);
  });
}

function notification(_text) {
  console.log(_text);
  document.querySelector(".alert").style.display = "block";
  document.querySelector("#notification").textContent = _text;
}

function notificationOff() {
  document.querySelector(".alert").style.display = "none";
}

function imageTemplate(_image) {
  return `
    <div class="card mb-4 mx-2 imageTemplate" >
    <img class="card-img-top" src="${_image.image}" alt="...">
    <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start">
    ${_image.supporters} Supporters ⚓️
    </div>
      <div class="card-body text-left  position-relative">
        <div class="translate-middle-y position-absolute top-0">
        ${identiconTemplate(_image.author)}
        </div>
        <h2 class="card-title fs-4 fw-bold mt-2">${_image.title}</h2>
        <p class="card-text " style="">
          Raised <b>${_image.raised
            .shiftedBy(-ERC20_DECIMALS)
            .toFixed(4)}</b>        
        </p>
        <p class="card-text mb-4" >
        by ${_image.author}
        </p>

        <p class="card-text mb-4" >
       ${_image.description}
        </p>

        <button class="btn btn-lg btn-outline-dark bg-success fs-6 p-3" id=${
          _image.index
        }
          
          data-bs-toggle="modal"
          data-bs-target="#supportModal${_image.index}"
        >
          <b>Support</b> this
        </button>

        <!--Modal-->
        ${supportModal(_image.index)}
        <!--/Modal-->

      </div>
    </div>
  `;
}
 

let hasArrived = false;

window.addEventListener("load", async () => {
  document.arrive(".imageTemplates", () => {
    
    if(!hasArrived) {

      hasArrived = true

      const supportBtns = document.querySelectorAll('button.supportBtn')
      
      supportBtns.forEach((supportBtn) => {

      supportBtn.addEventListener('click', async () => {

        const index = supportBtn.getAttribute('index-value')

        console.log(index)

        await supportImage(parseInt(index));

      })
      
    })
    }

  });
 
});

function supportModal(_index) {
  return `
    <div
      class="modal fade supportModal"
      id="supportModal${_index}"
      tabindex="-1"
      aria-labelledby="supportModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog">
        <div class="modal-content">

          <div class="modal-header">
            <h5 class="modal-title" id="supportModalLabel">Support</h5>
            <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <form>
              <div class="form-row">
                <div class="col">
                  <input
                    type="text"
                    id="supportAmount${_index}"
                    class="form-control mb-2 "
                    placeholder="Support in cUSD"
                  />
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-light border"
              data-bs-dismiss="modal"
            >
              Close
            </button>
            <button
              type="button"
              class="btn btn-dark supportBtn"
              data-bs-dismiss="modal"
              index-value="${_index}"
            >
              Thanks, Lets go! 🚀
            </button>
          </div>
        </div>
      </div>  
    </div>     
  `;
}

function identiconTemplate(_address) {
  const icon = blockies
    .create({
      seed: _address,
      size: 8,
      scale: 16,
    })
    .toDataURL();

  return `
  <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
    <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
        target="_blank">
        <img src="${icon}" width="48" alt="${_address}">
    </a>
  </div>
  `;
}

window.addEventListener("load", async () => {
  notification("⌛ Loading...");
  await connectCeloWallet();
  await getBalance();
  await getImages();
  notificationOff();
});
