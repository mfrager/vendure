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

import { AtxpayService, VerifyOrderResponse } from './atellixpay.service';
import { loggerCtx } from './constants';

let atxpayService: AtxpayService;

/**
 * The handler for AtellixPay.
 */
export const atxpayPaymentMethodHandler = new PaymentMethodHandler({
    code: 'atellixpay',

    description: [{ languageCode: LanguageCode.en, value: 'AtellixPay' }],

    args: {},

    init(injector: Injector) {
        atxpayService = injector.get(AtxpayService);
    },

    async createPayment(ctx, order, amount, args, metadata): Promise<CreatePaymentResult> {
        /*if (ctx.apiType !== 'admin') {
            throw Error(`CreatePayment is not allowed for apiType '${ctx.apiType}'`);
        }*/
        var amount = order.totalWithTax / 100;
        var amountStr = amount.toFixed(2);
        var orderUuid = await atxpayService.createOrder(amountStr, order.code);
        Logger.info(`AtellixPay Created Order: ${orderUuid} Amount: ${amountStr} From Code: ${order.code}`, loggerCtx);
        return {
            amount: order.totalWithTax,
            state: 'Authorized' as const,
            transactionId: orderUuid,
        };
    },

    async settlePayment(ctx, order, payment, args): Promise<SettlePaymentResult | SettlePaymentErrorResult> {
        if (payment.state === 'Settled') {
            return {
                success: true,
            };
        }
        const resultData = await atxpayService.verifyOrder(payment.transactionId);
        if (resultData) {
            Logger.info(`AtellixPay Verify Success For Order: ${payment.transactionId}`, loggerCtx);
            return {
                success: true,
                metadata: {
                    'order_sig': resultData.order_sig,
                },
            };
        } else {
            Logger.warn(`AtellixPay Verify Failed For Order: ${payment.transactionId}`, loggerCtx);
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
