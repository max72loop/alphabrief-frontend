-- Migration : aligne et alimente la table score_history.
-- À appliquer dans le SQL editor de Supabase (puis copier dans le repo backend
-- max72loop/alphabrief sous migrations/ pour qu'elle soit versionnée).
--
-- Contexte du bug :
--   - Le frontend lit `score_history` dans 5 endroits (ticker page, watchlist,
--     dashboard guest, historique, sparkline) et sélectionne la colonne `scored_at`.
--   - La migration backend `2026_05_20_score_history.sql` créait la colonne sous
--     le nom `recorded_at`. Toutes les queries frontend renvoient donc data=null
--     silencieusement → "Pas encore d'historique" partout.
--   - Aucun code Python du repo `alphabrief` n'INSERT dans `score_history` :
--     le scheduler utilise un JsonStore local. La table est donc vide même
--     après alignement de la colonne.
--
-- Cette migration :
--   1. Renomme `recorded_at` → `scored_at` (idempotent, no-op si déjà fait).
--   2. Backfill `score_history` depuis `ticker_scores` (1 row par ticker, à la
--      date du score_date).
--   3. Installe un trigger qui réplique automatiquement chaque upsert
--      `ticker_scores` dans `score_history`, sans toucher le code Python.
--
-- Idempotent : peut être ré-exécutée sans casser quoi que ce soit.

-- ── 1. Rename recorded_at → scored_at (si nécessaire) ──────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'score_history'
      AND column_name = 'recorded_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'score_history'
      AND column_name = 'scored_at'
  ) THEN
    ALTER TABLE public.score_history RENAME COLUMN recorded_at TO scored_at;
  END IF;
END $$;

-- Sécurité : on garantit que `scored_at` existe (au cas où la table aurait été
-- créée à la main sans aucune des deux colonnes).
ALTER TABLE public.score_history
  ADD COLUMN IF NOT EXISTS scored_at timestamptz NOT NULL DEFAULT now();

-- Index pour les lookups ticker × date (les queries du frontend ordonnent
-- toutes par scored_at, on remplace l'ancien index qui pointait sur recorded_at).
DROP INDEX IF EXISTS public.score_history_ticker_recorded_idx;
CREATE INDEX IF NOT EXISTS score_history_ticker_scored_idx
  ON public.score_history (ticker, scored_at DESC);

-- ── 2. Backfill depuis ticker_scores ───────────────────────────────────────
-- Pour chaque ticker actuel, on crée 1 row d'historique à la date de scoring,
-- sauf si une row existe déjà ce jour-là pour ce ticker.
INSERT INTO public.score_history (ticker, score, confidence, scored_at)
SELECT
  ts.ticker,
  ts.score_total::numeric,
  0,
  COALESCE(ts.score_date::timestamptz, now())
FROM public.ticker_scores ts
WHERE NOT EXISTS (
  SELECT 1 FROM public.score_history sh
  WHERE sh.ticker = ts.ticker
    AND sh.scored_at::date = COALESCE(ts.score_date::date, CURRENT_DATE)
);

-- ── 3. Trigger qui réplique chaque upsert ticker_scores → score_history ────
-- Logique :
--   - Si pas de row pour (ticker, score_date) → INSERT.
--   - Si déjà une row pour ce jour → UPDATE (le scoring du jour peut être
--     recalculé plusieurs fois, on garde la dernière valeur de la journée).
-- Cela évite l'explosion de rows tout en gardant 1 point d'historique par jour.

CREATE OR REPLACE FUNCTION public.fn_mirror_score_history()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  ref_date date := COALESCE(NEW.score_date::date, CURRENT_DATE);
  ref_ts   timestamptz := COALESCE(NEW.score_date::timestamptz, now());
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.score_history
    WHERE ticker = NEW.ticker AND scored_at::date = ref_date
  ) THEN
    UPDATE public.score_history
    SET score = NEW.score_total::numeric,
        scored_at = ref_ts
    WHERE ticker = NEW.ticker AND scored_at::date = ref_date;
  ELSE
    INSERT INTO public.score_history (ticker, score, confidence, scored_at)
    VALUES (NEW.ticker, NEW.score_total::numeric, 0, ref_ts);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mirror_score_history ON public.ticker_scores;
CREATE TRIGGER trg_mirror_score_history
  AFTER INSERT OR UPDATE OF score_total ON public.ticker_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_mirror_score_history();

-- ── 4. Sanity check ────────────────────────────────────────────────────────
-- Tu peux vérifier en SQL editor après application :
--   SELECT count(*), min(scored_at), max(scored_at) FROM public.score_history;
-- Le count doit ~= nombre de tickers dans ticker_scores.
