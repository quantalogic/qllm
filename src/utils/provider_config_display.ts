import { ProviderConfig } from "../config/provider_config";
import { logger } from "./logger";

export function providerConfigDisplay(providerConfig: ProviderConfig) {
    logger.debug(`🤖 Using provider: ${providerConfig.type}`);
    logger.debug(`🤖 Using model: ${providerConfig.model}`);
    logger.debug(`🤖 Region: ${providerConfig.region}`);
}