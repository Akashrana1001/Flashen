import { expect, test } from '@playwright/test';

const FRONTEND_BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';
const API_BASE_URL = process.env.E2E_API_URL || 'http://localhost:5000/api';
const E2E_USER_NAME = process.env.E2E_NAME || 'Golden Path QA';
const E2E_USER_EMAIL = process.env.E2E_EMAIL || 'golden-path.qa@example.com';
const E2E_USER_PASSWORD = process.env.E2E_PASSWORD || 'GoldenPath123!';

const ensureTestUserExists = async (request) => {
    const response = await request.post(`${API_BASE_URL}/auth/register`, {
        data: {
            name: E2E_USER_NAME,
            email: E2E_USER_EMAIL,
            password: E2E_USER_PASSWORD,
        },
    });

    if (![201, 409].includes(response.status())) {
        const body = await response.text();
        throw new Error(`Failed to ensure test user exists: ${response.status()} ${body}`);
    }
};

test.describe('Golden Path User Flow', () => {
    test('homepage CTA -> login -> dashboard -> theater mode grade mutation', async ({ page, request }) => {
        await ensureTestUserExists(request);

        await page.goto(FRONTEND_BASE_URL, { waitUntil: 'domcontentloaded' });

        const startStudyingCta = page.getByRole('button', { name: /Start Studying/i }).first();
        await expect(startStudyingCta).toBeVisible();
        await startStudyingCta.click();

        await page.waitForURL(/\/login/, { timeout: 15_000 });
        await page.waitForSelector('input[placeholder="Email Address"]', { state: 'visible', timeout: 10_000 });

        await page.getByPlaceholder('Email Address').fill(E2E_USER_EMAIL);
        await page.getByPlaceholder('Password').fill(E2E_USER_PASSWORD);
        await page.getByRole('button', { name: /^Sign In$/i }).click();

        const termsHeading = page.getByRole('heading', { name: /Terms of Service/i });
        if (await termsHeading.isVisible().catch(() => false)) {
            await page.getByText(/I have read and agree to the Terms of Service and Privacy Policy\./i).click();
            await page.getByRole('button', { name: /Enter Dashboard/i }).click();
        }

        await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
        await expect(page.getByRole('heading', { name: /Good Morning/i })).toBeVisible();

        // Mock one deck/card after dashboard so theater-mode interactions remain deterministic.
        // Keep /study/grade real and assert the mutation request payload.

        const mockedDeckPayload = {
            success: true,
            count: 1,
            decks: [
                {
                    _id: '64f0a5f7c9e77b0f1a2b3c4c',
                    title: 'Playwright Golden Deck',
                    masteryLevel: 62,
                    cards: [
                        {
                            _id: '64f0a5f7c9e77b0f1a2b3c4d',
                            deckId: '64f0a5f7c9e77b0f1a2b3c4c',
                            front: 'What does the SM-2 algorithm optimize?',
                            back: 'It optimizes review intervals to maximize long-term retention.',
                            keyTakeaway: 'Spacing and recall quality drive interval growth.',
                            source: 'Playwright mocked source context.',
                            repetitions: 0,
                            interval: 1,
                            easeFactor: 2.5,
                        },
                    ],
                },
            ],
        };

        await page.route('**/api/decks', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockedDeckPayload),
            });
        });

        const studyNow = page.getByRole('button', { name: /Study Now/i }).first();
        await expect(studyNow).toBeVisible({ timeout: 10_000 });
        await studyNow.click();

        await page.waitForURL(/\/practice/, { timeout: 15_000 });
        await page.waitForSelector('text=Question', { state: 'visible', timeout: 10_000 });

        // Framer Motion flip transition safety buffer.
        await page.waitForTimeout(350);
        await page.keyboard.press('Space');

        await page.waitForSelector('text=Answer', { state: 'visible', timeout: 5_000 });

        // Give grade controls time to animate in before key press.
        const gradeRequestPromise = page.waitForRequest((requestEvent) => {
            return requestEvent.url().includes('/api/study/grade') && requestEvent.method() === 'POST';
        });

        await page.waitForTimeout(250);
        await page.keyboard.press('3');

        const gradeRequest = await gradeRequestPromise;
        const gradePayload = gradeRequest.postDataJSON();

        expect(Number(gradePayload?.q)).toBe(3);

        await expect(page.getByRole('heading', { name: /Deck Mastered/i })).toBeVisible({ timeout: 10_000 });
    });
});
