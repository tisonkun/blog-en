function normalizeCssLength(raw) {
    const val = raw.trim();
    if (/^\d+(?:\.\d+)?$/.test(val)) {
        return `${val}px`;
    }
    if (/^\d+(?:\.\d+)?(?:px|%|rem|em|vw|vh|ch)$/i.test(val)) {
        return val;
    }
    return null;
}

function parseSizeTokens(spec) {
    const tokens = spec
        .split(/[\s;]+/)
        .map((t) => t.trim())
        .filter(Boolean);
    if (tokens.length === 0) {
        return null;
    }

    let width = null;
    let height = null;

    for (const token of tokens) {
        const wMatch = token.match(/^(?:w|width|max-w|max-width)=(.+)$/i);
        if (wMatch) {
            const len = normalizeCssLength(wMatch[1]);
            if (!len) return null;
            width = len;
            continue;
        }

        const hMatch = token.match(/^(?:h|height|max-h|max-height)=(.+)$/i);
        if (hMatch) {
            const len = normalizeCssLength(hMatch[1]);
            if (!len) return null;
            height = len;
            continue;
        }

        const bare = normalizeCssLength(token);
        if (bare) {
            width = bare;
            continue;
        }

        return null;
    }

    return { width, height };
}

function isStandaloneImageParagraph(node) {
    if (node?.type !== "element" || node.tagName !== "p" || !Array.isArray(node.children)) {
        return null;
    }
    const meaningful = node.children.filter(
        (child) => !(child.type === "text" && /^\s*$/.test(child.value ?? "")),
    );
    if (meaningful.length !== 1) {
        return null;
    }
    const only = meaningful[0];
    if (only.type === "element" && only.tagName === "img" && only.properties?.src) {
        return only;
    }
    return null;
}

function buildFigcaption(altText) {
    const trimmed = altText.trim();
    if (!trimmed) {
        return null;
    }
    const child = /^https?:\/\/\S+$/.test(trimmed)
        ? {
              type: "element",
              tagName: "a",
              properties: {
                  className: ["post-figcaption-link"],
                  href: trimmed,
                  target: "_blank",
                  rel: ["noopener", "noreferrer"],
              },
              children: [{ type: "text", value: trimmed }],
          }
        : { type: "text", value: trimmed };

    return {
        type: "element",
        tagName: "figcaption",
        properties: { className: ["post-figcaption"] },
        children: [child],
    };
}

function transformNode(node) {
    if (!Array.isArray(node?.children)) {
        return;
    }

    for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const imgNode = isStandaloneImageParagraph(child);
        if (imgNode) {
            const props = imgNode.properties ?? (imgNode.properties = {});
            let alt = typeof props.alt === "string" ? props.alt : "";
            let width = null;
            let height = null;

            // Parse optional Obsidian-style pipe suffix first (e.g. ![Caption|480](./img.png)).
            const pipeMatch = alt.match(/^(.*?)\|([^|]+)$/);
            if (pipeMatch) {
                const parsedPipe = parseSizeTokens(pipeMatch[2]);
                if (parsedPipe) {
                    alt = pipeMatch[1].trim();
                    width = parsedPipe.width ?? width;
                    height = parsedPipe.height ?? height;
                }
            }

            // Parse CommonMark title attribute (e.g. ![Caption](./img.png "w=480")).
            if (typeof props.title === "string" && props.title.trim()) {
                const parsedTitle = parseSizeTokens(props.title);
                if (parsedTitle) {
                    width = parsedTitle.width ?? width;
                    height = parsedTitle.height ?? height;
                    delete props.title;
                }
            }

            props.alt = alt;
            props["data-zoomable"] = "true";

            const styleParts = [];
            if (width) styleParts.push(`--img-max-w: ${width}`);
            if (height) styleParts.push(`--img-max-h: ${height}`);

            const figureChildren = [imgNode];
            const figcaption = buildFigcaption(alt);
            if (figcaption) {
                figureChildren.push(figcaption);
            }

            node.children[i] = {
                type: "element",
                tagName: "figure",
                properties: {
                    className: ["post-figure"],
                    ...(styleParts.length > 0 ? { style: styleParts.join("; ") } : {}),
                },
                children: figureChildren,
            };
            continue;
        }

        transformNode(child);
    }
}

export function rehypeFigure() {
    return (tree) => {
        transformNode(tree);
    };
}
