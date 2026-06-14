# Student Result Management System

A simple full-stack project to add, view, search, edit, and delete student exam
records, with automatic percentage calculation and Pass/Fail status — built for
the Frontend Internship Assignment (Reviewer: Sanjana).

## Tech stack

| Layer        | Technology            |
|--------------|------------------------|
| Frontend     | HTML, CSS, JavaScript |
| Backend      | Python (Flask)        |
| Database     | SQLite                |
| Version Ctrl | GitHub                |

## Folder structure

```
student-result-system/
├── index.html
├── style.css
├── script.js
├── app.py
├── database.db
└── README.md
```

## Features

1. **Add Student Record** – "New entry" button opens a form (name, roll no,
   subject, marks).
2. **View Student Records** – all records are listed in a ledger-style table
   on the home screen.
3. **Edit Student Information** – the edit (pencil) icon next to each row
   loads that record back into the form for updating.
4. **Delete Student Record** – the delete (trash) icon next to each row
   removes that record after a confirmation prompt.
5. **Search Student** – the search bar at the top of the page filters records
   live by student name, roll number, or subject.
6. **Calculate Percentage** – percentage is calculated automatically from the
   marks entered (marks are out of 100).
7. **Display Pass / Fail Status** – each record gets a "Pass" or "Fail" stamp
   based on a minimum pass mark of 35.
8. **SQLite Integration** – all data is stored and persisted in `database.db`
   via a Flask REST API.

## Setup & run

1. Install dependencies:
   ```bash
   pip install flask flask_cors
   ```

2. Run the backend (this also creates `database.db` automatically on first run):
   ```bash
   python app.py
   ```

3. Open the app in your browser:
   ```
   http://localhost:5000
   ```

   Flask serves `index.html`, `style.css`, and `script.js` directly, so no
   separate frontend server is needed.

## Database schema (`students` table)

| Column        | Type    | Notes                              |
|---------------|---------|------------------------------------|
| id            | INTEGER | Primary key, auto-increment       |
| student_name  | TEXT    | Student's full name               |
| roll_no       | TEXT    | Roll number                        |
| subject       | TEXT    | Subject name                       |
| marks         | INTEGER | Marks scored (out of 100)         |
| percentage    | FLOAT   | Auto-calculated from marks         |
| status        | TEXT    | "Pass" (marks ≥ 35) or "Fail"      |

## API endpoints

| Method | Endpoint              | Description                              |
|--------|-----------------------|-------------------------------------------|
| GET    | `/api/students`      | List all records (supports `?q=` search) |
| GET    | `/api/students/<id>` | Get a single record                       |
| POST   | `/api/students`      | Add a new record                          |
| PUT    | `/api/students/<id>` | Update an existing record                  |
| DELETE | `/api/students/<id>` | Delete a record                           |

## Add / Edit / Delete flow (for review)

- **Add**: Clicking "New entry" reveals the form panel at the top of the page.
  Submitting it sends a `POST` request to `/api/students`. The backend
  calculates `percentage` and `status` from the entered marks, inserts the
  row into SQLite, and the frontend re-fetches and re-renders the ledger.

- **Edit**: Each row has an edit (pencil) icon. Clicking it opens the same
  form panel, pre-filled with that record's data, and stores the record's
  `id` in a hidden field. Submitting sends a `PUT` request to
  `/api/students/<id>`, which updates the row (recalculating percentage and
  status), and the ledger refreshes.

- **Delete**: Each row has a delete (trash) icon. Clicking it asks for
  confirmation, then sends a `DELETE` request to `/api/students/<id>`, which
  removes the row from SQLite. The ledger refreshes and the stats strip
  (total / pass / fail / average) updates automatically.

- **Search**: The search box at the top of the page filters the in-memory
  list of records on every keystroke (no extra request) by matching the
  student name, roll number, or subject. The "✕" button clears the search.

