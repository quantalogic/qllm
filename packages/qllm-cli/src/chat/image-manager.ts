export default class ImageManager {
  private images: Set<string>;

  constructor() {
    this.images = new Set<string>();
  }

  addImage(image: string): void {
    this.images.add(image);
  }

  removeImage(image: string): boolean {
    return this.images.delete(image);
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

  clearImages(): void {
    this.images.clear();
  }
}
