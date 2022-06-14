import { Contract, Signer } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { CONTRACT_INTERFACE_V1, CONTRACT_MAINNET_V1, CONTRACT_ROPSTEN_V1 } from "./const";
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

        let paymentContract: Contract;
        let paymentContractAddress: string;

        switch(chainId){

            case 1:
                paymentContractAddress = CONTRACT_MAINNET_V1;
                break;
            case 3:
                paymentContractAddress = CONTRACT_ROPSTEN_V1;
                break;
            default:
                throw "Chain not supported. Use mainnet or Ropsten"

        }
        
        paymentContract = new Contract(paymentContractAddress, CONTRACT_INTERFACE_V1, this.signer);

        const from = await this.signer.getAddress()

        let tx = await paymentContract.pay(from, receiverAddress, {value: parseEther(amount.toString())});

        return {txHash: tx.hash, recipient: receiverAddress, payer: from, isTestnet: chainId === 1 ? false : true}
    
    }

}

export const pay = async (receiverAddress: string, amount : number) : Promise<UncompletedPayment>=> {
    
    if(!wallet.connected){
        await wallet.connect();
    }

    const payments = new Payments(wallet.signer);

    return payments.pay(receiverAddress, amount);

}