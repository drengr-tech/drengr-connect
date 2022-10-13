import { connect, getVerificationMessage, wallet } from "./identity";
import { Modal } from "./modal";
import {
    NFTShopRandom,
    NFTShopUnique,
    setupNFTShop,
    setupRandomNFTShop,
    setupUniqueNFTShop,
} from "./nft";

import { pay, Payments } from "./payment";

document.addEventListener("DOMContentLoaded", async () => {
    const connectedElements = document.querySelectorAll(
        "[data-drengr-connect]"
    );

    const cachedProvider = localStorage.getItem("WEB3_CONNECT_CACHED_PROVIDER");

    let address: string;
    let connected = cachedProvider && cachedProvider.trim() !== "";
    let connecting = false;

    if (connected) {
        address = await connect();
    }

    connectedElements.forEach(async (el) => {
        if (connected) {
            el.innerHTML =
                address.slice(0, 5) + "..." + address.slice(address.length - 4);
        }

        el.addEventListener("click", async () => {
            if (connected) {
                el.innerHTML = "CONNECT WALLET";
                await wallet.disconnect();
                connected = false;
                address = "";
            } else if (!connecting) {
                try {
                    connecting = true;
                    address = await connect();

                    el.innerHTML =
                        address.slice(0, 5) +
                        "..." +
                        address.slice(address.length - 4);
                    connected = true;
                } catch (e) {
                    console.error(e);
                } finally {
                    connecting = false;
                }
            }
        });
    });

    console.log("DRENGR LOADED");
    document.dispatchEvent(new Event("DRENGRLoaded"));

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
    NFTShopRandom,
};
