# Gmail Account Creator

A serverless application that automatically creates Gmail accounts and returns the credentials in JSON format. Built for Vercel deployment.

**Repository**: [https://github.com/xazalea/gacc](https://github.com/xazalea/gacc)

## Features

- 🚀 Serverless-ready (Vercel compatible)
- 🤖 Automated Gmail account creation using Puppeteer
- 📝 Returns account credentials in JSON format
- 🎨 Modern, responsive UI
- 🔒 Secure password generation

## Important Notes

⚠️ **Disclaimer**: This tool is for educational purposes only. Automated account creation may violate Google's Terms of Service. Use at your own risk.

⚠️ **Limitations**:
- Gmail may require phone verification for new accounts
- Vercel Hobby plan has a 10-second execution limit (may not be enough)
- Vercel Pro plan has a 60-second execution limit
- Account creation may fail due to Google's anti-bot measures

## Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/xazalea/gacc.git
cd gacc
```

2. Install dependencies:
```bash
npm install
```

3. For local development, you may need to set the Chrome path:
```bash
export CHROME_PATH=/path/to/chrome
```

Or create a `.env.local` file:
```
CHROME_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
```

### Local Development

```bash
npm run dev
```

Visit `http://localhost:3000` to use the application.

### API Endpoint

The API endpoint is available at:
- **POST** `/api/create-gmail` - Create a new Gmail account
- **GET** `/api/create-gmail` - Create a new Gmail account (for testing)

**Response Format:**
```json
{
  "success": true,
  "account": {
    "email": "john.doe12345@gmail.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "username": "john.doe12345",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Deployment to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Vercel will automatically detect Next.js and configure the build

### Vercel Configuration

The project uses:
- `puppeteer-core` for browser automation (dynamic import - not bundled)
- `@sparticuz/chromium-min` - a minimal Chromium binary optimized for serverless (<30MB)
- Next.js API routes for the backend

**No External Services Required!**

This setup uses `@sparticuz/chromium-min` which is a minimal Chromium build designed to stay under Vercel's size limits. All dependencies are loaded dynamically at runtime to minimize bundle size.

**Size Optimizations:**

1. **Dynamic Imports**: `puppeteer-core` and `chromium-min` are loaded only when needed
2. **Minimal Chromium Build**: Using `chromium-min` instead of full Chromium (~20-25MB vs ~50MB)
3. **Webpack Externals**: Chromium is excluded from bundling
4. **Minimal Args**: Only essential Chromium flags are used
5. **Optimized Timeouts**: Reduced delays and timeouts throughout

**Important Notes:**

1. **Function Size**: Should now be under 30MB with `chromium-min`
2. **Execution Time**: 
   - Vercel Hobby: 10 seconds (may not be enough for full flow)
   - Vercel Pro: 60 seconds (recommended)
3. **Memory**: Set to 1024MB in `vercel.json` for optimal performance

## Project Structure

```
transparency/
├── app/
│   ├── api/
│   │   └── create-gmail/
│   │       └── route.ts      # API endpoint
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Frontend UI
├── lib/
│   ├── userGenerator.ts      # User info generation
│   └── gmailCreator.ts       # Gmail creation logic
├── package.json
├── tsconfig.json
└── README.md
```

## Customization

### Modify User Generation

Edit `lib/userGenerator.ts` to customize:
- First names and last names
- Password complexity
- Username format
- Birthday range

### Modify Gmail Creation Flow

Edit `lib/gmailCreator.ts` to customize:
- Form filling logic
- Wait times
- Error handling
- Phone verification integration

## Troubleshooting

### Timeout Issues

If you encounter timeouts:
1. Upgrade to Vercel Pro plan (60s limit)
2. Optimize wait times in `gmailCreator.ts`
3. Consider using a faster SMS verification service

### Chrome/Chromium Issues

For local development:
- Ensure Chrome is installed
- Set `CHROME_PATH` environment variable
- Or install `puppeteer` (includes Chromium) instead of `puppeteer-core`

### Account Creation Failures

Gmail may block automated account creation. Consider:
- Using proxies
- Adding delays between actions
- Using residential proxies
- Integrating with SMS verification services

## License

This project is for educational purposes only.

## Acknowledgments

Inspired by:
- [AutoCreateGmailAccount](https://github.com/BourneXu/AutoCreateGmailAccount)
- [Auto-Gmail-Creator](https://github.com/ai-to-ai/Auto-Gmail-Creator)
- [Gmail-Creation-Automation-Python](https://github.com/khaouitiabdelhakim/Gmail-Creation-Automation-Python)

