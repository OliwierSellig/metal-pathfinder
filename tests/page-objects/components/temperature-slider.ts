import { expect } from "@playwright/test";
import type { Page, Locator } from "@playwright/test";
import { BasePage } from "../base-page";

/**
 * Page Object for Temperature Slider component
 */
export class TemperatureSlider extends BasePage {
  // Locators
  private readonly container: Locator;
  private readonly slider: Locator;
  private readonly description: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.container = this.getByTestId("temperature-slider-container");
    this.slider = this.getByTestId("temperature-slider");
    this.description = this.getByTestId("temperature-description");
  }

  /**
   * Set slider value by clicking at approximate position
   * Note: This is a simplified approach - for precise values,
   * you might need to calculate pixel positions
   */
  async setValue(value: number): Promise<void> {
    // Ensure value is in valid range
    const clampedValue = Math.max(0.1, Math.min(1.0, value));

    // Get slider bounding box
    const sliderBox = await this.slider.boundingBox();
    if (!sliderBox) {
      throw new Error("Could not get slider bounding box");
    }

    // Calculate click position (value between 0.1 and 1.0)
    const normalizedValue = (clampedValue - 0.1) / 0.9; // Normalize to 0-1 range
    const clickX = sliderBox.x + sliderBox.width * normalizedValue;
    const clickY = sliderBox.y + sliderBox.height / 2;

    // Click at calculated position
    await this.page.mouse.click(clickX, clickY);
  }

  /**
   * Set slider to popular (low temperature ~0.3)
   */
  async setToPopular(): Promise<void> {
    await this.setValue(0.3);
  }

  /**
   * Set slider to balanced (medium temperature ~0.5)
   */
  async setToBalanced(): Promise<void> {
    await this.setValue(0.5);
  }

  /**
   * Set slider to niche (high temperature ~0.8)
   */
  async setToNiche(): Promise<void> {
    await this.setValue(0.8);
  }

  /**
   * Alternative method: Use keyboard to set value
   */
  async setValueWithKeyboard(value: number): Promise<void> {
    await this.slider.focus();

    // Reset to minimum first
    await this.page.keyboard.press("Home");

    // Calculate steps needed (slider goes from 0.1 to 1.0 in 0.1 steps = 9 steps)
    const steps = Math.round((value - 0.1) / 0.1);

    for (let i = 0; i < steps; i++) {
      await this.page.keyboard.press("ArrowRight");
    }
  }

  // Verification methods
  async expectSliderVisible(): Promise<void> {
    await expect(this.container).toBeVisible();
    await expect(this.slider).toBeVisible();
  }

  async expectDescriptionText(expectedText: string): Promise<void> {
    await expect(this.description).toContainText(expectedText);
  }

  async expectPopularDescription(): Promise<void> {
    await this.expectDescriptionText("Mainstream and well-known tracks");
  }

  async expectBalancedDescription(): Promise<void> {
    await this.expectDescriptionText("Mix of popular and underground tracks");
  }

  async expectNicheDescription(): Promise<void> {
    await this.expectDescriptionText("Obscure and underground tracks");
  }

  async expectLabelContains(text: string): Promise<void> {
    const label = this.container.locator("label");
    await expect(label).toContainText(text);
  }

  async expectTemperatureValue(expectedValue: number): Promise<void> {
    const formattedValue = expectedValue.toFixed(1);
    await this.expectLabelContains(`(${formattedValue})`);
  }
}
