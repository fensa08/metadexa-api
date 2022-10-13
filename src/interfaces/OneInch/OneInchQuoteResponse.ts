/** @format */

import { OneInchResponseToken } from './OneInchResponseToken';

export interface OneInchQuoteResponse {
	fromToken: OneInchResponseToken;
	toToken: OneInchResponseToken;
	toTokenAmount: string;
	fromTokenAmount: string;
	tx: {
		from: string;
		to: string;
		data: string;
		value: string;
		gas: number;
		gasPrice: number;
	};
}
