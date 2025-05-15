"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { format, parse, addDays, subDays } from "date-fns";

interface EPGData {
  _id: string;
  date: string;
  channel: string;
  start: string;
  end: string;
  title: string;
  description?: string;
}

const EPGPage: React.FC = () => {
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState<string>("07:00");
  const [endTime, setEndTime] = useState<string>("08:00");
  const [channels, setChannels] = useState<string[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [epgData, setEpgData] = useState<EPGData[]>([]);
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Fetch channels
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await axios.get("/api/radio-data/channels");
        setChannels(response.data.data);
      } catch (error) {
        console.error("Error fetching channels:", error);
      }
    };
    fetchChannels();
  }, []);

  // Fetch available dates
  useEffect(() => {
    const fetchDates = async () => {
      try {
        const response = await axios.get("/api/radio-data/dates");
        setAvailableDates(response.data.data);
      } catch (error) {
        console.error("Error fetching dates:", error);
      }
    };
    fetchDates();
  }, []);

  // Fetch EPG data
  const fetchEPGData = async (reset: boolean = false) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/radio-data/epg/${date}`, {
        params: {
          page: reset ? 1 : page,
          limit: 10,
          startTime,
          endTime,
          channel: selectedChannel || undefined,
        },
      });
      setEpgData((prev) =>
        reset ? response.data.data : [...prev, ...response.data.data]
      );
      setTotal(response.data.total);
      if (reset) setPage(1);
    } catch (error) {
      console.error("Error fetching EPG data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch EPG data on date, time, or channel change
  useEffect(() => {
    fetchEPGData(true);
  }, [date, startTime, endTime, selectedChannel]);

  // Lazy load more data on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && epgData.length < total) {
          setPage((prev) => prev + 1);
          fetchEPGData();
        }
      },
      { threshold: 0.1 }
    );

    if (timelineRef.current) {
      observer.observe(timelineRef.current);
    }

    return () => {
      if (timelineRef.current) {
        observer.unobserve(timelineRef.current);
      }
    };
  }, [loading, epgData, total]);

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  };

  // Handle previous/next date
  const handleDateShift = (direction: "prev" | "next") => {
    const currentDate = parse(date, "yyyy-MM-dd", new Date());
    const newDate =
      direction === "prev" ? subDays(currentDate, 1) : addDays(currentDate, 1);
    setDate(format(newDate, "yyyy-MM-dd"));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Electronic Program Guide</h1>

      {/* Date Selector */}
      <div className="mb-4 flex items-center space-x-2">
        <button
          onClick={() => handleDateShift("prev")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Previous
        </button>
        <input
          type="date"
          value={date}
          onChange={handleDateChange}
          className="p-2 border rounded"
        />
        <button
          onClick={() => handleDateShift("next")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Next
        </button>
      </div>

      {/* Time Range Selector */}
      <div className="mb-4 flex space-x-4">
        <div>
          <label className="block mb-1">Start Time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1">End Time</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="p-2 border rounded"
          />
        </div>
      </div>

      {/* Channel Selector */}
      <div className="mb-4">
        <label className="block mb-1">Channel</label>
        <select
          value={selectedChannel}
          onChange={(e) => setSelectedChannel(e.target.value)}
          className="p-2 border rounded w-full"
        >
          <option value="">All Channels</option>
          {channels.map((channel) => (
            <option key={channel} value={channel}>
              {channel}
            </option>
          ))}
        </select>
      </div>

      {/* Timeline EPG View */}
      <div className="border rounded overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Channel Headers */}
          <div className="flex bg-gray-100 border-b">
            <div className="w-32 p-2 font-bold">Channel</div>
            <div className="flex-1 p-2 font-bold">Program</div>
          </div>

          {/* EPG Data */}
          {epgData.map((program) => (
            <div key={program._id} className="flex border-b">
              <div className="w-32 p-2">{program.channel}</div>
              <div className="flex-1 p-2">
                <div className="bg-blue-100 p-2 rounded">
                  <p className="font-semibold">{program.title}</p>
                  <p className="text-sm">
                    {program.start} - {program.end}
                  </p>
                  <p className="text-sm">{program.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div ref={timelineRef} className="h-10"></div>
      </div>

      {loading && <p className="text-center mt-4">Loading...</p>}
      {epgData.length === 0 && !loading && (
        <p className="text-center mt-4">
          No programs found for this time range.
        </p>
      )}
    </div>
  );
};

export default EPGPage;
