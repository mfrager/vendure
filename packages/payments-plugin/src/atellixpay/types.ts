//import '@vendure/core/dist/entity/custom-entity-fields';
import { Request } from 'express';
import { IncomingMessage } from 'http';

// Note: deep import is necessary here because CustomCustomerFields is also extended in the Braintree
// plugin. Reference: https://github.com/microsoft/TypeScript/issues/46617
/*declare module '@vendure/core/dist/entity/custom-entity-fields' {
    interface CustomCustomerFields {
        atxpayCustomerId?: string;
    }
}*/

/**
 * @description
 * Configuration options for the AtellixPay payments plugin.
 *
 * @docsCategory payments-plugin
 * @docsPage AtxpayPlugin
 */
export interface AtxpayPluginOptions {
    /**
     * @description
     * API key for Atellix.
     */
    apiKey: string;
    host?: string;
}

export interface RequestWithRawBody extends Request {
    rawBody: Buffer;
}
