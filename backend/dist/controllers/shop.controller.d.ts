import { Request, Response } from 'express';
export declare function placeOrder(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getOrders(req: Request, res: Response): Promise<void>;
export declare function getBalance(req: Request, res: Response): Promise<void>;
export declare function addToCart(req: Request, res: Response): Promise<void>;
export declare function getProducts(req: Request, res: Response): Promise<void>;
export declare function redeemCode(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function submitRecharge(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function submitWithdrawal(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function invest(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getTransactionHistory(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=shop.controller.d.ts.map