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

## Connect QuickSight to ClickHouse

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
