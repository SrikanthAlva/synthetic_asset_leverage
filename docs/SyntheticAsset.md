# Solidity API

## SyntheticAsset

_A basic smart contract for managing leveraged positions in synthetic assets._

### Position

```solidity
struct Position {
  uint256 collateralAmount;
  uint256 synthAssetPrice;
  bool isLong;
}
```

### SyntheticAsset\_\_InvalidAmount

```solidity
error SyntheticAsset__InvalidAmount()
```

### SyntheticAsset\_\_PositionAlreadyOpen

```solidity
error SyntheticAsset__PositionAlreadyOpen()
```

### SyntheticAsset\_\_PositionNotOpen

```solidity
error SyntheticAsset__PositionNotOpen()
```

### CollateralDeposited

```solidity
event CollateralDeposited(address user, uint256 amount)
```

### CollateralWithdrawn

```solidity
event CollateralWithdrawn(address user, uint256 amount)
```

### PositionOpened

```solidity
event PositionOpened(address user, uint256 amount, uint256 assetPrice, bool isLong)
```

### PositionClosed

```solidity
event PositionClosed(address user, uint256 amount, uint256 assetPrice, bool isLong)
```

### constructor

```solidity
constructor(address _collateralAsset) public
```

_constructor function to initialize the contract._

#### Parameters

| Name              | Type    | Description                                        |
| ----------------- | ------- | -------------------------------------------------- |
| \_collateralAsset | address | The address of the ERC20 token used as collateral. |

### depositCollateral

```solidity
function depositCollateral(uint256 _collateralAmount) external
```

_Function to deposit collateral_

#### Parameters

| Name               | Type    | Description                          |
| ------------------ | ------- | ------------------------------------ |
| \_collateralAmount | uint256 | The amount of collateral to deposit. |

### withdrawCollateral

```solidity
function withdrawCollateral(uint256 _withdrawalAmount) external
```

_Function to withdraw collateral._

#### Parameters

| Name               | Type    | Description                          |
| ------------------ | ------- | ------------------------------------ |
| \_withdrawalAmount | uint256 | The amount of collateral to deposit. |

### openPosition

```solidity
function openPosition(uint256 _amount, bool _isLong) external
```

_Function to open a leveraged position._

#### Parameters

| Name     | Type    | Description                                         |
| -------- | ------- | --------------------------------------------------- |
| \_amount | uint256 | The amount of collateral to deposit.                |
| \_isLong | bool    | Boolean indicating whether to open a long position. |

### closePosition

```solidity
function closePosition() external
```

_Function to close a user's position and withdraw collateral._

### calculateProfitLoss

```solidity
function calculateProfitLoss(uint256 _amount, uint256 _assetPrice) internal view returns (uint256 valueChange, bool positiveChange)
```

### updateSyntheticAssetPrice

```solidity
function updateSyntheticAssetPrice(uint256 price) external
```

_Function to close a user's position and withdraw collateral._

### pause

```solidity
function pause() public
```

_Function to pause critical operations of the contract._

### unpause

```solidity
function unpause() public
```

_Function to unpause critical operations of the contract._

### getSyntheticAssetPrice

```solidity
function getSyntheticAssetPrice() public view returns (uint256)
```

_Function to fetch Synthetic Asset Price._

### getUserCollateralBalance

```solidity
function getUserCollateralBalance(address _user) public view returns (uint256)
```

_Function to fetch get User's Collateral Balance._

### getUserPositionOpenInfo

```solidity
function getUserPositionOpenInfo(address _user) public view returns (bool)
```

_Function to fetch User's PositionOpen details._

### getUserLeveragedPositions

```solidity
function getUserLeveragedPositions(address _user) public view returns (struct SyntheticAsset.Position)
```

_Function to fetch User's LeveragedPosition details._
