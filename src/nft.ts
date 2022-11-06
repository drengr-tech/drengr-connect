import { BigNumber, Contract, ethers, providers, Signer } from "ethers";
import { Wallet } from "./identity";
import { Modal } from "./modal";

export class NFT extends EventTarget {
    provider: providers.Provider;

    nftContract: Contract;
    saleContract: Contract;

    constructor(contratAddress: string, saleAddress: string, providerString: string) {
        super();
        this.provider = new providers.JsonRpcProvider(
            providerString
        );
        this.nftContract = new Contract(
            contratAddress,
            [
                "function ownerOf(uint256 tokenId) public view returns (address)",
                "function totalSupply() public view returns (uint256)",
                "function MAX_SUPPLY() public view returns (uint256)",
            ],
            this.provider
        );
        this.saleContract = new Contract(
            saleAddress,
            [
                "function mint(address _to, uint256) public payable",
                "function price() public view returns(uint256)",
                "function priceMap(uint256) public view returns(uint256)",
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

    async supply() : Promise<number>{

        try {

            let supply = await this.nftContract.totalSupply();

            return supply.toNumber();
            
        } catch (e) {
            console.error(e)
            return 0;
        }

    }

    async buyToken(tokenIdOrAmount: number | string, signer: Signer) {
        const signerContract = this.saleContract.connect(signer);

        const formatedTokenId = BigNumber.from(tokenIdOrAmount);

        console.log("fetching price");

        let price: BigNumber | undefined = undefined;
        try {
            price = await signerContract.price();
        } catch (e) {
            //console.error("Error while fetching price", e);
            console.log("Can't fetch price for all collection");
            //price = BigNumber.from(0)
        }

        try {
            price = await signerContract.prices(tokenIdOrAmount);
        } catch (e) {
            //console.error("Error while fetching price", e);
            console.log("Can't fetch price for this NFTs");
            //price = BigNumber.from(0)
        }

        if(!price){
            price = BigNumber.from(0)
        }


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
            if (e.data && e.data.message) {
                throw new Error(e.data.message);
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
    chain: "mainnet" | "goerli"
}

interface NFTShopOptionsUnique extends NFTShopOptions {
    type: "unique";
    id?: number | string;
}

interface NFTShopOptionsRandom extends NFTShopOptions {
    type: "random";
    defaultAmount: number;
}

interface NFTShopSetupOptions {
    modalEl: string;
    buyCryptoEl: string;
    onError?: Function;
    onMintStart?: Function;
    onMintEnd?: Function;
}

interface NFTShopSetupOptionsUnique extends NFTShopSetupOptions, NFTShopOptionsUnique {
    onAvailable?: Function;
}

interface NFTShopSetupOptionsRandom extends NFTShopSetupOptions, NFTShopOptionsRandom {
    onSupply?: Function;
}



class MintErrorEvent extends Event {
    constructor(public message: string) {
        super("mintError");
    }
}

abstract class BaseNFTShop extends EventTarget {
    nft: NFT;

    constructor(options: NFTShopOptions) {
        super();

        let providerString = ""

        switch (options.chain) {
            case "mainnet":
                providerString = "https://mainnet.infura.io/v3/1f272d4f6d124328a70a3f62fe06a997"
                break;
            case "goerli":
                providerString = "https://goerli.infura.io/v3/1f272d4f6d124328a70a3f62fe06a997"
                break;
            default:
                providerString = "https://mainnet.infura.io/v3/1f272d4f6d124328a70a3f62fe06a997"
                break;
        }

        this.nft = new NFT(options.contractAddress, options.saleAddress, providerString);
        this.nft.addEventListener("mintstart", (e) => {
            super.dispatchEvent(new Event(e.type));
        });

        this.nft.addEventListener("mintend", (e) => {
            super.dispatchEvent(new Event(e.type));
        });
    }

    async buyNFT(idOrAmount: number | string) {
        const wallet = new Wallet();

        await wallet.connect();

        try {
            await this.nft.buyToken(idOrAmount, wallet.signer);
        } catch (e: any) {
            console.error(e);
            super.dispatchEvent(new MintErrorEvent(e));
        }
    }
}

export class NFTShopUnique extends BaseNFTShop {

    constructor(private options: NFTShopOptionsUnique) {
        super(options);
    }

    async buy(id: number | undefined = undefined) {
        if (!id && !this.options.id) {
            throw new Error("No id specified");
        }

        if (id) {
            await this.buyNFT(id);
        }
        if (this.options.id) {
            await this.buyNFT(this.options.id);
        }
    }

    async isAvailable(
        id: string | number | undefined = undefined
    ): Promise<boolean> {
        if (!id && !this.options.id) {
            throw new Error("No id specified");
        }

        if (id) {
            return await this.nft.isSold(id);
        }

        return await this.nft.isSold(this.options.id as any);
    }
}

export class NFTShopRandom extends BaseNFTShop {

    constructor(private options: NFTShopOptionsRandom) {
        super(options);
        
    }

    async buy(amount: number) {
        await this.buyNFT(amount);
    }

    async currentSupply(): Promise<number> {
        return await this.nft.supply();
    }
}

export function setupRandomNFTShop(options: NFTShopSetupOptionsRandom) {
    let mintingModal = new Modal(options.modalEl);
    let nftShopRandom = new NFTShopRandom(options);

    if (options.onSupply) {
        nftShopRandom.currentSupply().then((currentSupply) => {
            options.onSupply && options.onSupply(currentSupply);
        });
    }

    nftShopRandom.addEventListener("mintstart", () => {
        mintingModal.showModal();
        if (options.onMintStart) {
            options.onMintStart();
        }
    });

    nftShopRandom.addEventListener("mintend", () => {
        mintingModal.hideModal();
        if (options.onMintEnd) {
            options.onMintEnd();
        }
    });

    nftShopRandom.addEventListener("mintError", (error) => {
        if (options.onError) {
            options.onError((error as MintErrorEvent).message);
        }
    });

    document
        .getElementById(options.buyCryptoEl)
        ?.addEventListener("click", () => {
            nftShopRandom.buy(options.defaultAmount);
        });
}

export function setupUniqueNFTShop(options: NFTShopSetupOptionsUnique) {
    let mintingModal = new Modal(options.modalEl);
    let nftShopUnique = new NFTShopUnique(options);

    if (options.onAvailable) {
        nftShopUnique.isAvailable(options.id).then((available) => {
            options.onAvailable && options.onAvailable(available);
        });
    }

    nftShopUnique.addEventListener("mintstart", () => {
        mintingModal.showModal();
        if (options.onMintStart) {
            options.onMintStart();
        }
    });

    nftShopUnique.addEventListener("mintend", () => {
        mintingModal.hideModal();
        if (options.onMintEnd) {
            options.onMintEnd();
        }
    });

    nftShopUnique.addEventListener("mintError", (error) => {
        if (options.onError) {
            options.onError((error as MintErrorEvent).message);
        }
    });

    document
        .getElementById(options.buyCryptoEl)
        ?.addEventListener("click", () => {
            nftShopUnique.buy();
        });
}

export function setupNFTShop(
    options: NFTShopSetupOptionsRandom | NFTShopSetupOptionsUnique
) {
    if (options.type === "unique") {
        return setupUniqueNFTShop(options);
    } else {
        return setupRandomNFTShop(options);
    }
}
