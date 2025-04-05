const options = {
  chart: {
    type: "area",
    height: 400,
    animations: {
      enabled: true,
    },
    toolbar: {
      show: false,
    },
    fontFamily: "system-ui, -apple-system, sans-serif",
    offsetY: 30,
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    curve: "smooth",
    width: 2,
    colors: ["#2563eb"],
  },
  fill: {
    type: "gradient",
    gradient: {
      shadeIntensity: 0.8,
      opacityFrom: 0.3,
      opacityTo: 0.1,
      stops: [0, 90, 100],
    },
    colors: ["#2563eb"],
  },
  grid: {
    borderColor: "#f1f5f9",
    strokeDashArray: 4,
    xaxis: {
      lines: {
        show: false,
      },
    },
  },
  xaxis: {
    type: "datetime",
    labels: {
      rotate: -45,
      format: "MMM yyyy",
      style: {
        fontSize: "10px",
      },
    },
    tooltip: {
      enabled: true,
    },
  },
  tooltip: {
    x: {
      format: "MMM yyyy",
    },
  },
  annotations: {
    xaxis: [
      // Shaded term ranges
      ...presidents.map((president) => ({
        x: new Date(president.term.start).getTime(),
        x2: president.term.end
          ? new Date(president.term.end).getTime()
          : new Date().getTime(),
        fillColor: president.party === "Democratic" ? "#2563eb20" : "#dc262620",
        opacity: 0.15,
        borderWidth: 0,
        label: { text: "" },
      })),
      // Top-positioned name labels
      ...presidents.map((president, index) => ({
        x: new Date(president.term.start).getTime(),
        label: {
          text: president.name,
          position: "top",
          orientation: "horizontal",
          offsetY: -30 - (index % 2) * 15,
          style: {
            color: president.party === "Democratic" ? "#2563eb" : "#dc2626",
            fontSize: "12px",
            fontWeight: 600,
            background: "transparent",
          },
        },
        borderColor: president.party === "Democratic" ? "#2563eb" : "#dc2626",
        strokeDashArray: 5,
        opacity: 0.3,
      })),
    ],
  },
  colors: ["#3b82f6"],
};
