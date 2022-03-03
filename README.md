
# Drengr-Connect
Drengr connect is a wrapper around the Drengr identification services. It provides an abstraction for connecting and authenticating a wallet in your app.

  

# Install

Simply use :

```

npm install drengr-connect

```

The package should work with most modern browsers (built against es6).

Remember that this package is still in under heavy development.

# Usage

#### Frontend part 

The package export two methods :

`connect` and `getVerificationMessage`.

`connect` returns a promise which resolve to the user wallet address. An error is thrown if the process of connecting the wallet is interrupted so that it is possible to display an appropriate feedback.

`getVerificationMessage` connects the user's wallet if not connected already. It returns a promise which resolve to a plain JavaScript object which contains fields necessary to validate wallet ownership.

This message is created with the provided implementation of Sign-In with Ethereum (https://github.com/spruceid/siwe).

The Typescript interface is the following : 
```
interface  SignInMessage {
	address: string;
	domain: string;
	version: string;
	chainId: number;
	uri: string;
	nonce: string;
	issuedAt: string;
	signature: string;
}
```

You should not need to modify the message, only send it to our API for verification.

 To validate ownership of wallet this message must be sent to the drengr API.

#### Backend part

For now the api is available at :

`https://api.drengr.io`

To validate a wallet ownership simply send a request to `/verification/verify` with the message created in the frontend. 

The response follows this interface : 
```
interface  VerificationResponse {
	address: string,
	nonce : string,
	verified: boolean
}
```
If the verified property is true it means that the user has validated ownership of this address. You can then process this information however you would like.


## Payments

You can easily process a payment with drengr APIs. 

A function is available in the module :

`pay(receiverAddress : string, amount: number) : Promise<UncompletedPayment>`


```
interface UncompletedPayment {
	txHash: string;
	payer: string; //Address of the payer
	recipient: string; //Your address
	//Automatically set by checking which blockchain the wallet is connected to
	isTestnet: boolean;
}
```



### /payments/initialize (POST)

As we don't have a UI to manage webhooks yet, you must include your callback URL in the object you send to the API.

#### Requested body schema

```
txHash: string;
payer: string;
recipient: string; 
connected to
isTestnet: boolean;
callbackUrl: string;
```
#### Response body schema

```
id: string;
```

### /payments/:id (GET)

Returns infos on payment
#### Response body schema

```
id: string;

status: enum : "PROCESSING" | "COMPLETED" | "FAILED"

payer: string;

recipient: string;

txHash: string;

amount: number; //Included only if status is COMPLETED

isTestnet:boolean;
```

If the payment has been posted on the blockchain it will be marked as completed. 

We will introduce automatic confirmation in the future, but for the time being you need to check that amount is correct.

If a payment is marked as FAILED it is either because :
- The payment was not posted on the blockchain
- A bad transaction hash was provided
- An amount of 0 was sent from the payer to the recipient in this transaction

### Webhook

Upon payment completion, a POST request will be sent to the callbackUrl that you provided. The schema is the same as the payment infos:

#### Requested body schema

```
id: string;
txHash: string;
payer: string;
recipient: string; 
connected to
isTestnet: boolean;
callbackUrl: string;
```