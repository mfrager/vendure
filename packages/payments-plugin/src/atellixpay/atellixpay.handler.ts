import {
    CreatePaymentResult,
    CreateRefundResult,
    Injector,
    LanguageCode,
    PaymentMethodHandler,
    SettlePaymentResult,
} from '../../../core';
//} from '@vendure/core';

import { AtxpayService } from './atellixpay.service';

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
        return {
            amount: order.totalWithTax,
            state: 'Authorized' as const,
            transactionId: orderUuid,
        };
    },

    async settlePayment(ctx, order, payment, args): Promise<SettlePaymentResult> {
        //const verified = await atxpayService.verfiyOrder(payment.transactionId)
        return {
            success: true,
        };
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
