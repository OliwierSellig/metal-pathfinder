import { expect } from "@playwright/test";
import type { Page, Locator } from "@playwright/test";
import { BasePage } from "../base-page";

/**
 * Page Object for Track Selector component
 */
export class TrackSelector extends BasePage {
  // Locators
  private readonly container: Locator;
  private readonly trigger: Locator;
  private readonly dropdown: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.container = this.getByTestId("track-selector-container");
    this.trigger = this.getByTestId("track-selector-trigger");
    this.dropdown = this.getByTestId("track-selector-dropdown");
  }

  /**
   * Open the track selector dropdown
   */
  async openDropdown(): Promise<void> {
    await this.clickElement(this.trigger);
    await this.waitForVisible(this.dropdown);
  }

  /**
   * Close the dropdown (click outside or press escape)
   */
  async closeDropdown(): Promise<void> {
    await this.page.keyboard.press("Escape");
    await this.waitForHidden(this.dropdown);
  }

  /**
   * Select a specific track by Spotify track ID
   */
  async selectSpecificTrack(spotifyTrackId: string): Promise<void> {
    await this.openDropdown();
    const trackOption = this.getByTestId(`track-option-${spotifyTrackId}`);
    await this.clickElement(trackOption);
  }

  /**
   * Select the first available track
   */
  async selectFirstTrack(): Promise<void> {
    await this.openDropdown();
    const firstTrackOption = this.getByTestIdPrefix("track-option-").first();
    await this.clickElement(firstTrackOption);
  }

  /**
   * Get all available track options
   */
  private getTrackOptions(): Locator {
    return this.getByTestIdPrefix("track-option-");
  }

  /**
   * Get track option by index
   */
  async selectTrackByIndex(index: number): Promise<void> {
    await this.openDropdown();
    const trackOption = this.getTrackOptions().nth(index);
    await this.clickElement(trackOption);
  }

  // Verification methods
  async expectSelectorVisible(): Promise<void> {
    await expect(this.container).toBeVisible();
  }

  async expectDropdownOpen(): Promise<void> {
    await expect(this.dropdown).toBeVisible();
  }

  async expectDropdownClosed(): Promise<void> {
    await expect(this.dropdown).toBeHidden();
  }

  async expectTrackOptionsCount(expectedCount: number): Promise<void> {
    await this.openDropdown();
    await expect(this.getTrackOptions()).toHaveCount(expectedCount);
  }

  async expectSpecificTrackInOptions(spotifyTrackId: string): Promise<void> {
    await this.openDropdown();
    const trackOption = this.getByTestId(`track-option-${spotifyTrackId}`);
    await expect(trackOption).toBeVisible();
  }

  async expectTriggerPlaceholder(placeholderText: string): Promise<void> {
    await expect(this.trigger).toContainText(placeholderText);
  }
}
