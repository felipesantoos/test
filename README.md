# Redmine Dashboard & Analytics

A comprehensive analytics platform that integrates with the Redmine REST API to provide real-time insights into projects and issues.

## Features

- **Authentication & API Integration:** Secure connection to Redmine using API keys
- **Project Overview Dashboard:** Visual representation of project progress, open vs. closed issues, and milestone tracking
- **Issue Management Analytics:** Graphs and reports on issue statuses, priorities, categories, and resolution times
- **User & Team Performance:** Insights into individual and team contributions, including issue assignments and completion rates
- **Custom Filters & Reports:** Ability to generate custom reports based on projects, assignees, dates, and categories
- **Real-Time Data Updates:** Periodic synchronization with the Redmine API to keep dashboards up to date
- **Interactive UI:** Modern and responsive UI for an intuitive user experience

## Tech Stack

- **Frontend:** React (Vite) + TypeScript + Recharts for data visualization
- **Backend:** Node.js (Express.js) for API proxying and data aggregation
- **Styling:** Tailwind CSS for responsive design

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- A Redmine instance with API access
- Redmine API key

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. In a separate terminal, start the backend server:

```bash
npm run server
```

## Configuration

1. Navigate to the Settings page in the application
2. Enter your Redmine URL (e.g., https://redmine.example.com)
3. Enter your Redmine API key
4. Click "Test Connection" to verify your credentials
5. Save your settings

## Usage

- **Dashboard:** View overall project health and key metrics
- **Projects:** Browse and filter all projects
- **Issues:** Search, filter, and analyze issues
- **Team Performance:** Monitor team workload and productivity
- **Settings:** Configure Redmine API connection and application preferences

## License

MIT