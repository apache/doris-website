---
{
    "title": "DBeaver",
    "language": "en",
    "description": "Use DBeaver to connect to Apache Doris through the MySQL driver, visually manage internal catalog and external catalog, and run SQL queries."
}
---

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Use DBeaver to visually connect to and manage Apache Doris databases -->

DBeaver is a cross-platform database tool for developers, database administrators, analysts, and anyone who works with data.

Apache Doris is highly compatible with the MySQL protocol, so you can use the MySQL driver in DBeaver to connect to Apache Doris and query data in the internal catalog and external catalog.

## Use cases

- Browse metadata such as databases, tables, and views in Apache Doris through a visual interface.
- Use the SQL editor to run queries and analyze data.
- Manage the internal catalog and multiple external catalogs in a single tool.
- Monitor sessions and view runtime information such as system variables and user privileges.

## Prerequisites

- DBeaver is installed (version 24.0.0 or later is recommended). Download URL: [https://dbeaver.io](https://dbeaver.io)
- An Apache Doris cluster is reachable, and you know the FE host address, query port, username, and password.
- To connect to an external catalog using the `catalog.db` form, the Doris version must be 2.1.0 or later.

## Procedure

:::info Note
The following steps are verified on DBeaver 24.0.0.
:::

### Step 1: Create a new database connection

1. Start DBeaver.
2. In the upper-left corner of the window, click the plus (**+**) icon, or select **Database > New Database Connection** from the menu bar to open the **Connect to a database** dialog.

    ![Add connection 1](/images/next/connection-integration/data-integration/dbeaver/dbeaver1.png)

    ![Add connection 2](/images/next/connection-integration/data-integration/dbeaver/dbeaver2.png)

### Step 2: Select the MySQL driver

In the **Select your database** window, select **MySQL**.

![Select driver](/images/next/connection-integration/data-integration/dbeaver/dbeaver3.png)

### Step 3: Configure the Doris connection

On the **Main** tab of the **Connection Settings** window, fill in the following connection information:

| Field | Description | Example |
|--------|------|------|
| Server Host | The FE host IP address of the Doris cluster | `127.0.0.1` |
| Port | The FE query port of the Doris cluster | `9030` |
| Database | The target database in the Doris cluster | `example_db` or `hive.example_db` |
| Username | The username used to log in to the Doris cluster | `admin` |
| Password | The password used to log in to the Doris cluster | - |

:::tip How to use the Database field
The Database field can be used to distinguish between the internal catalog and external catalogs:

- Database name only: by default, the data source connects to the internal catalog.
- The format `catalog.db`: the data source connects to the specified catalog by default, and the databases and tables shown in DBeaver are those in that catalog.

Therefore, you can create multiple Doris data sources to manage different catalogs separately.
:::

:::info Note
Connecting to a Doris external catalog with the `catalog.db` form requires Doris version 2.1.0 or later.
:::

Connection examples:

- Connect to the internal catalog

    ![Connect to internal catalog](/images/next/connection-integration/data-integration/dbeaver/dbeaver4.png)

- Connect to an external catalog

    ![Connect to external catalog](/images/next/connection-integration/data-integration/dbeaver/dbeaver5.png)

### Step 4: Test and save the connection

1. After filling in the connection information, click **Test Connection** in the lower-left corner to verify that the information is correct.
2. When DBeaver displays a confirmation dialog, click **OK** to confirm that the configuration is correct.
3. Click **Finish** in the lower-right corner to complete the connection setup.

![Test connection](/images/next/connection-integration/data-integration/dbeaver/dbeaver6.png)

### Step 5: Connect to and manage the database

After the database connection is established, you can see the new data source in the database connection navigator on the left, and connect to and manage it through DBeaver.

![Establish connection](/images/next/connection-integration/data-integration/dbeaver/dbeaver7.png)

## Feature support

DBeaver supports Apache Doris features as follows:

### Fully supported

| Category | Feature |
|------|--------|
| Visual viewing | Databases (Tables, Views), Users |
| Administer | Session Manager |
| System Info | Session Variables, Global Variables, Engines, Charsets, User Privileges, Plugin |
| Operations | SQL editor, SQL console |

### Basically supported

You can click and view these items without errors, but due to protocol compatibility issues, some content may not be fully displayed:

- Dashboard
- Users / user / properties
- Session Status
- Global Status

### Not supported

When using DBeaver to manage Apache Doris, certain visual operations may report errors or have not been verified, for example:

- Visually creating databases and tables
- Schema Change
- Visually inserting, deleting, or updating data
