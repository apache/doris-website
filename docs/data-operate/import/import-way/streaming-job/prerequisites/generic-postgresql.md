---
{
    "title": "Generic PostgreSQL",
    "language": "en",
    "description": "Prepare a self-managed PostgreSQL source for Doris continuous load.",
    "keywords": [
        "PostgreSQL",
        "Doris continuous load",
        "logical replication",
        "wal_level",
        "pg_hba.conf",
        "CDC"
    ]
}
---

:::caution Experimental feature

Doris continuous load is experimental and supported starting with Doris 4.1.5.

:::

Use this guide to prepare a self-managed PostgreSQL source for Doris continuous load. For a managed PostgreSQL service, see its setup guide in the [supported data sources](../continuous-load-overview.md#supported-data-sources-and-sync-modes).

## Prerequisite Checklist

| Check | Requirement |
| --- | --- |
| Logical replication | `wal_level = logical` and enough replication slots and WAL senders for the new jobs |
| Sync user | `LOGIN` and `REPLICATION`, with read access to the tables to sync |
| Source tables | Each table to sync has a primary key |
| Network | The Doris FE and the CDC Client on the BE can connect to the source database on its configured port, usually `5432` |

## Step 1: Enable and Verify Logical Replication

Connect to the source instance and check the current settings.

```sql
SHOW wal_level;
SHOW max_replication_slots;
SHOW max_wal_senders;
```

If logical replication is disabled or additional capacity is needed, update `postgresql.conf`. The following values are examples. Allocate capacity for existing replication traffic and the new Doris jobs with headroom for concurrent connections.

```ini
wal_level = logical
max_replication_slots = 10
max_wal_senders = 12
```

Restart PostgreSQL during a maintenance window, then rerun the checks. See [PostgreSQL logical replication settings](https://www.postgresql.org/docs/current/logical-replication-config.html).

## Step 2: Create a Sync User

Create a login role with `REPLICATION` and grant access to the source database and schema. Use the database administrator or a role authorized to grant these privileges.

```sql
CREATE ROLE doris_sync WITH LOGIN REPLICATION PASSWORD '<password>';
GRANT CONNECT ON DATABASE source_db TO doris_sync;
```

Connect to `source_db` before granting access to the schema and tables. Replace `public` with the source schema as needed. Grant `SELECT` on the tables the job will sync.

```sql
GRANT USAGE ON SCHEMA public TO doris_sync;
GRANT SELECT ON TABLE public.orders, public.customers TO doris_sync;
```

## Step 3: Configure the Publication

Doris uses `pgoutput`. By default, Doris creates and manages a publication and a logical replication slot for the job. The sync user needs `CREATE` on the source database and must own the source tables when it creates the publication.

If the sync user only has read and replication privileges, have an authorized role create the publication in `source_db`. It must include every table the job will sync.

```sql
CREATE PUBLICATION doris_pub_custom FOR TABLE public.orders, public.customers;
```

Set `publication_name` to `doris_pub_custom` when creating the job. Doris manages the replication slot if you omit `slot_name`. You manage the pre-created publication. See [PostgreSQL publication permissions](https://www.postgresql.org/docs/current/sql-createpublication.html).

After preparing the source, follow [PostgreSQL CDC with Auto Table Creation](../continuous-load-postgresql-database.md) or [PostgreSQL CDC with SQL Mapping](../continuous-load-postgresql-table.md) to create the job.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| PostgreSQL rejects the connection | Check the listening address, firewall, and first matching `pg_hba.conf` rule for the source database and sync user. |
| Logical replication is denied | Verify `wal_level = logical` and the sync role's `REPLICATION` attribute. |
| The job cannot create a publication | Check the sync user's database `CREATE` privilege and source table ownership, or use a pre-created publication. |
| Retained WAL keeps growing | Check slot activity and lag in `pg_replication_slots`. A stalled slot can retain WAL until it resumes or reaches the configured retention limit. |
