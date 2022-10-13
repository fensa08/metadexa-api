/** @format */

import { SupportedChainId } from './tokens';

type AddressMap = { [chainId: number]: string };

// eslint-disable-next-line import/prefer-default-export
export const METASWAP_ROUTER_CONTRACT_ADDRESS: AddressMap = {
	[SupportedChainId.POLYGON]: '0x6afD834f6e3D5ad5A83E7838ca45F3DBDe3E323d',
};

export const MULTICALL_ADDRESS: AddressMap = {
	[SupportedChainId.POLYGON]: '0x7a1C1dc2a1B6d19135aDD10821dF70132A7f4E84',
};

export const FORWARDER_ADDRESS: AddressMap = {
	[SupportedChainId.POLYGON]: '0x316766609569e00c3484fE9e558A35b975064a62',
};

// eslint-disable-next-line import/prefer-default-export
export const FLASH_WALLET: AddressMap = {
	[SupportedChainId.POLYGON]: '0xDdBE6Efb0d5A2bf9ABA843290D7a69f4db03Bfdd',
};

export const ONEINCH_AGGREGATOR_ADDRESS: AddressMap = {
	[SupportedChainId.POLYGON]: '0x1111111254fb6c44bAC0beD2854e76F90643097d',
};

export const ZEROX_AGGREGATOR_ADDRESS: AddressMap = {
	[SupportedChainId.POLYGON]: '0xDef1C0ded9bec7F1a1670819833240f027b25EfF',
};

export const PROVIDER_ADDRESS: AddressMap = {
	[SupportedChainId.POLYGON]: 'https://polygon-rpc.com',
};
