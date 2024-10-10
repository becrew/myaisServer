import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

import app from './index';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});