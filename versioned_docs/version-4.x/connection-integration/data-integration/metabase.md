---
{
    "title": "Metabase",
    "language": "en",
    "description": "Connect Metabase to Apache Doris using the Doris Driver, configure data sources, build dashboards, and use Catalog and parameterized SQL.",
    "keywords": [
        "Metabase connect Doris",
        "Apache Doris Metabase Driver",
        "Doris visualization dashboard",
        "Metabase Doris data source"
    ]
}
---

{/* Knowledge type: Procedure */}
{/* Applicable scenario: Connect to Apache Doris in Metabase and build visualization dashboards */}

Metabase is an open source business intelligence tool that provides data analysis, data visualization, interactive dashboards, data drill-down, SQL query editing, and data export. With the Metabase Apache Doris Driver, Metabase can integrate Apache Doris databases and tables as data sources to query Doris internal data and external data, and to build visualization dashboards.

The driver is a standalone Metabase community driver and is not built into Metabase.

This article starts from user scenarios and describes how to complete the following operations:

| Scenario | User goal | Main operations |
|----------|----------|----------|
| Prepare the Metabase environment | Allow Metabase to recognize Apache Doris as a data source | Install Metabase, then download and install the Doris driver |
| Configure the Doris data source | Connect to the Doris `tpch` database in Metabase | Fill in the FE node, Query Port, Catalog, database, username, and password |
| Build visualization analytics | Analyze how order amounts of different shipping methods change over time | Create a Question, write SQL, configure a line chart, and save it to a dashboard |
| Use advanced capabilities | Access external data sources and improve the query experience | Use Catalog, parameterized queries, partition pruning, materialized views, and caching |

## Prepare the Metabase environment

### Prerequisites

Before you start configuration, make sure the following environment is ready:

| Item | Requirement |
|------|------|
| Metabase | Download and install Metabase `0.59.6.3` or later. For installation instructions, see the [Metabase installation documentation](https://www.metabase.com/docs/latest/installation-and-operation/installing-metabase) |
| Java | Java 21 is required to run Metabase |
| Apache Doris | Prepare an accessible Apache Doris cluster |
| Doris driver | Download the [Metabase Doris Driver](https://github.com/xylaaaaa/metabase-doris-driver/releases/tag/v1.0.0) |

### Download and verify the driver

Download the Release JAR and its checksum file:

```bash
curl -LO https://github.com/xylaaaaa/metabase-doris-driver/releases/download/v1.0.0/doris.metabase-driver-v1.0.0.jar
curl -LO https://github.com/xylaaaaa/metabase-doris-driver/releases/download/v1.0.0/doris.metabase-driver-v1.0.0.jar.sha256
sha256sum -c doris.metabase-driver-v1.0.0.jar.sha256
```

The expected SHA-256 digest is as follows:

```text
b23e82f19a7f9226343e42566e1e192b6df7a0dfc48a73d2101fc74bfec243f3
```

### Install the driver for a regular deployment

If Metabase is deployed in the regular way, install the Doris driver as follows:

1. Download and verify the driver Release files as described above.

2. If the Metabase plugins directory does not exist, create it:

    ```bash
    mkdir -p /path/to/metabase/plugins
    ```

3. Copy the Release JAR to the plugins directory:

    ```bash
    cp doris.metabase-driver-v1.0.0.jar /path/to/metabase/plugins/doris.metabase-driver.jar
    ```

4. Restart the Metabase service.

5. Check the Metabase startup log to confirm that the `doris` driver is registered. In **Admin Settings** > **Databases** > **Add database**, you should be able to see the **Apache Doris** database type.

### Install the driver for a Docker deployment

If you start Metabase with Docker, you are recommended to start it by mounting `doris.metabase-driver.jar`. The plugin path inside the Docker container is `/plugins/`.

1. Download and verify the driver Release files.

2. Start the container with a Metabase image that meets the prerequisites:

    ```bash
    docker run -d \
      -p 3000:3000 \
      --name metabase \
      -v "$(pwd)/doris.metabase-driver-v1.0.0.jar:/plugins/doris.metabase-driver.jar:ro" \
      metabase/metabase
    ```

## Configure the Doris data source

{/* Knowledge type: Configuration parameters */}
{/* Applicable scenario: Add an Apache Doris database connection on the Metabase admin page */}

After installing Metabase and `metabase-doris-driver`, you can add a data source in Metabase that connects to the Doris `tpch` database.

### Connection parameters

The following fields are required when connecting to Apache Doris:

| Parameter | Meaning | Example |
|------|------|------|
| **Display Name** | Display name of the data source | Doris-TPCH |
| **Host** | Doris FE node address | 127.0.0.1 |
| **Port** | Doris Query Port (MySQL protocol port), defaults to `9030` | 9030 |
| **Catalog** | Catalog name. Optional, defaults to `internal` | internal |
| **Database (optional)** | The database in the selected Catalog. Optional; when left empty, all visible databases in the Catalog are discovered | tpch |
| **Username** | Username | root |
| **Password** | Password | your_password |
| **SSL** | Enable JDBC TLS. The driver uses MariaDB `sslMode=trust` and does not verify the server certificate or hostname | false |
| **Sync Schemas Include** | Optional. Used when **Database (optional)** is empty. A comma-separated allowlist of databases | tpch |
| **Sync Schemas Exclude** | Optional. Used when **Database (optional)** is empty. A comma-separated denylist of databases. The exclude rule takes precedence over the include rule | information_schema |
| **Additional JDBC connection string options** | Other MariaDB JDBC URL parameters | connectTimeout=10000 |

Select the Catalog and database scope as follows:

- **Internal tables**: Keep **Catalog** as `internal` and fill in a database such as `tpch`.
- **External tables**: Fill in the external Catalog and a database visible in that Catalog.
- **Multiple databases**: Leave **Database (optional)** empty. The driver discovers the databases visible to the configured account, and applies the include and exclude lists before listing the tables in them.

When **Database (optional)** is empty, the driver excludes `information_schema`, `__internal_schema`, and `mysql` by default. The include and exclude rules are matched case-insensitively; if the same database appears in both lists, the exclude rule takes precedence. If **Database (optional)** is set explicitly, the sync scope is limited to that database, and the include and exclude settings do not change the sync scope.

### Configuration steps

1. Start Metabase and complete the login.

2. Click the gear icon in the upper right corner and select **Admin Settings**.

![Metabase admin settings](/images/next/connection-integration/data-integration/metabase/metabase-01.png)

3. In the left menu, select **Databases**, and click the **Add database** button in the upper right corner.

![Add database](/images/next/connection-integration/data-integration/metabase/metabase-02.png)

4. In the **Database type** dropdown, select **Apache Doris**.

![Select Apache Doris](/images/next/connection-integration/data-integration/metabase/metabase-03.png)

5. Fill in the connection information:

    | Parameter | Example value |
    |------|--------|
    | **Display name** | Doris-TPCH |
    | **Host** | 127.0.0.1 |
    | **Port** | 9030 |
    | **Catalog** | internal |
    | **Database (optional)** | tpch |
    | **Username** | admin |
    | **Password** | ****** |

![Fill in connection information](/images/next/connection-integration/data-integration/metabase/metabase-04.png)

6. Click **Save** to save the configuration.

7. Metabase tests the connection and starts synchronizing database metadata. If the connection succeeds, a success message is displayed.

![Connection succeeded](/images/next/connection-integration/data-integration/metabase/metabase-05.png)

After the data source configuration is complete, you can build visualizations in Metabase.

## Build a visualization dashboard

{/* Knowledge type: Procedure */}
{/* Applicable scenario: Use Doris TPC-H data to create a Question and a Dashboard in Metabase */}

This example uses TPC-H data as the data source. For how to build the Doris TPC-H data source, see the [Doris TPC-H benchmark documentation](../../lakehouse/best-practices/tpch.md).

Suppose you need to analyze how the order amounts of different shipping methods grow over time for cost analysis. You can complete the visualization configuration with the following workflow.

### Create a Question

1. Click the **New +** button in the upper right corner of the home page and select **Question**.

![Create a new question](/images/next/connection-integration/data-integration/metabase/metabase-06.png)

2. Select the data source:

    | Parameter | Example value |
    |------|--------|
    | **Database** | Doris TPCH |
    | **Table** | lineitem |

![Select a table](/images/next/connection-integration/data-integration/metabase/metabase-07.png)

### Build a custom metric with SQL

To compute the revenue, you need to use a custom SQL expression.

1. Click **view sql** in the upper right corner, then click **convert this question to SQL** to edit the SQL.

![Switch to SQL mode](/images/next/connection-integration/data-integration/metabase/metabase-08.png)

2. Enter the following SQL query:

    ```sql
    SELECT
      DATE_FORMAT(l_shipdate, '%Y-%m') AS ship_month,
      l_shipmode,
      SUM(l_extendedprice * (1 - l_discount)) AS revenue
    FROM lineitem
    WHERE l_shipdate >= '1995-01-01'
      AND l_shipdate < '1997-01-01'
    GROUP BY
      DATE_FORMAT(l_shipdate, '%Y-%m'),
      l_shipmode
    ORDER BY ship_month, l_shipmode
    ```

3. Click the **Visualize** button in the lower right corner to view the results.

![View results](/images/next/connection-integration/data-integration/metabase/metabase-09.png)

### Configure the visualization chart

1. By default, the result is shown as a table. Click the **Visualization** button in the lower left corner and select the **Line** chart type.

![Select line chart](/images/next/connection-integration/data-integration/metabase/metabase-10.png)

2. Configure the chart parameters as needed. Metabase generates the following configuration automatically:

    | Configuration | Example value | Meaning |
    |--------|--------|------|
    | **X-axis** | ship_month | Shipping month |
    | **Y-axis** | revenue | Revenue |
    | **Series** | l_shipmode | Shipping method |

3. Customize the chart style:

    - Click the **Settings** icon to adjust colors, labels, legend position, and so on.
    - On the **Display** tab, you can set axis titles, number formats, and so on.

4. After the chart is configured, click **Save** in the upper right corner to save it.

5. Enter the question name **my-tpch** and select the Collection to save it to.

![Name the question](/images/next/connection-integration/data-integration/metabase/metabase-11.png)

### Create a Dashboard

1. Click **+ New** > **Dashboard** to create a new dashboard, and enter the dashboard name **my-tpch**.

![Create a dashboard](/images/next/connection-integration/data-integration/metabase/metabase-12.png)

2. Click **Add a chart** to add the saved Question to the dashboard.

![Add a question](/images/next/connection-integration/data-integration/metabase/metabase-13.png)

3. Adjust the chart position and size, and click **Save** in the upper right corner to save the dashboard.

![Save the dashboard](/images/next/connection-integration/data-integration/metabase/metabase-14.png)

You have now successfully connected Metabase to Apache Doris and completed data analysis and visualization dashboard creation.

## Driver capabilities and limitations

The following table summarizes the driver capabilities and current support boundaries.

| Capability | Support status and boundaries |
|------|------|
| Internal Catalog | Supports synchronizing and querying Doris internal tables |
| Native SQL | Supported. SQL is executed with the permissions of the configured Doris account; the driver does not force statements to be read-only |
| Query Builder | Supports group aggregation and bucketing by day |
| External Catalog | Supports synchronizing and querying data in Doris External Catalogs; the available scope and metadata completeness depend on the specific connector |
| Native template parameters | Supports numeric, text, and optional blocks |
| Complex types | Top-level `ARRAY`, `MAP`, `JSON`, and opaque complex fields remain visible; nested subfields are not expanded |
| Key and index metadata | Primary keys, foreign keys, indexes, and table permissions are not synchronized |
| Metabase write features | Data upload, write-back, Actions, data editing, and persisted models are not supported |

## Advanced scenarios

{/* Knowledge type: Feature description */}
{/* Applicable scenario: Access external data sources, create interactive dashboards, and optimize query performance */}

### Use Catalog to access external data

Set **Catalog** and **Database (optional)** on the connection page to synchronize tables in a Doris external Catalog:

| Configuration | Example value | Description |
|--------|--------|------|
| `Catalog` | `hive_catalog` | Select the Doris Catalog named `hive_catalog` |
| `Database (optional)` | `warehouse` | Select the `warehouse` database in the Catalog |

![Configure Catalog](/images/next/connection-integration/data-integration/metabase/metabase-15.png)

Specify the Catalog explicitly in the SQL query:

```sql
SELECT * FROM hive.warehouse.orders LIMIT 100;
```

### Use parameterized queries

The driver supports basic Native SQL template parameters. The following example uses a numeric parameter, a text parameter, and an optional block:

```sql
SELECT
  category,
  COUNT(*) AS row_count,
  SUM(amount) AS total_amount
FROM orders
WHERE amount > {{min_amount}}
[[AND category = {{category}}]]
GROUP BY category
```

When `category` has no value, Metabase removes the entire optional block.

| Template capability | Support status |
|----------|----------|
| Numeric variables | Supported |
| Text variables | Supported |
| Optional blocks `[[ ... ]]` | Supported |
| Field filters | Not supported |
| Card references such as `{{#card-id}}` | Not supported |
| Dynamic table references | Not supported |

### Data types

During metadata synchronization, the driver maps Doris types to Metabase base types as shown in the following table:

| Doris type | Metabase base type |
|------------|-------------------|
| `BOOLEAN` | `type/Boolean` |
| `TINYINT`, `SMALLINT`, `INT`, `INTEGER`, including display widths such as `INT(11)` | `type/Integer` |
| `BIGINT`, `LARGEINT`, including display widths such as `BIGINT(20)` | `type/BigInteger` |
| `FLOAT`, `DOUBLE` | `type/Float` |
| `DECIMAL` | `type/Decimal` |
| `DATE`, `DATEV2` | `type/Date` |
| `TIME`, including fractional-second precision | `type/Time` |
| `DATETIME`, `DATETIMEV2`, `TIMESTAMP` | `type/DateTime` |
| `TIMESTAMPTZ` | `type/DateTimeWithTZ` |
| `CHAR`, `VARCHAR`, `STRING`, `TEXT` | `type/Text` |
| `JSON`, `JSONB` | `type/JSON` |
| `ARRAY` | `type/Array` |
| `MAP` | `type/Dictionary` |
| `STRUCT`, `VARIANT`, `HLL`, `BITMAP` | `type/*` |

Nested fields inside `ARRAY`, `MAP`, `JSON`, `STRUCT`, or `VARIANT` values are not expanded into Metabase subfields. `LARGEINT` maps to `type/BigInteger` and does not require conversion to a string.

### Performance tuning recommendations

| Recommendation | Description |
|------|------|
| Use partition pruning | Add partition column filter conditions in the `WHERE` clause, for example `WHERE date >= '2024-01-01' AND date < '2024-02-01'` |
| Leverage materialized views | For complex aggregation queries, create materialized views in Doris to accelerate the queries |
| Control result set size | Use `LIMIT` to limit the number of returned rows and avoid loading too much data at once |
| Use query caching | Metabase automatically caches query results. Setting a reasonable cache time can improve performance |

### Connection and usage tips

| Scenario | Recommendation |
|------|------|
| Driver installation | Make sure `doris.metabase-driver.jar` is placed in the Metabase `plugins` directory and restart Metabase |
| Time zone settings | If you encounter time zone issues, add `serverTimezone=Asia/Shanghai` to the JDBC connection string |
| Partitioned table optimization | Create Doris partitioned tables properly, partitioning and bucketing by time, to effectively reduce the data scanned by queries |
| Network connection | Use VPC private connections to avoid the security risks of public network access |
| Permission control | Refine Doris user account roles and access permissions, and follow the principle of least privilege |
| Metadata synchronization | When the table structure in Doris changes, click **Sync database schema now** on the Metabase admin page to synchronize manually |
| Performance monitoring | For slow queries, use `SHOW QUERY PROFILE` in Doris to analyze performance bottlenecks |

### Abnormal data type display

If the data type display in Metabase is abnormal, first confirm that you are using the latest version of the Doris Driver. For the Doris `largeint` type, you need to convert it explicitly in SQL:

```sql
SELECT CAST(large_int_col AS STRING) FROM table
```
