/** @format */

export enum TradeType {
	ExactInput,
	ExactOutput,
}

export interface AggregatorQuote {
	to: string | undefined;
	data: string | undefined;
	value: string | undefined;
	estimatedGas: number;
	buyTokenAddress: string;
	buyAmount: string;

	sellTokenAddress: string;
	sellAmount: string;

	from: string;
	recipient: string | undefined;

	tradeType: TradeType;
}
