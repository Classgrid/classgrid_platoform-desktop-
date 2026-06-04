-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the syllabus_chunks table
CREATE TABLE syllabus_vectors (
  id BIGSERIAL PRIMARY KEY,
  material_id UUID NOT NULL, -- Link to Classgrid Material/Note
  org_id TEXT NOT NULL,
  content TEXT NOT NULL, -- The text chunk
  metadata JSONB, -- Classroom ID, User ID, Date, etc
  embedding VECTOR(1536) -- For OpenAI text-embedding-3-small (1536 dims)
);

-- 3. Create an index for fast cosine similarity search
CREATE INDEX ON syllabus_vectors USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 4. RPC function for matching chunks (called from JS)
CREATE OR REPLACE FUNCTION match_syllabus_chunks (
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  p_org_id TEXT
)
RETURNS TABLE (
  id BIGINT,
  material_id UUID,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    syllabus_vectors.id,
    syllabus_vectors.material_id,
    syllabus_vectors.content,
    1 - (syllabus_vectors.embedding <=> query_embedding) AS similarity
  FROM syllabus_vectors
  WHERE 1 - (syllabus_vectors.embedding <=> query_embedding) > match_threshold
    AND syllabus_vectors.org_id = p_org_id
  ORDER BY syllabus_vectors.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
