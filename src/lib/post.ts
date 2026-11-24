import { getCollection, type CollectionEntry } from "astro:content";

export async function getListedPosts() {
    const posts = await getAllPosts();
    return posts.filter((entry) => !entry.data.hidden);
}

export async function getAllPosts() {
    const posts = await getCollection('posts');
    return posts.filter((entry) => !entry.data.draft);
}

export function sortPostsByDateDesc(posts: CollectionEntry<"posts">[]) {
    return [...posts].sort(
        (a, b) => b.data.date.getTime() - a.data.date.getTime(),
    );
}

export function countTerms(terms: string[]) {
    const counts = new Map<string, number>();
    for (const term of terms) {
        counts.set(term, (counts.get(term) ?? 0) + 1);
    }
    return [...counts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || b.name.localeCompare(a.name));
}

