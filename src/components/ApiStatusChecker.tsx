import { useEffect, useState } from "react";
import axios from "axios";
import { AlertCircle, CheckCircle, Clock, RefreshCw } from "lucide-react";

export function ApiStatusChecker() {
  const [status, setStatus] = useState<"ok" | "rate_limited" | "error" | "loading">("loading");
  const [details, setDetails] = useState<string | null>(null);

  const checkApiStatus = async () => {
    try {
      const res = await axios.post(
        "https://api.bls.gov/publicAPI/v2/timeseries/data",
        {
          seriesid: ["LNS14000000"],
          startyear: "2023",
          endyear: "2023"
        },
        {
          headers: {
            "Content-Type": "application/json",
            "registrationKey": import.meta.env.VITE_BLS_API_KEY || "ce15238949e14526b9b13c2ff4beabfc"
          }
        }
      );

      if (res?.data?.status === "REQUEST_NOT_PROCESSED") {
        const msg = res.data.message?.[0] || "";
        if (/threshold|rate limit/i.test(msg)) {
          setStatus("rate_limited");
          setDetails("Rate limit hit: " + msg);
        } else {
          setStatus("error");
          setDetails("Unprocessed: " + msg);
        }
      } else {
        setStatus("ok");
        setDetails(null);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message?.[0] || err.message;
      const code = err.response?.status;
      if (/threshold|rate limit/i.test(msg)) {
        setStatus("rate_limited");
        setDetails(`Rate limit error (code ${code}): ${msg}`);
      } else {
        setStatus("error");
        setDetails(`General error (code ${code}): ${msg}`);
      }
    }
  };

  useEffect(() => {
    checkApiStatus();
    const interval = setInterval(checkApiStatus, 300000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center space-x-2 text-blue-600 p-4">
        <RefreshCw className="h-5 w-5 animate-spin" />
        <p>Checking API status...</p>
      </div>
    );
  }

  if (status === "ok") return null;

  const statusConfig = {
    rate_limited: {
      icon: <Clock className="h-5 w-5 text-amber-500" />,
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      textColor: "text-amber-800"
    },
    error: {
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-800"
    }
  };

  const config = statusConfig[status];

  return (
    <div className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor} ${config.textColor}`}>
      <div className="flex items-start space-x-3">
        {config.icon}
        <div className="flex-1">
          <p className="font-medium">
            {status === "rate_limited" ? "BLS API Rate Limit Reached" : "BLS API Error"}
          </p>
          {details && <p className="mt-1 text-sm">{details}</p>}
        </div>
        <button
          onClick={checkApiStatus}
          className="p-1 hover:bg-white/50 rounded-full transition-colors"
          title="Retry API check"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default ApiStatusChecker;