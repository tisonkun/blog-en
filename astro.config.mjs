import { defineConfig } from 'astro/config';
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import remarkDirective from "remark-directive";
import remarkCalloutDirectives from '@microflash/remark-callout-directives';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import expressiveCode from "astro-expressive-code";
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers'
import { h } from "hastscript";
import remarkToc from "remark-toc";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";
import { rehypeFigure } from "./src/plugins/rehype-figure.mjs";

const port = 4000;
const isBuild = process.env.npm_lifecycle_script?.includes("astro build");
const baseUrl = isBuild ? 'https://www.tisonkun.io' : `http://localhost:${port}`;

// https://astro.build/config
export default defineConfig({
    server: {
        port: port
    },

    redirects: {
        '/posts/oss-twin': 'https://www.scopedb.io/blog/insight-in-no-time',
    },

    markdown: {
        remarkPlugins: [remarkDirective, [remarkCalloutDirectives, {
            aliases: {
                info: "assert",
                commend: "tip"
            },
            callouts: {
                commend: {
                    title: "Tip"
                },
                assert: {
                    title: "Info"
                }
            }
        }], [remarkToc, { tight: true, ordered: false }]],
        rehypePlugins: [rehypeSlug, rehypeFigure, [rehypeAutolinkHeadings, {
            behavior: 'append',
            content(_node) {
                return [h('i.fa-solid.fa-link.header-link')]
            },
        }]],
    },

    site: baseUrl,

    integrations: [
        sitemap(),
        expressiveCode({
            themes: ['github-light'],
            plugins: [pluginLineNumbers()],
            defaultProps: {
                frame: 'terminal',
                showLineNumbers: true,
                overridesByLang: {
                    'sh,bash,zsh,shell,console,text,plaintext': {
                        showLineNumbers: false,
                    },
                },
            },
            styleOverrides: {
                frames: {
                    frameBoxShadowCssValue: '0 1px 3px rgba(0, 0, 0, 0.06)',
                },
            },
        }),
        mdx(),
    ],

    vite: {
        plugins: [tailwindcss()]
    },

    adapter: cloudflare({
        imageService: "compile"
    })
});
