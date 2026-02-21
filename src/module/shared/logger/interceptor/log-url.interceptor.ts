import { Injectable } from "@nestjs/common";
import { AppLogger } from "../service/app-logger.service";

@Injectable()
export class LogUrlMethodInterceptor {
	constructor(private readonly logger: AppLogger) {}

	intercept(context: any, next: any) {
		const request = context.switchToHttp().getRequest();
		const { method, url } = request;
		this.logger.log(`Incoming request: ${method} ${url}`);
		return next.handle();
	}
}
