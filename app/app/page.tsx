import SearchInput from "@/components/Search";

const wikiExampleUrl = "wikipedia.org/wiki/Albert_Einstein";
const grokExampleUrl = "grokipedia.com/page/Albert_Einstein";
const ualExample = "did:dkg:diffipedia:example:1234";

export default function Home() {
    return (
        <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center max-w-[800px] w-full">
                <h1 className="text-6xl font-crimson font-semibold italic mb-1">Diffipedia</h1>
                <SearchInput />
                <div className="mt-12">
                    <p className="text-sm mb-1 text-white/50">You can search by;</p>
                    <ul className="ml-4 text-sm text-white/30">
                        <li>Article titles (e.g., &quot;Albert Einstein&quot;)</li>
                        <li>
                            Wikipedia URLs (e.g., &quot;
                            <a
                                href={`https://${wikiExampleUrl}`}
                                target="_blank"
                                className="underline"
                            >
                                {wikiExampleUrl}
                            </a>
                            &quot;)
                        </li>
                        <li>
                            Grokipedia URLs (e.g., &quot;
                            <a
                                href={`https://${grokExampleUrl}`}
                                target="_blank"
                                className="underline"
                            >
                                {grokExampleUrl}
                            </a>
                            &quot;)
                        </li>
                        <li>Diffipedia DKG UALs (e.g., &quot;{ualExample}&quot;)</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
