<div align="center">

# 📊 PerformIQ — Employee Performance Management Dashboard

**A full-featured Angular 20 application for managing employee performance reviews, analytics, and team oversight.**

[![Angular](https://img.shields.io/badge/Angular-20-red?logo=angular)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org)
[![Angular Material](https://img.shields.io/badge/Angular%20Material-20-purple?logo=angular)](https://material.angular.io)
[![ngx-charts](https://img.shields.io/badge/ngx--charts-23-teal)](https://swimlane.gitbook.io/ngx-charts)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://employee-performance-flax.vercel.app)

🔗 **Live Demo:** [employee-performance-flax.vercel.app](https://employee-performance-flax.vercel.app)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Demo Credentials](#-demo-credentials)
- [Project Structure](#-project-structure)
- [Screenshots](#-screenshots)
- [Scripts](#-scripts)

---

## 🌟 Overview

PerformIQ is a role-based Employee Performance Management Dashboard built with **Angular 20**. It supports two distinct user roles — **Manager** and **Employee** — each with a tailored experience for tracking, reviewing, and analysing performance data across teams and departments.

---

## ✨ Features

### 🔐 Authentication & Security
- JWT-style mock login with role-based access control
- Route guards (`authGuard`, `roleGuard`) protecting all pages
- Persistent session via `localStorage`

### 👨‍💼 Manager Dashboard
- Team overview with live stats: total employees, pending reviews, average rating, total reviews
- Performance breakdown chart (Exceptional / Exceeds / Meets / Needs Improvement)
- Recent reviews table with status badges
- Quick action shortcuts (Employees, Add Employee, Submit Review, Analytics)
- My Team section with individual employee performance ratings

### 👤 Employee Dashboard
- Personal performance overview with latest rating and score breakdown
- Category scores: Productivity, Quality, Communication, Teamwork, Innovation, Attendance
- My Reviews history portal with detailed review popup
- Score trend and radar-style breakdown charts

### 👥 Employee Management
- Full employee directory with search, filter by department, and status filter
- Add new employee via multi-step reactive form
- Employee detail page with full profile, performance history, and review timeline

### 📝 Performance Reviews
- Manager review submission form with category scoring
- Review status tracking: `pending → in-progress → completed`
- Review detail modal with goals, achievements, and areas of improvement

### 📈 Analytics
- Department-wise performance bar charts
- Rating distribution pie chart
- Performance trend line chart
- Powered by **ngx-charts**

### 🎨 UI / UX
- Collapsible sidebar navigation with role-based menu items
- Responsive layout with Angular Material components
- Custom SCSS theme with gradient hero headers
- Loading states via HTTP interceptor
- Top Performer custom directive
- Employee filter custom pipe

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| **Angular 20** | Core framework |
| **TypeScript 5.9** | Type safety |
| **Angular Material 20** | UI component library |
| **ngx-charts 23** | Data visualisation |
| **RxJS 7.8** | Reactive state with `BehaviorSubject` / `Observable` |
| **Angular Router** | Lazy-loaded routes with guards |
| **Reactive Forms** | Multi-step form validation |
| **In-memory Mock Data** | No backend needed — data bundled in services |

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Installation

```bash
# Clone the repository
git clone https://github.com/abelalexander18/Employee-Performance.git
cd Employee-Performance

# Install dependencies
npm install

# Start the development server
npm start
```

Open your browser at **http://localhost:4200**

### Production Build

```bash
npm run build
```

Build output is placed in `dist/employee-performance-app/browser/`.

---

## 🔑 Demo Credentials

| Role | Username | Password |
|---|---|---|
| **Manager** | `manager` | `password123` |
| **Employee** | `employee` | `password123` |

> The Manager account shows team-wide stats, all employees, and can submit reviews.  
> The Employee account shows personal performance, scores, and review history.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── login/              # Login page
│   │   ├── shell/              # App shell with sidebar
│   │   ├── dashboard/          # Role-based dashboard
│   │   ├── employee-list/      # Employee directory
│   │   ├── employee-detail/    # Employee profile & history
│   │   ├── performance-review/ # Review submission form
│   │   ├── add-employee/       # Multi-step add employee form
│   │   └── analytics/          # Charts & analytics
│   ├── services/
│   │   ├── auth.service.ts         # Authentication & session
│   │   ├── employee.service.ts     # Employee CRUD (in-memory)
│   │   └── performance.service.ts  # Reviews & records (in-memory)
│   ├── guards/
│   │   └── auth.guard.ts       # Route protection guards
│   ├── models/                 # TypeScript interfaces
│   ├── pipes/
│   │   └── employee-filter.pipe.ts  # Custom filter pipe
│   ├── directives/
│   │   └── top-performer.directive.ts # Custom directive
│   └── interceptors/
│       └── http-loading.interceptor.ts # Loading state interceptor
├── styles.css                  # Global styles
└── custom-theme.scss           # Angular Material custom theme
```

---

## 📸 Screenshots

| Manager Dashboard | Employee Dashboard |
|---|---|
| Team stats, charts, recent reviews | Personal scores, review history |

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm start` | Start dev server at `localhost:4200` |
| `npm run build` | Build for production |
| `npm run watch` | Build in watch mode |
| `npm test` | Run unit tests with Karma |
| `npm run server` | Start JSON Server mock API at `localhost:3000` |
| `npm run dev` | Run Angular + JSON Server concurrently |

---

## 👨‍💻 Author

**Abel Alexander**  
[github.com/abelalexander18](https://github.com/abelalexander18)

---

<div align="center">
Made with ❤️ using Angular 20
</div>

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
