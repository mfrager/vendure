import {
    CreatePaymentResult,
    CreateRefundResult,
    Logger,
    Injector,
    LanguageCode,
    PaymentMethodHandler,
    SettlePaymentResult,
    SettlePaymentErrorResult,
} from '../../../core';
//} from '@vendure/core';

import { AuthorizeNetService, CreateOrderResponse, VerifyOrderResponse } from './authorizenet.service';
import { loggerCtx } from './constants';

let authorizenetService: AuthorizeNetService;

/**
 * The handler for AuthorizeNet.
 */
export const authorizenetPaymentMethodHandler = new PaymentMethodHandler({
    code: 'authorizenet',

    description: [{ languageCode: LanguageCode.en, value: 'AuthorizeNet' }],

    args: {},

    init(injector: Injector) {
        authorizenetService = injector.get(AuthorizeNetService);
    },

    async createPayment(ctx, order, amount, args, metadata): Promise<CreatePaymentResult> {
        /*if (ctx.apiType !== 'admin') {
            throw Error(`CreatePayment is not allowed for apiType '${ctx.apiType}'`);
        }*/
        if (metadata.paymentId) {
            var paymentId = metadata.paymentId;
            Logger.info(`AuthorizeNet Created Payment: ${paymentId} For Order Code: ${order.code}`, loggerCtx);
            return {
                amount: order.totalWithTax,
                state: 'Authorized' as const,
                transactionId: paymentId,
            };
        } else {
            var amount = order.totalWithTax / 100;
            var amountStr = amount.toFixed(2);
            var orderResp = await authorizenetService.createOrder(amountStr, order.code);
            var orderUuid = orderResp?.payment_uuid;
            Logger.info(`AuthorizeNet Created Order: ${orderUuid} Amount: ${amountStr} From Code: ${order.code}`, loggerCtx);
            return {
                amount: order.totalWithTax,
                state: 'Authorized' as const,
                transactionId: orderUuid,
            };
        }
    },

    async settlePayment(ctx, order, payment, args): Promise<SettlePaymentResult | SettlePaymentErrorResult> {
        if (payment.state === 'Settled') {
            return {
                success: true,
            };
        }
        const resultData = await authorizenetService.verifyOrder(payment.transactionId);
        if (resultData) {
            Logger.info(`AuthorizeNet Verify Success For Order: ${payment.transactionId}`, loggerCtx);
            return {
                success: true,
            };
        } else {
            Logger.warn(`AuthorizeNet Verify Failed For Order: ${payment.transactionId}`, loggerCtx);
            return {
                state: 'Authorized',
                success: false,
            };
        }
    },

    async createRefund(ctx, input, amount, order, payment, args): Promise<CreateRefundResult> {
        return {
            state: 'Failed' as const,
            transactionId: payment.transactionId,
            metadata: {
                message: 'Unsupported',
            },
        };
    },
});
