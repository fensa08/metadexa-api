/** @format */

export interface OneInchQueryParameters {
	fromTokenAddress: string;
	toTokenAddress: string;
	amount: string | null;
	slippage: string;
	referrerAddress: string | null;
	fee: string | null;
	destReceiver: string;
	fromAddress: string;
	disableEstimate: boolean;
}
