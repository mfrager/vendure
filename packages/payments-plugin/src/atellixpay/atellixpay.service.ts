import { Inject, Injectable } from '@nestjs/common';
import { Customer, Logger, Order, TransactionalConnection } from '../../../core';
//import { Customer, Logger, Order, TransactionalConnection } from '@vendure/core';

import { loggerCtx, ATELLIXPAY_PLUGIN_OPTIONS } from './constants';
import { AtxpayPluginOptions } from './types';

import axios from 'axios';

export type CreateOrderResponse = {
    result: string;
    order_uuid?: string;
    checkout_url?: string;
    error?: string;
};

export type VerifyOrderResponse = {
    result: string;
    order_status?: string;
    order_sig?: string;
    error?: string;
};

@Injectable()
export class AtxpayService {
    protected apiKey: string;
    protected host: string;

    constructor(
        private connection: TransactionalConnection,
        @Inject(ATELLIXPAY_PLUGIN_OPTIONS) private options: AtxpayPluginOptions,
    ) {
        this.apiKey = this.options.apiKey;
        this.host = this.options.host ?? 'app.atellix.com';
    }

    async createOrder(amount: string, orderId: string): Promise<CreateOrderResponse | undefined> {
        try {
            const url = 'https://' + this.host + '/api/payment_gateway/v1/order'
            const { data } = await axios.post<CreateOrderResponse>(url, {
                price_total: amount,
                order_id: orderId,
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
                    `AtellixPay error: ${data.error}`,
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
            const url = 'https://' + this.host + '/api/payment_gateway/v1/order'
            const { data } = await axios.post<VerifyOrderResponse>(url, {
                order_uuid: orderId,
            }, {
                auth: { username: 'api', password: this.apiKey },
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
            });
            if (data.result === 'ok') {
                if (data.order_status === 'complete') {
                    return data;
                } else {
                    return undefined;
                }
            } else {
                Logger.warn(
                    `AtellixPay error: ${data.error}`,
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
