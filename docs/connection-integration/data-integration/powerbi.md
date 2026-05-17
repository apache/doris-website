---
{
    "title": "Power BI",
    "language": "en",
    "description": "Learn how to connect Apache Doris in Power BI Desktop, configure DirectQuery or Import mode, and build visualization dashboards on top of Doris data.",
    "keywords": [
        "Power BI connect Doris",
        "Apache Doris Power BI",
        "Doris Power BI Connector",
        "Power BI DirectQuery Doris",
        "Power BI Import Doris"
    ]
}
---

<!-- Knowledge type: Operation guide -->
<!-- Applicable scenario: Use Power BI Desktop to connect to Apache Doris and build visualization dashboards -->

Microsoft Power BI can query data from Apache Doris and can also load data into memory. With Power BI Desktop, you can connect to an Apache Doris data source and create reports, dashboards, and visual analytics.

Starting from the user workflow, this article describes how to complete the following operations:

| Use case | User goal | Main operations |
|----------|-----------|-----------------|
| Prepare the connection environment | Enable Power BI Desktop to connect to Doris | Install the MySQL ODBC driver and the Doris Power BI connector |
| Connect to a Doris data source | Access an Apache Doris instance from Power BI Desktop | Fill in the Doris Data Source, Database, authentication information, and data connectivity mode |
| Choose a query mode | Select a connection mode based on the data volume and the way you analyze data | Use DirectQuery to query Doris directly, or use Import to load a small amount of data into Power BI |
| Build a visualization dashboard | Build an analytics report based on TPC-H data in Doris | Create table relationships, drag and drop fields, and generate and save a dashboard |

## Prepare the connection environment

<!-- Knowledge type: Pre-deployment check -->
<!-- Applicable scenario: Install Power BI Desktop and prepare Doris connection information -->

### Install Power BI Desktop

This article assumes that you have already installed Microsoft Power BI Desktop on a Windows computer. If it is not installed, you can visit the [Power BI Desktop download page](https://www.microsoft.com/en-us/download/details.aspx?id=58494) to download and install it.

It is recommended to update Power BI Desktop to the latest version.

### Prepare Doris connection information

Before connecting to Apache Doris, collect the following information:

| Parameter | Meaning | Example |
|-----------|---------|---------|
| **Doris Data Source** | Database connection string in the format `host:port` | `127.0.1.28:9030` |
| **Database** | Database name | `test_db` |
| **Data Connectivity Mode** | Data connectivity mode, including `Import` and `DirectQuery` | `DirectQuery` |
| **SQL Statement** | SQL statement, must include the database, only applicable in `Import` mode | `select * from database.table` |
| **User Name** | User name | `admin` |
| **Password** | Password | `xxxxxx` |

## Install the MySQL ODBC driver

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Allow Power BI Desktop to connect to Doris through the MySQL ODBC driver -->

To connect to Doris in Power BI Desktop, you need to install the MySQL ODBC driver first.

### Install the driver

1. Download and install [MySQL ODBC](https://downloads.mysql.com/archives/c-odbc/).

2. Select and configure version 5.3.

3. Run the downloaded `.msi` installer and follow the installation wizard to complete the installation.

![](/images/next/connection-integration/data-integration/powerbi/WYRLb9JmcoEHeuxr41Ec8yMQnff.png)

![](/images/next/connection-integration/data-integration/powerbi/LYh9bi780o3DaCxwF3BcuPrknlh.png)

![](/images/next/connection-integration/data-integration/powerbi/E1i7buBzHoquRCxT6VAc1FjCnNf.png)

After the installation is complete, the following screen appears.

![](/images/next/connection-integration/data-integration/powerbi/PURIbSCFhoara3xodBBc5xaNnjc.png)

### Verify the driver

After the driver is installed, you can verify the installation as follows:

1. In the Windows Start menu, type `ODBC` and select **ODBC Data Sources (64-bit)**.

![](/images/next/connection-integration/data-integration/powerbi/QhVVbjalNoIwvdxd1u7cX3UAnEf.png)

2. Confirm that the MySQL driver appears in the driver list.

![](/images/next/connection-integration/data-integration/powerbi/OzVSbojxto9SpRxP3sLcnqHmnme.png)

## Install the Doris Power BI connector

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Load the Doris custom connector in Power BI Desktop -->

The Power BI custom connector certification channel is currently closed, so the custom connector provided by Doris is an uncertified connector. For uncertified connectors, refer to the [Power BI custom connector configuration documentation](https://learn.microsoft.com/en-us/power-bi/connect-data/desktop-connector-extensibility#custom-connectors) to complete the following configuration.

### Place the connector file

1. Assume that `power_bi_path` is the installation directory of Power BI Desktop on the Windows operating system. The default is usually:

    ```text
    power_bi_path = C:\Program Files\Power BI Desktop
    ```

2. Place the [Doris.mez](https://velodb-bi-connector-1316291683.cos.ap-hongkong.myqcloud.com/PowerBI/latest/Doris.mez) custom connector file under the `%power_bi_path%\Custom Connectors folder` path.

3. If the path above does not exist, create it manually as needed.

### Allow loading uncertified connectors

1. In Power BI Desktop, select **File**.

![](/images/next/connection-integration/data-integration/powerbi/YeQDbcIoQoI5RtxU0mjcNXuJnrg.png)

2. Select **Options and settings** > **Options**.

![](/images/next/connection-integration/data-integration/powerbi/LV6Tbdw54o5pqtxC2bCctM30nbe.png)

3. On the **Options** screen, select **GLOBAL** > **Security**. Under **Data Extensions**, check **(Not Recommended) Allow any extension to load without validation or warning** to lift the restriction on uncertified connectors.

![](/images/next/connection-integration/data-integration/powerbi/Tg5cbS75HoBGIMxpcKScJ9WXnRg.png)

4. Select **OK** and then restart Power BI Desktop.

## Connect to Doris in Power BI Desktop

<!-- Knowledge type: Operation steps + Configuration parameters -->
<!-- Applicable scenario: Select the Doris connector in Power BI Desktop and fill in connection information -->

After installing the driver and connector, you can find the Doris connector in Power BI Desktop and create a Doris data source.

### Find the Doris connector

1. Launch Power BI Desktop.

2. On the Power BI Desktop start screen, click **New Report**. If you already have a local report, you can also choose to open an existing report.

![](/images/next/connection-integration/data-integration/powerbi/FuXNb5hb2oOq7cxNpPEcR1dKnyg.png)

3. Click **Get Data** and select the Doris database in the pop-up window.

![](/images/next/connection-integration/data-integration/powerbi/G9UWbT1P6otb53xlgj4cljUInz1.png)

### Fill in connection information

After selecting the Doris connector, enter the Doris instance credentials:

| Parameter | Required | Description |
|-----------|----------|-------------|
| **Doris Data Source** | Required | Doris instance domain name, address, or `host:port` |
| **Database** | Required | Doris database name |
| **SQL statement** | Optional | SQL statement to execute beforehand, only available in `Import` mode |
| **Data connectivity mode** | Required | Choose `DirectQuery` or `Import` |

![](/images/next/connection-integration/data-integration/powerbi/KiM2bVPWhoYBg5xGQUQcJFNcntg.png)

Recommendations for choosing a connection mode:

| Mode | Applicable scenario | Description |
|------|---------------------|-------------|
| **DirectQuery** | Recommended for querying Doris directly | Power BI does not load the full data set; instead, it sends queries directly to Doris |
| **Import** | Suitable for small data scenarios | The entire data set is loaded into Power BI |

:::note

It is recommended to choose `DirectQuery` to query Doris directly. If your use case involves only a small amount of data, you can choose `Import` mode.

:::

### Enter user name and password

Specify the Doris user name and password.

![](/images/next/connection-integration/data-integration/powerbi/KZXxbDPTBo2O3FxqgZdcE9I6ndc.png)

### Load the table schema and preview data

In the navigator view, you should be able to see databases and tables. Select the desired tables and click **Load** to load the table schema and preview data from Apache Doris.

![](/images/next/connection-integration/data-integration/powerbi/J7xObwqSYoTdTQx3hjgcAjQznS5.png)

After the import is complete, Doris data is accessible in Power BI as expected. You can then configure the statistical dashboard you need.

![](/images/next/connection-integration/data-integration/powerbi/JvIgbbyo2oWPlgxcb6Cct5ssnld.png)

## Build a visualization dashboard in Power BI

<!-- Knowledge type: Operation example -->
<!-- Applicable scenario: Use Doris TPC-H data to create an order revenue statistics dashboard in Power BI -->

This example uses TPC-H data as the data source. For how to build the Doris TPC-H data source, refer to the [Doris TPC-H Benchmark documentation](../../lakehouse/best-practices/tpch.md).

Suppose you need to count order revenue across regions. You can build the dashboard with the following process.

### Create table model relationships

1. Click **Model view** to enter the table model relationship configuration screen.

![](/images/next/connection-integration/data-integration/powerbi/V7PsbP3oKoJpLjxK5HdcPsnLnKf.png)

2. Drag the four tables `customer`, `nation`, `orders`, and `region` onto the same screen as needed, and then drag the related fields to connect them.

![](/images/next/connection-integration/data-integration/powerbi/FZL5b2kJcoifIaxI7Eocpak7nvf.png)

![](/images/next/connection-integration/data-integration/powerbi/UxL2b1OV2or1LhxZjHsc0JG7ntb.png)

The relationships among the four tables are as follows:

| Source table | Source field | Target table | Target field |
|--------------|--------------|--------------|--------------|
| `customer` | `c_nationkey` | `nation` | `n_nationkey` |
| `customer` | `c_custkey` | `orders` | `o_custkey` |
| `nation` | `n_regionkey` | `region` | `r_regionkey` |

3. After the relationships are set up, the result is as follows.

![](/images/next/connection-integration/data-integration/powerbi/LomhbQTPPoZr58xp8f3cxcTen8d.png)

### Configure the order revenue dashboard

1. Return to the **Report view** workspace and start building the dashboard.

2. Drag `o_totalprice` from the `orders` table onto the dashboard.

![](/images/next/connection-integration/data-integration/powerbi/MB34bks6woK3mDx0eVccivKEngc.png)

3. Drag `r_name` from the `region` table to the X column.

![](/images/next/connection-integration/data-integration/powerbi/JxpJbihDHoHGwixjWQScNyxvn4e.png)

4. The expected dashboard content is now displayed.

![](/images/next/connection-integration/data-integration/powerbi/CfGWb6oaYoj4LyxpPIGcz3Binzb.png)

5. Click the save button in the upper-left corner of the workspace to save the created statistical dashboard locally.

![](/images/next/connection-integration/data-integration/powerbi/WozGbmqAOoP2mqxq2NmcJRFyntc.png)

At this point, you have successfully connected Power BI to Apache Doris and completed data analysis and visualization dashboard creation.
