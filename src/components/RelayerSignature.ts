/** @format */

import { Err, Ok, Result } from 'ts-results';
import Web3 from 'web3';
import { RequestError } from '../interfaces/RequestError';
import { PROVIDER_ADDRESS } from '../constants/addresses';
import { ForwarderRequest } from '../interfaces/ForwarderRequest';

export default async function validatorSign(
	forwardRequest: ForwarderRequest,
	chainId: number,
	from: string,
	forwarderAddress: string,
): Promise<Result<string, RequestError>> {
	try {
		const web3 = new Web3(Web3.givenProvider || PROVIDER_ADDRESS[chainId]);

		const hashMessage = web3.utils.soliditySha3(
			{ t: 'uint256', v: chainId },
			{ t: 'address', v: from },
			{ t: 'address', v: forwarderAddress },
			{ t: 'address', v: forwardRequest.signer },
			{ t: 'address', v: forwardRequest.paymentToken },
			{ t: 'uint256', v: forwardRequest.paymentFees },
			{ t: 'uint256', v: forwardRequest.tokenGasPrice },
			{ t: 'uint256', v: forwardRequest.validTo },
			{ t: 'uint256', v: forwardRequest.nonce },
			{ t: 'address', v: forwardRequest.metaswap },
			{ t: 'bytes', v: forwardRequest.calldata },
		);

		const sigObj = await web3.eth.accounts.sign(
			hashMessage,
			environment.relayerSecretKey,
		);
		return new Ok(sigObj.signature);
	} catch (error) {
		return new Err({
			statusCode: 500,
			data: `Cannot sign message: ${error}`,
		});
	}
}

export async function getSigner(chainId: number): Promise<string> {
	const web3 = new Web3(Web3.givenProvider || PROVIDER_ADDRESS[chainId]);
	const myAccount = web3.eth.accounts.privateKeyToAccount(
		environment.relayerSecretKey,
	);
	return myAccount.address;
}
