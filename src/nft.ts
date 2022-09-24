import { BigNumber, Contract, ethers, providers, Signer } from "ethers";
import { Wallet } from "./identity";
import { Modal } from "./modal";

export class NFT {
    provider: providers.Provider;

    nftContract: Contract;
    saleContract: Contract;

    constructor(contratAddress: string, saleAddress: string) {
        this.provider = new providers.JsonRpcProvider(
            "https://mainnet.infura.io/v3/1f272d4f6d124328a70a3f62fe06a997"
        );
        this.nftContract = new Contract(
            contratAddress,
            ["function ownerOf(uint256 tokenId) public view returns (address)"],
            this.provider
        );
        this.saleContract = new Contract(
            saleAddress,
            [
                "function mint(address _to, uint256 _id) public payable",
                "function price() public view returns(uint256)",
            ],
            this.provider
        );
    }

    async isSold(tokenId: number | string) {
        const formatedTokenId = BigNumber.from(tokenId);

        let sold = false;

        try {
            let owner = await this.nftContract.ownerOf(formatedTokenId);

            if (owner !== ethers.constants.AddressZero) {
                sold = false;
            } else {
                sold = true;
            }
        } catch (error) {
            console.error(error);

            sold = true;
        }

        return sold;
    }

    async buyToken(tokenId: number | string, signer: Signer) {
        const signerContract = this.saleContract.connect(signer);

        const formatedTokenId = BigNumber.from(tokenId);

        const price: BigNumber = await signerContract.price();

        const address = await signer.getAddress();
        // const balance = await signer.getBalance();

        try {
            await signerContract.callStatic.mint(
                signer.getAddress(),
                formatedTokenId,
                { value: price }
            );

            let tx = await signerContract.mint(
                signer.getAddress(),
                formatedTokenId,
                { value: price }
            );

            await tx.wait();
        } catch (e: any) {
            if (e.message) {
                throw new Error(e.message);
            } else {
                throw new Error(e);
            }
        }
    }
}

interface NFTShopOptions {

    type : "unique" | "random";
    contractAddress: string;
    saleAddress: string;
    price: number;
    modalEl: string;
    availableEl: string;
    buyCryptoEl: string;

}

interface NFTShopOptionsUnique extends NFTShopOptions{
    type: "unique"
    id: number | string;
}

interface NFTShopOptionsRandom extends NFTShopOptions {
    type: "random"
}


function setupRandomNFTShop(options: NFTShopOptionsRandom){

}

function setupUniqueNFTShop(options : NFTShopOptionsUnique){
    
    let modal = new Modal(options.modalEl);
    let nft = new NFT(options.contractAddress, options.saleAddress);

    document.getElementById(options.buyCryptoEl)?.addEventListener("click", async () => {

        const wallet = new Wallet();

        await wallet.connect();

        modal.showModal();

        try {
            await nft.buyToken(options.id, wallet.signer);
        } catch (e) {
            console.error(e)
        }finally{
            modal.hideModal()
        }

    });

}

export function setupNFTShop(options : NFTShopOptionsRandom | NFTShopOptionsUnique){

    if(options.type === "unique"){
        return setupUniqueNFTShop(options)
    }else{
        return setupRandomNFTShop(options)
    }
}