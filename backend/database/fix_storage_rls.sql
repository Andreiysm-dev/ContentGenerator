-- Enable RLS on storage.objects if not already enabled
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public access to view images (Select)
CREATE POLICY "Public Access to Generated Images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'generated-images' );

-- Allow authenticated users to upload images (Insert)
CREATE POLICY "Allow Authenticated Uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'generated-images' );

-- Allow authenticated users to update/delete their own uploads (Optional but recommended)
CREATE POLICY "Allow Authenticated Updates"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'generated-images' );

CREATE POLICY "Allow Authenticated Deletes"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'generated-images' );
