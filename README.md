# After School Classes — Backend (Express.js)

REST API for the After School Classes booking app, built with **Node.js**, **Express.js** and the **MongoDB native driver** (MongoDB Atlas).

## Features
- Logger middleware that logs every request
- Static file middleware serving lesson images (returns an error if the image does not exist)
- Database credentials via environment variables in deployment, or a local properties file in development

## API Routes
| Method | Route | Description |
|---|---|---|
| GET | `/lessons` | Returns all lessons as JSON |
| POST | `/orders` | Saves a new order (name, phone, lessonIDs, spaces) |
| PUT | `/lessons/:id` | Updates any attribute of a lesson (e.g. spaces) |
| GET | `/search?q=term` | Full-text search over topic, location, price and spaces |

## How to run locally
1. Clone this repository and run `npm install`
2. Create `conf/db.properties` with your MongoDB Atlas credentials
   (`db.user`, `db.pwd`, `db.dbName`, `db.dbUrl`, `db.dbHost`, `db.params`)
3. Run `npm start` — the server listens on port 3000

## Links
- **Frontend GitHub repository:** https://github.com/PFRLages/afterschool-frontend
- **Live app (GitHub Pages):** https://pfrlages.github.io/afterschool-frontend/
- **Backend GitHub repository:** https://github.com/PFRLages/afterschool-backend
- **Live API — all lessons (Render):** https://afterschool-backend-5ud5.onrender.com/lessons