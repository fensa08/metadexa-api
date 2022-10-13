/** @format */

import cors from 'cors';
import express from 'express';
import http from 'http';
import helmet, { crossOriginResourcePolicy } from 'helmet';
import { Result } from 'ts-results';
import registerRoutes from './routes';
import addErrorHandler from './middleware/error-handler';
import getBestQuote from './components/GetBestQuote';
import { RequestQuote } from './interfaces/RequestQuote';
import mapToRequestQuote from './components/mapRequestQuote';
import { RequestError } from './interfaces/RequestError';
import getGaslessQuote from './components/GetGaslessQuote';
import { ResultGaslessQuote } from './interfaces/ResultGaslessQuote';
import { CompositeQuote } from './interfaces/CompositeQuote';

export default class App {
	public express: express.Application;

	public httpServer: http.Server;

	public async init(): Promise<void> {
		this.express = express();
		this.httpServer = http.createServer(this.express);
		this.middleware();
		this.routes();
		this.addErrorHandler();
	}

	/**
	 * here register your all routes
	 */
	private routes(): void {
		this.express.get('/', this.basePathRoute);
		this.express.get('/:apiVersion/:chainId/getQuote', this.getSwapRoute);
		this.express.get(
			'/:apiVersion/:chainId/getGaslessQuote',
			this.getGaslessRoute,
		);
		this.express.get('/web', this.parseRequestHeader, this.basePathRoute);
		registerRoutes(this.express);
	}

	/**
	 * here you can apply your middlewares
	 */
	private middleware(): void {
		// support application/json type post data
		// support application/x-www-form-urlencoded post data
		// Helmet can help protect your app from some well-known web vulnerabilities by setting HTTP headers appropriately.
		this.express.use(helmet({ contentSecurityPolicy: false }));
		this.express.use(express.json({ limit: '100mb' }));
		this.express.use(
			express.urlencoded({ limit: '100mb', extended: true }),
		);
		this.express.use(cors());
	}

	private parseRequestHeader(
		req: express.Request,
		res: express.Response,
		// eslint-disable-next-line @typescript-eslint/ban-types
		next: Function,
	): void {
		next();
	}

	private basePathRoute(
		request: express.Request,
		response: express.Response,
	): void {
		response.json({ message: 'hello' });
	}

	private async getSwapRoute(
		request: express.Request,
		response: express.Response,
	): Promise<void> {
		const requestQuote: Result<RequestQuote, RequestError> =
			mapToRequestQuote(request);

		if (requestQuote.err) {
			response
				.status(requestQuote.val.statusCode)
				.send(requestQuote.val.data);
			return;
		}

		const data: Result<CompositeQuote, RequestError> = await getBestQuote(
			requestQuote.unwrap(),
		);
		// eslint-disable-next-line no-prototype-builtins
		if (data.err) {
			response.status(data.val.statusCode).send(data.val.data);
		} else response.status(200).send(data.unwrap().resultQuote);
	}

	private async getGaslessRoute(
		request: express.Request,
		response: express.Response,
	): Promise<void> {
		const requestQuote: Result<RequestQuote, RequestError> =
			mapToRequestQuote(request);
		if (requestQuote.err) {
			response
				.status(requestQuote.val.statusCode)
				.send(requestQuote.val.data);
			return;
		}
		const data: Result<ResultGaslessQuote, RequestError> =
			await getGaslessQuote(requestQuote.unwrap());
		// eslint-disable-next-line no-prototype-builtins
		if (data.err) {
			response.status(data.val.statusCode).send(data.val.data);
		} else response.status(200).send(data.val);
	}

	private addErrorHandler(): void {
		this.express.use(addErrorHandler);
	}
}
