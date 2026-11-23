import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import satori from "satori";
import sharp from "sharp";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const SITE_TITLE = "Da Capo";
const SITE_DESCRIPTION = "Async. Distributed Systems. Open Source.";
const SITE_DOMAIN = "tisonkun.io";
const SITE_AUTHOR = "tison";

let cachedFonts = null;

function loadFonts(rootDir) {
    if (cachedFonts) return cachedFonts;
    const newsreaderMedium = fs.readFileSync(
        path.join(
            rootDir,
            "node_modules/@fontsource/newsreader/files/newsreader-latin-500-normal.woff"
        )
    );
    const jetbrainsRegular = fs.readFileSync(
        path.join(
            rootDir,
            "node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff"
        )
    );
    const jetbrainsMedium = fs.readFileSync(
        path.join(
            rootDir,
            "node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff"
        )
    );
    cachedFonts = [
        { name: "Newsreader", data: newsreaderMedium, weight: 500, style: "normal" },
        { name: "JetBrains Mono", data: jetbrainsRegular, weight: 400, style: "normal" },
        { name: "JetBrains Mono", data: jetbrainsMedium, weight: 500, style: "normal" },
    ];
    return cachedFonts;
}

function unquoteYaml(raw) {
    const trimmed = raw.trim();
    if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
}

function parseFrontmatter(content) {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) return null;

    const lines = match[1].split(/\r?\n/);
    const data = { slug: "", title: "", date: "", tags: [], draft: false };
    let inTags = false;

    for (const line of lines) {
        if (inTags) {
            const item = line.match(/^\s+-\s+(.+)$/);
            if (item) {
                data.tags.push(unquoteYaml(item[1]));
                continue;
            }
            if (/^\s*$/.test(line)) continue;
            inTags = false;
        }

        const kv = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
        if (!kv) continue;
        const [, key, rest] = kv;
        if (key === "slug") data.slug = unquoteYaml(rest);
        else if (key === "title") data.title = unquoteYaml(rest);
        else if (key === "date") data.date = unquoteYaml(rest).slice(0, 10);
        else if (key === "draft") data.draft = unquoteYaml(rest) === "true";
        else if (key === "tags") {
            const inline = rest.trim();
            if (inline.startsWith("[") && inline.endsWith("]")) {
                data.tags = inline
                    .slice(1, -1)
                    .split(",")
                    .map((s) => unquoteYaml(s))
                    .filter(Boolean);
            } else {
                inTags = true;
            }
        }
    }

    return data;
}

function collectPosts(rootDir) {
    const postsDir = path.join(rootDir, "src/content/posts");
    if (!fs.existsSync(postsDir)) return [];

    const posts = [];
    for (const entry of fs.readdirSync(postsDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const mdxPath = path.join(postsDir, entry.name, "index.mdx");
        if (!fs.existsSync(mdxPath)) continue;
        const fm = parseFrontmatter(fs.readFileSync(mdxPath, "utf8"));
        if (!fm || fm.draft) continue;
        const slug = fm.slug || entry.name;
        posts.push({
            slug,
            title: fm.title || SITE_TITLE,
            date: fm.date || "",
            tags: fm.tags,
        });
    }
    return posts;
}

function repeatMarkNode(size) {
    return {
        type: "svg",
        props: {
            width: size,
            height: size,
            viewBox: "0 0 64 64",
            fill: "none",
            xmlns: "http://www.w3.org/2000/svg",
            children: [
                {
                    type: "rect",
                    props: { x: 2, y: 2, width: 60, height: 60, rx: 14, fill: "#19191F" },
                },
                {
                    type: "rect",
                    props: { x: 17, y: 16, width: 7.5, height: 32, rx: 1.5, fill: "#FAFAFC" },
                },
                {
                    type: "rect",
                    props: { x: 29, y: 16, width: 3, height: 32, rx: 1.2, fill: "#FAFAFC" },
                },
                {
                    type: "circle",
                    props: { cx: 42.5, cy: 25.5, r: 3.8, fill: "#FAFAFC" },
                },
                {
                    type: "circle",
                    props: { cx: 42.5, cy: 38.5, r: 3.8, fill: "#3B82F6" },
                },
            ],
        },
    };
}

async function renderNodeToPng(node, rootDir) {
    const svg = await satori(node, {
        width: OG_WIDTH,
        height: OG_HEIGHT,
        fonts: loadFonts(rootDir),
    });
    return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

function buildSiteOgNode() {
    return {
        type: "div",
        props: {
            style: {
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                backgroundColor: "#FAFAFC",
                color: "#19191F",
                padding: "76px 88px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
            },
            children: [
                {
                    type: "div",
                    props: {
                        style: {
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            gap: "26px",
                        },
                        children: [
                            {
                                type: "div",
                                props: {
                                    style: {
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "28px",
                                    },
                                    children: [
                                        repeatMarkNode(96),
                                        {
                                            type: "span",
                                            props: {
                                                style: {
                                                    fontFamily: "Newsreader",
                                                    fontSize: "108px",
                                                    fontWeight: 500,
                                                    lineHeight: 1.0,
                                                    letterSpacing: "-0.025em",
                                                    color: "#16161D",
                                                },
                                                children: SITE_TITLE,
                                            },
                                        },
                                    ],
                                },
                            },
                            {
                                type: "div",
                                props: {
                                    style: {
                                        fontFamily: "JetBrains Mono",
                                        fontSize: "27px",
                                        fontWeight: 400,
                                        color: "#5C5C6B",
                                    },
                                    children: SITE_DESCRIPTION,
                                },
                            },
                        ],
                    },
                },
                {
                    type: "div",
                    props: {
                        style: {
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingTop: "28px",
                            borderTop: "1px solid #E6E6EC",
                            fontFamily: "JetBrains Mono",
                            fontSize: "23px",
                            color: "#696974",
                        },
                        children: [
                            { type: "span", props: { children: SITE_AUTHOR } },
                            { type: "span", props: { children: SITE_DOMAIN } },
                        ],
                    },
                },
            ],
        },
    };
}

function buildPostOgNode(post) {
    const title = post.title.replaceAll("'", "’");
    const titleSize = title.length > 62 ? 58 : title.length > 46 ? 66 : 74;
    const displayTags = post.tags.slice(0, 4);

    return {
        type: "div",
        props: {
            style: {
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                backgroundColor: "#FAFAFC",
                color: "#19191F",
                padding: "76px 88px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
            },
            children: [
                {
                    type: "div",
                    props: {
                        style: {
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        },
                        children: [
                            {
                                type: "div",
                                props: {
                                    style: {
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "18px",
                                    },
                                    children: [
                                        repeatMarkNode(54),
                                        {
                                            type: "span",
                                            props: {
                                                style: {
                                                    fontFamily: "Newsreader",
                                                    fontSize: "36px",
                                                    fontWeight: 500,
                                                    letterSpacing: "-0.02em",
                                                    color: "#19191F",
                                                },
                                                children: SITE_TITLE,
                                            },
                                        },
                                    ],
                                },
                            },
                            {
                                type: "span",
                                props: {
                                    style: {
                                        fontFamily: "JetBrains Mono",
                                        fontSize: "23px",
                                        fontWeight: 400,
                                        color: "#696974",
                                        letterSpacing: "0.03em",
                                    },
                                    children: post.date,
                                },
                            },
                        ],
                    },
                },
                {
                    type: "div",
                    props: {
                        style: {
                            fontFamily: "Newsreader",
                            fontSize: `${titleSize}px`,
                            fontWeight: 500,
                            lineHeight: 1.18,
                            letterSpacing: "-0.02em",
                            color: "#16161D",
                            maxWidth: "980px",
                        },
                        children: title,
                    },
                },
                {
                    type: "div",
                    props: {
                        style: {
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingTop: "28px",
                            borderTop: "1px solid #E6E6EC",
                        },
                        children: [
                            {
                                type: "div",
                                props: {
                                    style: {
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "14px",
                                    },
                                    children: displayTags.map((tag) => ({
                                        type: "span",
                                        props: {
                                            style: {
                                                fontFamily: "JetBrains Mono",
                                                fontSize: "20px",
                                                color: "#464654",
                                                backgroundColor: "#FFFFFF",
                                                border: "1px solid #E4E4EC",
                                                borderRadius: "999px",
                                                padding: "6px 16px",
                                            },
                                            children: `#${tag}`,
                                        },
                                    })),
                                },
                            },
                            {
                                type: "span",
                                props: {
                                    style: {
                                        fontFamily: "JetBrains Mono",
                                        fontSize: "23px",
                                        color: "#696974",
                                    },
                                    children: SITE_DOMAIN,
                                },
                            },
                        ],
                    },
                },
            ],
        },
    };
}

export function ogImagesIntegration() {
    let rootDir = process.cwd();

    return {
        name: "og-images",
        hooks: {
            "astro:config:resolved": ({ config }) => {
                rootDir = fileURLToPath(config.root);
            },
            "astro:server:setup": ({ server }) => {
                server.middlewares.use(async (req, res, next) => {
                    const urlPath = (req.url || "").split("?")[0];
                    try {
                        if (urlPath === "/images/og.png") {
                            const png = await renderNodeToPng(buildSiteOgNode(), rootDir);
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "image/png");
                            res.end(png);
                            return;
                        }
                        const postMatch = urlPath.match(/^\/og\/([^/]+)\.png$/);
                        if (postMatch) {
                            const post = collectPosts(rootDir).find(
                                (p) => p.slug === decodeURIComponent(postMatch[1])
                            );
                            if (post) {
                                const png = await renderNodeToPng(buildPostOgNode(post), rootDir);
                                res.statusCode = 200;
                                res.setHeader("Content-Type", "image/png");
                                res.end(png);
                                return;
                            }
                        }
                    } catch (err) {
                        next(err);
                        return;
                    }
                    next();
                });
            },
            "astro:build:done": async ({ dir, logger }) => {
                const outDir = fileURLToPath(dir);
                const imagesDir = path.join(outDir, "images");
                const ogDir = path.join(outDir, "og");
                fs.mkdirSync(imagesDir, { recursive: true });
                fs.mkdirSync(ogDir, { recursive: true });

                const sitePng = await renderNodeToPng(buildSiteOgNode(), rootDir);
                fs.writeFileSync(path.join(imagesDir, "og.png"), sitePng);

                const posts = collectPosts(rootDir);
                await Promise.all(
                    posts.map(async (post) => {
                        const png = await renderNodeToPng(buildPostOgNode(post), rootDir);
                        fs.writeFileSync(path.join(ogDir, `${post.slug}.png`), png);
                    })
                );

                logger.info(`Generated site OG and ${posts.length} post OG images.`);
            },
        },
    };
}
