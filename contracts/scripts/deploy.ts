import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log(`====================================================`);
  console.log(`Deploying COLLECTIVE to network: ${network.name}`);
  console.log(`====================================================`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer native balance: ${ethers.formatEther(balance)} MON`);

  // 1. Deploy MockERC20 Token (MockUSD)
  console.log(`Deploying MockERC20 (Mock USD / mUSD)...`);
  const MockERC20Factory = await ethers.getContractFactory("MockERC20");
  const mockToken = await MockERC20Factory.deploy("Mock USD", "mUSD");
  await mockToken.waitForDeployment();
  const mockTokenAddress = await mockToken.getAddress();
  console.log(`MockERC20 deployed at: ${mockTokenAddress}`);

  // 2. Deploy CollectivePool Manager
  console.log(`Deploying CollectivePool...`);
  const CollectivePoolFactory = await ethers.getContractFactory("CollectivePool");
  const poolManager = await CollectivePoolFactory.deploy();
  await poolManager.waitForDeployment();
  const poolManagerAddress = await poolManager.getAddress();
  console.log(`CollectivePool deployed at: ${poolManagerAddress}`);

  // 3. Export deployment artifacts for the frontend
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    mockTokenAddress,
    poolManagerAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  const outputDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `${network.name}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Deployment metadata saved to: ${outputPath}`);

  console.log(`====================================================`);
  console.log(`Deployment completed successfully!`);
  console.log(`====================================================`);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
