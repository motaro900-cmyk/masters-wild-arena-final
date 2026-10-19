/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Single Vercel Serverless Function entry point.
 *           Routes all /api/* requests through the universal Express application,
 *           keeping the serverless function count at 1 (well within Vercel Hobby limits).
 */

import app from '../server/app.js';

export default function handler(req, res) {
    return app(req, res);
}
