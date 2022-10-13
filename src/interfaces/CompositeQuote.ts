/** @format */

import { AggregatorQuote } from './AggregatorQuote';
import { ResultQuote } from './ResultQuote';

export interface CompositeQuote {
	aggregatorQuote: AggregatorQuote;
	resultQuote: ResultQuote;
}
