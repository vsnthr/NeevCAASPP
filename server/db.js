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

module.exports = db;
