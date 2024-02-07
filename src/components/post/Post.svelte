<script lang="ts">
	import type { PostMetadata } from "$lib/types";

	export let tree: {
		[key: string]: PostMetadata;
	};
	export let id: string;

	let instance = tree[id]?.author_url && new URL(tree[id].author_url).host;
	let username = tree[id]?.author_url && `@${tree[id].author_username}@${instance}`;

	let expanded = true;
</script>

{#if tree[id]?.content}
	<div class="ml-2 pl-1 pt-1 relative duration-100">
		<div class="text-gray-400 text-xs">
			<span class="text-base hover:underline" on:click={() => (expanded = !expanded)}>[-]</span>
			<a class="text-blue-800 text-base" href={tree[id].author_url}>{username}</a>
			at {new Date(tree[id].created_at).toLocaleString()}
			<a class="font-bold text-gray-400" href={tree[id].url}>permalink</a>
		</div>
		{#if expanded}
			<div class="pb-2">
				{@html tree[id].content}
				{#each tree[id].media_attachments as attachment}
					{#if attachment.type === "image"}
						<div class="text-center my-1">
							<img class="object-contain" src={attachment.url} alt={attachment.description} />
						</div>
					{/if}
				{/each}
			</div>
			<div class="border-solid border-l-2">
				{#each tree[id].children as child}
					<svelte:self {tree} id={child} />
				{/each}
			</div>
		{/if}
	</div>
{/if}
