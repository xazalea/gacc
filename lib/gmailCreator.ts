import { UserInfo } from './userGenerator';

export interface GmailAccount {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  createdAt: string;
}

export async function createGmailAccount(userInfo: UserInfo): Promise<GmailAccount> {
  const puppeteer = await import('puppeteer-core');
  let executablePath: string | undefined;
  let chromiumArgs: string[] = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process'];
  let headless = true;
  let defaultViewport = { width: 1280, height: 720 };
  
  if (process.env.VERCEL === '1') {
    // Dynamic import - chromium not bundled
    const chromium = await import('@sparticuz/chromium');
    const chromiumModule = (chromium.default || chromium) as any;
    executablePath = await chromiumModule.executablePath();
    // Use chromium's args which include all necessary flags for serverless (fixes libnss3.so error)
    chromiumArgs = [...chromiumModule.args, ...chromiumArgs];
    headless = chromiumModule.headless ?? true;
    defaultViewport = chromiumModule.defaultViewport || defaultViewport;
  } else {
    executablePath = process.env.CHROME_PATH;
  }
  
  const browser = await puppeteer.default.launch({
    args: chromiumArgs,
    executablePath,
    headless,
    ignoreHTTPSErrors: true,
    defaultViewport,
  });

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
}
