
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
