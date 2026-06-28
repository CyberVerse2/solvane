"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { spendSeries } from "@/lib/data";

export function SpendChart() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={spendSeries} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="gApproved" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c8fa4b" stopOpacity={0.32} />
            <stop offset="100%" stopColor="#c8fa4b" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gBlocked" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff6a5f" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#ff6a5f" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="t"
          tickLine={false}
          axisLine={false}
          interval={5}
          tick={{ fill: "#565c67", fontSize: 11, fontFamily: "var(--font-mono)" }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tick={{ fill: "#565c67", fontSize: 11, fontFamily: "var(--font-mono)" }}
          tickFormatter={(v) => `$${v}`}
        />
        <Tooltip
          cursor={{ stroke: "rgba(255,255,255,0.18)", strokeDasharray: "3 3" }}
          contentStyle={{
            background: "#0d0e11",
            border: "1px solid rgba(255,255,255,0.13)",
            borderRadius: 10,
            fontSize: 12,
            fontFamily: "var(--font-mono)",
            padding: "8px 12px",
          }}
          labelStyle={{ color: "#888f9b", marginBottom: 4 }}
          itemStyle={{ padding: 0 }}
          formatter={(v, n) => [`$${v}`, n === "approved" ? "Approved" : "Blocked"]}
        />
        <Area
          type="monotone"
          dataKey="approved"
          stroke="#c8fa4b"
          strokeWidth={2}
          fill="url(#gApproved)"
          dot={false}
          activeDot={{ r: 3, fill: "#c8fa4b", stroke: "#08090b", strokeWidth: 2 }}
        />
        <Area
          type="monotone"
          dataKey="blocked"
          stroke="#ff6a5f"
          strokeWidth={1.5}
          fill="url(#gBlocked)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
