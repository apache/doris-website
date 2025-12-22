---
{
    "title": "集成 Microsoft OneLake",
    "language": "zh-CN",
    "description": "OneLake 是 Microsoft Fabric 提供的统一且开放的 SaaS 数据湖，为企业提供一个逻辑上的集中数据存储位置。数据以 Parquet 格式存储，并可同时承载 Delta Lake 与 Iceberg 的元数据。这种设计使 OneLake 能在不进行数据复制或迁移的前提下，"
}
---

OneLake 是 Microsoft Fabric 提供的统一且开放的 SaaS 数据湖，为企业提供一个逻辑上的集中数据存储位置。数据以 Parquet 格式存储，并可同时承载 Delta Lake 与 Iceberg 的元数据。这种设计使 OneLake 能在不进行数据复制或迁移的前提下，被多种分析引擎直接访问，从而简化数据管理与治理。

通过 Apache Doris 的 Iceberg Rest Catalog，可以直接访问 OneLake 中的数据，无需复制或迁移数据即可在 Doris 中执行查询与分析。借助这一能力，可以在单一数据湖中构建端到端的分析流程，实现高效的数据分析、共享和复用，发挥 OneLake 的统一存储优势与 Doris 的计算能力。

在技术层面，Doris 通过 OneLake 提供的开放表标准与底层 Parquet 数据文件，使用标准化接口读取元数据与数据文件，从而兼容多种分析场景。集成后的架构保持了数据湖的统一管理能力，使得治理、访问控制与安全策略能够集中应用，提升整个平台的可靠性与可维护性。

本文将介绍如何使用 Doris 访问 OneLake，并给出完整的环境准备与示例查询流程。

> 需要 Doris 3.1.4 版本。

## Onelake 环境准备

下面先完成 OneLake（Fabric）侧的数据准备与认证配置，然后演示在 Doris 中创建 Iceberg Rest Catalog 并进行查询。

### 导入数据

1. 打开 Fabric 控制台，新建一个 WorkSpace（建议不要使用默认 WorkSpace，因为部分设置项可能受限）。

   ![onelake1](/images/integrations/lakehouse/onelake/onelake-1.png)

2. 进入创建好的 WorkSpace，选择 New Item -> Lakehouse，创建一个 Lakehouse。

   ![onelake2](/images/integrations/lakehouse/onelake/onelake-2.png)

3. 进入 WorkSpace Setting，打开页面中的相关开关（以便启用 Lakehouse 的一些功能）。

   ![onelake3](/images/integrations/lakehouse/onelake/onelake-3.png)

### 将本地文件上传到 OneLake

为便于演示，此处采用本地 CSV 文件直接上传，以下是示例文件：

1. 进入 WorkSpace 的 Files 页面，点击 Upload -> Upload Files，选择要上传的 CSV 文件。

   ![onelake4](/images/integrations/lakehouse/onelake/onelake-4.png)

2. 选择上传后的文件，点击 Load Tables -> New table（如果目标表已存在，也可以选择导入到现有表）。

3. 等待数据导入完成，进入 Tables 查看表及数据信息。

   ![onelake5](/images/integrations/lakehouse/onelake/onelake-5.png)

### 认证信息配置

要让 Doris 通过 Iceberg Rest Catalog 访问 OneLake，需在 Azure 中为 Fabric 的访问配置应用注册与权限：

1. 打开 Azure 门户，进入 App registrations，点击 New registration，新建应用并记录以下信息以便后续配置：应用 ID、租户 ID 等。

   ![onelake6](/images/integrations/lakehouse/onelake/onelake-6.png)

   ![onelake7](/images/integrations/lakehouse/onelake/onelake-7.png)

2. 在新建应用的 API Permissions 中，添加对 Azure Storage 的相应权限（根据最小权限原则选择所需权限）。

   ![onelake8](/images/integrations/lakehouse/onelake/onelake-8.png)

3. 在 Certificates & secrets 中创建客户端密钥（Secret），并将生成的值妥善保存——此值离开页面后将无法再次查看。

   ![onelake9](/images/integrations/lakehouse/onelake/onelake-9.png)

4. 回到 Fabric 的 WorkSpace 界面，进入 Manage Access，使用应用的 DisplayName 添加该应用为 WorkSpace 的访问主体。

   ![onelake10](/images/integrations/lakehouse/onelake/onelake-10.png)

至此，OneLake 侧的数据准备和认证配置完成。

## 在 Doris 中接入 OneLake

接下来示例如何在 Doris 中创建 Iceberg Rest Catalog 并访问 OneLake 中的表。

### 创建 Catalog

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

* 创建 Iceberg Rest Catalog 时需要填写的参数中，`WORKSPACE_ID` 与 `DATA_ITEM_ID` 可在 Lakehouse 页面对应链接中获取，格式类似：

  `https://app.fabric.microsoft.com/groups/<WORKSPACE_ID>/lakehouses/<DATA_ITEM_ID>`

* 其余参数可对应之前在 Azure App registration 中获得的信息（如 client id、client secret、tenant 等）。

* 对于 OneLake，`iceberg.rest.oauth2.scope`、`uri`、`azure.oauth2_account_host`、`azure.endpoint` 等通常为固定值，请参考官方文档或示例配置填写。

配置完成后即可在 Doris 中使用 SQL 对 OneLake 中的 Iceberg 表进行查询。

### 基础查询分析

下面给出若干常见的业务分析示例，帮助理解如何结合 OneLake 与 Doris 进行数据分析：

```sql
Doris> switch onelake_doris;
Query OK, 0 rows affected

Doris> use dbo;
Database changed

Doris> show tables;
+----------------+
| Tables_in_dbo  |
+----------------+
| customer_order |
+----------------+
1 row in set
```

* 查询最近三天的新订单

   便于运营或销售快速掌握近期销售情况，例如发现新下单、待处理或已完成支付的订单，便于安排发货或优先处理待处理订单。

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

* 按城市统计销售表现

  统计各城市的总销售额和订单数，帮助销售/市场判断区域表现并调整营销或库存策略。

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

* 分析不同支付方式的退款率

  帮助财务与风控发现潜在问题（例如某支付渠道退款率异常），进而优化支付流程或对特定渠道加强监控。

  ```sql
  Doris> SELECT payment_method,
      ->        SUM(CASE WHEN status = 'Refunded' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS refund_rate_percent
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

* 跨系统用户行为对比

  若系统同时保留了旧系统（例如 Hive）与 OneLake 上的新系统数据，可以查询两个系统中都有行为记录的用户，并分析他们在新系统的消费行为，从而评估迁移与业务影响。

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

### 快照和时间旅行

```sql
Doris> select * from customer_order$snapshots;
+----------------------------+---------------------+-----------+-----------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| committed_at               | snapshot_id         | parent_id | operation | manifest_list                                                                                                                                                                                                          | summary                                                                                                                                                                                                                                                                                                                                                                                                                                   |
+----------------------------+---------------------+-----------+-----------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| 2025-11-12 17:21:06.692000 | 7623467350518045470 |      NULL | overwrite | abfss://181a804a-ea52-4579-81a4-4de243e14c8e@onelake.dfs.fabric.microsoft.com/ad29a0e3-772f-458c-9dfa-4ff609443c13/Tables/customer_order/metadata/snap-7623467350518045470-1-0e16b9d6-bc0d-4689-9952-085abd1b5f4e.avro | {"XTABLE_METADATA":"{"lastInstantSynced":"2025-11-12T09:02:06Z","instantsToConsiderForNextSync":[],"version":0,"sourceTableFormat":"DELTA","sourceIdentifier":"1"}", "added-data-files":"1", "added-records":"5", "added-files-size":"9434", "changed-partition-count":"1", "total-records":"5", "total-files-size":"9434", "total-data-files":"1", "total-delete-files":"0", "total-position-deletes":"0", "total-equality-deletes":"0"} |
+----------------------------+---------------------+-----------+-----------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
1 row in set

Doris> SELECT * FROM customer_order FOR VERSION AS OF 7623467350518045470;
+----------------+-------------+---------------+-------------------------+-------------+---------+-----------+----------------------------+------------+---------------------+-----------------+----------+------------+-------------+----------------+-----------+
| order_id       | customer_id | customer_name | email                   | phone       | country | city      | order_date                 | product_id | product_name        | category        | quantity | unit_price | total_price | payment_method | status    |
+----------------+-------------+---------------+-------------------------+-------------+---------+-----------+----------------------------+------------+---------------------+-----------------+----------+------------+-------------+----------------+-----------+
| ORD20251112001 | CUST1001    | Alice Zhang   | alice.zhang@example.com | 13812345678 | China   | Shanghai  | 2025-11-10 22:23:00.000000 | PROD-A100  | Wireless Headphones | Electronics     |        1 |        499 |         499 | Credit Card    | Completed |
| ORD20251112002 | CUST1002    | Bob Li        | bob.li@example.com      | 13987654321 | China   | Beijing   | 2025-11-11 17:12:00.000000 | PROD-B200  | Smart Watch         | Wearables       |        2 |        799 |        1128 | WeChat Pay     | Completed |
| ORD20251112003 | CUST1003    | Chen Wei      | chen.wei@example.com    | 13755553333 | China   | Guangzhou | 2025-11-10 03:40:00.000000 | PROD-C300  | Bluetooth Speaker   | Audio           |        1 |         19 |         299 | Alipay         | Pending   |
| ORD20251112004 | CUST1004    | David Wang    | david.wang@example.com  | 13666668888 | China   | Shenzhen  | 2025-11-08 19:15:00.000000 | PROD-D400  | Laptop Stand        | Office Supplies |        3 |        129 |         387 | UnionPay       | Completed |
| ORD20251112005 | CUST1005    | Emily Sun     | emily.sun@example.com   | 13577779999 | China   | Chengdu   | 2025-11-08 00:45:00.000000 | PROD-E500  | USB-C Hub           | Accessories     |        1 |        189 |         189 | Credit Card    | Refunded  |
+----------------+-------------+---------------+-------------------------+-------------+---------+-----------+----------------------------+------------+---------------------+-----------------+----------+------------+-------------+----------------+-----------+
5 rows in set
```

## 总结

通过本文的介绍，我们展示了如何将 Apache Doris 与 Microsoft OneLake 无缝集成，实现统一数据湖架构下的高效分析。这种集成方案具有以下核心优势：

* **零数据迁移**：直接访问 OneLake 中的数据，无需复制或移动数据

* **统一管理**：保持数据湖的集中治理和安全策略

* **标准兼容**：基于 Iceberg 开放表格式，确保跨平台互操作性

* **灵活分析**：结合 Doris 强大的 OLAP 能力和 OneLake 的存储优势

无论是实时业务监控、跨系统数据对比，还是复杂的多维分析，这种架构都能为企业提供强大且灵活的数据分析能力。随着数据湖技术的不断发展，Doris 与 OneLake 的集成将为企业数字化转型提供更加坚实的数据基础设施支撑。

下一步，您可以根据实际业务需求，参考本文的配置步骤搭建自己的分析环境，并探索更多高级分析场景。
