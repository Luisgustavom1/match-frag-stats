import { Injectable } from "@nestjs/common";

@Injectable()
export class TestService {
	constructor() {}

	async abc() {
		console.log("aa");
		return;
	}
}
