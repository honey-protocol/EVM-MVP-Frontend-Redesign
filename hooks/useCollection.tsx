import MoralisType from 'moralis-v1';
import { MarketTablePosition, MarketTableRow } from '../types/markets';
import { useQueries, useQuery } from 'react-query';
import { queryKeys } from '../helpers/queryHelper';
import { defaultCacheStaleTime } from '../constants/constant';
import { getLendData, getMarketData, getUserCoupons } from './useHtokenHelper';
import { getImageUrlFromMetaData } from '../helpers/NFThelper';
import { getMetaDataFromNFTId } from './useNFT';
import { LendTableRow } from '../types/lend';
import { generateMockHistoryData } from '../helpers/chartUtils';
import { TimestampPoint } from '../components/HoneyChart/types';
import { LiquidateTablePosition, LiquidateTableRow } from '../types/liquidate';
import { ActiveCouponQueryQuery, getBuiltGraphSDK } from '../.graphclient';
import { getNFTDefaultImage, getNFTName } from '../helpers/collateralHelper';

const defaultPosition: MarketTablePosition = {
	name: '',
	image: '',
	tokenId: '',
	couponId: ''
};

const defaultMarketData: MarketTableRow = {
	key: '',
	name: '',
	icon: '',
	erc20Icon: '',
	rate: 0,
	available: 0,
	supplied: 0
};

const defaultLendData: LendTableRow = {
	key: '',
	name: '',
	icon: '',
	erc20Icon: '',
	interest: 0,
	available: 0,
	supplied: 0,
	stats: []
};

export function useMarket(
	user: MoralisType.User | null,
	collections: collection[],
	htokenHelperContractAddress: string
): [MarketTableRow[], boolean] {
	const results = useQueries(
		collections.map((collection) => {
			return {
				queryKey: queryKeys.marketData(collection.HERC20ContractAddress),
				queryFn: async () => {
					if (htokenHelperContractAddress != '' || collection.HERC20ContractAddress != '') {
						try {
							const marketData = await getMarketData(
								htokenHelperContractAddress,
								collection.HERC20ContractAddress,
								collection.unit
							);
							const result: MarketTableRow = {
								key: collection.HERC20ContractAddress,
								name: `${collection.name}/${collection.erc20Name}`,
								icon: collection.icon,
								erc20Icon: collection.erc20Icon,
								rate: marketData.interestRate,
								available: parseFloat(marketData.available),
								supplied: parseFloat(marketData.supplied)
							};
							return result;
						} catch (e) {
							console.error('Error fetching market data with error');
							console.error(e);
							const result: MarketTableRow = {
								key: collection.HERC20ContractAddress,
								name: `${collection.name}/${collection.erc20Name}`,
								icon: collection.icon,
								erc20Icon: collection.erc20Icon,
								rate: 0,
								available: 0,
								supplied: 0
							};
							return result;
						}
					} else {
						return defaultMarketData;
					}
				},
				staleTime: defaultCacheStaleTime,
				retry: false
			};
		})
	);
	const marketResult = results
		.map((result) => result.data || defaultMarketData)
		.filter((data) => data.name != '');
	const isLoadingMarketData = results.some((query) => query.isLoading);
	const isFetchingMarketData = results.some((query) => query.isFetching);
	return [marketResult, isLoadingMarketData || isFetchingMarketData];
}

export function usePositions(
	htokenHelperContractAddress: string,
	HERC20ContractAddress: string,
	ERC721ContractAddress: string,
	user: MoralisType.User | null,
	unit: Unit
): [MarketTablePosition[], boolean] {
	const onGetCouponsSuccess = (data: coupon[]) => {
		return data;
	};
	const onGetCouponsError = () => {
		return [] as coupon[];
	};
	const walletPublicKey: string = user?.get('ethAddress') || '';
	const {
		data: couponList,
		isLoading: isLoadingCoupons,
		isFetching: isFetchingCoupons
	} = useQuery(
		queryKeys.listUserCoupons(HERC20ContractAddress, walletPublicKey),
		() => {
			if (walletPublicKey != '' && HERC20ContractAddress != '') {
				return getUserCoupons({
					htokenHelperContractAddress,
					HERC20ContractAddress,
					userAddress: walletPublicKey,
					unit
				});
			} else {
				return [] as Array<coupon>;
			}
		},
		{
			onSuccess: onGetCouponsSuccess,
			onError: onGetCouponsError,
			retry: false,
			staleTime: defaultCacheStaleTime
		}
	);

	const coupons = couponList || [];

	const results = useQueries(
		coupons.map((coupon) => {
			return {
				queryKey: queryKeys.NFTDetail(ERC721ContractAddress, coupon.NFTId),
				queryFn: async () => {
					if (walletPublicKey != '' && ERC721ContractAddress != '') {
						try {
							const metaData = await getMetaDataFromNFTId(ERC721ContractAddress, coupon.NFTId);
							const result: MarketTablePosition = {
								// id: `${metaData.name}-${metaData.token_id}`, //id will be name-tokenId
								name: metaData.name,
								image: getImageUrlFromMetaData(metaData.metadata || ''),
								tokenId: metaData.token_id,
								couponId: coupon.couponId
							};
							return result;
						} catch (e) {
							console.error('Error fetching market position with error');
							console.error(e);
							return defaultPosition;
						}
					} else {
						return defaultPosition;
					}
				},
				staleTime: defaultCacheStaleTime,
				retry: false,
				enabled: coupons.length > 0
			};
		})
	);
	const isLoadingPosition = results.some((query) => query.isLoading);
	const isFetchingPosition = results.some((query) => query.isFetching);
	const positions = results
		.map((result) => result.data || defaultPosition)
		.filter((position) => position.image != '');

	return [
		positions,
		isLoadingPosition || isFetchingPosition || isLoadingCoupons || isFetchingCoupons
	];
}

export function useLend(
	user: MoralisType.User | null,
	collections: collection[],
	htokenHelperContractAddress: string
): [LendTableRow[], boolean] {
	const results = useQueries(
		collections.map((collection) => {
			return {
				queryKey: queryKeys.lendMarketData(collection.HERC20ContractAddress),
				queryFn: async () => {
					if (htokenHelperContractAddress != '' || collection.HERC20ContractAddress != '') {
						try {
							const marketData = await getLendData(
								htokenHelperContractAddress,
								collection.HERC20ContractAddress,
								collection.unit
							);
							const result: LendTableRow = {
								key: collection.HERC20ContractAddress,
								name: `${collection.name}/${collection.erc20Name}`,
								icon: collection.icon,
								erc20Icon: collection.erc20Icon,
								interest: marketData.interestRate,
								available: parseFloat(marketData.available),
								supplied: parseFloat(marketData.supplied),
								stats: []
							};
							result.interest =
								result.interest * ((result.supplied - result.available) / result.supplied);
							return result;
						} catch (e) {
							console.error('Error fetching market data with error');
							console.error(e);
							const result: LendTableRow = {
								key: collection.HERC20ContractAddress,
								name: `${collection.name}/${collection.erc20Name}`,
								icon: collection.icon,
								erc20Icon: collection.erc20Icon,
								interest: 0,
								available: 0,
								supplied: 0,
								stats: []
							};
							return result;
						}
					} else {
						return defaultMarketData;
					}
				},
				staleTime: defaultCacheStaleTime,
				retry: false
			};
		})
	);

	const marketResult = results
		.map((result) => result.data || defaultLendData)
		.filter((data) => data.name != '');
	const isLoadingMarketData = results.some((query) => query.isLoading);
	const isFetchingMarketData = results.some((query) => query.isFetching);
	return [marketResult, isLoadingMarketData || isFetchingMarketData];
}

//todo add graph later
export function useLendPositions(): [Array<TimestampPoint>, boolean] {
	const from = new Date().setFullYear(new Date().getFullYear() - 1).valueOf();
	const to = new Date().valueOf();
	return [generateMockHistoryData(from, to), false];
}

export function useLiquidation(
	user: MoralisType.User | null,
	collections: collection[]
): LiquidateTableRow[] {
	const result = collections.map((collection) => {
		const liquidateTableRow: LiquidateTableRow = {
			key: collection.HERC20ContractAddress,
			name: `${collection.name}/${collection.erc20Name}`,
			icon: collection.icon,
			erc20Icon: collection.erc20Icon,
			risk: 0.1,
			liqThreshold: 0.75,
			totalDebt: 30,
			tvl: 15
		};
		return liquidateTableRow;
	});
	return result;
}

export function useLiquidationPositions(
	HERC20ContractAddress: string
): [LiquidateTablePosition[], boolean] {
	const sdk = getBuiltGraphSDK();
	const onSubgraphQuerySuccess = (data: ActiveCouponQueryQuery) => {
		return data;
	};
	const onSubGraphQueryError = () => {
		return null;
	};
	const {
		data: collateralsFromSubgraph,
		isLoading,
		isFetching
	} = useQuery(
		queryKeys.listCollateral(HERC20ContractAddress),
		async () => {
			if (HERC20ContractAddress != '') {
				return await sdk.ActiveCouponByCollectionQuery({
					HERC20ContractAddress: HERC20ContractAddress.toLowerCase()
				});
			} else {
				return [];
			}
		},
		{
			onSuccess: onSubgraphQuerySuccess,
			onError: onSubGraphQueryError,
			retry: false,
			staleTime: defaultCacheStaleTime
		}
	);
	const positionList = collateralsFromSubgraph?.coupons?.map((collateralObj) => {
		const result: LiquidateTablePosition = {
			name: getNFTName(collateralObj.hTokenAddr),
			image: getNFTDefaultImage(collateralObj.hTokenAddr),
			couponId: collateralObj.couponID,
			tokenId: collateralObj.collateralID,
			healthLvl: 0.5,
			untilLiquidation: 0.1,
			debt: collateralObj.amount,
			estimatedValue: 0.5
		};
		return result;
	});

	return [positionList || [], isLoading || isFetching];
}
