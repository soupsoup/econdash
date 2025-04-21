# Economic Dashboard

A real-time economic data visualization dashboard built with React, TypeScript, and Tailwind CSS. This application provides a comprehensive view of key economic indicators, market updates, and economic calendar events.

## Features

- **Live Economic Indicators**: Real-time tracking of key economic metrics using FRED API
- **Market Updates**: Live market news and updates
- **Economic Calendar**: Interactive calendar showing upcoming economic events
- **Presidential Schedule**: Track presidential events and their impact on markets
- **Responsive Design**: Fully responsive layout that works on desktop and mobile devices
- **Dark/Light Mode**: Automatic theme switching based on system preferences

## Tech Stack

- **Frontend**: React 18+ with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Data Visualization**: Recharts
- **API Integration**: Axios
- **Build Tool**: Vite
- **Deployment**: Netlify

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or yarn
- FRED API key (for economic data)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/soupsoup/econdash.git
   cd econdash
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   VITE_FRED_API_KEY=your_fred_api_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/        # React components
├── contexts/         # React context providers
├── data/            # Static data and configurations
├── hooks/           # Custom React hooks
├── pages/           # Page components
├── services/        # API and data services
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

## Key Components

- **IndicatorCard**: Displays individual economic indicators with charts
- **EconomicCalendar**: Shows upcoming economic events
- **MarketUpdates**: Real-time market news feed
- **NextUpdates**: Upcoming data release schedule
- **PresidentSchedule**: Presidential event tracker

## API Integration

The dashboard integrates with several data sources:

- **FRED API**: For economic indicator data
- **Economic Calendar API**: For economic events
- **Market Updates**: Real-time market news

## Deployment

The application is deployed on Netlify with continuous deployment from the main branch. Each push to main triggers a new build and deployment.

### Environment Variables

Required environment variables for production:

- `VITE_FRED_API_KEY`: FRED API key
- Additional API keys as needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- FRED (Federal Reserve Economic Data)
- Investing.com for economic calendar data
- All contributors and maintainers

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.
