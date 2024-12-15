import { error, type Load } from "@sveltejs/kit";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { URL } from "url";
import type { PostMetadata } from "../../../lib/types";
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

async function fetchThreadPayload(host: string, id: string) {
	console.log("Fetching", id);
	const window = new JSDOM("").window;
	const purify = DOMPurify(window);

	const apiurl = `https://${host}/api/v1/statuses/${id}`;

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
	const fullContext: Record<string, PostMetadata> = {
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
			media_attachments: root.media_attachments
		}
	};

	for (const reply of [...statuses.descendants, ...statuses.ancestors]) {
		if (reply.account.id === root.account.id && root.account.id === reply.in_reply_to_account_id) {
			fullContext[reply.id] = {
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
			};
		}
	}
	console.log(Object.keys(fullContext).length);

	return fullContext;
}

async function fetchThread(posturl: string) {
	const { host, pathname } = new URL(posturl);

	let fullContext = await fetchThreadPayload(
		host,
		pathname.substring(pathname.lastIndexOf("/") + 1)
	);

	let longestChain = -1;
	let longestChainIndex = -1;
	const chains = [];
	for (let [id, baseToot] of Object.entries(fullContext)) {
		const newChain = [];
		let toot = baseToot;
		while (true) {
			console.log(toot.id, !!toot);

			newChain.push(toot.id);
			if (!toot.in_reply_to_id) {
				break;
			}

			if (fullContext[toot.in_reply_to_id] === undefined) {
				// fetch this toot and add it to the context
				fullContext = { ...fullContext, ...(await fetchThreadPayload(host, toot.in_reply_to_id)) };
			}
			toot = fullContext[toot.in_reply_to_id];
		}
		chains.push(newChain);

		if (newChain.length > longestChain) {
			longestChain = newChain.length;
			longestChainIndex = chains.length - 1;
		}
	}

	const tootChain: PostMetadata[] = [];
	for (const id of chains[longestChainIndex].reverse()) {
		tootChain.push(fullContext[id]);
	}
	console.log(tootChain);
	return tootChain;
}
