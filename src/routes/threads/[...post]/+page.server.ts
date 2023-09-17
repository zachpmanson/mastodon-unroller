import { error } from "@sveltejs/kit";
import { URL } from "url";
import type { PostMetadata } from "./types";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

export const prerender = true;

export async function load({ params }: { params: { post: string } }) {
	const thread = await fetchThread(params.post);
	if (thread) {
		return { thread: thread };
	}

	throw error(404, "Not found");
}

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

	const descendants: PostMetadata[] = [];
	for (const reply of statuses.descendants) {
		if (reply.account.id === root.account.id && root.account.id === reply.in_reply_to_account_id) {
			descendants.push({
				id: reply.id,
				url: reply.url,
				content: purify.sanitize(reply.content),
				author: reply.account.id,
				in_reply_to_id: reply.in_reply_to_id,
				in_reply_to_account_id: reply.in_reply_to_account_id,
				author_username: reply.account.username,
				author_url: reply.account.url,
				created_at: reply.created_at
			});
		}
	}

	for (const reply of statuses.ancestors) {
		if (reply.account.id === root.account.id) {
			descendants.push({
				id: reply.id,
				url: reply.url,
				content: purify.sanitize(reply.content),
				author: reply.account.id,
				in_reply_to_id: reply.in_reply_to_id,
				in_reply_to_account_id: reply.in_reply_to_account_id,
				author_username: reply.account.username,
				author_url: reply.account.url,
				created_at: reply.created_at
			});
		}
	}

	const tootDict: { [key: string]: PostMetadata } = {};
	tootDict[root.id] = {
		id: root.id,
		url: root.url,
		content: purify.sanitize(root.content),
		author: root.account.id,
		author_username: root.account.username,
		author_url: root.account.url,
		created_at: root.created_at,
		in_reply_to_account_id: root.in_reply_to_account_id,
		in_reply_to_id: root.in_reply_to_id
	};

	for (const toot of descendants) {
		tootDict[toot.id] = toot;
	}

	let longestChain = -1;
	let longestChainIndex = -1;
	const chains = [];

	for (let i = 0; i < descendants.length; i++) {
		const newChain = [];
		let cursor = tootDict[descendants[i].id];
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
