---
{
    "title": "Интеграция с Microsoft OneLake",
    "language": "ru",
    "description": "Microsoft OneLake, часть экосистемы Fabric, представляет собой единое открытое озеро данных SaaS, предоставляющее организациям централизованное логическое хранилище данных "
}
---

**Microsoft OneLake**, часть экосистемы Fabric, представляет собой единое открытое озеро данных SaaS, предоставляющее организациям централизованный логический уровень хранения данных. Данные в OneLake хранятся в формате **Parquet**, при этом для них могут одновременно поддерживаться метаданные **Delta Lake** и **Apache Iceberg**. Такой подход позволяет нескольким аналитическим движкам напрямую обращаться к общим наборам данных **без дублирования или переноса данных**, существенно упрощая управление данными и контроль за их использованием.

Благодаря **Iceberg REST Catalog в Apache Doris** пользователи могут напрямую выполнять запросы к данным в OneLake и анализировать их, также без копирования или перемещения.

Эта интеграция позволяет создавать **конвейеры сквозной аналитики** на основе единого озера данных, сочетая возможности OneLake по унифицированному хранению и управлению данными с высокопроизводительными аналитическими вычислениями Doris.

На техническом уровне Doris взаимодействует с OneLake через открытые табличные форматы и стандартизированные интерфейсы для доступа к метаданным и файлам Parquet. Архитектура сохраняет централизованное управление, контроль доступа и политики безопасности, обеспечивая надёжность, масштабируемость и удобство сопровождения платформы.

В этой статье мы рассмотрим подключение Doris к OneLake, включая подготовку среды, настройку аутентификации и примеры выполнения запросов.

> Требуется Doris версии 3.1.4+

## Настройка OneLake {#onelake-setup}

Сначала подготовим данные и настроим аутентификацию на стороне **Fabric (OneLake)**, а затем покажем, как создать **Iceberg REST Catalog** в Doris для доступа к этим данным.

### Загрузка данных в OneLake {#load-data-into-onelake}

1. Откройте консоль **Microsoft Fabric** и создайте новую **рабочую область** (рекомендуется *не* использовать рабочую область по умолчанию, поскольку некоторые настройки в ней могут быть ограничены).

   ![onelake1](/images/integrations/lakehouse/onelake/onelake-1.png)

2. В рабочей области выберите **Новый элемент → Lakehouse**, чтобы создать экземпляр Lakehouse.

   ![onelake2](/images/integrations/lakehouse/onelake/onelake-2.png)

3. Перейдите в **Настройки рабочей области** и включите необходимые переключатели, чтобы активировать функции Lakehouse.

   ![onelake3](/images/integrations/lakehouse/onelake/onelake-3.png)

### Загрузка локальных файлов {#upload-local-files}

Для демонстрации загрузим локальный файл CSV непосредственно в OneLake. Вот пример такого файла:

![onelake4](/images/integrations/lakehouse/onelake/onelake-4.png)

1. Перейдите в раздел **Файлы** рабочей области, нажмите **Загрузить → Загрузить файлы** и выберите свой файл CSV.

   ![onelake5](/images/integrations/lakehouse/onelake/onelake-5.png)

2. После загрузки выберите **Загрузить таблицы → Новая таблица** (или загрузите данные в существующую таблицу, если она уже создана).

3. После завершения импорта перейдите в представление **Таблицы**, чтобы просмотреть таблицы и данные.

   ![onelake6](/images/integrations/lakehouse/onelake/onelake-6.png)

### Настройка аутентификации {#authentication-setup}

Чтобы Doris мог обращаться к OneLake через Iceberg REST Catalog, необходимо **зарегистрировать приложение и настроить разрешения** на портале Azure:

1. Откройте **Портал Azure → Регистрация приложений → Новая регистрация** и сохраните следующие значения для дальнейшего использования:

   * Идентификатор приложения (клиента)

   * Идентификатор каталога (арендатора)

   ![onelake7](/images/integrations/lakehouse/onelake/onelake-7.png)

* В разделе **Разрешения API** добавьте необходимые разрешения для **Azure Storage** (следуйте принципу минимальных привилегий).

  ![onelake8](/images/integrations/lakehouse/onelake/onelake-8.png)

* В разделе **Сертификаты и секреты** создайте **секрет клиента** и сохраните его значение в безопасном месте: после ухода со страницы оно будет скрыто.

  ![onelake9](/images/integrations/lakehouse/onelake/onelake-9.png)

* Вернитесь в **Рабочая область Fabric → Управление доступом** и добавьте зарегистрированное приложение (по его отображаемому имени) в качестве субъекта доступа.

  ![onelake10](/images/integrations/lakehouse/onelake/onelake-10.png)

После выполнения этих шагов данные OneLake и настройки аутентификации готовы к работе.

## Подключение к OneLake из Apache Doris {#connecting-onelake-from-apache-doris}

Теперь создадим **Iceberg REST Catalog** в Doris и подключимся к данным OneLake.

### Создание Catalog {#create-catalog}

```sql
Doris> CREATE CATALOG onelake_doris PROPERTIES (
            'type' = 'iceberg',
            'iceberg.catalog.type' = 'rest',
            'uri'='https://onelake.table.fabric.microsoft.com/iceberg',
            'warehouse'='<workerspace_id>/<data_item_id>',
            'iceberg.rest.security.type'='oauth2',
            'iceberg.rest.oauth2.server-uri'='https://login.microsoftonline.com/<tenant_id>/oauth2/v2.0/token',
            'iceberg.rest.oauth2.credential'='<oauth2.client_id>:<oauth2.client_secret>',
            'iceberg.rest.oauth2.scope'='https://storage.azure.com/.default', 
            'fs.azure.support'='true',
            'azure.endpoint'='https://onelake.dfs.fabric.microsoft.com',
            'azure.auth_type'='OAuth2',
            'azure.oauth2_account_host'='onelake.dfs.fabric.microsoft.com',
            'azure.oauth2_server_uri'='https://login.microsoftonline.com/<tenant_id>/oauth2/v2.0/token',
            'azure.oauth2_client_id'='<oauth2.client_id>',
            'azure.oauth2_client_secret'='<oauth2.client_secret>'
        );
```

При создании Catalog потребуются следующие параметры:

* `WORKSPACE_ID` и `DATA_ITEM_ID` можно получить из URL вашего Lakehouse:

  `https://app.fabric.microsoft.com/groups/<WORKSPACE_ID>/lakehouses/<DATA_ITEM_ID>`

* Другие параметры, такие как `client_id`, `client_secret` и `tenant`, соответствуют данным регистрации приложения в Azure.

* Для OneLake параметры конфигурации, такие как `iceberg.rest.oauth2.scope`, `uri`, `azure.oauth2_account_host` и `azure.endpoint`, обычно имеют фиксированные значения. Подробности см. в официальной документации или примерах конфигурации.

После настройки вы сможете выполнять запросы к таблицам Iceberg в OneLake непосредственно из Doris с помощью стандартного SQL.

### Базовая аналитика {#basic-analytics}

Ниже приведены несколько типичных примеров бизнес-анализа, которые показывают, как Doris и OneLake могут совместно обеспечивать единую аналитику:

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

1. Отслеживание новых заказов за последние три дня

   Получайте в реальном времени сведения о недавних продажах, включая ожидающие обработки, оплаченные и завершённые заказы, чтобы точнее расставлять приоритеты их выполнения.

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

2. Показатели продаж по городам

   Рассчитывайте общую сумму продаж и количество заказов по каждому городу для разработки региональной стратегии продаж и планирования запасов.

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

3. Доля возвратов по способам оплаты

   Выявляйте платёжные каналы с необычно высокой долей возвратов, чтобы помочь финансовому отделу или команде управления рисками скорректировать политики или усилить мониторинг.

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

4. Сравнение поведения пользователей в разных системах

   Если прежняя система (например, Hive) и OneLake работают одновременно, можно анализировать пересечение пользовательских аудиторий и изменения поведения после миграции, чтобы оценить влияние на бизнес.

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

### Снимки и Time Travel {#snapshot--time-travel}

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

## Заключение {#conclusion}

В этом руководстве мы показали, как интегрировать **Apache Doris** с **Microsoft OneLake** для высокопроизводительной аналитики на основе единой архитектуры озера данных.
&#x20;Эта интеграция даёт несколько ключевых преимуществ:

* **Без перемещения данных**: прямой доступ к данным в OneLake без копирования или миграции.

* **Единое управление**: централизованное управление, контроль доступа и политики безопасности во всём озере данных.

* **Совместимость с открытыми форматами**: использование открытого табличного стандарта **Iceberg** обеспечивает взаимодействие между платформами.

* **Гибкая аналитика**: сочетание мощного движка OLAP Doris с масштабируемым уровнем хранения OneLake.

Для **мониторинга бизнеса в реальном времени**, **сравнения данных из разных систем** или **сложной многомерной аналитики** эта архитектура предоставляет предприятиям как производительность, так и гибкость. По мере развития технологий озёр данных интеграция Doris и OneLake станет надёжной основой для работы с данными при цифровой трансформации предприятий.

Теперь вы можете выполнить описанные в статье шаги настройки, чтобы создать собственную аналитическую среду и изучить ещё более сложные сценарии аналитики с учётом потребностей вашего бизнеса.
