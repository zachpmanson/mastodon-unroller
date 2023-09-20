export type PostMetadata = {
	id: string;
	url: string;
	content: string;
	author: string;
	in_reply_to_id?: string;
	in_reply_to_account_id?: string;
	author_username: string;
	author_url: string;
	created_at: string;
	media_attachments: any[];
};
