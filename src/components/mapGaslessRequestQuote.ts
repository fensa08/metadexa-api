/** @format */

import { Err, Ok, Result } from 'ts-results';
import express from 'express';
import Joi from 'joi';
import { RequestError } from '../interfaces/RequestError';
import { RequestGaslessQuote } from '../interfaces/RequestGaslessQuote';
/** @format */

export default function mapToRequestGaslessQuote(
	request: express.Request,
): Result<RequestGaslessQuote, RequestError> {
	const schema = Joi.object({
		sellTokenAddress: Joi.string().required(),
		buyTokenAddress: Joi.string().required(),
		slippage: Joi.number().min(0).max(1).required(),
		fromAddress: Joi.string().required(),
		buyTokenAmount: Joi.string(),
		sellTokenAmount: Joi.string(),
	}).or('sellTokenAmount', 'buyTokenAmount');
	const options = {
		abortEarly: false, // include all errors
		allowUnknown: true, // ignore unknown props
		stripUnknown: true, // remove unknown props
	};
	const { error, value } = schema.validate(request.query, options);
	if (error) {
		return new Err({
			statusCode: 400,
			data: `Validation failed: ${error.message}`,
		});
	}
	const { query } = request;
	return new Ok({
		chainId: Number(request.params.chainId),
		fromAddress: query.fromAddress?.toString(),
		sellTokenAddress: query.sellTokenAddress?.toString(),
		buyTokenAddress: query.buyTokenAddress?.toString(),
		sellTokenAmount: query.sellTokenAmount?.toString(),
		buyTokenAmount: query.buyTokenAmount?.toString(),
		recipient: query.recipient?.toString(),
		slippage: query.slippage?.toString(),
		affiliate: query.affiliate?.toString(),
		affiliateFee: query.affiliateFee?.toString(),
		skipValidation: query.skipValidation === 'true',
		signaturePermitData: query.signaturePermitData?.toString(),
	});
}
