import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const cases = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cases' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      type: z.enum(['ecommerce', 'corporate', 'catalog', 'landing', 'service', 'pet']),
      company: z.string().optional(),
      role: z.string().optional(),
      year: z.number().int().optional(),
      url: z.string().optional(),
      source: z.string().optional(),
      repo: z.string().optional(),
      cover: image(),
      tags: z.array(z.string()).default([]),
      order: z.number().default(1000),
      draft: z.boolean().default(false),
    }),
});

export const collections = { cases };
