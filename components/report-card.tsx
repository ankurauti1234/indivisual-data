import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { CalendarIcon, LinkIcon, FileTextIcon } from 'lucide-react';

// Define the props interface for the component
interface ReportCardProps {
  image?: string;
  slug: string;
  title: string;
  desc: string;
  date: string;
  tags: string[];
}

export const ReportCard = ({
  image = "https://i.pinimg.com/736x/c7/6a/d5/c76ad55ac9620a119cc2a3252c29d96a.jpg",
  slug,
  title,
  desc,
  date,
  tags = [],
}: ReportCardProps) => {
  // Format the date to be more GitHub-like
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card className="w-full max-w-md p-0 overflow-hidden gap-0 h-fit">
      <CardHeader className="p-0">
        {image && (
          <div className="w-full h-64 overflow-hidden">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold text-lg text-primary hover:underline">
            <a href={`/reports/${slug}`}>{title}</a>
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-2">{desc}</p>
        </div>
      </CardContent>
      <CardFooter className="border-t flex flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Badge
              key={index}
              variant="outline"
              className="bg-accent text-primary "
            >
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <CalendarIcon size={14} />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <LinkIcon size={14} />
            <a
              href={`/reports/${slug}`}
              className="text-primary hover:underline"
            >
              View Report
            </a>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};
