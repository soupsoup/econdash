import { AlertCircle, RefreshCw } from 'lucide-react';

type MockDataNoticeProps = {
  reason: "rate_limit" | "error";
  retry?: () => void;
};

export function MockDataNotice({ reason, retry }: MockDataNoticeProps) {
  const message =
    reason === "rate_limit"
      ? "We're showing mock data because the BLS API rate limit was reached. This is a temporary limit imposed by the government data source."
      : "We're showing mock data due to an error connecting to the BLS API.";

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
      <div className="flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-amber-800">
            {reason === "rate_limit" ? "Using Cached Data - API Rate Limit" : "Using Cached Data - API Error"}
          </h3>
          <p className="mt-1 text-sm text-amber-700">{message}</p>
          {retry && (
            <button
              onClick={retry}
              className="mt-3 inline-flex items-center space-x-2 text-sm text-amber-800 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-md transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try again</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MockDataNotice;