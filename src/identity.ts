import { ethers, Signer } from "ethers"
import web3modal from "web3modal"
import { SiweMessage } from "siwe";
import axios from "axios";
import WalletConnectProvider from "@walletconnect/web3-provider";


export interface PendingVerification {
    address: string;
    nonce: string;
}

export interface VerificationResponse {
    address: string,
    nonce: string,
    verified: boolean
}

export class Wallet {

    signer!: Signer;
    modal: web3modal;
    address!: string;
    chainId!: number;
    connected = false;

    constructor() {

        this.modal = this.createModal()
    }

    createModal(){
        return new web3modal({
            cacheProvider: true,
            providerOptions: {
               
                walletconnect: {
                    package: WalletConnectProvider, // required
                    options: {
                        infuraId: "79ba2ce2ebe64d86b8ecce3d234b89de", // required,
                        qrcodeModalOptions: {
                            mobileLinks: [
                                "metamask",
                              "rainbow",
                              "argent",
                              "trust",
                              "imtoken",
                              "pillar",
                            ],
                          },
                    }
                }

            }
        });
    }

    async connect() {
        const web3provider = await this.modal.connect();

        const provider = new ethers.providers.Web3Provider(web3provider);

        this.signer = await provider.getSigner();

        await this.addInfos();

        this.connected = true;
    }

    async disconnect(){
        await this.modal.clearCachedProvider();
    }


    async addInfos() {
        this.address = await this.signer.getAddress();
        this.chainId = await this.signer.getChainId();
    }

    async getVerification(nonce: string = "") {

        if (nonce.trim() === "") {
            nonce = await this.requestNonce();
        }

        const infos = await this.createVerificationInfos(nonce);

        const message = await this.createVerificationMessage(infos);

        const signature = await this.signMessage(message);

        return { ...infos, signature };
    }

    async requestNonce() {

        const response = await axios.get(`https://api.drengr.io/verification/nonce/${this.address}`);

        const pendingVerification: PendingVerification = response.data;

        return pendingVerification.nonce;

    }

    createVerificationInfos(nonce: string) {

        const infos = {
            domain: window.location.host,
            address: this.address,
            uri: window.location.origin,
            version: "1",
            chainId: this.chainId,
            issuedAt: new Date().toISOString(),
            nonce: nonce,
        };

        return infos;
    }

    async createVerificationMessage(infos: any) {
        return new SiweMessage(infos);
    }

    async signMessage(message: SiweMessage) {
        return await this.signer.signMessage(message.prepareMessage());
    }

}

const wallet = new Wallet();

export { wallet }

export const connect = async (): Promise<string> => {

    await wallet.connect();

    return wallet.address;

}

export const getVerificationMessage = async (nonce: string = ""): Promise<any> => {

    if (nonce.trim() === "") {

    }

    if (!wallet.address) {
        await wallet.connect();
    }

    return await wallet.getVerification(nonce);

}