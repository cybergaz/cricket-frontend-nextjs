'use client';

import { useEffect, useState } from "react";
import { CirclePlus, X } from "lucide-react";
import "dotenv/config";
import { getCookie } from "@/lib/helper";

// Define types for notification data
type Notification = {
  title: string;
  date: string;
  time: string;
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Create a client component for the notification popup
const NotificationPopup = ({
  isOpen,
  onClose,
  onSend,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSend: (text: string, datetime: string, userGroup: string) => void;
}) => {
  const [text, setText] = useState<string>("");
  const [datetime, setDatetime] = useState<string>("");
  const [userGroup, setUserGroup] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // setIsLoading(true);
        const res = await fetch(`${BACKEND_URL}/admin/fetch-inactive-users`);
        if (!res.ok) throw new Error("API Error");
        const data = await res.json();
        // setMatches(data.data);
        console.log("Fetched inactive users:", data);
      } catch (e) {
        console.error("Fetch error:", e);
      } finally {
        // setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 w-screen h-screen justify-center flex items-center bg-black/30 backdrop-blur-xs z-50">
      <div
        onClick={onClose}
        className="fixed inset-0 w-screen h-screen z-40"
      />
      <div className="z-50 bg-[#181a20] border-2 rounded-2xl border-purple-400/20 p-4 sm:p-5 flex flex-col gap-5 w-[95vw] max-w-md">
        <div className="mb-5 flex justify-between items-center">
          <h1 className="font-bold">Broadcast Notification</h1>
          <X
            onClick={onClose}
            className="size-7 rounded-lg p-1 hover:bg-blue-900 cursor-pointer"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Message</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type here..."
            className="p-2 rounded-lg border bg-gray-400/10 border-gray-300/20 focus:outline-none focus:ring-2 focus:ring-white"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Schedule</label>
          <input
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            className="p-2 rounded-lg border bg-gray-400/10 border-gray-300/20 focus:outline-none focus:ring-2 focus:ring-white"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Select Users</label>
          <select
            className="p-2 rounded-lg border bg-gray-400/10 border-gray-300/20 focus:outline-none focus:ring-2 focus:ring-white"
            value={userGroup}
            onChange={(e) => setUserGroup(e.target.value)}
          >
            <option value="all">All</option>
            <option value="loss">Users in loss</option>
            <option value="profit">User in profit</option>
            <option value="today">Today Login</option>
            <option value="new">New User</option>
            <option value="inactive">User Inactive for 24hr</option>
            <option value="admin">All Admins</option>
          </select>
        </div>

        <button
          onClick={() => onSend(text, datetime, userGroup)}
          className="bg-purple-800 hover:bg-purple-900 text-white w-fit h-fit py-2 px-4 mt-5 rounded-lg cursor-pointer"
        >
          Send Notification
        </button>
      </div>
    </div>
  );
};

// Create a custom button component with TypeScript
const Button = ({
  children,
  className,
  onClick
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={`bg-purple-800 hover:bg-purple-900 text-white rounded-lg py-2 px-4 flex items-center justify-center ${className || ""}`}
    >
      {children}
    </button>
  );
};

export default function Notifications() {
  const [popup, setPopup] = useState<boolean>(false);
  // Sample data, in a real app this would be fetched from an API
  const [notifications, setNotifications] = useState<Notification[]>(
    Array(20).fill(null).map((_, i) => ({
      title: `Notification ${i + 1}`,
      date: "10/10/2024",
      time: "10:10 PM"
    }))
  );

  const handleSendNotification = (text: string, datetime: string, userGroup: string) => {
    // In a real app, you would send this to your backend
    console.log("Sending notification:", { text, datetime, userGroup });

    // For demo purposes, add to local state
    const date = new Date(datetime);
    const newNotification: Notification = {
      title: text.length > 30 ? text.substring(0, 30) + "..." : text,
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setNotifications([newNotification, ...notifications]);
    setPopup(false);
  };

  return (
    <section className="bg-[#181a20] flex flex-col gap-5 rounded-2xl p-4 sm:p-8 w-full max-w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 text-white">
        <h1 className="text-lg font-semibold">Notifications Sent</h1>
        <Button onClick={() => setPopup(true)} className="flex gap-2 w-full sm:w-auto">
          <CirclePlus className="fill-white text-[#193cb8]" />
          New Notification
        </Button>

        <NotificationPopup
          isOpen={popup}
          onClose={() => setPopup(false)}
          onSend={handleSendNotification}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[400px] text-left text-sm sm:text-base text-white">
          <thead>
            <tr className="border-b border-white/30">
              <th className="py-2 px-4">Title</th>
              <th className="py-2 px-4">Date</th>
              <th className="py-2 px-4">Time</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((notification, index) => (
              <tr key={index} className="border-b border-white/20">
                <td className="py-2 px-4">{notification.title}</td>
                <td className="py-2 px-4">{notification.date}</td>
                <td className="py-2 px-4">{notification.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
