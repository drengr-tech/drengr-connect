import { connect, getVerificationMessage } from "./identity";
import { Modal } from "./modal";
import { NFTShopRandom, NFTShopUnique, setupNFTShop, setupRandomNFTShop, setupUniqueNFTShop } from "./nft";

import {pay, Payments} from "./payment";


document.addEventListener("DOMContentLoaded", () => {


    document.querySelectorAll("[data-drengr-connect]").forEach(el => {

        el.addEventListener("click", async () => {
            let address = await connect();

            el.innerHTML = address.slice(0, 5) + "..." + address.slice(address.length - 4);

        })

    })

});


export {
    connect,
    getVerificationMessage,
    pay,
    Payments,
    setupNFTShop,
    setupRandomNFTShop,
    setupUniqueNFTShop,
    Modal,
    NFTShopUnique,
    NFTShopRandom
}