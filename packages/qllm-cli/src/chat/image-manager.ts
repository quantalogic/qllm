// packages/qllm-cli/src/chat/image-manager.ts

import { utils } from "./utils";
import { ioManager } from "../utils/io-manager";

export class ImageManager {
  private images: Set<string>;

  constructor() {
    this.images = new Set<string>();
  }

  hasImages(): boolean {
    return this.images.size > 0;
  }

  addImage(image: string): void {
    if (utils.isValidUrl(image) || utils.isImageFile(image)) {
      this.images.add(image);
      ioManager.displaySuccess(`Image added: ${utils.truncateString(image, 50)}`);
    } else {
      ioManager.displayError("Invalid image URL or file path");
    }
  }

  removeImage(image: string): boolean {
    const removed = this.images.delete(image);
    if (removed) {
      ioManager.displaySuccess(`Image removed: ${utils.truncateString(image, 50)}`);
    } else {
      ioManager.displayWarning(`Image not found: ${utils.truncateString(image, 50)}`);
    }
    return removed;
  }

  hasImage(image: string): boolean {
    return this.images.has(image);
  }

  getImages(): string[] {
    return Array.from(this.images);
  }

  getImageCount(): number {
    return this.images.size;
  }

  clearImages(showOutput: boolean = true): void {
    const count = this.images.size;
    this.images.clear();
    ioManager.displaySuccess(
      `Cleared ${count} image${count !== 1 ? "s" : ""} from the buffer`
    );
  }

  displayImages(): void {
    if (this.images.size === 0) {
      ioManager.displayInfo("No images in the buffer");
      return;
    }

    ioManager.displayInfo(`Images in the buffer (${this.images.size}):`);
    this.getImages().forEach((image, index) => {
      ioManager.displayInfo(`${index + 1}. ${utils.truncateString(image, 70)}`);
    });
  }
}

export default ImageManager;
