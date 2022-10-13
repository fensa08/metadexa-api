/** @format */

export interface ZeroXQuoteResponse {
	chainId: number;
	price: string;
	guaranteedPrice: string;
	estimatedPriceImpact: string;
	to: string;
	data: string;
	value: string;
	gas: number;
	estimatedGas: number;
	from: string;
	gasPrice: number;
	buyTokenAddress: string;
	sellTokenAddress: string;
	buyAmount: string | undefined;
	sellAmount: string | undefined;
}
