// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title SyntheticAsset
 * @dev A basic smart contract for managing leveraged positions in synthetic assets.
 * @author SrikanthAlva
 */
contract SyntheticAsset is Ownable, Pausable {
    // using SafeMath for uint256;
    // Structure to represent a user's position
    struct Position {
        uint256 collateralAmount;
        uint256 synthAssetPrice;
        bool isLong; // True for long position, false for short position
    }

    error SyntheticAsset__InvalidAmount();
    error SyntheticAsset__PositionAlreadyOpen();
    error SyntheticAsset__PositionNotOpen();

    IERC20 private collateralAsset;
    uint256 private syntheticAssetPrice = 1000;

    mapping(address => uint256) private collateralBalances;
    mapping(address => bool) private isPositionOpen;
    mapping(address => Position) private leveragedPositions;

    event CollateralDeposited(address indexed user, uint256 indexed amount);
    event CollateralWithdrawn(address indexed user, uint256 indexed amount);
    event PositionOpened(address indexed user, uint256 indexed amount, uint256 indexed assetPrice, bool isLong);
    event PositionClosed(address indexed user, uint256 indexed amount, uint256 indexed assetPrice, bool isLong);

    /**
     * @dev constructor function to initialize the contract.
     * @param _collateralAsset The address of the ERC20 token used as collateral.
     */
    constructor(address _collateralAsset) Ownable(msg.sender) {
        collateralAsset = IERC20(_collateralAsset);
    }

    /*                                           */
    /*---Collateral Deposit Withdraw Functions---*/
    /*                                           */

    /**
     * @dev Function to deposit collateral
     * @param _collateralAmount The amount of collateral to deposit.
     */
    function depositCollateral(uint256 _collateralAmount) external whenNotPaused {
        if (_collateralAmount <= 0) revert SyntheticAsset__InvalidAmount();
        collateralAsset.transferFrom(msg.sender, address(this), _collateralAmount);
        collateralBalances[msg.sender] += _collateralAmount;
        emit CollateralDeposited(msg.sender, _collateralAmount);
    }

    /**
     * @dev Function to withdraw collateral.
     * @param _withdrawalAmount The amount of collateral to deposit.
     */
    function withdrawCollateral(uint256 _withdrawalAmount) external whenNotPaused {
        if (_withdrawalAmount <= 0 || _withdrawalAmount > collateralBalances[msg.sender])
            revert SyntheticAsset__InvalidAmount();
        collateralBalances[msg.sender] -= _withdrawalAmount;
        collateralAsset.transfer(msg.sender, _withdrawalAmount);
        emit CollateralWithdrawn(msg.sender, _withdrawalAmount);
    }

    /*                                           */
    /*---------Leverage Postion Functions--------*/
    /*                                           */

    /**
     * @dev Function to open a leveraged position.
     * @param _amount The amount of collateral to deposit.
     * @param _isLong Boolean indicating whether to open a long position.
     */
    function openPosition(uint256 _amount, bool _isLong) external whenNotPaused {
        if (_amount <= 0 || _amount > collateralBalances[msg.sender]) revert SyntheticAsset__InvalidAmount();

        if (isPositionOpen[msg.sender]) revert SyntheticAsset__PositionAlreadyOpen();

        collateralBalances[msg.sender] -= _amount;
        leveragedPositions[msg.sender] = Position(_amount, syntheticAssetPrice, _isLong);
        isPositionOpen[msg.sender] = true;

        emit PositionOpened(msg.sender, _amount, syntheticAssetPrice, _isLong);
    }

    /**
     * @dev Function to close a user's position and withdraw collateral.
     */
    function closePosition() external whenNotPaused {
        if (!isPositionOpen[msg.sender]) revert SyntheticAsset__PositionNotOpen();

        Position memory userPosition = leveragedPositions[msg.sender];
        (uint256 profitLoss, bool positive) = calculateProfitLoss(
            userPosition.collateralAmount,
            userPosition.synthAssetPrice
        );

        if (userPosition.isLong) {
            collateralBalances[msg.sender] += positive
                ? userPosition.collateralAmount + profitLoss
                : userPosition.collateralAmount - profitLoss;
        } else {
            collateralBalances[msg.sender] += positive
                ? userPosition.collateralAmount - profitLoss
                : userPosition.collateralAmount + profitLoss;
        }

        delete leveragedPositions[msg.sender];
        isPositionOpen[msg.sender] = false;

        emit PositionClosed(
            msg.sender,
            userPosition.collateralAmount,
            userPosition.synthAssetPrice,
            userPosition.isLong
        );
    }

    /*                                           */
    /* ----------Internal Function---------------*/
    /*                                           */

    function calculateProfitLoss(
        uint256 _amount,
        uint256 _assetPrice
    ) internal view returns (uint256 valueChange, bool positiveChange) {
        uint256 priceChange;
        if (syntheticAssetPrice > _assetPrice) {
            positiveChange = true;
            priceChange = syntheticAssetPrice - _assetPrice;
        } else {
            positiveChange = false;
            priceChange = _assetPrice - syntheticAssetPrice;
        }
        valueChange = (_amount * priceChange) / 1000;
    }

    /*                                           */
    /* ----------Admin Functions-----------------*/
    /*                                           */

    /**
     * @dev Function to close a user's position and withdraw collateral.
     */
    function updateSyntheticAssetPrice(uint256 price) external onlyOwner whenNotPaused {
        syntheticAssetPrice = price;
    }

    /**
     * @dev Function to pause critical operations of the contract.
     */
    function pause() public onlyOwner whenNotPaused {
        _pause();
    }

    /**
     * @dev Function to unpause critical operations of the contract.
     */
    function unpause() public onlyOwner whenPaused {
        _unpause();
    }

    /*                                           */
    /* ----------View Functions----------------- */
    /*                                           */

    /**
     * @dev Function to fetch Synthetic Asset Price.
     */
    function getSyntheticAssetPrice() public view returns (uint256) {
        return syntheticAssetPrice;
    }

    /**
     * @dev Function to fetch get User's Collateral Balance.
     */
    function getUserCollateralBalance(address _user) public view returns (uint256) {
        return collateralBalances[_user];
    }

    /**
     * @dev Function to fetch User's PositionOpen details.
     */
    function getUserPositionOpenInfo(address _user) public view returns (bool) {
        return isPositionOpen[_user];
    }

    /**
     * @dev Function to fetch User's LeveragedPosition details.
     */
    function getUserLeveragedPositions(address _user) public view returns (Position memory) {
        return leveragedPositions[_user];
    }
}
