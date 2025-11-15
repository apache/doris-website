---
{
    "title": "Integrate with Microsoft OneLake",
    "language": "en"
}
---

**Microsoft OneLake**, part of the Fabric ecosystem, is a unified and open SaaS data lake that provides organizations with a centralized logical data storage layer. Data in OneLake is stored in **Parquet** format and can simultaneously maintain **Delta Lake** and **Apache Iceberg** metadata. This design allows multiple analytics engines to directly access shared datasets **without data duplication or migration**, significantly simplifying data management and governance.

By leveraging **Apache Doris’s Iceberg REST Catalog**, users can directly query and analyze data stored in OneLake—again, without copying or moving it.

This integration enables building **end-to-end analytics pipelines** on a single data lake, combining OneLake’s unified storage and governance capabilities with Doris’s high-performance analytical compute.

At the technical level, Doris interacts with OneLake through open table formats and standardized interfaces to access both metadata and Parquet files. The architecture preserves centralized governance, access control, and security policies—ensuring platform reliability, scalability, and maintainability.

This post walks you through how to connect Doris to OneLake, including environment setup, authentication, and example query workflows.

> Require Doris version 3.1.4+

## Onelake Setup

We’ll start by preparing the data and authentication setup on the **Fabric (OneLake)** side, then show how to create an **Iceberg REST Catalog** in Doris to access that data.

### Load Data into OneLake

1. Open the **Microsoft Fabric** console and create a new **Workspace** (it’s recommended *not* to use the default workspace, as some settings may be restricted).

   ![onelake1](/images/integrations/lakehouse/onelake/onelake-1.png)

2. Inside the workspace, select **New Item → Lakehouse** to create a Lakehouse instance.

   ![onelake2](/images/integrations/lakehouse/onelake/onelake-2.png)

3. Go to **Workspace Settings** and enable the necessary feature toggles to activate Lakehouse functionality.

   ![onelake3](/images/integrations/lakehouse/onelake/onelake-3.png)

### Upload Local Files

For demonstration purposes, we’ll upload a local CSV file directly into OneLake. This is a sample file:

![onelake4](/images/integrations/lakehouse/onelake/onelake-4.png)

1. Navigate to the workspace’s **Files** section, click **Upload → Upload Files**, and select your CSV file.

   ![onelake5](/images/integrations/lakehouse/onelake/onelake-5.png)

2. After uploading, choose **Load Tables → New table** (or load into an existing table if one already exists).

3. Once the import finishes, go to the **Tables** view to inspect your tables and data.

   ![onelake6](/images/integrations/lakehouse/onelake/onelake-6.png)

### Authentication Setup

To allow Doris to access OneLake via the Iceberg REST Catalog, you’ll need to configure **application registration and permissions** in the Azure portal:

1. Open **Azure Portal → App registrations → New registration**, and note down the following values for later:

   * Application (client) ID

   * Directory (tenant) ID

   ![onelake7](/images/integrations/lakehouse/onelake/onelake-7.png)

* Under **API Permissions**, add the required permissions for **Azure Storage** (follow the principle of least privilege).

  ![onelake8](/images/integrations/lakehouse/onelake/onelake-8.png)

* Under **Certificates & secrets**, create a **client secret** and store its value securely — it will be hidden once you leave the page.

  ![onelake9](/images/integrations/lakehouse/onelake/onelake-9.png)

* Return to the **Fabric Workspace → Manage Access**, and add the registered app (by its display name) as an access principal.

  ![onelake10](/images/integrations/lakehouse/onelake/onelake-10.png)

Once these steps are complete, your OneLake data and authentication setup are ready.

## Connecting OneLake from Apache Doris

Next, let’s create the **Iceberg REST Catalog** in Doris and connect to your OneLake data.

### Create Catalog

```sql
Doris> CREATE CATALOG onelake_doris PROPERTIES (
            'type' = 'iceberg',
            'iceberg.catalog.type' = 'rest',
            'uri'='https://onelake.table.fabric.microsoft.com/iceberg',
            'warehouse'='<workerspace_id>/<data_item_id>',
            'iceberg.rest.security.type'='oauth2',
            'iceberg.rest.oauth2.server-uri'='https://login.microsoftonline.com/<talent_id>/oauth2/v2.0/token',
            'iceberg.rest.oauth2.credential'='<oauth2.client_id>:'<oauth2.client_secret>,
            'iceberg.rest.oauth2.scope'='https://storage.azure.com/.default', 
            'fs.azure.support'='true',
            'azure.endpoint'='https://onelake.dfs.fabric.microsoft.com',
            'azure.auth_type'='OAuth2',
            'azure.oauth2_account_host'='onelake.dfs.fabric.microsoft.com',
            'azure.oauth2_server_uri'='https://login.microsoftonline.com/<talent_id>/oauth2/v2.0/token',
            'azure.oauth2_client_id'='<oauth2.client_id>',
            'azure.oauth2_client_secret'='<oauth2.client_secret>'
        );
```

When creating the catalog, you’ll need the following parameters:

* `WORKSPACE_ID` and `DATA_ITEM_ID` — available from your Lakehouse URL:

  `https://app.fabric.microsoft.com/groups/<WORKSPACE_ID>/lakehouses/<DATA_ITEM_ID>`

* Other parameters such as `client_id`, `client_secret`, and `tenant` correspond to your Azure app registration details.

* For OneLake, configuration keys like `iceberg.rest.oauth2.scope`, `uri`, `azure.oauth2_account_host`, and `azure.endpoint` generally have fixed values — refer to the official documentation or sample configurations for specifics.

After configuration, you can query Iceberg tables in OneLake directly from Doris using standard SQL.

### Basic Analytics

Here are a few common business analysis examples that demonstrate how Doris and OneLake can work together for unified analytics:

```sql
Doris> SWITCH onelake_doris;
Query OK, 0 rows affected

Doris> USE dbo;
Database changed

Doris> SHOW TABLES;
+----------------+
| Tables_in_dbo  |
+----------------+
| customer_order |
+----------------+
1 row in set
```

1. Track new orders over the past three days

   Gain real-time insights into recent sales activity — including pending, paid, and completed orders — to improve fulfillment prioritization.

   ```sql
   Doris> SELECT order_id, customer_name, product_name, total_price, status
       -> FROM customer_order
       -> WHERE order_date >= DATE_SUB(NOW(), INTERVAL 3 DAY)
       -> ORDER BY order_date DESC;

   +----------------+---------------+---------------------+-------------+-----------+
   | order_id       | customer_name | product_name        | total_price | status    |
   +----------------+---------------+---------------------+-------------+-----------+
   | ORD20251112002 | Bob Li        | Smart Watch         |        1128 | Completed |
   | ORD20251112001 | Alice Zhang   | Wireless Headphones |         499 | Completed |
   | ORD20251112003 | Chen Wei      | Bluetooth Speaker   |         299 | Pending   |
   +----------------+---------------+---------------------+-------------+-----------+
   3 rows in set
   ```

2. City-level sales performance

   Aggregate total sales and order counts per city to guide regional sales strategy and inventory planning.

   ```sql
   Doris> SELECT city,
       ->        SUM(total_price) AS total_sales,
       ->        COUNT(*) AS order_count
       -> FROM customer_order
       -> WHERE status = 'Completed'
       -> GROUP BY city
       -> ORDER BY total_sales DESC;

   +----------+-------------+-------------+
   | city     | total_sales | order_count |
   +----------+-------------+-------------+
   | Beijing  |        1128 |           1 |
   | Shanghai |         499 |           1 |
   | Shenzhen |         387 |           1 |
   +----------+-------------+-------------+
   3 rows in set
   ```

3. Refund rate by payment method

   Identify payment channels with unusually high refund rates to help finance or risk control teams adjust policies or enhance monitoring.

   ```sql
   Doris> SELECT payment_method,
       -> SUM(CASE WHEN status = 'Refunded' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)
       ->    AS refund_rate_percent
       -> FROM customer_order
       -> GROUP BY payment_method
       -> ORDER BY refund_rate_percent DESC;

   +----------------+---------------------+
   | payment_method | refund_rate_percent |
   +----------------+---------------------+
   | Credit Card    |            50.00000 |
   | WeChat Pay     |             0.00000 |
   | Alipay         |             0.00000 |
   | UnionPay       |             0.00000 |
   +----------------+---------------------+
   4 rows in set
   ```

4. Cross-system user behavior comparison

   When both legacy (e.g., Hive) and OneLake systems are active, you can analyze user overlap and behavioral changes post-migration to assess business impact.

   ```sql
   -- "hive_catalog" is a Hive Catalog created in Doris 
   Doris> SELECT
       ->     a.customer_id,
       ->     COUNT(DISTINCT b.order_id) AS new_order_count,
       ->     SUM(b.total_price) AS new_total_amount
       -> FROM hive_catalog.order_db.hive_customer_order a
       -> JOIN onelake_doris.dbo.customer_order b
       ->   ON a.customer_id = b.customer_id
       -> GROUP BY a.customer_id
       -> ORDER BY new_total_amount DESC
       -> LIMIT 100;
       
   +-------------+-----------------+------------------+
   | customer_id | new_order_count | new_total_amount |
   +-------------+-----------------+------------------+
   | CUST1002    |               1 |             1128 |
   | CUST1001    |               1 |              499 |
   | CUST1004    |               1 |              387 |
   | CUST1003    |               1 |              299 |
   | CUST1005    |               1 |              189 |
   +-------------+-----------------+------------------+
   5 rows in set
   ```

### Snapshot & Time Travel

```sql
Doris> SELECT * FROM customer_order$snapshots\G
*************************** 1. row ***************************
 committed_at: 2025-11-12 17:21:06.692000
  snapshot_id: 7623467350518045470
    parent_id: NULL
    operation: overwrite
manifest_list: abfss://181a804a-ea52-...
      summary: {"XTABLE_METADATA":"{"lastInstantSynced":"2025-11-12...
1 row in set (1.90 sec)

mysql> SELECT * FROM customer_order FOR VERSION AS OF 7623467350518045470 LIMIT 1\G
*************************** 1. row ***************************
      order_id: ORD20251112001
   customer_id: CUST1001
 customer_name: Alice Zhang
         email: alice.zhang@example.com
         phone: 13812345678
       country: China
          city: Shanghai
    order_date: 2025-11-10 22:23:00.000000
    product_id: PROD-A100
  product_name: Wireless Headphones
      category: Electronics
      quantity: 1
    unit_price: 499
   total_price: 499
payment_method: Credit Card
        status: Completed
1 row in set
```

## Conclusion

Through this guide, we’ve demonstrated how to seamlessly integrate **Apache Doris** with **Microsoft OneLake** to enable high-performance analytics on a unified data lake architecture.
&#x20;This integration delivers several key advantages:

* **Zero data movement** – Access data in OneLake directly, without any copying or migration.

* **Unified governance** – Maintain centralized management, access control, and security policies across the data lake.

* **Open-format compatibility** – Built on the **Iceberg** open table standard, ensuring cross-platform interoperability.

* **Flexible analytics** – Combine Doris’s powerful OLAP engine with OneLake’s scalable storage layer.

Whether for **real-time business monitoring**, **cross-system data comparison**, or **complex multidimensional analytics**, this architecture empowers enterprises with both performance and flexibility. As data lake technologies continue to evolve, the integration of Doris and OneLake will serve as a solid data foundation for enterprise digital transformation.

Next, you can follow the configuration steps outlined in this article to build your own analytical environment - and and explore even more advanced analytics scenarios tailored to your business needs.
