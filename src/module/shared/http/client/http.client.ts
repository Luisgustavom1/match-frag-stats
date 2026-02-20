import type { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import type { AxiosError } from "axios";
import { catchError, firstValueFrom } from "rxjs";
import { HttpClientException } from "../exception/http-client.exception";

@Injectable()
export class HttpClient {
	constructor(private readonly httpService: HttpService) {}

	async get<T extends Record<string, unknown>>(
		url: string,
		options: Record<string, unknown>,
	): Promise<T> {
		const { data } = await firstValueFrom(
			this.httpService.get<T>(url, options).pipe(
				catchError((error: AxiosError) => {
					throw new HttpClientException(
						`Error fetching data from ${url}: ${error}`,
					);
				}),
			),
		);
		return data;
	}
}
