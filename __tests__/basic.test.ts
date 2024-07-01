import { ProviderFactory } from '../src/providers/provider_factory';
import { configManager } from '../src/utils/configuration_manager';

describe('ProviderFactory', () => {
  it('should be defined', () => {
    expect(ProviderFactory).toBeDefined();
  });

  it('should have a getProvider method', () => {
    expect(ProviderFactory.getProvider).toBeDefined();
  });
});

describe('ConfigurationManager', () => {
  it('should be defined', () => {
    expect(configManager).toBeDefined();
  });

  it('should have a getConfig method', () => {
    expect(configManager.getConfig).toBeDefined();
  });
});