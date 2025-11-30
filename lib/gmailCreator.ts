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

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function createGmailAccount(userInfo: UserInfo, onStatusUpdate?: (status: string) => void): Promise<GmailAccount> {
  const status = (msg: string) => {
    console.log(msg);
    if (onStatusUpdate) onStatusUpdate(msg);
  };

  // Set environment variable in code before importing chromium
  if (process.env.VERCEL === '1' && !process.env.AWS_LAMBDA_JS_RUNTIME) {
    process.env.AWS_LAMBDA_JS_RUNTIME = 'nodejs22.x';
  }
  
  // Dynamically import stealth plugin to avoid build-time resolution issues
  const puppeteerCore = await import('puppeteer-core');
  const puppeteerExtra = await import('puppeteer-extra');
  
  // @ts-ignore
  const StealthPlugin = await import('puppeteer-extra-plugin-stealth');

  const puppeteer = puppeteerExtra.default || puppeteerExtra;
  const stealth = StealthPlugin.default || StealthPlugin;
  
  // Configure puppeteer-extra to use puppeteer-core
  // @ts-ignore
  puppeteer.use(stealth());
  
  const MAX_RETRIES = 4; // 3 proxy attempts + 1 direct fallback
  let lastError: any;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let browser: any = null;
    try {
      // Use proxy for first 3 attempts, direct connection for last attempt
      const useProxy = attempt < MAX_RETRIES;
      const proxy = useProxy ? await getProxy() : undefined;
      
      const attemptMsg = `Attempt ${attempt}/${MAX_RETRIES} (${useProxy ? 'Proxy: ' + proxy : 'Direct Connection'})`;
      status(attemptMsg);

      if (useProxy && !proxy) {
        status('No proxy available, skipping to next attempt');
        continue;
      }

      if (process.env.VERCEL === '1') {
        status('Launching Chromium (Serverless)...');
        const chromium = await import('@sparticuz/chromium-min');
        const chromiumModule = chromium.default || chromium;
        
        // Use a specific download URL for the pack if needed, or rely on default behavior
        // For -min package, we need to provide the pack URL or it will try to download from default location
        const executablePath = await chromiumModule.executablePath(
          "https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar"
        );
        
        // Use proper args from chromium module
        const args = [
          ...chromiumModule.args,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--single-process',
          '--disable-gpu',
          '--disable-features=IsolateOrigins,site-per-process',
        ];
        
        if (proxy) args.push(`--proxy-server=${proxy}`);
        
        browser = await puppeteer.launch({
          args: args,
          defaultViewport: chromiumModule.defaultViewport || { width: 1280, height: 720 },
          executablePath: executablePath,
          headless: chromiumModule.headless,
          ignoreHTTPSErrors: true,
        } as any);
      } else {
        status('Launching Chrome (Local)...');
        const args = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'];
        if (proxy) args.push(`--proxy-server=${proxy}`);
        browser = await puppeteer.launch({
          args,
          executablePath: process.env.CHROME_PATH,
          headless: true,
          ignoreHTTPSErrors: true,
        } as any);
      }

      const page = await browser.newPage();
      
      // Set a realistic User Agent to avoid basic bot detection
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      status('Navigating to Google Signup...');
      await page.goto('https://accounts.google.com/signup/v2/webcreateaccount?flowName=GlifWebSignIn&flowEntry=SignUp', { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Wait for either the new layout or the old one
      try {
          status('Waiting for first name field...');
          await page.waitForSelector('input[name="firstName"]', { timeout: 15000 });
      } catch (e) {
          status('First name selector not found, taking screenshot...');
          console.log('First name selector not found, taking screenshot...');
          // Debug: log page content if selector fails
          const content = await page.content();
          console.log('Page content length:', content.length);
          throw e;
      }

      status('Entering personal info...');
      await page.type('input[name="firstName"]', userInfo.firstName, { delay: 20 });
      await page.type('input[name="lastName"]', userInfo.lastName, { delay: 20 });
      await page.click('#collectNameNext');
      await delay(1000); // Increased delay after click
      
      status('Checking next step...');
      // Race condition to check which page comes next: Username, Birthday, or Phone
      const nextStep = await Promise.race([
          page.waitForSelector('input[name="Username"]', { timeout: 10000 }).then(() => 'username'),
          page.waitForSelector('select[id="month"]', { timeout: 10000 }).then(() => 'birthday'),
          page.waitForSelector('input[type="tel"]', { timeout: 10000 }).then(() => 'phone'),
          delay(10000).then(() => 'timeout')
      ]);
      
      if (nextStep === 'phone') {
          throw new Error('Phone verification required immediately. Proxy flagged.');
      }
      
      if (nextStep === 'birthday') {
        status('Birthday field detected first...');
        const monthSelect = await page.$('select[id="month"]');
        if (monthSelect) await page.select('select[id="month"]', userInfo.birthday.month.toString());
        
        await page.waitForSelector('input[id="day"]', { timeout: 15000 });
        await page.type('input[id="day"]', userInfo.birthday.day.toString(), { delay: 20 });
        await page.type('input[id="year"]', userInfo.birthday.year.toString(), { delay: 20 });
        
        const genderSelect = await page.$('select[id="gender"]');
        if (genderSelect) await page.select('select[id="gender"]', '1');
        
        const nextButton = await page.$('#birthdaygenderNext');
        if (nextButton) await nextButton.click();
        await delay(1000);
        
        // After birthday, it should be username
        status('Waiting for username field...');
        await page.waitForSelector('input[name="Username"]', { timeout: 15000 });
      } else if (nextStep === 'timeout') {
        throw new Error('Timed out waiting for next step after name');
      }

      status('Entering username...');
      // Ensure selector exists before typing if we came from standard flow
      if (nextStep === 'username') await page.waitForSelector('input[name="Username"]', { timeout: 15000 });
      await page.type('input[name="Username"]', userInfo.username, { delay: 20 });
      await page.click('#next');
      await delay(1000);
      
      if (!(await page.$('input[name="Passwd"]'))) {
        status('Username taken, generating suggestion...');
        const newUsername = `${userInfo.firstName.toLowerCase()}.${userInfo.lastName.toLowerCase()}${Math.floor(10000000 + Math.random() * 90000000)}`;
        await page.click('input[name="Username"]', { clickCount: 3 });
        await page.type('input[name="Username"]', newUsername, { delay: 20 });
        await page.click('#next');
        await delay(1000);
        userInfo.username = newUsername;
        userInfo.email = `${newUsername}@gmail.com`;
      }
      
      status('Entering password...');
      await page.waitForSelector('input[name="Passwd"]', { timeout: 15000 });
      await page.type('input[name="Passwd"]', userInfo.password, { delay: 20 });
      await page.type('input[name="PasswdAgain"]', userInfo.password, { delay: 20 });
      await page.click('#createpasswordNext');
      await delay(1000);
      
      // Only do birthday if we haven't done it yet
      if (nextStep === 'username') {
        status('Entering birthday...');
        const monthSelect = await page.$('select[id="month"]');
        // ... (rest of birthday logic)
        if (monthSelect) await page.select('select[id="month"]', userInfo.birthday.month.toString());
        
        await page.waitForSelector('input[id="day"]', { timeout: 15000 });
        await page.type('input[id="day"]', userInfo.birthday.day.toString(), { delay: 20 });
        await page.type('input[id="year"]', userInfo.birthday.year.toString(), { delay: 20 });
        
        const genderSelect = await page.$('select[id="gender"]');
        if (genderSelect) await page.select('select[id="gender"]', '1');
        
        const nextButton = await page.$('#birthdaygenderNext');
        if (nextButton) await nextButton.click();
        await delay(1000);
      }
      
      try {
        const skipButtons = await page.$x("//button[contains(text(), 'Skip')] | //button[contains(text(), 'Not now')]");
        if (skipButtons.length > 0) {
          status('Skipping phone verification...');
          await skipButtons[0].evaluate((el: Node) => (el instanceof HTMLElement && el.click()));
          await delay(500);
        }
      } catch {}
      
      status('Account created successfully!');
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
      status(`Attempt ${attempt} failed: ${error.message}`);
      console.error(`Attempt ${attempt} failed:`, error);
      lastError = error;
      if (browser) {
        try {
          await browser.close();
        } catch (e) {
          // Ignore
        }
      }
      
      // If we have retries left, continue to next iteration (which will get a new proxy)
      if (attempt < MAX_RETRIES) {
        continue;
      }
    }
  }

  throw lastError || new Error('Failed to create account after multiple attempts');
}
