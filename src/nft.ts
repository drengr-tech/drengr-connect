import { BigNumber, Contract, ethers, providers, Signer } from "ethers";
import { Wallet } from "./identity";
import { Modal } from "./modal";

export class NFT extends EventTarget {
    provider: providers.Provider;

    nftContract: Contract;
    saleContract: Contract;

    constructor(contratAddress: string, saleAddress: string) {
        super();
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
            await signerContract.callStatic.mint(address, formatedTokenId, {
                value: price,
            });

            let tx = await signerContract.mint(address, formatedTokenId, {
                value: price,
            });

            this.dispatchEvent(new Event("mintstart"));
            await tx.wait();
            this.dispatchEvent(new Event("mintend"));
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
    type: "unique" | "random";
    contractAddress: string;
    saleAddress: string;
    price: number;
}

interface NFTShopOptionsUnique extends NFTShopOptions {
    type: "unique";
    id?: number | string;
}

interface NFTShopOptionsRandom extends NFTShopOptions {
    type: "random";
}

interface NFTShopSetupOptionsUnique extends NFTShopOptionsUnique {
    modalEl: string;
    availableEl: string;
    buyCryptoEl: string;
    onError?: Function;
    onMintEnd?: Function; 
}

export class NFTShopUnique extends EventTarget {
    nft: NFT;

    constructor(private options: NFTShopOptionsUnique) {
        super();
        this.nft = new NFT(options.contractAddress, options.saleAddress);
        // this.nft.addEventListener("mintstart", (e) => {
        //     super.dispatchEvent(e);
        // });

        // this.nft.addEventListener("mintend", (e) => {
        //     super.dispatchEvent(e);
        // });
    }

    async buyNFT(id: number | undefined = undefined) {
        if (!id && !this.options.id) {
            throw new Error("No id specified");
        }

        const wallet = new Wallet();

        await wallet.connect();

        try {
            if (id) {
                await this.nft.buyToken(id, wallet.signer);
            }
            if (this.options.id) {
                await this.nft.buyToken(this.options.id, wallet.signer);
            }
        } catch (e: any) {
            console.error(e);
            super.dispatchEvent(new Event("error", e));
        }
    }

    async isAvailable(id: number | undefined = undefined): Promise<boolean> {
        if (!id && !this.options.id) {
            throw new Error("No id specified");
        }


        if (id) {
            return await this.nft.isSold(id);
        }

        return await this.nft.isSold(this.options.id as any);
    }
}

function setupRandomNFTShop(options: NFTShopOptionsRandom) {}

function setupUniqueNFTShop(options: NFTShopSetupOptionsUnique) {
    let mintingModal = new Modal(options.modalEl);
    let nftShopUnique = new NFTShopUnique(options);

    // nftShopUnique.isAvailable().then((available) => {});

    nftShopUnique.addEventListener("mintstart", () => {
        mintingModal.showModal();
    });

    nftShopUnique.addEventListener("mintend", () => {
        mintingModal.hideModal();
        if(options.onMintEnd){
            options.onMintEnd();
        }
    });

    nftShopUnique.addEventListener("error", (message) => {
        if(options.onError){
            options.onError(message);
        }
    })

    document
        .getElementById(options.buyCryptoEl)
        ?.addEventListener("click", () => {
            nftShopUnique.buyNFT();
        });
}

export function setupNFTShop(
    options: NFTShopOptionsRandom | NFTShopSetupOptionsUnique
) {
    if (options.type === "unique") {
        return setupUniqueNFTShop(options);
        
    } else {
        return setupRandomNFTShop(options);
    }
}
