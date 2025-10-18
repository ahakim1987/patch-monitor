-- Initialize TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create hypertable for host_snapshots (time-series data)
-- This will be done after the tables are created by SQLAlchemy
-- The following will be executed after table creation:

-- SELECT create_hypertable('host_snapshots', 'collected_at');

-- Create indexes for better performance
-- These will be created after the hypertable is set up

-- CREATE INDEX IF NOT EXISTS idx_host_snapshots_host_id_time 
-- ON host_snapshots (host_id, collected_at DESC);

-- CREATE INDEX IF NOT EXISTS idx_host_snapshots_collected_at 
-- ON host_snapshots (collected_at DESC);

-- CREATE INDEX IF NOT EXISTS idx_pending_updates_snapshot_id 
-- ON pending_updates (host_snapshot_id);

-- CREATE INDEX IF NOT EXISTS idx_alerts_host_id_triggered 
-- ON alerts (host_id, triggered_at DESC);

-- CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged 
-- ON alerts (acknowledged, triggered_at DESC);
