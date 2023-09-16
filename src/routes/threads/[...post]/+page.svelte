<script>
	export let data;
	let instance = new URL(data.thread[0].author_url).host;
	let username = `@${data.thread[0].author_username}@${instance}`;
</script>

<div class="max-w-xl m-auto">
	<div class="my-2">
		<a href={data.thread[0].author_url}>{username}</a>
		at {new Date(data.thread[0].created_at).toLocaleString()}
	</div>
	{#each data.thread as post, index}
		<div class="relative hover:bg-slate-100 hover:duration-75 px-2">
			{@html post.content}
			<a href={post.url} class="absolute top-0 right-0"
				><svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="grey"
					class="w-6 h-6"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
					/>
				</svg>
			</a>
		</div>
	{/each}
</div>
