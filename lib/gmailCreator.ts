import puppeteer, { Browser, Page, ElementHandle } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { UserInfo } from './userGenerator';

export interface GmailAccount {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  createdAt: string;
}

/**
 * Creates a Gmail account using Puppeteer
 */
export async function createGmailAccount(userInfo: UserInfo): Promise<GmailAccount> {
  let browser: Browser | null = null;

  try {
    // Launch browser (use local Chrome in dev, serverless Chrome in production)
    const isProduction = process.env.VERCEL === '1';
    
    if (isProduction) {
      // For Vercel, configure Chromium with minimal dependencies
      let chromiumPath: string;
      try {
        chromiumPath = await chromium.executablePath();
      } catch (error) {
        throw new Error('Failed to get Chromium executable path. This may be a Vercel runtime limitation.');
      }
      
      // Use minimal args to reduce dependency issues
      const args = [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions',
        '--single-process',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-component-update',
        '--disable-default-apps',
        '--disable-features=TranslateUI',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-renderer-backgrounding',
        '--disable-sync',
        '--disable-translate',
        '--metrics-recording-only',
        '--no-first-run',
        '--safebrowsing-disable-auto-update',
        '--enable-automation',
        '--password-store=basic',
        '--use-mock-keychain',
      ];
      
      browser = await puppeteer.launch({
        args,
        defaultViewport: chromium.defaultViewport || { width: 1920, height: 1080 },
        executablePath: chromiumPath,
        headless: true,
        ignoreHTTPSErrors: true,
      });
    } else {
      // For local development, try to use system Chrome or bundled Chromium
      const launchOptions: any = {
        headless: process.env.HEADLESS !== 'false', // Default to headless in dev
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      };
      
      // If CHROME_PATH is set, use it; otherwise let puppeteer find it
      if (process.env.CHROME_PATH) {
        launchOptions.executablePath = process.env.CHROME_PATH;
      }
      
      browser = await puppeteer.launch(launchOptions);
    }

    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Navigate to Gmail signup
    await page.goto('https://accounts.google.com/signup/v2/webcreateaccount?flowName=GlifWebSignIn&flowEntry=SignUp', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait for the form to load
    await page.waitForSelector('input[name="firstName"]', { timeout: 10000 });

    // Fill in first name
    await page.type('input[name="firstName"]', userInfo.firstName, { delay: 50 });

    // Fill in last name
    await page.type('input[name="lastName"]', userInfo.lastName, { delay: 50 });

    // Click next button
    await page.click('#collectNameNext');

    // Wait for username/password page
    await page.waitForSelector('input[name="Username"]', { timeout: 10000 });

    // Fill in username
    await page.type('input[name="Username"]', userInfo.username, { delay: 50 });

    // Click next to check username availability
    await page.click('#next');

    // Wait a bit for username validation
    await page.waitForTimeout(2000);

    // Check if username is available (look for password field or error message)
    const passwordField = await page.$('input[name="Passwd"]');
    if (!passwordField) {
      // Username might be taken, try with different digits
      const newUsername = `${userInfo.firstName.toLowerCase()}.${userInfo.lastName.toLowerCase()}${Math.floor(100000 + Math.random() * 900000)}`;
      await page.click('input[name="Username"]', { clickCount: 3 });
      await page.type('input[name="Username"]', newUsername, { delay: 50 });
      await page.click('#next');
      await page.waitForTimeout(2000);
      userInfo.username = newUsername;
      userInfo.email = `${newUsername}@gmail.com`;
    }

    // Wait for password field
    await page.waitForSelector('input[name="Passwd"]', { timeout: 10000 });

    // Fill in password
    await page.type('input[name="Passwd"]', userInfo.password, { delay: 50 });

    // Confirm password
    await page.type('input[name="PasswdAgain"]', userInfo.password, { delay: 50 });

    // Click next
    await page.click('#createpasswordNext');

    // Wait for birthday/phone page
    await page.waitForTimeout(2000);

    // Fill in birthday - month
    const monthSelect = await page.$('select[id="month"]');
    if (monthSelect) {
      await page.select('select[id="month"]', userInfo.birthday.month.toString());
    }

    // Fill in day
    await page.waitForSelector('input[id="day"]', { timeout: 10000 });
    await page.type('input[id="day"]', userInfo.birthday.day.toString(), { delay: 50 });

    // Fill in year
    await page.type('input[id="year"]', userInfo.birthday.year.toString(), { delay: 50 });

    // Select gender (optional, but helps avoid verification)
    const genderSelect = await page.$('select[id="gender"]');
    if (genderSelect) {
      await page.select('select[id="gender"]', '1'); // Male
    }

    // Click next
    const nextButton = await page.$('#birthdaygenderNext');
    if (nextButton) {
      await nextButton.click();
    }

    // Wait for phone verification page
    await page.waitForTimeout(2000);

    // Skip phone verification if possible
    try {
      // Try to find skip button using XPath and click via evaluate
      const skipButtons = await page.$x("//button[contains(text(), 'Skip')] | //button[contains(text(), 'Not now')] | //button[@jsname='LgbsSe']");
      if (skipButtons.length > 0) {
        await skipButtons[0].evaluate((el: Node) => {
          if (el instanceof HTMLElement) {
            el.click();
          }
        });
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      // Skip button not found, continue
      console.log('Skip button not found, continuing...');
    }

    // Check if we're on the welcome page or if phone verification is required
    const currentUrl = page.url();
    
    // If phone verification is required, we'll return what we have
    // In a real scenario, you'd integrate with SMS services like sms-activate.org
    if (currentUrl.includes('challenge') || currentUrl.includes('phone')) {
      // Account created but needs phone verification
      return {
        email: userInfo.email,
        password: userInfo.password,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        username: userInfo.username,
        createdAt: new Date().toISOString(),
      };
    }

    // Wait for final confirmation
    await page.waitForTimeout(3000);

    return {
      email: userInfo.email,
      password: userInfo.password,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      username: userInfo.username,
      createdAt: new Date().toISOString(),
    };

  } catch (error) {
    console.error('Error creating Gmail account:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

