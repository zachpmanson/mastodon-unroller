import { error, type Load } from "@sveltejs/kit";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { URL } from "url";
import type { PostMetadata } from "../../../lib/types";
import fs from "fs";
export const prerender = "auto";

export const load: Load = async ({ params, setHeaders }) => {
	const thread = params.post && (await fetchThread(params.post));
	if (thread) {
		setHeaders({
			"cache-control": "max-age=0, s-maxage=86400"
		});
		return { thread: thread };
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
	console.log(root);
	// write to file
	fs.writeFileSync("root.json", JSON.stringify(root));
	console.log(statuses);
	fs.writeFileSync("statuses.json", JSON.stringify(statuses));
	const fullContext: PostMetadata[] = [];
	const rootMetadata = {
		id: root.id,
		url: root.url,
		content: purify.sanitize(root.content),
		author: root.account.id,
		author_username: root.account.username,
		author_url: root.account.url,
		created_at: root.created_at,
		in_reply_to_account_id: root.in_reply_to_account_id,
		in_reply_to_id: root.in_reply_to_id,
		media_attachments: root.media_attachments
	};

	fullContext.push(rootMetadata);

	for (const reply of statuses.descendants) {
		if (reply.account.id === root.account.id && root.account.id === reply.in_reply_to_account_id) {
			fullContext.push({
				id: reply.id,
				url: reply.url,
				content: purify.sanitize(reply.content),
				author: reply.account.id,
				in_reply_to_id: reply.in_reply_to_id,
				in_reply_to_account_id: reply.in_reply_to_account_id,
				author_username: reply.account.username,
				author_url: reply.account.url,
				created_at: reply.created_at,
				media_attachments: reply.media_attachments
			});
		}
	}

	for (const reply of statuses.ancestors) {
		if (reply.account.id === root.account.id) {
			fullContext.push({
				id: reply.id,
				url: reply.url,
				content: purify.sanitize(reply.content),
				author: reply.account.id,
				in_reply_to_id: reply.in_reply_to_id,
				in_reply_to_account_id: reply.in_reply_to_account_id,
				author_username: reply.account.username,
				author_url: reply.account.url,
				created_at: reply.created_at,
				media_attachments: reply.media_attachments
			});
		}
	}

	const tootDict: { [key: string]: PostMetadata } = {};
	tootDict[root.id] = rootMetadata;

	for (const toot of fullContext) {
		tootDict[toot.id] = toot;
	}

	let longestChain = -1;
	let longestChainIndex = -1;
	const chains = [];
	for (let i = 0; i < Object.keys(tootDict).length; i++) {
		const newChain = [];
		let cursor = tootDict[fullContext[i].id];
		while (true) {
			newChain.push(cursor.id);
			if (!cursor.in_reply_to_id) {
				break;
			}

			cursor = tootDict[cursor.in_reply_to_id];
		}
		chains.push(newChain);

		if (newChain.length > longestChain) {
			longestChain = newChain.length;
			longestChainIndex = i;
		}
	}

	const tootChain: PostMetadata[] = [];
	for (const id of chains[longestChainIndex].reverse()) {
		tootChain.push(tootDict[id]);
	}

	return tootChain;
}
