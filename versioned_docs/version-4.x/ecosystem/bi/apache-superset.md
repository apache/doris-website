---
{
"title": "Apache Superset",
"language": "en"
}
---

Apache Superset is an open-source data mining platform that supports rich data source connections, various visualization methods, and fine-grained user access control. Its main features include self-service analysis, customizable dashboards, visualization (export) of analysis results, user/role access control, and an integrated SQL editor for SQL editing and querying.

Apache Superset version 3.1 provides an official connection method, officially supporting querying and visualization of both internal and external data from Apache Doris. Apache Doris version 2.0.4 and above are recommended.

Through this connection method, Superset can integrate Apache Doris databases and tables as data sources. To enable this feature, please follow the setup guide below:

- Prerequisite setup
- Configuring the Apache Doris data source in Apache Superset
- Building visualizations in Apache Superset
- Connection and usage tips

## Installing Superset and the Doris Python client

1. Install Python 3, version 3.1.11 is recommended.
2. Install Apache Superset version 3.1 or later. See [Installing Superset from PyPI repository](https://superset.apache.org/docs/installation/installing-superset-from-pypi) for details.
3. Install the Apache Doris Python client on the Apache Superset server. You can refer to the following commands:

```
pip install pydoris
```

Verify Installation Results:

```
-> pip list | grep pydoris
pydoris                       1.1.0
```

After confirming the environment is correct, you can now configure a Doris data source in Superset and start building data visualizations!

## Configuring a Doris Data Source in Superset

Now that you have installed the **Pydoris** and **Apache Superset** drivers, let's see how to define a data source in Superset that connects to the tpch database in Doris.

1. To connect to Apache Doris via Pydoris, you need to configure the SQLAlchemy URI connection string:

Complete the configuration in this format:

`doris://<User>:<Password>@<Host>:<Port>/<Catalog>.<Database>`

The URI parameters are explained below:

| Parameter | Meaning | Example |
|------|------|------|
| **User** | Username | testuser |
| **Password** | Password | xxxxxx |
| **Host** | Database host | 127.0.1.28 |
| **Port** | Database query port | 9030 |
| **Catalog** | Doris Catalog, used when querying external tables and data lakes; internal tables are internal | internal |
| **Database** | Database name | tpch |

2. Accessing the Superset.

![](/images/ecomsystem/superset/OXIbbtkncoLHDUxjfdCcAmaenJm.png)

3. After logging in, click Settings -> Database Connectors in the upper right corner.

![](/images/ecomsystem/superset/ELzsb6xMaoqcAYxnVuzcP3hhnbg.png)

4. Click Add Database. In the Connect a database pop-up window, select Apache Doris.

![](/images/ecomsystem/superset/TQpibvPYEoyKltx34G5c8B5AnGg.png)

5. Enter the SQLAlchemy URI in the connection information. After verifying the connection is correct, click Connect.

![](/images/ecomsystem/superset/FndlbO7Fgo4ppixTFWIc0UQUnFb.png)

6. Adding a data source is now complete.

![](/images/ecomsystem/superset/GsClbUlmsooSdMx994tcjqm1nre.png)

Next, we can build some visualizations in Superset!


## Building Visualizations in Superset

We choose TPC-H data as our data source. Refer to [this document](../../benchmark/tpch) for instructions on building a Doris TPC-H data source.

Now that we have configured the Doris data source in Superset, let's visualize the data...

Suppose we need to analyze the time-varying curves of order amounts for different freight methods for cost analysis.

1. Click Datasets to add a Dataset

![](/images/ecomsystem/superset/C55Kbstx1ogXOtxadBccEavLnOf.png)

2. Select the following in sequence, then click Create dataset and create chart in the lower right corner:
    - Database：Doris
    - Schema： tpch
    - Table：lineitem

![](/images/ecomsystem/superset/AAlebfk9ro0SkCxLKXFcq2Scnov.png)

3. Edit the lineitem Dataset

![](/images/ecomsystem/superset/BHIObcQrboRQWSx4yatcoo4enxc.png)

4. Click Metrics -> Add item to add a calculated metric.
    - Metric Key : Revenue
    - SQL expression :  `SUM(`l_extendedprice` * (1 - `l_discount`))`

![](/images/ecomsystem/superset/DUOvbeQPdojk9YxAsbGcfKT2nOe.png)

5. Go to Chart -> Add Chart, select lineitem for the dateset, and select Line Chart for the chart type.

![](/images/ecomsystem/superset/KKndbObRCoVBDQxOgMNcJLYanUz.png)

6. Drag l_shipdate to the X-axis and set the time granularity. Simultaneously, drag the Revenum custom metric and the data column l_shipmode to Meters and Dimensions respectively.

![](/images/ecomsystem/superset/Aewqbeul9oFZekx3vOUcZ3ranAf.png)

7. Click Update chart to view the dashboard content. Click Save to save the dashboard.

![](/images/ecomsystem/superset/WwYLbzgatoYuLzx9jjmc1STOnwb.png)

At this point, Superset has been successfully connected to Apache Doris, and data analysis and visualization dashboard creation have been implemented.

## Connection and Usage Tips

- Pre-install pydoris in the Superset environment to select Apache Doris when creating the database.
- Create Doris database tables reasonably according to actual needs, partitioning and bucketing by time, which can effectively reduce predicate filtering and most data transmission.
- It is recommended to use a VPC private connection to avoid the security risks introduced by public network access.
- Refine Doris user account roles and access permissions to avoid excessive delegation of permissions.
