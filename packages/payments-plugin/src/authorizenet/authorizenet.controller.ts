import { Controller, Headers, HttpStatus, Post, Req, Res } from '@nestjs/common';
import {
    LanguageCode,
    Logger,
    Order,
    OrderService,
    PaymentMethod,
    RequestContext,
    RequestContextService,
    TransactionalConnection,
    InternalServerError,
    isGraphQlErrorResult,
} from '../../../core';
//} from '@vendure/core';
import { OrderStateTransitionError } from '@vendure/core/dist/common/error/generated-graphql-shop-errors';
import { Request, Response } from 'express';

import { loggerCtx } from './constants';
import { authorizenetPaymentMethodHandler } from './authorizenet.handler';
import { AuthorizeNetService } from './authorizenet.service';
import { RequestWithRawBody } from './types';

import axios from 'axios';

@Controller('payments')
export class AuthorizeNetController {
    constructor(
        private connection: TransactionalConnection,
        private orderService: OrderService,
        private requestContextService: RequestContextService,
        private authorizeNetService: AuthorizeNetService,
    ) {}

    @Post('authorizenet')
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
            if (ev === 'payment_request') {
                var orderResp = await this.authorizeNetService.createOrder(rqdata['amount'], rqdata['order_id']);
                response.status(HttpStatus.OK).json(orderResp);
                return;
            } else if (ev === 'payment_success') {
                let orderCode = rqdata['order_id'];
                if (!orderCode) {
                    throw new Error('Invalid order code');
                }
                const ctx = await this.createContext(request);
                const order = await this.orderService.findOneByCode(ctx, orderCode);
                if (!order) {
                    throw Error(`Unknown order code: ${orderCode}`);
                }
                var payments = await this.orderService.getOrderPayments(ctx, order.id);
                if (payments.length === 0) {
                    //Logger.info(`AuthorizeNet Webhook Create Payment For Order: ${orderCode}`, loggerCtx);
                    if (order.state !== 'ArrangingPayment') {
                        const transitionToStateResult = await this.orderService.transitionToState(ctx, order.id, 'ArrangingPayment');
                        if (transitionToStateResult instanceof OrderStateTransitionError) {
                            Logger.error(`Error transitioning order ${orderCode} to ArrangingPayment state: ${transitionToStateResult.message}`, loggerCtx);
                            return;
                        }
                    }
                    const paymentId = rqdata['order_uuid'];
                    const paymentMethod = await this.getPaymentMethod(ctx);
                    const addPaymentToOrderResult = await this.orderService.addPaymentToOrder(ctx, order.id, {
                        method: paymentMethod.code,
                        metadata: {
                            paymentId: paymentId,
                        },
                    });
                    if (!(addPaymentToOrderResult instanceof Order)) {
                        Logger.error(`Error adding payment to order ${orderCode}: ${addPaymentToOrderResult.message}`, loggerCtx);
                        return;
                    }
                    payments = await this.orderService.getOrderPayments(ctx, order.id);
                    const payment = await this.orderService.settlePayment(ctx, payments[0].id);
                    if (isGraphQlErrorResult(payment)) {
                        throw Error('Settlement error');
                    }
                    Logger.info(`AuthorizeNet Webhook Payment Success: ${paymentId} For Order: ${orderCode}`, loggerCtx);
                } else {
                    if (payments[0].state !== 'Settled') {
                        const payment = await this.orderService.settlePayment(ctx, payments[0].id);
                        if (isGraphQlErrorResult(payment)) {
                            throw Error('Settlement error');
                        }
                        Logger.info(`AuthorizeNet Webhook Payment Success For Order: ${orderCode}`, loggerCtx);
                    } else {
                        Logger.warn(`AuthorizeNet Webhook Payment Already Settled For Order: ${orderCode}`, loggerCtx);
                    }
                }
            } else {
                throw new Error('Unknown event');
            }
        } catch (e: any) {
            Logger.error(`AuthorizeNet Webhook Error: ${e.message}`, loggerCtx);
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

    private async getPaymentMethod(ctx: RequestContext): Promise<PaymentMethod> {
        const method = (await this.connection.getRepository(ctx, PaymentMethod).find()).find(
            m => m.handler.code === authorizenetPaymentMethodHandler.code,
        );
        if (!method) {
            throw new InternalServerError(`[${loggerCtx}] Could not find AuthorizeNet PaymentMethod`);
        }
        return method;
    }
}
