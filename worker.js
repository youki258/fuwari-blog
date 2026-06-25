export default {
	async fetch(request) {
		const url = new URL(request.url);
		url.hostname = "fuwari-blog-42a.pages.dev";
		return fetch(url.href, request);
	},
};
