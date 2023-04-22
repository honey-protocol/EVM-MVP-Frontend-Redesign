import { FC } from 'react';
import { LendPositionCardProps } from '../types';
import * as styles from './LendPositionCard.css';
import HexaBoxContainer from '../../HexaBoxContainer/HexaBoxContainer';
import Image from 'next/image';
import { InfoBlock } from '../../InfoBlock/InfoBlock';
import { formatNumber, formatNFTName as fnn } from '../../../helpers/format';
import c from 'classnames';
import HoneyTooltip from '../../HoneyTooltip/HoneyTooltip';
import useLendFlowStore from 'store/lendFlowStore';
import { getContractsByHTokenAddr } from 'helpers/generalHelper';

const { formatShortName: fsn, formatPercent: fp } = formatNumber;

export const LendPositionCard: FC<LendPositionCardProps> = ({ position, onSelect }) => {
	const selectedMarket = useLendFlowStore((state) => state.HERC20ContractAddr);

	const { erc20Name, erc20Icon, formatDecimals } = getContractsByHTokenAddr(position.id);
	return (
		<div
			className={c(styles.positionCard, {
				[styles.activeCard]: selectedMarket === position.id
			})}
			onClick={() => onSelect(position.id)}
		>
			<div className={styles.collectionIcon}>
				<HexaBoxContainer>
					<Image width={46} height={46} src={position.image} alt={'collection Icon'} />
				</HexaBoxContainer>
			</div>
			<div className={styles.positionName}>
				<HoneyTooltip label={position.name}>{fnn(position.name)}</HoneyTooltip>
				<div className={styles.arrowIcon} />
			</div>
			<div className={styles.positionValues}>
				<InfoBlock title="IR" value={<span className={styles.irValue}>{fp(position.rate)}</span>} />
				<InfoBlock
					title="Your Deposit"
					value={fsn(parseFloat(position.deposit < '0' ? '0' : position.deposit))}
				/>
				<InfoBlock
					title="Supplied"
					value={
						<div className={styles.infoRow}>
							{fsn(position.supplied, formatDecimals)}
							<Image src={erc20Icon} alt={erc20Name} layout="fixed" width="16px" height="16px" />
						</div>
					}
				/>
				<InfoBlock
					title="Available"
					value={
						<div className={styles.infoRow}>
							{fsn(position.available, formatDecimals)}
							<Image src={erc20Icon} alt={erc20Name} layout="fixed" width="16px" height="16px" />
						</div>
					}
				/>
			</div>
		</div>
	);
};
