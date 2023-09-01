import { Inject, Injectable } from '@nestjs/common';
import { Customer, Logger, Order, TransactionalConnection } from '../../../core';
//import { Customer, Logger, Order, TransactionalConnection } from '@vendure/core';

import { loggerCtx, AUTHORIZENET_PLUGIN_OPTIONS } from './constants';
import { AuthorizeNetPluginOptions } from './types';

import axios from 'axios';

export type CreateOrderResponse = {
    result: string;
    payment_uuid?: string;
    error?: string;
};

export type VerifyOrderResponse = {
    result: string;
    payment_status?: string;
    error?: string;
};

@Injectable()
export class AuthorizeNetService {
    protected apiKey: string;
    protected host: string;

    constructor(
        private connection: TransactionalConnection,
        @Inject(AUTHORIZENET_PLUGIN_OPTIONS) private options: AuthorizeNetPluginOptions,
    ) {
        this.apiKey = this.options.apiKey;
        this.host = this.options.host ?? 'app.atellix.com';
    }

    async createOrder(amount: string, orderId: string): Promise<CreateOrderResponse | undefined> {
        try {
            const url = 'https://' + this.host + '/api/payment_card/v1/authorizenet/order'
            const { data } = await axios.post<CreateOrderResponse>(url, {
                amount: amount,
                order_code: orderId,
            }, {
                auth: { username: 'api', password: this.apiKey },
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
            });
            if (data.result === 'ok') {
                return data;
            } else {
                Logger.warn(
                    `AuthorizeNet error: ${data.error}`,
                    loggerCtx,
                );
                return undefined;
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                Logger.warn(
                    `Error message: ${error.message}`,
                    loggerCtx,
                );
                return undefined;
            } else {
                Logger.warn(
                    `Unexpected error: ${error}`,
                    loggerCtx,
                );
                return undefined;
            }
        }
        return undefined;
    }

    async verifyOrder(orderId: string): Promise<VerifyOrderResponse | undefined> {
        try {
            const url = 'https://' + this.host + '/api/payment_card/v1/authorizenet/verify'
            const { data } = await axios.post<VerifyOrderResponse>(url, {
                payment_uuid: orderId,
            }, {
                auth: { username: 'api', password: this.apiKey },
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
            });
            if (data.result === 'ok') {
                if (data.payment_status === 'complete') {
                    return data;
                } else {
                    return undefined;
                }
            } else {
                Logger.warn(
                    `AuthorizeNet error: ${data.error}`,
                    loggerCtx,
                );
                return undefined;
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                Logger.warn(
                    `Error message: ${error.message}`,
                    loggerCtx,
                );
                return undefined;
            } else {
                Logger.warn(
                    `Unexpected error: ${error}`,
                    loggerCtx,
                );
                return undefined;
            }
        }
        return undefined;
    }
}
