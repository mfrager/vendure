import { Args, Mutation, Resolver } from '@nestjs/graphql';

import {
    ActiveOrderService,
    Allow,
    Ctx,
    Logger,
    OrderService,
    Permission,
    RequestContext,
} from '../../../core';

import { AtxpayService } from './atellixpay.service';
import { loggerCtx } from './constants';
// import { Logger, OrderService, ActiveOrderService, Allow, Ctx, Permission, RequestContext } from '@vendure/core';

@Resolver()
export class AtxpayResolver {
    constructor(
        private atxpayService: AtxpayService,
        private activeOrderService: ActiveOrderService,
        private orderService: OrderService,
    ) {}

    @Mutation()
    @Allow(Permission.Owner)
    async verifyAtellixPayOrder(@Ctx() ctx: RequestContext, @Args() args: any): Promise<string | undefined> {
        if (ctx.authorizedAsOwnerOnly) {
            // const sessionOrder = await this.activeOrderService.getOrderFromContext(ctx);
            const sessionOrder = await this.orderService.findOneByCode(ctx, args.code);
            if (sessionOrder) {
                Logger.warn(`Order ${sessionOrder.id}`, loggerCtx);
                const payments = await this.orderService.getOrderPayments(ctx, sessionOrder.id);
                const verified = await this.atxpayService.verifyOrder(ctx, payments[0].transactionId);
                if (verified) {
                    this.orderService.settlePayment(ctx, payments[0].id);
                    return 'complete';
                } else {
                    return 'pending';
                }
            } else {
                Logger.warn(`Order not found ${args.code}`, loggerCtx);
            }
        } else {
            Logger.warn(`Not authorized as owner`, loggerCtx);
        }
        return 'error';
    }
}
