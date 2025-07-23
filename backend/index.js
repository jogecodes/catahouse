const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

app.get('/api/check-user/:username', async (req, res) => {
  const { username } = req.params;
  const url = `https://letterboxd.com/${username}/`;
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (response.ok) {
      res.json({ exists: true, url });
    } else {
      res.json({ exists: false });
    }
  } catch (err) {
    res.status(500).json({ exists: false, error: 'Network error' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
}); 