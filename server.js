const express = require('express');
const { Pool } = require('pg');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');
const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(session({ secret: process.env.SESSION_SECRET || 'bits-hd-cs-secret', resave: false, saveUninitialized: true }));
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ...(process.env.DATABASE_URL ? {} : {
        user: process.env.DB_USER || 'exam_user',
        host: process.env.DB_HOST || '127.0.0.1',
        database: process.env.DB_NAME || 'exam_db',
        password: process.env.DB_PASS || 'password',
        port: 5432,
    })
});
const requireLogin = (req, res, next) => {
    if (!req.session.user_id) return res.redirect('/login');
    next();
};
app.get('/', (req, res) => res.redirect('/login'));
app.get('/login', (req, res) => {
    res.render('login', { mode: 'login', error: req.query.err || null, success: null });
});
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await pool.query('SELECT id, password_hash FROM users WHERE username = $1', [username]);
        if (user.rows.length === 0) return res.redirect('/login?err=User+does+not+exist');
        const valid = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!valid) return res.redirect('/login?err=Invalid+password');
        req.session.user_id = user.rows[0].id;
        res.redirect('/home?msg=Welcome+back');
    } catch (e) { console.error(e); res.redirect('/login?err=Login+error'); }
});
app.get('/signup', (req, res) => {
    res.render('login', { mode: 'signup', error: req.query.err || null, success: null });
});
app.post('/signup', async (req, res) => {
    const { username, password, confirm_password } = req.body;
    if (password !== confirm_password) {
        return res.redirect('/signup?err=Passwords+do+not+match');
    }
    try {
        const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
        if (existing.rows.length > 0) return res.redirect('/signup?err=User+already+exists');
        const hash = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (username, password_hash) VALUES ($1,$2)', [username, hash]);
        req.session.user_id = (await pool.query('SELECT id FROM users WHERE username = $1', [username])).rows[0].id;
        res.redirect('/home?msg=Account+created');
    } catch (e) { console.error(e); res.redirect('/signup?err=Signup+error'); }
});
app.get('/home', requireLogin, async (req, res) => {
    const tests = await pool.query('SELECT * FROM tests ORDER BY id');
    const msg = req.query.msg || null;
    res.render('home', { tests: tests.rows, msg });
});
app.get('/dashboard/:test_id', requireLogin, async (req, res) => {
    const test_id = req.params.test_id;
    const user_id = req.session.user_id;
    const testInfo = await pool.query('SELECT * FROM tests WHERE id = $1', [test_id]);
    const stats = await pool.query(`
        SELECT COUNT(*) as total_takes, COALESCE(AVG(score),0) as avg_mark, COALESCE(MAX(score),0) as highest_mark
        FROM user_attempts WHERE test_id = $1
    `, [test_id]);
    const top10 = await pool.query(`
        SELECT COALESCE(AVG(score),0) as top_10_avg FROM (
            SELECT score FROM user_attempts WHERE test_id = $1 ORDER BY score DESC
            LIMIT GREATEST(1, (SELECT COUNT(*)::numeric/10 FROM user_attempts WHERE test_id=$1)::int)
        ) top_scores
    `, [test_id]);
    const heatmap = await pool.query(`
        SELECT q.id, tq.question_order, COALESCE(AVG(CASE WHEN ur.is_correct THEN 1 ELSE 0 END)*100,0) as accuracy
        FROM test_questions tq JOIN questions q ON tq.question_id = q.id
        LEFT JOIN user_responses ur ON q.id = ur.question_id
        WHERE tq.test_id = $1 GROUP BY q.id, tq.question_order ORDER BY tq.question_order
    `, [test_id]);
    const toppers = await pool.query(`
        SELECT u.username, ua.score, EXTRACT(EPOCH FROM (ua.end_time-ua.start_time))/60 as time_taken
        FROM user_attempts ua JOIN users u ON ua.user_id = u.id
        WHERE ua.test_id = $1 ORDER BY ua.score DESC, time_taken ASC LIMIT 10
    `, [test_id]);
    const myAttempts = await pool.query(`
        SELECT id, score, EXTRACT(EPOCH FROM (end_time-start_time))/60 as time_taken, start_time
        FROM user_attempts WHERE test_id=$1 AND user_id=$2 ORDER BY start_time DESC
    `, [test_id, user_id]);
    res.render('dashboard', {
        test: testInfo.rows[0] || {},
        stats: stats.rows[0],
        top10Avg: top10.rows[0].top_10_avg,
        heatmap: heatmap.rows,
        toppers: toppers.rows,
        myAttempts: myAttempts.rows
    });
});
app.get('/exam/:test_id', requireLogin, async (req, res) => {
    req.session.current_test_id = req.params.test_id;
    const testInfo = await pool.query('SELECT * FROM tests WHERE id=$1', [req.params.test_id]);
    res.render('exam', {
        test_id: req.params.test_id,
        test_name: testInfo.rows[0].title,
        duration_minutes: testInfo.rows[0].duration_minutes,
        total_marks: testInfo.rows[0].total_marks
    });
});
app.post('/resources/php/webapp.php', async (req, res) => {
    const fn = req.body.fn;
    const test_id = req.body.exam_id || req.session.current_test_id;
    const user_id = req.session.user_id;
    if (fn === 'RetrieveExamMetaInfo') {
        const t = await pool.query('SELECT * FROM tests WHERE id=$1', [test_id]);
        return res.json({ name: t.rows[0].title, duration: t.rows[0].duration_minutes, total_marks: t.rows[0].total_marks });
    }
    if (fn === 'RetrieveExamInfo') {
        const q_res = await pool.query(`
            SELECT q.*, tq.section_name FROM questions q
            JOIN test_questions tq ON q.id = tq.question_id
            WHERE tq.test_id = $1 ORDER BY tq.section_name, tq.question_order
        `, [test_id]);
        let sectionsMap = {};
        q_res.rows.forEach(q => {
            if (!sectionsMap[q.section_name]) sectionsMap[q.section_name] = [];
            sectionsMap[q.section_name].push({
                post_id: q.post_id,
                text: q.html_content,
                contents: q.html_content,
                award: q.positive_marks.toString(),
                penalty: q.negative_marks.toString(),
                type: q.question_type.replace(' Type',''),
                image: ""
            });
        });
        const openAttempt = await pool.query('SELECT id FROM user_attempts WHERE user_id=$1 AND test_id=$2 AND end_time IS NULL', [user_id, test_id]);
        return res.json({
            allow_resume: openAttempt.rows.length > 0 ? 1 : 0,
            num_options: 4,
            section: Object.keys(sectionsMap).map(sec => ({ name: sec, question: sectionsMap[sec] }))
        });
    }
    if (fn === 'SaveProgress') return res.json({ status: "success" });
    if (fn === 'SubmitResults') {
        const answers = JSON.parse(Buffer.from(req.body.post_response, 'base64').toString('utf8'));
        const postIds = JSON.parse(Buffer.from(req.body.post_postids, 'base64').toString('utf8'));
        const qtimetaken = JSON.parse(Buffer.from(req.body.post_qtimetaken, 'base64').toString('utf8'));
        let attempt = await pool.query('SELECT id FROM user_attempts WHERE user_id=$1 AND test_id=$2 AND end_time IS NULL ORDER BY start_time DESC LIMIT 1', [user_id, test_id]);
        if (attempt.rows.length === 0) {
            attempt = await pool.query('INSERT INTO user_attempts (user_id, test_id, end_time) VALUES ($1,$2,CURRENT_TIMESTAMP) RETURNING id', [user_id, test_id]);
        }
        const attempt_id = attempt.rows[0].id;
        let totalScore = 0;
        for (let i = 0; i < postIds.length; i++) {
            if (!postIds[i]) continue;
            const q = await pool.query('SELECT id, positive_marks, negative_marks, question_type FROM questions WHERE post_id=$1', [postIds[i]]);
            if (q.rows.length === 0) continue;
            const q_id = q.rows[0].id;
            let is_corr = false, marks = 0;
            if (q.rows[0].question_type === 'Numerical') {
                const opt = await pool.query('SELECT html_content FROM options WHERE question_id=$1 AND is_correct=TRUE', [q_id]);
                if (answers[i] !== null && answers[i] !== '' && answers[i] !== '0') {
                    const correct = parseFloat(opt.rows[0].html_content);
                    const user = parseFloat(answers[i]);
                    is_corr = Math.abs(user - correct) < 0.01;
                    marks = is_corr ? q.rows[0].positive_marks : -Math.abs(q.rows[0].negative_marks);
                }
            } else {
                const opt = await pool.query('SELECT option_label FROM options WHERE question_id=$1 AND is_correct=TRUE', [q_id]);
                const letterMap = { '1':'A', '2':'B', '3':'C', '4':'D' };
                const userAnsLetter = letterMap[answers[i]] || answers[i];
                if (answers[i] === null || answers[i] === '0' || answers[i] === 0) {
                    marks = 0;
                } else if (opt.rows.length > 0 && userAnsLetter === opt.rows[0].option_label) {
                    is_corr = true; marks = q.rows[0].positive_marks;
                } else {
                    marks = -Math.abs(q.rows[0].negative_marks);
                }
            }
            totalScore += marks;
            await pool.query(
                'INSERT INTO user_responses (attempt_id, question_id, selected_answer, time_spent_seconds, is_correct, marks_awarded) VALUES ($1,$2,$3,$4,$5,$6)',
                [attempt_id, q_id, answers[i], Math.round(qtimetaken[i]/1000), is_corr, marks]
            );
        }
        await pool.query('UPDATE user_attempts SET score=$1, end_time=CURRENT_TIMESTAMP WHERE id=$2', [totalScore, attempt_id]);
        return res.json({ resultid: attempt_id, status: "success" });
    }
    res.json({ status:'ok' });
});
app.post('/results.php', async (req, res) => {
    const attempt_id = req.body.resultid || req.body.res_exam_id;
    if (!attempt_id) return res.redirect('/home');
    const attempt = await pool.query('SELECT * FROM user_attempts WHERE id=$1', [attempt_id]);
    if (attempt.rows.length === 0) return res.redirect('/home');
    const test = await pool.query('SELECT * FROM tests WHERE id=$1', [attempt.rows[0].test_id]);
    const responses = await pool.query(`
        SELECT ur.*, q.html_content, q.positive_marks, q.negative_marks, q.question_type, q.subject, q.difficulty, q.real_post_id, q.diff_percentage,
               tq.section_name, tq.question_order,
               (SELECT option_label FROM options WHERE question_id=q.id AND is_correct=TRUE LIMIT 1) as correct_option
        FROM user_responses ur
        JOIN questions q ON ur.question_id = q.id
        JOIN test_questions tq ON q.id = tq.question_id AND tq.test_id=$1
        WHERE ur.attempt_id=$2 ORDER BY tq.section_name, tq.question_order
    `, [test.rows[0].id, attempt_id]);
    let correct=0, incorrect=0, skipped=0, time=0, correctMarks=0, penaltyMarks=0;
    const subjStats = {};
    responses.rows.forEach(r => {
        time += r.time_spent_seconds || 0;
        if (r.selected_answer === null || r.selected_answer === '0' || r.selected_answer === '') skipped++;
        else if (r.is_correct) { correct++; correctMarks += r.positive_marks; }
        else { incorrect++; penaltyMarks += Math.abs(r.negative_marks); }
        const subj = r.subject || 'General';
        if (!subjStats[subj]) subjStats[subj] = { total_questions:0, total_marks:0, total_correct_questions:0, total_attempted_questions:0, total_attempted_marks:0, total_correct_marks:0, total_penalty_marks:0, total_free_questions:0, total_free_marks:0 };
        subjStats[subj].total_questions++;
        subjStats[subj].total_marks += r.positive_marks;
        if (r.is_correct) { subjStats[subj].total_correct_questions++; subjStats[subj].total_correct_marks += r.positive_marks; subjStats[subj].total_attempted_questions++; subjStats[subj].total_attempted_marks += r.positive_marks; }
        else if (r.selected_answer === null || r.selected_answer === '0' || r.selected_answer === '') { subjStats[subj].total_skipped = (subjStats[subj].total_skipped||0)+1; }
        else { subjStats[subj].total_attempted_questions++; subjStats[subj].total_attempted_marks += r.positive_marks; subjStats[subj].total_penalty_marks += Math.abs(r.negative_marks); }
    });
    res.render('results', {
        test: test.rows[0],
        attempt: attempt.rows[0],
        responses: responses.rows,
        stats: { correct, incorrect, skipped, time: Math.round(time/60), correctMarks, penaltyMarks, netMarks: (correctMarks - penaltyMarks).toFixed(2) },
        subjStats
    });
});
app.listen(3000, () => console.log('BITS HD CS Test Series running on http://localhost:3000'));
