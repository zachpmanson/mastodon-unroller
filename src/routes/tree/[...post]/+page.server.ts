import type { PostMetadata } from "$lib/types";
import { error, type Load } from "@sveltejs/kit";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { URL } from "url";

export const prerender = "auto";

export const load: Load = async ({ params, setHeaders }) => {
	const tree = params.post && (await fetchThread(params.post));
	if (tree) {
		setHeaders({
			"cache-control": "max-age=0, s-maxage=86400"
		});
		return { tree: tree };
	}

	throw error(404, "Not found");
};

async function fetchThread(posturl: string) {
	const window = new JSDOM("").window;
	const purify = DOMPurify(window);

	const { host, pathname } = new URL(posturl);

	const apiurl = `https://${host}/api/v1/statuses${pathname.substring(pathname.lastIndexOf("/"))}`;

	const [root, statuses] = await Promise.all([
		fetch(apiurl)
			.then((res) => res.json())
			.catch(() => {
				throw error(404);
			}),
		fetch(`${apiurl}/context`)
			.then((res) => res.json())
			.catch(() => {
				throw error(404);
			})
	]);

	const tree: { [key: string]: PostMetadata } = {
		[root.id]: {
			id: root.id,
			url: root.url,
			content: purify.sanitize(root.content),
			author: root.account.id,
			author_username: root.account.username,
			author_url: root.account.url,
			created_at: root.created_at,
			in_reply_to_account_id: root.in_reply_to_account_id,
			in_reply_to_id: root.in_reply_to_id,
			media_attachments: root.media_attachments,
			children: new Set()
		}
	};

	for (let reply of statuses.descendants) {
		if (!reply?.content) continue;

		reply = {
			...reply,
			content: purify.sanitize(reply.content),
			author: reply.account.id,
			author_username: reply.account.username,
			author_url: reply.account.url
		};
		tree[reply.in_reply_to_id] =
			tree[reply.in_reply_to_id] !== undefined
				? tree[reply.in_reply_to_id]
				: { ...reply, children: new Set() };

		if (reply.id) tree[reply.in_reply_to_id].children.add(reply.id as string);
	}

	for (let reply of statuses.ancestors) {
		reply = {
			...reply,
			content: purify.sanitize(reply.content),
			author: reply.account.id,
			author_username: reply.account.username,
			author_url: reply.account.url
		};
		tree[reply.in_reply_to_id] =
			tree[reply.in_reply_to_id] !== undefined
				? tree[reply.in_reply_to_id]
				: { ...reply, children: new Set() };
		if (reply.id) tree[reply.in_reply_to_id].children.add(reply.id as string);
	}
	console.log(Object.keys(tree).map((key) => [key, tree[key].children]));

	return tree;
}
