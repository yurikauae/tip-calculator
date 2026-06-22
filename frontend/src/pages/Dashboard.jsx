import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Activity, Star, RefreshCw } from "lucide-react";
import api from "../services/api";
import useStore from "../store/useStore";

const CATEGORIES = ["All", "Forex", "Crypto", "Indices", "Commodities", "ETFs"];

function SignalBadge({ signal, size = "sm" }) {
  const config = {
    BUY: { bg: "bg-[#00d4aa]/20", text: "text-[#00d4aa]", border: "border-[#00d4aa]/40" },
    SELL: { bg: "bg-[#ff4757]/20", text: "text-[#ff4757]", border: "border-[#ff4757]/40" },
    NEUTRAL: { bg: "bg-[#ffa502]/20", text: "text-[#ffa502]", border: "border-[#ffa502]/40" },
  };
  const c = config[signal] || config.NEUTRAL;
  const padding = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";
  return (
    <span className={`inline-flex items-center font-semibold rounded border ${c.bg} ${c.text} ${c.border} ${padding}`}>
      {signal}
    </span>
  );
}

// ... full component written to file