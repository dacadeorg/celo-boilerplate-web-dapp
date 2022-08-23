import Web3 from "web3"
import BigNumber from "bignumber.js"
import marketplaceAbi from "../contract/marketplace.abi.json"
import erc20Abi from "../contract/erc20.abi.json"

const ERC20_DECIMALS = 18
const MPContractAddress = "0x65881e7657f4E60681C12F9197389D2174B5F0a0"
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"
let contract
let web3
let products = []
let celotestnetID = 44787
let ERC20Contract
let Account0

ethereum.on('chainChanged',(_chainId) => window.location.reload() )

const connectMetaWallet = async function () {
  if (window.ethereum) {
    notification("⚠️ Please approve this DApp to use it.")
    try {
      const chainID = await ethereum.request({method:"eth_chainId"});
      if(parseInt(chainID,16)!=celotestnetID){
        throw("Please switch to cello testnet");
      }

      web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
      notificationOff();
      
      const accounts = await web3.eth.getAccounts()
      Account0 = accounts[0]

      contract = new web3.eth.Contract(marketplaceAbi, MPContractAddress)
      ERC20Contract = new web3.eth.Contract(erc20Abi, cUSDContractAddress)
      console.log(contract.methods);
    }
    catch (error) {
      notification(`⚠️ ${error}.`)      
  }
}
  else {
    notification("⚠️ Please install Metamask.")
  }
}

async function approve(_price) {
  const cUSDContract = new web3.eth.Contract(erc20Abi, cUSDContractAddress)

  const result = await cUSDContract.methods
    .approve(MPContractAddress, _price)
    .send({ from: Account0 })
  return result
}

const getBalance = async function () {
  const cUSDBalance = await ERC20Contract.methods.balanceOf(Account0).call()
  document.querySelector("#balance").textContent = parseFloat(web3.utils.fromWei(cUSDBalance,'ether')).toFixed(2);
}

const getProducts = async function() {
  const _productsLength = await contract.methods.getProductsLength().call()
  const _products = []

  for (let i = 0; i < _productsLength; i++) {
    let _product = new Promise(async (resolve, reject) => {
      let p = await contract.methods.readProduct(i).call()
      resolve({
        index: i,
        OId: p[0],
        title: p[1],
        image: p[2],
        description: p[3],
        location: p[4],
        price: new BigNumber(p[5]),
        sold: p[6],
      })
    })
    _products.push(_product)
  }
  products = await Promise.all(_products)
  renderProducts()
}

function renderProducts() {
  document.getElementById("marketplace").innerHTML = ""
  products.forEach((_product) => {
    const newDiv = document.createElement("div")
    newDiv.className = "col-md-4"
    newDiv.innerHTML = productTemplate(_product)
    document.getElementById("marketplace").appendChild(newDiv)
  })
}

function productTemplate(_product) {
  return `
    <div class="card mb-4">
      <img class="card-img-top" src="${_product.image}" alt="...">
      <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start">
        ${_product.sold} Sold
      </div>
      <div class="card-body text-left p-4 position-relative">
        <div class="translate-middle-y position-absolute top-0">
        ${identiconTemplate(_product.OId)}
        </div>
        <h2 class="card-title fs-4 fw-bold mt-2">${_product.title}</h2>
        <p class="card-text mb-4" style="min-height: 82px">
          ${_product.description}             
        </p>
        <p class="card-text mt-4">
          <i class="bi bi-geo-alt-fill"></i>
          <span>${_product.location}</span>
        </p>
        <div class="d-grid gap-2">
          <a class="btn btn-lg btn-outline-dark buyBtn fs-6 p-3" id=${
            _product.index
          }>
            Buy for ${_product.price.shiftedBy(-ERC20_DECIMALS).toFixed(2)} cUSD
          </a>
        </div>
      </div>
    </div>
  `
}

function identiconTemplate(_address) {
  const icon = blockies
    .create({
      seed: _address,
      size: 8,
      scale: 16,
    })
    .toDataURL()

  return `
  <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
    <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
        target="_blank">
        <img src="${icon}" width="48" alt="${_address}">
    </a>
  </div>
  `
}

function notification(_text) {
  document.querySelector(".alert").style.display = "block"
  document.querySelector("#notification").textContent = _text
}

function notificationOff() {
  document.querySelector(".alert").style.display = "none"
}

window.addEventListener("load", async () => {
  notification("⌛ Loading...")
  await connectMetaWallet()
  await getBalance()
  await getProducts()
  notificationOff()
});

document
  .querySelector("#newProductBtn")
  .addEventListener("click", async (e) => {
    const params = [
      document.getElementById("newProductName").value,
      document.getElementById("newImgUrl").value,
      document.getElementById("newProductDescription").value,
      document.getElementById("newLocation").value,
      new BigNumber(document.getElementById("newPrice").value)
      .shiftedBy(ERC20_DECIMALS)
      .toString()
    ]
    notification(`⌛ Adding "${params[0]}"...`)
    try {
      const result = await contract.methods
        .writeProduct(params[0],params[1],params[2],params[3],params[4])
        .send({ from: Account0 })
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
    notification(`🎉 You successfully added "${params[0]}".`)
    getProducts()
  })

document.querySelector("#marketplace").addEventListener("click", async (e) => {
  if (e.target.className.includes("buyBtn")) {
    const index = e.target.id
    notification("⌛ Waiting for payment approval...")
    try {
      await approve(products[index].price)
    } catch (error) {
      notification(`⚠️ ${error}.`)
      
    }
    notification(`⌛ Awaiting payment for "${products[index].title}"...`)
    try {
      const result = await contract.methods
        .buyProduct(index)
        .send({ from: Account0 })
      notification(`🎉 You successfully bought "${products[index].title}".`)
      getProducts()
      console.log("getproducts successful");
      getBalance()
      console.log("getBalance successful")
    } catch (error) {
      console.log("prod")
      notification(`⚠️ ${error}.`)
    }
  }
})  

(function ($) {
  "use strict";
  
  // Dropdown on mouse hover
  $(document).ready(function () {
      function toggleNavbarMethod() {
          if ($(window).width() > 992) {
              $('.navbar .dropdown').on('mouseover', function () {
                  $('.dropdown-toggle', this).trigger('click');
              }).on('mouseout', function () {
                  $('.dropdown-toggle', this).trigger('click').blur();
              });
          } else {
              $('.navbar .dropdown').off('mouseover').off('mouseout');
          }
      }
      toggleNavbarMethod();
      $(window).resize(toggleNavbarMethod);
  });


  // Date and time picker
  $('.date').datetimepicker({
      format: 'L'
  });
  $('.time').datetimepicker({
      format: 'LT'
  });
  
  
  // Back to top button
  $(window).scroll(function () {
      if ($(this).scrollTop() > 100) {
          $('.back-to-top').fadeIn('slow');
      } else {
          $('.back-to-top').fadeOut('slow');
      }
  });
  $('.back-to-top').click(function () {
      $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
      return false;
  });


  // Team carousel
  $(".team-carousel, .related-carousel").owlCarousel({
      autoplay: true,
      smartSpeed: 1000,
      center: true,
      margin: 30,
      dots: false,
      loop: true,
      nav : true,
      navText : [
          '<i class="fa fa-angle-left" aria-hidden="true"></i>',
          '<i class="fa fa-angle-right" aria-hidden="true"></i>'
      ],
      responsive: {
          0:{
              items:1
          },
          576:{
              items:1
          },
          768:{
              items:2
          },
          992:{
              items:3
          }
      }
  });


  // Testimonials carousel
  $(".testimonial-carousel").owlCarousel({
      autoplay: true,
      smartSpeed: 1500,
      margin: 30,
      dots: true,
      loop: true,
      center: true,
      responsive: {
          0:{
              items:1
          },
          576:{
              items:1
          },
          768:{
              items:2
          },
          992:{
              items:3
          }
      }
  });


  // Vendor carousel
  $('.vendor-carousel').owlCarousel({
      loop: true,
      margin: 30,
      dots: true,
      loop: true,
      center: true,
      autoplay: true,
      smartSpeed: 1000,
      responsive: {
          0:{
              items:2
          },
          576:{
              items:3
          },
          768:{
              items:4
          },
          992:{
              items:5
          },
          1200:{
              items:6
          }
      }
  });
  
})(jQuery);

