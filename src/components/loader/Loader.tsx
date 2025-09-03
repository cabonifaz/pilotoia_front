import { Loader2 } from "lucide-react";

export const Loader = () => {
    return (
        <div className="absolute top-0 left-0 w-screen h-screen bg-white/15 backdrop-blur-sm flex items-center justify-center z-[9999]">
            <Loader2 className="h-12 w-12 animate-spin text-[#0B85C3] drop-shadow-sm" />
        </div>
    );
};
