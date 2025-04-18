import { useEffect, useState } from "react";
import axios from "axios";
import { AlertCircle, CheckCircle, Clock, Database, ExternalLink, RefreshCw } from "lucide-react";

interface ApiEndpoint {
  name: string;
  url: string;
  method: 'get' | 'post';
  headers?: Record<string, string>;
  body?: Record<string, any>;
}

export function ApiStatusChecker() {
  const [status, setStatus] = useState<"ok" | "rate_limited" | "error" | "loading">("loading");
  const [details, setDetails] = useState<string | null>(null);
  const [endpoints] = useState<ApiEndpoint[]>([
    {
      name: "FRED API",
      url: "https://api.stlouisfed.org/fred/series/observations",
      method: "get",
      headers: {
        "Content-Type": "application/json"
      }
    },
    {
      name: "BLS API",
      url: "https://api.bls.gov/publicAPI/v2/timeseries/data",
      method: "post",
      headers: {
        "Content-Type": "application/json",
        "registrationKey": import.meta.env.VITE_BLS_API_KEY || "ce15238949e14526b9b13c2ff4beabfc"
      },
      body: {
        seriesid: ["LNS14000000"],
        startyear: "2023",
        endyear: "2025"
      }
    }
  ]);

  const checkApiStatus = async () => {
    setStatus("loading");
    setDetails(null);

    try {
      const results = await Promise.all(
        endpoints.map(async (endpoint) => {
          try {
            const response = await axios({
              method: endpoint.method,
              url: endpoint.url,
              headers: endpoint.headers,
              data: endpoint.body,
              timeout: 5000
            });
            return { name: endpoint.name, success: true, response };
          } catch (error) {
            if (axios.isAxiosError(error)) {
              return {
                name: endpoint.name,
                success: false,
                status: error.response?.status,
                message: error.message,
                details: error.response?.data
              };
            }
            throw error;
          }
        })
      );

      const hasErrors = results.some(result => !result.success);
      const hasRateLimits = results.some(
        result => !result.success && result.status === 429
      );

      if (hasRateLimits) {
        setStatus("rate_limited");
      } else if (hasErrors) {
        setStatus("error");
      } else {
        setStatus("ok");
      }

      setDetails(JSON.stringify(results, null, 2));
    } catch (error) {
      setStatus("error");
      setDetails(error instanceof Error ? error.message : "Unknown error occurred");
    }
  };

  useEffect(() => {
    checkApiStatus();
    const interval = setInterval(checkApiStatus, 300000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case "ok":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "rate_limited":
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "loading":
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center space-x-2 mb-4">
          {getStatusIcon()}
          <h2 className="text-lg font-semibold">API Status</h2>
          <button
            onClick={checkApiStatus}
            className="ml-auto p-2 text-gray-500 hover:text-gray-700"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {status !== "loading" && details && (
          <pre className="mt-4 p-3 bg-gray-50 rounded-md text-sm overflow-auto max-h-96">
            {details}
          </pre>
        )}
      </div>
    </div>
  );
}

export default ApiStatusChecker;