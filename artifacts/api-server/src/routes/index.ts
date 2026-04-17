import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import categoriesRouter from "./categories";
import snackCategoriesRouter from "./snackCategories";
import productsRouter from "./products";
import cartRouter from "./cart";
import ordersRouter from "./orders";
import deliveryAreasRouter from "./deliveryAreas";
import settingsRouter from "./settings";
import contactRouter from "./contact";
import galleryRouter from "./gallery";
import dashboardRouter from "./dashboard";
import paymentsRouter from "./payments";
import snacksRouter from "./snacks";
import inventoryRouter from "./inventory";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(categoriesRouter);
router.use(snackCategoriesRouter);
router.use(productsRouter);
router.use(snacksRouter);
router.use(inventoryRouter);
router.use(cartRouter);
router.use(ordersRouter);
router.use(deliveryAreasRouter);
router.use(settingsRouter);
router.use(contactRouter);
router.use(galleryRouter);
router.use(dashboardRouter);
router.use(paymentsRouter);

export default router;
