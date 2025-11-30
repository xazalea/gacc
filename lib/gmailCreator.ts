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

// Use ScrapingBee free tier or similar - works on Vercel
async function useBrowserAPI(userInfo: UserInfo): Promise<GmailAccount> {
  // ScrapingBee free tier: 1000 API calls/month
  const apiKey = process.env.SCRAPINGBEE_API_KEY || '';
  const apiUrl = 'https://app.scrapingbee.com/api/v1/';
  
  if (!apiKey) {
    throw new Error(
      'Browser automation requires SCRAPINGBEE_API_KEY. ' +
      'Get free API key at https://www.scrapingbee.com/ (1000 free requests/month). ' +
      'Add it to Vercel environment variables.'
    );
  }
  
  // For now, throw helpful error - full implementation would require ScrapingBee's browser API
  throw new Error(
    'Chromium does not work on Vercel due to missing system libraries. ' +
    'Please use ScrapingBee or similar browser service API. ' +
    'Set SCRAPINGBEE_API_KEY environment variable in Vercel dashboard.'
  );
}

export async function createGmailAccount(userInfo: UserInfo): Promise<GmailAccount> {
  // Set environment variable in code before importing chromium
  if (process.env.VERCEL === '1' && !process.env.AWS_LAMBDA_JS_RUNTIME) {
    process.env.AWS_LAMBDA_JS_RUNTIME = 'nodejs22.x';
  }
  
  try {
    const puppeteer = await import('puppeteer-core');
    const proxy = await getProxy();
    let browser: any;
    
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
    // If Chromium fails, try browser API fallback
    if (error.message?.includes('libnss3.so') || error.message?.includes('Failed to launch')) {
      return await useBrowserAPI(userInfo);
    }
    throw error;
  }
}
