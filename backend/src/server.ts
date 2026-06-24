import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { connectDB } from './db';
import { Event } from './models/Event';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Security Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan('combined')); // HTTP request logging

// Ensure DB connection for Serverless environments
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Serve tracker script as static file
app.use(express.static(path.join(__dirname, '../../tracker')));

// Middleware
app.use(
  cors({
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
);
app.use(express.json());
app.use(express.text({ type: 'text/plain' }));

// Rate Limiting for Data Ingestion
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again after a minute' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// POST /api/events — Ingest event data
app.post('/api/events', apiLimiter, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // sendBeacon sends data as text/plain, so we need to parse it
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        res.status(400).json({ error: 'Invalid JSON payload' });
        return;
      }
    }

    const { sessionId, eventType, pageUrl, meta } = body;

    if (!sessionId || !eventType || !pageUrl) {
      res.status(400).json({
        error: 'Missing required fields: sessionId, eventType, pageUrl',
      });
      return;
    }

    if (typeof sessionId !== 'string' || typeof eventType !== 'string' || typeof pageUrl !== 'string') {
      res.status(400).json({ error: 'Invalid data types for required fields' });
      return;
    }

    if (!['page_view', 'click'].includes(eventType)) {
      res.status(400).json({
        error: "Invalid eventType. Must be 'page_view' or 'click'",
      });
      return;
    }

    // Sanitize meta
    let sanitizedMeta: Record<string, any> = {};
    if (meta && typeof meta === 'object') {
      if (typeof meta.x === 'number') sanitizedMeta.x = meta.x;
      if (typeof meta.y === 'number') sanitizedMeta.y = meta.y;
    }

    const event = new Event({
      sessionId,
      eventType,
      pageUrl,
      timestamp: new Date(),
      meta: sanitizedMeta,
    });

    await event.save();
    res.status(201).json({ success: true, eventId: event._id });
  } catch (error) {
    next(error);
  }
});

// GET /api/sessions — Aggregated session list
app.get('/api/sessions', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sessions = await Event.aggregate([
      {
        $group: {
          _id: '$sessionId',
          totalEvents: { $sum: 1 },
          startTime: { $min: '$timestamp' },
          lastActivity: { $max: '$timestamp' },
          pages: { $addToSet: '$pageUrl' },
        },
      },
      {
        $sort: { startTime: -1 },
      },
      {
        $project: {
          _id: 0,
          sessionId: '$_id',
          totalEvents: 1,
          startTime: 1,
          lastActivity: 1,
          pages: 1,
        },
      },
    ]);

    res.json(sessions);
  } catch (error) {
    next(error);
  }
});

// GET /api/sessions/:sessionId/events — Events for a specific session
app.get(
  '/api/sessions/:sessionId/events',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sessionId } = req.params;

      const events = await Event.find({ sessionId })
        .sort({ timestamp: 1 })
        .lean();

      if (events.length === 0) {
        res.status(404).json({ error: 'No events found for this session' });
        return;
      }

      res.json(events);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/heatmap — Click data for a specific page URL
app.get('/api/heatmap', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { pageUrl } = req.query;

    if (!pageUrl || typeof pageUrl !== 'string') {
      res.status(400).json({ error: 'Missing required query parameter: pageUrl' });
      return;
    }

    const clicks = await Event.find({
      pageUrl,
      eventType: 'click',
    })
      .select('sessionId meta timestamp')
      .sort({ timestamp: -1 })
      .lean();

    res.json(clicks);
  } catch (error) {
    next(error);
  }
});

// GET /api/pages — Distinct tracked page URLs
app.get('/api/pages', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pages = await Event.distinct('pageUrl');
    res.json(pages);
  } catch (error) {
    next(error);
  }
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(' Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server (only if not running in a serverless environment like Vercel)
if (process.env.NODE_ENV !== 'production') {
  async function main(): Promise<void> {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Analytics API running at http://localhost:${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/api/health`);
    });
  }

  main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

// Export for Vercel Serverless Functions
export default app;
