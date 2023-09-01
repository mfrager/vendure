// import { LanguageCode, PluginCommonModule, Type, VendurePlugin } from '@vendure/core';
import { gql } from 'graphql-tag';

import { LanguageCode, PluginCommonModule, Type, VendurePlugin } from '../../../core';

import { AuthorizeNetController } from './authorizenet.controller';
import { authorizenetPaymentMethodHandler } from './authorizenet.handler';
import { AuthorizeNetResolver } from './authorizenet.resolver';
import { AuthorizeNetService } from './authorizenet.service';
import { AUTHORIZENET_PLUGIN_OPTIONS } from './constants';
import { AuthorizeNetPluginOptions } from './types';

@VendurePlugin({
    imports: [PluginCommonModule],
    controllers: [AuthorizeNetController],
    providers: [
        {
            provide: AUTHORIZENET_PLUGIN_OPTIONS,
            useFactory: (): AuthorizeNetPluginOptions => AuthorizeNetPlugin.options,
        },
        AuthorizeNetService,
    ],
    configuration: config => {
        config.paymentOptions.paymentMethodHandlers.push(authorizenetPaymentMethodHandler);
        return config;
    },
    shopApiExtensions: {
        schema: gql`
            extend type Mutation {
                verifyAuthorizeNetOrder(code: String): String
            }
        `,
        resolvers: [AuthorizeNetResolver],
    },
    compatibility: '^2.0.0',
})
export class AuthorizeNetPlugin {
    static options: AuthorizeNetPluginOptions;

    /**
     * @description
     * Initialize the AuthorizeNet payment plugin
     */
    static init(options: AuthorizeNetPluginOptions): Type<AuthorizeNetPlugin> {
        this.options = options;
        return AuthorizeNetPlugin;
    }
}
