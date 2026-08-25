import { createFileRoute } from "@tanstack/react-router";
import { CapUniversePage } from "@/components/cap-universe-page";
import { MID_CAP } from "@/lib/cap-universes";

export const Route = createFileRoute("/midcap")({
  component: () => <CapUniversePage config={MID_CAP} />,
});
