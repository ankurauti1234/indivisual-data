import React from 'react'
import {ReportCard} from "@/components/report-card";

const page = () => {

    const sampleReport = {
      image: "https://i.pinimg.com/736x/c7/6a/d5/c76ad55ac9620a119cc2a3252c29d96a.jpg",
      slug: "q1-performance-report",
      title: "Q1 Performance Report",
      desc: "Comprehensive analysis of our first quarter performance including revenue growth, user acquisition metrics, and product engagement statistics.",
      date: "2025-03-15",
      tags: ["Analytics", "Q1", "Performance", "Revenue"],
    };
  return (
    <div className="h-full flex flex-wrap w-full p-4 gap-4">
      <ReportCard {...sampleReport} />
      <ReportCard {...sampleReport} />
      <ReportCard {...sampleReport} />
      <ReportCard {...sampleReport} />
      <ReportCard {...sampleReport} />
      <ReportCard {...sampleReport} />
      <ReportCard {...sampleReport} />
    </div>
  );
}

export default page