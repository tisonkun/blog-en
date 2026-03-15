import { defineCollection } from 'astro:content'
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const postCollection = defineCollection({
    loader: glob({ pattern: '**/*.mdx', base: './src/content/posts' }),
    schema: z.object({
        title: z.string(),
        date: z.date(),
        description: z.optional(z.string()),
        category: z.string(),
        tags: z.array(z.string()),
        hidden: z.boolean().optional(),
        draft: z.boolean().optional(),
    }),
});

export const collections = {
    'posts': postCollection,
};
