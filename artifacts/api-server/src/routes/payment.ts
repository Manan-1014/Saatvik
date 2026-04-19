import { Router, type IRouter } from "express";
import { authenticate, type AuthRequest } from "../middlewares/auth";
import * as paymentController from "../controllers/paymentController";

const router: IRouter = Router();

// Authenticated checkout flow
router.post("/payment/create-order", authenticate, (req, res) =>
  paymentController.postCreateOrder(req as AuthRequest, res),
);
router.post("/payment/verify", authenticate, (req, res) => paymentController.postVerify(req as AuthRequest, res));

router.get("/payment/order/:orderId", authenticate, (req, res) =>
  paymentController.getPaymentsForOrder(req as AuthRequest, res),
);

export default router;
