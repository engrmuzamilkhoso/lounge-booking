-- Run ONCE, after the manual CSV import into Supabase (SQL Editor or psql).
-- Imported rows keep their original ids, which leaves every id sequence at 1.
-- This moves each sequence in the public schema past the highest value in the column
-- that owns it, so new rows don't collide with imported ones. Safe to re-run.

DO $$
DECLARE
  owned_sequence record;
BEGIN
  FOR owned_sequence IN
    SELECT
      sequence_namespace.nspname AS sequence_schema,
      sequence_class.relname     AS sequence_name,
      table_class.relname        AS table_name,
      owning_column.attname      AS column_name
    FROM pg_class AS sequence_class
    JOIN pg_namespace AS sequence_namespace ON sequence_namespace.oid = sequence_class.relnamespace
    JOIN pg_depend AS dependency
      ON dependency.objid = sequence_class.oid AND dependency.deptype IN ('a', 'i')
    JOIN pg_class AS table_class ON table_class.oid = dependency.refobjid
    JOIN pg_attribute AS owning_column
      ON owning_column.attrelid = table_class.oid AND owning_column.attnum = dependency.refobjsubid
    WHERE sequence_class.relkind = 'S'
      AND sequence_namespace.nspname = 'public'
  LOOP
    EXECUTE format(
      'SELECT setval(%L, coalesce((SELECT max(%I) FROM public.%I), 0) + 1, false)',
      owned_sequence.sequence_schema || '.' || owned_sequence.sequence_name,
      owned_sequence.column_name,
      owned_sequence.table_name
    );
  END LOOP;
END $$;
