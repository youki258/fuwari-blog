import { defineCollection } from "astro:content";
import type { CollectionConfig } from "astro/content/config";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

function entrySlugFromPath(entry: string): string {
	return entry.replace(/\\/g, "/").replace(/\/index\.md$/i, "").replace(/\.md$/i, "");
}

const postsSchema = z.object({
	title: z.string(),
	published: z.date(),
	updated: z.date().optional(),
	draft: z.boolean().optional().default(false),
	description: z.string().optional().default(""),
	image: z.string().optional().default(""),
	tags: z.array(z.string()).optional().default([]),
	category: z.string().optional().nullable().default(""),
	lang: z.string().optional().default(""),

	/* For internal use */
	prevTitle: z.string().default(""),
	prevSlug: z.string().default(""),
	nextTitle: z.string().default(""),
	nextSlug: z.string().default(""),
});
const postsCollection: CollectionConfig<typeof postsSchema> = defineCollection({
	loader: glob({
		pattern: "**/*.md",
		base: "./src/content/posts",
		generateId: ({ entry }) => entrySlugFromPath(entry),
	}),
	schema: postsSchema,
});

const specSchema = z.object({});
const specCollection: CollectionConfig<typeof specSchema> = defineCollection({
	loader: glob({
		pattern: "*.md",
		base: "./src/content/spec",
		generateId: ({ entry }) => entrySlugFromPath(entry),
	}),
	schema: specSchema,
});

type Collections = {
	posts: CollectionConfig<typeof postsSchema>;
	spec: CollectionConfig<typeof specSchema>;
};

export const collections: Collections = {
	posts: postsCollection,
	spec: specCollection,
};
