---
{
    "title": "LibreDB Studio",
    "language": "en",
    "description": "Connect LibreDB Studio to Apache Doris over the MySQL wire protocol to browse schemas, run queries, and monitor a cluster, with the current gaps stated plainly."
}
---

<!-- Knowledge type: Scenario description -->
<!-- Applicable scenario: Use LibreDB Studio to connect to and query Apache Doris -->

## Overview

[LibreDB Studio](https://libredb.org) is an open source (MIT licensed) SQL IDE that runs in a
browser instead of installing as a desktop application. It ships as a Docker image, a Helm chart,
or an npm package, and connects to Apache Doris over the MySQL wire protocol using its MySQL
connection type, since there is no separate Doris driver.

After reading this article, you can do the following:

- Run LibreDB Studio and create a Doris connection using its MySQL connection type.
- Browse internal-catalog databases and tables, and run SQL against Doris.
- Know which monitoring panels Doris cannot answer today, and why, before you rely on them.

## Prerequisites

<!-- Knowledge type: Prerequisites -->
<!-- Applicable scenario: Check the LibreDB Studio and Doris connection requirements before connecting -->

- LibreDB Studio is running. The quickest way is Docker:

```sh
docker run -p 3000:3000 ghcr.io/libredb/libredb-studio:latest
```

  A Helm chart and an npm package (`npx @libredb/studio`) are also available; see the
  [LibreDB Studio repository](https://github.com/libredb/libredb-studio) for details.
- Doris cluster connection information is ready: the FE host address, the FE MySQL protocol port
  (default `9030`), a target database, a username, and a password.

## Connect to Doris

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Create a Doris connection in LibreDB Studio -->

### 1. Add a connection

Open LibreDB Studio in your browser, sign in, and click the **+** button to add a new connection.

![Add a connection](/images/next/connection-integration/data-integration/libredb-studio/libredb-studio-add-connection.png)

### 2. Configure the Doris connection

Select **MySQL** as the connection type (Doris speaks the MySQL wire protocol, so there is no
separate Doris entry in the connection type list), and fill in:

| Field | Description |
| --- | --- |
| Host | The FE host address of the Doris cluster. |
| Port | The FE MySQL protocol port, `9030` by default (not MySQL's `3306`). |
| Database | The target database in the Doris cluster's internal catalog. |
| User | The username for the Doris cluster. |
| Password | The password for the Doris cluster. |

![Configure the connection](/images/next/connection-integration/data-integration/libredb-studio/libredb-studio-connection-form.png)

### 3. Test and establish the connection

Click **Test Connection** to verify, then **Establish Connection** to save it. Because the overview
and health panels cannot answer on Doris (see Known limitations below), the connection is a
degraded one by LibreDB Studio's own definition, so saving it may take clicking **Establish
Connection** twice: the first click surfaces the degraded reading rather than saving silently, the
second stores it. Once saved, the header badge reads **Slow** rather than Online, reflecting the
failed health check rather than query latency.

![Connection established](/images/next/connection-integration/data-integration/libredb-studio/libredb-studio-connected.png)

### 4. Browse and query

Expand the connection in the object browser to see Doris databases and tables, and use the SQL
editor to run queries against the internal catalog.

![Browse and query Doris](/images/next/connection-integration/data-integration/libredb-studio/libredb-studio-editor.png)

## Known limitations

Apache Doris is a fork target for the MySQL connection type rather than a connection type of its
own, so LibreDB Studio reaches it through the same code path as MySQL, MariaDB, and TiDB. Most of
the product works unchanged; the gaps below are the ones worth knowing before you rely on a panel:

| Area | Status | Detail |
| --- | --- | --- |
| Row counts and byte sizes | Correct | Matched Doris's own `SHOW DATA` output exactly once Doris's background statistics settled, for both row count and byte size. |
| Query cancel | Correct | A `SELECT sleep(8)` was genuinely cancelled; LibreDB Studio reported "Query Cancelled: Query execution was cancelled." |
| Permission errors | Correct | A role granted `SELECT_PRIV` on one table only saw that table in the object browser, and querying the other table returned Doris's own error text, with the specific role, database, table and column names replaced here by placeholders: `Permission denied: user ['role'@'%'] does not have privilege for [...] command on [internal].[db].[table].[column]`. |
| Overview and Health panels | Fails | Both show "This database could not answer this panel" followed by Doris's own `errCode = 2, detailMessage = mismatched input 'LIKE' expecting {<EOF>, ';'}(line 1, pos 12)`. The panels send `SHOW STATUS LIKE '...'`, and Doris's grammar has no `LIKE` clause on `SHOW STATUS`. |
| Index list | Never populated | `information_schema.statistics` is empty on Doris, so no table ever shows an index. |
| Foreign keys | Invisible and unenforced | Accepted by `ALTER TABLE ... ADD CONSTRAINT` and listed by `SHOW CONSTRAINTS`, but absent from `information_schema.KEY_COLUMN_USAGE`, so the schema browser shows no relationship, and Doris itself does not enforce the constraint (a row referencing a nonexistent parent key inserts without error). |
| Explain | Partial | The Explain button always sends `EXPLAIN FORMAT='json'`, which is a parse error on Doris (`mismatched input '='`) for any query, including a plain `SELECT`. Typing `EXPLAIN` directly in front of a query in the SQL editor and running it works normally, returning Doris's own text plan. |
| Maintenance actions | Partial | `Analyze` runs; `Optimize` and `Check` are not statements in Doris's grammar at all and are rejected as a parse error. |
| Freshly loaded tables | Temporarily zero | A table read 0 rows and 0 B immediately after a 2000-row load, and the true count appeared roughly a minute later once Doris's background statistics caught up. This is Doris's own lag, not a stale connection. |

For more on using LibreDB Studio, see the
[LibreDB Studio repository](https://github.com/libredb/libredb-studio).
