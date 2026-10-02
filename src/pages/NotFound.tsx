import { Link } from "react-router-dom";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#0c0d0e] text-zinc-100">
      <div className="max-w-md w-full text-center space-y-4 bg-[#131518] border border-[#23262c] p-8 rounded-2xl shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center mx-auto text-zinc-400">
          <FileQuestion className="w-7 h-7" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Page Not Found</h1>
          <p className="text-xs text-zinc-400">
            The page you are looking for does not exist.
          </p>
        </div>

        <Button asChild variant="default" size="default" className="mt-2">
          <Link to="/" className="inline-flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Return to Home
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
