import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface JobMatch {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  remoteAvailable?: boolean;
  matchScore?: number;
}

interface JobSearchProfile {
  title: string;
  location: string;
  country_code: string;
  keywords: string[];
}

interface ResumeJobMatchesResponse {
  profile?: JobSearchProfile | null;
  jobs: JobMatch[];
}

interface ResumeJobMatchesPanelProps {
  resumeId?: string | null;
  className?: string;
}

const LoadingState = () => (
  <div className="space-y-4">
    {[0, 1, 2].map((index) => (
      <div key={`job-skeleton-${index}`} className="space-y-3 rounded-lg border border-gray-100 p-4">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-8 w-24" />
      </div>
    ))}
  </div>
);

export const ResumeJobMatchesPanel = ({ resumeId, className }: ResumeJobMatchesPanelProps) => {
  const resumeJobsPath = resumeId ? `/api/resumes/${resumeId}/jobs` : null;
  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<ResumeJobMatchesResponse>({
    queryKey: [resumeJobsPath || "resume-jobs-disabled"],
    enabled: Boolean(resumeJobsPath),
  });

  const headerDescription = useMemo(() => {
    if (!data?.profile) return "Job opportunities matching this resume";
    const parts = [data.profile.title, data.profile.location].filter(Boolean);
    return parts.length ? parts.join(" • ") : "Job opportunities matching this resume";
  }, [data?.profile]);

  const renderContent = () => {
    if (!resumeId) {
      return (
        <p className="text-sm text-gray-500">
          Select a resume to explore tailored job opportunities.
        </p>
      );
    }

    if ((isLoading || isFetching) && !data) {
      return <LoadingState />;
    }

    if (isError) {
      return (
        <div className="space-y-3 text-sm text-gray-600">
          <p className="font-medium text-gray-900">We couldn’t load job opportunities. Please try again later.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      );
    }

    if (!data?.jobs?.length) {
      return (
        <p className="text-sm text-gray-500">
          No job opportunities found yet for this resume. Try updating your resume or changing your search filters.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {data.jobs.map((job) => (
          <div key={job.id} className="space-y-3 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-base font-semibold text-gray-900">{job.title}</p>
                <p className="text-sm text-gray-600">
                  {job.company}
                  {job.location ? ` • ${job.location}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {job.remoteAvailable && <Badge variant="secondary">Remote available</Badge>}
                {typeof job.matchScore === "number" && (
                  <Badge variant="outline">Match score: {Math.round(job.matchScore)}</Badge>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {job.description}
            </p>
            <Button asChild size="sm" className="gap-2 w-fit">
              <a href={job.url} target="_blank" rel="noopener noreferrer">
                View job
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className={cn("border border-gray-100 shadow-sm", className)}>
      <CardHeader>
        <CardTitle>Job opportunities matching this resume</CardTitle>
        <CardDescription>{headerDescription}</CardDescription>
        {data?.profile?.keywords?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {data.profile.keywords.slice(0, 8).map((keyword) => (
              <Badge key={keyword} variant="secondary" className="text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
};

