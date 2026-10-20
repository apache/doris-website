---
{
    "title": "DBine",
    "language": "en",
    "description": "Connect DBine, a free, open source desktop database manager, to Apache Doris with its Doris connection type to browse databases and tables and run SQL."
}
---

<!-- Knowledge type: Scenario description -->
<!-- Applicable scenario: Use DBine to connect to and query Apache Doris -->

## Overview

[DBine](https://dbine.com) is a free, open source (MIT licensed) desktop database manager for
Windows, macOS, and Linux, with 130+ databases and cloud services in the same window. It has an
Apache Doris connection type that connects to the FE over the MySQL protocol.

After reading this article, you can do the following:

- Install DBine and create a Doris connection.
- Browse internal-catalog databases, tables, views, and columns, and run SQL against Doris.
- Know what differs from a MySQL server before you rely on a reading.

## Prerequisites

<!-- Knowledge type: Prerequisites -->
<!-- Applicable scenario: Check the DBine and Doris connection requirements before connecting -->

- DBine is installed. Download it from the
  [releases page](https://github.com/addlayer-io/dbine/releases).
- The FE is reachable from the computer running DBine. Grant the Doris user the privileges needed
  for the target database and tables.
- Doris cluster connection information is ready: the FE host address, the FE MySQL protocol port
  (default `9030`), a target database, a username, and a password.

## Connect to Doris

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Create a Doris connection in DBine -->

### 1. Add a Connection

In DBine, click **New connection** and select **Apache Doris** from the list of engines.

### 2. Configure the Doris Connection

Fill in the connection form:

| Field | Description |
| --- | --- |
| Server | The FE host address of the Doris cluster. |
| Port | The FE MySQL protocol port, `9030` by default. |
| Database | The target database in the Doris cluster's internal catalog. Optional. |
| User | The username for the Doris cluster. |
| Password | The password for the Doris cluster. |

For a cluster with TLS, open the **SSL/TLS** tab and select **Encrypt the connection (TLS)**.

### 3. Test and Save the Connection

Click **Test connection** to verify, then **Save and connect**. Test connection reports
`Connection successful`, and the connection appears in the **Explorer**.

![Configure the connection](/images/next/connection-integration/data-integration/dbine/dbine-connection-form.png)

### 4. Browse and Query

Expand the connection in the **Explorer** to see the Doris databases, and expand a database to see
its tables, views, and columns. Right-click a database and choose **New query** to open
the SQL editor, then click **Run**. For example:

```sql
SELECT @@version_comment AS doris_version;
```

```text
+--------------------------------------------+
| doris_version                              |
+--------------------------------------------+
| doris version doris-4.1.3-rc02-7126cf65d96 |
+--------------------------------------------+
```

![Browse and query Doris](/images/next/connection-integration/data-integration/dbine/dbine-editor.png)

## Known Limitations

The observations below were verified with Doris 4.1.3 (`apache/doris:all-in-one-4.1.3`).

| Area | Status | Detail |
| --- | --- | --- |
| Browsing and queries | Correct | Databases, tables, views, and columns are listed, and the internal catalog is queried with the user's own privileges: a user granted `SELECT_PRIV` on one database sees that database next to `information_schema` and `mysql`. |
| Explain | Correct | `EXPLAIN` returns Doris's own Nereids plan as text. |
| Server version | MySQL version | The connection test and the status bar show `5.7.99`, the MySQL version Doris reports through `version()`. Run `SELECT @@version_comment` to see the Doris build. |

For more on using DBine, see the [DBine repository](https://github.com/addlayer-io/dbine).
