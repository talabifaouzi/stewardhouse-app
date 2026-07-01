-- 0006_gift_purpose_recurring_years.sql
ALTER TABLE gift ADD COLUMN purpose TEXT;
ALTER TABLE gift ADD COLUMN recurring_years INTEGER;
