import { test, expect, type Page } from '@playwright/test';
const state = (p: Page) => p.evaluate(() => (window as any).gameState());
async function chapter(p: Page, n: number) { await p.goto('/'); await p.waitForFunction(() => (window as any).gameState); await p.locator('#chapters').selectOption(String(n)); }
async function part(p: Page, kind: string, opts: Record<string, string> = {}) {
    await p.locator('#draw').click();
    await p.locator('#kind').selectOption(kind);
    await p.locator('#example').click();
    await p.locator('#finish').click();
    for (const [id, v] of Object.entries(opts))
        await p.locator('#' + id).fill(v);
    await p.locator('#confirm').click();
    await expect(p.locator('#placement')).toBeHidden();
}
async function walk(p: Page, key: string, axis: 'x' | 'z', target: number, greater = true) {
    await p.keyboard.down(key);
    try {
        await expect.poll(async () => (await state(p)).player[axis], { timeout: 30000, intervals: [100] })[greater ? 'toBeGreaterThan' : 'toBeLessThan'](target);
    }
    finally {
        await p.keyboard.up(key);
    }
}
test('forest: no bypass, lever support and gravity load open passage, next chapter', async ({ page }) => { test.setTimeout(100000); await chapter(page, 1); expect((await state(page)).solved).toBe(false); await part(page, 'support'); await part(page, 'plank'); await part(page, 'weight'); await expect.poll(async () => (await state(page)).solved, { timeout: 20000 }).toBe(true); expect((await state(page)).route).toBe('杠杆与配重'); await walk(page, 'KeyS', 'z', 1.35); await page.waitForTimeout(100); await walk(page, 'KeyD', 'x', 9); await expect(page.locator('#win')).toBeVisible(); await page.locator('#next').click(); expect((await state(page)).level).toBe(2); expect((await state(page)).objects).toBe(0); });
test('clock: wrong gear rejected, valid gear powers lift and rider reaches upper exit', async ({ page }) => { test.setTimeout(120000); await chapter(page, 2); await page.locator('#activate').click(); expect((await state(page)).liftY).toBe(0); await part(page, 'gear', { scale: '0.5' }); await page.waitForTimeout(200); expect((await state(page)).energy).toBe(0); await page.locator('#draw').click(); await page.locator('#rework').click(); await page.locator('#finish').click(); await page.locator('#confirm').click(); await expect.poll(async () => (await state(page)).energy).toBe(100); await walk(page, 'KeyD', 'x', -2); await page.keyboard.down('KeyD'); await page.keyboard.press('Space'); await expect.poll(async () => (await state(page)).player.x, { timeout: 10000, intervals: [100] }).toBeGreaterThan(-.4); await page.keyboard.up('KeyD'); await page.waitForTimeout(500); await page.locator('#activate').click(); await expect.poll(async () => (await state(page)).liftY, { timeout: 30000 }).toBeGreaterThan(5.95); expect((await state(page)).player.y).toBeGreaterThan(6); await walk(page, 'KeyD', 'x', 9); await expect(page.locator('#win')).toBeVisible(); });
test('sea: buoyancy, sail propulsion, pause and actual crossing', async ({ page }) => { test.setTimeout(120000); await chapter(page, 3); await part(page, 'float'); await part(page, 'sail'); await walk(page, 'KeyD', 'x', -9.6); await page.keyboard.down('KeyD'); await page.keyboard.press('Space'); await expect.poll(async () => (await state(page)).player.x, { timeout: 15000, intervals: [100] }).toBeGreaterThan(-7.5); await page.keyboard.up('KeyD'); await expect.poll(async () => (await state(page)).creations.find((c: any) => c.kind === 'float').position.x, { timeout: 65000, intervals: [500] }).toBeGreaterThan(6.5); expect((await state(page)).player.x).toBeGreaterThan(3); expect((await state(page)).player.y).toBeGreaterThan(0); await page.keyboard.down('KeyD'); await page.keyboard.press('Space'); await expect(page.locator('#win')).toBeVisible({ timeout: 15000 }); await page.keyboard.up('KeyD'); expect((await state(page)).route).toBe('船帆与风力'); await expect(page.locator('#next')).toBeHidden(); });
test('alternative mechanical inputs and reset', async ({ page }) => { test.setTimeout(60000); await chapter(page, 1); await part(page, 'rope'); await part(page, 'weight'); await expect.poll(async () => (await state(page)).solved, { timeout: 20000 }).toBe(true); expect((await state(page)).route).toBe('树根绳索牵引'); await page.locator('#chapters').selectOption('2'); await part(page, 'pulley'); await part(page, 'weight'); await expect.poll(async () => (await state(page)).energy, { timeout: 10000 }).toBeGreaterThan(10); expect((await state(page)).route).toBe('滑轮与配重'); await page.locator('#reset').click(); expect((await state(page)).energy).toBe(0); expect((await state(page)).objects).toBe(0); });
test('forest rolling impact and clock lever alternatives', async ({ page }) => {
    test.setTimeout(90000);
    await chapter(page, 1);
    await page.locator('#draw').click();
    await page.locator('#kind').selectOption('support');
    const r = (await page.locator('#paper').boundingBox())!;
    const coords = [[140, 220], [700, 220], [700, 260], [140, 260], [140, 220]];
    await page.mouse.move(r.x + coords[0][0] / 840 * r.width, r.y + coords[0][1] / 480 * r.height);
    await page.mouse.down();
    for (const [x, y] of coords.slice(1))
        await page.mouse.move(r.x + x / 840 * r.width, r.y + y / 480 * r.height, { steps: 8 });
    await page.mouse.up();
    await page.locator('#finish').click();
    await page.locator('#posx').fill('-5');
    await page.locator('#scale').fill('0.85');
    await page.locator('#angle').fill('-20');
    await page.locator('#confirm').click();
    await part(page, 'wheel', { posx: '-6', posy: '3.5', scale: '1.2' });
    await expect.poll(async () => (await state(page)).solved, { timeout: 25000 }).toBe(true);
    expect((await state(page)).route).toBe('斜坡滚轮冲击');
    await page.locator('#chapters').selectOption('2');
    await part(page, 'support');
    await part(page, 'plank');
    await part(page, 'weight');
    await expect.poll(async () => (await state(page)).energy, { timeout: 10000 }).toBeGreaterThan(10);
    expect((await state(page)).route).toBe('杠杆分段提升');
});
for (const route of ['raft', 'tether'])
    test(`sea alternative actual travel: ${route}`, async ({ page }) => {
        test.setTimeout(100000);
        await chapter(page, 3);
        await part(page, 'float');
        if (route === 'raft') {
            await part(page, 'float', { posx: '-3.2' });
            await part(page, 'plank', { posx: '-5', scale: '0.5', posy: '0.6' });
        }
        else
            await part(page, 'rope');
        await walk(page, 'KeyD', 'x', -9.6);
        await page.keyboard.down('KeyD');
        await page.keyboard.press('Space');
        await expect.poll(async () => (await state(page)).player.x, { timeout: 10000, intervals: [100] }).toBeGreaterThan(-7.5);
        await page.keyboard.up('KeyD');
        await expect.poll(async () => (await state(page)).creations.filter((c: any) => c.kind === 'float').reduce((max: number, c: any) => Math.max(max, c.position.x), -Infinity), { timeout: 65000 }).toBeGreaterThan(6.5);
        expect((await state(page)).player.x).toBeGreaterThan(0);
        expect((await state(page)).route).toBe(route === 'raft' ? '浮筒与海流' : '牵引漂浮平台');
        await page.keyboard.down('KeyD');
        for (let i = 0; i < 40 && (await state(page)).mode !== 'win'; i++) {
            await page.keyboard.press('Space');
            await page.waitForTimeout(400);
        }
        await page.keyboard.up('KeyD');
        await expect(page.locator('#win')).toBeVisible();
    });
test('sea rejects a single oversized spanning bridge',async({page})=>{await chapter(page,3);await page.locator('#draw').click();await page.locator('#kind').selectOption('plank');await page.locator('#example').click();await page.locator('#finish').click();await page.locator('#posx').fill('0');await page.locator('#scale').fill('2.5');await page.locator('#confirm').click();expect((await state(page)).objects).toBe(0);await expect(page.locator('#placement')).toBeVisible();await expect(page.locator('#status')).toContainText('跨度');await page.locator('#scale').fill('1');await page.locator('#confirm').click();expect((await state(page)).objects).toBe(1);});
