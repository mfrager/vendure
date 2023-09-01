import { Args, Mutation, Resolver } from '@nestjs/graphql';

import {
    ActiveOrderService,
    Allow,
    Ctx,
    Logger,
    OrderService,
    Permission,
    RequestContext,
    isGraphQlErrorResult,
} from '../../../core';

import { AuthorizeNetService } from './authorizenet.service';
import { loggerCtx } from './constants';
// import { Logger, OrderService, ActiveOrderService, Allow, Ctx, Permission, RequestContext } from '@vendure/core';

@Resolver()
export class AuthorizeNetResolver {
    constructor(
        private authorizenetService: AuthorizeNetService,
        private activeOrderService: ActiveOrderService,
        private orderService: OrderService,
    ) {}

    @Mutation()
    @Allow(Permission.Owner)
    async verifyAuthorizeNetOrder(@Ctx() ctx: RequestContext, @Args() args: any): Promise<string | undefined> {
        if (ctx.authorizedAsOwnerOnly) {
            // const order = await this.activeOrderService.getOrderFromContext(ctx);
            const order = await this.orderService.findOneByCode(ctx, args.code);
            if (order) {
                const payments = await this.orderService.getOrderPayments(ctx, order.id);
                if (payments[0].state === 'Settled') {
                    return `Payment state: ${payments[0].state}`;
                }
                const payment = await this.orderService.settlePayment(ctx, payments[0].id);
                if (!isGraphQlErrorResult(payment)) {
                    return `Payment state: ${payment.state}`;
                } else {
                    return 'Settlement error';
                }
            } else {
                Logger.warn(`Order not found ${args.code}`, loggerCtx);
                return 'Order not found';
            }
        } else {
            Logger.warn(`Not authorized as owner`, loggerCtx);
            return 'Not authorized as owner';
        }
    }
}
