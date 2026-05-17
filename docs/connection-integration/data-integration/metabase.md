---
{
    "title": "Metabase",
    "language": "en",
    "description": "Connect to Doris in Metabase using the Apache Doris Driver, configure data sources, build visualization dashboards with SQL, and explore Catalogs, parameterized queries, and performance tuning recommendations.",
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
| Metabase | Download and install Metabase 0.48.0 or later. For details, see the [Metabase installation documentation](https://www.metabase.com/docs/latest/installation-and-operation/installing-metabase) |
| Apache Doris | Prepare an accessible Apache Doris cluster |
| Doris driver | Download the latest [metabase-doris-driver](https://velodb-bi-connector-1316291683.cos.ap-hongkong.myqcloud.com/Metabase/latest/doris.metabase-driver.jar) |

### Install the driver for a regular deployment

If Metabase is deployed in the regular way, install the Doris driver as follows:

1. Download the Doris Driver.

2. Create the Metabase plugins directory (if it does not exist):

    ```bash
    mkdir -p $path_metabase/plugins
    ```

3. Copy the JAR file to the plugins directory:

    ```bash
    cp doris.metabase-driver.jar $path_metabase/plugins
    ```

4. Restart the Metabase service.

### Install the driver for a Docker deployment

If Metabase is started with Docker, you are recommended to start it by mounting `doris.metabase-driver.jar`. The plugin path inside the Docker container is `/plugins/`.

1. Download the Doris Driver.

2. Start Metabase with a command similar to the following:

    ```bash
    docker run -d -p 3000:3000 --name metabase -v $host_path/doris.metabase-driver.jar:/plugins/doris.metabase-driver.jar metabase/metabase
    ```

## Configure the Doris data source

{/* Knowledge type: Configuration parameters */}
{/* Applicable scenario: Add an Apache Doris database connection on the Metabase admin page */}

After installing Metabase and `metabase-doris-driver`, you can add a data source in Metabase that connects to the Doris `tpch` database.

### Connection parameters

The following parameters are required when connecting to Apache Doris:

| Parameter | Meaning | Example |
|------|------|------|
| **Display Name** | Display name of the data source | Doris-TPCH |
| **Host** | Doris FE node address | 127.0.0.1 |
| **Port** | Doris Query Port (MySQL protocol port) | 9030 |
| **Catalog name** | Catalog name. Optional, defaults to `internal` | internal |
| **Database name** | Database name. Required | tpch |
| **Username** | Username | root |
| **Password** | Password | your_password |

Fill in the database name as follows:

- **Querying internal tables**: Enter the database name directly, for example `tpch`. The system automatically uses the `internal` Catalog.
- **Querying external tables or data lakes**: Fill in the Catalog configuration. If you only connect to internal tables, you do not need to consider this option.

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
    | **Database name** | tpch |
    | **Username** | admin |
    | **Password** | ****** |

![Fill in connection information](/images/next/connection-integration/data-integration/metabase/metabase-04.png)

6. Click **Save** to save the configuration.

7. Metabase automatically tests the connection and synchronizes database metadata. If the connection succeeds, a success message is displayed.

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

1. Click **view sql** in the upper right corner to switch, then click **convert this question to SQL** to edit the SQL.

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

## Advanced scenarios

{/* Knowledge type: Feature description */}
{/* Applicable scenario: Access external data sources, create interactive dashboards, and optimize query performance */}

### Use Catalog to access external data

Doris supports the multi-Catalog feature, which can query external data sources and perform cross-data-source queries. When using Catalog in Metabase, you can choose either of the following options.

1. Configure `Catalog` on the connection configuration page, and configure an external table database under that Catalog in `Database`. For example:

    | Configuration | Example value | Description |
    |--------|--------|------|
    | `catalog` | `hive_catalog` | Access the Catalog named `hive_catalog` |
    | `database` | `warehouse` | Access the `warehouse` database under the Catalog |

![Configure Catalog](/images/next/connection-integration/data-integration/metabase/metabase-15.png)

2. Specify the Catalog explicitly in the SQL query:

    ```sql
    SELECT * FROM hive.warehouse.orders LIMIT 100;
    ```

### Use parameterized queries

Metabase supports using variables in SQL queries, which makes it easy to create interactive dashboards:

```sql
SELECT
  l_shipmode,
  SUM(l_extendedprice * (1 - l_discount)) AS revenue
FROM lineitem
WHERE l_shipdate BETWEEN {{start_date}} AND {{end_date}}
  AND l_shipmode = {{ship_mode}}
GROUP BY l_shipmode
```

After saving, you can dynamically filter data on the dashboard with dropdowns or date pickers.

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
