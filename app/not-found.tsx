import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/effects/empty-state";

export default function NotFound() {
  return (
    <EmptyState
      title="Page not found"
      description="That page doesn't exist, or the opportunity was deleted."
      action={
        <Button asChild variant="outline">
          <Link href="/">Back to opportunities</Link>
        </Button>
      }
    />
  );
}
