CREATE TYPE public.member_category AS ENUM ('incoming', 'board');

CREATE TABLE public.board_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  position text NOT NULL,
  category public.member_category NOT NULL DEFAULT 'board',
  bio text,
  photo_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view members" ON public.board_members FOR SELECT USING (true);
CREATE POLICY "Admins insert members" ON public.board_members FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update members" ON public.board_members FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete members" ON public.board_members FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_board_members_updated_at
BEFORE UPDATE ON public.board_members
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO storage.buckets (id, name, public) VALUES ('member-photos', 'member-photos', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Public read member photos" ON storage.objects FOR SELECT USING (bucket_id = 'member-photos');
CREATE POLICY "Admins upload member photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'member-photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update member photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'member-photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete member photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'member-photos' AND public.has_role(auth.uid(), 'admin'));