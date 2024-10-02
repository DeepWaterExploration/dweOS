/* Updater */

export interface Release {
    body: string;
    name: string;
    prerelease: boolean;
    published_at: string;
    tag_name: string;
    url: string;
    current: boolean;
    mostRecent: boolean;
}

export interface ReleaseList {
    releases: Release[];
}
