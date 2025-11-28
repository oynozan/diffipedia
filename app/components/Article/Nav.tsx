import { Github } from "lucide-react";

import SearchInput from "../Search";

import "./nav.scss";

export default function ArticlesNav() {
    return (
        <nav
            id="articles-nav"
            className="flex items-center justify-between h-10 px-2 border-b border-border bg-black/5"
        >
            <div className="w-3/4"></div>
            <div className="flex gap-2 w-1/4">
                <div className="flex gap-1 items-center">
                    <a
                        href="https://github.com/oynozan/diffipedia"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center p-1 rounded-full transition-colors hover:bg-white hover:text-black"
                    >
                        <Github size={12} />
                    </a>
                </div>
                <SearchInput />
            </div>
        </nav>
    );
}
