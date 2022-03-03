import { Contract, Signer } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { CONTRACT_INTERFACE_V1, CONTRACT_ROPSTEN_V1 } from "./const";
import { wallet } from "./identity";

export interface UncompletedPayment {
    txHash: string;
	payer: string; 
	recipient: string;
	isTestnet: boolean;
}

export class Payments{
    
    constructor(private readonly signer: Signer){}

    async pay(receiverAddress: string, amount : number) : Promise<UncompletedPayment>{

        const chainId = await this.signer.getChainId();
    
        if(chainId === 1){
            throw "Payments are not available on mainnet yet. Please switch to Ropsten network.";
        }
    
        if(chainId !== 3){
            throw "Payments testnet is on Ropsten. Please switch to Ropsten network."
        }

        const paymentContract = new Contract(CONTRACT_ROPSTEN_V1, CONTRACT_INTERFACE_V1, this.signer);

        const from = await this.signer.getAddress()

        let tx = await paymentContract.pay(from, receiverAddress, {value: parseEther(amount.toString())});

        return {txHash: tx.hash, recipient: receiverAddress, payer: from, isTestnet: true}
    
    }

}

export const pay = async (receiverAddress: string, amount : number) : Promise<UncompletedPayment>=> {
    
    if(!wallet.connected){
        await wallet.connect();
    }

    const payments = new Payments(wallet.signer);

    return payments.pay(receiverAddress, amount);

}