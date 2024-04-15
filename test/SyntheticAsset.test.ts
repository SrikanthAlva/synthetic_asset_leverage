import { time, loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers"
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs"
import { expect } from "chai"
import hre, { ethers } from "hardhat"

describe("SyntheticAsset", function () {
    const TOKEN_MINT = ethers.parseEther("10")
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deploySyntheticAssetFixture() {
        // Contracts are deployed using the first signer/account by default

        const [deployer, otherAccount] = await hre.ethers.getSigners()

        const USDCToken = await hre.ethers.getContractFactory("USDCToken")
        const usdcToken = await USDCToken.deploy()

        await usdcToken.connect(otherAccount).mint(TOKEN_MINT)

        const SyntheticAsset = await hre.ethers.getContractFactory("SyntheticAsset")
        const syntheticAsset = await SyntheticAsset.deploy(usdcToken.getAddress())

        await usdcToken.connect(otherAccount).approve(syntheticAsset, TOKEN_MINT)
        return { syntheticAsset, usdcToken, deployer, otherAccount }
    }

    describe("Deployment", function () {
        describe("SyntheticAsset", function () {
            it("Should be deployed", async function () {
                const { usdcToken, syntheticAsset } = await loadFixture(deploySyntheticAssetFixture)

                const synthAddress = await syntheticAsset.getAddress()
                const usdcAddress = await usdcToken.getAddress()

                const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000"
                // console.log(synthAddress)
                expect(synthAddress).to.not.equal(ADDRESS_ZERO)
                expect(usdcAddress).to.not.equal(ADDRESS_ZERO)
            })

            it("Should set the syntheticAssetPrice", async function () {
                const { syntheticAsset } = await loadFixture(deploySyntheticAssetFixture)
                const INITIAL_PRICE = 1000
                expect(await syntheticAsset.getSyntheticAssetPrice()).to.equal(INITIAL_PRICE)
            })

            it("Should set the right owner", async function () {
                const { syntheticAsset, deployer } = await loadFixture(deploySyntheticAssetFixture)

                expect(await syntheticAsset.owner()).to.equal(deployer)
            })

            it("Should be unpaused", async function () {
                const { syntheticAsset } = await loadFixture(deploySyntheticAssetFixture)
                expect(await syntheticAsset.paused()).to.equal(false)
            })
        })

        describe("USDCToken", function () {
            it("Should have minted tokens to otherAccount", async function () {
                const { usdcToken, otherAccount } = await loadFixture(deploySyntheticAssetFixture)
                expect(await usdcToken.balanceOf(otherAccount)).to.equal(TOKEN_MINT)
            })

            it("Should have provided allowance to synthetic Contract", async function () {
                const { usdcToken, otherAccount, syntheticAsset } = await loadFixture(deploySyntheticAssetFixture)
                expect(await usdcToken.allowance(otherAccount, syntheticAsset)).to.equal(TOKEN_MINT)
            })

            it("Should have proper decimals value", async function () {
                const { usdcToken } = await loadFixture(deploySyntheticAssetFixture)
                const DECIMALS = 6
                expect(await usdcToken.decimals()).to.equal(DECIMALS)
            })
        })
    })

    describe("Deposit", function () {
        it("should deposit usdc tokens", async function () {
            const { otherAccount, syntheticAsset } = await loadFixture(deploySyntheticAssetFixture)
            await syntheticAsset.connect(otherAccount).depositCollateral(TOKEN_MINT)
            const colateralDeposit = await syntheticAsset.getUserCollateralBalance(otherAccount)

            expect(colateralDeposit).to.be.equal(TOKEN_MINT)
        })
    })

    describe("Withdraw", function () {
        it("should withdraw collateral", async function () {
            const { otherAccount, syntheticAsset } = await loadFixture(deploySyntheticAssetFixture)
            await syntheticAsset.connect(otherAccount).depositCollateral(TOKEN_MINT)
            const colateralDepositStart = await syntheticAsset.getUserCollateralBalance(otherAccount)

            await syntheticAsset.connect(otherAccount).withdrawCollateral(TOKEN_MINT)
            const colateralDepositEnd = await syntheticAsset.getUserCollateralBalance(otherAccount)

            expect(colateralDepositStart).to.be.equal(TOKEN_MINT)
            expect(colateralDepositEnd).to.be.equal(0)
        })

        it("should revert  on higher withdrawal attempt than collateral", async function () {
            const { otherAccount, syntheticAsset } = await loadFixture(deploySyntheticAssetFixture)
            await syntheticAsset.connect(otherAccount).depositCollateral(TOKEN_MINT)
            const colateralDepositStart = await syntheticAsset.getUserCollateralBalance(otherAccount)
            const WITHDRAW_AMOUNT = ethers.parseEther("11")

            await expect(
                syntheticAsset.connect(otherAccount).withdrawCollateral(WITHDRAW_AMOUNT),
            ).to.be.revertedWithCustomError(syntheticAsset, "SyntheticAsset__InvalidAmount")
        })
    })

    describe("Create Positions", function () {
        const QUANT = ethers.parseEther("5")

        async function depositTokenFixture() {
            const { otherAccount, syntheticAsset } = await loadFixture(deploySyntheticAssetFixture)
            await syntheticAsset.connect(otherAccount).depositCollateral(TOKEN_MINT)

            return { syntheticAsset, otherAccount }
        }
        it("should place long postion leverages", async function () {
            const { otherAccount, syntheticAsset } = await loadFixture(depositTokenFixture)

            await syntheticAsset.connect(otherAccount).openPosition(QUANT, true)

            const isPositionOpen = await syntheticAsset.getUserPositionOpenInfo(otherAccount)
            const leveragedAmount = (await syntheticAsset.getUserLeveragedPositions(otherAccount))[0]

            expect(isPositionOpen).to.be.equal(true)
            expect(leveragedAmount.toString()).to.be.equal(QUANT.toString())
        })

        it("should close long postion leverages", async function () {
            const { otherAccount, syntheticAsset } = await loadFixture(depositTokenFixture)

            await syntheticAsset.connect(otherAccount).openPosition(QUANT, true)

            const isPositionOpenStart = await syntheticAsset.getUserPositionOpenInfo(otherAccount)
            const leveragedAmountStart = (await syntheticAsset.getUserLeveragedPositions(otherAccount))[0]

            await syntheticAsset.connect(otherAccount).closePosition()

            const isPositionOpenEnd = await syntheticAsset.getUserPositionOpenInfo(otherAccount)
            const leveragedAmountEnd = (await syntheticAsset.getUserLeveragedPositions(otherAccount))[0]

            expect(isPositionOpenStart).to.be.equal(true)
            expect(leveragedAmountStart.toString()).to.be.equal(QUANT.toString())
            expect(isPositionOpenEnd).to.be.equal(false)
            expect(leveragedAmountEnd.toString()).to.be.equal("0")
        })
    })

    describe("Long Position", function () {
        const QUANT = ethers.parseEther("5")
        const FINAL_PLUS_BALANCE = ethers.parseEther("11")
        const FINAL_MINUS_BALANCE = ethers.parseEther("9")

        async function depositTokenFixture() {
            const { otherAccount, syntheticAsset } = await loadFixture(deploySyntheticAssetFixture)
            await syntheticAsset.connect(otherAccount).depositCollateral(TOKEN_MINT)
            await syntheticAsset.connect(otherAccount).openPosition(QUANT, true)
            return { syntheticAsset, otherAccount }
        }

        it("should increase value on successfull long postion closer", async function () {
            const { otherAccount, syntheticAsset } = await loadFixture(depositTokenFixture)

            const isPositionOpenStart = await syntheticAsset.getUserPositionOpenInfo(otherAccount)
            const leveragedAmountStart = (await syntheticAsset.getUserLeveragedPositions(otherAccount))[0]

            await syntheticAsset.updateSyntheticAssetPrice(1200)
            await syntheticAsset.connect(otherAccount).closePosition()

            const isPositionOpenEnd = await syntheticAsset.getUserPositionOpenInfo(otherAccount)
            const leveragedAmountEnd = (await syntheticAsset.getUserLeveragedPositions(otherAccount))[0]
            const colateralDepositEnd = await syntheticAsset.getUserCollateralBalance(otherAccount)

            expect(isPositionOpenStart).to.be.equal(true)
            expect(leveragedAmountStart.toString()).to.be.equal(QUANT.toString())
            expect(isPositionOpenEnd).to.be.equal(false)
            expect(leveragedAmountEnd.toString()).to.be.equal("0")
            expect(colateralDepositEnd).to.be.equal(FINAL_PLUS_BALANCE)
        })

        it("should decrease value on failed long postion closer", async function () {
            const { otherAccount, syntheticAsset } = await loadFixture(depositTokenFixture)

            const isPositionOpenStart = await syntheticAsset.getUserPositionOpenInfo(otherAccount)
            const leveragedAmountStart = (await syntheticAsset.getUserLeveragedPositions(otherAccount))[0]

            await syntheticAsset.updateSyntheticAssetPrice(800)
            await syntheticAsset.connect(otherAccount).closePosition()

            const isPositionOpenEnd = await syntheticAsset.getUserPositionOpenInfo(otherAccount)
            const leveragedAmountEnd = (await syntheticAsset.getUserLeveragedPositions(otherAccount))[0]
            const colateralDepositEnd = await syntheticAsset.getUserCollateralBalance(otherAccount)

            expect(isPositionOpenStart).to.be.equal(true)
            expect(leveragedAmountStart.toString()).to.be.equal(QUANT.toString())
            expect(isPositionOpenEnd).to.be.equal(false)
            expect(leveragedAmountEnd.toString()).to.be.equal("0")
            expect(colateralDepositEnd).to.be.equal(FINAL_MINUS_BALANCE)
        })
    })

    describe("Short Position", function () {
        const QUANT = ethers.parseEther("5")
        const FINAL_PLUS_BALANCE = ethers.parseEther("11")
        const FINAL_MINUS_BALANCE = ethers.parseEther("9")

        async function depositTokenFixture() {
            const { otherAccount, syntheticAsset } = await loadFixture(deploySyntheticAssetFixture)
            await syntheticAsset.connect(otherAccount).depositCollateral(TOKEN_MINT)
            await syntheticAsset.connect(otherAccount).openPosition(QUANT, false)
            return { syntheticAsset, otherAccount }
        }

        it("should increase value on successfull short postion closer", async function () {
            const { otherAccount, syntheticAsset } = await loadFixture(depositTokenFixture)

            const isPositionOpenStart = await syntheticAsset.getUserPositionOpenInfo(otherAccount)
            const leveragedAmountStart = (await syntheticAsset.getUserLeveragedPositions(otherAccount))[0]

            await syntheticAsset.updateSyntheticAssetPrice(800)
            await syntheticAsset.connect(otherAccount).closePosition()

            const isPositionOpenEnd = await syntheticAsset.getUserPositionOpenInfo(otherAccount)
            const leveragedAmountEnd = (await syntheticAsset.getUserLeveragedPositions(otherAccount))[0]
            const colateralDepositEnd = await syntheticAsset.getUserCollateralBalance(otherAccount)

            expect(isPositionOpenStart).to.be.equal(true)
            expect(leveragedAmountStart.toString()).to.be.equal(QUANT.toString())
            expect(isPositionOpenEnd).to.be.equal(false)
            expect(leveragedAmountEnd.toString()).to.be.equal("0")
            expect(colateralDepositEnd).to.be.equal(FINAL_PLUS_BALANCE)
        })

        it("should decrease value on failed short postion closer", async function () {
            const { otherAccount, syntheticAsset } = await loadFixture(depositTokenFixture)

            const isPositionOpenStart = await syntheticAsset.getUserPositionOpenInfo(otherAccount)
            const leveragedAmountStart = (await syntheticAsset.getUserLeveragedPositions(otherAccount))[0]

            await syntheticAsset.updateSyntheticAssetPrice(1200)
            await syntheticAsset.connect(otherAccount).closePosition()

            const isPositionOpenEnd = await syntheticAsset.getUserPositionOpenInfo(otherAccount)
            const leveragedAmountEnd = (await syntheticAsset.getUserLeveragedPositions(otherAccount))[0]
            const colateralDepositEnd = await syntheticAsset.getUserCollateralBalance(otherAccount)

            expect(isPositionOpenStart).to.be.equal(true)
            expect(leveragedAmountStart.toString()).to.be.equal(QUANT.toString())
            expect(isPositionOpenEnd).to.be.equal(false)
            expect(leveragedAmountEnd.toString()).to.be.equal("0")
            expect(colateralDepositEnd).to.be.equal(FINAL_MINUS_BALANCE)
        })
    })
})
