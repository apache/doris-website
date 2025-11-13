---
{
"title": "QuickSight",
"language": "en"
}
---

QuickSight can connect to Apache Doris via the official MySQL data source in Directly query or Import mode

## Prerequisites

- Apache Doris version must be no less than 3.1.2
- Network connectivity (VPC, security group configuration) needs to be configured according to the Doris deployment environment to ensure that AWS servers can access your Doris cluster.
- Run the following SQL on the MySQL client that connects to Doris to adjust the declared MySQL compatibility version:

  ```sql
  SET GLOBAL version = '8.3.99';
  ```
  Verification result:
  ```sql
  mysql> show variables like "version";
  +---------------+--------+---------------+---------+
  | Variable_name | Value  | Default_Value | Changed |
  +---------------+--------+---------------+---------+
  | version       | 8.3.99 | 5.7.99        | 1       |
  +---------------+--------+---------------+---------+
  1 row in set (0.01 sec)
  ```

## Connect QuickSight to Apache Doris

First, visit [https://quicksight.aws.amazon.com](https://quicksight.aws.amazon.com/), navigate to Datasets, and click "New dataset":

![](/images/ecomsystem/quicksight/Cm8EbaeoIoYDeAxGDR8cuSFhns1.png)

![](/images/ecomsystem/quicksight/XngnbqKxhouZHIxgVYhcyta5n3f.png)

Search for the official MySQL connector bundled with QuickSight (named simply **MySQL**):

![](/images/ecomsystem/quicksight/Pjf5bRheroLmtKxcZ2PcFYMkn7d.png)

Specify your connection details. Note that the MySQL interface port defaults to 9030, which may vary depending on your FE `query_port` configuration.

![](/images/ecomsystem/quicksight/DlJobTycDoqhDOxdUtCcqZCxnkc.png)

Now, you can select a table from the list:

![](/images/ecomsystem/quicksight/LAFXbSSnwop5C7xn3kPcEcBZnmc.png)

Additionally, you can specify a custom SQL to fetch your data:

![](/images/ecomsystem/quicksight/ASnSCopmkPwncLbB5FXZcEc7xn3.png)

It is recommended to choose the "Directly query" mode:

![](/images/ecomsystem/quicksight/RN4fbtJU5o89gQxePQKcOGRBnyh.png)

Additionally, by clicking "Edit/Preview data", you should be able to view the internal table structure or adjust the custom SQL, and you can adjust the dataset here:

![](/images/ecomsystem/quicksight/DoVOMbQTxBrRBpx3Bbgn2gcUXLd.png)

Now, you can proceed to publish the dataset and create new visualizations!

![](/images/ecomsystem/quicksight/MXgObQbdDoLBVTxBrRBcUpx3n2g.png)

## Building Visualizations in QuickSight

We've chosen TPC-H data as our data source. For instructions on building a Doris TPC-H data source, refer to [this document](../../benchmark/tpch).

Now that we've configured the Doris data source in QuickSight, let's visualize the data...

Suppose we need to know order statistics at different statuses across various countries. The following is how to build a dashboard based on this requirement:

1. Add the following table as a Dataset to the Data source created using the steps above.

- customer
- nation
- orders

2. Click 'Create Dataset'

![](/images/ecomsystem/quicksight/LDeebS3RdoB6hPxcYkacV88VnMd.png)

3. Select the data source created in the above steps

![](/images/ecomsystem/quicksight/LQlLb26gZoXOurxO3AJc0xCBnqd.png)

4. Select the required tables

![](/images/ecomsystem/quicksight/W7bDb42r4ovxr3xGDU0cRxmbnsf.png)

Select Directly Query mode

![](/images/ecomsystem/quicksight/Nllyb7GkJo8ToCxXSuDc4gNgnvg.png)

Click 'Visualize' to create the data source. Follow these steps to create data sources for other tables as well.

5. Enter the dashboard creation workbench, click the current Dataset dropdown menu, and select Add New Dataset.

![](/images/ecomsystem/quicksight/D18HbY2PWoQvMOxlJTRcOfZenEh.png)

6. Select all datasets in sequence, click Select, and add them to the dashboard.

![](/images/ecomsystem/quicksight/TzM6boK9No1wD0xBBeAcaJGcnDd.png)

7. After completion, click the nation's operation interface to enter the dataset editing interface. We will now perform column joins on the dataset.

![](/images/ecomsystem/quicksight/Y0GpbCY0oo6xeYxfufAcPAC6n1e.png)

8. As shown in the image, click Add data to add a data source.

![](/images/ecomsystem/quicksight/ZNKgbdPivoM3y7xwr8kcZbWPn8c.png)

9. After adding the three tables, perform joins. The join relationship is as follows:
    - **customer** ：c_nationkey  --  **nation** : n_nationkey
    - **customer** ：c_custkey  --  **orders** : o_custkey

![](/images/ecomsystem/quicksight/HVNIbL0yDouA8axQmIocXFhFnmc.png)

10. After the join is complete, click Save & Publish in the upper right corner to publish.

![](/images/ecomsystem/quicksight/CD9pbqFIOouYFtxUrs9cMlyAnph.png)

11. Return to the Analyses interface where you just added the three data sources, click n_name to display the total number of orders by country name.

![](/images/ecomsystem/quicksight/D6Yrb7Igwo5520x3WBbcZ8T9n9f.png)

12. Click VALUE, select o_orderkey, click GROUP/COLOR, and select o_orderstatus to obtain the demand dashboard.

![](/images/ecomsystem/quicksight/Sl8nbfrszok2bexesfwcsNqbngc.png)

13. Click Publish in the upper right corner to complete the dashboard publication.

At this point, QuickSight has been successfully connected to Apache Doris, and data analysis and visualization dashboard creation have been implemented.
