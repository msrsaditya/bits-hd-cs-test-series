CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'student'
);
CREATE TABLE tests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    duration_minutes INT NOT NULL,
    total_marks FLOAT NOT NULL,
    num_options INT DEFAULT 4
);
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    post_id VARCHAR(50) UNIQUE,
    subject VARCHAR(255),
    question_type VARCHAR(50),
    html_content TEXT NOT NULL,
    positive_marks FLOAT NOT NULL,
    negative_marks FLOAT NOT NULL,
    difficulty VARCHAR(50) DEFAULT 'Medium',
    real_post_id VARCHAR(20),
    diff_percentage VARCHAR(10)
);
CREATE TABLE options (
    id SERIAL PRIMARY KEY,
    question_id INT REFERENCES questions(id) ON DELETE CASCADE,
    option_label VARCHAR(10),
    html_content TEXT,
    is_correct BOOLEAN DEFAULT FALSE
);
CREATE TABLE test_questions (
    test_id INT REFERENCES tests(id) ON DELETE CASCADE,
    question_id INT REFERENCES questions(id) ON DELETE CASCADE,
    section_name VARCHAR(100),
    question_order INT,
    PRIMARY KEY (test_id, question_id)
);
CREATE TABLE user_attempts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    test_id INT REFERENCES tests(id),
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    score FLOAT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Completed'
);
CREATE TABLE user_responses (
    id SERIAL PRIMARY KEY,
    attempt_id INT REFERENCES user_attempts(id) ON DELETE CASCADE,
    question_id INT REFERENCES questions(id),
    selected_answer TEXT,
    time_spent_seconds INT DEFAULT 0,
    is_correct BOOLEAN DEFAULT FALSE,
    marks_awarded FLOAT DEFAULT 0
);
