import { expect } from "@playwright/test";
import type { Page, Locator } from "@playwright/test";
import { BasePage } from "../base-page";
import { TrackSelector } from "./track-selector";
import { TemperatureSlider } from "./temperature-slider";

/**
 * Page Object for Recommendation Form component
 */
export class RecommendationForm extends BasePage {
  private readonly trackSelector: TrackSelector;
  private readonly temperatureSlider: TemperatureSlider;

  // Locators
  private readonly formContainer: Locator;
  private readonly form: Locator;
  private readonly descriptionTextarea: Locator;
  private readonly descriptionCharacterCounter: Locator;
  private readonly descriptionError: Locator;
  private readonly trackSelectorError: Locator;
  private readonly generateButton: Locator;

  constructor(page: Page) {
    super(page);
    this.trackSelector = new TrackSelector(page);
    this.temperatureSlider = new TemperatureSlider(page);

    // Initialize locators
    this.formContainer = this.getByTestId("recommendation-form-container");
    this.form = this.getByTestId("recommendation-form");
    this.descriptionTextarea = this.getByTestId("description-textarea");
    this.descriptionCharacterCounter = this.getByTestId("description-character-counter");
    this.descriptionError = this.getByTestId("description-error");
    this.trackSelectorError = this.getByTestId("track-selector-error");
    this.generateButton = this.getByTestId("generate-recommendations-button");
  }

  /**
   * Wait for form to be visible and ready
   */
  async waitForFormReady(): Promise<void> {
    await this.waitForVisible(this.formContainer);
    await this.waitForVisible(this.form);
  }

  /**
   * Select a track from the library
   */
  async selectTrack(spotifyTrackId?: string): Promise<void> {
    if (spotifyTrackId) {
      await this.trackSelector.selectSpecificTrack(spotifyTrackId);
    } else {
      await this.trackSelector.selectFirstTrack();
    }
  }

  /**
   * Fill in the description text area
   */
  async fillDescription(description: string): Promise<void> {
    await this.fillInput(this.descriptionTextarea, description);
  }

  /**
   * Set temperature value using the slider
   */
  async setTemperature(value: number): Promise<void> {
    await this.temperatureSlider.setValue(value);
  }

  /**
   * Click the generate recommendations button
   */
  async generateRecommendations(): Promise<void> {
    await this.clickElement(this.generateButton);
    // Wait a bit for the loading state to take effect
    await this.page.waitForTimeout(100);
  }

  /**
   * Fill complete form and submit
   */
  async fillAndSubmitForm(options: { trackId?: string; description: string; temperature?: number }): Promise<void> {
    await this.waitForFormReady();
    await this.selectTrack(options.trackId);
    await this.fillDescription(options.description);

    if (options.temperature !== undefined) {
      await this.setTemperature(options.temperature);
    }

    await this.generateRecommendations();
  }

  // Verification methods
  async expectFormVisible(): Promise<void> {
    await expect(this.formContainer).toBeVisible();
  }

  async expectGenerateButtonEnabled(): Promise<void> {
    await expect(this.generateButton).toBeEnabled();
  }

  async expectGenerateButtonDisabled(): Promise<void> {
    await expect(this.generateButton).toBeDisabled();
  }

  async expectGenerateButtonText(text: string): Promise<void> {
    await expect(this.generateButton).toContainText(text);
  }

  async expectDescriptionCharacterCount(expectedCount: number): Promise<void> {
    await expect(this.descriptionCharacterCounter).toContainText(`${expectedCount}/500`);
  }

  async expectDescriptionError(errorMessage: string): Promise<void> {
    await expect(this.descriptionError).toContainText(errorMessage);
  }

  async expectTrackSelectorError(errorMessage: string): Promise<void> {
    await expect(this.trackSelectorError).toContainText(errorMessage);
  }

  async expectFormInLoadingState(): Promise<void> {
    // Wait for the loading state to take effect - React state updates are async
    // Use waitFor to poll for the loading state instead of fixed timeout
    await expect(this.generateButton).toContainText("Generating...", { timeout: 3000 });
    await this.expectGenerateButtonDisabled();
  }

  async expectFormInIdleState(): Promise<void> {
    await this.expectGenerateButtonText("Generate Recommendations");
    await this.expectGenerateButtonEnabled();
  }
}
