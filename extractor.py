import os, glob, hashlib, psycopg2, shutil, urllib.parse, re
from bs4 import BeautifulSoup

DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL:
    conn = psycopg2.connect(DATABASE_URL)
else:
    conn = psycopg2.connect(dbname="exam_db", user="exam_user", password="password", host="127.0.0.1")
cur = conn.cursor()

RESULTS_DIR = os.path.expanduser("~/Downloads/Results/")
ASSETS_DIR = "./public/assets/"

def extract_questions_from_file(filepath):
    print(f"Parsing: {filepath}")
    with open(filepath, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f, 'html.parser')

    for katex in soup.find_all(class_='katex'):
        ann = katex.find('annotation')
        if ann:
            katex.replace_with(f"\\( {ann.text} \\) ")
        else:
            katex.decompose()
    for mj in soup.find_all(class_=lambda c: c and ('MathJax' in c or 'MJX' in c)):
        mj.decompose()
    for script in soup.find_all('script', type=lambda t: t and 'math/tex' in t):
        tex = script.text
        if 'display' in script.get('type', ''):
            script.replace_with(f"$$ {tex} $$")
        else:
            script.replace_with(f"\\( {tex} \\) ")

    sections = soup.find_all('div', class_='res_section')
    for section in sections:
        section_name = section.find('h2').text.strip()
        questions = section.find_all('div', class_='res_question')
        for q in questions:
            meta_spans = q.find('div', class_='res_qs_meta').find_all('span')
            q_num = meta_spans[0].text.strip()
            q_type = meta_spans[1].text.replace(' Type', '').strip()
            award = float(meta_spans[2].text.replace('Award:', '').strip())
            penalty = float(meta_spans[3].text.replace('Penalty:', '').strip())
            subject = meta_spans[4].text.strip()

            diff = 'Medium'
            diff_percentage = ''
            diff_badge = q.find('span', class_=lambda c: c and 'badge' in c and any(x in c for x in ('diff-easy', 'diff-medium', 'diff-hard')))
            if diff_badge:
                cls = diff_badge.get('class', [])
                if 'diff-easy' in cls: diff = 'Easy'
                elif 'diff-hard' in cls: diff = 'Hard'
                elif 'diff-medium' in cls: diff = 'Medium'
                title = diff_badge.get('title', '')
                m = re.search(r'(\d+)%', title)
                if m: diff_percentage = m.group(1)

            q_text_div = q.find('div', class_='res_question_text')
            for img in q_text_div.find_all('img'):
                src = img['src']
                if src.startswith('data:'):
                    continue
                # ---- fix: resolve the actual file path ----
                src_rel = urllib.parse.unquote(src)          # remove URL encoding
                src_rel = urllib.parse.urlparse(src_rel).path # strip query strings
                src_abs = os.path.join(os.path.dirname(filepath), src_rel)
                if os.path.exists(src_abs):
                    fname = os.path.basename(src_rel)
                    dest = os.path.join(ASSETS_DIR, fname)
                    shutil.copy(src_abs, dest)
                    img['src'] = f"/assets/{fname}"
                # -----------------------------------------
            html_content = str(q_text_div)

            sol = q.find('div', class_='res_solution')
            correct_ans = sol.find('span', class_='correct_solution').text.replace('Correct Answer:', '').strip()

            discuss_link = sol.find('a', class_='badge badge-primary', href=True)
            real_post_id = None
            if discuss_link:
                href = discuss_link['href']
                parts = href.rstrip('/').split('/')
                last = parts[-1]
                if last.isdigit():
                    real_post_id = last

            if real_post_id:
                cur.execute("SELECT id FROM questions WHERE real_post_id = %s", (real_post_id,))
                if cur.fetchone():
                    print(f"  Skipping duplicate question (GO#{real_post_id}) – already in bank.")
                    continue
            else:
                fallback_pid = hashlib.md5(html_content.encode()).hexdigest()[:12]
                cur.execute("SELECT id FROM questions WHERE post_id = %s", (fallback_pid,))
                if cur.fetchone():
                    continue

            cur.execute("""
                INSERT INTO questions (post_id, subject, question_type, html_content, positive_marks, negative_marks, difficulty, real_post_id, diff_percentage)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                RETURNING id
            """, (real_post_id or hashlib.md5(html_content.encode()).hexdigest()[:12], subject, q_type, html_content, award, penalty, diff, real_post_id, diff_percentage))
            q_id = cur.fetchone()[0]

            if q_type == "Multiple Choice":
                for opt in ['A', 'B', 'C', 'D']:
                    is_correct = (opt == correct_ans)
                    cur.execute("SELECT id FROM options WHERE question_id=%s AND option_label=%s", (q_id, opt))
                    if not cur.fetchone():
                        cur.execute("INSERT INTO options (question_id, option_label, is_correct) VALUES (%s,%s,%s)", (q_id, opt, is_correct))
            elif q_type == "Numerical":
                cur.execute("SELECT id FROM options WHERE question_id=%s AND option_label=%s", (q_id, 'NAT'))
                if not cur.fetchone():
                    cur.execute("INSERT INTO options (question_id, option_label, html_content, is_correct) VALUES (%s,%s,%s,%s)", (q_id, 'NAT', correct_ans, True))
    print(f"Finished processing {filepath}")

for f in glob.glob(os.path.join(RESULTS_DIR, "**/*.html"), recursive=True):
    extract_questions_from_file(f)

conn.commit()
cur.close()
conn.close()
print("Question bank extraction complete!")
