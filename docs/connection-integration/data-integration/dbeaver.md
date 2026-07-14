---
{
    "title": "DBeaver",
    "language": "en",
    "description": "Connect DBeaver to Apache Doris with the Apache Doris or MySQL driver, browse internal and external catalogs, and run SQL queries."
}
---

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Use DBeaver to connect to and manage Apache Doris databases -->

DBeaver is a cross-platform database tool for developers, database administrators, analysts, and anyone who works with data.

Apache Doris accepts queries through the MySQL protocol. DBeaver 26.1.1 and later include an `Apache Doris` data source that you can use to query internal and external catalogs.

If the `Select your database` window does not list `Apache Doris`, use the MySQL driver instead. See [Connect with the MySQL driver](#connect-with-the-mysql-driver).

## Use cases

- Browse Apache Doris catalogs, databases, tables, views, and other metadata.
- Run queries and analyze data in the SQL editor.
- Manage internal and external catalogs in one tool.
- Inspect sessions, system variables, user privileges, and other runtime information.

## Prerequisites

- Install DBeaver 26.1.1 or later from [https://dbeaver.io](https://dbeaver.io).
- You can reach the Apache Doris cluster and have the FE host address, MySQL protocol port, username, and password.
- Use Doris 2.1.0 or later to connect to an external catalog with the `catalog.db` format.

## Connect DBeaver to Doris

### Connect with the Apache Doris driver (recommended)

:::warning Version requirement
DBeaver 26.1.1 or later is required.
:::

#### Step 1: Create a database connection

Start DBeaver.

Click the plus (`+`) icon in the upper-left corner, or select `Database` > `New Database Connection` from the menu bar. DBeaver opens the `Connect to a database` window.

![Create a database connection](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-doris-add-connection.jpg)

#### Step 2: Select the Apache Doris driver

In the `Select your database` window, search for or select `Apache Doris`, then click `Next`.

![Select the Apache Doris driver](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-doris-select-driver.jpg)

#### Step 3: Configure the Doris connection

On the `Main` tab of the `Apache Doris connection settings` window, enter the following values:

| Field | Description | Example |
|-------|-------------|---------|
| Host | FE host name or IP address. If you use an SSH tunnel, enter the local forwarding address. | `127.0.0.1` |
| Port | FE MySQL protocol port. If you use an SSH tunnel, enter the local forwarding port. | `9030` or `19030` |
| Database/Schema | Optional. The target database. To connect directly to an external catalog, use the `catalog.db` format. | `example_db` or `hive.example_db` |
| Username | Username for the Doris cluster. | `admin` |
| Password | Password for the Doris cluster. | - |

The `Database/Schema` value determines which catalog and database DBeaver opens:

- Leave it blank to browse catalogs and databases in the Database Navigator after connecting.
- Enter a database name to open that database in the internal catalog.
- Enter `catalog.db` to open a database in the specified external catalog. DBeaver displays the tables from that catalog and database.

:::note
The `catalog.db` format requires Doris 2.1.0 or later.
:::

Connect to the internal catalog:

![Connect to the internal catalog](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-doris-internal-catalog.jpg)

Connect to an external catalog:

![Connect to an external catalog](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-doris-external-catalog.jpg)

To use DBeaver's built-in SSH support, click `SSH, Proxy` in the upper-right corner and configure the tunnel. If you already created local port forwarding, enter the local address and port in `Host` and `Port`.

#### Step 4: Test and save the connection

Click `Test Connection` in the lower-left corner.

When DBeaver reports a successful connection, click `OK`.

Click `Finish` to save the connection.

![Test the Apache Doris driver connection](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-doris-test-connection.jpg)

#### Step 5: Browse Doris objects

The new data source appears in the Database Navigator. Expand it to browse Doris catalogs, databases, tables, and views.

![Browse Doris objects](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-doris-navigator.jpg)

#### Configure driver properties

The Apache Doris driver uses MySQL Connector/J to connect to the FE MySQL protocol port. The default port is `9030`, and the default user is `root`. The JDBC URL template is:

```text
jdbc:mysql://{host}[:{port}]/[{database}]
```

The driver class is:

```text
com.mysql.cj.jdbc.Driver
```

By default, the driver sets:

```text
connectTimeout=20000
rewriteBatchedStatements=true
useSSL=false
enabledTLSProtocols=TLSv1.2,TLSv1.3
```

![Configure Apache Doris driver properties](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-doris-driver-properties.jpg)

`useSSL=false` disables TLS/SSL by default. If the FE MySQL protocol port has TLS enabled and the certificate chain is configured correctly, set the MySQL Connector/J SSL properties under `Driver properties`. For example:

```text
useSSL=true
sslMode=REQUIRED
```

To verify the certificate authority, configure a Java truststore:

```text
sslMode=VERIFY_CA
trustCertificateKeyStoreUrl=file:/path/to/doris-truststore.jks
trustCertificateKeyStorePassword=<password>
```

To also verify the server host name, use:

```text
sslMode=VERIFY_IDENTITY
```

With `VERIFY_IDENTITY`, the `Host` value in DBeaver must match the certificate's SAN or CN.

### Connect with the MySQL driver

If the `Select your database` window does not list `Apache Doris`, connect with the MySQL driver.

#### Step 1: Create a database connection

Start DBeaver.

Click the plus (`+`) icon in the upper-left corner, or select `Database` > `New Database Connection` from the menu bar. DBeaver opens the `Connect to a database` window.

![Create a MySQL database connection](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-mysql-add-connection.jpg)

#### Step 2: Select the MySQL driver

In the `Select your database` window, select `MySQL`.

#### Step 3: Configure the Doris connection

On the `Main` tab of the `Connection Settings` window, enter the following values:

| Field | Description | Example |
|-------|-------------|---------|
| Server Host | FE host name or IP address. | `127.0.0.1` |
| Port | FE MySQL protocol port. | `9030` |
| Database | Target database. To connect directly to an external catalog, use the `catalog.db` format. | `example_db` or `hive.example_db` |
| Username | Username for the Doris cluster. | `admin` |
| Password | Password for the Doris cluster. | - |

The `Database` value determines the default catalog:

- Enter a database name to open that database in the internal catalog.
- Enter `catalog.db` to open a database in the specified external catalog. DBeaver displays the tables from that catalog and database.

Create separate Doris data sources if you need direct access to several catalogs.

:::note
The `catalog.db` format requires Doris 2.1.0 or later.
:::

Connect to the internal catalog:

![Connect to the internal catalog with the MySQL driver](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-mysql-internal-catalog.jpg)

Connect to an external catalog:

![Connect to an external catalog with the MySQL driver](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-mysql-external-catalog.jpg)

#### Step 4: Test and save the connection

Click `Test Connection` in the lower-left corner.

When DBeaver reports a successful connection, click `OK`.

![Test the MySQL driver connection](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-mysql-test-connection.jpg)

Click `Finish` to save the connection.

#### Step 5: Manage the database

The new data source appears in the Database Navigator. Use it to connect to and manage the database.

![Manage the database with the MySQL driver](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-mysql-navigator.jpg)

## Feature support

### Fully supported

| Category | Feature |
|----------|---------|
| Visual browsing | Databases (Tables, Views), Users |
| Administer | Session Manager |
| System Info | Session Variables, Global Variables, Engines, Charsets, User Privileges, Plugin |
| Operations | SQL editor, SQL console |

### Limited support

You can open the following views without errors, but DBeaver might not display all information because of protocol compatibility differences:

- Dashboard
- Users / user / properties
- Session Status
- Global Status

### Not supported

Some visual operations may fail or have not been verified:

- Create databases or tables through the UI
- Change table schemas through the UI
- Insert, delete, or update data through the UI
