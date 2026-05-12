import psycopg2, random
conn = psycopg2.connect(dbname="exam_db", user="exam_user", password="password", host="127.0.0.1")
cur = conn.cursor()
print("Clearing existing data...")
cur.execute("DELETE FROM user_responses")
cur.execute("DELETE FROM user_attempts")
cur.execute("DELETE FROM test_questions")
cur.execute("DELETE FROM tests")
print("Updating marking scheme to +3 / -1 for all questions...")
cur.execute("UPDATE questions SET positive_marks = 3.0, negative_marks = 1.0")
test_subjects = {
    'Core Mathematics': ['Calculus', 'Linear Algebra', 'Probability'],
    'English & LR': ['Verbal Aptitude', 'Analytical Aptitude', 'Quantitative Aptitude', 'Spatial Aptitude'],
    'Computer Science': [
        'Set Theory & Algebra', 'Combinatory', 'Graph Theory', 'Mathematical Logic',
        'Data Structures', 'Algorithms', 'Operating System', 'Databases',
        'Computer Networks', 'Digital Logic', 'Programming in C'
    ]
}
cur.execute("SELECT id, subject, difficulty FROM questions")
rows = cur.fetchall()
print(f"Total questions in bank: {len(rows)}")
pools = {'math': [], 'english_lr': [], 'cs': []}
difficulty = {}
for q_id, subj, diff in rows:
    dif = diff if diff in ('Easy','Medium','Hard') else 'Medium'
    difficulty[q_id] = dif
    if subj in test_subjects['Core Mathematics']:
        pools['math'].append(q_id)
    elif subj in test_subjects['English & LR']:
        pools['english_lr'].append(q_id)
    elif subj in test_subjects['Computer Science']:
        pools['cs'].append(q_id)
print("\nUsable question pools for BITS HD tests:")
for cat in ['math','english_lr','cs']:
    print(f"  {cat}: {len(pools[cat])}")
REQ_MATH = 15
REQ_ENGLISH_LR = 15
REQ_CS = 70
random.seed(42)
for key in pools:
    random.shuffle(pools[key])
max_tests = min(
    len(pools['math']) // REQ_MATH,
    len(pools['english_lr']) // REQ_ENGLISH_LR,
    len(pools['cs']) // REQ_CS
)
print(f"\nMaximum unique tests that can be built: {max_tests}")
used_in_unique = set()
test_counter = 1
for test_idx in range(1, max_tests + 1):
    m_chunk = pools['math'][(test_idx-1)*REQ_MATH : test_idx*REQ_MATH]
    elr_chunk = pools['english_lr'][(test_idx-1)*REQ_ENGLISH_LR : test_idx*REQ_ENGLISH_LR]
    cs_chunk = pools['cs'][(test_idx-1)*REQ_CS : test_idx*REQ_CS]
    selected = m_chunk + elr_chunk + cs_chunk
    total_marks = len(selected) * 3
    duration = 150
    cur.execute(
        "INSERT INTO tests (title, duration_minutes, total_marks) VALUES (%s,%s,%s) RETURNING id",
        (f"BITS HD CS Test {test_counter}", duration, total_marks)
    )
    tid = cur.fetchone()[0]
    sections = {'Section 1': m_chunk + elr_chunk, 'Section 2': cs_chunk}
    order = 1
    for broad in ('Section 1', 'Section 2'):
        for qid in sections[broad]:
            cur.execute(
                "INSERT INTO test_questions (test_id, question_id, section_name, question_order) VALUES (%s,%s,%s,%s)",
                (tid, qid, broad, order)
            )
            order += 1
    used_in_unique.update(selected)
    print(f"✅ Unique test #{tid}: {len(selected)} questions (300 marks)")
    test_counter += 1
all_ids = set(pools['math'] + pools['english_lr'] + pools['cs'])
leftovers = all_ids - used_in_unique
left_pools = {'math': [], 'english_lr': [], 'cs': []}
for qid in leftovers:
    if qid in pools['math']:
        left_pools['math'].append(qid)
    elif qid in pools['english_lr']:
        left_pools['english_lr'].append(qid)
    else:
        left_pools['cs'].append(qid)
recyclable_pools = {'math': [], 'english_lr': [], 'cs': []}
for qid in used_in_unique:
    if difficulty[qid] in ('Medium', 'Hard'):
        if qid in pools['math']:
            recyclable_pools['math'].append(qid)
        elif qid in pools['english_lr']:
            recyclable_pools['english_lr'].append(qid)
        else:
            recyclable_pools['cs'].append(qid)
random.seed(2024)
for cat in recyclable_pools:
    random.shuffle(recyclable_pools[cat])
print("\n--- After unique tests ---")
for cat in ['math','english_lr','cs']:
    print(f"  {cat:15s}: leftovers {len(left_pools[cat]):3d} | recyclable (≥Medium) {len(recyclable_pools[cat]):3d}")
while True:
    enough = True
    for cat, req in [('math', REQ_MATH), ('english_lr', REQ_ENGLISH_LR), ('cs', REQ_CS)]:
        if len(left_pools[cat]) + len(recyclable_pools[cat]) < req:
            enough = False
            break
    if not enough:
        break
    selected = []
    used_left = {}
    used_recy = {}
    for cat, req in [('math', REQ_MATH), ('english_lr', REQ_ENGLISH_LR), ('cs', REQ_CS)]:
        take_left = min(req, len(left_pools[cat]))
        take_recy = req - take_left
        left_sel = random.sample(left_pools[cat], take_left) if take_left else []
        recy_sel = random.sample(recyclable_pools[cat], take_recy) if take_recy else []
        selected += left_sel + recy_sel
        used_left[cat] = take_left
        used_recy[cat] = take_recy
        for qid in left_sel:
            left_pools[cat].remove(qid)
        for qid in recy_sel:
            recyclable_pools[cat].remove(qid)
    total_marks = len(selected) * 3
    cur.execute(
        "INSERT INTO tests (title, duration_minutes, total_marks) VALUES (%s,%s,%s) RETURNING id",
        (f"BITS HD CS Test {test_counter} (Generated)", 150, total_marks)
    )
    tid = cur.fetchone()[0]
    testI_ids = [q for q in selected if q in pools['math'] or q in pools['english_lr']]
    testII_ids = [q for q in selected if q in pools['cs']]
    sections = {'Section 1': testI_ids, 'Section 2': testII_ids}
    order = 1
    for broad in ('Section 1', 'Section 2'):
        for qid in sections[broad]:
            cur.execute(
                "INSERT INTO test_questions (test_id, question_id, section_name, question_order) VALUES (%s,%s,%s,%s)",
                (tid, qid, broad, order)
            )
            order += 1
    print(f"✅ Generated test #{tid}: {len(selected)} questions (300 marks)")
    print(f"     Leftovers used:  math {used_left['math']}, english_lr {used_left['english_lr']}, cs {used_left['cs']}")
    print(f"     Recycled used:   math {used_recy['math']}, english_lr {used_recy['english_lr']}, cs {used_recy['cs']}")
    test_counter += 1
print("\n=== Final leftover summary ===")
for cat in ['math','english_lr','cs']:
    print(f"  {cat}: {len(left_pools[cat])} leftover, {len(recyclable_pools[cat])} recyclable (≥Medium)")
cur.execute("SELECT COUNT(*) FROM tests")
total_tests = cur.fetchone()[0]
print(f"\nTotal tests in database: {total_tests}")
conn.commit()
cur.close()
conn.close()
print("\nAll tests generated successfully.")
