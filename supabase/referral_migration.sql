-- ============================================================
-- Système de parrainage Posture
-- Objectif : 3 parrainages → 3 mois gratuits à la fin de la Bêta
--
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================================

-- ── 1. Colonnes sur profiles (idempotent) ───────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code  TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_count INTEGER NOT NULL DEFAULT 0;

-- ── 2. Backfill : codes pour les profils existants ──────────
DO $$
DECLARE
  p        RECORD;
  new_code TEXT;
  attempts INT;
BEGIN
  FOR p IN SELECT id FROM public.profiles WHERE referral_code IS NULL LOOP
    attempts := 0;
    LOOP
      new_code := UPPER(encode(gen_random_bytes(4), 'hex'));
      attempts := attempts + 1;
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE referral_code = new_code
      ) OR attempts > 100;
    END LOOP;
    IF attempts > 100 THEN
      new_code := UPPER(substr(replace(p.id::text, '-', ''), 1, 8));
    END IF;
    UPDATE public.profiles SET referral_code = new_code WHERE id = p.id;
  END LOOP;
END;
$$;

-- ── 3. Trigger BEFORE INSERT profiles : génération du code ──
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  attempts INT := 0;
BEGIN
  LOOP
    new_code := UPPER(encode(gen_random_bytes(4), 'hex'));
    attempts  := attempts + 1;
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE referral_code = new_code
    ) OR attempts > 100;
  END LOOP;
  NEW.referral_code := CASE
    WHEN attempts > 100 THEN UPPER(substr(replace(NEW.id::text, '-', ''), 1, 8))
    ELSE new_code
  END;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  NEW.referral_code := UPPER(substr(replace(NEW.id::text, '-', ''), 1, 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS set_referral_code ON public.profiles;
CREATE TRIGGER set_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.referral_code IS NULL)
  EXECUTE FUNCTION public.generate_referral_code();

-- ── 4. Trigger AFTER INSERT auth.users : tracking parrainage ─
-- Nommé avec préfixe 'z_' pour s'exécuter après on_auth_user_created
-- (PostgreSQL exécute les triggers AFTER dans l'ordre alphabétique du nom)
CREATE OR REPLACE FUNCTION public.track_referral_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  v_ref_code TEXT;
  v_ref_id   UUID;
BEGIN
  BEGIN
    v_ref_code := UPPER(TRIM(COALESCE(NEW.raw_user_meta_data->>'ref_code', '')));
    IF v_ref_code <> '' THEN
      SELECT id INTO v_ref_id
      FROM public.profiles
      WHERE referral_code = v_ref_code
        AND id <> NEW.id
      LIMIT 1;

      IF v_ref_id IS NOT NULL THEN
        UPDATE public.profiles
          SET referred_by = v_ref_id
          WHERE id = NEW.id;

        UPDATE public.profiles
          SET referral_count = COALESCE(referral_count, 0) + 1
          WHERE id = v_ref_id;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Parrainage non critique, le compte est créé quand même
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS z_on_auth_user_referral ON auth.users;
CREATE TRIGGER z_on_auth_user_referral
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.track_referral_on_signup();

-- ── 5. RLS : lecture publique pour résolution du code parrain ─
-- Permet à une page de signup (visiteur non connecté) de résoudre
-- le code de parrainage → afficher "Invité par [Prénom]"
DROP POLICY IF EXISTS "Public referral lookup" ON public.profiles;
CREATE POLICY "Public referral lookup"
  ON public.profiles FOR SELECT
  TO anon
  USING (referral_code IS NOT NULL);
