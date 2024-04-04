import { redirect } from "@sveltejs/kit";

export const load = async ({ params }) => {
	const { post } = params;
	throw redirect(301, `/thread/${post}`);
};
