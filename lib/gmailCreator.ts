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
 * Creates a Gmail account using Browserless.io or similar browser service
 * This approach works reliably on Vercel by offloading browser automation
 */
export async function createGmailAccount(userInfo: UserInfo): Promise<GmailAccount> {
  // Use Browserless.io free tier or self-hosted instance
  // You can get a free API key at https://www.browserless.io/
  // Or use your own Browserless instance
  const browserlessUrl = process.env.BROWSERLESS_URL || 'https://chrome.browserless.io';
  const browserlessToken = process.env.BROWSERLESS_TOKEN || '';
  
  try {
    // Create a script that will run in the browser
    const script = `
      (async () => {
        const page = await this.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await page.goto('https://accounts.google.com/signup/v2/webcreateaccount?flowName=GlifWebSignIn&flowEntry=SignUp', {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });
        
        await page.waitForSelector('input[name="firstName"]', { timeout: 10000 });
        await page.type('input[name="firstName"]', '${userInfo.firstName}', { delay: 50 });
        await page.type('input[name="lastName"]', '${userInfo.lastName}', { delay: 50 });
        await page.click('#collectNameNext');
        
        await page.waitForSelector('input[name="Username"]', { timeout: 10000 });
        await page.type('input[name="Username"]', '${userInfo.username}', { delay: 50 });
        await page.click('#next');
        await page.waitForTimeout(2000);
        
        let username = '${userInfo.username}';
        const passwordField = await page.$('input[name="Passwd"]');
        if (!passwordField) {
          username = '${userInfo.firstName.toLowerCase()}.${userInfo.lastName.toLowerCase()}' + Math.floor(100000 + Math.random() * 900000);
          await page.click('input[name="Username"]', { clickCount: 3 });
          await page.type('input[name="Username"]', username, { delay: 50 });
          await page.click('#next');
          await page.waitForTimeout(2000);
        }
        
        await page.waitForSelector('input[name="Passwd"]', { timeout: 10000 });
        await page.type('input[name="Passwd"]', '${userInfo.password}', { delay: 50 });
        await page.type('input[name="PasswdAgain"]', '${userInfo.password}', { delay: 50 });
        await page.click('#createpasswordNext');
        await page.waitForTimeout(2000);
        
        const monthSelect = await page.$('select[id="month"]');
        if (monthSelect) {
          await page.select('select[id="month"]', '${userInfo.birthday.month}');
        }
        
        await page.waitForSelector('input[id="day"]', { timeout: 10000 });
        await page.type('input[id="day"]', '${userInfo.birthday.day}', { delay: 50 });
        await page.type('input[id="year"]', '${userInfo.birthday.year}', { delay: 50 });
        
        const genderSelect = await page.$('select[id="gender"]');
        if (genderSelect) {
          await page.select('select[id="gender"]', '1');
        }
        
        const nextButton = await page.$('#birthdaygenderNext');
        if (nextButton) {
          await nextButton.click();
        }
        
        await page.waitForTimeout(2000);
        
        const skipButtons = await page.$x("//button[contains(text(), 'Skip')] | //button[contains(text(), 'Not now')]");
        if (skipButtons.length > 0) {
          await skipButtons[0].evaluate(el => el.click());
          await page.waitForTimeout(2000);
        }
        
        const currentUrl = page.url();
        
        return {
          email: username + '@gmail.com',
          password: '${userInfo.password}',
          firstName: '${userInfo.firstName}',
          lastName: '${userInfo.lastName}',
          username: username,
          createdAt: new Date().toISOString(),
          needsVerification: currentUrl.includes('challenge') || currentUrl.includes('phone')
        };
      })();
    `;

    // If browserless token is provided, use Browserless.io
    if (browserlessToken) {
      const response = await fetch(`${browserlessUrl}/function?token=${browserlessToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: script,
        }),
      });

      if (!response.ok) {
        throw new Error(`Browserless API error: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        email: result.email || `${userInfo.username}@gmail.com`,
        password: userInfo.password,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        username: result.username || userInfo.username,
        createdAt: new Date().toISOString(),
      };
    }

    // Fallback: For local development or if no browser service is configured
    // This will only work locally with Playwright installed
    try {
      const { chromium } = await import('playwright-core');
      
      // Try to find Chromium in common locations
      let executablePath: string | undefined;
      
      // For local dev, try to use system browser
      const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      
      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });
      
      const page = await context.newPage();
      
      await page.goto('https://accounts.google.com/signup/v2/webcreateaccount?flowName=GlifWebSignIn&flowEntry=SignUp', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      
      await page.waitForSelector('input[name="firstName"]', { timeout: 10000 });
      await page.fill('input[name="firstName"]', userInfo.firstName);
      await page.fill('input[name="lastName"]', userInfo.lastName);
      await page.click('#collectNameNext');
      await page.waitForTimeout(1000);
      
      await page.waitForSelector('input[name="Username"]', { timeout: 10000 });
      await page.fill('input[name="Username"]', userInfo.username);
      await page.click('#next');
      await page.waitForTimeout(2000);
      
      const passwordField = page.locator('input[name="Passwd"]').first();
      const isPasswordVisible = await passwordField.isVisible().catch(() => false);
      
      if (!isPasswordVisible) {
        const newUsername = `${userInfo.firstName.toLowerCase()}.${userInfo.lastName.toLowerCase()}${Math.floor(100000 + Math.random() * 900000)}`;
        await page.fill('input[name="Username"]', newUsername);
        await page.click('#next');
        await page.waitForTimeout(2000);
        userInfo.username = newUsername;
        userInfo.email = `${newUsername}@gmail.com`;
      }
      
      await page.waitForSelector('input[name="Passwd"]', { timeout: 10000 });
      await page.fill('input[name="Passwd"]', userInfo.password);
      await page.fill('input[name="PasswdAgain"]', userInfo.password);
      await page.click('#createpasswordNext');
      await page.waitForTimeout(2000);
      
      const monthSelect = page.locator('select[id="month"]');
      if (await monthSelect.isVisible().catch(() => false)) {
        await monthSelect.selectOption(userInfo.birthday.month.toString());
      }
      
      await page.waitForSelector('input[id="day"]', { timeout: 10000 });
      await page.fill('input[id="day"]', userInfo.birthday.day.toString());
      await page.fill('input[id="year"]', userInfo.birthday.year.toString());
      
      const genderSelect = page.locator('select[id="gender"]');
      if (await genderSelect.isVisible().catch(() => false)) {
        await genderSelect.selectOption('1');
      }
      
      const nextButton = page.locator('#birthdaygenderNext');
      if (await nextButton.isVisible().catch(() => false)) {
        await nextButton.click();
      }
      
      await page.waitForTimeout(2000);
      
      try {
        const skipButton = page.locator('button:has-text("Skip"), button:has-text("Not now")').first();
        if (await skipButton.isVisible().catch(() => false)) {
          await skipButton.click();
          await page.waitForTimeout(2000);
        }
      } catch (e) {
        // Skip button not found
      }
      
      const currentUrl = page.url();
      await browser.close();
      
      return {
        email: userInfo.email,
        password: userInfo.password,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        username: userInfo.username,
        createdAt: new Date().toISOString(),
      };
      
    } catch (playwrightError) {
      // If Playwright fails, throw a helpful error
      throw new Error(
        'Browser automation failed. Please set BROWSERLESS_URL and BROWSERLESS_TOKEN environment variables ' +
        'to use Browserless.io service, or install Playwright locally for development. ' +
        `Error: ${playwrightError instanceof Error ? playwrightError.message : 'Unknown error'}`
      );
    }
    
  } catch (error) {
    console.error('Error creating Gmail account:', error);
    throw error;
  }
}
