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
 * Gets Chromium executable path using dynamic import to reduce bundle size
 */
async function getChromiumExecutable(): Promise<string> {
  const isProduction = process.env.VERCEL === '1';
  
  if (!isProduction) {
    return process.env.CHROME_PATH || '';
  }

  // Dynamic import to reduce initial bundle size
  // Using chromium-min which is much smaller (<30MB vs ~50MB)
  const chromiumModule = await import('@sparticuz/chromium-min');
  // chromium-min may export differently - try both patterns
  const chromium = (chromiumModule.default || chromiumModule) as any;
  return await chromium.executablePath();
}

/**
 * Creates a Gmail account using minimal Puppeteer setup
 * Ultra-optimized for Vercel's size constraints
 */
export async function createGmailAccount(userInfo: UserInfo): Promise<GmailAccount> {
  // Dynamic imports to reduce bundle size - loaded only when needed
  const puppeteer = await import('puppeteer-core');
  let browser: any = null;

  try {
    const isProduction = process.env.VERCEL === '1';
    const executablePath = await getChromiumExecutable();
    
    // Ultra-minimal args - absolute minimum for functionality
    const minimalArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--single-process',
      '--disable-gpu',
      '--disable-extensions',
    ];
    
    if (isProduction && executablePath) {
      browser = await puppeteer.default.launch({
        args: minimalArgs,
        executablePath,
        headless: true,
        ignoreHTTPSErrors: true,
      });
    } else if (!isProduction) {
      browser = await puppeteer.default.launch({
        headless: process.env.HEADLESS !== 'false',
        args: minimalArgs,
        executablePath: executablePath || undefined,
      });
    } else {
      throw new Error('Unable to launch browser');
    }

    const page = await browser.newPage();
    
    // Minimal viewport
    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Navigate with shorter timeout
    await page.goto('https://accounts.google.com/signup/v2/webcreateaccount?flowName=GlifWebSignIn&flowEntry=SignUp', {
      waitUntil: 'domcontentloaded', // Faster than networkidle2
      timeout: 20000,
    });

    // Wait for form with shorter timeout
    await page.waitForSelector('input[name="firstName"]', { timeout: 8000 });

    // Fill forms with minimal delays
    await page.type('input[name="firstName"]', userInfo.firstName, { delay: 30 });
    await page.type('input[name="lastName"]', userInfo.lastName, { delay: 30 });
    await page.click('#collectNameNext');
    await page.waitForTimeout(500);

    await page.waitForSelector('input[name="Username"]', { timeout: 8000 });
    await page.type('input[name="Username"]', userInfo.username, { delay: 30 });
    await page.click('#next');
    await page.waitForTimeout(1500);

    // Check username availability
    const passwordField = await page.$('input[name="Passwd"]');
    if (!passwordField) {
      const newUsername = `${userInfo.firstName.toLowerCase()}.${userInfo.lastName.toLowerCase()}${Math.floor(100000 + Math.random() * 900000)}`;
      await page.click('input[name="Username"]', { clickCount: 3 });
      await page.type('input[name="Username"]', newUsername, { delay: 30 });
      await page.click('#next');
      await page.waitForTimeout(1500);
      userInfo.username = newUsername;
      userInfo.email = `${newUsername}@gmail.com`;
    }

    await page.waitForSelector('input[name="Passwd"]', { timeout: 8000 });
    await page.type('input[name="Passwd"]', userInfo.password, { delay: 30 });
    await page.type('input[name="PasswdAgain"]', userInfo.password, { delay: 30 });
    await page.click('#createpasswordNext');
    await page.waitForTimeout(1500);

    // Birthday
    const monthSelect = await page.$('select[id="month"]');
    if (monthSelect) {
      await page.select('select[id="month"]', userInfo.birthday.month.toString());
    }

    await page.waitForSelector('input[id="day"]', { timeout: 8000 });
    await page.type('input[id="day"]', userInfo.birthday.day.toString(), { delay: 30 });
    await page.type('input[id="year"]', userInfo.birthday.year.toString(), { delay: 30 });

    const genderSelect = await page.$('select[id="gender"]');
    if (genderSelect) {
      await page.select('select[id="gender"]', '1');
    }

    const nextButton = await page.$('#birthdaygenderNext');
    if (nextButton) {
      await nextButton.click();
    }

    await page.waitForTimeout(1500);

    // Skip phone verification
    try {
      const skipButtons = await page.$x("//button[contains(text(), 'Skip')] | //button[contains(text(), 'Not now')]");
      if (skipButtons.length > 0) {
        await skipButtons[0].evaluate((el: Node) => {
          if (el instanceof HTMLElement) el.click();
        });
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      // Ignore
    }

    const currentUrl = page.url();
    await page.close();
    await browser.close();
    
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
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // Ignore
      }
    }
    throw error;
  }
}
