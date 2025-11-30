import { UserInfo } from './userGenerator';
import { getProxy } from './proxyManager';

export interface GmailAccount {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  createdAt: string;
}

// Use ScrapingBee or similar free browser API as fallback
async function useBrowserAPI(userInfo: UserInfo): Promise<GmailAccount> {
  // For now, return a mock - you can integrate with ScrapingBee, Browserless.io free tier, etc.
  // This is a placeholder for when Chromium doesn't work
  throw new Error(
    'Browser automation failed. Chromium requires system libraries not available on Vercel. ' +
    'Consider using a browser service API or upgrading to Vercel Pro with custom runtime.'
  );
}

export async function createGmailAccount(userInfo: UserInfo): Promise<GmailAccount> {
  // Try Chromium first, fallback to API if it fails
  try {
    const puppeteer = await import('puppeteer-core');
    let browser: any;
    const proxy = await getProxy();
    
    if (process.env.VERCEL === '1') {
      const chromium = await import('@sparticuz/chromium');
      const chromiumModule = chromium.default || chromium;
      
      const executablePath = await chromiumModule.executablePath();
      const args = chromiumModule.args || [];
      
      if (proxy) args.push(`--proxy-server=${proxy}`);
      
      browser = await puppeteer.default.launch({
        args: args,
        defaultViewport: chromiumModule.defaultViewport || { width: 1280, height: 720 },
        executablePath: executablePath,
        headless: chromiumModule.headless !== false,
        ignoreHTTPSErrors: true,
      });
    } else {
      const args = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'];
      if (proxy) args.push(`--proxy-server=${proxy}`);
      browser = await puppeteer.default.launch({
        args,
        executablePath: process.env.CHROME_PATH,
        headless: true,
      });
    }

    const page = await browser.newPage();
    await page.goto('https://accounts.google.com/signup/v2/webcreateaccount?flowName=GlifWebSignIn&flowEntry=SignUp', { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    await page.waitForSelector('input[name="firstName"]', { timeout: 5000 });
    await page.type('input[name="firstName"]', userInfo.firstName, { delay: 20 });
    await page.type('input[name="lastName"]', userInfo.lastName, { delay: 20 });
    await page.click('#collectNameNext');
    await page.waitForTimeout(300);
    
    await page.waitForSelector('input[name="Username"]', { timeout: 5000 });
    await page.type('input[name="Username"]', userInfo.username, { delay: 20 });
    await page.click('#next');
    await page.waitForTimeout(1000);
    
    if (!(await page.$('input[name="Passwd"]'))) {
      const newUsername = `${userInfo.firstName.toLowerCase()}.${userInfo.lastName.toLowerCase()}${Math.floor(100000 + Math.random() * 900000)}`;
      await page.click('input[name="Username"]', { clickCount: 3 });
      await page.type('input[name="Username"]', newUsername, { delay: 20 });
      await page.click('#next');
      await page.waitForTimeout(1000);
      userInfo.username = newUsername;
      userInfo.email = `${newUsername}@gmail.com`;
    }
    
    await page.waitForSelector('input[name="Passwd"]', { timeout: 5000 });
    await page.type('input[name="Passwd"]', userInfo.password, { delay: 20 });
    await page.type('input[name="PasswdAgain"]', userInfo.password, { delay: 20 });
    await page.click('#createpasswordNext');
    await page.waitForTimeout(1000);
    
    const monthSelect = await page.$('select[id="month"]');
    if (monthSelect) await page.select('select[id="month"]', userInfo.birthday.month.toString());
    
    await page.waitForSelector('input[id="day"]', { timeout: 5000 });
    await page.type('input[id="day"]', userInfo.birthday.day.toString(), { delay: 20 });
    await page.type('input[id="year"]', userInfo.birthday.year.toString(), { delay: 20 });
    
    const genderSelect = await page.$('select[id="gender"]');
    if (genderSelect) await page.select('select[id="gender"]', '1');
    
    const nextButton = await page.$('#birthdaygenderNext');
    if (nextButton) await nextButton.click();
    await page.waitForTimeout(1000);
    
    try {
      const skipButtons = await page.$x("//button[contains(text(), 'Skip')] | //button[contains(text(), 'Not now')]");
      if (skipButtons.length > 0) {
        await skipButtons[0].evaluate((el: Node) => (el instanceof HTMLElement && el.click()));
        await page.waitForTimeout(500);
      }
    } catch {}
    
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
  } catch (error: any) {
    // If Chromium fails (libnss3.so error), the error will be thrown
    // This is a fundamental limitation of Vercel's runtime
    throw new Error(
      `Browser automation failed: ${error.message}. ` +
      `This is likely due to missing system libraries (libnss3.so) in Vercel's runtime. ` +
      `@sparticuz/chromium is designed for AWS Lambda, not Vercel. ` +
      `Solutions: 1) Add AWS_LAMBDA_JS_RUNTIME=nodejs22.x env var in Vercel dashboard, ` +
      `2) Use Vercel Pro with custom runtime, 3) Use an external browser service API.`
    );
  }
}
