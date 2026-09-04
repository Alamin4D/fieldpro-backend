import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
	type Application,
	type Request,
	type Response,
} from "express";
import httpStatus from "http-status";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import config from "./app/config";
import { notFound } from "./app/middleware/notFound";
import { AuthRoutes } from "./app/module/auth/auth.route";
import { ServiceRoutes } from "./app/module/service/service.route";
import { TechnicianRoutes } from "./app/module/technician/technician.route";
import { AvailabilityRoutes } from "./app/module/availability/availability.route";
import { BookingRoutes } from "./app/module/booking/booking.route";

const app: Application = express();

app.use(
	cors({
		origin: config.frontend_url,
		credentials: true,
	}),
);

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/service", ServiceRoutes);
app.use("/api/v1/technician", TechnicianRoutes);
app.use("/api/v1/availability", AvailabilityRoutes);
app.use("/api/v1/booking", BookingRoutes);

// Basic route
app.get("/", async (req: Request, res: Response) => {
	res.status(httpStatus.OK).json({
		success: true,
		message: "Welcome to Field Service Management",
	});
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
