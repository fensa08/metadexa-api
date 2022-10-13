import Web3 from 'web3';
import { Err, Ok, Result } from 'ts-results';
import { ResultQuote } from '../interfaces/ResultQuote';
import { AggregatorQuote, TradeType } from '../interfaces/AggregatorQuote';
import { CompositeQuote } from '../interfaces/CompositeQuote';
import { TransactionData } from '../interfaces/ResultGaslessQuote';
import {
    FORWARDER_ADDRESS,
    METASWAP_ROUTER_CONTRACT_ADDRESS,
    MULTICALL_ADDRESS,
    PROVIDER_ADDRESS
} from '../constants/addresses';
import { ForwarderRequest } from '../interfaces/ForwarderRequest';
import validatorSign from './RelayerSignature';
import { RequestError } from '../interfaces/RequestError';

/** @format */

export async function estimateGas(
    chainId: number,
    from: string,
    value: string,
    to: string,
    data: string,
): Promise<Result<number, RequestError>> {
    const web3 = new Web3(Web3.givenProvider || PROVIDER_ADDRESS[chainId]);
    try {
        const estimate = await web3.eth.estimateGas({
            to,
            from,
            data,
            value,
        });

        return new Ok(estimate);
    } catch (error) {
        return new Err({
            statusCode: 500,
            data: `Gas estimation failed: ${error}`,
        });
    }
}

export async function getTransactionData(
    forwardRequest: ForwarderRequest,
    validatorSignature: string,
    from: string,
    gasPrice: string,
    chainId: number,
): Promise<Result<TransactionData, RequestError>> {
    const web3 = new Web3();

    try {
        const encodedForwarderData = web3.eth.abi.encodeFunctionCall(
            {
                inputs: [
                    {
                        components: [
                            {
                                internalType: 'address',
                                name: 'validator',
                                type: 'address',
                            },
                            {
                                internalType: 'address',
                                name: 'targetAddress',
                                type: 'address',
                            },
                            {
                                internalType: 'bytes',
                                name: 'data',
                                type: 'bytes',
                            },
                            {
                                internalType: 'address',
                                name: 'paymentToken',
                                type: 'address',
                            },
                            {
                                internalType: 'uint256',
                                name: 'paymentFees',
                                type: 'uint256',
                            },
                            {
                                internalType: 'uint256',
                                name: 'tokenGasPrice',
                                type: 'uint256',
                            },
                            {
                                internalType: 'uint256',
                                name: 'validTo',
                                type: 'uint256',
                            },
                            {
                                internalType: 'uint256',
                                name: 'nonce',
                                type: 'uint256',
                            },
                        ],
                        internalType: 'struct IForwarder.ForwardRequest',
                        name: 'request',
                        type: 'tuple',
                    },
                    {
                        internalType: 'bytes',
                        name: 'validatorSignature',
                        type: 'bytes',
                    },
                ],
                name: 'executeCall',
                outputs: [],
                stateMutability: 'payable',
                type: 'function',
                payable: true,
            },
            [
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                [
                    forwardRequest.signer,
                    forwardRequest.metaswap,
                    forwardRequest.calldata,
                    forwardRequest.paymentToken,
                    forwardRequest.paymentFees,
                    forwardRequest.tokenGasPrice,
                    forwardRequest.validTo,
                    forwardRequest.nonce,
                ],
                validatorSignature,
            ],
        );

        const estimatedGas = await estimateGas(
            chainId,
            from,
            '0',
            FORWARDER_ADDRESS[chainId],
            encodedForwarderData,
        );
        if (estimatedGas.err) {
            return estimatedGas;
        }
        const gas = estimatedGas.unwrap();

        // build transaction object
        const result: TransactionData = {
            from,
            to: FORWARDER_ADDRESS[chainId],
            data: encodedForwarderData,
            gas,
            value: '0',
            gasPrice,
        };

        return new Ok(result);
    } catch (error) {
        return new Err({
            statusCode: 400,
            data: `Error building calldata: ${error}`,
        });
    }
}

export function divCeil(divider, divisor) {
    const dm = divider.divmod(divisor);
 
   // Fast case - exact division
   if (dm.mod.isZero()) return dm.div;
 
   // Round up
   return dm.div.negative !== 0 ? dm.div.isubn(1) : dm.div.iaddn(1);
}

export function buildGaslessAggregatorCallData(
    betterRoute: AggregatorQuote,
    slippage: string,
    paymentToken: string,
    paymentFees: string,
    signer: string,
): Result<string, RequestError> {
    const web3 = new Web3();

    try {
        const tokenFrom = betterRoute.sellTokenAddress;
        const tokenTo = betterRoute.buyTokenAddress;

        const basicSellAmount =
            paymentToken === tokenFrom
                ? web3.utils
                    .toBN(betterRoute.sellAmount)
                    .sub(web3.utils.toBN(paymentFees))
                : web3.utils.toBN(betterRoute.sellAmount);
        if (basicSellAmount.isNeg()) {
            return new Err({
                statusCode: 400,
                data: 'Insufficient sell amount',
            });
        }
        const basicBuyAmount =
            paymentToken === tokenTo
                ? web3.utils
                    .toBN(betterRoute.buyAmount)
                    .sub(web3.utils.toBN(paymentFees))
                : web3.utils.toBN(betterRoute.buyAmount);

        if (basicBuyAmount.isNeg()) {
            return new Err({
                statusCode: 400,
                data: 'Insuficient buy amount',
            });
        }
        const amountFrom =
            betterRoute.tradeType === TradeType.ExactInput
                ? web3.utils.toHex(basicSellAmount)
                : web3.utils.toHex(
                    divCeil(basicSellAmount
                        .mul(
                            web3.utils
                                .toBN(100000)
                                .add(
                                    web3.utils.toBN(
                                        Number(slippage) * 100000,
                                    ),
                                ),
                        )
                        ,web3.utils.toBN(100000)),
                );

        const minAmount =
            betterRoute.tradeType === TradeType.ExactInput
                ? web3.utils.toHex(
                    divCeil(basicBuyAmount
                        .mul(
                            web3.utils
                                .toBN(100000)
                                .sub(
                                    web3.utils.toBN(
                                        Number(slippage) * 100000,
                                    ),
                                ),
                        )
                        ,web3.utils.toBN(100000)),
                )
                : web3.utils.toHex(basicBuyAmount);

        const aggregator = betterRoute.to;

        const aggregatorData = betterRoute.data;
        const adapterId = 'GaslessSwap';
        const adapterData = web3.eth.abi.encodeParameter(
            'tuple(address,address,uint256,uint256,address,uint256,address,address,bytes)',
            [
                tokenFrom,
                tokenTo,
                amountFrom,
                minAmount,
                paymentToken,
                paymentFees,
                signer,
                aggregator,
                aggregatorData,
            ],
        );

        // TODO build multicall if permitData is included
        const encodedData = web3.eth.abi.encodeFunctionCall(
            {
                name: 'swap',
                type: 'function',
                inputs: [
                    {
                        internalType: 'contract IERC20',
                        name: 'tokenFrom',
                        type: 'address',
                    },
                    {
                        internalType: 'uint256',
                        name: 'amount',
                        type: 'uint256',
                    },
                    {
                        internalType: 'address payable',
                        name: 'recipient',
                        type: 'address',
                    },
                    {
                        components: [
                            {
                                internalType: 'string',
                                name: 'adapterId',
                                type: 'string',
                            },
                            {
                                internalType: 'bytes',
                                name: 'data',
                                type: 'bytes',
                            },
                        ],
                        internalType: 'struct MetaSwapRouter.AdapterInfo',
                        name: 'adapterInfo',
                        type: 'tuple',
                    },
                ],
            },
            [
                tokenFrom,
                Web3.utils.toHex(amountFrom),
                betterRoute.recipient
                    ? betterRoute.recipient
                    : '0x0000000000000000000000000000000000000001',
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                [adapterId, adapterData],
            ],
        );

        return new Ok(encodedData);
    } catch (error) {
        return new Err({
            statusCode: 400,
            data: `Error: ${error}`,
        });
    }
}

export default async function simulateTransaction(
    chainId: number,
    slippage: string,
    resultQuote: ResultQuote,
    aggregatorQuote: AggregatorQuote,
    paymentTokenAddress: string,
    paymentFees: string,
    outputQuote: CompositeQuote,
    tx: TransactionData,
    signer: string,
    gasFees: string,
): Promise<Result<string, RequestError>> {
    const web3 = new Web3(Web3.givenProvider || PROVIDER_ADDRESS[chainId]);

    const calldatas = [];
    // 1.find payment token balance
    // 2. find eth balance
    // 3. Execute tx

    try {

    const paymentTokenBalanceData = web3.eth.abi.encodeFunctionCall(
        {
            inputs: [
                {
                    internalType: 'address',
                    name: 'account',
                    type: 'address',
                },
            ],
            name: 'balanceOf',
            outputs: [
                {
                    internalType: 'uint256',
                    name: '',
                    type: 'uint256',
                },
            ],
            stateMutability: 'view',
            type: 'function',
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        [MULTICALL_ADDRESS[chainId]],
    );

    const ethBalanceData = web3.eth.abi.encodeFunctionCall(
        {
            inputs: [
                {
                    internalType: 'address',
                    name: 'addr',
                    type: 'address',
                },
            ],
            name: 'getEthBalance',
            outputs: [
                {
                    internalType: 'uint256',
                    name: 'balance',
                    type: 'uint256',
                },
            ],
            stateMutability: 'view',
            type: 'function',
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        [MULTICALL_ADDRESS[chainId]],
    );

    const customSimulatorData = buildGaslessAggregatorCallData(
        aggregatorQuote,
        slippage,
        paymentTokenAddress,
        paymentFees,
        MULTICALL_ADDRESS[chainId],
    );

    // build and sign forwarder request
    const minutesToAdd = 10;
    const nonce = new Date().getTime();
    const validTo = new Date(nonce + minutesToAdd * 60000).getTime();
    const calldata = customSimulatorData.unwrap();

    const forwarderRequest: ForwarderRequest = {
        signer,
        metaswap: METASWAP_ROUTER_CONTRACT_ADDRESS[chainId],
        calldata,
        paymentToken: paymentTokenAddress,
        paymentFees,
        tokenGasPrice: '0',
        validTo,
        nonce,
    };

    const validatorSignature = await validatorSign(
        forwarderRequest,
        chainId,
        tx.from,
        FORWARDER_ADDRESS[chainId],
    );
    // build txn data
    const txData = await getTransactionData(
        forwarderRequest,
        validatorSignature.unwrap(),
        tx.from,
        resultQuote.tx.gasPrice,
        chainId,
    );

    // BUILD THE CALLDATA
    calldatas.push([MULTICALL_ADDRESS[chainId], 100000, ethBalanceData]);
    // user swap
    calldatas.push([
        txData.unwrap().to,
        txData.unwrap().gas * 2,
        txData.unwrap().data,
    ]);
    const isNonNativePaymentToken = (paymentTokenAddress !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' && outputQuote.aggregatorQuote);
    if (
        isNonNativePaymentToken
    ) {
        const approvalTokenData = web3.eth.abi.encodeFunctionCall(
            {
                inputs: [
                    {
                        internalType: 'address',
                        name: 'token',
                        type: 'address',
                    },
                    {
                        internalType: 'uint256',
                        name: 'amount',
                        type: 'uint256',
                    },
                    {
                        internalType: 'address',
                        name: 'spender',
                        type: 'address',
                    },
                ],
                name: 'approveToken',
                outputs: [],
                stateMutability: 'nonpayable',
                type: 'function',
            },
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            [
                paymentTokenAddress,
                paymentFees,
                outputQuote?.aggregatorQuote?.to,
            ],
        );

        calldatas.push([paymentTokenAddress, 100000, paymentTokenBalanceData]);
        calldatas.push([MULTICALL_ADDRESS[chainId], 100000, approvalTokenData]);

        // output swap
        calldatas.push([
            outputQuote.aggregatorQuote.to,
            outputQuote.aggregatorQuote.estimatedGas * 4,
            outputQuote.aggregatorQuote.data,
        ]);
    }
    calldatas.push([MULTICALL_ADDRESS[chainId], 100000, ethBalanceData]);

    // 4.approve payment token fees to metaswap
    // 5. execute aggregator quote to swap payment token to eth
    // 6. find payment token balance
    // 7. find eth token balance

    // after call
    // 8. check if 6-1 is equal to payment fees
    // 9. check if 7-2 is equal to gas fees (with acceptable margin)

    const encodedData = web3.eth.abi.encodeFunctionCall(
        {
            inputs: [
                {
                    components: [
                        {
                            internalType: 'address',
                            name: 'target',
                            type: 'address',
                        },
                        {
                            internalType: 'uint256',
                            name: 'gasLimit',
                            type: 'uint256',
                        },
                        {
                            internalType: 'bytes',
                            name: 'callData',
                            type: 'bytes',
                        },
                    ],
                    internalType: 'struct UniswapInterfaceMulticall.Call[]',
                    name: 'calls',
                    type: 'tuple[]',
                },
            ],
            name: 'multicall',
            outputs: [
                {
                    internalType: 'uint256',
                    name: 'blockNumber',
                    type: 'uint256',
                },
                {
                    components: [
                        {
                            internalType: 'bool',
                            name: 'success',
                            type: 'bool',
                        },
                        {
                            internalType: 'uint256',
                            name: 'gasUsed',
                            type: 'uint256',
                        },
                        {
                            internalType: 'bytes',
                            name: 'returnData',
                            type: 'bytes',
                        },
                    ],
                    internalType: 'struct UniswapInterfaceMulticall.Result[]',
                    name: 'returnData',
                    type: 'tuple[]',
                },
            ],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        [calldatas],
    );

    const result = await web3.eth.call({
        from: tx.from,
        to: MULTICALL_ADDRESS[chainId],
        data: encodedData,
    });

    const decodedData = web3.eth.abi.decodeParameters(
        [
            {
                internalType: 'uint256',
                name: 'blockNumber',
                type: 'uint256',
            },
            {
                components: [
                    {
                        internalType: 'bool',
                        name: 'success',
                        type: 'bool',
                    },
                    {
                        internalType: 'uint256',
                        name: 'gasUsed',
                        type: 'uint256',
                    },
                    {
                        internalType: 'bytes',
                        name: 'returnData',
                        type: 'bytes',
                    },
                ],
                internalType: 'struct UniswapInterfaceMulticall.Result[]',
                name: 'returnData',
                type: 'tuple[]',
            },
        ],
        result,
    );

    const resultData = decodedData.returnData;

    const beforeEthBalance = resultData[0]?.returnData;
    const afterEthBalance = isNonNativePaymentToken ? resultData[5]?.returnData : resultData[2]?.returnData;

    const paymentFeeBalance = isNonNativePaymentToken ? resultData[2]?.returnData : paymentFees;
    
    const paymentFeeBalanceBN = web3.utils.toBN(paymentFeeBalance);
    const ethBalanceDiff = web3.utils.toBN(afterEthBalance).sub(web3.utils.toBN(beforeEthBalance));

    const paymentFeeValid = paymentFeeBalanceBN.eq(web3.utils.toBN(paymentFees));
    if (!paymentFeeValid) {
        throw new Error('Cannot accept the token as a relayer fee');
    }

    const ethBalanceValid = ethBalanceDiff.gte(web3.utils.toBN(gasFees));
    if (!ethBalanceValid) {
        throw new Error('Cannot swap the token for native currency');
    }

    return new Ok(result);
    } catch(exception) {
        return new Err({
            statusCode: 400,
            data: exception?.toString(),
        });
    }
}