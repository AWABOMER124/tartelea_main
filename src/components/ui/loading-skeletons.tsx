import { Skeleton } from "./skeleton";

export const CardSkeleton = () => (
  <div className="rounded-lg border bg-card p-4 space-y-3">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-1/2" />
  </div>
);

export const PostCardSkeleton = () => (
  <div className="post-card">
    <div className="flex items-start gap-3 mb-3">
      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
    <Skeleton className="h-5 w-4/5 mb-2" />
    <Skeleton className="h-3 w-full mb-1" />
    <Skeleton className="h-3 w-3/5 mb-4" />
    <div className="flex items-center gap-4 pt-3 border-t border-border">
      <Skeleton className="h-8 w-16 rounded-md" />
      <Skeleton className="h-8 w-16 rounded-md" />
      <Skeleton className="h-8 w-8 rounded-md mr-auto" />
    </div>
  </div>
);

export const CourseCardSkeleton = () => (
  <div className="rounded-lg border bg-card overflow-hidden">
    <Skeleton className="h-36 w-full" />
    <div className="p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  </div>
);

export const ListItemSkeleton = () => (
  <div className="flex items-center gap-3 p-3">
    <Skeleton className="h-10 w-10 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  </div>
);

export const PageSkeleton = ({ rows = 3 }: { rows?: number }) => (
  <div className="px-4 py-6 space-y-4">
    <Skeleton className="h-8 w-48 mx-auto" />
    <Skeleton className="h-4 w-64 mx-auto" />
    {Array.from({ length: rows }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

export const ProfileSkeleton = () => (
  <div className="flex flex-col items-center gap-4 p-6">
    <Skeleton className="h-20 w-20 rounded-full" />
    <Skeleton className="h-5 w-32" />
    <Skeleton className="h-4 w-48" />
    <div className="w-full space-y-3 mt-4">
      <CardSkeleton />
      <CardSkeleton />
    </div>
  </div>
);
