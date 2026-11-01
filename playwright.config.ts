import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
export default defineConfig({
    testDir: 'tests', workers: 1,
    use: { baseURL: 'http://127.0.0.1:5173', viewport: { width: 1440, height: 960 },
        launchOptions: { executablePath: existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined,
            args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } },
    webServer: { command: 'npm run dev -- --port 5173 --strictPort', url: 'http://127.0.0.1:5173', reuseExistingServer: true, timeout: 30000 }
});
