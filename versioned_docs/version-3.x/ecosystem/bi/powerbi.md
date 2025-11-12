---
{
   "title": "Power BI",
   "language": "en"
}
---

Microsoft Power BI can query from Apache Doris or load data into memory.

You can use Power BI Desktop, the Windows desktop application for creating dashboards and visualizations.

This tutorial will guide you through the following process:

- Install the MySQL ODBC driver
- Install the Doris Power BI connector into Power BI Desktop
- Query data from Doris to visualize it in Power BI Desktop

## Prerequisites

### Power BI installation

This tutorial assumes that you have installed Microsoft Power BI Desktop on a Windows computer. You can download and install Power BI Desktop [here](https://www.microsoft.com/en-us/download/details.aspx?id=58494).

We recommend updating to the latest version of Power BI.

### Connection information

Collect your Apache Doris connection details

You will need the following details to connect to your Apache Doris instance:

| Parameter | Description | Example |
| ---- | ---- | ---- |
| **Doris Data Source** | Database connection string, host + port | 127.0.1.28:9030 |
| **Database** | Database name | test_db |
| **SQL Statement** | SQL statement that must include the Database, only for Import mode | select * from database.table |
| **Data Connectivity Mode** | Data connectivity mode, includes Import and DirectQuery |  |
| **User Name** | User name |  |
| **Password** | Password |  |

## Power BI Desktop

To start querying data in Power BI Desktop, complete the following steps:

1. Install the MySQL ODBC driver
2. Find the Doris connector
3. Connect to Doris
4. Query and visualize data

### Install the ODBC driver

Download and install [MySQL ODBC](https://downloads.mysql.com/archives/c-odbc/), and configure it (version 5.3).

Run the provided `.msi` installer and follow the wizard.

![](/images/ecomsystem/powerbi/WYRLb9JmcoEHeuxr41Ec8yMQnff.png)

![](/images/ecomsystem/powerbi/LYh9bi780o3DaCxwF3BcuPrknlh.png)

![](/images/ecomsystem/powerbi/E1i7buBzHoquRCxT6VAc1FjCnNf.png)

Installation completed

![](/images/ecomsystem/powerbi/PURIbSCFhoara3xodBBc5xaNnjc.png)

#### Verify the ODBC driver

After the driver installation is complete, you can verify that it was successful as follows:

In the Start menu, type ODBC and select "ODBC Data Sources **(64-bit)**".

![](/images/ecomsystem/powerbi/QhVVbjalNoIwvdxd1u7cX3UAnEf.png)

Verify that the MySQL driver is listed.

![](/images/ecomsystem/powerbi/OzVSbojxto9SpRxP3sLcnqHmnme.png)

### Install the Doris connector

The certification channel for Power BI custom connectors is currently closed, so the Doris custom connector is uncertified. For uncertified connectors, configure it as follows ([https://learn.microsoft.com/en-us/power-bi/connect-data/desktop-connector-extensibility#custom-connectors](https://learn.microsoft.com/en-us/power-bi/connect-data/desktop-connector-extensibility#custom-connectors)):

1. Locate the path: `\Power BI Desktop\Custom Connectors folder`, and place the `Doris.mez` custom connector file there (create the path if it does not exist).
2. In Power BI Desktop, choose `File` > `Options and settings` > `Options` > `Security`. Under `Data Extensions`, check `(Not Recommended) Allow any extension to load without validation or warning` to bypass the restriction on uncertified connectors.

First, choose `File`

![](/images/ecomsystem/powerbi/YeQDbcIoQoI5RtxU0mjcNXuJnrg.png)

Then choose `Options and settings` > `Options`

![](/images/ecomsystem/powerbi/LV6Tbdw54o5pqtxC2bCctM30nbe.png)

In the `Options` dialog, go to `GLOBAL` > `Security`. Under `Data Extensions`,

check `(Not Recommended) Allow any extension to load without validation or warning`.

![](/images/ecomsystem/powerbi/Tg5cbS75HoBGIMxpcKScJ9WXnRg.png)

Click `OK`, then restart Power BI Desktop.

### Find the Doris connector

1. Launch Power BI Desktop
2. On the Power BI Desktop start screen, click "New report". If you already have a local report, you can open the existing report.

![](/images/ecomsystem/powerbi/FuXNb5hb2oOq7cxNpPEcR1dKnyg.png)

3. Click "Get Data" and select the Doris database in the pop-up window.

![](/images/ecomsystem/powerbi/G9UWbT1P6otb53xlgj4cljUInz1.png)

### Connect to Doris

Select the connector and enter your Doris instance credentials:

- Doris Data Source (required) - Your instance domain/address or host:port.
- Database (required) - Your database name.
- SQL statement - A pre-executed SQL statement (only available in 'Import' mode)
- Data connectivity mode - DirectQuery/Import

![](/images/ecomsystem/powerbi/KiM2bVPWhoYBg5xGQUQcJFNcntg.png)

**Note**

We recommend choosing DirectQuery to query Doris directly.

If you have use cases with a small amount of data, you can choose Import mode, and the entire dataset will be loaded into Power BI.

- Specify the user name and password

![](/images/ecomsystem/powerbi/KZXxbDPTBo2O3FxqgZdcE9I6ndc.png)

### Query and visualize data

Finally, you should see the databases and tables in the Navigator view. Select the desired tables and click "Load" to import data from Apache Doris.

![](/images/ecomsystem/powerbi/J7xObwqSYoTdTQx3hjgcAjQznS5.png)

After the import is complete, your Doris data should be accessible in Power BI as usual.

![](/images/ecomsystem/powerbi/JvIgbbyo2oWPlgxcb6Cct5ssnld.png)

Configure the required statistical compass

![](/images/ecomsystem/powerbi/ClEJb1iuyoUBYvx4BJYcfDWCnqc.png)

Save the created statistical compass locally

![](/images/ecomsystem/powerbi/Mpeib5CoeoHZGIxrxDYcdeUwnAe.png)
