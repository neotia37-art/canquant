import { createFileRoute } from "@tanstack/react-router";
import { CapUniversePage } from "@/components/cap-universe-page";
import { SMALL_CAP } from "@/lib/cap-universes";

export const Route = createFileRoute("/watchlist")({
  component: () => <CapUniversePage config={SMALL_CAP} />,
});
