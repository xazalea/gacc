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

export async function createGmailAccount(userInfo: UserInfo): Promise<GmailAccount> {
  // Use Playwright instead of Puppeteer - better Vercel compatibility
  const { chromium } = await import('playwright-core');
  const proxy = await getProxy();
  
  // Set environment variable in code
  if (process.env.VERCEL === '1') {
    process.env.AWS_LAMBDA_JS_RUNTIME = 'nodejs22.x';
  }
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process'],
    proxy: proxy ? { server: proxy } : undefined,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();
  await page.goto('https://accounts.google.com/signup/v2/webcreateaccount?flowName=GlifWebSignIn&flowEntry=SignUp', { waitUntil: 'domcontentloaded', timeout: 15000 });
  
  await page.waitForSelector('input[name="firstName"]', { timeout: 5000 });
  await page.fill('input[name="firstName"]', userInfo.firstName);
  await page.fill('input[name="lastName"]', userInfo.lastName);
  await page.click('#collectNameNext');
  await page.waitForTimeout(300);
  
  await page.waitForSelector('input[name="Username"]', { timeout: 5000 });
  await page.fill('input[name="Username"]', userInfo.username);
  await page.click('#next');
  await page.waitForTimeout(1000);
  
  if (!(await page.locator('input[name="Passwd"]').first().isVisible().catch(() => false))) {
    const newUsername = `${userInfo.firstName.toLowerCase()}.${userInfo.lastName.toLowerCase()}${Math.floor(100000 + Math.random() * 900000)}`;
    await page.fill('input[name="Username"]', newUsername);
    await page.click('#next');
    await page.waitForTimeout(1000);
    userInfo.username = newUsername;
    userInfo.email = `${newUsername}@gmail.com`;
  }
  
  await page.waitForSelector('input[name="Passwd"]', { timeout: 5000 });
  await page.fill('input[name="Passwd"]', userInfo.password);
  await page.fill('input[name="PasswdAgain"]', userInfo.password);
  await page.click('#createpasswordNext');
  await page.waitForTimeout(1000);
  
  const monthSelect = page.locator('select[id="month"]');
  if (await monthSelect.isVisible().catch(() => false)) {
    await monthSelect.selectOption(userInfo.birthday.month.toString());
  }
  
  await page.waitForSelector('input[id="day"]', { timeout: 5000 });
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
  await page.waitForTimeout(1000);
  
  try {
    const skipButton = page.locator('button:has-text("Skip"), button:has-text("Not now")').first();
    if (await skipButton.isVisible().catch(() => false)) {
      await skipButton.click();
      await page.waitForTimeout(500);
    }
  } catch {}
  
  await page.close();
  await context.close();
  await browser.close();
  
  return {
    email: userInfo.email,
    password: userInfo.password,
    firstName: userInfo.firstName,
    lastName: userInfo.lastName,
    username: userInfo.username,
    createdAt: new Date().toISOString(),
  };
}
