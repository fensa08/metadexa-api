/** @format */

export interface ZeroXRequestParameters {
	sellToken: string;
	buyToken: string;
	slippagePercentage: string;
	feeRecipient: string | null;
	buyTokenPercentage: string | null;
	skipValidation: boolean | null;
	sellAmount: string | null;
	buyAmount: string | null;
	takerAddress: string;
}
