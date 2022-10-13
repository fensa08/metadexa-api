/** @format */
type AddressMap = { [chainId: number]: string };

export enum SupportedChainId {
	MAINNET = 1,
	ROPSTEN = 3,
	RINKEBY = 4,
	GOERLI = 5,
	KOVAN = 42,

	ARBITRUM_ONE = 42161,
	ARBITRUM_RINKEBY = 421611,
	OPTIMISM = 10,
	OPTIMISTIC_KOVAN = 69,

	POLYGON = 137,
	POLYGON_MUMBAI = 80001,
}

export const SupportedChains: AddressMap = {
	[SupportedChainId.POLYGON]: 'POLYGON',
	[SupportedChainId.MAINNET]: 'ETHEREUM',
	[SupportedChainId.ARBITRUM_ONE]: 'ARBITRUM',
	[SupportedChainId.OPTIMISM]: 'OPTIMISM',
};

export const CHAIN_NATIVE_TOKEN = {
	[SupportedChainId.ARBITRUM_ONE]:
		'0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
	[SupportedChainId.MAINNET]: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
	[SupportedChainId.POLYGON]: '0x0000000000000000000000000000000000001010',
	[SupportedChainId.OPTIMISM]: '0x4200000000000000000000000000000000000006',
};
