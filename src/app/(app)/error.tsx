"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center py-12">
      <Card className="max-w-md w-full">
        <CardContent className="py-8 text-center">
          <p className="text-lg font-medium text-gray-900">
            Something went wrong
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {error.message || "An unexpected error occurred."}
          </p>
          <Button className="mt-4" onClick={reset}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
