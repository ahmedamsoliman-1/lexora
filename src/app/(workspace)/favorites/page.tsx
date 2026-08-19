import { Star } from "lucide-react";

export default function FavoritesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Favorites</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Prompts and blocks you favorite will appear here for quick access.
        </p>
      </header>

      <div className="border-border flex items-center justify-center rounded-xl border border-dashed py-20">
        <div className="text-center">
          <Star className="text-muted-foreground mx-auto h-8 w-8" />
          <p className="mt-3 text-sm font-medium">No favorites yet</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Favorite a prompt or block to pin it here.
          </p>
        </div>
      </div>
    </div>
  );
}
