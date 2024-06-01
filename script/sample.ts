import { ethers } from "hardhat"
import { USDCToken } from "../typechain-types"

const sampleScript = async () => {
    console.log("Helo")

    const usdcFactory = await ethers.getContractFactory("USDCToken")
    const usdcInstance = await usdcFactory.deploy()
    // "0x5FbDB2315678afecb367f032d93F642f64180aa3",

    console.log("resfsdf")

    const quant = await ethers.parseEther("1")
    console.log("resfsdf")

    const tx = await usdcInstance.mint(quant)
    console.log("resfsdf")
    await usdcInstance.mint(quant)

    const txr = await tx.wait(1)

    // console.log(tx.logs[0].args[0])
}

sampleScript().then(process.exit(0)).catch(process.exit(1))
