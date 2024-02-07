<script lang="ts">
	import Post from "../../../components/post/Post.svelte";

	export let data;
	let rootId = Object.keys(data.tree)[0];
	let instance = new URL(data.tree[rootId].author_url).host;
	let username = `@${data.tree[rootId].author_username}@${instance}`;
</script>

<svelte:head>
	<title>Thread by {username}</title>
</svelte:head>

<div class="max-w-3xl m-auto mb-8">
	<Post tree={data.tree} id={Object.keys(data.tree)[0]} />
</div>
