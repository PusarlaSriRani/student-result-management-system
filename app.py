"""
Student Result Management System - Backend
Flask + SQLite REST API serving the frontend (index.html, style.css, script.js)
"""

import os
import sqlite3
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'database.db')
PASS_MARK = 35  # minimum marks (out of 100) required to pass a subject

app = Flask(__name__, static_folder=BASE_DIR, static_url_path='')
CORS(app)


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_name TEXT NOT NULL,
            roll_no TEXT NOT NULL,
            subject TEXT NOT NULL,
            marks INTEGER NOT NULL,
            percentage REAL NOT NULL,
            status TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()


def calc_percentage_and_status(marks):
    """Marks are taken out of 100, so percentage == marks.
    Status is Pass if marks meet the minimum pass mark."""
    marks = float(marks)
    percentage = round(marks, 2)
    status = 'Pass' if marks >= PASS_MARK else 'Fail'
    return percentage, status


def row_to_dict(row):
    return {
        'id': row['id'],
        'student_name': row['student_name'],
        'roll_no': row['roll_no'],
        'subject': row['subject'],
        'marks': row['marks'],
        'percentage': row['percentage'],
        'status': row['status'],
    }


def validate_payload(data):
    required = ['student_name', 'roll_no', 'subject', 'marks']
    for field in required:
        if field not in data or data[field] in (None, ''):
            return f"'{field}' is required"

    try:
        marks = float(data['marks'])
    except (TypeError, ValueError):
        return "'marks' must be a number"

    if marks < 0 or marks > 100:
        return "'marks' must be between 0 and 100"

    return None


# ---------------------------------------------------------------------------
# Static frontend routes
# ---------------------------------------------------------------------------
@app.route('/')
def serve_index():
    return send_from_directory(BASE_DIR, 'index.html')


@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(BASE_DIR, filename)


# ---------------------------------------------------------------------------
# API routes - CRUD + Search
# ---------------------------------------------------------------------------
@app.route('/api/students', methods=['GET'])
def get_students():
    """List all students, or search via ?q= (matches name, roll no, subject)."""
    query = request.args.get('q', '').strip()
    conn = get_db()

    if query:
        like = f'%{query}%'
        rows = conn.execute(
            '''SELECT * FROM students
               WHERE student_name LIKE ? OR roll_no LIKE ? OR subject LIKE ?
               ORDER BY id DESC''',
            (like, like, like)
        ).fetchall()
    else:
        rows = conn.execute('SELECT * FROM students ORDER BY id DESC').fetchall()

    conn.close()
    return jsonify([row_to_dict(r) for r in rows])


@app.route('/api/students/<int:student_id>', methods=['GET'])
def get_student(student_id):
    conn = get_db()
    row = conn.execute('SELECT * FROM students WHERE id = ?', (student_id,)).fetchone()
    conn.close()

    if row is None:
        return jsonify({'error': 'Student record not found'}), 404
    return jsonify(row_to_dict(row))


@app.route('/api/students', methods=['POST'])
def add_student():
    data = request.get_json(silent=True) or {}
    error = validate_payload(data)
    if error:
        return jsonify({'error': error}), 400

    percentage, status = calc_percentage_and_status(data['marks'])

    conn = get_db()
    cur = conn.execute(
        '''INSERT INTO students (student_name, roll_no, subject, marks, percentage, status)
           VALUES (?, ?, ?, ?, ?, ?)''',
        (data['student_name'].strip(), data['roll_no'].strip(),
         data['subject'].strip(), int(data['marks']), percentage, status)
    )
    conn.commit()
    new_id = cur.lastrowid
    row = conn.execute('SELECT * FROM students WHERE id = ?', (new_id,)).fetchone()
    conn.close()

    return jsonify(row_to_dict(row)), 201


@app.route('/api/students/<int:student_id>', methods=['PUT'])
def update_student(student_id):
    data = request.get_json(silent=True) or {}
    error = validate_payload(data)
    if error:
        return jsonify({'error': error}), 400

    conn = get_db()
    existing = conn.execute('SELECT * FROM students WHERE id = ?', (student_id,)).fetchone()
    if existing is None:
        conn.close()
        return jsonify({'error': 'Student record not found'}), 404

    percentage, status = calc_percentage_and_status(data['marks'])

    conn.execute(
        '''UPDATE students
           SET student_name = ?, roll_no = ?, subject = ?, marks = ?, percentage = ?, status = ?
           WHERE id = ?''',
        (data['student_name'].strip(), data['roll_no'].strip(),
         data['subject'].strip(), int(data['marks']), percentage, status, student_id)
    )
    conn.commit()
    row = conn.execute('SELECT * FROM students WHERE id = ?', (student_id,)).fetchone()
    conn.close()

    return jsonify(row_to_dict(row))


@app.route('/api/students/<int:student_id>', methods=['DELETE'])
def delete_student(student_id):
    conn = get_db()
    existing = conn.execute('SELECT * FROM students WHERE id = ?', (student_id,)).fetchone()
    if existing is None:
        conn.close()
        return jsonify({'error': 'Student record not found'}), 404

    conn.execute('DELETE FROM students WHERE id = ?', (student_id,))
    conn.commit()
    conn.close()

    return jsonify({'message': 'Student record deleted'}), 200


# ---------------------------------------------------------------------------
if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)