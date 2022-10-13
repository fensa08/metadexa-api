/** @format */

/** @format */

/** @format */
import axios from 'axios';
import qs from 'qs';
import { Ok, Err, Result } from 'ts-results';
import { RequestQuote } from '../interfaces/RequestQuote';
import { RequestError } from '../interfaces/RequestError';
import { AggregatorQuote, TradeType } from '../interfaces/AggregatorQuote';
import { OneInchQueryParameters } from '../interfaces/OneInch/OneInchQueryParameters';

import { OneInchSwapResponse } from '../interfaces/OneInch/OneInchSwapResponse';
import { FLASH_WALLET } from '../constants/addresses';

require('axios-debug-log');

function createQueryStringRequestObject(
	request: RequestQuote,
): OneInchQueryParameters {
	return {
		fromTokenAddress: request.sellTokenAddress,
		toTokenAddress: request.buyTokenAddress,
		amount: request.sellTokenAmount ? request.sellTokenAmount : null,
		slippage: `${+request.slippage * 100}`,
		referrerAddress:
			request.affiliate !== '' || request.affiliate !== undefined
				? request.affiliate
				: null,
		fee:
			request.affiliateFee !== '' || request.affiliateFee !== undefined
				? request.affiliateFee
				: null,
		destReceiver: FLASH_WALLET[request.chainId], // TODO retrieve from on-chain metaswap contract; be carefull if the flash wallet has changed;
		fromAddress: request.fromAddress,
		disableEstimate: true,
	};
}

function normalizeOneInchSwapResponse(
	response: OneInchSwapResponse,
	from: string,
	recipient: string,
): AggregatorQuote {
	return {
		to: response.tx.to,
		data: response.tx.data,
		value: response.tx.value,
		estimatedGas: response.tx.gas,
		buyTokenAddress: response.toToken.address,
		buyAmount: response.toTokenAmount,
		sellTokenAddress: response.fromToken.address,
		sellAmount: response.fromTokenAmount,

		from,
		recipient,

		tradeType: TradeType.ExactInput,
	};
}

function normalizeOneInchQuoteResponse(
	response: OneInchSwapResponse,
	from: string,
	recipient: string,
): AggregatorQuote {
	return {
		to: undefined,
		data: undefined,
		value: undefined,
		estimatedGas: response.estimatedGas,
		buyTokenAddress: response.toToken.address,
		buyAmount: response.toTokenAmount,
		sellTokenAddress: response.fromToken.address,
		sellAmount: response.fromTokenAmount,

		from,
		recipient,

		tradeType: TradeType.ExactInput,
	};
}

export async function getOneInchQuoteApi(
	request: RequestQuote,
): Promise<Result<AggregatorQuote, RequestError>> {
	const { fromAddress, recipient, chainId } = request;

	const queryString = createQueryStringRequestObject(request);

	try {
		const instance = axios.create();
		instance.defaults.timeout = 5000;
		const r = await instance.get(
			`https://api.1inch.io/v4.0/${chainId}/quote?${qs.stringify(
				queryString,
				{
					strictNullHandling: true,
					skipNulls: true,
				},
			)}`,
		);

		return new Ok(
			normalizeOneInchQuoteResponse(r.data, fromAddress, recipient),
		);
	} catch (exception) {
		console.log(
			`OneInch exception - status code: ${exception?.response?.status} `,
			exception?.response?.data?.description,
		);
		return new Err({
			statusCode: exception?.response?.status,
			data: exception?.response?.data?.description,
		});
	}
}

export async function getOneInchSwapApi(
	request: RequestQuote,
): Promise<Result<AggregatorQuote, RequestError>> {
	const { fromAddress, recipient, chainId } = request;

	const queryString = createQueryStringRequestObject(request);

	try {
		const instance = axios.create();
		instance.defaults.timeout = 5000;
		const r = await instance.get(
			`https://api.1inch.io/v4.0/${chainId}/swap?${qs.stringify(
				queryString,
				{
					strictNullHandling: true,
					skipNulls: true,
				},
			)}`,
		);

		return new Ok(
			normalizeOneInchSwapResponse(r.data, fromAddress, recipient),
		);
	} catch (exception) {
		console.log(
			`OneInch exception - status code: ${exception?.response?.status} `,
			exception?.response?.data?.description,
		);
		return new Err({
			statusCode: exception?.response?.status,
			data: exception?.response?.data?.description,
		});
	}
}

export default async function getOneInchAggregatorQuote(
	request: RequestQuote,
	skipValidation: boolean,
): Promise<Result<AggregatorQuote, RequestError>> {
	if (request.sellTokenAmount === undefined)
		return new Err({
			statusCode: 404,
			data: 'Not supported method',
		});

	if (skipValidation) {
		return getOneInchQuoteApi(request);
	}

	return getOneInchSwapApi(request);
}
