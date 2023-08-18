# Frontend

## Project Folder Structure

Here is an overview of the main directories and their purposes:

```
├── public/                     # Root directory for public assets
│   ├── assets/                   # Directory for additional assets
│   └── index.html                  # HTML template file
├── src/                        # Source code directory
│   ├── components/               # Reusable UI components
│   ├── pages/                    # Application pages or screens
│   ├── services/                 # Backend services or API clients
│   ├── utils/                    # Utility functions and helpers
│   ├── lib/                      # API Library Function
│   ├── main.css                   # CSS file for global styles
│   ├── App.tsx                   # Main application component written in TypeScript (React)
│   ├── main.tsx                  # Entry point file written in TypeScript (React)
│   └── vite-env.d.ts             # Declaration file for Vite environment variables
├── package.json                # NPM package configuration
├── package-lock.json           # NPM package configuration
├── tsconfig.json               # TypeScript configuration file
├── tsconfig.node.json          # TypeScript configuration file for Node.js environment
└── vite.config.ts              # Vite configuration file
```

## Usage

### Prerequisites

> **Note** In development mode, React.StrictMode renders components twice to
> detect potential issues in the codebase, which results in duplicate logs in
> the console. These duplicates can be safely ignored, but if you want to
> disable this behavior (not reccomended), install the
> [React Developer Tools](https://react.dev/learn/react-developer-tools)
> extension for your browser and enable the "Hide logs during second render in
> Strict Mode" option.

### Available Scripts

Here is a list of the scripts provided in the `scripts` section of the
`package.json` file:

| Script          | Description                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------------- |
| npm run dev     | Runs the app in the development mode with hot reload.                                           |
| npm run build   | Builds the app for production to the `dist` folder.                                             |
| npm run preview | Serves the production build from the `dist` folder.                                             |
| npm run format  | Formats the codebase according to the defined code style guidelines.                            |
| npm run lint    | Execute the linter to analyze the code for potential errors, style violations, or other issues. |
| npm run test    | Runs the test watcher in an interactive mode.                                                   |
