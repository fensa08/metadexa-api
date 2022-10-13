/** @format */

export interface TransactionData {
	from: string;
	to: string;
	data: string;
	gas: number;
	gasPrice: string | undefined;
	value: string;
}

export interface ResultQuote {
	estimatedGas: number;
	buyTokenAddress: string;
	buyAmount: string;

	sellTokenAddress: string;
	sellAmount: string;

	allowanceTarget: string | undefined;

	tx: TransactionData | undefined;
}
