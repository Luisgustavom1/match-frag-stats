export class PlayerModel {
	id?: number;
	username: string;
	createdAt: Date;

	constructor(params: { id?: number; username: string; createdAt?: Date }) {
		this.id = params.id;
		this.username = params.username;
		this.createdAt = params.createdAt ?? new Date();
	}
}
