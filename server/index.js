const express = require('express');
const cors = require('cors');
const questionsRouter = require('./routes/questions');
const scoresRouter    = require('./routes/scores');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.use('/api/questions', questionsRouter);
app.use('/api/scores',    scoresRouter);

app.listen(PORT, () => {
  console.log(`NeevCAASPP server running on http://localhost:${PORT}`);
});
