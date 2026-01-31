import express from 'express';
import { createClient } from '@supabase/supabase-js';

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
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    // Check if Supabase client is available
    if (!supabase) {
      return res.status(500).json({ error: 'Storage service not configured' });
    }

    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const { error } = await supabase.storage
      .from('generated-images')
      .remove([filename]);

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
