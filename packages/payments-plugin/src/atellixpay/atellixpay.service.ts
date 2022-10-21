import { Inject, Injectable } from '@nestjs/common';
import { Customer, Logger, Order, TransactionalConnection } from '../../../core';
//import { Customer, Logger, Order, TransactionalConnection } from '@vendure/core';

import { loggerCtx, ATELLIXPAY_PLUGIN_OPTIONS } from './constants';
import { AtxpayPluginOptions } from './types';

import axios from 'axios';

type CreateOrderResponse = {
    result: string;
    order_uuid?: string;
    checkout_url?: string;
    error?: string;
};

type VerifyOrderResponse = {
    result: string;
    order_status?: string;
    order_sig?: string;
    error?: string;
};

@Injectable()
export class AtxpayService {
    protected apiKey: string;

    constructor(
        private connection: TransactionalConnection,
        @Inject(ATELLIXPAY_PLUGIN_OPTIONS) private options: AtxpayPluginOptions,
    ) {
        this.apiKey = this.options.apiKey;
    }

    async createOrder(amount: string, orderId: string): Promise<string | undefined> {
        try {
            const { data } = await axios.post<CreateOrderResponse>('https://atx2.atellix.net/api/payment_gateway/v1/order', {
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
                return data.order_uuid;
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
