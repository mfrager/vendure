import { Controller, Headers, HttpStatus, Post, Req, Res } from '@nestjs/common';
import {
    LanguageCode,
    Logger,
    Order,
    OrderService,
    RequestContext,
    RequestContextService,
    isGraphQlErrorResult,
} from '../../../core';
//} from '@vendure/core';
import { Request, Response } from 'express';

import { loggerCtx } from './constants';
import { atxpayPaymentMethodHandler } from './atellixpay.handler';
import { AtxpayService } from './atellixpay.service';
import { RequestWithRawBody } from './types';

@Controller('payments')
export class AtxpayController {
    constructor(
        private orderService: OrderService,
        private requestContextService: RequestContextService,
    ) {}

    @Post('atellixpay')
    async webhook(
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<void> {
        let rqdata = request.body;
        try {
            let ev = rqdata.event;
            if (!ev) {
                throw new Error('Invalid event');
            }
            if (ev === 'payment_success') {
                let orderCode = rqdata.order_id;
                if (!orderCode) {
                    throw new Error('Invalid order code');
                }
                const ctx = await this.createContext(request);
                const order = await this.orderService.findOneByCode(ctx, orderCode);
                if (!order) {
                    throw Error(`Unknown order code: ${orderCode}`);
                }
                const payments = await this.orderService.getOrderPayments(ctx, order.id);
                if (payments[0].state !== 'Settled') {
                    const payment = await this.orderService.settlePayment(ctx, payments[0].id);
                    if (isGraphQlErrorResult(payment)) {
                        throw Error('Settlement error');
                    }
                    Logger.info(`AtellixPay Webhook Payment Success For Order: ${orderCode}`, loggerCtx);
                } else {
                    Logger.warn(`AtellixPay Webhook Payment Already Settled For Order: ${orderCode}`, loggerCtx);
                }
            } else {
                throw new Error('Unknown event');
            }
        } catch (e: any) {
            Logger.error(`AtellixPay Webhook Error: ${e.message}`, loggerCtx);
            response.status(HttpStatus.BAD_REQUEST).json({
                'result': 'error',
                'error': 'Request error',
            });
            return;
        }
        response.status(HttpStatus.OK).json({
            'result': 'ok',
        });
    }

    private async createContext(req: Request): Promise<RequestContext> {
        return this.requestContextService.create({
            req: req,
            apiType: 'admin',
            languageCode: LanguageCode.en,
        });
    }
}
