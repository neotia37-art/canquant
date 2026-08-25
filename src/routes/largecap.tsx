import { createFileRoute } from "@tanstack/react-router";
import { CapUniversePage } from "@/components/cap-universe-page";
import { LARGE_CAP } from "@/lib/cap-universes";

export const Route = createFileRoute("/largecap")({
  component: () => <CapUniversePage config={LARGE_CAP} />,
});
