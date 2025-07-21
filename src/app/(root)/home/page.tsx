"use client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import {
  TrendingUp,
  BarChart2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Competitions, { Competition } from "./Competitions";
import { Loading } from "../betting-interface/components/Loading";
import { StockAnimationBackground } from "@/components/about-us/stock-animation-background";


const CricketSchedulePage = () => {

  const [matches, setMatches] = useState<Competition[]>();
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Stock chart data
    const stockData = {
      labels: Array.from({ length: 20 }, (_, i) => i),
      datasets: [
        {
          label: "",
          data: Array.from({ length: 20 }, () => Math.random() * 100 + 150),
          color: "#10B981",
        },
        {
          label: "",
          data: Array.from({ length: 20 }, () => Math.random() * 80 + 100),
          color: "#3B82F6",
        },
      ],
    };

    // Animation variables
    let animationFrameId: number;
    let time = 5;

    // Draw stock chart
    const drawStockChart = () => {
      const chartHeight = canvas.height * 0.6;
      const chartTop = canvas.height * 0.2;
      const chartWidth = canvas.width * 0.8;
      const chartLeft = canvas.width * 0.1;

      // Draw grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;

      // Horizontal grid lines
      for (let i = 0; i <= 5; i++) {
        const y = chartTop + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(chartLeft, y);
        ctx.lineTo(chartLeft + chartWidth, y);
        ctx.stroke();
      }

      // Vertical grid lines
      for (let i = 0; i <= 10; i++) {
        const x = chartLeft + (chartWidth / 10) * i;
        ctx.beginPath();
        ctx.moveTo(x, chartTop);
        ctx.lineTo(x, chartTop + chartHeight);
        ctx.stroke();
      }

      // Update data with some movement
      stockData.datasets.forEach((dataset) => {
        dataset.data = dataset.data.map((value) => {
          return value + (Math.random() - 0.5) * 5;
        });
      });

      // Draw datasets
      stockData.datasets.forEach((dataset, datasetIndex) => {
        ctx.strokeStyle = dataset.color;
        ctx.lineWidth = 3;
        ctx.beginPath();

        // Create gradient
        const gradient = ctx.createLinearGradient(
          0,
          chartTop,
          0,
          chartTop + chartHeight
        );
        gradient.addColorStop(0, dataset.color);
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        // Draw line
        dataset.data.forEach((value, index) => {
          const x =
            chartLeft + (chartWidth / (dataset.data.length - 1)) * index;
          const normalizedValue =
            (value - Math.min(...dataset.data)) /
            (Math.max(...dataset.data) - Math.min(...dataset.data));
          const y = chartTop + chartHeight - normalizedValue * chartHeight;

          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        // Add shadow for glow effect
        ctx.shadowColor = dataset.color;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw area under the line
        ctx.lineTo(chartLeft + chartWidth, chartTop + chartHeight);
        ctx.lineTo(chartLeft, chartTop + chartHeight);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.2;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Draw data points
        dataset.data.forEach((value, index) => {
          const x =
            chartLeft + (chartWidth / (dataset.data.length - 1)) * index;
          const normalizedValue =
            (value - Math.min(...dataset.data)) /
            (Math.max(...dataset.data) - Math.min(...dataset.data));
          const y = chartTop + chartHeight - normalizedValue * chartHeight;

          // Pulse effect on points
          const pulseSize = 4 + Math.sin(time * 0.1 + index * 0.5) * 2;

          ctx.beginPath();
          ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
          ctx.fillStyle = dataset.color;
          ctx.shadowColor = dataset.color;
          ctx.shadowBlur = 15;
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // Draw label
        ctx.font = "12px Arial";
        ctx.fillStyle = dataset.color;
        ctx.fillText(
          dataset.label,
          chartLeft + 10,
          chartTop + 20 + datasetIndex * 20
        );
      });

      // Draw price indicators
      stockData.datasets.forEach((dataset, idx) => {
        const latestValue = dataset.data[dataset.data.length - 1];
        const prevValue = dataset.data[dataset.data.length - 2];
        const change = latestValue - prevValue;
        const changePercent = (change / prevValue) * 100;

        const x = chartLeft + chartWidth + 10;
        const normalizedValue =
          (latestValue - Math.min(...dataset.data)) /
          (Math.max(...dataset.data) - Math.min(...dataset.data));
        const y = chartTop + chartHeight - normalizedValue * chartHeight;

        ctx.font = "bold 14px Arial";
        ctx.fillStyle = dataset.color;
        ctx.fillText(latestValue.toFixed(2), x, y);

        ctx.font = "12px Arial";
        ctx.fillStyle = change >= 0 ? "#10B981" : "#EF4444";
        ctx.fillText(
          (change >= 0 ? "+" : "") + changePercent.toFixed(2) + "%",
          x,
          y + 15
        );
      });
    };

    // Animation loop
    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update time
      time += 0.05;

      // Draw stock chart
      drawStockChart();

      // Draw animated wave at bottom
      const waveHeight = 20;
      const waveLength = canvas.width / 2;
      const waveY = canvas.height - 30;

      ctx.beginPath();
      ctx.moveTo(0, waveY + waveHeight);

      for (let x = 0; x < canvas.width; x++) {
        const y =
          waveY + Math.sin((x / waveLength) * Math.PI * 2 + time) * waveHeight;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();

      const waveGradient = ctx.createLinearGradient(
        0,
        waveY - waveHeight,
        0,
        canvas.height
      );
      waveGradient.addColorStop(0, "rgba(16, 185, 129, 0.2)");
      waveGradient.addColorStop(1, "rgba(16, 185, 129, 0)");

      ctx.fillStyle = waveGradient;
      ctx.fill();

      // Continue animation
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Cleanup
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/cricket/competitions?limit=10`
        );
        if (!res.ok) throw new Error("API Error");
        const data = await res.json();
        const matchesData = data.data;
        setMatches(matchesData);
        return
      } catch (e) {
        console.error("Fetch error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return <Loading />
  }

  return (
    <div className="bg-background min-h-screen">

      <section className="relative h-[500px] overflow-hidden">
        <StockAnimationBackground />
        <div className="absolute inset-0 z-0">
          <canvas ref={canvasRef} className="w-full h-full opacity-100" />
        </div>
        <div className="absolute inset-0 z-10" />
        <div className="relative z-20 container mx-auto px-4 h-full flex flex-col justify-center">
          <div className="max-w-3xl px-5 sm:px-1">
            <div className="flex items-center gap-2 text-green-400 mb-3 animate-fade-in">
              <TrendingUp className="h-5 w-5 animate-pulse" />
              <span className="text-sm font-semibold uppercase tracking-widest">
                Cricket Leagues & Market Trends
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg mb-4">
              Don't Miss The Action
            </h1>

            <p className="text-gray-300 mb-6 flex items-center gap-2 text-base">
              <BarChart2 className="h-4 w-4 text-green-400" />
              Track live matches and performance stats in real-time
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
              {["Live Commentary", "Real-time Updates", "Expert Analysis"].map(
                (item) => (
                  <div key={item} className="flex items-center">
                    <Zap className="h-4 w-4 mr-2 text-blue-400" />
                    <span>{item}</span>
                  </div>
                )
              )}
            </div>
          </div>
          <Link href="/live-matches" className="mt-10 px-5 sm:px-1">
            <Button
              size="lg"
              className="text-green-500 bg-green-500/15 backdrop-blur-md hover:bg-green-600 font-bold shadow-lg transition-all duration-300 hover:scale-105 hover:text-white"
            >
              Watch Live Matches
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {matches &&
        <Competitions matches={matches} isLoading={isLoading} />
      }

    </div>
  );
};

export default CricketSchedulePage;
