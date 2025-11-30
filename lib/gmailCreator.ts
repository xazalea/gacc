import { UserInfo } from './userGenerator';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as https from 'https';

export interface GmailAccount {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  createdAt: string;
}

// Download Chromium on-demand to avoid bundling it
async function downloadChromium(): Promise<string> {
  const tmpDir = os.tmpdir();
  const chromiumPath = path.join(tmpDir, 'chromium');
  
  if (fs.existsSync(chromiumPath)) {
    return chromiumPath;
  }
  
  // Use a CDN-hosted minimal Chromium or fallback to @sparticuz/chromium
  // For now, try to use @sparticuz/chromium but download it on-demand
  const chromium = await import('@sparticuz/chromium');
  const chromiumModule = (chromium.default || chromium) as any;
  const execPath = await chromiumModule.executablePath();
  
  // Copy to tmp if needed
  if (execPath && execPath !== chromiumPath && fs.existsSync(execPath)) {
    fs.copyFileSync(execPath, chromiumPath);
    fs.chmodSync(chromiumPath, 0o755);
    return chromiumPath;
  }
  
  return execPath;
}

export async function createGmailAccount(userInfo: UserInfo): Promise<GmailAccount> {
  const puppeteer = await import('puppeteer-core');
  const executablePath = process.env.VERCEL === '1' ? await downloadChromium() : process.env.CHROME_PATH;
  
  const browser = await puppeteer.default.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process'],
    executablePath,
    headless: true,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
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
}
