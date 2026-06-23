-- Ajout de la colonne avatar_url sur la table collaborators
ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;
