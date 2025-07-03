import { expect } from "@playwright/test";
import type { Page, Locator } from "@playwright/test";
import { BasePage } from "../base-page";

/**
 * Page Object for Recommendations List component
 */
export class RecommendationsList extends BasePage {
  // Locators
  private readonly loadingState: Locator;
  private readonly errorState: Locator;
  private readonly emptyState: Locator;
  private readonly successState: Locator;
  private readonly errorMessage: Locator;
  private readonly retryButton: Locator;
  private readonly generationMetadata: Locator;
  private readonly generationStats: Locator;
  private readonly generationConfig: Locator;
  private readonly excludedTracksInfo: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.loadingState = this.getByTestId("recommendations-loading");
    this.errorState = this.getByTestId("recommendations-error");
    this.emptyState = this.getByTestId("recommendations-empty");
    this.successState = this.getByTestId("recommendations-list");
    this.errorMessage = this.getByTestId("error-message");
    this.retryButton = this.getByTestId("retry-button");
    this.generationMetadata = this.getByTestId("generation-metadata");
    this.generationStats = this.getByTestId("generation-stats");
    this.generationConfig = this.getByTestId("generation-config");
    this.excludedTracksInfo = this.getByTestId("excluded-tracks-info");
  }

  /**
   * Get skeleton loading elements
   */
  private getSkeletons(): Locator {
    return this.getByTestIdPrefix("recommendation-skeleton-");
  }

  /**
   * Get specific skeleton by index
   */
  private getSkeleton(index: number): Locator {
    return this.getByTestId(`recommendation-skeleton-${index}`);
  }

  /**
   * Get all recommendation items
   */
  private getRecommendationItems(): Locator {
    return this.getByTestIdPrefix("recommendation-item-");
  }

  /**
   * Get specific recommendation item by index
   */
  getRecommendationItem(index: number): Locator {
    return this.getByTestId(`recommendation-item-${index}`);
  }

  /**
   * Get Add to Library button for specific recommendation
   */
  private getAddButton(index: number): Locator {
    return this.getByTestId(`add-button-${index}`);
  }

  /**
   * Get Block Track button for specific recommendation
   */
  private getBlockButton(index: number): Locator {
    return this.getByTestId(`block-button-${index}`);
  }

  /**
   * Get Details button for specific recommendation
   */
  private getDetailsButton(index: number): Locator {
    return this.getByTestId(`details-button-${index}`);
  }

  /**
   * Get Block Track dropdown menu items
   */
  private getBlockDropdownItems(): {
    oneDay: Locator;
    sevenDays: Locator;
    permanent: Locator;
  } {
    return {
      oneDay: this.page.getByRole("menuitem", { name: "Block for 1 day" }),
      sevenDays: this.page.getByRole("menuitem", { name: "Block for 7 days" }),
      permanent: this.page.getByRole("menuitem", { name: "Block permanently" }),
    };
  }

  /**
   * Wait for recommendations to finish loading
   */
  async waitForRecommendations(timeout = 30000): Promise<void> {
    await expect(this.successState).toBeVisible({ timeout });
  }

  /**
   * Retry after error
   */
  async retryGeneration(): Promise<void> {
    await this.clickElement(this.retryButton);
  }

  // Action methods - Add to Library
  /**
   * Click Add to Library button for specific recommendation
   */
  async addRecommendationToLibrary(index: number): Promise<void> {
    const addButton = this.getAddButton(index);
    await this.clickElement(addButton);
  }

  /**
   * Block a track with specific duration
   */
  async blockRecommendation(index: number, duration: "1d" | "7d" | "permanent" = "permanent"): Promise<void> {
    const blockButton = this.getBlockButton(index);
    await this.clickElement(blockButton);

    const dropdownItems = this.getBlockDropdownItems();

    switch (duration) {
      case "1d":
        await this.clickElement(dropdownItems.oneDay);
        break;
      case "7d":
        await this.clickElement(dropdownItems.sevenDays);
        break;
      case "permanent":
        await this.clickElement(dropdownItems.permanent);
        break;
    }
  }

  /**
   * Open details modal for specific recommendation
   */
  async openRecommendationDetails(index: number): Promise<void> {
    const detailsButton = this.getDetailsButton(index);
    await this.clickElement(detailsButton);
  }

  // Verification methods - Loading State
  async expectLoadingState(): Promise<void> {
    await expect(this.loadingState).toBeVisible();
  }

  async expectSkeletonsVisible(count = 5): Promise<void> {
    for (let i = 0; i < count; i++) {
      await expect(this.getSkeleton(i)).toBeVisible();
    }
  }

  // Verification methods - Error State
  async expectErrorState(): Promise<void> {
    await expect(this.errorState).toBeVisible();
  }

  async expectErrorMessage(message: string): Promise<void> {
    await expect(this.errorMessage).toContainText(message);
  }

  async expectRetryButtonVisible(): Promise<void> {
    await expect(this.retryButton).toBeVisible();
  }

  // Verification methods - Empty State
  async expectEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible();
  }

  // Verification methods - Success State
  async expectSuccessState(): Promise<void> {
    await expect(this.successState).toBeVisible();
  }

  async expectRecommendationsCount(count: number): Promise<void> {
    await expect(this.getRecommendationItems()).toHaveCount(count);
  }

  async expectGenerationMetadataVisible(): Promise<void> {
    await expect(this.generationMetadata).toBeVisible();
  }

  async expectGenerationStats(expectedRecommendationCount: number): Promise<void> {
    await expect(this.generationStats).toContainText(`Generated ${expectedRecommendationCount} recommendations`);
  }

  async expectGenerationConfig(temperature: number): Promise<void> {
    await expect(this.generationConfig).toContainText(`Temperature: ${temperature}`);
  }

  async expectExcludedTracksInfo(excludedCount: number): Promise<void> {
    if (excludedCount > 0) {
      await expect(this.excludedTracksInfo).toContainText(`${excludedCount} tracks were excluded`);
    } else {
      await expect(this.excludedTracksInfo).toBeHidden();
    }
  }

  async expectSpecificRecommendationVisible(index: number): Promise<void> {
    await expect(this.getRecommendationItem(index)).toBeVisible();
  }

  // Verification methods - Button States
  /**
   * Check the state of Add to Library button
   */
  async expectAddButtonState(index: number, state: "idle" | "adding" | "added" | "disabled"): Promise<void> {
    const addButton = this.getAddButton(index);

    switch (state) {
      case "idle":
        await expect(addButton).toBeEnabled();
        await expect(addButton).toContainText("Add");
        break;
      case "adding":
        await expect(addButton).toBeDisabled();
        await expect(addButton).toContainText("Adding...");
        break;
      case "added":
        await expect(addButton).toBeDisabled();
        await expect(addButton).toContainText("Added");
        break;
      case "disabled":
        await expect(addButton).toBeDisabled();
        break;
    }
  }

  /**
   * Check the state of Block Track button
   */
  async expectBlockButtonState(index: number, state: "idle" | "blocking" | "blocked" | "disabled"): Promise<void> {
    const blockButton = this.getBlockButton(index);

    switch (state) {
      case "idle":
        await expect(blockButton).toBeEnabled();
        await expect(blockButton).toContainText("Block");
        break;
      case "blocking":
        await expect(blockButton).toBeDisabled();
        await expect(blockButton).toContainText("Blocking...");
        break;
      case "blocked":
        await expect(blockButton).toBeDisabled();
        await expect(blockButton).toContainText("Blocked");
        break;
      case "disabled":
        await expect(blockButton).toBeDisabled();
        break;
    }
  }

  /**
   * Wait for Add button to change from adding to added state
   */
  async waitForTrackAdded(index: number, timeout = 10000): Promise<void> {
    const addButton = this.getAddButton(index);

    // Wait for "Adding..." state
    await expect(addButton).toContainText("Adding...", { timeout: 5000 });

    // Wait for "Added" state
    await expect(addButton).toContainText("Added", { timeout });
  }

  /**
   * Wait for Block button to change from blocking to blocked state
   */
  async waitForTrackBlocked(index: number, timeout = 10000): Promise<void> {
    const blockButton = this.getBlockButton(index);

    // Wait for "Blocking..." state
    await expect(blockButton).toContainText("Blocking...", { timeout: 5000 });

    // Wait for "Blocked" state
    await expect(blockButton).toContainText("Blocked", { timeout });
  }

  // Action methods
  async scrollToRecommendation(index: number): Promise<void> {
    await this.getRecommendationItem(index).scrollIntoViewIfNeeded();
  }

  /**
   * Wait for loading to complete and verify success
   */
  async waitForSuccessfulGeneration(expectedCount = 10): Promise<void> {
    await this.waitForRecommendations();
    await this.expectSuccessState();
    await this.expectRecommendationsCount(expectedCount);
    await this.expectGenerationMetadataVisible();
  }
}
