import { expect } from "@playwright/test";
import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base-page";
import { RecommendationForm } from "./components/recommendation-form";
import { RecommendationsList } from "./components/recommendations-list";

/**
 * Main Page Object for the Discover page
 */
export class DiscoverPage extends BasePage {
  private readonly recommendationForm: RecommendationForm;
  private readonly recommendationsList: RecommendationsList;

  // Locators
  private readonly pageContainer: Locator;
  private readonly libraryLoading: Locator;
  private readonly libraryError: Locator;
  private readonly retryLibraryButton: Locator;
  private readonly mainLayout: Locator;

  constructor(page: Page) {
    super(page);
    this.recommendationForm = new RecommendationForm(page);
    this.recommendationsList = new RecommendationsList(page);

    // Initialize locators
    this.pageContainer = this.getByTestId("discover-view");
    this.libraryLoading = this.getByTestId("library-loading");
    this.libraryError = this.getByTestId("library-error");
    this.retryLibraryButton = this.getByTestId("retry-library-button");
    this.mainLayout = this.getByTestId("discover-main-layout");
  }

  /**
   * Navigate to the discover page
   */
  async navigate(): Promise<void> {
    await this.goto("/discover");
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to load completely
   */
  async waitForPageLoad(): Promise<void> {
    await this.waitForVisible(this.pageContainer);
  }

  /**
   * Wait for main layout to be visible (library loaded successfully)
   */
  async waitForMainLayout(): Promise<void> {
    await this.waitForVisible(this.mainLayout);
  }

  /**
   * Retry loading library after error
   */
  async retryLibraryLoad(): Promise<void> {
    await this.clickElement(this.retryLibraryButton);
  }

  /**
   * Complete recommendation generation flow
   */
  async generateRecommendations(options: {
    trackId?: string;
    description: string;
    temperature?: number;
    expectedCount?: number;
  }): Promise<void> {
    await this.waitForMainLayout();

    // Fill and submit form
    await this.recommendationForm.fillAndSubmitForm({
      trackId: options.trackId,
      description: options.description,
      temperature: options.temperature || 0.5,
    });

    // Wait for results
    await this.recommendationsList.waitForSuccessfulGeneration(options.expectedCount || 10);
  }

  /**
   * Access form component
   */
  get form(): RecommendationForm {
    return this.recommendationForm;
  }

  /**
   * Access recommendations list component
   */
  get recommendations(): RecommendationsList {
    return this.recommendationsList;
  }

  // Verification methods - Page States
  async expectPageLoaded(): Promise<void> {
    await expect(this.pageContainer).toBeVisible();
  }

  async expectLibraryLoading(): Promise<void> {
    await expect(this.libraryLoading).toBeVisible();
  }

  async expectLibraryError(): Promise<void> {
    await expect(this.libraryError).toBeVisible();
  }

  async expectMainLayoutVisible(): Promise<void> {
    await expect(this.mainLayout).toBeVisible();
  }

  async expectRetryLibraryButtonVisible(): Promise<void> {
    await expect(this.retryLibraryButton).toBeVisible();
  }

  // High-level workflow methods
  async expectSuccessfulRecommendationFlow(options: {
    description: string;
    temperature?: number;
    expectedCount?: number;
  }): Promise<void> {
    // Verify initial state
    await this.expectPageLoaded();
    await this.expectMainLayoutVisible();

    // Verify form is ready
    await this.form.expectFormVisible();

    // Complete the flow
    await this.generateRecommendations({
      description: options.description,
      temperature: options.temperature,
      expectedCount: options.expectedCount,
    });

    // Verify final state
    await this.recommendations.expectSuccessState();
    await this.form.expectFormInIdleState();
  }

  async expectErrorRecommendationFlow(options: { description: string; expectedErrorMessage: string }): Promise<void> {
    await this.waitForMainLayout();

    await this.form.fillAndSubmitForm({
      description: options.description,
    });

    // Expect error state
    await this.recommendations.expectErrorState();
    await this.recommendations.expectErrorMessage(options.expectedErrorMessage);
    await this.recommendations.expectRetryButtonVisible();
  }
}
