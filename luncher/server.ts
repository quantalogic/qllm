import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import main from '../src/qllm';

// Initialize express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(helmet()); // Add security headers
app.use(morgan('combined')); // HTTP request logger
app.use(express.json()); // Parse JSON bodies

// Custom middleware to capture console output
const captureConsoleOutput = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const originalConsoleLog = console.log;
  let output = '';
  console.log = (...args) => {
    output += args.join(' ') + '\n';
  };
  res.locals.getOutput = () => output;
  res.locals.restoreConsole = () => {
    console.log = originalConsoleLog;
  };
  next();
};

// Route for QLLM
app.post('/qllm', captureConsoleOutput, async (req, res) => {
  try {
    // Validate input
    if (!Array.isArray(req.body.args)) {
      return res.status(400).json({ error: 'Invalid args: expected an array' });
    }

    // Simulate command-line arguments
    process.argv = ['node', 'qllm', ...req.body.args];

    // Execute main function
    await main();

    // Get captured output and restore console
    const output = res.locals.getOutput();
    res.locals.restoreConsole();

    res.json({ output });
  } catch (error) {
    res.locals.restoreConsole();
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
