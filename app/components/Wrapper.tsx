import { Toaster } from "@/components/ui/sonner";

export default function Wrapper({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <Toaster />
            {children}
        </>
    );
}
