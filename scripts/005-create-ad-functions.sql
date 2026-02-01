-- Funções RPC para gerenciar contadores de anúncios

-- Função para incrementar impressões
CREATE OR REPLACE FUNCTION increment_ad_impressions(ad_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE advertisements 
  SET impressions_count = impressions_count + 1,
      updated_at = NOW()
  WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para incrementar cliques
CREATE OR REPLACE FUNCTION increment_ad_clicks(ad_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE advertisements 
  SET clicks_count = clicks_count + 1,
      updated_at = NOW()
  WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter estatísticas de anúncios
CREATE OR REPLACE FUNCTION get_advertisement_stats(
  start_date TIMESTAMPTZ DEFAULT NULL,
  end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  ad_id UUID,
  ad_title TEXT,
  ad_position TEXT,
  ad_type TEXT,
  total_impressions BIGINT,
  total_clicks BIGINT,
  ctr NUMERIC,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a."position" as ad_position,
    a.ad_type,
    COALESCE(COUNT(DISTINCT ai.id), 0) as total_impressions,
    COALESCE(COUNT(DISTINCT ac.id), 0) as total_clicks,
    CASE 
      WHEN COUNT(DISTINCT ai.id) > 0 
      THEN ROUND((COUNT(DISTINCT ac.id)::NUMERIC / COUNT(DISTINCT ai.id)) * 100, 2)
      ELSE 0
    END as ctr,
    a.created_at
  FROM advertisements a
  LEFT JOIN ad_impressions ai ON a.id = ai.advertisement_id
    AND (start_date IS NULL OR ai.viewed_at >= start_date)
    AND (end_date IS NULL OR ai.viewed_at <= end_date)
  LEFT JOIN ad_clicks ac ON a.id = ac.advertisement_id
    AND (start_date IS NULL OR ac.clicked_at >= start_date)
    AND (end_date IS NULL OR ac.clicked_at <= end_date)
  WHERE a.is_active = true
  GROUP BY a.id, a.title, a."position", a.ad_type, a.created_at
  ORDER BY COALESCE(COUNT(DISTINCT ai.id), 0) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;