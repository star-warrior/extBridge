export interface IDEAdapter {
  id: string;
  name: string;
  getExtensionsPath(): string;
  isInstalled(): boolean;
}
