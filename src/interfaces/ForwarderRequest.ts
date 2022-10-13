/** @format */

export interface ForwarderRequest {
	signer: string;
	metaswap: string;
	calldata: string;

	paymentToken: string;
	paymentFees: string;

	tokenGasPrice: string;

	validTo: number;
	nonce: number;
}
