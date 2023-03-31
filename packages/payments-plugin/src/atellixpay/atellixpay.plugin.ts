// import { LanguageCode, PluginCommonModule, Type, VendurePlugin } from '@vendure/core';
import { gql } from 'graphql-tag';

import { LanguageCode, PluginCommonModule, Type, VendurePlugin } from '../../../core';

import { AtxpayController } from './atellixpay.controller';
import { atxpayPaymentMethodHandler } from './atellixpay.handler';
import { AtxpayResolver } from './atellixpay.resolver';
import { AtxpayService } from './atellixpay.service';
import { ATELLIXPAY_PLUGIN_OPTIONS } from './constants';
import { AtxpayPluginOptions } from './types';

@VendurePlugin({
    imports: [PluginCommonModule],
    controllers: [AtxpayController],
    providers: [
        {
            provide: ATELLIXPAY_PLUGIN_OPTIONS,
            useFactory: (): AtxpayPluginOptions => AtxpayPlugin.options,
        },
        AtxpayService,
    ],
    configuration: config => {
        config.paymentOptions.paymentMethodHandlers.push(atxpayPaymentMethodHandler);
        return config;
    },
    shopApiExtensions: {
        schema: gql`
            extend type Mutation {
                verifyAtellixPayOrder(code: String): String
            }
        `,
        resolvers: [AtxpayResolver],
    },
})
export class AtxpayPlugin {
    static options: AtxpayPluginOptions;

    /**
     * @description
     * Initialize the AtellixPay payment plugin
     */
    static init(options: AtxpayPluginOptions): Type<AtxpayPlugin> {
        this.options = options;
        return AtxpayPlugin;
    }
}
