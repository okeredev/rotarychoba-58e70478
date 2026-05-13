CREATE POLICY "Admins update payment proofs"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete payment proofs"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update sponsor files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'sponsor-files' AND public.has_role(auth.uid(), 'admin'));