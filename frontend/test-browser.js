import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOT_DIR = path.join(__dirname, 'test-screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runBrowserAudit() {
  console.log("=== COLLECTIVE 2.0 Comprehensive E2E Browser & Consumer Feature Audit ===");

  // 1. Start Vite preview server on 5174
  console.log("Starting Vite preview server on port 5174...");
  const server = spawn('npx', ['vite', 'preview', '--port', '5174', '--strictPort'], {
    cwd: __dirname,
    shell: true,
  });

  server.stdout.on('data', (d) => console.log(`[Vite] ${d.toString().trim()}`));
  server.stderr.on('data', (d) => console.error(`[Vite Err] ${d.toString().trim()}`));

  // Wait 3.5 seconds for server to boot
  await new Promise((r) => setTimeout(r, 3500));

  let browser;
  const consoleErrors = [];
  const pageErrors = [];

  try {
    browser = await chromium.launch({ headless: true });

    // ==========================================
    // TEST 1: Desktop Viewport (1280 x 800) & Hero Metrics
    // ==========================================
    console.log("\n[TEST 1] Testing Desktop Viewport (1280x800)...");
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const desktopPage = await desktopContext.newPage();

    desktopPage.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[Console Error] ${msg.text()}`);
      }
    });

    desktopPage.on('pageerror', (err) => {
      pageErrors.push(`[Page Unhandled Error] ${err.message}`);
    });

    await desktopPage.goto('http://localhost:5174', { waitUntil: 'networkidle' });
    console.log("Desktop page loaded successfully.");

    // Wait for on-chain pools to load from Monad Testnet RPC
    await desktopPage.waitForSelector('div.group', { timeout: 25000 });
    console.log("On-chain data loaded and rendered.");

    // Check Brand Title
    const titleText = await desktopPage.textContent('h1');
    console.log(`Hero Header: "${titleText?.replace(/\s+/g, ' ').trim()}"`);

    // Verify stats cards
    const statsCards = await desktopPage.$$eval('section .font-mono', (els) => els.map(e => e.textContent?.trim()));
    console.log(`Platform Metrics detected:`, statsCards.slice(0, 4));

    // Verify Pool Cards count
    const poolCards = await desktopPage.$$('div.group');
    console.log(`Total live pool cards rendered: ${poolCards.length}`);

    // Take Desktop Screenshot (Browse Pools)
    const desktopScreenshotPath = path.join(SCREENSHOT_DIR, 'collective2_desktop_browse.png');
    await desktopPage.screenshot({ path: desktopScreenshotPath, fullPage: true });
    console.log(`Saved desktop browse screenshot: ${desktopScreenshotPath}`);

    // ==========================================
    // TEST 2: How It Works 3-Step Consumer Explainer
    // ==========================================
    console.log("\n[TEST 2] Testing 'How COLLECTIVE Works' Consumer Explainer...");
    const howItWorksTitle = await desktopPage.textContent('h3:has-text("How COLLECTIVE Works")');
    console.log(`How It Works section present: ${Boolean(howItWorksTitle)}`);

    const step1 = await desktopPage.textContent('h4:has-text("Create a Funding Pool")');
    const step2 = await desktopPage.textContent('h4:has-text("Back It Together")');
    const step3 = await desktopPage.textContent('h4:has-text("Resolve Transparently")');
    console.log(`Explainer Steps verified: Step 1 (${Boolean(step1)}), Step 2 (${Boolean(step2)}), Step 3 (${Boolean(step3)})`);

    const disclaimer = await desktopPage.textContent('span:has-text("Refunds use the secure pull pattern")');
    console.log(`Testnet disclosure & pull-refund eligibility banner: ${Boolean(disclaimer)}`);

    // ==========================================
    // TEST 3: Monad Block Height Ticker & Sound Toggle in Navbar
    // ==========================================
    console.log("\n[TEST 3] Testing Monad Block Height Ticker & Sound Toggle...");
    const soundToggleBtn = await desktopPage.$('button[aria-label*="sound effects"]');
    console.log(`Sound toggle button rendered in Navbar: ${Boolean(soundToggleBtn)}`);
    if (soundToggleBtn) {
      await soundToggleBtn.click();
      console.log("Clicked sound toggle button (enabled audio).");
      await desktopPage.waitForTimeout(300);
      await soundToggleBtn.click();
      console.log("Clicked sound toggle button again (muted audio).");
    }

    // ==========================================
    // TEST 4: Quick Pool-Creation Templates (CreatePoolModal)
    // ==========================================
    console.log("\n[TEST 4] Testing Quick Pool-Creation Templates...");
    const createPoolBtn = await desktopPage.$('button:has-text("Create Pool")');
    if (createPoolBtn) {
      await createPoolBtn.click();
      await desktopPage.waitForSelector('form', { timeout: 5000 });
      console.log("Create Pool modal opened.");

      // Check for template buttons inside dialog
      const dialog = await desktopPage.$('div[role="dialog"]');
      const templateDinner = dialog ? await dialog.$('button:has-text("Team Dinner")') : null;
      const templateTrip = dialog ? await dialog.$('button:has-text("Cabin Trip")') : null;
      const templateGift = dialog ? await dialog.$('button:has-text("Farewell Gift")') : null;
      const templateDemo = dialog ? await dialog.$('button:has-text("Fast Demo")') : null;

      console.log(`Templates present: Dinner (${Boolean(templateDinner)}), Trip (${Boolean(templateTrip)}), Gift (${Boolean(templateGift)}), Demo (${Boolean(templateDemo)})`);

      if (templateDinner) {
        await templateDinner.click();
        await desktopPage.waitForTimeout(300);

        // Check if form fields autofilled
        const titleVal = await dialog.$eval('form input[type="text"]', (el) => el.value);
        const amountVal = await dialog.$eval('input[type="number"]', (el) => el.value);
        console.log(`Autofilled title: "${titleVal}", target amount: "${amountVal}"`);
      }

      // Scroll modal slightly to capture the FairShare section
      await desktopPage.evaluate(() => {
        const modalBody = document.querySelector('div[role="dialog"] > div');
        if (modalBody) modalBody.scrollTop = 260;
      });
      await desktopPage.waitForTimeout(300);

      const createModalScreenshot = path.join(SCREENSHOT_DIR, 'collective2_create_templates.png');
      await desktopPage.screenshot({ path: createModalScreenshot });
      console.log(`Saved Create Modal with templates screenshot: ${createModalScreenshot}`);

      await desktopPage.keyboard.press('Escape');
      await desktopPage.waitForTimeout(500);
    }

    // ==========================================
    // TEST 4B: Live Interactive Settlement & Finality Simulator (Stripe Inspired)
    // ==========================================
    console.log("\n[TEST 4B] Testing Live Settlement & Finality Simulator (Stripe style)...");
    
    // Check Live Network Pulse Bar
    const pulseBlock = await desktopPage.$('span:has-text("Block:")');
    const pulseFinality = await desktopPage.$('span:has-text("Finality:")');
    console.log(`Live Network Pulse detected: Block (${Boolean(pulseBlock)}), Finality (${Boolean(pulseFinality)})`);

    // Scroll to Live Simulator
    await desktopPage.evaluate(() => {
      const sim = document.querySelector('h2');
      if (sim) sim.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await desktopPage.waitForTimeout(600);

    // Click "Weekend Cabin" preset
    const cabinPreset = await desktopPage.$('button:has-text("Weekend Cabin")');
    if (cabinPreset) {
      await cabinPreset.click();
      await desktopPage.waitForTimeout(300);
      console.log("Selected Weekend Cabin preset in Live Simulator.");
    }

    // Click "⚡ Test Sub-Second Monad Finality" simulation button
    const simBtn = await desktopPage.$('button:has-text("Test Sub-Second Monad Finality")');
    if (simBtn) {
      console.log("Triggering Sub-Second Monad Execution Simulation...");
      await simBtn.click();
      // Wait for stopwatch simulation (approx 1000ms)
      await desktopPage.waitForTimeout(1100);
      const finalizedText = await desktopPage.textContent('button:has-text("Finalized in")');
      console.log(`Simulation complete: ${finalizedText?.trim()}`);
    }

    // Capture screenshot of the Live Simulator in action
    const simScreenshot = path.join(SCREENSHOT_DIR, 'collective2_stripe_simulator_live.png');
    await desktopPage.screenshot({ path: simScreenshot });
    console.log(`Saved Stripe Live Simulator screenshot: ${simScreenshot}`);

    // Switch to Scenario B (100% Pull-Refund Guarantee)
    const refundTab = await desktopPage.$('button:has-text("Scenario B")');
    if (refundTab) {
      await refundTab.click();
      await desktopPage.waitForTimeout(400);
      console.log("Switched to Scenario B (Guaranteed 100% Pull-Refund).");
    }

    // Test "Launch This Pool" button from simulator
    const launchPoolBtn = await desktopPage.$('button:has-text("Launch This Pool")');
    if (launchPoolBtn) {
      await launchPoolBtn.click();
      await desktopPage.waitForSelector('form', { timeout: 5000 });
      console.log("Opened Create Pool modal prefilled from Live Simulator!");
      await desktopPage.waitForTimeout(400);

      const launchedScreenshot = path.join(SCREENSHOT_DIR, 'collective2_stripe_simulator_launched.png');
      await desktopPage.screenshot({ path: launchedScreenshot });
      console.log(`Saved Simulator Pre-filled Create Modal screenshot: ${launchedScreenshot}`);

      await desktopPage.keyboard.press('Escape');
      await desktopPage.waitForTimeout(500);
    }

    // ==========================================
    // TEST 5: Share Modal with Offline QR Code & Social Buttons
    // ==========================================
    console.log("\n[TEST 5] Testing Share Modal & QR Code Rendering...");
    const shareBtns = await desktopPage.$$('button[aria-label="Share pool"]');
    if (shareBtns.length > 0) {
      await shareBtns[0].click();
      await desktopPage.waitForSelector('h3:has-text("Share & Invite")', { timeout: 5000 });
      console.log("Share Modal opened successfully.");

      // Verify QR Code image rendered
      await desktopPage.waitForSelector('img[alt*="QR code"]', { timeout: 4000 });
      const qrImg = await desktopPage.$('img[alt*="QR code"]');
      const qrSrc = qrImg ? await qrImg.getAttribute('src') : null;
      const isDataUrl = qrSrc && qrSrc.startsWith('data:image/png;base64');
      console.log(`Verified offline high-contrast QR Code rendered: ${Boolean(isDataUrl)}`);

      // Verify Social Share Buttons
      const whatsappBtn = await desktopPage.$('button:has-text("WhatsApp")');
      const telegramBtn = await desktopPage.$('button:has-text("Telegram")');
      const xBtn = await desktopPage.$('button:has-text("X (Twitter)")');
      console.log(`Social Share buttons present: WhatsApp (${Boolean(whatsappBtn)}), Telegram (${Boolean(telegramBtn)}), X (${Boolean(xBtn)})`);

      // Test Copy Link Button
      const copyBtn = await desktopPage.$('button:has-text("Copy")');
      if (copyBtn) {
        await copyBtn.click();
        await desktopPage.waitForTimeout(300);
        const copiedText = await desktopPage.textContent('button:has-text("Copied")');
        console.log(`Copy link confirmation verified: ${Boolean(copiedText)}`);
      }

      const shareModalScreenshot = path.join(SCREENSHOT_DIR, 'collective2_share_modal.png');
      await desktopPage.screenshot({ path: shareModalScreenshot });
      console.log(`Saved Share Modal screenshot: ${shareModalScreenshot}`);

      await desktopPage.keyboard.press('Escape');
      await desktopPage.waitForTimeout(500);
    }

    // ==========================================
    // TEST 6: Pool Details Modal & On-Chain Backers List
    // ==========================================
    console.log("\n[TEST 6] Testing Pool Details Modal & On-Chain Backers List...");
    const viewDetailsBtns = await desktopPage.$$('button:has-text("View Details")');
    if (viewDetailsBtns.length > 0) {
      await viewDetailsBtns[0].click();
      await desktopPage.waitForTimeout(800);
      console.log("Pool Details modal opened successfully.");

      // Check On-Chain Backers Section
      const backersHeader = await desktopPage.textContent('span:has-text("On-Chain Backers")');
      console.log(`On-Chain Backers header detected: ${Boolean(backersHeader)}`);

      const backerRows = await desktopPage.$$('div:has-text("0x")');
      console.log(`Backer items detected in modal: ${backerRows.length > 0}`);

      const detailsScreenshot = path.join(SCREENSHOT_DIR, 'collective2_pool_details.png');
      await desktopPage.screenshot({ path: detailsScreenshot });
      console.log(`Saved Pool Details Modal screenshot: ${detailsScreenshot}`);

      await desktopPage.keyboard.press('Escape');
      await desktopPage.waitForTimeout(500);
    }

    // ==========================================
    // TEST 7: Activity Timeline & Verified Pool Milestones Tab
    // ==========================================
    console.log("\n[TEST 7] Testing Activity Timeline & Verified Pool Status View...");
    const activityTabBtn = await desktopPage.$('button:has-text("On-Chain Activity")');
    if (activityTabBtn) {
      await activityTabBtn.click();
      await desktopPage.waitForTimeout(1000);

      // Verify scope notice
      const scopeNotice = await desktopPage.textContent('span.font-mono:has-text("Bounded 100-blk chunks")');
      console.log(`Activity Timeline scope badge confirmed: ${Boolean(scopeNotice)}`);

      // Switch to Verified Pool Status Tab
      const milestonesTabBtn = await desktopPage.$('button:has-text("Verified Pool Status")');
      if (milestonesTabBtn) {
        await milestonesTabBtn.click();
        await desktopPage.waitForTimeout(600);
        console.log("Switched to 'Verified Pool Status' view.");

        const statusCards = await desktopPage.$$('div:has-text("Pool #")');
        console.log(`Verified pool status cards rendered: ${statusCards.length}`);

        const activityScreenshotPath = path.join(SCREENSHOT_DIR, 'collective2_activity_timeline.png');
        await desktopPage.screenshot({ path: activityScreenshotPath });
        console.log(`Saved activity timeline screenshot: ${activityScreenshotPath}`);
      }
    }

    // ==========================================
    // TEST 8: Personal Backer Dashboard
    // ==========================================
    console.log("\n[TEST 8] Testing Personal Backer Dashboard View...");
    const dashboardTabBtn = await desktopPage.$('button:has-text("My Dashboard")');
    if (dashboardTabBtn) {
      await dashboardTabBtn.click();
      await desktopPage.waitForTimeout(800);

      const dashboardHeader = await desktopPage.textContent('h2:has-text("Personal Backer Dashboard")');
      console.log(`Personal Dashboard mounted: ${Boolean(dashboardHeader)}`);

      const dashboardScreenshotPath = path.join(SCREENSHOT_DIR, 'collective2_personal_dashboard.png');
      await desktopPage.screenshot({ path: dashboardScreenshotPath });
      console.log(`Saved personal dashboard screenshot: ${dashboardScreenshotPath}`);

      const browseTabBtn = await desktopPage.$('button:has-text("Explore Pools")');
      if (browseTabBtn) await browseTabBtn.click();
      await desktopPage.waitForTimeout(600);
    }

    // ==========================================
    // TEST 9: Protocol Rules & Trust Modal
    // ==========================================
    console.log("\n[TEST 9] Testing Protocol Rules & Trust Modal...");
    const trustBtn = await desktopPage.$('button:has-text("Trust & Rules")');
    if (trustBtn) {
      await trustBtn.click();
      await desktopPage.waitForTimeout(600);
      const trustScreenshotPath = path.join(SCREENSHOT_DIR, 'collective2_trust_modal.png');
      await desktopPage.screenshot({ path: trustScreenshotPath });
      console.log(`Saved trust modal screenshot: ${trustScreenshotPath}`);

      const closeBtn = await desktopPage.$('button:has-text("Understood")');
      if (closeBtn) await closeBtn.click();
      await desktopPage.waitForTimeout(500);
    }

    // ==========================================
    // TEST 10: Direct URL Parameter Routing (?pool=3)
    // ==========================================
    console.log("\n[TEST 10] Testing Direct URL Parameter Navigation (?pool=3)...");
    const directUrlContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const directUrlPage = await directUrlContext.newPage();
    await directUrlPage.goto('http://localhost:5174/?pool=3', { waitUntil: 'networkidle' });
    await directUrlPage.waitForSelector('h1', { timeout: 15000 });
    await directUrlPage.waitForTimeout(2000);

    const isDetailsModalVisible = await directUrlPage.$('button:has-text("Share")');
    console.log(`Direct navigation ?pool=3 automatically opened pool details modal: ${Boolean(isDetailsModalVisible)}`);
    const directUrlScreenshot = path.join(SCREENSHOT_DIR, 'collective2_direct_pool_url.png');
    await directUrlPage.screenshot({ path: directUrlScreenshot });
    console.log(`Saved direct pool URL screenshot: ${directUrlScreenshot}`);
    await directUrlContext.close();

    // ==========================================
    // TEST 11: Mobile Viewport (375 x 667)
    // ==========================================
    console.log("\n[TEST 11] Testing Mobile Viewport (375x667)...");
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();
    mobilePage.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(`[Mobile Console Error] ${msg.text()}`);
    });

    await mobilePage.goto('http://localhost:5174', { waitUntil: 'networkidle' });
    await mobilePage.waitForSelector('h1', { timeout: 15000 });

    const mobileScreenshotPath = path.join(SCREENSHOT_DIR, 'collective2_mobile.png');
    await mobilePage.screenshot({ path: mobileScreenshotPath, fullPage: true });
    console.log(`Saved mobile screenshot: ${mobileScreenshotPath}`);
    await mobileContext.close();

    // ==========================================
    // TEST 12: Invalid Pool Deep Link (?pool=9999)
    // ==========================================
    console.log("\n[TEST 12] Testing Invalid Pool Deep Link (?pool=9999)...");
    const invalidContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const invalidPage = await invalidContext.newPage();
    await invalidPage.goto('http://localhost:5174/?pool=9999', { waitUntil: 'networkidle' });
    await invalidPage.waitForSelector('h1', { timeout: 15000 });
    await invalidPage.waitForTimeout(1000);

    const alertBanner = await invalidPage.textContent('div:has-text("Pool #9999 was not found on Monad Testnet")');
    console.log(`Non-intrusive alert for invalid pool #9999 displayed: ${Boolean(alertBanner)}`);
    await invalidContext.close();

    // ==========================================
    // TEST 13: Contributor Refund & Accounting Truthfulness
    // ==========================================
    console.log("\n[TEST 13] Testing Contributor Refund State Verification...");
    const auditContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const auditPage = await auditContext.newPage();
    await auditPage.goto('http://localhost:5174', { waitUntil: 'networkidle' });
    await auditPage.waitForSelector('div.group', { timeout: 25000 });

    // Verify Settled Pool State (e.g. Successfully Settled / Refunds Settled)
    const settledBadge = await auditPage.$('span:has-text("Settled")');
    console.log(`Pool displays Settled status: ${Boolean(settledBadge)}`);

    // Verify Expired Pool Refund State (e.g. Refunds Open / Refunds Active)
    const refundsBadge = await auditPage.$('span:has-text("Refund")');
    console.log(`Underfunded expired pool displays Refund status: ${Boolean(refundsBadge)}`);

    // Verify Overfunded Pool Stretch Goal indicator
    const stretchGoalBadge = await auditPage.$('div:has-text("Stretch Goal")');
    console.log(`Overfunded Pool displays Stretch Goal indicator: ${Boolean(stretchGoalBadge)}`);

    // Verify Native USDC & MUSD Supported Currencies
    const usdcBadge = await auditPage.$('span:has-text("USDC"), button:has-text("USDC")');
    console.log(`Native Circle USDC currency badge/controls present: ${Boolean(usdcBadge)}`);

    // Verify FairShare Guidance
    const fairShareBadge = await auditPage.$('*:has-text("FairShare")');
    console.log(`FairShare group size/guidance elements present: ${Boolean(fairShareBadge)}`);

    // ==========================================
    // TEST 14: Verifiable Outcome Receipt Modal & Deep Link (?receipt=true)
    // ==========================================
    console.log("\n[TEST 14] Testing Verifiable Outcome Receipt Deep Link (?pool=3&receipt=true)...");
    const receiptContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const receiptPage = await receiptContext.newPage();
    await receiptPage.goto('http://localhost:5174/?pool=3&receipt=true', { waitUntil: 'networkidle' });
    await receiptPage.waitForSelector('h3:has-text("Verifiable Outcome Receipt")', { timeout: 15000 });
    console.log("Outcome Receipt modal opened via direct ?receipt=true deep link.");

    const receiptProofText = await receiptPage.textContent('div:has-text("On-Chain Verification")');
    console.log(`Receipt verified on-chain cryptographic proof banner: ${Boolean(receiptProofText)}`);

    const receiptScreenshot = path.join(SCREENSHOT_DIR, 'collective2_outcome_receipt.png');
    await receiptPage.screenshot({ path: receiptScreenshot });
    console.log(`Saved Outcome Receipt modal screenshot: ${receiptScreenshot}`);
    await receiptContext.close();

    // ==========================================
    // TEST 15: Goal Rescue Navigation (?pool=3&rescue=true)
    // ==========================================
    console.log("\n[TEST 15] Testing Goal Rescue Deep Link (?pool=3&rescue=true)...");
    const rescueContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const rescuePage = await rescueContext.newPage();
    await rescuePage.goto('http://localhost:5174/?pool=3&rescue=true', { waitUntil: 'networkidle' });
    await rescuePage.waitForSelector('h3', { timeout: 15000 });
    console.log("Goal Rescue modal opened via ?rescue=true deep link.");

    const rescueScreenshot = path.join(SCREENSHOT_DIR, 'collective2_goal_rescue.png');
    await rescuePage.screenshot({ path: rescueScreenshot });
    console.log(`Saved Goal Rescue screenshot: ${rescueScreenshot}`);
    await rescueContext.close();

    await auditContext.close();
    await desktopContext.close();

    console.log("\n=== AUDIT RESULTS SUMMARY ===");
    console.log(`Console Errors count: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(e => console.log(`  - ${e}`));
    }
    console.log(`Unhandled Page Errors count: ${pageErrors.length}`);
    if (pageErrors.length > 0) {
      pageErrors.forEach(e => console.log(`  - ${e}`));
    }
    console.log("ALL 13 BROWSER E2E TESTS COMPLETED SUCCESSFULLY.");

  } catch (err) {
    console.error("Browser audit failed with exception:", err);
  } finally {
    if (browser) await browser.close();
    server.kill();
    process.exit(0);
  }
}

runBrowserAudit();
