import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"

const JAN_1ST_2030 = 1893456000
const ONE_GWEI: bigint = 1_000_000_000n

const SyntheticAssetModule = buildModule("SyntheticAssetModule", (m) => {
    const usdcToken = m.contract("USDCToken")
    // const usdcAddress = m.contract("ReceivesAnAddress", [usdcToken]);
    // console.log(usdcAddress)

    const synthAsset = m.contract("SyntheticAsset", [usdcToken])

    return { usdcToken, synthAsset }
})

export default SyntheticAssetModule
