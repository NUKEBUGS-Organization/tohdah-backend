/**
 * Load `.env` before any module reads `process.env` (e.g. Multer decorators on UploadController).
 */
import { config } from 'dotenv';

config();
