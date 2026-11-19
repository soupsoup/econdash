import React from 'react';

const EconomicCalendar: React.FC = () => {
  return (
    <section className="border-t-4 border-double border-ink pt-5 w-full min-w-0">
      <div>
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <h2 className="section-title">Economic Calendar</h2>
          <span className="eyebrow">Via Investing.com</span>
        </div>

        <div className="relative border border-ink bg-white" style={{ height: '600px' }}>
          <iframe 
            src="https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&features=datepicker,timezone&countries=25,32,6,37,72,22,17,39,14,10,35,43,56,36,110,11,26,12,4,5&calType=week&timeZone=8&lang=1"
            width="100%" 
            height="100%" 
            frameBorder="0" 
            // Note: While React warns about allowTransparency, we need to keep it camelCased
            // for TypeScript compatibility. This is a known issue where React's runtime and
            // TypeScript definitions differ.
            allowTransparency={true}
            className="absolute inset-0"
          ></iframe>
        </div>
      </div>
    </section>
  );
};

export default EconomicCalendar; 