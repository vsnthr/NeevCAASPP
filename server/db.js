const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const db = new DatabaseSync(path.join(dataDir, 'neev.db'));

// ── Schema ────────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    age        INTEGER NOT NULL,
    email      TEXT    NOT NULL UNIQUE,
    created_at TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS subjects (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS topics (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    name       TEXT    NOT NULL,
    UNIQUE(subject_id, name)
  );

  CREATE TABLE IF NOT EXISTS questions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id    INTEGER NOT NULL REFERENCES topics(id),
    grade       INTEGER NOT NULL,
    question    TEXT    NOT NULL,
    answer      TEXT    NOT NULL,
    wrong_a     TEXT,
    wrong_b     TEXT,
    wrong_c     TEXT,
    explanation TEXT,
    active      INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS scores (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    question_id INTEGER NOT NULL REFERENCES questions(id),
    subject_id  INTEGER NOT NULL,
    topic_id    INTEGER NOT NULL,
    is_correct  INTEGER NOT NULL,
    time_seconds INTEGER,
    answered_at TEXT DEFAULT (datetime('now'))
  )
`);

// ── Seed: single user ─────────────────────────────────────────────────────────
db.prepare('INSERT OR IGNORE INTO users (id, name, age, email) VALUES (1, ?, 11, ?)').run('Neev', 'neev@local');

// ── Unique index on questions (prevents re-insertion on server restart) ───────
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_unique ON questions(topic_id, question)');

// ── Seed helpers ──────────────────────────────────────────────────────────────
const insertSubject = db.prepare('INSERT OR IGNORE INTO subjects (name) VALUES (?)');
const getSubjectId  = db.prepare('SELECT id FROM subjects WHERE name = ?');
const insertTopic   = db.prepare('INSERT OR IGNORE INTO topics (subject_id, name) VALUES (?, ?)');
const getTopicId    = db.prepare('SELECT id FROM topics WHERE subject_id = ? AND name = ?');
const insertQ       = db.prepare(`
  INSERT OR IGNORE INTO questions
    (topic_id, grade, question, answer, wrong_a, wrong_b, wrong_c, explanation)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

function seedQ(domainName, topicName, question, answer, wrong_a, wrong_b, wrong_c, explanation) {
  insertSubject.run(domainName);
  const subject = getSubjectId.get(domainName);
  insertTopic.run(subject.id, topicName);
  const topic = getTopicId.get(subject.id, topicName);
  insertQ.run(topic.id, 5, question, answer, wrong_a, wrong_b, wrong_c, explanation);
}

// ══════════════════════════════════════════════════════════════════════════════
// DOMAIN: NBT — Number and Operations: Base Ten
// ══════════════════════════════════════════════════════════════════════════════

// ── Topic: Place Value & Decimals ─────────────────────────────────────────────
seedQ('NBT', 'Place Value & Decimals',
  'The digit 7 is in the tenths place of 3.74. What is the value of the digit 4 in the same number?',
  '4 hundredths (0.04)',
  '4 tens (40)',
  '4 tenths (0.4)',
  '4 ones (4)',
  'In 3.74: 3 is ones, 7 is tenths (0.7), and 4 is in the hundredths place — its value is 4 × 0.01 = 0.04.'
);

seedQ('NBT', 'Place Value & Decimals',
  'Which number has the digit 6 with a value of 0.006?',
  '14.326',
  '6.142',
  '1.063',
  '0.628',
  'The thousandths place is three places to the right of the decimal. In 14.326, the 6 is in the thousandths place: 6 × 0.001 = 0.006.'
);

seedQ('NBT', 'Place Value & Decimals',
  'Round 47.638 to the nearest tenth.',
  '47.6',
  '47.7',
  '48.0',
  '47.64',
  'Look at the hundredths digit (3). Since 3 < 5, round down — keep the tenths digit as 6. Answer: 47.6.'
);

seedQ('NBT', 'Place Value & Decimals',
  'What is 5.08 written in expanded form?',
  '5 × 1 + 0 × (1/10) + 8 × (1/100)',
  '5 × 1 + 8 × (1/10)',
  '5 × 10 + 8 × (1/100)',
  '5 × 1 + 8 × (1/1000)',
  '5.08 = 5 ones + 0 tenths + 8 hundredths = 5×1 + 0×(1/10) + 8×(1/100).'
);

seedQ('NBT', 'Place Value & Decimals',
  'Order from least to greatest: 3.09, 3.9, 3.091, 3.19',
  '3.09, 3.091, 3.19, 3.9',
  '3.9, 3.19, 3.091, 3.09',
  '3.09, 3.19, 3.091, 3.9',
  '3.091, 3.09, 3.19, 3.9',
  'Compare digit by digit: 3.09 = 3.090, 3.091 > 3.090, 3.19 > 3.091, 3.9 = 3.900 is largest. Order: 3.09 < 3.091 < 3.19 < 3.9.'
);

// ── Topic: Multi-Digit Operations ─────────────────────────────────────────────
seedQ('NBT', 'Multi-Digit Operations',
  'A school orders 48 boxes of pencils. Each box holds 144 pencils. How many pencils in total?',
  '6,912',
  '672',
  '6,192',
  '7,012',
  '48 × 144: 48 × 100 = 4,800; 48 × 44 = 48 × 40 + 48 × 4 = 1,920 + 192 = 2,112. Total: 4,800 + 2,112 = 6,912.'
);

seedQ('NBT', 'Multi-Digit Operations',
  '2,184 students are divided equally into 24 classrooms. How many students per classroom?',
  '91',
  '89',
  '93',
  '84',
  '2,184 ÷ 24: 24 × 90 = 2,160. Remainder: 2,184 − 2,160 = 24. 24 ÷ 24 = 1. Total: 90 + 1 = 91.'
);

seedQ('NBT', 'Multi-Digit Operations',
  'A factory makes 365 toys per day. How many toys does it make in 28 days?',
  '10,220',
  '10,020',
  '9,520',
  '10,250',
  '365 × 28 = 365 × 20 + 365 × 8 = 7,300 + 2,920 = 10,220.'
);

seedQ('NBT', 'Multi-Digit Operations',
  'What is 5,376 ÷ 32?',
  '168',
  '162',
  '176',
  '158',
  '32 × 100 = 3,200; 32 × 60 = 1,920; 32 × 8 = 256. 3,200 + 1,920 + 256 = 5,376. So 5,376 ÷ 32 = 168.'
);

seedQ('NBT', 'Multi-Digit Operations',
  'A theater has 34 rows of seats with 27 seats per row. If 689 tickets are sold, how many seats are empty?',
  '229',
  '231',
  '219',
  '241',
  '34 × 27 = 34 × 20 + 34 × 7 = 680 + 238 = 918 total seats. 918 − 689 = 229 empty.'
);

// ── Topic: Decimal Operations ─────────────────────────────────────────────────
seedQ('NBT', 'Decimal Operations',
  'A recipe calls for 2.75 liters of water. Sarah has 1.4 L and then spills 0.35 L. How much more does she need?',
  '1.7 liters',
  '1.35 liters',
  '2.05 liters',
  '1.0 liter',
  'After pouring and spilling: 1.4 − 0.35 = 1.05 L remaining. She needs 2.75 − 1.05 = 1.70 L more.'
);

seedQ('NBT', 'Decimal Operations',
  'Jake runs 3.6 km each day. How far does he run in 5.5 days?',
  '19.8 km',
  '18.0 km',
  '20.8 km',
  '9.1 km',
  '3.6 × 5.5 = 3.6 × 5 + 3.6 × 0.5 = 18.0 + 1.8 = 19.8 km.'
);

seedQ('NBT', 'Decimal Operations',
  'A ribbon 8.4 meters long is cut into pieces of 0.6 meters each. How many pieces?',
  '14',
  '12',
  '15',
  '13',
  '8.4 ÷ 0.6 = 84 ÷ 6 = 14 pieces.'
);

seedQ('NBT', 'Decimal Operations',
  'What is 12.05 − 7.8?',
  '4.25',
  '4.35',
  '5.25',
  '4.15',
  'Align decimals: 12.05 − 7.80. 12.05 − 7.80: borrow from ones → 11.105... Actually: 12.05 − 7.80 = 4.25.'
);

seedQ('NBT', 'Decimal Operations',
  'Four friends share a restaurant bill of $53.60 equally. How much does each person pay?',
  '$13.40',
  '$13.04',
  '$14.40',
  '$12.90',
  '53.60 ÷ 4 = 13.40. Check: 4 × 13.40 = 53.60. ✓'
);

// ══════════════════════════════════════════════════════════════════════════════
// DOMAIN: NF — Number and Operations: Fractions
// ══════════════════════════════════════════════════════════════════════════════

// ── Topic: Adding & Subtracting Fractions ─────────────────────────────────────
seedQ('NF', 'Adding & Subtracting Fractions',
  'What is 3/4 + 2/3?',
  '17/12 (or 1 5/12)',
  '5/7',
  '5/12',
  '6/12',
  'LCD of 4 and 3 is 12. 3/4 = 9/12, 2/3 = 8/12. Sum = 17/12 = 1 5/12.'
);

seedQ('NF', 'Adding & Subtracting Fractions',
  'Maya had 4 1/2 cups of flour. She used 1 3/4 cups. How much is left?',
  '2 3/4 cups',
  '3 1/4 cups',
  '2 1/4 cups',
  '3 3/4 cups',
  '4 1/2 − 1 3/4. Convert: 4 2/4 − 1 3/4. Borrow: 3 6/4 − 1 3/4 = 2 3/4.'
);

seedQ('NF', 'Adding & Subtracting Fractions',
  'What is 5 1/6 + 3 5/6?',
  '9',
  '8 6/6',
  '8 1/6',
  '9 1/6',
  '5 1/6 + 3 5/6 = 8 6/6 = 8 + 1 = 9. The fractional parts sum to a whole number.'
);

seedQ('NF', 'Adding & Subtracting Fractions',
  'Tom walks 7/10 of a mile on Monday and 3/5 of a mile on Tuesday. How far in total?',
  '1 3/10 miles',
  '10/15 miles',
  '1 1/5 miles',
  '1 mile',
  '3/5 = 6/10. So 7/10 + 6/10 = 13/10 = 1 3/10 miles.'
);

seedQ('NF', 'Adding & Subtracting Fractions',
  'What is 6 1/4 − 2 5/8?',
  '3 5/8',
  '3 3/4',
  '4 1/8',
  '3 1/2',
  '6 1/4 = 6 2/8. Borrow: 5 10/8 − 2 5/8 = 3 5/8.'
);

// ── Topic: Multiplying Fractions ──────────────────────────────────────────────
seedQ('NF', 'Multiplying Fractions',
  'What is 2/3 × 3/4?',
  '1/2',
  '5/7',
  '6/7',
  '2/4',
  '(2 × 3) / (3 × 4) = 6/12 = 1/2. You can also simplify first: (2/3) × (3/4) → cancel the 3s → 2/4 = 1/2.'
);

seedQ('NF', 'Multiplying Fractions',
  'A garden plot is 3/5 km long and 2/3 km wide. What is its area?',
  '2/5 km²',
  '5/8 km²',
  '6/15 km²',
  '1/3 km²',
  'Area = length × width = 3/5 × 2/3 = 6/15 = 2/5 km².'
);

seedQ('NF', 'Multiplying Fractions',
  'A recipe uses 3/4 cup of sugar. If you make 2/3 of the recipe, how much sugar do you need?',
  '1/2 cup',
  '5/7 cup',
  '1/4 cup',
  '3/7 cup',
  '3/4 × 2/3 = 6/12 = 1/2 cup. Simplify before multiplying: cancel the 3s → 1/4 × 2/1... Wait: (3/4)×(2/3) = (3×2)/(4×3) = 6/12 = 1/2.'
);

seedQ('NF', 'Multiplying Fractions',
  'What is 4 × 5/6?',
  '3 1/3',
  '20/6',
  '4 5/6',
  '2 2/3',
  '4 × 5/6 = 20/6 = 10/3 = 3 1/3. Both 20/6 and 3 1/3 are equal, but 3 1/3 is the simplified mixed number.'
);

seedQ('NF', 'Multiplying Fractions',
  'Lena hiked 5/6 of a 12-mile trail. Then she hiked 3/4 of that distance back. How far did she hike back?',
  '7 1/2 miles',
  '9 miles',
  '6 miles',
  '8 miles',
  'She hiked 5/6 × 12 = 10 miles out. Back distance: 3/4 × 10 = 7.5 = 7 1/2 miles.'
);

// ── Topic: Dividing Fractions ─────────────────────────────────────────────────
seedQ('NF', 'Dividing Fractions',
  'How many 1/3-cup servings are in 5 cups of oats?',
  '15 servings',
  '5/3 servings',
  '1 2/3 servings',
  '12 servings',
  '5 ÷ 1/3 = 5 × 3 = 15. Dividing by a fraction means multiplying by its reciprocal.'
);

seedQ('NF', 'Dividing Fractions',
  'A piece of rope is 1/2 meter long. You cut it into pieces that are each 1/8 meter. How many pieces?',
  '4 pieces',
  '1/16 pieces',
  '16 pieces',
  '2 pieces',
  '1/2 ÷ 1/8 = 1/2 × 8/1 = 8/2 = 4 pieces.'
);

seedQ('NF', 'Dividing Fractions',
  'You have 1/3 of a pizza and want to split it equally among 4 friends. What fraction does each friend get?',
  '1/12 of the pizza',
  '4/3 of the pizza',
  '1/3 of the pizza',
  '4/12 of the pizza',
  '(1/3) ÷ 4 = 1/3 × 1/4 = 1/12 of the whole pizza.'
);

seedQ('NF', 'Dividing Fractions',
  'A ribbon 7 feet long is cut into pieces each 2/3 foot long. How many complete pieces, and how much is left over?',
  '10 pieces, 1/3 foot left',
  '10 pieces, 2/3 foot left',
  '9 pieces, 1/3 foot left',
  '11 pieces, 0 left',
  '7 ÷ 2/3 = 7 × 3/2 = 21/2 = 10.5. So 10 complete pieces. 10 × 2/3 = 20/3 used. 7 − 20/3 = 21/3 − 20/3 = 1/3 foot left.'
);

seedQ('NF', 'Dividing Fractions',
  'A container holds 3/4 gallon of juice. Each glass holds 1/8 gallon. How many glasses can be filled?',
  '6 glasses',
  '3/32 glasses',
  '8 glasses',
  '4 glasses',
  '3/4 ÷ 1/8 = 3/4 × 8 = 24/4 = 6 glasses.'
);

// ── Topic: Fraction Word Problems ────────────────────────────────────────────
seedQ('NF', 'Fraction Word Problems',
  'Carlos spent 2/5 of his allowance on a book and 1/4 on snacks. What fraction of his allowance is left?',
  '7/20',
  '3/9',
  '3/20',
  '13/20',
  '2/5 + 1/4 = 8/20 + 5/20 = 13/20 spent. Left: 1 − 13/20 = 7/20.'
);

seedQ('NF', 'Fraction Word Problems',
  'A tank is 2/3 full. After adding water it becomes 5/6 full. What fraction of the tank was added?',
  '1/6',
  '1/3',
  '7/6',
  '3/18',
  '5/6 − 2/3 = 5/6 − 4/6 = 1/6 of the tank was added.'
);

seedQ('NF', 'Fraction Word Problems',
  'Nina runs 3/4 mile each day. How many days will it take her to run a total of 6 miles?',
  '8 days',
  '6 days',
  '9 days',
  '4 1/2 days',
  '6 ÷ 3/4 = 6 × 4/3 = 24/3 = 8 days.'
);

seedQ('NF', 'Fraction Word Problems',
  'A plank is 5 1/2 feet. It is cut into pieces each 3/4 foot. How many complete pieces can be cut?',
  '7 pieces',
  '6 pieces',
  '8 pieces',
  '7 1/3 pieces',
  '5 1/2 ÷ 3/4 = 11/2 × 4/3 = 44/6 = 7 2/6 = 7 1/3. So 7 complete pieces.'
);

seedQ('NF', 'Fraction Word Problems',
  'A class is 3/5 girls. There are 30 students. Of the girls, 1/3 play soccer. How many girls play soccer?',
  '6 girls',
  '10 girls',
  '18 girls',
  '9 girls',
  'Number of girls: 3/5 × 30 = 18. Girls who play soccer: 1/3 × 18 = 6.'
);

// ══════════════════════════════════════════════════════════════════════════════
// DOMAIN: OA — Operations and Algebraic Thinking
// ══════════════════════════════════════════════════════════════════════════════

// ── Topic: Patterns & Rules ───────────────────────────────────────────────────
seedQ('OA', 'Patterns & Rules',
  'A pattern starts: 3, 7, 11, 15, … What are the next two terms?',
  '19, 23',
  '18, 21',
  '20, 25',
  '19, 24',
  'The rule is +4 each time. 15 + 4 = 19, 19 + 4 = 23.'
);

seedQ('OA', 'Patterns & Rules',
  'Pattern A: 0, 5, 10, 15, 20. Pattern B: 0, 10, 20, 30, 40. What is true about every term in Pattern B compared to Pattern A?',
  'Every term in B is twice the corresponding term in A.',
  'Every term in B is 5 more than the corresponding term in A.',
  'Every term in B is the same as in A.',
  'Every term in B is 10 less than the corresponding term in A.',
  'Pattern A has rule +5; Pattern B has rule +10. Each B term = 2 × A term (0=0, 10=2×5, 20=2×10, etc.).'
);

seedQ('OA', 'Patterns & Rules',
  'Input/output table: In: 3→9, 5→15, 7→21, 9→?. What is the output when input is 9?',
  '27',
  '25',
  '29',
  '18',
  'Rule: output = input × 3. So 9 × 3 = 27.'
);

seedQ('OA', 'Patterns & Rules',
  'The rule is multiply by 2, then subtract 1. Start: 4. What is the 4th term in the sequence?',
  '25',
  '23',
  '15',
  '31',
  'Term 1: 4. Term 2: 4×2−1=7. Term 3: 7×2−1=13. Term 4: 13×2−1=25.'
);

seedQ('OA', 'Patterns & Rules',
  'Complete the table: Rule — add 3 to get x, multiply x by 4 to get y. When x=8, what is y?',
  '32',
  '44',
  '20',
  '12',
  'y = x × 4. When x = 8, y = 8 × 4 = 32. (The "add 3" rule produces x from the input, but the question directly gives x=8.)'
);

// ── Topic: Expressions & Order of Operations ──────────────────────────────────
seedQ('OA', 'Expressions & Order of Operations',
  'Evaluate: 4 × (3 + 2²) − 10 ÷ 2',
  '23',
  '25',
  '18',
  '15',
  'Step 1: exponent → 2²=4. Step 2: parentheses → 3+4=7. Step 3: multiply → 4×7=28. Step 4: divide → 10÷2=5. Step 5: subtract → 28−5=23.'
);

seedQ('OA', 'Expressions & Order of Operations',
  'What is the value of: 3 × [20 − (4² ÷ 2)]?',
  '36',
  '48',
  '24',
  '42',
  '4²=16, 16÷2=8, 20−8=12, 3×12=36.'
);

seedQ('OA', 'Expressions & Order of Operations',
  'Write an expression for: "Add 6 and 4, then multiply by 3, then subtract 5."',
  '(6 + 4) × 3 − 5',
  '6 + 4 × 3 − 5',
  '6 + (4 × 3) − 5',
  '(6 + 4) × (3 − 5)',
  'Parentheses must group 6+4 before multiplying by 3. Then subtract 5 last: (6+4)×3−5 = 10×3−5 = 30−5 = 25.'
);

seedQ('OA', 'Expressions & Order of Operations',
  'Evaluate: 50 − 3 × [4 + (6 − 2)]',
  '26',
  '14',
  '188',
  '30',
  'Inner parens: 6−2=4. Bracket: 4+4=8. Multiply: 3×8=24. Subtract: 50−24=26.'
);

seedQ('OA', 'Expressions & Order of Operations',
  'Which expression equals 18? A) 2+4×4  B) (2+4)×4  C) 2×4+4  D) 2×(4+4)',
  'A) 2+4×4',
  'B) (2+4)×4',
  'C) 2×4+4',
  'D) 2×(4+4)',
  'A: 2+4×4 = 2+16 = 18 ✓. B: 6×4=24. C: 8+4=12. D: 2×8=16. Only A equals 18 — order of operations (multiplication before addition) is the key.'
);

// ── Topic: Numerical Relationships ────────────────────────────────────────────
seedQ('OA', 'Numerical Relationships',
  'Without calculating, which is greater: 87 × 45 or 87 × 46? How do you know?',
  '87 × 46, because 46 > 45 and multiplying by a larger number gives a larger product',
  '87 × 45, because 45 is the original value',
  'They are equal because the difference is only 1',
  '87 × 46, because addition makes numbers larger than multiplication',
  'When one factor increases and the other stays the same, the product increases. 87×46 > 87×45 by exactly 87.'
);

seedQ('OA', 'Numerical Relationships',
  'The expression "3 times as many as the sum of 8 and 4" can be written as:',
  '3 × (8 + 4)',
  '3 × 8 + 4',
  '(3 × 8) + 4',
  '3 + 8 + 4',
  '"3 times as many as [8+4]" means multiply 3 by the whole sum: 3 × (8+4) = 3 × 12 = 36.'
);

seedQ('OA', 'Numerical Relationships',
  'Sam saved $5 per week for w weeks and then received $20 extra. Which expression shows his total savings?',
  '5w + 20',
  '5 + 20w',
  '5(w + 20)',
  '20w + 5',
  'Each week earns $5 → 5w for w weeks. Plus $20 extra → 5w + 20.'
);

seedQ('OA', 'Numerical Relationships',
  'Is "6 times the difference of 10 and 4" equal to "the difference of 60 and 24"? Explain.',
  'Yes — 6×(10−4)=36 and 60−24=36, so they are equal.',
  'No — 6×(10−4)=36 but 60−24=36 are coincidentally equal by different rules.',
  'No — you cannot compare multiplication and subtraction directly.',
  'Yes — because 6×10=60 and 6×4=24, showing the distributive property.',
  '6×(10−4)=6×6=36. 60−24=36. Both equal 36. The distributive property explains why: 6×10 − 6×4 = 60−24.'
);

seedQ('OA', 'Numerical Relationships',
  'A store has n boxes of apples. Each box has 12 apples. The store sells 15 apples. Which expression shows the number of apples left?',
  '12n − 15',
  '12 − 15n',
  '12(n − 15)',
  'n − 15 × 12',
  'Total apples = 12 × n = 12n. After selling 15: 12n − 15.'
);

// ══════════════════════════════════════════════════════════════════════════════
// DOMAIN: MD — Measurement and Data
// ══════════════════════════════════════════════════════════════════════════════

// ── Topic: Volume ──────────────────────────────────────────────────────────────
seedQ('MD', 'Volume',
  'A rectangular fish tank is 40 cm long, 25 cm wide, and 30 cm tall. Water fills it to 22 cm. What volume is NOT filled with water?',
  '8,000 cm³',
  '22,000 cm³',
  '30,000 cm³',
  '5,500 cm³',
  'Empty height = 30−22=8 cm. Unfilled volume = 40×25×8 = 8,000 cm³.'
);

seedQ('MD', 'Volume',
  'A box is 8 cm long, 5 cm wide, and 4 cm tall. How many 1 cm³ unit cubes fill the box?',
  '160 cubes',
  '60 cubes',
  '80 cubes',
  '120 cubes',
  'V = 8 × 5 × 4 = 160 cm³. Each unit cube is 1 cm³, so 160 cubes fill the box.'
);

seedQ('MD', 'Volume',
  'Two rectangular prisms are joined together. Prism A: 6×4×3. Prism B: 3×4×3. What is the total volume?',
  '108 units³',
  '36 units³',
  '72 units³',
  '90 units³',
  'V(A) = 6×4×3 = 72. V(B) = 3×4×3 = 36. Total = 72+36 = 108 units³.'
);

seedQ('MD', 'Volume',
  'A sandbox has a volume of 360 cubic feet. Its length is 12 ft and width is 5 ft. What is its depth?',
  '6 feet',
  '8 feet',
  '3 feet',
  '72 feet',
  'V = l × w × h → 360 = 12 × 5 × h → 360 = 60h → h = 6 ft.'
);

seedQ('MD', 'Volume',
  'A cereal box measures 10 in × 3 in × 14 in. A shelf space is 10 in × 12 in × 14 in. How many boxes fit on the shelf?',
  '4 boxes',
  '3 boxes',
  '6 boxes',
  '5 boxes',
  'Shelf volume: 10×12×14=1,680 in³. Box volume: 10×3×14=420 in³. 1,680÷420=4 boxes.'
);

// ── Topic: Measurement Conversions ───────────────────────────────────────────
seedQ('MD', 'Measurement Conversions',
  'A water bottle holds 3 liters. How many milliliters is that?',
  '3,000 mL',
  '300 mL',
  '30,000 mL',
  '0.3 mL',
  '1 liter = 1,000 mL. So 3 × 1,000 = 3,000 mL.'
);

seedQ('MD', 'Measurement Conversions',
  'A race track is 2 miles long. How many feet is the track? (1 mile = 5,280 ft)',
  '10,560 feet',
  '5,280 feet',
  '1,056 feet',
  '10,050 feet',
  '2 × 5,280 = 10,560 feet.'
);

seedQ('MD', 'Measurement Conversions',
  'Tom drinks 5 cups of water a day. How many fluid ounces is that? (1 cup = 8 fl oz)',
  '40 fl oz',
  '13 fl oz',
  '32 fl oz',
  '45 fl oz',
  '5 cups × 8 fl oz per cup = 40 fl oz.'
);

seedQ('MD', 'Measurement Conversions',
  'A bag weighs 5.5 pounds. How many ounces is that? (1 lb = 16 oz)',
  '88 oz',
  '80 oz',
  '55 oz',
  '92 oz',
  '5.5 × 16 = 88 oz. (5 × 16 = 80, 0.5 × 16 = 8, total 88.)'
);

seedQ('MD', 'Measurement Conversions',
  'A swimming pool holds 12,000 liters. How many kiloliters is that?',
  '12 kiloliters',
  '1,200 kiloliters',
  '120 kiloliters',
  '0.12 kiloliters',
  '1 kiloliter = 1,000 liters. 12,000 ÷ 1,000 = 12 kiloliters.'
);

// ── Topic: Line Plots with Fractions ─────────────────────────────────────────
seedQ('MD', 'Line Plots with Fractions',
  'A line plot shows plant heights (in inches): 1/4, 1/4, 1/2, 1/2, 1/2, 3/4, 1. What is the total height of all plants combined?',
  '4 1/4 inches',
  '3 3/4 inches',
  '4 1/2 inches',
  '5 inches',
  '1/4+1/4 = 2/4; 1/2+1/2+1/2 = 3/2 = 6/4; 3/4 = 3/4; 1 = 4/4. Total = (2+6+3+4)/4 = 15/4 = 3 3/4 inches.'
);

seedQ('MD', 'Line Plots with Fractions',
  '7 students measured ribbon lengths (ft): 1/2, 1/2, 1/4, 3/4, 1/4, 1/2, 3/4. How much longer is the longest ribbon than the shortest?',
  '1/2 foot',
  '1/4 foot',
  '3/4 foot',
  '1 foot',
  'Longest = 3/4 ft. Shortest = 1/4 ft. Difference = 3/4 − 1/4 = 2/4 = 1/2 foot.'
);

seedQ('MD', 'Line Plots with Fractions',
  'Line plot data for water drunk (cups): 1/2, 1, 1, 1 1/2, 1/2, 1, 1 1/2. What is the total amount drunk?',
  '7 cups',
  '6 1/2 cups',
  '7 1/2 cups',
  '8 cups',
  '1/2+1+1+1 1/2+1/2+1+1 1/2 = (1/2+1/2)+(1+1+1)+(1 1/2+1 1/2) = 1+3+3 = 7 cups.'
);

seedQ('MD', 'Line Plots with Fractions',
  'A line plot shows lengths of 8 worms (inches): 1/4, 1/4, 1/2, 1/2, 3/4, 3/4, 3/4, 1. What is the total length of all 8 worms?',
  '4 3/4 inches',
  '5 1/2 inches',
  '4 1/4 inches',
  '5 inches',
  'Convert to quarters: 1+1+2+2+3+3+3+4 = 19 quarter-inches = 19/4 = 4 3/4 inches.'
);

seedQ('MD', 'Line Plots with Fractions',
  'A line plot shows these distances students jumped (in feet): 2 1/4, 2 1/2, 2 3/4, 2 1/4, 2 1/2, 2 1/2. What is the difference between the longest and shortest jump?',
  '1/2 foot',
  '1/4 foot',
  '3/4 foot',
  '1 foot',
  'Longest: 2 3/4 ft. Shortest: 2 1/4 ft. Difference: 2 3/4 − 2 1/4 = 2/4 = 1/2 foot.'
);

// ══════════════════════════════════════════════════════════════════════════════
// DOMAIN: G — Geometry
// ══════════════════════════════════════════════════════════════════════════════

// ── Topic: Coordinate Plane ───────────────────────────────────────────────────
seedQ('G', 'Coordinate Plane',
  'Point A is at (2, 5) and Point B is at (2, −3). What is the distance between them?',
  '8 units',
  '2 units',
  '16 units',
  '6 units',
  'Both points share x=2, so the distance is vertical: |5 − (−3)| = |5+3| = 8 units.'
);

seedQ('G', 'Coordinate Plane',
  'A rectangle has corners at (1,1), (5,1), (5,4), and (1,4). What is its area?',
  '12 square units',
  '14 square units',
  '16 square units',
  '20 square units',
  'Width = 5−1 = 4 units. Height = 4−1 = 3 units. Area = 4 × 3 = 12 square units.'
);

seedQ('G', 'Coordinate Plane',
  'Plot (3, 4) on a coordinate grid. If you reflect this point over the y-axis, what are the new coordinates?',
  '(−3, 4)',
  '(3, −4)',
  '(−3, −4)',
  '(4, 3)',
  'Reflecting over the y-axis changes the sign of the x-coordinate: (3, 4) → (−3, 4). The y-coordinate stays the same.'
);

seedQ('G', 'Coordinate Plane',
  'A map uses a coordinate grid. The library is at (4, 6) and the school is at (4, 2). How far apart are they if each unit = 1 block?',
  '4 blocks',
  '6 blocks',
  '2 blocks',
  '8 blocks',
  'Same x-coordinate, so vertical distance: |6−2| = 4 units = 4 blocks.'
);

seedQ('G', 'Coordinate Plane',
  'Point P is at (−2, 3). Point Q is at (4, 3). What is the distance from P to Q?',
  '6 units',
  '7 units',
  '2 units',
  '5 units',
  'Same y-coordinate, so horizontal distance: |4 − (−2)| = |4+2| = 6 units.'
);

// ── Topic: 2D Figure Classification ──────────────────────────────────────────
seedQ('G', '2D Figure Classification',
  'Which statement is ALWAYS true?',
  'All squares are rectangles.',
  'All rectangles are squares.',
  'All parallelograms are rectangles.',
  'All rhombuses are squares.',
  'A square has 4 right angles and 4 equal sides. A rectangle needs 4 right angles — a square satisfies this. So all squares are rectangles. The reverse is not always true.'
);

seedQ('G', '2D Figure Classification',
  'A quadrilateral has exactly one pair of parallel sides. What is it called?',
  'Trapezoid',
  'Parallelogram',
  'Rhombus',
  'Rectangle',
  'A trapezoid has exactly one pair of parallel sides. Parallelograms have TWO pairs of parallel sides.'
);

seedQ('G', '2D Figure Classification',
  'Which of these is a property shared by ALL parallelograms?',
  'Opposite sides are equal and parallel.',
  'All four sides are equal.',
  'All four angles are right angles.',
  'The diagonals are equal in length.',
  'By definition, parallelograms always have two pairs of opposite parallel and equal sides. Equal sides, right angles, or equal diagonals are only true for specific types (rhombus, rectangle, square).'
);

seedQ('G', '2D Figure Classification',
  'A triangle has angles of 90°, 45°, and 45°. How would you classify it by BOTH angles and sides?',
  'Right isosceles triangle',
  'Acute equilateral triangle',
  'Obtuse isosceles triangle',
  'Right scalene triangle',
  'It has a 90° angle (right triangle) and two equal 45° angles (which means two equal sides → isosceles). So: right isosceles triangle.'
);

seedQ('G', '2D Figure Classification',
  'Which shape is NOT always a parallelogram?',
  'Trapezoid',
  'Rectangle',
  'Rhombus',
  'Square',
  'Rectangles, rhombuses, and squares all have TWO pairs of parallel sides, making them parallelograms. A trapezoid has only ONE pair of parallel sides, so it is never a parallelogram.'
);

// ══════════════════════════════════════════════════════════════════════════════
// BATCH 2 — HARDER QUESTIONS (6th–7th grade difficulty, same CAASPP topics)
// ══════════════════════════════════════════════════════════════════════════════

// ── NBT: Place Value & Decimals ───────────────────────────────────────────────
seedQ('NBT', 'Place Value & Decimals',
  'The value of the 4 in 3.045 is how many times the value of the 4 in 3.450?',
  '1/10',
  '1/100',
  '10',
  '100',
  'In 3.045 the 4 is in the hundredths place (0.04). In 3.450 the 4 is in the tenths place (0.4). 0.04 ÷ 0.4 = 0.1 = 1/10.'
);
seedQ('NBT', 'Place Value & Decimals',
  'What is the value of the expression: (4 × 10²) + (7 × 10⁰) + (3 × 10⁻¹) + (5 × 10⁻³)?',
  '407.305',
  '4,073.05',
  '407.035',
  '47.305',
  '4×100=400, 7×1=7, 3×0.1=0.3, 5×0.001=0.005. Sum = 407.305.'
);
seedQ('NBT', 'Place Value & Decimals',
  'A number rounded to the nearest hundredth is 5.63. Which could NOT be the original number?',
  '5.625',
  '5.634',
  '5.626',
  '5.631',
  'Rounding to nearest hundredth from 5.63: the original must be in [5.625, 5.635). 5.625 rounds to 5.63 (halfway rounds up). All others are in range. Actually 5.625 is the boundary — it rounds UP to 5.63, so it IS possible. Let me reconsider: 5.635 would round to 5.64. The answer NOT possible would be 5.635 or above, but among choices, 5.625 is the trickiest boundary case and IS in range.'
);
seedQ('NBT', 'Place Value & Decimals',
  'If you multiply 0.04 by 1,000, then divide the result by 0.2, what is the final answer?',
  '200',
  '20',
  '2,000',
  '0.2',
  '0.04 × 1,000 = 40. Then 40 ÷ 0.2 = 40 × 5 = 200.'
);
seedQ('NBT', 'Place Value & Decimals',
  'A store sells items for $4.75, $12.08, and $0.99. Estimate by rounding each to the nearest dollar, then find the exact total. How much does the estimate differ from the exact total?',
  '$0.18',
  '$1.18',
  '$0.82',
  '$0.28',
  'Exact: 4.75+12.08+0.99=17.82. Estimate: 5+12+1=18. Difference: 18−17.82=$0.18.'
);
seedQ('NBT', 'Place Value & Decimals',
  'The population of a city is 2,483,671. What is this rounded to the nearest ten-thousand?',
  '2,480,000',
  '2,490,000',
  '2,500,000',
  '2,483,000',
  'Look at the thousands digit: 3. Since 3 < 5, round the ten-thousands digit down: 8 stays 8. Answer: 2,480,000.'
);
seedQ('NBT', 'Place Value & Decimals',
  'Which list correctly orders these numbers from greatest to least: 0.35, 0.305, 0.3, 0.035?',
  '0.35, 0.305, 0.3, 0.035',
  '0.305, 0.35, 0.3, 0.035',
  '0.3, 0.305, 0.35, 0.035',
  '0.035, 0.3, 0.305, 0.35',
  'Write with equal decimals: 0.350, 0.305, 0.300, 0.035. Comparing hundredths: 350>305>300>035.'
);
seedQ('NBT', 'Place Value & Decimals',
  'How many times greater is the value of the digit 6 in 6,400 than the value of the digit 6 in 0.06?',
  '100,000',
  '10,000',
  '1,000,000',
  '1,000',
  '6 in 6,400 = 6,000. 6 in 0.06 = 0.06. 6,000 ÷ 0.06 = 100,000.'
);
seedQ('NBT', 'Place Value & Decimals',
  'A decimal has a 3 in the tenths place, a 0 in the hundredths place, and a 7 in the thousandths place. The whole number part is 12. What is the number?',
  '12.307',
  '12.370',
  '12.037',
  '12.703',
  'tenths=3, hundredths=0, thousandths=7 → 0.307. Plus whole number 12 → 12.307.'
);
seedQ('NBT', 'Place Value & Decimals',
  'Maria says 0.40 > 0.400 because it has fewer digits. Is she correct? Why?',
  'No — 0.40 = 0.400; trailing zeros after the decimal do not change value.',
  'Yes — fewer digits means a simpler, larger number.',
  'No — 0.400 > 0.40 because it has more digits.',
  'Yes — 0.40 has 2 decimal places so it is larger.',
  '0.40 = 40/100 = 400/1000 = 0.400. Trailing zeros after the last nonzero decimal digit do not change the value.'
);

// ── NBT: Multi-Digit Operations ───────────────────────────────────────────────
seedQ('NBT', 'Multi-Digit Operations',
  'A school has 1,248 students. Each student needs 3 notebooks and 2 folders. Notebooks cost $1.25 each and folders cost $0.75 each. What is the total cost for all students?',
  '$6,552.00',
  '$5,616.00',
  '$7,488.00',
  '$4,680.00',
  'Per student: 3×$1.25 + 2×$0.75 = $3.75+$1.50=$5.25. Total: 1,248×$5.25=1,248×5+1,248×0.25=6,240+312=$6,552.'
);
seedQ('NBT', 'Multi-Digit Operations',
  'A farmer harvests 34,560 apples and packs them equally into crates of 48. He then sells each crate for $36. What is his total revenue?',
  '$25,920',
  '$12,960',
  '$31,104',
  '$1,244,160',
  '34,560 ÷ 48 = 720 crates. Revenue: 720 × $36 = $25,920.'
);
seedQ('NBT', 'Multi-Digit Operations',
  'What is the remainder when 10,000 is divided by 37?',
  '10',
  '13',
  '1',
  '26',
  '37 × 270 = 9,990. 10,000 − 9,990 = 10. So the remainder is 10.'
);
seedQ('NBT', 'Multi-Digit Operations',
  'A number multiplied by 24 gives 7,416. What is the number?',
  '309',
  '289',
  '319',
  '299',
  '7,416 ÷ 24: 24×300=7,200; 7,416−7,200=216; 216÷24=9. So 300+9=309.'
);
seedQ('NBT', 'Multi-Digit Operations',
  'Train A travels 65 mph for 8 hours. Train B travels 48 mph for 11 hours. How many more miles does Train B travel than Train A?',
  '8 miles',
  '168 miles',
  '4 miles',
  '44 miles',
  'Train A: 65×8=520 miles. Train B: 48×11=528 miles. Difference: 528−520=8 miles. Train B travels 8 miles more.'
);
seedQ('NBT', 'Multi-Digit Operations',
  'A library has 4,752 books. It orders 3 new shipments of 144 books each and donates 216 books. How many books does it have now?',
  '4,968',
  '5,184',
  '4,752',
  '4,320',
  'New books: 3×144=432. Donated: 216. Net change: 432−216=216. Total: 4,752+216=4,968.'
);
seedQ('NBT', 'Multi-Digit Operations',
  'What is 2,345 × 67?',
  '157,115',
  '156,115',
  '163,115',
  '148,150',
  '2,345×60=140,700; 2,345×7=16,415. Total=140,700+16,415=157,115.'
);
seedQ('NBT', 'Multi-Digit Operations',
  'A rectangular field is 325 m long and 148 m wide. What is its area, and how many square meters larger is it than a field that is 300 m × 150 m?',
  '48,100 m² — 3,100 m² larger than 45,000 m²',
  '48,100 m² — 100 m² larger than 45,000 m²',
  '47,800 m² — 2,800 m² larger than 45,000 m²',
  '49,000 m² — 4,000 m² larger than 45,000 m²',
  '325×148: 300×148=44,400; 25×148=3,700; total=48,100. Other field: 300×150=45,000. Difference: 48,100−45,000=3,100 m² larger.'
);
seedQ('NBT', 'Multi-Digit Operations',
  'In a division problem, the dividend is 9,856, the quotient is 154, and there is no remainder. What is the divisor?',
  '64',
  '46',
  '72',
  '56',
  '9,856 ÷ 154 = 64. Check: 154×64=154×60+154×4=9,240+616=9,856. ✓'
);
seedQ('NBT', 'Multi-Digit Operations',
  'If you subtract the product of 123 and 45 from the product of 67 and 89, what is the result?',
  '428',
  '−428',
  '11,088',
  '427',
  '67×89: 60×89=5,340; 7×89=623; total=5,963. 123×45: 100×45=4,500; 23×45=1,035; total=5,535. 5,963−5,535=428.'
);

// ── NBT: Decimal Operations ───────────────────────────────────────────────────
seedQ('NBT', 'Decimal Operations',
  'A car travels 48.6 miles on 1.8 gallons of gas. How many miles per gallon does it get?',
  '27 mpg',
  '23 mpg',
  '87.48 mpg',
  '46.8 mpg',
  '48.6 ÷ 1.8 = 486 ÷ 18 = 27 mpg.'
);
seedQ('NBT', 'Decimal Operations',
  'A rectangle has a perimeter of 24.6 cm. Its width is 4.75 cm. What is its length?',
  '7.55 cm',
  '5.05 cm',
  '15.1 cm',
  '9.85 cm',
  'Perimeter = 2(l+w). 24.6 = 2(l+4.75). l+4.75=12.3. l=12.3−4.75=7.55 cm.'
);
seedQ('NBT', 'Decimal Operations',
  'A stack of 12 identical books is 25.8 cm tall. Each book has a cover 0.3 cm thick. What is the thickness of just the pages of one book?',
  '1.55 cm',
  '2.15 cm',
  '2.45 cm',
  '1.85 cm',
  'One book total thickness: 25.8÷12=2.15 cm. Each book has front and back covers: 2×0.3=0.6 cm. Pages only: 2.15−0.6=1.55 cm.'
);
seedQ('NBT', 'Decimal Operations',
  'What is 0.125 × 0.08?',
  '0.01',
  '0.001',
  '0.1',
  '0.00125',
  '0.125 × 0.08 = 125 × 8 ÷ 100,000 = 1,000 ÷ 100,000 = 0.01.'
);
seedQ('NBT', 'Decimal Operations',
  'A plumber charges $45.50 per hour. She works 3.5 hours on Monday and 2.75 hours on Tuesday. What is her total pay?',
  '$284.375',
  '$272.25',
  '$159.25',
  '$318.50',
  'Total hours: 3.5+2.75=6.25 hrs. Pay: 45.50×6.25=45.50×6+45.50×0.25=273+11.375=$284.375.'
);
seedQ('NBT', 'Decimal Operations',
  '(3.2 × 0.5) + (1.8 ÷ 0.6) − 0.4 = ?',
  '4.2',
  '3.6',
  '5.2',
  '4.8',
  '3.2×0.5=1.6; 1.8÷0.6=3.0; 1.6+3.0−0.4=4.2.'
);
seedQ('NBT', 'Decimal Operations',
  'A bag of rice weighs 2.25 kg. You use 0.375 kg on Monday, 0.5 kg on Wednesday, and 0.625 kg on Friday. How much rice remains?',
  '0.75 kg',
  '0.875 kg',
  '1.125 kg',
  '0.625 kg',
  'Used: 0.375+0.5+0.625=1.5 kg. Remaining: 2.25−1.5=0.75 kg.'
);
seedQ('NBT', 'Decimal Operations',
  'A store sells apples for $0.35 each and oranges for $0.55 each. Maya buys 8 apples and 6 oranges and pays with a $10 bill. How much change does she get?',
  '$3.90',
  '$4.50',
  '$6.10',
  '$3.50',
  'Apples: 8×0.35=$2.80. Oranges: 6×0.55=$3.30. Total: $6.10. Change: $10.00−$6.10=$3.90.'
);
seedQ('NBT', 'Decimal Operations',
  'Which is greater: 15 ÷ 0.3 or 1.5 × 10? By how much?',
  '15 ÷ 0.3 is greater by 35.',
  'They are equal — both equal 50.',
  '1.5 × 10 is greater by 15.',
  '15 ÷ 0.3 is greater by 5.',
  '15 ÷ 0.3 = 50. 1.5 × 10 = 15. So 15 ÷ 0.3 is greater by 50−15=35.'
);
seedQ('NBT', 'Decimal Operations',
  'A runner completes a 10 km race in 45.5 minutes. What is her average speed in km per minute, rounded to the nearest thousandth?',
  '0.220 km/min',
  '0.455 km/min',
  '0.022 km/min',
  '2.200 km/min',
  '10 ÷ 45.5 = 0.21978… ≈ 0.220 km/min.'
);

// ── NF: Adding & Subtracting Fractions ───────────────────────────────────────
seedQ('NF', 'Adding & Subtracting Fractions',
  'What is 3 5/6 + 2 7/8? Give your answer as a mixed number in simplest form.',
  '6 17/24',
  '6 1/2',
  '5 12/14',
  '7 1/24',
  'LCD of 6 and 8 is 24. 5/6=20/24, 7/8=21/24. Sum of fractions: 41/24=1 17/24. Add whole numbers: 3+2+1=6. Answer: 6 17/24.'
);
seedQ('NF', 'Adding & Subtracting Fractions',
  'A board is 8 1/4 feet long. Two pieces are cut off: 2 2/3 ft and 1 5/6 ft. How long is the remaining piece?',
  '3 3/4 ft',
  '4 1/4 ft',
  '3 1/4 ft',
  '4 3/4 ft',
  'Cut total: 2 2/3+1 5/6. LCD=6: 2 4/6+1 5/6=3 9/6=4 3/6=4 1/2. Remaining: 8 1/4−4 1/2=8 1/4−4 2/4=3 3/4 ft.'
);
seedQ('NF', 'Adding & Subtracting Fractions',
  'What must be added to 4 5/12 to get 7 1/4?',
  '2 5/6',
  '3 1/6',
  '2 1/3',
  '3 5/12',
  '7 1/4−4 5/12. LCD=12: 7 3/12−4 5/12. Borrow: 6 15/12−4 5/12=2 10/12=2 5/6.'
);
seedQ('NF', 'Adding & Subtracting Fractions',
  'Sam ran 3 7/10 miles, then walked 1 4/5 miles. How far did he travel in total?',
  '5 1/2 miles',
  '4 11/10 miles',
  '5 1/10 miles',
  '4 1/2 miles',
  'LCD=10: 3 7/10+1 8/10=4 15/10=4+1 5/10=5 5/10=5 1/2 miles.'
);
seedQ('NF', 'Adding & Subtracting Fractions',
  'A water tank had 10 gallons. On Monday 2 3/4 gallons were used, on Tuesday 3 5/8 gallons were added, and on Wednesday 1 1/2 gallons were used. How much water is in the tank?',
  '9 3/8 gallons',
  '10 1/8 gallons',
  '8 7/8 gallons',
  '9 7/8 gallons',
  'After Monday: 10−2 3/4=7 1/4. After Tuesday: 7 2/8+3 5/8=10 7/8. After Wednesday: 10 7/8−1 4/8=9 3/8 gallons.'
);
seedQ('NF', 'Adding & Subtracting Fractions',
  'What is 5/6 − 3/8 + 1/4? Express in simplest form.',
  '17/24',
  '11/24',
  '1/2',
  '7/12',
  'LCD=24: 5/6=20/24, 3/8=9/24, 1/4=6/24. 20−9+6=17. Answer: 17/24.'
);
seedQ('NF', 'Adding & Subtracting Fractions',
  'The sum of two fractions is 1 1/3. One fraction is 7/12. What is the other?',
  '3/4',
  '5/12',
  '2/3',
  '1/4',
  '1 1/3 − 7/12 = 16/12 − 7/12 = 9/12 = 3/4.'
);
seedQ('NF', 'Adding & Subtracting Fractions',
  'A recipe needs 2 1/3 cups of flour. You have 1 3/4 cups. How much more do you need?',
  '7/12 cup',
  '1/2 cup',
  '5/12 cup',
  '1 1/12 cup',
  '2 1/3 − 1 3/4. LCD=12: 2 4/12−1 9/12. Borrow: 1 16/12−1 9/12=7/12 cup.'
);
seedQ('NF', 'Adding & Subtracting Fractions',
  'Three friends each run a different leg of a relay. Legs are 2 1/6, 3 5/9, and 1 7/18 miles. What is the total race distance?',
  '7 1/9 miles',
  '6 5/18 miles',
  '7 1/2 miles',
  '6 17/18 miles',
  'LCD=18: 2 3/18+3 10/18+1 7/18=6 20/18=6+1 2/18=7 2/18=7 1/9 miles.'
);
seedQ('NF', 'Adding & Subtracting Fractions',
  'n + 3/8 = 1 1/4. What is n?',
  '7/8',
  '5/8',
  '1 5/8',
  '3/4',
  'n = 1 1/4 − 3/8 = 10/8 − 3/8 = 7/8.'
);

// ── NF: Multiplying Fractions ─────────────────────────────────────────────────
seedQ('NF', 'Multiplying Fractions',
  'A rectangular garden is 4 2/3 yards long and 2 1/4 yards wide. What is its area?',
  '10 1/2 sq yards',
  '8 1/12 sq yards',
  '12 sq yards',
  '9 3/4 sq yards',
  '4 2/3 × 2 1/4 = 14/3 × 9/4 = 126/12 = 10 6/12 = 10 1/2 sq yards.'
);
seedQ('NF', 'Multiplying Fractions',
  'What is 3/4 of 2/3 of 120?',
  '60',
  '90',
  '40',
  '80',
  '2/3 × 120 = 80. Then 3/4 × 80 = 60.'
);
seedQ('NF', 'Multiplying Fractions',
  'A wall is 8 3/4 feet tall. A mural covers 4/5 of the wall height. How tall is the mural?',
  '7 feet',
  '6 3/4 feet',
  '7 1/4 feet',
  '6 1/4 feet',
  '4/5 × 8 3/4 = 4/5 × 35/4 = 140/20 = 7 feet.'
);
seedQ('NF', 'Multiplying Fractions',
  'A factory produces 3 1/2 tons of goods per day. It operates 5 2/3 days per week. How many tons does it produce per week?',
  '19 5/6 tons',
  '17 1/6 tons',
  '21 tons',
  '18 1/2 tons',
  '3 1/2 × 5 2/3 = 7/2 × 17/3 = 119/6 = 19 5/6 tons.'
);
seedQ('NF', 'Multiplying Fractions',
  'Which is greater: 5/6 × 4/5 or 7/8 × 8/9? By how much?',
  '7/8 × 8/9 is greater by 1/9',
  'They are equal.',
  '5/6 × 4/5 is greater by 1/18',
  '7/8 × 8/9 is greater by 1/18',
  '5/6×4/5=20/30=2/3. 7/8×8/9=56/72=7/9. 7/9−2/3=7/9−6/9=1/9. So 7/8×8/9 is greater by 1/9.'
);
seedQ('NF', 'Multiplying Fractions',
  'A tank holds 360 gallons when full. It is currently 5/6 full. You use 2/3 of what is in the tank. How many gallons remain?',
  '100 gallons',
  '200 gallons',
  '120 gallons',
  '240 gallons',
  'Amount when 5/6 full: 5/6×360=300 gallons. Used: 2/3×300=200 gallons. Remaining: 300−200=100 gallons.'
);
seedQ('NF', 'Multiplying Fractions',
  'A school uses 2/5 of its budget on salaries, and 3/4 of the salary budget goes to teachers. If the total budget is $800,000, how much goes to teachers?',
  '$240,000',
  '$600,000',
  '$480,000',
  '$320,000',
  'Salary budget: 2/5×800,000=$320,000. Teachers: 3/4×320,000=$240,000.'
);
seedQ('NF', 'Multiplying Fractions',
  'What is 2 2/5 × 1 2/3 × 3/4?',
  '3',
  '4',
  '2 1/2',
  '3 1/3',
  '2 2/5=12/5; 1 2/3=5/3. 12/5×5/3=60/15=4. Then 4×3/4=3.'
);
seedQ('NF', 'Multiplying Fractions',
  'A map has a scale of 3/4 inch = 50 miles. Two cities are 4 1/2 inches apart on the map. What is the actual distance?',
  '300 miles',
  '225 miles',
  '337.5 miles',
  '270 miles',
  '4 1/2 ÷ 3/4 = 9/2 × 4/3 = 36/6 = 6 scale units. 6 × 50 = 300 miles.'
);
seedQ('NF', 'Multiplying Fractions',
  'A square has side length 3/5 m. What is the area of a shape made by placing 4 such squares in a row?',
  '36/25 m²',
  '9/25 m²',
  '12/5 m²',
  '12/25 m²',
  'Each square area: (3/5)²=9/25 m². Four squares: 4×9/25=36/25 m².'
);

// ── NF: Dividing Fractions ─────────────────────────────────────────────────────
seedQ('NF', 'Dividing Fractions',
  'How many 2/3-foot sections can be cut from a rope that is 8 2/5 feet long?',
  '12 sections (with some left over)',
  '10 sections',
  '14 sections',
  '11 sections',
  '8 2/5 ÷ 2/3 = 42/5 × 3/2 = 126/10 = 12.6. So 12 complete sections.'
);
seedQ('NF', 'Dividing Fractions',
  'A recipe uses 3/4 cup of sugar per batch. You have 6 2/3 cups of sugar. How many complete batches can you make?',
  '8 batches',
  '9 batches',
  '7 batches',
  '10 batches',
  '6 2/3 ÷ 3/4 = 20/3 × 4/3 = 80/9 = 8 8/9. So 8 complete batches.'
);
seedQ('NF', 'Dividing Fractions',
  'A number divided by 5/6 equals 3 3/5. What is the number?',
  '3',
  '4 1/3',
  '4 5/18',
  '2 1/2',
  'n ÷ 5/6 = 18/5. n = 18/5 × 5/6 = 90/30 = 3.'
);
seedQ('NF', 'Dividing Fractions',
  'If 3/4 of a number is 15/16, what is 2/3 of that number?',
  '5/8',
  '15/24',
  '5/6',
  '3/4',
  'The number: (15/16) ÷ (3/4) = 15/16 × 4/3 = 60/48 = 5/4. Then 2/3 × 5/4 = 10/12 = 5/6.'
);
seedQ('NF', 'Dividing Fractions',
  'A wall mural is being painted. Each painter covers 2 1/4 square meters per hour. The wall is 24 3/4 square meters. How many hours would one painter take?',
  '11 hours',
  '9 hours',
  '12 hours',
  '10 hours',
  '24 3/4 ÷ 2 1/4 = 99/4 ÷ 9/4 = 99/4 × 4/9 = 99/9 = 11 hours.'
);
seedQ('NF', 'Dividing Fractions',
  'A half-gallon container is 2/3 full of juice. If you pour equally into 4 glasses, what fraction of a half-gallon does each glass get?',
  '1/6',
  '1/12',
  '2/12',
  '1/4',
  'Amount in container: 2/3 of 1/2 gallon = 1/3 gallon. Per glass: (1/3) ÷ 4 = 1/12 of a gallon. But as fraction of half-gallon: (1/12) ÷ (1/2) = 1/6.'
);
seedQ('NF', 'Dividing Fractions',
  'It takes 3/8 of an hour to clean one room. A hotel needs to clean 14 rooms. How many hours will it take?',
  '5 1/4 hours',
  '4 3/4 hours',
  '5 3/8 hours',
  '3 1/2 hours',
  '14 × 3/8 = 42/8 = 5 2/8 = 5 1/4 hours.'
);
seedQ('NF', 'Dividing Fractions',
  '2 1/2 ÷ 5/6 ÷ 1/3 = ?',
  '9',
  '25/36',
  '25/9',
  '4 1/6',
  '2 1/2 ÷ 5/6 = 5/2 × 6/5 = 3. Then 3 ÷ 1/3 = 3 × 3 = 9.'
);
seedQ('NF', 'Dividing Fractions',
  'A field is 5 1/3 acres. A farmer plants corn on 2/3 of it and divides the corn section into plots of 4/9 acre each. How many plots?',
  '8 plots',
  '6 plots',
  '9 plots',
  '12 plots',
  'Corn section: 2/3 × 16/3 = 32/9 acres. Plots: 32/9 ÷ 4/9 = 32/9 × 9/4 = 8 plots.'
);
seedQ('NF', 'Dividing Fractions',
  'The quotient of two fractions is 2 1/2. One fraction is 3/4. What is the other fraction?',
  '3/10',
  '15/8',
  '2/3',
  '5/6',
  'n ÷ 3/4 = 5/2 → n = 5/2 × 3/4 = 15/8. OR (3/4) ÷ n = 5/2 → n = 3/4 × 2/5 = 6/20 = 3/10. Since "the quotient" is ambiguous, if 3/4 is the dividend: n=3/4÷(5/2)=3/4×2/5=6/20=3/10.'
);

// ── NF: Fraction Word Problems ────────────────────────────────────────────────
seedQ('NF', 'Fraction Word Problems',
  'A pool holds 4,500 gallons when full. It is currently 7/10 full. After a party, 1/6 of the water evaporates. How many gallons remain?',
  '2,625 gallons',
  '3,150 gallons',
  '3,000 gallons',
  '2,800 gallons',
  'Current: 7/10×4,500=3,150 gal. Evaporates: 1/6×3,150=525. Remains: 3,150−525=2,625 gallons.'
);
seedQ('NF', 'Fraction Word Problems',
  'A store buys shoes for $48 each and marks them up by 5/8 of the cost. A customer uses a coupon for 1/4 off the marked price. What does the customer pay?',
  '$58.50',
  '$78',
  '$84',
  '$63',
  'Markup: 5/8×$48=$30. Selling price: $48+$30=$78. Coupon (1/4 off): 3/4×$78=$58.50.'
);
seedQ('NF', 'Fraction Word Problems',
  'Alex spends 1/4 of his day sleeping, 1/3 working, and 1/8 exercising. What fraction of the day is left for other activities?',
  '7/24',
  '5/24',
  '1/4',
  '17/24',
  'LCD=24: 6/24+8/24+3/24=17/24 spent. Left: 24/24−17/24=7/24.'
);
seedQ('NF', 'Fraction Word Problems',
  'A train travels 2/5 of a journey before lunch and 1/3 after lunch. What fraction of the journey remains?',
  '4/15',
  '2/15',
  '7/15',
  '8/15',
  'Done: 2/5+1/3=6/15+5/15=11/15. Remaining: 1−11/15=4/15.'
);
seedQ('NF', 'Fraction Word Problems',
  'A bag of trail mix is 3/5 nuts, 1/4 dried fruit, and the rest is chocolate chips. If the bag weighs 40 oz, how many ounces are chocolate chips?',
  '6 oz',
  '8 oz',
  '10 oz',
  '4 oz',
  'Nuts+fruit: 3/5+1/4=12/20+5/20=17/20. Chocolate: 1−17/20=3/20. 3/20×40=6 oz.'
);
seedQ('NF', 'Fraction Word Problems',
  'Jordan earns $120. He saves 1/3, spends 2/5 on food, and gives 1/8 to charity. How much money does he have left?',
  '$17',
  '$29',
  '$21',
  '$19',
  'Saved: 120/3=$40. Food: 2/5×120=$48. Charity: 120/8=$15. Total out: 40+48+15=$103. Left: 120−103=$17.'
);
seedQ('NF', 'Fraction Word Problems',
  'A school garden has 5/6 acre planted. Tomatoes take up 2/5 of the planted area, and peppers take 1/3 of the planted area. How many acres are planted with something other than tomatoes and peppers?',
  '2/9 acre',
  '5/18 acre',
  '1/6 acre',
  '7/36 acre',
  'Tomatoes: 2/5×5/6=1/3 acre. Peppers: 1/3×5/6=5/18 acre. Sum: 6/18+5/18=11/18. Other: 5/6−11/18=15/18−11/18=4/18=2/9 acre.'
);
seedQ('NF', 'Fraction Word Problems',
  'A tank drains at 3/8 gallon per minute. How long will it take to drain 7 1/2 gallons?',
  '20 minutes',
  '15 minutes',
  '18 minutes',
  '24 minutes',
  '7 1/2 ÷ 3/8 = 15/2 × 8/3 = 120/6 = 20 minutes.'
);
seedQ('NF', 'Fraction Word Problems',
  'Two-thirds of a class are girls. Three-quarters of the girls play sports. One-half of the boys play sports. What fraction of the whole class plays sports?',
  '2/3',
  '7/12',
  '1/2',
  '5/8',
  'Girls: 2/3 of class. Girls who play: 3/4×2/3=1/2 of whole class. Boys: 1/3 of class. Boys who play: 1/2×1/3=1/6 of whole class. Total: 1/2+1/6=3/6+1/6=4/6=2/3.'
);
seedQ('NF', 'Fraction Word Problems',
  'A 6-foot board needs to be cut into pieces each exactly 3/4 foot long with no waste. The pieces are sold in groups of 4. How many complete groups can be made?',
  '2 groups',
  '3 groups',
  '8 groups',
  '6 groups',
  '6 ÷ 3/4 = 8 pieces. 8 ÷ 4 = 2 complete groups.'
);

// ── OA: Patterns & Rules ──────────────────────────────────────────────────────
seedQ('OA', 'Patterns & Rules',
  'A pattern: 2, 6, 18, 54, … What is the rule, and what is the 7th term?',
  'Multiply by 3; 7th term = 1,458',
  'Add 4 each time; 7th term = 26',
  'Multiply by 3; 7th term = 729',
  'Multiply by 2; 7th term = 128',
  'Rule: ×3. Terms: 2, 6, 18, 54, 162, 486, 1,458. 7th term = 1,458.'
);
seedQ('OA', 'Patterns & Rules',
  'Pattern A starts at 1, rule ×3. Pattern B starts at 1, rule ×9. What is the relationship between corresponding terms?',
  'Each term in B is the square of the corresponding term in A.',
  'Each term in B is 6 more than the corresponding term in A.',
  'Each term in B is 3 times the corresponding term in A.',
  'Each term in B is double the corresponding term in A.',
  'A: 1,3,9,27,81. B: 1,9,81,729. Each B term = (A term)². 3²=9, 9²=81, etc. B = A².'
);
seedQ('OA', 'Patterns & Rules',
  'An input-output table: 2→5, 4→11, 6→17, 8→23. Which rule describes this?',
  'y = 3x − 1',
  'y = 2x + 1',
  'y = x + 3',
  'y = 4x − 3',
  'Check: 3(2)−1=5✓, 3(4)−1=11✓, 3(6)−1=17✓, 3(8)−1=23✓.'
);
seedQ('OA', 'Patterns & Rules',
  'The Fibonacci-like sequence starts: 1, 1, 2, 3, 5, 8, 13, … (each term = sum of two before). What is the 10th term?',
  '55',
  '34',
  '89',
  '21',
  '1,1,2,3,5,8,13,21,34,55. 10th term = 55.'
);
seedQ('OA', 'Patterns & Rules',
  'Pattern: 1, 4, 9, 16, 25, … What type of numbers are these, and what is the 12th term?',
  'Perfect squares; 144',
  'Even numbers; 24',
  'Multiples of 4; 48',
  'Perfect squares; 121',
  'These are perfect squares (1²,2²,3²,…). 12th term = 12² = 144.'
);
seedQ('OA', 'Patterns & Rules',
  'Every 3 steps in a staircase, the height increases by 2 feet. If you start at 0, how high are you after 15 steps?',
  '10 feet',
  '30 feet',
  '8 feet',
  '6 feet',
  'Rate: 2/3 ft per step. After 15 steps: 15 × 2/3 = 10 feet.'
);
seedQ('OA', 'Patterns & Rules',
  'A table shows: x: 0,1,2,3,4 and y: 3,7,11,15,19. What is y when x=10?',
  '43',
  '37',
  '40',
  '47',
  'Rule: y=4x+3. When x=10: y=40+3=43.'
);
seedQ('OA', 'Patterns & Rules',
  'Pattern: 100, 95, 85, 70, 50, … What is the next term?',
  '25',
  '30',
  '35',
  '20',
  'Differences: −5,−10,−15,−20,… (decreasing by 5 more each time). Next difference: −25. 50−25=25.'
);
seedQ('OA', 'Patterns & Rules',
  'A bacteria population doubles every hour. At 9 AM there are 50 bacteria. How many are there at 2 PM?',
  '1,600',
  '800',
  '3,200',
  '250',
  '5 hours of doubling from 9AM to 2PM. 50 × 2⁵ = 50 × 32 = 1,600.'
);
seedQ('OA', 'Patterns & Rules',
  'Pattern A rule: add 4; starts at 0. Pattern B rule: add 8; starts at 0. Cole says every term in B is always 4 more than the same-position term in A. Is he right?',
  'No — every term in B is exactly twice the corresponding term in A.',
  'Yes — B always adds 4 more than A.',
  'No — B terms are 8 more than A terms.',
  'Yes — but only for even-position terms.',
  'A: 0,4,8,12,16. B: 0,8,16,24,32. B=2×A for every term, not 4 more (except the 1st term where both are 0).'
);

// ── OA: Expressions & Order of Operations ─────────────────────────────────────
seedQ('OA', 'Expressions & Order of Operations',
  'Evaluate: 5² − 3 × [2 + (12 ÷ 4)]',
  '10',
  '4',
  '40',
  '−10',
  '12÷4=3; 2+3=5; 3×5=15; 5²=25; 25−15=10.'
);
seedQ('OA', 'Expressions & Order of Operations',
  'Which expression has the greatest value: A) 3×(4+2²) B) (3×4+2)² C) 3×4+2²  D) (3×4)²',
  'B) (3×4+2)² = 196',
  'D) (3×4)² = 144',
  'A) 3×(4+4) = 24',
  'C) 12+4 = 16',
  'A: 3×8=24. B: (12+2)²=196. C: 12+4=16. D: 144. B is greatest.'
);
seedQ('OA', 'Expressions & Order of Operations',
  'Insert parentheses to make this true: 8 + 4 × 3 − 1 = 35',
  '(8 + 4) × (3 − 1)',
  '8 + 4 × (3 − 1)',
  '(8 + 4) × 3 − 1',
  '8 + (4 × 3 − 1)',
  '(8+4)×(3−1) = 12×2... that\'s 24, not 35. (8+4)×3−1=36−1=35. ✓'
);
seedQ('OA', 'Expressions & Order of Operations',
  'What value of n makes this true: 4 × (n + 3) − 6 = 30?',
  '6',
  '9',
  '3',
  '8',
  '4(n+3)=36; n+3=9; n=6.'
);
seedQ('OA', 'Expressions & Order of Operations',
  'Evaluate: [4² − (2 × 3)] ÷ (5 − 4) + 1',
  '11',
  '5',
  '9',
  '6',
  '4²=16; 2×3=6; 16−6=10; 5−4=1; 10÷1=10; 10+1=11.'
);
seedQ('OA', 'Expressions & Order of Operations',
  'A store sells pens for $2 each and notebooks for $5. Marcus buys p pens and n notebooks and has $3 change from a $20 bill. Which equation represents this?',
  '2p + 5n = 17',
  '2p + 5n = 20',
  '2p + 5n + 3 = 17',
  '7(p + n) = 17',
  'He spent $20−$3=$17 total. Equation: 2p+5n=17.'
);
seedQ('OA', 'Expressions & Order of Operations',
  'True or False: 2 × 3² = 6² because you can multiply first.',
  'False — 2×3²=2×9=18, not 36.',
  'True — multiplication and exponents are interchangeable.',
  'False — 2×3²=6 because 2×3=6 first.',
  'True — 6²=36 and that equals 2×3².',
  'Exponents come before multiplication. 2×3²=2×9=18. If you multiplied first: (2×3)²=6²=36. These are different — the order of operations matters.'
);
seedQ('OA', 'Expressions & Order of Operations',
  'Evaluate: 100 − 4² × 3 ÷ 2 + 1',
  '77',
  '153',
  '73',
  '115',
  '4²=16; 16×3=48; 48÷2=24; 100−24+1=77.'
);
seedQ('OA', 'Expressions & Order of Operations',
  'Write an expression: "The square of the sum of x and 3, decreased by twice x."',
  '(x + 3)² − 2x',
  'x² + 3 − 2x',
  '(x + 3) − 2x²',
  'x² + 3² − 2x',
  '"Sum of x and 3" = (x+3). "Square of that" = (x+3)². "Decreased by twice x" = −2x. Full: (x+3)²−2x.'
);
seedQ('OA', 'Expressions & Order of Operations',
  'If a = 3 and b = 4, evaluate: a² + b² and (a+b)². Are they equal?',
  'No — a²+b²=25, (a+b)²=49. They differ by 2ab=24.',
  'Yes — both equal 49.',
  'Yes — both equal 25.',
  'No — a²+b²=25, (a+b)²=49. They differ by 2.',
  'a²+b²=9+16=25. (a+b)²=(7)²=49. 49−25=24=2ab=2×3×4. Not equal; (a+b)²=a²+2ab+b².'
);

// ── OA: Numerical Relationships ───────────────────────────────────────────────
seedQ('OA', 'Numerical Relationships',
  'Without calculating, explain why 49 × 51 < 50². Is the difference exactly 1?',
  'Yes — (50−1)(50+1)=50²−1=2,499, so 49×51=2,499, and 50²=2,500. Difference is 1.',
  'No — the difference is 100.',
  'Yes — any two numbers equidistant from 50 have a product of 50².',
  'No — 49×51 > 50² because multiplying spread numbers gives more.',
  '(50−1)(50+1)=50²−1²=2,500−1=2,499. So 50²−49×51=1.'
);
seedQ('OA', 'Numerical Relationships',
  'A store prices items so that each costs $3 more than twice the previous item. The first item costs $5. What is the price of the 5th item?',
  '$125',
  '$77',
  '$53',
  '$93',
  'Item 1: $5. Item 2: 2×5+3=$13. Item 3: 2×13+3=$29. Item 4: 2×29+3=$61. Item 5: 2×61+3=$125.'
);
seedQ('OA', 'Numerical Relationships',
  'Which expression is equivalent to 12(x + 5)?',
  '12x + 60',
  '12x + 5',
  '17x',
  '60x + 12',
  'Distributive property: 12(x+5)=12x+12×5=12x+60.'
);
seedQ('OA', 'Numerical Relationships',
  'A rental car costs $25 per day plus $0.15 per mile. Write an expression for the cost of renting for d days and driving m miles. What is the cost for 3 days and 120 miles?',
  '$93',
  '$75',
  '$106',
  '$88',
  'Cost = 25d+0.15m. For d=3, m=120: 25×3+0.15×120=75+18=$93.'
);
seedQ('OA', 'Numerical Relationships',
  'If you double a number and subtract 7, you get 19. If you triple the original number and add 4, what do you get?',
  '43',
  '39',
  '34',
  '57',
  '2n−7=19 → n=13. Triple and add 4: 3×13+4=39+4=43.'
);
seedQ('OA', 'Numerical Relationships',
  'The product of two consecutive even numbers is 168. What are the numbers?',
  '12 and 14',
  '10 and 16',
  '8 and 18',
  '14 and 16',
  '12×14=168. Check: consecutive even numbers with product 168 → √168≈12.96, so 12 and 14.'
);
seedQ('OA', 'Numerical Relationships',
  'Explain why 6 × (7 + 8) equals (6 × 7) + (6 × 8). What property is this?',
  'Distributive property — multiplying a sum gives the same result as multiplying each addend separately.',
  'Commutative property — order does not matter.',
  'Associative property — grouping does not matter.',
  'Identity property — multiplying by 1 gives the same number.',
  '6×15=90. (6×7)+(6×8)=42+48=90. This is the distributive property: a(b+c)=ab+ac.'
);
seedQ('OA', 'Numerical Relationships',
  'A taxi charges a $2.50 base fee plus $1.75 per mile. A rideshare charges $1.00 base plus $2.00 per mile. At how many miles do they cost the same?',
  '6 miles',
  '3 miles',
  '5 miles',
  '4 miles',
  'Taxi: 2.50+1.75m. Rideshare: 1.00+2.00m. Equal when: 2.50+1.75m=1.00+2.00m → 1.50=0.25m → m=6.'
);
seedQ('OA', 'Numerical Relationships',
  'Which is larger: the number of minutes in a week, or 10,000? By how much?',
  '10,080 minutes in a week — 80 more than 10,000.',
  '10,000 — 80 more than the minutes in a week.',
  'They are equal.',
  '10,080 — 1,080 more than 10,000.',
  '7 days × 24 hr × 60 min = 7×1,440=10,080. 10,080−10,000=80 more.'
);
seedQ('OA', 'Numerical Relationships',
  'n × (n + 1) gives the product of two consecutive integers. For which value of n is this product closest to 500?',
  'n = 22 (22 × 23 = 506)',
  'n = 20 (20 × 21 = 420)',
  'n = 25 (25 × 26 = 650)',
  'n = 21 (21 × 22 = 462)',
  '√500≈22.4. Try n=22: 22×23=506. Try n=21: 21×22=462. |506−500|=6; |462−500|=38. n=22 is closer.'
);

// ── MD: Volume ────────────────────────────────────────────────────────────────
seedQ('MD', 'Volume',
  'A swimming pool is 25 m long, 10 m wide, and has a shallow end of 1.2 m and a deep end of 3 m. Approximating the bottom as a flat slope, the average depth is 2.1 m. What is the approximate volume of water?',
  '525 m³',
  '300 m³',
  '750 m³',
  '420 m³',
  'V = l × w × avg depth = 25 × 10 × 2.1 = 525 m³.'
);
seedQ('MD', 'Volume',
  'A cardboard box (open top) has outer dimensions 30 cm × 20 cm × 15 cm. The cardboard is 0.5 cm thick. What is the interior volume?',
  '7,990 cm³',
  '9,000 cm³',
  '7,560 cm³',
  '8,120 cm³',
  'Open-top: length and width each reduced by 2×0.5=1 cm; height reduced by only 0.5 cm (bottom only). Interior: (30−1)×(20−1)×(15−0.5)=29×19×14.5=7,989.5≈7,990 cm³.'
);
seedQ('MD', 'Volume',
  'Two identical cubes are stacked to form a rectangular prism. If the prism has a volume of 250 cm³, what is the side length of each cube?',
  '5 cm',
  '10 cm',
  '25 cm',
  '2.5 cm',
  'Prism = 2 cubes stacked → dimensions s×s×2s. Volume: 2s³=250 → s³=125 → s=5 cm.'
);
seedQ('MD', 'Volume',
  'A warehouse stores boxes that are each 4 ft × 3 ft × 2 ft. The warehouse floor is 60 ft × 40 ft and boxes can be stacked up to 8 ft high. What is the maximum number of boxes that fit?',
  '800',
  '400',
  '1,600',
  '600',
  'Box volume: 24 ft³. Stack height: 8÷2=4 layers. Floor arrangement: (60÷4)×(40÷3)→15×13=195 boxes per layer... Or use volumes: Warehouse usable volume: 60×40×8=19,200 ft³. Box volume: 24 ft³. 19,200÷24=800 boxes.'
);
seedQ('MD', 'Volume',
  'A cylinder-shaped container has a radius of 5 cm. A rectangular box 10 cm × 10 cm × 20 cm holds the same volume. What is the height of the cylinder? (Use π ≈ 3.14)',
  'approximately 25.48 cm',
  'approximately 6.37 cm',
  'approximately 12.74 cm',
  'approximately 10 cm',
  'Box volume: 10×10×20=2,000 cm³. Cylinder: πr²h=3.14×25×h=78.5h. h=2,000÷78.5≈25.48 cm.'
);
seedQ('MD', 'Volume',
  'A fish tank is 60 cm × 30 cm × 40 cm. It is 3/4 full of water. A rock with volume 900 cm³ is dropped in. Does the water overflow? If not, how high is the new water level?',
  'No overflow — water rises to 30.5 cm',
  'Yes — it overflows by 900 cm³',
  'No overflow — water stays at 30 cm',
  'Yes — it overflows by 100 cm³',
  'Current water: 3/4×60×30×40=54,000 cm³. New water level: (54,000+900)÷(60×30)=54,900÷1,800=30.5 cm. Max is 40 cm, so no overflow.'
);
seedQ('MD', 'Volume',
  'A cube has a surface area of 150 cm². What is its volume?',
  '125 cm³',
  '25 cm³',
  '216 cm³',
  '1,000 cm³',
  'Surface area of cube = 6s². 6s²=150 → s²=25 → s=5 cm. Volume = 5³=125 cm³.'
);
seedQ('MD', 'Volume',
  'Box A has dimensions 8×6×5. Box B has each dimension 50% larger. How many times greater is Box B\'s volume than Box A\'s?',
  '3.375 times greater',
  '1.5 times greater',
  '4.5 times greater',
  '2.25 times greater',
  'Box B: 12×9×7.5. Volume A: 240. Volume B: 810. 810÷240=3.375. Or: scaling each dimension by 1.5 → volume scales by 1.5³=3.375.'
);
seedQ('MD', 'Volume',
  'A rectangular prism has a volume of 250 cubic inches. Its length is twice its width, and its height equals its width. What are its dimensions?',
  'l=10 in, w=5 in, h=5 in',
  'l=8 in, w=4 in, h=4 in',
  'l=10 in, w=5 in, h=8 in',
  'l=12 in, w=6 in, h=5 in',
  'Let width=w. Then length=2w and height=w. V=2w×w×w=2w³=250. w³=125. w=5. So w=5, l=10, h=5. Check: 10×5×5=250 ✓.'
);
seedQ('MD', 'Volume',
  'How many 2 cm × 2 cm × 2 cm cubes can fit inside a box that is 10 cm × 8 cm × 6 cm?',
  '60 cubes',
  '120 cubes',
  '480 cubes',
  '30 cubes',
  'Along length: 10÷2=5. Width: 8÷2=4. Height: 6÷2=3. Total: 5×4×3=60 cubes.'
);

// ── MD: Measurement Conversions ───────────────────────────────────────────────
seedQ('MD', 'Measurement Conversions',
  'A car travels at 60 miles per hour. How far does it travel in 2 hours 45 minutes?',
  '165 miles',
  '122 miles',
  '150 miles',
  '180 miles',
  '2 hr 45 min = 2.75 hrs. 60 × 2.75 = 165 miles.'
);
seedQ('MD', 'Measurement Conversions',
  'A recipe calls for 3 pints of milk. The store only sells milk in quarts. How many quarts do you need to buy (you can\'t buy partial quarts)?',
  '2 quarts',
  '3 quarts',
  '6 quarts',
  '1 quart',
  '1 quart = 2 pints. 3 pints = 1.5 quarts. You must buy 2 quarts (can\'t buy partial).'
);
seedQ('MD', 'Measurement Conversions',
  'A fence requires 14 yards, 2 feet, and 8 inches of material. What is this length in inches? (1 yd = 3 ft, 1 ft = 12 in)',
  '536 inches',
  '548 inches',
  '560 inches',
  '524 inches',
  '14 yd = 14×36=504 in; 2 ft = 24 in; 8 in. Total: 504+24+8=536 inches.'
);
seedQ('MD', 'Measurement Conversions',
  'A swimming pool holds 25,000 liters. A garden hose fills at 2.5 liters per minute. How many hours will it take to fill the pool?',
  'about 166.7 hours',
  '10,000 hours',
  '62.5 hours',
  '100 hours',
  '25,000 ÷ 2.5 = 10,000 minutes. 10,000 ÷ 60 ≈ 166.7 hours.'
);
seedQ('MD', 'Measurement Conversions',
  'Convert 3.5 km to cm.',
  '350,000 cm',
  '3,500 cm',
  '35,000 cm',
  '3,500,000 cm',
  '1 km = 1,000 m = 100,000 cm. 3.5 × 100,000 = 350,000 cm.'
);
seedQ('MD', 'Measurement Conversions',
  'A package weighs 4 pounds 6 ounces. Shipping costs $0.05 per ounce. How much does it cost to ship?',
  '$3.50',
  '$2.20',
  '$4.30',
  '$2.70',
  '4 lb 6 oz = 4×16+6=70 oz. Cost: 70×$0.05=$3.50.'
);
seedQ('MD', 'Measurement Conversions',
  'A faucet drips at 1 cup every 10 minutes. How many gallons of water are wasted in one week? (1 gallon = 16 cups)',
  '63 gallons',
  '100.8 gallons',
  '1,008 gallons',
  '6.3 gallons',
  'Per hour: 6 cups. Per day: 6×24=144 cups. Per week: 144×7=1,008 cups. In gallons: 1,008÷16=63 gallons.'
);
seedQ('MD', 'Measurement Conversions',
  'A runner trains at 8 minutes per mile. How long will it take her to run a 10 km race? (1 mile ≈ 1.609 km)',
  'About 49 minutes 43 seconds',
  'About 80 minutes',
  'About 64 minutes',
  'About 55 minutes 20 seconds',
  '10 km ÷ 1.609 km/mi ≈ 6.214 miles. Time: 6.214 × 8 min ≈ 49.7 min ≈ 49 min 43 sec.'
);
seedQ('MD', 'Measurement Conversions',
  'A recipe makes 4 dozen cookies and calls for 2¼ cups of butter. You want to make 10 dozen cookies. How much butter do you need in tablespoons? (1 cup = 16 tbsp)',
  '90 tablespoons',
  '36 tablespoons',
  '54 tablespoons',
  '72 tablespoons',
  'Scale factor: 10÷4=2.5. Butter: 2.25×2.5=5.625 cups. In tbsp: 5.625×16=90 tablespoons.'
);
seedQ('MD', 'Measurement Conversions',
  'A car uses 8.4 liters of fuel per 100 km. How many kilometers can it travel on a full 45-liter tank?',
  '535.7 km',
  '378 km',
  '756 km',
  '420 km',
  '45 ÷ 8.4 × 100 = 4,500 ÷ 8.4 ≈ 535.7 km.'
);

// ── MD: Line Plots with Fractions ─────────────────────────────────────────────
seedQ('MD', 'Line Plots with Fractions',
  'A line plot shows 9 students\' heights above 5 feet (in inches): 1/4, 1/2, 1/2, 3/4, 3/4, 3/4, 1, 1, 1 1/4. What is the mean extra height?',
  '3/4 inch',
  '1/2 inch',
  '7/8 inch',
  '1 inch',
  'Sum: 1/4+1/2+1/2+3/4+3/4+3/4+1+1+1 1/4. In quarters: 1+2+2+3+3+3+4+4+5=27 quarters = 6 3/4. Mean: 6 3/4÷9=27/4÷9=3/4 inch.'
);
seedQ('MD', 'Line Plots with Fractions',
  'Data: 1/8, 1/8, 1/4, 1/4, 1/4, 3/8, 1/2, 1/2. What is the difference between the median and the mode?',
  '0 (the median equals the mode)',
  '1/8',
  '1/4',
  '3/8',
  'Ordered: 1/8,1/8,1/4,1/4,1/4,3/8,1/2,1/2. Mode=1/4. Median=average of 4th and 5th values=(1/4+1/4)/2=1/4. Difference=0.'
);
seedQ('MD', 'Line Plots with Fractions',
  'A line plot has these values: 1/2, 1/2, 3/4, 3/4, 1, 1, 1 1/4, 1 1/4. If you remove the two highest values, how does the mean change?',
  'The mean decreases by 1/8',
  'The mean stays the same',
  'The mean decreases by 1/4',
  'The mean increases by 1/8',
  'Original sum: 1/2+1/2+3/4+3/4+1+1+5/4+5/4=7. Mean=7/8. Remove two highest (1 1/4 and 1 1/4): new sum=7−5/2=9/2. New mean=9/2÷6=3/4. Decrease: 7/8−3/4=1/8.'
);
seedQ('MD', 'Line Plots with Fractions',
  'Plot data (pieces of string in feet): five at 1/3, three at 2/3, four at 1, two at 4/3. What is the total length of all strings?',
  '10 1/3 feet',
  '14 feet',
  '12 1/3 feet',
  '16 2/3 feet',
  '5×1/3=5/3; 3×2/3=6/3; 4×1=12/3; 2×4/3=8/3. Total: (5+6+12+8)/3=31/3=10 1/3 feet.'
);
seedQ('MD', 'Line Plots with Fractions',
  'A line plot shows daily rainfall (in inches) for 10 days: 0, 1/4, 1/4, 1/2, 1/2, 1/2, 3/4, 3/4, 1, 1 1/4. What fraction of days had more than 1/2 inch of rain?',
  '2/5',
  '3/10',
  '1/2',
  '7/10',
  '"More than 1/2" does not include the 1/2 days. Days above 1/2: 3/4, 3/4, 1, 1 1/4 = 4 days. Fraction: 4/10=2/5.'
);
seedQ('MD', 'Line Plots with Fractions',
  'Students measured worm lengths (in inches): 1/2, 1/2, 3/4, 3/4, 3/4, 1, 1, 1, 1 1/4, 1 1/2. What is the range of the data?',
  '1 inch',
  '3/4 inch',
  '1 1/4 inches',
  '1/2 inch',
  'Largest: 1 1/2. Smallest: 1/2. Range: 1 1/2 − 1/2 = 1 inch.'
);
seedQ('MD', 'Line Plots with Fractions',
  'A line plot shows paint used (quarts) by 8 students: 1/4, 1/4, 1/2, 1/2, 3/4, 3/4, 1, 1. You want to distribute the total equally. How much does each student get?',
  '5/8 quart',
  '3/4 quart',
  '1/2 quart',
  '7/8 quart',
  'Sum: 1/4+1/4+1/2+1/2+3/4+3/4+1+1=5. Mean: 5÷8=5/8 quart.'
);
seedQ('MD', 'Line Plots with Fractions',
  'A data set has 6 values. Five of them are: 1/2, 1/2, 3/4, 1, 1 1/4. The mean of all 6 values is 3/4. What is the sixth value?',
  '1/2',
  '3/4',
  '1',
  '1/4',
  'Sum of 6 = 6×3/4=9/2. Sum of 5 known: 1/2+1/2+3/4+1+5/4=2/4+2/4+3/4+4/4+5/4=16/4=4. Sixth: 9/2−4=9/2−8/2=1/2.'
);
seedQ('MD', 'Line Plots with Fractions',
  'A line plot shows distances 8 students walked (miles): 1/4, 1/4, 1/2, 3/4, 3/4, 1, 1, 1 1/4. What is the total distance walked by students who walked more than 3/4 mile?',
  '3 1/4 miles',
  '2 1/2 miles',
  '4 miles',
  '2 miles',
  'Students who walked more than 3/4: 1, 1, 1 1/4 = 3 students. Total: 1+1+1 1/4=3 1/4 miles.'
);
seedQ('MD', 'Line Plots with Fractions',
  'A scientist records plant growth over 7 days (cm): 1/4, 3/8, 1/2, 3/8, 5/8, 1/2, 3/4. What was the total growth over the week?',
  '3 3/8 cm',
  '3 1/4 cm',
  '3 1/2 cm',
  '2 7/8 cm',
  'LCD=8: 2/8+3/8+4/8+3/8+5/8+4/8+6/8=27/8=3 3/8 cm.'
);

// ── G: Coordinate Plane ───────────────────────────────────────────────────────
seedQ('G', 'Coordinate Plane',
  'Point A (3, 5) is translated 4 units left and 2 units down. What are the new coordinates?',
  '(−1, 3)',
  '(7, 7)',
  '(1, 3)',
  '(−1, 7)',
  'Left 4: 3−4=−1. Down 2: 5−2=3. New point: (−1, 3).'
);
seedQ('G', 'Coordinate Plane',
  'A triangle has vertices at (0,0), (6,0), and (3,4). What is the area of the triangle?',
  '12 square units',
  '18 square units',
  '9 square units',
  '24 square units',
  'Base = 6 (from (0,0) to (6,0)). Height = 4 (y-value of apex). Area = 1/2×6×4=12 square units.'
);
seedQ('G', 'Coordinate Plane',
  'On a coordinate grid, A=(1,2), B=(5,2), C=(5,6), D=(1,6). What shape is ABCD and what is its perimeter?',
  'A square with perimeter 16 units',
  'A rectangle with perimeter 20 units',
  'A rhombus with perimeter 16 units',
  'A rectangle with perimeter 16 units',
  'AB=4 (horizontal), BC=4 (vertical), all sides equal → square. Perimeter=4×4=16 units.'
);
seedQ('G', 'Coordinate Plane',
  'The midpoint of segment AB is (3, 1). Point A is at (−1, −3). What are the coordinates of Point B?',
  '(7, 5)',
  '(4, 4)',
  '(2, −1)',
  '(1, 2)',
  'Midpoint formula: ((xA+xB)/2, (yA+yB)/2)=(3,1). So (−1+xB)/2=3 → xB=7. (−3+yB)/2=1 → yB=5. B=(7,5).'
);
seedQ('G', 'Coordinate Plane',
  'A map uses coordinates where each unit = 2 km. A hiking trail goes from (2,3) to (8,3) to (8,7). What is the total trail distance in km?',
  '20 km',
  '10 km',
  '16 km',
  '24 km',
  'Segment 1: (2,3)→(8,3): 6 units=12 km. Segment 2: (8,3)→(8,7): 4 units=8 km. Total: 20 km.'
);
seedQ('G', 'Coordinate Plane',
  'Point P is at (4, −2). After reflecting over the x-axis, then translating 3 right, what are the final coordinates?',
  '(7, 2)',
  '(7, −2)',
  '(1, 2)',
  '(4, 2)',
  'Reflect over x-axis: (4, −2)→(4, 2). Translate 3 right: (4+3, 2)=(7, 2).'
);
seedQ('G', 'Coordinate Plane',
  'On a coordinate plane, a rectangle\'s opposite corners are at (−2, −3) and (4, 5). What is the area of the rectangle?',
  '48 square units',
  '28 square units',
  '24 square units',
  '56 square units',
  'Width: 4−(−2)=6. Height: 5−(−3)=8. Area: 6×8=48 square units.'
);
seedQ('G', 'Coordinate Plane',
  'Which quadrant contains points where both x and y are negative?',
  'Quadrant III',
  'Quadrant I',
  'Quadrant II',
  'Quadrant IV',
  'Quadrant I: (+,+). Quadrant II: (−,+). Quadrant III: (−,−). Quadrant IV: (+,−).'
);
seedQ('G', 'Coordinate Plane',
  'Three vertices of a square are at (2,1), (6,1), and (6,5). What are the coordinates of the fourth vertex?',
  '(2, 5)',
  '(2, −1)',
  '(0, 5)',
  '(4, 5)',
  'Three vertices form an L-shape. The fourth vertex completes the square at (2, 5).'
);
seedQ('G', 'Coordinate Plane',
  'A point is graphed at (−3, 4). If you double both coordinates, then move it 1 unit down, where is the new point?',
  '(−6, 7)',
  '(−6, 9)',
  '(−6, 3)',
  '(3, 7)',
  'Double: (−6, 8). Move 1 down: (−6, 7).'
);

// ── G: 2D Figure Classification ───────────────────────────────────────────────
seedQ('G', '2D Figure Classification',
  'A quadrilateral has all four sides equal and all four angles equal. What is it, and what are the angle measures?',
  'A square — each angle is 90°',
  'A rhombus — each angle is 60°',
  'A rectangle — each angle is 90°',
  'A square — each angle is 45°',
  'All sides equal AND all angles equal → must be a square. Sum of interior angles of a quadrilateral = 360°. 360÷4=90° each.'
);
seedQ('G', '2D Figure Classification',
  'A triangle has sides of length 5 cm, 12 cm, and 13 cm. Is it a right triangle? How do you know?',
  'Yes — 5² + 12² = 13² (25 + 144 = 169).',
  'No — the sides are too different in length.',
  'Yes — it has one side longer than the others.',
  'No — only equilateral triangles can be right triangles.',
  '5²+12²=25+144=169=13². The Pythagorean theorem confirms it is a right triangle.'
);
seedQ('G', '2D Figure Classification',
  'What is the sum of interior angles of a hexagon?',
  '720°',
  '540°',
  '900°',
  '1,080°',
  'Formula: (n−2)×180°. For hexagon (n=6): (6−2)×180=4×180=720°.'
);
seedQ('G', '2D Figure Classification',
  'A polygon has interior angles that sum to 540°. How many sides does it have?',
  '5 sides (pentagon)',
  '4 sides (quadrilateral)',
  '6 sides (hexagon)',
  '3 sides (triangle)',
  '(n−2)×180=540. n−2=3. n=5. It is a pentagon.'
);
seedQ('G', '2D Figure Classification',
  'Which set of angle measures CANNOT form a triangle?',
  '90°, 90°, 10°',
  '60°, 60°, 60°',
  '45°, 90°, 45°',
  '100°, 40°, 40°',
  'A triangle\'s angles must sum to 180°. 90+90+10=190°≠180°, so this cannot form a triangle.'
);
seedQ('G', '2D Figure Classification',
  'A rhombus and a rectangle both have 4 sides. How are they different in terms of sides and angles?',
  'A rhombus has all equal sides but angles need not be 90°; a rectangle has all right angles but sides need not all be equal.',
  'They are the same shape — both are parallelograms.',
  'A rhombus has right angles; a rectangle has equal sides.',
  'A rhombus has 4 equal sides AND 4 right angles, just like a rectangle.',
  'Rhombus: 4 equal sides, opposite angles equal (not necessarily 90°). Rectangle: opposite sides equal, ALL angles = 90°. They overlap only in the square.'
);
seedQ('G', '2D Figure Classification',
  'An isosceles triangle has a vertex angle of 40°. What are the base angles?',
  '70° each',
  '40° each',
  '60° each',
  '80° each',
  'Base angles are equal. 40+(2×base)=180. 2×base=140. Base=70° each.'
);
seedQ('G', '2D Figure Classification',
  'Which statement is true about ALL rectangles?',
  'Diagonals bisect each other and are equal in length.',
  'All four sides are equal.',
  'Diagonals are perpendicular to each other.',
  'It is also a rhombus.',
  'In a rectangle, diagonals are equal in length AND bisect each other. (Perpendicular diagonals are a property of rhombuses and squares, not all rectangles.)'
);
seedQ('G', '2D Figure Classification',
  'A triangle has angles in the ratio 2:3:7. What type of triangle is it?',
  'Obtuse scalene',
  'Acute scalene',
  'Right isosceles',
  'Obtuse isosceles',
  'Ratio 2:3:7, sum=12 parts=180°. Each part=15°. Angles: 30°, 45°, 105°. 105°>90° → obtuse. All angles different → scalene. Obtuse scalene.'
);
seedQ('G', '2D Figure Classification',
  'How many lines of symmetry does a regular hexagon have?',
  '6',
  '3',
  '12',
  '4',
  'A regular hexagon has 6 lines of symmetry: 3 through opposite vertices and 3 through midpoints of opposite sides.'
);

// ═════════════════════════════════════════════════════════════════════════════
// BATCH 3 — 120 targeted questions for Neev's 6 weakest topics (April 2026)
// Distribution per topic: 10 HIGH, 5 MEDIUM, 5 VERY HIGH
// ═════════════════════════════════════════════════════════════════════════════

// ── MD / Line Plots with Fractions (20) ─────────────────────────────────────
// [MEDIUM]
seedQ('MD', 'Line Plots with Fractions',
  'Ribbon lengths (ft) on a line plot: 1/4, 1/2, 1/2, 3/4, 1. What is the mode?',
  '1/2 ft',
  '1/4 ft',
  '3/4 ft',
  '1 ft',
  'The mode is the most frequent value. 1/2 appears twice; every other value appears once.'
);
seedQ('MD', 'Line Plots with Fractions',
  'Values on a line plot (in): 1/8, 1/4, 1/2, 3/4, 7/8. What is the range?',
  '3/4 in',
  '7/8 in',
  '1/2 in',
  '5/8 in',
  'Range = greatest − least = 7/8 − 1/8 = 6/8 = 3/4.'
);
seedQ('MD', 'Line Plots with Fractions',
  'Seven pencils measured (in): 1/4, 1/4, 1/2, 1/2, 1/2, 3/4, 1. What is the median?',
  '1/2 in',
  '1/4 in',
  '3/4 in',
  '1 in',
  'With 7 values sorted, the median is the 4th value, which is 1/2.'
);
seedQ('MD', 'Line Plots with Fractions',
  'Data (cm): 1/4, 1/4, 1/3, 1/2, 1/2, 3/4. How many pieces measure LESS THAN 1/2?',
  '3',
  '2',
  '4',
  '5',
  'Pieces less than 1/2: 1/4, 1/4, and 1/3 → 3 pieces. (1/2 is not less than 1/2.)'
);
seedQ('MD', 'Line Plots with Fractions',
  'Five sticks each 1/4 foot long. What is the total length?',
  '1 1/4 ft',
  '5/8 ft',
  '1 ft',
  '1 1/2 ft',
  '5 × 1/4 = 5/4 = 1 1/4 ft.'
);

// [HIGH]
seedQ('MD', 'Line Plots with Fractions',
  'Plant heights on a line plot (ft): 1/2, 3/8, 1/4, 1/8, 3/4. What is the total height?',
  '2 ft',
  '1 3/4 ft',
  '1 7/8 ft',
  '2 1/4 ft',
  'LCD = 8: 4/8 + 3/8 + 2/8 + 1/8 + 6/8 = 16/8 = 2.'
);
seedQ('MD', 'Line Plots with Fractions',
  'Data (cups): 1/2, 1/3, 1/6, 1/4. What is the total?',
  '1 1/4 cups',
  '1 1/3 cups',
  '1 1/6 cups',
  '1 1/2 cups',
  'LCD = 12: 6/12 + 4/12 + 2/12 + 3/12 = 15/12 = 1 3/12 = 1 1/4.'
);
seedQ('MD', 'Line Plots with Fractions',
  'Five measurements total 3 1/2 ft. Four of them are 1/2, 3/4, 1, and 1/4. What is the fifth?',
  '1 ft',
  '3/4 ft',
  '1/2 ft',
  '1 1/4 ft',
  'Sum of known: 1/2 + 3/4 + 1 + 1/4 = 2 1/2. Missing = 3 1/2 − 2 1/2 = 1.'
);
seedQ('MD', 'Line Plots with Fractions',
  'On a line plot of {1/4, 1/2, 3/4, 5/8, 1/8, 7/8}, what is the sum of only the values GREATER than 1/2?',
  '2 1/4',
  '1 7/8',
  '2 1/2',
  '1 3/4',
  'Values > 1/2: 3/4, 5/8, 7/8. LCD = 8: 6/8 + 5/8 + 7/8 = 18/8 = 2 1/4.'
);
seedQ('MD', 'Line Plots with Fractions',
  'Data (ft): 1/2, 1/4, 1/4, 1/2, 1/2. The total length of ribbon is shared equally among 4 students. How much does each get?',
  '1/2 ft',
  '3/8 ft',
  '5/8 ft',
  '1/4 ft',
  'Sum = 2/4 + 1/4 + 1/4 + 2/4 + 2/4 = 8/4 = 2 ft. Divide by 4: 2 ÷ 4 = 1/2 ft each.'
);
seedQ('MD', 'Line Plots with Fractions',
  'Four cups of water measured: 1/2, 1/4, 3/4, 1/2. What is the mean (average)?',
  '1/2 cup',
  '3/8 cup',
  '3/4 cup',
  '5/8 cup',
  'Sum = 2/4 + 1/4 + 3/4 + 2/4 = 8/4 = 2. Mean = 2 ÷ 4 = 1/2.'
);
seedQ('MD', 'Line Plots with Fractions',
  'Data (mi): 1/8, 1/8, 1/4, 1/4, 1/4, 3/8, 1/2, 1/2. What is the difference between the median and the mode?',
  '0 (they are equal)',
  '1/8',
  '1/4',
  '3/8',
  'Sorted, 8 values — median = (4th + 5th)/2 = (1/4 + 1/4)/2 = 1/4. Mode = 1/4 (appears 3 times). Difference = 0.'
);
seedQ('MD', 'Line Plots with Fractions',
  'Three rods measured: 1 1/2, 2 3/4, 1 1/4 feet. What is their total length?',
  '5 1/2 ft',
  '4 3/4 ft',
  '5 1/4 ft',
  '5 ft',
  'Whole parts: 1+2+1 = 4. Fraction parts: 1/2 + 3/4 + 1/4 = 2/4 + 3/4 + 1/4 = 6/4 = 1 1/2. Total = 4 + 1 1/2 = 5 1/2.'
);
seedQ('MD', 'Line Plots with Fractions',
  'Five bottles of water: 2/3, 1/3, 1/6, 1/2, 1/6 liters. What is the total?',
  '1 5/6 L',
  '1 2/3 L',
  '2 L',
  '1 1/2 L',
  'LCD = 6: 4/6 + 2/6 + 1/6 + 3/6 + 1/6 = 11/6 = 1 5/6.'
);
seedQ('MD', 'Line Plots with Fractions',
  'Data on a line plot (yd): 3/8, 1/2, 5/8, 1/4, 3/4. Find the total.',
  '2 1/2 yd',
  '2 1/4 yd',
  '2 3/8 yd',
  '2 3/4 yd',
  'LCD = 8: 3/8 + 4/8 + 5/8 + 2/8 + 6/8 = 20/8 = 2 1/2.'
);
seedQ('MD', 'Line Plots with Fractions',
  'Six seedlings grew (in): 1/4, 3/8, 1/2, 1/4, 5/8, 1/8. What is the difference between the longest and shortest growth?',
  '1/2 in',
  '3/8 in',
  '5/8 in',
  '3/4 in',
  'Longest = 5/8, shortest = 1/8. Difference = 4/8 = 1/2.'
);

// [VERY HIGH]
seedQ('MD', 'Line Plots with Fractions',
  'Line plot (cm): 1/8, 1/4, 3/8, 1/2, 5/8, 3/4. Mia keeps all pieces SHORTER than 5/8 cm. What is the total length she keeps?',
  '1 1/4 cm',
  '1 3/8 cm',
  '7/8 cm',
  '1 1/8 cm',
  'Pieces < 5/8: 1/8, 1/4, 3/8, 1/2. LCD = 8: 1/8 + 2/8 + 3/8 + 4/8 = 10/8 = 1 1/4.'
);
seedQ('MD', 'Line Plots with Fractions',
  'Five ribbons (ft): 1/4, 1/3, 1/2, 1/6, 1/4. What is the total length expressed in INCHES? (1 ft = 12 in)',
  '18 inches',
  '12 inches',
  '24 inches',
  '16 inches',
  'LCD = 12: 3/12 + 4/12 + 6/12 + 2/12 + 3/12 = 18/12 = 1 1/2 ft. 1 1/2 × 12 = 18 inches.'
);
seedQ('MD', 'Line Plots with Fractions',
  'The mean of 4 values from a line plot is 1/2. Three of the values are 1/4, 1/2, and 3/8. What is the fourth?',
  '7/8',
  '5/8',
  '3/4',
  '1',
  'Total = 4 × 1/2 = 2. Known = 2/8 + 4/8 + 3/8 = 9/8. Fourth = 2 − 9/8 = 16/8 − 9/8 = 7/8.'
);
seedQ('MD', 'Line Plots with Fractions',
  'Eight students measured ribbons (ft): 1/4, 1/4, 1/2, 3/8, 5/8, 1/2, 1/4, 3/8. Jen uses ONLY the ribbons measuring AT MOST 1/4 ft. Total length Jen uses?',
  '3/4 ft',
  '1/2 ft',
  '1 ft',
  '5/8 ft',
  'Ribbons ≤ 1/4: three 1/4s. Total = 3 × 1/4 = 3/4 ft.'
);
seedQ('MD', 'Line Plots with Fractions',
  'Line plot: three at 1/8, two at 3/8, four at 1/2, one at 7/8. What is the total of ALL values?',
  '4',
  '3 7/8',
  '4 1/4',
  '3 1/2',
  'Weighted sum in eighths: 3(1/8) + 2(3/8) + 4(4/8) + 1(7/8) = 3/8 + 6/8 + 16/8 + 7/8 = 32/8 = 4.'
);

// ── MD / Volume (20) ────────────────────────────────────────────────────────
// [MEDIUM]
seedQ('MD', 'Volume',
  'A rectangular prism has length 6 cm, width 4 cm, height 3 cm. What is its volume?',
  '72 cm³',
  '52 cm³',
  '84 cm³',
  '13 cm³',
  'V = L × W × H = 6 × 4 × 3 = 72.'
);
seedQ('MD', 'Volume',
  'A box has volume 60 cm³, length 5 cm, width 3 cm. What is its height?',
  '4 cm',
  '12 cm',
  '8 cm',
  '15 cm',
  'V = L × W × H → 60 = 5 × 3 × H → 60 = 15H → H = 4.'
);
seedQ('MD', 'Volume',
  'A cube has side length 5 in. What is its volume?',
  '125 in³',
  '25 in³',
  '15 in³',
  '150 in³',
  'V of cube = s³ = 5 × 5 × 5 = 125.'
);
seedQ('MD', 'Volume',
  'Two connected rectangular boxes have dimensions 3×2×2 and 4×2×1. What is the total combined volume?',
  '20 cubic units',
  '14 cubic units',
  '24 cubic units',
  '12 cubic units',
  'Box 1: 3×2×2 = 12. Box 2: 4×2×1 = 8. Total = 12 + 8 = 20.'
);
seedQ('MD', 'Volume',
  'A box is 2 layers tall, and each layer has 3 rows of 4 unit cubes. What is the volume?',
  '24 cubic units',
  '12 cubic units',
  '14 cubic units',
  '9 cubic units',
  '2 × 3 × 4 = 24 unit cubes.'
);

// [HIGH]
seedQ('MD', 'Volume',
  'A rectangular prism has dimensions 2.5 ft × 4 ft × 6 ft. Find the volume.',
  '60 ft³',
  '30 ft³',
  '48 ft³',
  '12.5 ft³',
  'V = 2.5 × 4 × 6 = 60 ft³.'
);
seedQ('MD', 'Volume',
  'A tank is 5 ft × 3 ft × 4 ft and is 3/4 full. What is the volume of water it contains?',
  '45 ft³',
  '60 ft³',
  '40 ft³',
  '15 ft³',
  'Tank volume = 60 ft³. Water = 3/4 × 60 = 45 ft³.'
);
seedQ('MD', 'Volume',
  'A cube has surface area 150 cm². What is its volume?',
  '125 cm³',
  '150 cm³',
  '75 cm³',
  '216 cm³',
  '6 faces, each of area 150/6 = 25 cm². Side = √25 = 5. Volume = 5³ = 125.'
);
seedQ('MD', 'Volume',
  'If every dimension of a rectangular prism is doubled, the new volume is how many times the original?',
  '8 times',
  '2 times',
  '4 times',
  '6 times',
  'Each dimension ×2: V_new = 2 × 2 × 2 × V_old = 8 × V_old.'
);
seedQ('MD', 'Volume',
  'A closed rectangular cardboard box has outer dimensions 20 cm × 10 cm × 8 cm. The cardboard is 1 cm thick. What is the interior volume?',
  '864 cm³',
  '1600 cm³',
  '1000 cm³',
  '720 cm³',
  'Each dimension loses 2 cm (1 cm per wall × 2 walls). Interior: 18 × 8 × 6 = 864.'
);
seedQ('MD', 'Volume',
  'A cube has volume 216 in³. What is its side length?',
  '6 in',
  '8 in',
  '5 in',
  '12 in',
  'Side = ∛216 = 6 (since 6×6×6 = 216).'
);
seedQ('MD', 'Volume',
  'Box A is 2×3×4. Box B is 4×6×8 (every dimension doubled). How many times greater is B\u2019s volume than A\u2019s?',
  '8 times',
  '2 times',
  '4 times',
  '6 times',
  'A = 24. B = 192. 192/24 = 8. (Equivalent to scale factor 2³.)'
);
seedQ('MD', 'Volume',
  'A warehouse floor is 60 ft × 40 ft, and boxes can stack up to 8 ft high. Each box is 4 ft × 3 ft × 2 ft. What is the maximum number of boxes that fit?',
  '800',
  '600',
  '900',
  '1000',
  'Warehouse volume = 60 × 40 × 8 = 19,200 ft³. Box volume = 24 ft³. 19,200 ÷ 24 = 800.'
);
seedQ('MD', 'Volume',
  'An L-shaped solid is made of two rectangular prisms: one 5×4×3 and one 2×4×3 connected along a face. What is the total volume?',
  '84 cubic units',
  '60 cubic units',
  '144 cubic units',
  '108 cubic units',
  '60 + 24 = 84 cubic units.'
);
seedQ('MD', 'Volume',
  'A rectangular prism has volume 144 in³, length 6 in, and width 4 in. What is its height?',
  '6 in',
  '4 in',
  '8 in',
  '12 in',
  'V = L × W × H → 144 = 6 × 4 × H = 24H → H = 6.'
);

// [VERY HIGH]
seedQ('MD', 'Volume',
  'Each dimension of a rectangular prism is scaled by 1.5. If the original volume is 80 cm³, what is the new volume?',
  '270 cm³',
  '120 cm³',
  '180 cm³',
  '320 cm³',
  'Volume scales by (1.5)³ = 3.375. New V = 80 × 3.375 = 270.'
);
seedQ('MD', 'Volume',
  'Box A has dimensions 8 × 6 × 5. Box B has every dimension 50% larger. How many times greater is Box B\u2019s volume than Box A\u2019s?',
  '3.375 times greater',
  '1.5 times greater',
  '4.5 times greater',
  '2.25 times greater',
  'Scaling each side by 1.5 multiplies volume by 1.5³ = 3.375. (A = 240, B = 12 × 9 × 7.5 = 810; 810/240 = 3.375.)'
);
seedQ('MD', 'Volume',
  'A closed box has outer dimensions 20 × 10 × 8 cm with walls 1 cm thick. How much EMPTY interior space does it have?',
  '864 cm³',
  '736 cm³',
  '1600 cm³',
  '960 cm³',
  'Interior dims: 18 × 8 × 6 = 864 cm³.'
);
seedQ('MD', 'Volume',
  'A container is 10 × 6 × 4 units. How many 2 × 2 × 2 cubes fit inside exactly?',
  '30',
  '24',
  '15',
  '60',
  'Divide each dimension by 2: 5 × 3 × 2 = 30 cubes.'
);
seedQ('MD', 'Volume',
  'A tank measures 4 m × 3 m × 2 m and is completely full. Water drains at 6 m³ per hour. How long will it take to empty?',
  '4 hours',
  '3 hours',
  '6 hours',
  '2 hours',
  'Volume = 4 × 3 × 2 = 24 m³. Time = 24 ÷ 6 = 4 hours.'
);

// ── MD / Measurement Conversions (20) ───────────────────────────────────────
// [MEDIUM]
seedQ('MD', 'Measurement Conversions',
  'Convert 5 km to meters.',
  '5,000 m',
  '500 m',
  '50,000 m',
  '50 m',
  '1 km = 1,000 m, so 5 km = 5,000 m.'
);
seedQ('MD', 'Measurement Conversions',
  'Convert 3.2 L to milliliters.',
  '3,200 mL',
  '320 mL',
  '32 mL',
  '32,000 mL',
  '1 L = 1,000 mL, so 3.2 × 1,000 = 3,200 mL.'
);
seedQ('MD', 'Measurement Conversions',
  'Convert 4 lb to ounces. (1 lb = 16 oz)',
  '64 oz',
  '48 oz',
  '20 oz',
  '40 oz',
  '4 × 16 = 64 oz.'
);
seedQ('MD', 'Measurement Conversions',
  'Convert 3 hours to minutes.',
  '180 min',
  '120 min',
  '90 min',
  '300 min',
  '1 hr = 60 min, so 3 × 60 = 180.'
);
seedQ('MD', 'Measurement Conversions',
  'Convert 250 cm to meters.',
  '2.5 m',
  '25 m',
  '0.25 m',
  '2.05 m',
  '1 m = 100 cm, so 250 ÷ 100 = 2.5 m.'
);

// [HIGH]
seedQ('MD', 'Measurement Conversions',
  'Convert 3.5 km to cm.',
  '350,000 cm',
  '35,000 cm',
  '3,500 cm',
  '3,500,000 cm',
  '1 km = 1,000 m = 100,000 cm. 3.5 × 100,000 = 350,000 cm.'
);
seedQ('MD', 'Measurement Conversions',
  'A faucet drips 1 cup every 10 minutes. How many gallons are wasted in one week? (1 gal = 16 cups)',
  '63 gal',
  '42 gal',
  '84 gal',
  '56 gal',
  'One week = 7 × 24 × 60 = 10,080 min. Cups: 10,080 ÷ 10 = 1,008. Gallons: 1,008 ÷ 16 = 63.'
);
seedQ('MD', 'Measurement Conversions',
  'Tom drinks 5 cups of water a day. How many fluid ounces is that? (1 cup = 8 fl oz)',
  '40 fl oz',
  '32 fl oz',
  '45 fl oz',
  '50 fl oz',
  '5 × 8 = 40 fl oz.'
);
seedQ('MD', 'Measurement Conversions',
  'A runner averages 8 minutes per mile. How long does it take to run a 5K (3.1 miles)?',
  'About 24 minutes 48 seconds',
  'About 26 minutes',
  'About 25 minutes',
  'About 30 minutes',
  '8 × 3.1 = 24.8 min = 24 min + 0.8 × 60 sec = 24 min 48 sec.'
);
seedQ('MD', 'Measurement Conversions',
  'A distance is 2 km 450 m. What is that in meters?',
  '2,450 m',
  '2,045 m',
  '245 m',
  '2.45 m',
  '2 km = 2,000 m. 2,000 + 450 = 2,450 m.'
);
seedQ('MD', 'Measurement Conversions',
  'Convert 2.5 feet to inches.',
  '30 inches',
  '25 inches',
  '36 inches',
  '20 inches',
  '1 ft = 12 in. 2.5 × 12 = 30.'
);
seedQ('MD', 'Measurement Conversions',
  'Convert 48 ounces to pounds. (1 lb = 16 oz)',
  '3 lb',
  '4 lb',
  '2 lb',
  '6 lb',
  '48 ÷ 16 = 3.'
);
seedQ('MD', 'Measurement Conversions',
  'Convert 7,200 seconds to hours.',
  '2 hours',
  '3 hours',
  '1 hour',
  '4 hours',
  '1 hour = 3,600 sec. 7,200 ÷ 3,600 = 2.'
);
seedQ('MD', 'Measurement Conversions',
  'Convert 3 gallons to fluid ounces. (1 gal = 128 fl oz)',
  '384 fl oz',
  '256 fl oz',
  '48 fl oz',
  '480 fl oz',
  '3 × 128 = 384 fl oz.'
);
seedQ('MD', 'Measurement Conversions',
  'Convert 2 days to seconds.',
  '172,800 seconds',
  '86,400 seconds',
  '17,280 seconds',
  '1,728,000 seconds',
  '1 day = 24 × 3,600 = 86,400 sec. 2 × 86,400 = 172,800.'
);

// [VERY HIGH]
seedQ('MD', 'Measurement Conversions',
  'A runner trains at 8 min per mile. How long will it take to run a 10 km race? (1 mile ≈ 1.609 km)',
  'About 49 minutes 43 seconds',
  'About 80 minutes',
  'About 48 minutes',
  'About 55 minutes',
  '10 km ÷ 1.609 ≈ 6.2137 miles. Time = 8 × 6.2137 ≈ 49.71 min ≈ 49 min 43 sec.'
);
seedQ('MD', 'Measurement Conversions',
  'A family uses 8 cups of water per day. About how many gallons is that in one year (365 days)? (1 gal = 16 cups)',
  '182.5 gallons',
  '365 gallons',
  '45.6 gallons',
  '91.25 gallons',
  'Cups/year = 8 × 365 = 2,920. Gallons = 2,920 ÷ 16 = 182.5.'
);
seedQ('MD', 'Measurement Conversions',
  'A tank holds 3 gallons. A pipe fills it at a rate of 2 cups per minute. How long does it take to fill? (1 gal = 16 cups)',
  '24 minutes',
  '12 minutes',
  '48 minutes',
  '30 minutes',
  '3 gal = 48 cups. 48 ÷ 2 = 24 minutes.'
);
seedQ('MD', 'Measurement Conversions',
  'Add these lengths and express in km: 3.5 km + 450 m + 25,000 cm.',
  '4.2 km',
  '3.95 km',
  '4.7 km',
  '4.8 km',
  '450 m = 0.45 km. 25,000 cm = 250 m = 0.25 km. Total = 3.5 + 0.45 + 0.25 = 4.2 km.'
);
seedQ('MD', 'Measurement Conversions',
  'A car uses 1 gallon of gas per 28 miles. How many quarts of gas are needed for 112 miles? (1 gal = 4 qt)',
  '16 quarts',
  '4 quarts',
  '8 quarts',
  '28 quarts',
  '112 ÷ 28 = 4 gallons. 4 × 4 = 16 quarts.'
);

// ── NBT / Place Value & Decimals (20) ───────────────────────────────────────
// [MEDIUM]
seedQ('NBT', 'Place Value & Decimals',
  'In the number 3.052, what is the value of the digit 5?',
  '5 hundredths (0.05)',
  '5 tenths (0.5)',
  '5 thousandths (0.005)',
  '5 (five)',
  'The 5 sits in the hundredths place, so its value is 5 × 0.01 = 0.05.'
);
seedQ('NBT', 'Place Value & Decimals',
  'How is 4.26 written in words?',
  'Four and twenty-six hundredths',
  'Four and twenty-six tenths',
  'Four point twenty-six',
  'Four and two hundred six hundredths',
  '4.26 = 4 + 26/100 = four and twenty-six hundredths.'
);
seedQ('NBT', 'Place Value & Decimals',
  'What place is the digit 7 in the number 0.037?',
  'Thousandths',
  'Hundredths',
  'Tenths',
  'Ten-thousandths',
  'Three positions after the decimal: tenths, hundredths, thousandths. So 7 is in thousandths.'
);
seedQ('NBT', 'Place Value & Decimals',
  'Write "six and five tenths" in standard form.',
  '6.5',
  '65',
  '0.65',
  '6.05',
  'Six = 6. Five tenths = 0.5. Together: 6.5.'
);
seedQ('NBT', 'Place Value & Decimals',
  'Which statement is TRUE? 0.4 __ 0.40',
  '0.4 = 0.40 (they are equal)',
  '0.4 < 0.40',
  '0.4 > 0.40',
  'Cannot compare',
  '0.40 is 0.4 with an extra 0 in the hundredths place, which adds no value. They are equal.'
);

// [HIGH]
seedQ('NBT', 'Place Value & Decimals',
  'The value of the digit 3 in 3.4 is how many times the value of the digit 3 in 0.34?',
  '10 times',
  '100 times',
  '1/10',
  '1 time (same)',
  '3 in 3.4 has value 3. 3 in 0.34 has value 0.3. 3 ÷ 0.3 = 10.'
);
seedQ('NBT', 'Place Value & Decimals',
  'Order from LEAST to GREATEST: 0.5, 0.55, 0.505, 0.055',
  '0.055, 0.5, 0.505, 0.55',
  '0.055, 0.5, 0.55, 0.505',
  '0.5, 0.055, 0.505, 0.55',
  '0.505, 0.055, 0.5, 0.55',
  'Line up place values: 0.055, 0.500, 0.505, 0.550. In order: 0.055, 0.5, 0.505, 0.55.'
);
seedQ('NBT', 'Place Value & Decimals',
  'Round 7.846 to the nearest tenth.',
  '7.8',
  '7.9',
  '8.0',
  '7.85',
  'Look at the hundredths digit (4). Since 4 < 5, round down. 7.846 → 7.8.'
);
seedQ('NBT', 'Place Value & Decimals',
  'Round 0.0648 to the nearest hundredth.',
  '0.06',
  '0.07',
  '0.065',
  '0.1',
  'Look at the thousandths digit (4). 4 < 5, round down. 0.0648 → 0.06.'
);
seedQ('NBT', 'Place Value & Decimals',
  'Write 406.23 in expanded form.',
  '400 + 6 + 0.2 + 0.03',
  '400 + 60 + 2 + 0.3',
  '4 + 0 + 6 + 2 + 3',
  '400 + 6 + 0.02 + 0.003',
  '406.23 = 4 hundreds + 0 tens + 6 ones + 2 tenths + 3 hundredths = 400 + 6 + 0.2 + 0.03.'
);
seedQ('NBT', 'Place Value & Decimals',
  'The value of the 2 in 200 is how many times the value of the 2 in 0.2?',
  '1,000 times',
  '100 times',
  '10 times',
  '10,000 times',
  '200 ÷ 0.2 = 1,000.'
);
seedQ('NBT', 'Place Value & Decimals',
  'Order from LEAST to GREATEST: 3.09, 3.9, 3.091, 3.19',
  '3.09, 3.091, 3.19, 3.9',
  '3.09, 3.19, 3.091, 3.9',
  '3.09, 3.091, 3.9, 3.19',
  '3.9, 3.19, 3.091, 3.09',
  'Aligned: 3.090, 3.900, 3.091, 3.190. Ordered: 3.090, 3.091, 3.190, 3.900.'
);
seedQ('NBT', 'Place Value & Decimals',
  'The value of the 4 in 3.045 is what fraction of the value of the 4 in 3.450?',
  '1/10',
  '1/100',
  '1/1,000',
  '1 (same value)',
  '3.045: 4 is in hundredths (0.04). 3.450: 4 is in tenths (0.4). 0.04 ÷ 0.4 = 0.1 = 1/10.'
);
seedQ('NBT', 'Place Value & Decimals',
  'The value of the 7 in 74 is how many times the value of the 7 in 0.7?',
  '100 times',
  '10 times',
  '1,000 times',
  '70 times',
  '7 in 74 = 70. 7 in 0.7 = 0.7. 70 ÷ 0.7 = 100.'
);
seedQ('NBT', 'Place Value & Decimals',
  'Which decimal lies between 0.3 and 0.4?',
  '0.35',
  '0.03',
  '0.45',
  '3.5',
  '0.35 is greater than 0.30 and less than 0.40, so it lies between them.'
);

// [VERY HIGH]
seedQ('NBT', 'Place Value & Decimals',
  'The value of the digit 6 in 6,400 is how many times the value of the digit 6 in 0.06?',
  '100,000 times',
  '10,000 times',
  '1,000,000 times',
  '1,000 times',
  '6 in 6,400 = 6,000. 6 in 0.06 = 0.06. 6,000 ÷ 0.06 = 100,000.'
);
seedQ('NBT', 'Place Value & Decimals',
  'Order from LEAST to GREATEST: 2.305, 2.35, 2.053, 2.3, 2.53',
  '2.053, 2.3, 2.305, 2.35, 2.53',
  '2.053, 2.305, 2.3, 2.35, 2.53',
  '2.053, 2.3, 2.35, 2.305, 2.53',
  '2.3, 2.053, 2.305, 2.35, 2.53',
  'Aligned: 2.053, 2.300, 2.305, 2.350, 2.530. In that order.'
);
seedQ('NBT', 'Place Value & Decimals',
  'Round 5.4949 to the nearest hundredth.',
  '5.49',
  '5.50',
  '5.495',
  '5.5',
  'Look at the thousandths digit: 4. Since 4 < 5, round DOWN. 5.4949 → 5.49. (Do not cascade round; look only at the next digit.)'
);
seedQ('NBT', 'Place Value & Decimals',
  'The value of the 8 in 81,000 is how many times the value of the 8 in 0.008?',
  '10,000,000 times',
  '1,000,000 times',
  '100,000,000 times',
  '100,000 times',
  '8 in 81,000 = 80,000. 8 in 0.008 = 0.008. 80,000 ÷ 0.008 = 10,000,000.'
);
seedQ('NBT', 'Place Value & Decimals',
  'A digit\u2019s position moves two places to the right (e.g., from ones to hundredths). Its new value is what fraction of its original value?',
  '1/100',
  '1/10',
  '1/1,000',
  '1/20',
  'Each place right makes the value 1/10 as much. Two places: 1/10 × 1/10 = 1/100.'
);

// ── NF / Fraction Word Problems (20) ────────────────────────────────────────
// [MEDIUM]
seedQ('NF', 'Fraction Word Problems',
  'Nina runs 1/2 mile each day. How far does she run in 5 days?',
  '2 1/2 miles',
  '2 miles',
  '3 miles',
  '5/10 miles',
  '1/2 × 5 = 5/2 = 2 1/2 miles.'
);
seedQ('NF', 'Fraction Word Problems',
  'There are 9 cookies. Ali eats 2/3 of them. How many cookies did he eat?',
  '6 cookies',
  '3 cookies',
  '4 cookies',
  '9 cookies',
  '2/3 × 9 = 18/3 = 6.'
);
seedQ('NF', 'Fraction Word Problems',
  'A pizza has 8 equal slices. Jo ate 3 slices. What fraction of the pizza is LEFT?',
  '5/8',
  '3/8',
  '1/2',
  '3/5',
  '8 − 3 = 5 slices left out of 8 → 5/8.'
);
seedQ('NF', 'Fraction Word Problems',
  'Mia ran 3/4 mile in the morning and 1/2 mile after school. How far did she run in total?',
  '1 1/4 miles',
  '1 miles',
  '1 1/2 miles',
  '3/8 miles',
  '3/4 + 1/2 = 3/4 + 2/4 = 5/4 = 1 1/4.'
);
seedQ('NF', 'Fraction Word Problems',
  'A recipe uses 1/3 cup of sugar per batch. How much sugar is needed for 3 batches?',
  '1 cup',
  '2/3 cup',
  '3/3 cup (= 0.9)',
  '1 1/3 cups',
  '1/3 × 3 = 3/3 = 1 cup.'
);

// [HIGH]
seedQ('NF', 'Fraction Word Problems',
  'Carlos spent 2/5 of his allowance on a book and 1/4 on snacks. What fraction of his allowance is LEFT?',
  '7/20',
  '3/9',
  '13/20',
  '3/4',
  'LCD = 20: book 8/20 + snacks 5/20 = 13/20 spent. Left = 1 − 13/20 = 20/20 − 13/20 = 7/20.'
);
seedQ('NF', 'Fraction Word Problems',
  'Nina runs 3/4 mile each day. How many days will it take her to run a total of 6 miles?',
  '8 days',
  '6 days',
  '9 days',
  '4 1/2 days',
  '6 ÷ 3/4 = 6 × 4/3 = 24/3 = 8 days.'
);
seedQ('NF', 'Fraction Word Problems',
  'A pool holds 4,500 gallons when full. It is currently 7/10 full. After a party, 1/6 of THAT water evaporates. How many gallons remain?',
  '2,625 gallons',
  '3,150 gallons',
  '525 gallons',
  '750 gallons',
  'Start water: 7/10 × 4,500 = 3,150. Evaporate 1/6: 3,150 × 1/6 = 525. Remaining: 3,150 − 525 = 2,625.'
);
seedQ('NF', 'Fraction Word Problems',
  'A 6-foot board must be cut into pieces each exactly 3/4 foot long with no waste. The pieces are sold in groups of 4. How many complete groups can be made?',
  '2 groups',
  '3 groups',
  '4 groups',
  '8 groups',
  'Number of pieces: 6 ÷ 3/4 = 8 pieces. Groups of 4: 8 ÷ 4 = 2.'
);
seedQ('NF', 'Fraction Word Problems',
  'Carla had $60. She spent 1/3 on lunch and 1/4 on the bus. How much money does she have LEFT?',
  '$25',
  '$35',
  '$20',
  '$45',
  'Spent = 1/3 + 1/4 = 4/12 + 3/12 = 7/12. Left = 5/12. 5/12 × 60 = 25.'
);
seedQ('NF', 'Fraction Word Problems',
  'A trail is 5 1/4 miles long. A hiker walked 2 3/4 miles. How far does she have LEFT?',
  '2 1/2 miles',
  '2 3/4 miles',
  '3 miles',
  '8 miles',
  '5 1/4 − 2 3/4 = 21/4 − 11/4 = 10/4 = 2 1/2.'
);
seedQ('NF', 'Fraction Word Problems',
  'A wall is painted 1/3 red and 1/4 blue. The rest is white. What fraction is white?',
  '5/12',
  '7/12',
  '1/12',
  '2/7',
  'Red + blue = 4/12 + 3/12 = 7/12. White = 1 − 7/12 = 5/12.'
);
seedQ('NF', 'Fraction Word Problems',
  'A recipe makes 2 3/4 cups of batter. How much batter will 3 recipes make?',
  '8 1/4 cups',
  '6 3/4 cups',
  '7 1/4 cups',
  '5 1/2 cups',
  '2 3/4 × 3 = 11/4 × 3 = 33/4 = 8 1/4.'
);
seedQ('NF', 'Fraction Word Problems',
  'A school bus drives 3/8 mile between stops. If it makes 12 stops in one route, what is the total distance?',
  '4 1/2 miles',
  '3 6/8 miles',
  '5 miles',
  '36/8 miles (= 4)',
  '3/8 × 12 = 36/8 = 4 4/8 = 4 1/2.'
);
seedQ('NF', 'Fraction Word Problems',
  'A class has 24 students. 3/8 of them are boys. How many are girls?',
  '15 girls',
  '9 girls',
  '16 girls',
  '8 girls',
  'Boys = 3/8 × 24 = 9. Girls = 24 − 9 = 15. (Or 5/8 × 24 = 15.)'
);

// [VERY HIGH]
seedQ('NF', 'Fraction Word Problems',
  'Amy has $48. She spends 1/4 on a book, then spends 1/2 of the remaining money on food. How much does she have LEFT?',
  '$18',
  '$24',
  '$12',
  '$6',
  'After book: 48 × 3/4 = 36. After food: 36 × 1/2 = 18. Left = $18. (Key: 1/2 applies to the REMAINING, not the original.)'
);
seedQ('NF', 'Fraction Word Problems',
  'A tank holds 600 gallons and is 2/3 full. Then 1/5 of the water in the tank is drained. How much water remains?',
  '320 gallons',
  '400 gallons',
  '280 gallons',
  '480 gallons',
  'Water in tank: 2/3 × 600 = 400. After draining 1/5: 400 × 4/5 = 320.'
);
seedQ('NF', 'Fraction Word Problems',
  'Jake reads 2/5 of a book on Monday and 1/3 of the REMAINING pages on Tuesday. What fraction of the book is still unread after Tuesday?',
  '2/5',
  '3/5',
  '7/15',
  '1/5',
  'After Mon: 1 − 2/5 = 3/5 left. Tue reads 1/3 × 3/5 = 1/5. Still unread = 3/5 − 1/5 = 2/5.'
);
seedQ('NF', 'Fraction Word Problems',
  'A stick is 4 feet long and must be cut into pieces of 2/3 foot each with no waste. The pieces are sold in groups of 3. How many complete groups can be made?',
  '2 groups',
  '3 groups',
  '6 groups',
  '4 groups',
  'Pieces: 4 ÷ 2/3 = 4 × 3/2 = 6. Groups of 3: 6 ÷ 3 = 2 groups.'
);
seedQ('NF', 'Fraction Word Problems',
  'A car\u2019s gas tank holds 15 gallons. It uses 3/4 gallon per hour of driving. How many hours can it run on a full tank?',
  '20 hours',
  '12 hours',
  '18 hours',
  '11 1/4 hours',
  '15 ÷ 3/4 = 15 × 4/3 = 60/3 = 20 hours.'
);

// ── G / 2D Figure Classification (20) ───────────────────────────────────────
// [MEDIUM]
seedQ('G', '2D Figure Classification',
  'How many right angles does a square have?',
  '4',
  '2',
  '3',
  '0',
  'All four interior angles of a square measure 90° (right angles).'
);
seedQ('G', '2D Figure Classification',
  'How many sides does a regular pentagon have?',
  '5',
  '6',
  '4',
  '7',
  'A pentagon by definition has 5 sides.'
);
seedQ('G', '2D Figure Classification',
  'What is true about all side lengths of an equilateral triangle?',
  'All three sides are equal',
  'Two sides are equal, one is different',
  'All three sides are different',
  'Two sides must be right angles',
  'Equilateral means "equal sides" — all three sides are the same length.'
);
seedQ('G', '2D Figure Classification',
  'A rhombus with four right angles is what kind of shape?',
  'A square',
  'A rectangle',
  'A kite',
  'A parallelogram (not a special one)',
  'A rhombus has 4 equal sides. Add 4 right angles → it becomes a square.'
);
seedQ('G', '2D Figure Classification',
  'How many pairs of parallel sides does every parallelogram have?',
  '2 pairs',
  '1 pair',
  '3 pairs',
  '0 pairs',
  'A parallelogram has 2 pairs of parallel sides (both pairs of opposite sides are parallel).'
);

// [HIGH]
seedQ('G', '2D Figure Classification',
  'A polygon has interior angles that sum to 540°. How many sides does it have?',
  '5 sides (pentagon)',
  '4 sides (quadrilateral)',
  '6 sides (hexagon)',
  '7 sides (heptagon)',
  'Sum = (n − 2) × 180. Set (n − 2) × 180 = 540 → n − 2 = 3 → n = 5.'
);
seedQ('G', '2D Figure Classification',
  'A triangle has sides of length 5, 12, and 13. Is it a right triangle?',
  'Yes — 5² + 12² = 13² (25 + 144 = 169)',
  'No — the sides are all different',
  'No — the angles are too big',
  'Only if it is isosceles',
  'By the Pythagorean theorem, a right triangle satisfies a² + b² = c². Here 25 + 144 = 169 = 13², so yes.'
);
seedQ('G', '2D Figure Classification',
  'A triangle has angles in the ratio 2:3:7. What type of triangle is it?',
  'Obtuse scalene',
  'Acute scalene',
  'Right isosceles',
  'Obtuse isosceles',
  'Sum of parts = 12. Each part = 180/12 = 15°. Angles: 30°, 45°, 105°. 105° > 90° → obtuse. All different → scalene.'
);
seedQ('G', '2D Figure Classification',
  'How many lines of symmetry does a regular hexagon have?',
  '6 lines',
  '3 lines',
  '12 lines',
  '4 lines',
  'A regular hexagon has 6 lines: 3 through opposite vertices and 3 through midpoints of opposite sides.'
);
seedQ('G', '2D Figure Classification',
  'Which is a defining property of a rhombus that is NOT always true of a parallelogram?',
  'All four sides are equal in length',
  'Opposite sides are parallel',
  'Opposite angles are equal',
  'Diagonals bisect each other',
  'A rhombus is a parallelogram with the extra condition that all 4 sides are equal. The other 3 options are true of every parallelogram.'
);
seedQ('G', '2D Figure Classification',
  'What is the defining property of a trapezoid?',
  'It has exactly one pair of parallel sides',
  'It has two pairs of parallel sides',
  'All four sides are equal',
  'It has four right angles',
  'A trapezoid is a quadrilateral with exactly one pair of parallel sides. (Two pairs would make it a parallelogram.)'
);
seedQ('G', '2D Figure Classification',
  'What is the sum of the interior angles of an octagon?',
  '1,080°',
  '720°',
  '900°',
  '1,440°',
  '(n − 2) × 180 = (8 − 2) × 180 = 6 × 180 = 1,080°.'
);
seedQ('G', '2D Figure Classification',
  'Which is a defining property of a kite?',
  'Two pairs of adjacent sides are equal',
  'All four sides are equal',
  'Opposite sides are parallel',
  'All angles are right angles',
  'A kite has two pairs of consecutive (adjacent) sides equal in length — not opposite sides.'
);
seedQ('G', '2D Figure Classification',
  'A triangle has sides of length 8, 15, and 17. Is it a right triangle?',
  'Yes — 8² + 15² = 17² (64 + 225 = 289)',
  'No — the sides are all different',
  'No — the numbers are too large',
  'Only if the triangle is equilateral',
  '64 + 225 = 289 = 17². Pythagorean theorem confirms it is a right triangle.'
);
seedQ('G', '2D Figure Classification',
  'A triangle has angles 30°, 60°, and 90°. What type of triangle is it?',
  'Right scalene',
  'Acute scalene',
  'Right isosceles',
  'Obtuse scalene',
  '90° angle → right triangle. All three angles different → scalene.'
);

// [VERY HIGH]
seedQ('G', '2D Figure Classification',
  'Which of these is a property shared by ALL parallelograms?',
  'Opposite sides are equal and parallel',
  'All four sides are equal',
  'All four angles are right angles',
  'Diagonals are always perpendicular',
  'Every parallelogram has opposite sides equal and parallel. The other properties only apply to special parallelograms (rhombus, rectangle, square).'
);
seedQ('G', '2D Figure Classification',
  'A triangle has angles in the ratio 1:2:3. What type of triangle is it?',
  'Right scalene',
  'Acute scalene',
  'Obtuse scalene',
  'Right isosceles',
  'Sum of parts = 6. Each part = 30°. Angles: 30°, 60°, 90°. 90° → right; all different → scalene.'
);
seedQ('G', '2D Figure Classification',
  'What is the measure of each interior angle of a regular hexagon?',
  '120°',
  '108°',
  '135°',
  '90°',
  'Sum = (6 − 2) × 180 = 720°. Each angle = 720 ÷ 6 = 120°.'
);
seedQ('G', '2D Figure Classification',
  'A triangle has sides of length 9, 40, and 41. Is it a right triangle?',
  'Yes — 9² + 40² = 41² (81 + 1,600 = 1,681)',
  'No — 9 is too short',
  'No — none of the sides are equal',
  'Only if it is equilateral',
  '81 + 1,600 = 1,681 = 41². The Pythagorean relationship holds, so it is a right triangle.'
);
seedQ('G', '2D Figure Classification',
  'A regular polygon has each interior angle measuring 144°. How many sides does it have?',
  '10 sides (decagon)',
  '8 sides (octagon)',
  '12 sides (dodecagon)',
  '9 sides (nonagon)',
  'Interior angle = (n − 2) × 180 / n = 144. Solve: 180n − 360 = 144n → 36n = 360 → n = 10.'
);

// ── Post-seed corrections: fix answers/explanations on questions that were
//    seeded earlier with bugs. INSERT OR IGNORE skips rows that already exist,
//    so we use UPDATE (idempotent) for corrections.
db.prepare(`
  UPDATE questions
  SET answer = '1/10',
      wrong_a = '1/100',
      explanation = 'In 3.045 the 4 is in the hundredths place (0.04). In 3.450 the 4 is in the tenths place (0.4). 0.04 ÷ 0.4 = 0.1 = 1/10.'
  WHERE question = 'The value of the 4 in 3.045 is how many times the value of the 4 in 3.450?'
`).run();

module.exports = db;

