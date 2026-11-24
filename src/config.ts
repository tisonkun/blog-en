export const Site = {
    url: new URL(import.meta.env.SITE),
    baseUrl: new URL(import.meta.env.SITE).origin,

    title: "Da Capo",
    description: "Async. Distributed Systems. Open Source.",

    menu: {
        navs: [
            { name: "Home", url: "/" },
            { name: "Categories", url: "/categories" },
            { name: "Tags", url: "/tags" },
            { name: "About", url: "/about" },
        ],
    }
}

export const Social = {
    publicName: "@tison",
    twitterId: "@tison1096",
}
