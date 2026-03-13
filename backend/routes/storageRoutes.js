import express from 'express';
import { createClient } from '@supabase/supabase-js';
import db from '../database/db.js';

const router = express.Router();

// Initialize Supabase admin client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

if (supabaseUrl && supabaseServiceKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('Supabase client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
  }
} else {
  console.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables. Storage delete endpoint will not work.');
}

// DELETE - DELETE /api/storage/delete/:filename
router.delete('/storage/delete/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const userId = req.user?.id;
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if Supabase client is available
    if (!supabase) {
      return res.status(500).json({ error: 'Storage service not configured' });
    }

    const decodedFilename = decodeURIComponent(filename).trim();

    // Validate filename to prevent directory traversal
    if (!decodedFilename || decodedFilename.includes('..') || decodedFilename.includes('/') || decodedFilename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const { data: matchingRows, error: rowError } = await db
      .from('contentCalendar')
      .select('contentCalendarId, companyId, imageGenerated, imageGeneratedUrl')
      .or(`imageGenerated.eq.${decodedFilename},imageGeneratedUrl.ilike.%${decodedFilename}`);

    if (rowError) {
      console.error('Storage delete lookup error:', rowError);
      return res.status(500).json({ error: 'Failed to verify file ownership' });
    }

    if (!matchingRows || matchingRows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const authorizedRow = [];
    for (const row of matchingRows) {
      const { data: company, error: companyError } = await db
        .from('company')
        .select('user_id, collaborator_ids')
        .eq('companyId', row.companyId)
        .single();

      if (companyError || !company) {
        continue;
      }

      const hasAccess = company.user_id === userId || (company.collaborator_ids || []).includes(userId);
      if (hasAccess) {
        authorizedRow.push(row);
      }
    }

    if (authorizedRow.length === 0) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { error } = await supabase.storage
      .from('generated-images')
      .remove([decodedFilename]);

    if (error) {
      console.error('Supabase storage delete error:', error);
      // If file doesn't exist, return 404
      if (error.message?.includes('Not found') || error.message?.includes('No such file')) {
        return res.status(404).json({ error: 'File not found' });
      }
      return res.status(500).json({ error: 'Failed to delete file from storage' });
    }

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Storage delete endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
