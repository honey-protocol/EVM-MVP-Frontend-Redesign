import React, { FC, useState, useEffect, useContext } from 'react';
import Image from 'next/image';
import { InfoBlock } from '../InfoBlock/InfoBlock';
import { InputsBlock } from '../InputsBlock/InputsBlock';
import { HoneySlider } from '../HoneySlider/HoneySlider';
import * as styles from './WithdrawForm.css';
import { formatNumber } from '../../helpers/format';
import honeyGenesisBee from '/public/images/imagePlaceholder.png';
import HoneyButton from 'components/HoneyButton/HoneyButton';
import HexaBoxContainer from '../HexaBoxContainer/HexaBoxContainer';
import SidebarScroll from '../SidebarScroll/SidebarScroll';
import { WithdrawFormProps } from './types';
import { questionIcon } from 'styles/icons.css';
import { hAlign } from 'styles/common.css';
import useToast from 'hooks/useToast';
import { LendWorkFlowType } from "../../types/workflows";
import useDisplayStore from "../../store/displayStore";
import { UserContext } from "../../contexts/userContext";
import { useQueryClient } from "react-query";
import useLendFlowStore from "../../store/lendFlowStore";
import { getContractsByHTokenAddr } from "../../helpers/generalHelper";
import {
  useGetTotalUnderlyingBalance,
  useGetUnderlyingPriceInUSD,
  useGetUserUnderlyingBalance
} from "../../hooks/useHtokenHelper";
import { useGetUserBalance } from "../../hooks/useERC20";
import { useGetTotalBorrow } from "../../hooks/useHerc20";

const {format: f, formatPercent: fp, formatERC20: fs, parse: p} = formatNumber;

const WithdrawForm = (props: WithdrawFormProps) => {
  const {} = props;
  const setIsSidebarVisibleInMobile = useDisplayStore((state) => state.setIsSidebarVisibleInMobile)
  const {currentUser, setCurrentUser} = useContext(UserContext);
  const queryClient = useQueryClient();
  const walletPublicKey: string = currentUser?.get("ethAddress") || ""
  const HERC20ContractAddress = useLendFlowStore((state) => state.HERC20ContractAddr)

  const {
    htokenHelperContractAddress,
    ERC20ContractAddress,
    erc20Name,
    erc20Icon,
    name,
    icon,
    unit,
  } = getContractsByHTokenAddr(HERC20ContractAddress)
  const setWorkflow = useLendFlowStore((state) => state.setWorkflow)
  const [underlyingPrice, isLoadingUnderlyingPrice] = useGetUnderlyingPriceInUSD(htokenHelperContractAddress, HERC20ContractAddress)
  const [userUnderlyingBalance, isLoadingUserUnderlyingBalance] = useGetUserUnderlyingBalance(htokenHelperContractAddress, HERC20ContractAddress, currentUser, unit)
  const [totalUnderlyingBalance, isLoadingTotalUnderlyingBalance] = useGetTotalUnderlyingBalance(htokenHelperContractAddress, HERC20ContractAddress, unit)
  const [totalBorrow, isLoadingTotalBorrow] = useGetTotalBorrow(HERC20ContractAddress, unit)

  const [valueUSD, setValueUSD] = useState<number>(0);
  const [valueUnderlying, setValueUnderlying] = useState<number>(0);
  const [sliderValue, setSliderValue] = useState(0);
  const {toast, ToastComponent} = useToast();

  const maxValue = 100;
  const userTotalDeposits = 100
  const utilizationRate = 0.7

  useEffect(() => {
    if (isLoadingUnderlyingPrice || isLoadingUserUnderlyingBalance || isLoadingTotalUnderlyingBalance || isLoadingTotalBorrow) {
      toast.processing()
    } else {
      toast.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingUnderlyingPrice, isLoadingUserUnderlyingBalance, isLoadingTotalUnderlyingBalance, isLoadingTotalBorrow])

  // Put your validators here
  const isWithdrawButtonDisabled = () => {
    return false;
  };

  const handleSliderChange = (value: number) => {
    setSliderValue(value);
    setValueUSD(value * underlyingPrice);
    setValueUnderlying(value);
  };

  const handleUsdInputChange = (usdValue: number | undefined) => {
    if (!usdValue) {
      setValueUSD(0);
      setValueUnderlying(0);
      setSliderValue(0);
      return;
    }

    setValueUSD(usdValue);
    setValueUnderlying(usdValue / underlyingPrice);
    setSliderValue(usdValue);
  };

  const handleUnderlyingInputChange = (underlyingValue: number | undefined) => {
    if (!underlyingValue) {
      setValueUSD(0);
      setValueUnderlying(0);
      setSliderValue(0);
      return;
    }

    setValueUSD(underlyingValue * underlyingPrice);
    setValueUnderlying(underlyingValue);
    setSliderValue(underlyingValue);
  };

  const handleWithdraw = async () => {
    //await executeWithdraw(valueUnderlying, toast);
    handleSliderChange(0);
  };

  const onCancel = () => {
    setIsSidebarVisibleInMobile(false)
    setWorkflow(LendWorkFlowType.none)
    document.body.classList.remove('disable-scroll');
  }


  return (
    <SidebarScroll
      footer={
        toast?.state ? (
          <ToastComponent/>
        ) : (
          <div className={styles.buttons}>
            <div className={styles.smallCol}>
              <HoneyButton variant="secondary" onClick={onCancel}>
                Cancel
              </HoneyButton>
            </div>
            <div className={styles.bigCol}>
              <HoneyButton
                variant="primary"
                disabled={isWithdrawButtonDisabled()}
                isFluid={true}
                onClick={handleWithdraw}
              >
                Withdraw
              </HoneyButton>
            </div>
          </div>
        )
      }
    >
      <div className={styles.withdrawForm}>
        <div className={styles.nftInfo}>
          <div className={styles.nftImage}>
            <HexaBoxContainer>
              <Image src={honeyGenesisBee}/>
            </HexaBoxContainer>
          </div>
          <div className={styles.nftName}>Honey Genesis Bee</div>
        </div>
        <div className={styles.row}>
          <div className={styles.col}>
            <InfoBlock
              value={fs(userTotalDeposits)}
              valueSize="big"
              footer={<span>Your Deposits</span>}
            />
          </div>
          <div className={styles.col}>
            <InfoBlock
              value={fp()}
              valueSize="big"
              toolTipLabel="APY is measured by compounding the weekly interest rate"
              footer={
                <span className={hAlign}>
                  Estimated APY <div className={questionIcon}/>
                </span>
              }
            />
          </div>
          <div className={styles.col}>
            <InfoBlock
              value={fp(utilizationRate)}
              valueSize="big"
              toolTipLabel=" Amount of supplied liquidity currently being borrowed"
              footer={
                <span className={hAlign}>
                  Utilization rate <div className={questionIcon}/>
                </span>
              }
            />
          </div>
        </div>

        <div className={styles.inputs}>
          <InputsBlock
            firstInputValue={valueUSD}
            secondInputValue={valueUnderlying}
            onChangeFirstInput={handleUsdInputChange}
            onChangeSecondInput={handleUnderlyingInputChange}
            maxValue={maxValue}
          />
        </div>

        <HoneySlider
          currentValue={sliderValue}
          maxValue={maxValue}
          minAvailableValue={0}
          // maxSafePosition={0.4}
          // maxAvailablePosition={maxValue} // TODO: should be capped by available liquidity
          onChange={handleSliderChange}
        />
      </div>
    </SidebarScroll>
  );
};

export default WithdrawForm;
