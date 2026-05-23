-- Migration : durcit les tables watchlists / watchlist_tickers
-- À appliquer dans le SQL editor de Supabase (ou copier dans le repo backend
-- max72loop/alphabrief sous migrations/ pour qu'il soit versionné).
--
-- Pourquoi :
--   1. /api/watchlist POST faisait `select → if not exists → insert` sans UNIQUE,
--      ce qui ouvrait une race condition (2 watchlists pour 1 user, doublons de tickers).
--   2. Sans UNIQUE(watchlist_id, ticker), un POST simultané pouvait dupliquer.
--   3. Pas d'index sur les colonnes utilisées dans les `eq` → scan complet à terme.
--
-- Cette migration :
--   - dédoublonne les éventuelles entrées existantes (en gardant la plus ancienne),
--   - ajoute deux UNIQUE qui rendent l'API idempotente côté DB,
--   - crée les index manquants.
--
-- Idempotent : peut être ré-exécuté sans casser quoi que ce soit.

-- 1. Dédoublonnage : 1 watchlist par utilisateur (garde la plus ancienne par id).
DELETE FROM public.watchlists w1
USING public.watchlists w2
WHERE w1.id > w2.id
  AND w1.user_id = w2.user_id;

-- 2. Dédoublonnage : pas de ticker en double dans la même watchlist.
DELETE FROM public.watchlist_tickers t1
USING public.watchlist_tickers t2
WHERE t1.id > t2.id
  AND t1.watchlist_id = t2.watchlist_id
  AND t1.ticker = t2.ticker;

-- 3. UNIQUE constraints (DROP + ADD pour rendre la migration ré-exécutable).
ALTER TABLE public.watchlists
  DROP CONSTRAINT IF EXISTS watchlists_user_id_unique;
ALTER TABLE public.watchlists
  ADD CONSTRAINT watchlists_user_id_unique UNIQUE (user_id);

ALTER TABLE public.watchlist_tickers
  DROP CONSTRAINT IF EXISTS watchlist_tickers_watchlist_ticker_unique;
ALTER TABLE public.watchlist_tickers
  ADD CONSTRAINT watchlist_tickers_watchlist_ticker_unique UNIQUE (watchlist_id, ticker);

-- 4. Index pour accélérer les lookups fréquents.
CREATE INDEX IF NOT EXISTS watchlists_user_id_idx
  ON public.watchlists (user_id);
CREATE INDEX IF NOT EXISTS watchlist_tickers_watchlist_id_idx
  ON public.watchlist_tickers (watchlist_id);
CREATE INDEX IF NOT EXISTS watchlist_tickers_ticker_idx
  ON public.watchlist_tickers (ticker);
