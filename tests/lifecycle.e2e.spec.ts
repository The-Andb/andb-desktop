import { test, expect } from '../e2e/fixtures/app.fixture';

test.describe('Real-World Lifecycle', () => {
  test('Complete User Journey: Global Setup -> Projects -> Connections -> Ops -> Sync -> Report', async ({ appFixture }) => {
    // Increase timeout for the full lifecycle journey (5 mins)
    test.setTimeout(300000); 

    const { window } = appFixture;

    // --- ROBUST INTERACTION HELPERS ---

    // 1. click helper that prioritizes visible, non-ghost elements
    const robustClick = async (text: string, scope: string = 'body') => {
        const success = await window.waitForFunction(({ btnText, scopeSelector }) => {
            const root = document.querySelector(scopeSelector) || document.body;
            const elements = Array.from(root.querySelectorAll('button, a, span, div, h1, h2, h3, h4, p, td, tr, [title]'));
            
            const target = elements.find(el => 
                ((el.textContent || '').trim().toUpperCase().includes(btnText.toUpperCase()) || 
                 (el.getAttribute('title') || '').toUpperCase().includes(btnText.toUpperCase())) &&
                (el.getBoundingClientRect().width > 0 || (el as HTMLElement).offsetParent !== null) &&
                !el.closest('.drawer:not(.is-open)') 
            );

            if (target) {
                (target as HTMLElement).click();
                return true;
            }
            return false;
        }, { btnText: text, scopeSelector: scope }, { timeout: 30000 }).catch(() => false);

        if (!success) {
            throw new Error(`RobustClick failed to find/click: "${text}" in scope: "${scope}" within 30s`);
        }
    };

    // 2. fill helper that finds input via label text association
    const robustFillByLabel = async (label: string, value: string) => {
        const success = await window.waitForFunction(({ l, v }) => {
            const labels = Array.from(document.querySelectorAll('label'));
            const targetLabel = labels.find(el => 
                (el.textContent || '').trim().toUpperCase().includes(l.toUpperCase()) &&
                (el.getBoundingClientRect().width > 0 || (el as HTMLElement).offsetParent !== null)
            );
            if (targetLabel) {
                let input = targetLabel.parentElement?.querySelector('input') || 
                            targetLabel.nextElementSibling?.querySelector('input') || 
                            document.getElementById(targetLabel.getAttribute('for') || '') ||
                            (targetLabel.nextElementSibling?.tagName === 'INPUT' ? targetLabel.nextElementSibling : null);
                
                if (input instanceof HTMLInputElement) {
                    input.value = v;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    return true;
                }
            }
            return false;
        }, { l: label, v: value }, { timeout: 20000 }).catch(() => false);

        if (!success) {
            throw new Error(`RobustFillByLabel failed to find/fill: "${label}" with value: "${value}"`);
        }
    };

    // 3. select helper that waits for options to load asynchronously
    const robustSelect = async (label: string, optionText: string) => {
        const success = await window.waitForFunction(({ lab, opt }) => {
            const labels = Array.from(document.querySelectorAll('label'));
            const targetLabel = labels.find(el => 
                (el.textContent || '').trim().toUpperCase().includes(lab.toUpperCase()) &&
                (el.getBoundingClientRect().width > 0 || (el as HTMLElement).offsetParent !== null)
            );
            if (targetLabel) {
                const select = targetLabel.parentElement?.querySelector('select') || 
                               targetLabel.nextElementSibling?.querySelector('select') ||
                               targetLabel.nextElementSibling;
                if (select instanceof HTMLSelectElement) {
                    const option = Array.from(select.options).find(o => o.text.toUpperCase().includes(opt.toUpperCase()));
                    if (option) {
                        select.value = option.value;
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                        select.dispatchEvent(new Event('input', { bubbles: true }));
                        return true;
                    }
                }
            }
            return false;
        }, { lab: label, opt: optionText }, { timeout: 30000 }).catch(() => false);

        if (!success) {
            throw new Error(`RobustSelect failed to find/select: "${optionText}" for label: "${label}"`);
        }
    };

    // 4. assertion helper with auto-reload for Vue loading stalls
    const robustExpectContain = async (text: string, maxRetries: number = 1) => {
        for (let i = 0; i <= maxRetries; i++) {
            try {
                await window.waitForFunction((val) => {
                    const bodyText = document.body.innerText.toUpperCase();
                    return bodyText.includes(val.toUpperCase());
                }, text, { timeout: 45000 });
                return; 
            } catch (e) {
                if (i < maxRetries) {
                    console.log(`[E2E] Assertion failed for "${text}". Reloading and retrying...`);
                    await window.reload();
                    await window.waitForTimeout(10000);
                } else {
                    throw e;
                }
            }
        }
    };

    // --- PHASE 0: INITIAL CLEANUP ---
    console.log('[E2E] Phase 0: Initial Cleanup (Detection)');
    
    // Wait for EITHER Setup Mode or Dashboard to be ready
    await expect(async () => {
        const initVisible = await window.locator('button:has-text("INITIALIZE WORKSPACE")').first().isVisible();
        const settingsVisible = await window.getByTitle('Settings', { exact: true }).first().isVisible();
        if (!initVisible && !settingsVisible) throw new Error('Wait for app boot status...');
    }).toPass({ timeout: 45000, intervals: [2000, 5000] });

    let isSetupMode = await window.locator('button:has-text("INITIALIZE WORKSPACE")').first().isVisible();

    if (!isSetupMode) {
        console.log('[E2E] Dashboard detected, performing data reset...');
        const settingsBtn = window.getByTitle('Settings', { exact: true }).first();
        await settingsBtn.click(); 
        await window.waitForTimeout(5000);
        
        const resetBtn = window.locator('button:has-text("Reset All Data")').first();
        if (await resetBtn.isVisible()) {
            await resetBtn.click();
            await window.click('button:has-text("Yes, Delete All")');
            await window.waitForTimeout(15000); 
            await window.reload();
            await window.waitForTimeout(10000);
        }
    }

    // --- PHASE 1: GLOBAL SETUP ---
    console.log('[E2E] Phase 1: Global Setup');
    
    // Ensure we are in setup mode if we reset data
    await window.waitForTimeout(5000); 
    const readyInitBtn = window.locator('button:has-text("INITIALIZE WORKSPACE")').first();
    
    if (await readyInitBtn.isVisible()) {
        console.log('[E2E] Initializing Workspace...');
        await readyInitBtn.click();
        console.log('[E2E] Waiting for initialization to complete...');
        await window.waitForTimeout(10000); 
        await window.reload();
        await window.waitForTimeout(5000);
    }

    // 1.1 Global Connections
    const readySettingsBtn = window.getByTitle('Settings', { exact: true }).first();
    await readySettingsBtn.waitFor({ state: 'visible', timeout: 60000 });
    await readySettingsBtn.click();
    await robustClick('Connections');
    await window.waitForTimeout(2000); 

    // 1.2 Create MySQL Connection
    await robustClick('Add Connection');
    await window.waitForTimeout(5000); 
    
    const timestamp = Date.now();
    const verifyName = `E2E MySQL ${timestamp}`;
    await robustFillByLabel('Connection Name', verifyName);
    await robustSelect('Driver', 'MySQL / MariaDB');
    await window.waitForTimeout(3000);
    
    await robustFillByLabel('Host', '127.0.0.1');
    await robustFillByLabel('Port', '3306');
    await robustFillByLabel('Username', 'root');
    
    await robustClick('Save');
    await expect(window.locator('.drawer.is-open')).not.toBeVisible({ timeout: 20000 });
    await robustExpectContain(verifyName);

    // --- PHASE 2: PROJECT MANAGEMENT ---
    console.log('[E2E] Phase 2: Project Management');
    
    await window.getByTitle('Project Manager').first().click();
    await window.waitForURL(/.*projects/, { timeout: 30000 });
    await robustExpectContain('Projects');
    
    await robustClick('New Project');
    await robustClick('Untitled Project');
    await window.waitForURL(/.*project-dashboard/, { timeout: 30000 });

    // --- PHASE 3: PROJECT CONNECTION SETUP ---
    console.log('[E2E] Phase 3: Project Connection Setup');
    
    await robustClick('Project Settings', 'aside, nav');
    await window.waitForURL(/.*project-settings/, { timeout: 30000 });
    
    await robustClick('Import'); 
    await robustClick(verifyName);
    await robustClick('IMPORT');
    await expect(window.locator('.drawer.is-open')).not.toBeVisible({ timeout: 20000 });

    await robustClick('(No DB)');
    await window.waitForTimeout(5000);
    await window.evaluate((val) => {
        const input = Array.from(document.querySelectorAll('input.border-primary-500')).find(el => 
            (el.getBoundingClientRect().width > 0 || (el as HTMLElement).offsetParent !== null)
        );
        if (input instanceof HTMLInputElement) {
            input.value = val;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }, 'andb_test_source');
    await window.keyboard.press('Enter');
    await window.waitForTimeout(5000);

    await robustClick('Add Connection');
    await window.waitForTimeout(5000);
    await robustClick('DEV');
    await robustSelect('Template', verifyName);
    await window.waitForTimeout(4000);
    await robustFillByLabel('Connection Name', 'Lifecycle Target');
    await robustFillByLabel('Database', 'andb_test_target');
    await robustClick('Save');
    await expect(window.locator('.drawer.is-open')).not.toBeVisible({ timeout: 20000 });
    await window.waitForTimeout(5000);
    await robustExpectContain('Lifecycle Target');
    await window.waitForTimeout(3000);

    // --- PHASE 4: SYNC PAIR SETUP ---
    console.log('[E2E] Phase 4: Sync Pair Setup');

    await robustClick('Env & Sync Pairs', 'aside, nav');
    await robustExpectContain('Sync Pairs');
    await robustClick('Add Pair');
    await robustFillByLabel('Pair name', 'Lifecycle Sync Pair');
    
    await window.evaluate(({ source, target }) => {
        const selects = Array.from(document.querySelectorAll('main select')).filter(s => 
            (s.getBoundingClientRect().width > 0 || (s as HTMLElement).offsetParent !== null)
        );
        if (selects.length >= 2) {
            const s1 = selects[0] as HTMLSelectElement;
            const s2 = selects[1] as HTMLSelectElement;
            const o1 = Array.from(s1.options).find(o => o.text.includes(source));
            const o2 = Array.from(s2.options).find(o => o.text.includes(target));
            if (o1) { s1.value = o1.value; s1.dispatchEvent(new Event('change', { bubbles: true })); }
            if (o2) { s2.value = o2.value; s2.dispatchEvent(new Event('change', { bubbles: true })); }
        }
    }, { source: verifyName, target: 'Lifecycle Target' });

    await robustClick('Save');
    await expect(window.locator('.drawer.is-open')).not.toBeVisible({ timeout: 20000 });
    await robustExpectContain('Lifecycle Sync Pair');

    // --- PHASE 5: REAL-WORLD SYNC FLOW ---
    console.log('[E2E] Phase 5: Real-World Sync Flow');

    await robustClick('Dashboard', 'aside, nav');
    await window.waitForURL(/.*dashboard/, { timeout: 30000 });
    
    await robustClick('Compare');
    await window.waitForURL(/.*mirrordiff/, { timeout: 30000 });
    await robustExpectContain('Diff & Sync');

    await robustClick('History', 'aside, nav');
    await window.waitForURL(/.*history/, { timeout: 30000 });
    await robustExpectContain('History');
  });
});
