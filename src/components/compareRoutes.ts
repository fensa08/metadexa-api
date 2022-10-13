/** @format */

import { Err, Result } from 'ts-results';
import { RequestError } from '../interfaces/RequestError';
import { AggregatorQuote } from '../interfaces/AggregatorQuote';
/** @format */

/** @format */
export default function compareRoutes(
	zeroXQuote: Result<AggregatorQuote, RequestError>,
	oneInchQuote: Result<AggregatorQuote, RequestError>,
): Result<AggregatorQuote, RequestError> {
	if (zeroXQuote.ok) return zeroXQuote;

	if (oneInchQuote.ok && zeroXQuote.err) return oneInchQuote;

	if (oneInchQuote.err && zeroXQuote.err)
		return new Err({
			statusCode: 500,
			data: 'Aggregate Request failed',
		});

	const zeroX = zeroXQuote;
	const oneInch = oneInchQuote;

	if (oneInch.unwrap().buyAmount > zeroX.unwrap().buyAmount) return oneInch;

	if (zeroX.unwrap().buyAmount > oneInch.unwrap().buyAmount) return zeroX;

	if (zeroX.unwrap().estimatedGas > oneInch.unwrap().estimatedGas)
		return oneInch;

	if (zeroX.ok) return zeroX;

	return new Err({
		statusCode: 404,
		data: 'Aggregator Route Not Found',
	});
}
