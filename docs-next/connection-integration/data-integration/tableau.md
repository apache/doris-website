---
{
    "title": "Tableau",
    "language": "en",
    "description": "Connect to Apache Doris through Tableau's official MySQL connector and the MySQL JDBC Driver to enable data source integration, visual analytics, and dashboard development.",
    "keywords": [
        "Tableau",
        "Apache Doris",
        "BI",
        "Data Visualization",
        "MySQL JDBC",
        "Data Source Integration"
    ],
    "sidebar_label": "Tableau"
}
---

<!-- Knowledge Type: Operational Steps -->
<!-- Applicable Scenario: Connect to Apache Doris in Tableau for data visualization and dashboard development -->

# Tableau

[Tableau](https://www.tableau.com/) is a leading business intelligence (BI) and data visualization tool. Apache Doris is compatible with the MySQL protocol, so you can connect to it directly through Tableau's official **MySQL connector** (based on the MySQL JDBC Driver), without any dedicated plugin.

This document targets the following typical scenarios:

- You have an existing Apache Doris cluster and want to perform data exploration and report development in Tableau.
- You need to use detail data or aggregated results from Doris as the data source for Tableau workbooks.
- You want to publish analytical results from Doris through Tableau dashboards.

After completing the steps in this document, you will be able to:

1. Install and configure Tableau Desktop and the MySQL JDBC driver in your local environment.
2. Create a data source connection from Tableau to Apache Doris.
3. Build visual charts and dashboards in Tableau on top of Doris data sources.

## Prerequisites

Before you start, make sure the following requirements are met:

| Item              | Requirement                                                              |
| ----------------- | ----------------------------------------------------------------- |
| Apache Doris cluster | Accessible, with the FE MySQL protocol port (default `9030`) open                |
| Database account        | Has read permission on the target database                                          |
| Tableau Desktop   | Latest version installed ([download page](https://www.tableau.com/products/desktop/download)) |
| MySQL JDBC Driver | Version 8.3.0 ([download link](https://velodb-bi-connector-1316291683.cos.ap-hongkong.myqcloud.com/Tableau/latest/mysql-connector-j-8.3.0.jar)) |

## Step 1: Install Tableau and the JDBC driver

1. Download and install [Tableau Desktop](https://www.tableau.com/products/desktop/download).
2. Download [MySQL JDBC Driver 8.3.0](https://velodb-bi-connector-1316291683.cos.ap-hongkong.myqcloud.com/Tableau/latest/mysql-connector-j-8.3.0.jar).
3. Place the JDBC driver jar file in the directory designated by Tableau:

    | Operating System | Driver Path                                                                  |
    | -------- | ----------------------------------------------------------------------------- |
    | macOS    | `~/Library/Tableau/Drivers`                                                   |
    | Windows  | `%tableau_path%\Drivers\` (default `tableau_path = C:\Program Files\Tableau`) |

4. Restart Tableau Desktop so that the driver takes effect.

## Step 2: Configure the Apache Doris data source in Tableau

After installing the driver, you can create a data source in Tableau that connects to Doris (the example uses the `tpch` database).

### 1. Prepare connection information

The parameters required to connect to Apache Doris through JDBC are as follows:

| Parameter               | Description                              | Example                              |
| ------------------ | --------------------------------- | --------------------------------- |
| Server             | Host address of the Doris FE               | `127.0.0.1`                       |
| Port               | MySQL protocol port of the Doris FE        | `9030`                            |
| Database           | Database name                          | `tpch`                            |
| Username           | User name                            | `testuser`                        |
| Password           | Password                              | (fill in based on your account)                   |
| Init SQL Statement | Initialization SQL automatically executed after the connection is established    | `select * from database.table`    |

### 2. Create the connection

1. Start Tableau Desktop. If it is already running, restart it to load the driver.
2. In the left-hand menu, under **To a Server**, click **More**, then search for **MySQL** in the connector list:

    ![Search for the MySQL connector](/images/next/connection-integration/data-integration/tableau/QSrsbadm0oEiuHxyGv3clFhTnLh.png)

3. Click **MySQL** to open the connection configuration dialog:

    ![MySQL connection configuration dialog](/images/next/connection-integration/data-integration/tableau/DN47bCp5ZovHCmxH0DAc3fBonR3.png)

4. Fill in the connection information you prepared in the previous step, following the prompts in the dialog.
5. Click **Sign In**. After the connection succeeds, a new Tableau workbook opens:

    ![Tableau workbook](/images/next/connection-integration/data-integration/tableau/LJK9bPMptoAGjGxzoCtcY8Agnye.png)

## Step 3: Build visualizations in Tableau

The following example uses the TPC-H dataset to demonstrate how to build visualizations on top of a Doris data source. For instructions on building TPC-H data, see the [TPC-H Benchmark documentation](../../benchmark/tpch.md).

### 1. Join the data tables

1. Drag the `customer` and `orders` tables into the workbook, and set the join field to `Custkey` in the panel below:

    ![Join customer and orders](/images/next/connection-integration/data-integration/tableau/ZJuBbDBc5o2Gnyxhn7icv30xnXw.png)

2. Drag the `nation` table into the workbook and set the join field with `customer` to `Nationkey`:

    ![Join nation and customer](/images/next/connection-integration/data-integration/tableau/GPXQbcNUnobHtLx5sIocMHAwn2d.png)

3. After joining the three tables, you have a data source ready for analysis. Click the `Sheet 1` tab at the bottom of the workbook to enter the worksheet:

    ![Enter the worksheet](/images/next/connection-integration/data-integration/tableau/FsHmbUOKIoFT5YxWmGecLArLnjd.png)

### 2. Scenario A: Annual customer count summary (line chart)

Drag `OrderDate` (from `orders`) into `Columns`, and drag `customer(count)` (from `customer`) into `Rows`. Tableau then generates a line chart:

![Annual customer count line chart](/images/next/connection-integration/data-integration/tableau/I9SCbCFzoo7TgLx6BP1cHdtRnWc.png)

:::note
The TPC-H dataset is generated by a script using default rules and is not real business data. The results are intended only for feature demonstration and connectivity verification.
:::

### 3. Scenario B: Average order amount by region and year

1. Click `New Worksheet` to create a new sheet.
2. Drag `Name` (from `nation`) into `Rows`.
3. Drag `OrderDate` (from `orders`) into `Columns`.

    At this point, the table shows `Abc` placeholder values because no aggregated measure has been specified.

4. Drag `Totalprice` (from `orders`) into the center of the table. The default aggregation is `SUM`:

    ![Default SUM aggregation](/images/next/connection-integration/data-integration/tableau/Am9IbyUo4o30DixVi2ccoZvKn8b.png)

5. Click `SUM` and change `Measure` to `Average`:

    ![Change to Average](/images/next/connection-integration/data-integration/tableau/AaFwbMOKTo86NaxU54mcVYs1nJd.png)

6. In the same drop-down menu, choose `Format`, then set `Numbers` to `Currency (Standard)`:

    ![Format as currency](/images/next/connection-integration/data-integration/tableau/ZmRDbjws9o5Ampx4YZYcS6Umnqf.png)

7. The final report matches the expected output:

    ![Final report](/images/next/connection-integration/data-integration/tableau/MNb0bjoB2ozn4kxfKx9cVj2hnhb.png)

At this point, you have successfully connected Tableau to Apache Doris and built data analysis and visualization dashboards.

## Best practices

### Performance optimization

- **Design table schemas carefully**: Design partitioning and bucketing for Doris tables based on query patterns to reduce the volume of scanned data and the cost of data transfer.
- **Use materialized views**: For high-frequency aggregation queries, create materialized views in Doris to precompute aggregations and speed up Tableau dashboard responses.
- **Set a reasonable refresh schedule**: Balance refresh frequency against compute resource consumption to keep dashboards timely while controlling cluster load.

### Security configuration

- **Network isolation**: Use VPC private connections instead of accessing Doris directly over the public network.
- **Access control**: Restrict the source of access to Doris ports through security groups.
- **Transport encryption**: Enable SSL/TLS encrypted connections.
- **Principle of least privilege**: Configure Doris user roles and permissions in a fine-grained way to avoid over-authorization.
