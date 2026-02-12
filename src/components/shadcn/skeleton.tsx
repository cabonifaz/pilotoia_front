import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // Cambiamos bg-muted por bg-gray-200 (y un gris oscuro para modo noche)
        "animate-pulse rounded-md bg-gray-100 dark:bg-gray-200",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
