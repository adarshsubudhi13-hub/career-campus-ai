CREATE POLICY "Users update own resume files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = (auth.uid())::text)
WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = (auth.uid())::text);