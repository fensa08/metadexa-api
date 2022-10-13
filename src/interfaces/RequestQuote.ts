/** @format */

export interface RequestQuote {
	chainId: number;
	fromAddress: string;
	sellTokenAddress: string;
	buyTokenAddress: string;
	sellTokenAmount: string | undefined;
	buyTokenAmount: string | undefined;
	recipient: string | undefined;
	slippage: string;
	affiliate: string | undefined;
	affiliateFee: string | undefined;
	skipValidation: boolean;
	signaturePermitData: string | undefined;
}
