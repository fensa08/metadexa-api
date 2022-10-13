/** @format */

import { OneInchResponseToken } from './OneInchResponseToken';

export interface OneInchSwapResponse {
	fromToken: OneInchResponseToken;
	toToken: OneInchResponseToken;
	estimatedGas: number | undefined;
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
