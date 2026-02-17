import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

// TableWithPaginationSkeleton.tsx
export const TableWithPaginationSkeleton = ({
  pageSize = 10,
  columnCount = 5,
}) => {
  return (
    // Agregamos z-index y fondo para que cubra la tabla vieja si es necesario
    <div className="flex flex-col gap-4 animate-in fade-in duration-300 bg-white w-full h-full">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              {Array.from({ length: columnCount }).map((_, i) => (
                <TableHead
                  key={`h-sk-${i}`}
                  className={i > 2 ? "hidden md:table-cell" : ""}
                >
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: pageSize }).map((_, i) => (
              <TableRow key={`row-sk-${i}`}>
                {Array.from({ length: columnCount }).map((_, j) => (
                  <TableCell
                    key={`cell-sk-${i}-${j}`}
                    className={`py-3 ${j > 2 ? "hidden md:table-cell" : ""}`}
                  >
                    <Skeleton
                      className={`h-4 ${j === 0 ? "w-8" : "w-full"} opacity-60`}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col items-center gap-3 mt-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 hidden md:block" />
          <div className="flex gap-1">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
          </div>
          <Skeleton className="h-9 w-24 hidden md:block" />
        </div>
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
};

export default TableWithPaginationSkeleton;
