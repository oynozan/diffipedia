import Link from "next/link";
import { ExternalLink } from "lucide-react";

export default function Header() {
    return (
        <header className="relative z-10 h-8 flex items-center px-2 bg-gray20 w-full border-b border-border">
            <h2 className="text-sm font-crimson font-semibold italic text-white/80">Diffipedia</h2>
            <div className="flex-1 flex items-center justify-end text-sm text-white/50 gap-4">
                <Link href="/about" className="font-ubuntu">
                    About
                </Link>
                <Link href="/" className="font-ubuntu">
                    Search
                </Link>
                <a href="" className="font-ubuntu" target="_blank">
                    API <ExternalLink className="inline-block mb-0.5 ml-0.5" size={12} />
                </a>
            </div>
        </header>
    );
}
