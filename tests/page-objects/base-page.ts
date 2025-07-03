import { expect } from "@playwright/test";
import type { Page, Locator } from "@playwright/test";

/**
 * Base Page Object class with common functionality
 */
export abstract class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific URL
   */
  async goto(url: string): Promise<void> {
    await this.page.goto(url);
  }

  /**
   * Wait for page to load completely
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Wait for element to be visible
   */
  async waitForVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }

  /**
   * Wait for element to be hidden
   */
  async waitForHidden(locator: Locator): Promise<void> {
    await expect(locator).toBeHidden();
  }

  /**
   * Click element with optional wait
   */
  async clickElement(locator: Locator): Promise<void> {
    await locator.click();
  }

  /**
   * Fill input with text
   */
  async fillInput(locator: Locator, text: string): Promise<void> {
    await locator.fill(text);
  }

  /**
   * Get element by data-testid
   */
  protected getByTestId(testId: string): Locator {
    return this.page.locator(`[data-testid="${testId}"]`);
  }

  /**
   * Get elements by data-testid prefix
   */
  protected getByTestIdPrefix(prefix: string): Locator {
    return this.page.locator(`[data-testid^="${prefix}"]`);
  }
}
