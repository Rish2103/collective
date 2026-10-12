import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { CollectivePool, MockERC20 } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("COLLECTIVE Smart Contract Test Suite", function () {
  let poolManager: CollectivePool;
  let mockToken: MockERC20;
  let deployer: HardhatEthersSigner;
  let creator: HardhatEthersSigner;
  let recipient: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;

  const TARGET_AMOUNT = ethers.parseEther("1000"); // 1,000 MockUSD
  const ONE_DAY = 24 * 60 * 60; // 86,400 seconds

  beforeEach(async function () {
    [deployer, creator, recipient, alice, bob] = await ethers.getSigners();

    // Deploy MockERC20
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    mockToken = (await MockERC20Factory.deploy("Mock USD", "mUSD")) as MockERC20;
    await mockToken.waitForDeployment();

    // Deploy CollectivePool
    const CollectivePoolFactory = await ethers.getContractFactory("CollectivePool");
    poolManager = (await CollectivePoolFactory.deploy()) as CollectivePool;
    await poolManager.waitForDeployment();

    // Fund alice and bob with tokens
    await mockToken.connect(alice).mint(alice.address, ethers.parseEther("2000"));
    await mockToken.connect(bob).mint(bob.address, ethers.parseEther("2000"));

    // Approve pool manager
    await mockToken.connect(alice).approve(await poolManager.getAddress(), ethers.MaxUint256);
    await mockToken.connect(bob).approve(await poolManager.getAddress(), ethers.MaxUint256);
  });

  describe("Pool Creation", function () {
    it("should successfully create a pool with valid parameters", async function () {
      const tx = await poolManager.connect(creator).createPool(
        await mockToken.getAddress(),
        recipient.address,
        TARGET_AMOUNT,
        ONE_DAY,
        "Vacation Trip Fund",
        "Funding pool for annual team trip"
      );

      await expect(tx)
        .to.emit(poolManager, "PoolCreated")
        .withArgs(
          0,
          creator.address,
          recipient.address,
          await mockToken.getAddress(),
          TARGET_AMOUNT,
          (await time.latest()) + ONE_DAY,
          "Vacation Trip Fund"
        );

      const pool = await poolManager.pools(0);
      expect(pool.creator).to.equal(creator.address);
      expect(pool.recipient).to.equal(recipient.address);
      expect(pool.token).to.equal(await mockToken.getAddress());
      expect(pool.targetAmount).to.equal(TARGET_AMOUNT);
      expect(pool.totalContributed).to.equal(0n);
      expect(pool.state).to.equal(0); // PoolState.Active
      expect(await poolManager.getPoolCount()).to.equal(1n);
    });

    it("should revert if token address is zero", async function () {
      await expect(
        poolManager.createPool(
          ethers.ZeroAddress,
          recipient.address,
          TARGET_AMOUNT,
          ONE_DAY,
          "Pool",
          "Desc"
        )
      ).to.be.revertedWith("Invalid token address");
    });

    it("should revert if recipient address is zero", async function () {
      await expect(
        poolManager.createPool(
          await mockToken.getAddress(),
          ethers.ZeroAddress,
          TARGET_AMOUNT,
          ONE_DAY,
          "Pool",
          "Desc"
        )
      ).to.be.revertedWith("Invalid recipient address");
    });

    it("should revert if target is zero", async function () {
      await expect(
        poolManager.createPool(
          await mockToken.getAddress(),
          recipient.address,
          0n,
          ONE_DAY,
          "Pool",
          "Desc"
        )
      ).to.be.revertedWith("Target must be greater than zero");
    });

    it("should revert if duration is zero", async function () {
      await expect(
        poolManager.createPool(
          await mockToken.getAddress(),
          recipient.address,
          TARGET_AMOUNT,
          0n,
          "Pool",
          "Desc"
        )
      ).to.be.revertedWith("Duration must be greater than zero");
    });

    it("should revert if title is empty", async function () {
      await expect(
        poolManager.createPool(
          await mockToken.getAddress(),
          recipient.address,
          TARGET_AMOUNT,
          ONE_DAY,
          "",
          "Desc"
        )
      ).to.be.revertedWith("Title cannot be empty");
    });
  });

  describe("Contributions", function () {
    beforeEach(async function () {
      await poolManager.connect(creator).createPool(
        await mockToken.getAddress(),
        recipient.address,
        TARGET_AMOUNT,
        ONE_DAY,
        "Demo Pool",
        "Test Description"
      );
    });

    it("should record contributions accurately and transfer tokens to contract", async function () {
      const contributionAlice = ethers.parseEther("400");
      const tx = await poolManager.connect(alice).contribute(0, contributionAlice);

      await expect(tx)
        .to.emit(poolManager, "ContributionMade")
        .withArgs(0, alice.address, contributionAlice, contributionAlice);

      const pool = await poolManager.pools(0);
      expect(pool.totalContributed).to.equal(contributionAlice);

      const userContrib = await poolManager.contributions(0, alice.address);
      expect(userContrib).to.equal(contributionAlice);

      const contractBalance = await mockToken.balanceOf(await poolManager.getAddress());
      expect(contractBalance).to.equal(contributionAlice);

      const contributors = await poolManager.getContributors(0);
      expect(contributors).to.deep.equal([alice.address]);
    });

    it("should handle multiple contributors correctly", async function () {
      await poolManager.connect(alice).contribute(0, ethers.parseEther("600"));
      await poolManager.connect(bob).contribute(0, ethers.parseEther("400"));

      const pool = await poolManager.pools(0);
      expect(pool.totalContributed).to.equal(TARGET_AMOUNT);

      const contributors = await poolManager.getContributors(0);
      expect(contributors).to.deep.equal([alice.address, bob.address]);
    });

    it("should revert if contributing to a non-existent pool", async function () {
      await expect(
        poolManager.connect(alice).contribute(999, ethers.parseEther("100"))
      ).to.be.revertedWith("Pool does not exist");
    });

    it("should revert if contributing 0 tokens", async function () {
      await expect(
        poolManager.connect(alice).contribute(0, 0n)
      ).to.be.revertedWith("Contribution must be greater than zero");
    });

    it("should revert if deadline has passed", async function () {
      await time.increase(ONE_DAY + 1);

      await expect(
        poolManager.connect(alice).contribute(0, ethers.parseEther("100"))
      ).to.be.revertedWith("Pool deadline has passed");
    });
  });

  describe("Payout Flow (Happy Path: Target Met)", function () {
    beforeEach(async function () {
      await poolManager.connect(creator).createPool(
        await mockToken.getAddress(),
        recipient.address,
        TARGET_AMOUNT,
        ONE_DAY,
        "Target Hit Pool",
        "Test"
      );

      // Alice contributes 600, Bob contributes 400 (Target = 1000)
      await poolManager.connect(alice).contribute(0, ethers.parseEther("600"));
      await poolManager.connect(bob).contribute(0, ethers.parseEther("400"));
    });

    it("should allow claiming payout when target is met and transfer funds to recipient", async function () {
      const recipientInitialBalance = await mockToken.balanceOf(recipient.address);

      const tx = await poolManager.connect(creator).claimPayout(0);

      await expect(tx)
        .to.emit(poolManager, "PayoutClaimed")
        .withArgs(0, recipient.address, TARGET_AMOUNT);

      const recipientFinalBalance = await mockToken.balanceOf(recipient.address);
      expect(recipientFinalBalance - recipientInitialBalance).to.equal(TARGET_AMOUNT);

      const pool = await poolManager.pools(0);
      expect(pool.state).to.equal(1); // PoolState.PaidOut

      const contractBalance = await mockToken.balanceOf(await poolManager.getAddress());
      expect(contractBalance).to.equal(0n);
    });

    it("should disallow contributions once paid out", async function () {
      await poolManager.claimPayout(0);

      await expect(
        poolManager.connect(alice).contribute(0, ethers.parseEther("50"))
      ).to.be.revertedWith("Pool is not active");
    });

    it("should disallow claiming payout twice", async function () {
      await poolManager.claimPayout(0);

      await expect(poolManager.claimPayout(0)).to.be.revertedWith("Pool is not active");
    });

    it("should revert payout if target has not been reached", async function () {
      // Create pool 1 with high target
      await poolManager.connect(creator).createPool(
        await mockToken.getAddress(),
        recipient.address,
        TARGET_AMOUNT,
        ONE_DAY,
        "Unfinished Pool",
        "Test"
      );
      await poolManager.connect(alice).contribute(1, ethers.parseEther("500"));

      await expect(poolManager.claimPayout(1)).to.be.revertedWith(
        "Target amount has not been reached"
      );
    });
  });

  describe("Refund Flow (Sad Path: Deadline Passed & Target Not Met)", function () {
    const ALICE_DEPOSIT = ethers.parseEther("300");
    const BOB_DEPOSIT = ethers.parseEther("200");

    beforeEach(async function () {
      await poolManager.connect(creator).createPool(
        await mockToken.getAddress(),
        recipient.address,
        TARGET_AMOUNT,
        ONE_DAY,
        "Expired Pool",
        "Test"
      );

      await poolManager.connect(alice).contribute(0, ALICE_DEPOSIT);
      await poolManager.connect(bob).contribute(0, BOB_DEPOSIT);
    });

    it("should revert refund if deadline has not passed yet", async function () {
      await expect(poolManager.connect(alice).claimRefund(0)).to.be.revertedWith(
        "Pool has not yet expired"
      );
    });

    it("should allow contributors to claim 100% refund once deadline passes under target", async function () {
      await time.increase(ONE_DAY + 1);

      const aliceBalBefore = await mockToken.balanceOf(alice.address);
      const txAlice = await poolManager.connect(alice).claimRefund(0);

      await expect(txAlice)
        .to.emit(poolManager, "RefundClaimed")
        .withArgs(0, alice.address, ALICE_DEPOSIT);

      const aliceBalAfter = await mockToken.balanceOf(alice.address);
      expect(aliceBalAfter - aliceBalBefore).to.equal(ALICE_DEPOSIT);

      // Verify Alice cannot refund again
      await expect(poolManager.connect(alice).claimRefund(0)).to.be.revertedWith(
        "No contribution to refund"
      );

      // Bob claims his refund
      const bobBalBefore = await mockToken.balanceOf(bob.address);
      await poolManager.connect(bob).claimRefund(0);
      const bobBalAfter = await mockToken.balanceOf(bob.address);
      expect(bobBalAfter - bobBalBefore).to.equal(BOB_DEPOSIT);

      // Contract balance should be 0
      const contractBalance = await mockToken.balanceOf(await poolManager.getAddress());
      expect(contractBalance).to.equal(0n);
    });

    it("should disallow refunds if target was reached", async function () {
      // Top up to target
      await poolManager.connect(alice).contribute(0, ethers.parseEther("500"));
      await time.increase(ONE_DAY + 1);

      await expect(poolManager.connect(alice).claimRefund(0)).to.be.revertedWith(
        "Target reached, refund unavailable"
      );
    });

    it("should revert if user has zero contribution", async function () {
      await time.increase(ONE_DAY + 1);

      await expect(poolManager.connect(deployer).claimRefund(0)).to.be.revertedWith(
        "No contribution to refund"
      );
    });
  });

  describe("Dynamic State Computation", function () {
    it("should return correct state before and after deadline", async function () {
      await poolManager.connect(creator).createPool(
        await mockToken.getAddress(),
        recipient.address,
        TARGET_AMOUNT,
        ONE_DAY,
        "State Test",
        "Desc"
      );

      expect(await poolManager.getComputedState(0)).to.equal(0); // Active

      await time.increase(ONE_DAY + 1);
      expect(await poolManager.getComputedState(0)).to.equal(2); // Refunding

      // Create pool 1 and fulfill it
      await poolManager.connect(creator).createPool(
        await mockToken.getAddress(),
        recipient.address,
        TARGET_AMOUNT,
        ONE_DAY,
        "PaidOut Test",
        "Desc"
      );
      await poolManager.connect(alice).contribute(1, TARGET_AMOUNT);
      await poolManager.claimPayout(1);

      expect(await poolManager.getComputedState(1)).to.equal(1); // PaidOut
    });
  });
});
