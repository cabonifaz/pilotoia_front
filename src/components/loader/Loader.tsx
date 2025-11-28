import { Loader2 } from "lucide-react";

interface LoaderProps {
    text?: string;
    blur?: boolean;
}

export const Loader = ({ text, blur = false }: LoaderProps) => {
    return (
        <div className={`absolute inset-0 flex items-center justify-center z-[9999] ${blur ? 'bg-white/15 backdrop-blur-sm' : ''}`}>
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-[#0B85C3] drop-shadow-sm" />
                {text && <p className="text-lg">{text}</p>}
            </div>
        </div>
    );
};
