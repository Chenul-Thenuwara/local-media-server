import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import connectDB from './db';

import routes from './routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Connect to Database
connectDB();

app.use(cors());
app.use(express.json());

app.use('/api', routes);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
