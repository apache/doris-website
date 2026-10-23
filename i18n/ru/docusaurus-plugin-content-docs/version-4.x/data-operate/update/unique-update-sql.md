---
{
    "title": "Обновление данных с помощью команды UPDATE",
    "language": "ru",
    "description": "Используйте команду UPDATE в таблицах Doris с моделью Unique Key Model для изменения данных: обновления небольшого числа строк и пакетного обновления отдельных полей в рамках ETL."
}
---

<!-- Knowledge type: How-to guide -->
<!-- Applicable scenarios: Row-level data correction / Field batch update / ETL processing -->

В этом документе описано, как использовать команду `UPDATE` в Apache Doris для изменения данных в таблицах с моделью Unique Key Model. Рассматриваются сценарии использования, принцип работы, факторы, влияющие на производительность, и полный пример применения.

Команда `UPDATE` применима только к таблицам с моделью Unique Key Model.

## Сценарии использования {#applicable-scenarios}

Команду `UPDATE` рекомендуется использовать в следующих двух типичных сценариях:

| Сценарий | Описание | Пример |
| --- | --- | --- |
| Обновление небольшого объёма данных | Исправление неверных значений полей в небольшом числе записей или обновление статуса в определённых полях | Исправление статуса заказа, исправление неверных данных в отдельных полях |
| Пакетная обработка отдельных полей в рамках ETL | Массовое обновление определённого поля, характерное для сценариев ETL | Пакетный пересчёт уровней риска, пакетное обновление полей с тегами |

:::caution Примечание
Массовые обновления данных следует выполнять редко. Избегайте частого запуска таких операций.
:::

## Принцип работы {#how-it-works}

<!-- Knowledge type: Concept -->

Основной процесс выполнения `UPDATE` выглядит следующим образом:

1. Движок запросов отбирает строки, которые нужно обновить, на основе условия `WHERE`.
2. Новые данные заменяют старые в соответствии с логикой перезаписи столбцов Value в модели Unique Key Model.
3. Изменённые строки записываются обратно в таблицу, обеспечивая обновление на уровне строк.

### Синхронность {#synchronicity}

Оператор `UPDATE` в Doris выполняется синхронно: как только оператор `UPDATE` успешно завершился, операция обновления выполнена, а данные сразу доступны для чтения.

### Производительность {#performance}

Производительность оператора `UPDATE` определяется главным образом двумя факторами:

| Фактор | Описание | Рекомендация по оптимизации |
| --- | --- | --- |
| Число обновляемых строк | Чем больше строк, тем медленнее выполнение | Небольшие обновления можно выполнять с той же частотой, что и `INSERT INTO`; массовые обновления подходят только для редких вызовов |
| Эффективность условия запроса | `UPDATE` сначала считывает строки, соответствующие условию | Условие по столбцам должно позволять использовать индекс или отсечение разделов/бакетов, чтобы избежать полного сканирования таблицы |

:::tip Совет
Настоятельно рекомендуется не включать столбцы Value в условие `WHERE`, чтобы условие запроса позволяло эффективно использовать первичный ключ или индексы.
:::

## Пример использования {#usage-example}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Financial risk control / Batch update of risk levels -->

В следующем примере на основе сценария контроля финансовых рисков показано, как с помощью `UPDATE` выполнить пакетное обновление уровней риска в записях о транзакциях.

### Шаг 1: Создайте таблицу {#step-1-create-the-table}

Создайте таблицу с деталями транзакций `transaction_details`, использующую модель Unique Key Model с включённым режимом Merge-on-Write:

```sql
CREATE TABLE transaction_details (
    transaction_id BIGINT NOT NULL,        -- Unique transaction ID
    user_id BIGINT NOT NULL,               -- User ID
    transaction_date DATE NOT NULL,        -- Transaction date
    transaction_time DATETIME NOT NULL,    -- Transaction time
    transaction_amount DECIMAL(18, 2),     -- Transaction amount
    transaction_device STRING,             -- Transaction device
    transaction_region STRING,             -- Transaction region
    average_daily_amount DECIMAL(18, 2),   -- Average daily transaction amount over the last 3 months
    recent_transaction_count INT,          -- Number of transactions in the last 7 days
    has_dispute_history BOOLEAN,           -- Whether there is a dispute history
    risk_level STRING                      -- Risk level
)
UNIQUE KEY(transaction_id)
DISTRIBUTED BY HASH(transaction_id) BUCKETS 16
PROPERTIES (
    "replication_num" = "3",                       -- Number of replicas, default is 3
    "enable_unique_key_merge_on_write" = "true"    -- Enable MOW mode to support merge updates
);
```

### Шаг 2: Просмотрите исходные данные {#step-2-view-the-initial-data}

Предположим, что таблица уже содержит следующие данные о транзакциях, а поле `risk_level` ещё не заполнено:

```sql
+----------------+---------+------------------+---------------------+--------------------+--------------------+--------------------+----------------------+--------------------------+---------------------+------------+
| transaction_id | user_id | transaction_date | transaction_time    | transaction_amount | transaction_device | transaction_region | average_daily_amount | recent_transaction_count | has_dispute_history | risk_level |
+----------------+---------+------------------+---------------------+--------------------+--------------------+--------------------+----------------------+--------------------------+---------------------+------------+
|           1001 |    5001 | 2024-11-24       | 2024-11-24 14:30:00 |             100.00 | iPhone 12          | New York           |               100.00 |                       10 |                   0 | NULL       |
|           1002 |    5002 | 2024-11-24       | 2024-11-24 03:30:00 |             120.00 | iPhone 12          | New York           |               100.00 |                       15 |                   0 | NULL       |
|           1003 |    5003 | 2024-11-24       | 2024-11-24 10:00:00 |             150.00 | Samsung S21        | Los Angeles        |               100.00 |                       30 |                   0 | NULL       |
|           1004 |    5004 | 2024-11-24       | 2024-11-24 16:00:00 |             300.00 | MacBook Pro        | high_risk_region1  |               200.00 |                        5 |                   0 | NULL       |
|           1005 |    5005 | 2024-11-24       | 2024-11-24 11:00:00 |            1100.00 | iPad Pro           | Chicago            |               200.00 |                       10 |                   0 | NULL       |
+----------------+---------+------------------+---------------------+--------------------+--------------------+--------------------+----------------------+--------------------------+---------------------+------------+
```

### Шаг 3: Определите правила контроля рисков {#step-3-define-the-risk-control-rules}

Примените следующие правила в порядке приоритета, чтобы пакетно присвоить уровень риска всем записям о транзакциях за день:

| Приоритет | Правило | Уровень риска |
| --- | --- | --- |
| 1 | Транзакции с историей споров | Высокий |
| 2 | Транзакции из регионов с высоким риском (например, `high_risk_region1`, `high_risk_region2`) | Высокий |
| 3 | Транзакции с аномальными суммами (более чем в 5 раз превышающими среднюю дневную сумму) | Высокий |
| 4 | Более 50 транзакций за последние 7 дней | Высокий |
| 5 | От 20 до 50 транзакций за последние 7 дней | Средний |
| 6 | Транзакции в нерабочее время (с 2 до 4 часов ночи) | Средний |
| 7 | Остальные случаи по умолчанию | Низкий |

### Шаг 4: Выполните UPDATE {#step-4-execute-update}

Выразите приведённые выше правила одним оператором `UPDATE`, используя `CASE WHEN` для логики с несколькими условиями:

```sql
UPDATE transaction_details
SET risk_level = CASE
    -- Transactions with a dispute history or from high-risk regions
    WHEN has_dispute_history = TRUE THEN 'high'
    WHEN transaction_region IN ('high_risk_region1', 'high_risk_region2') THEN 'high'

    -- Abnormal transaction amount
    WHEN transaction_amount > 5 * average_daily_amount THEN 'high'

    -- High-frequency transactions in the last 7 days
    WHEN recent_transaction_count > 50 THEN 'high'
    WHEN recent_transaction_count BETWEEN 20 AND 50 THEN 'medium'

    -- Transactions during off-hours
    WHEN HOUR(transaction_time) BETWEEN 2 AND 4 THEN 'medium'

    -- Default risk level
    ELSE 'low'
END
WHERE transaction_date = '2024-11-24';
```

### Шаг 5: Проверьте результаты обновления {#step-5-verify-the-update-results}

После выполнения снова запросите данные. Поле `risk_level` обновлено в соответствии с правилами:

```sql
+----------------+---------+------------------+---------------------+--------------------+--------------------+--------------------+----------------------+--------------------------+---------------------+------------+
| transaction_id | user_id | transaction_date | transaction_time    | transaction_amount | transaction_device | transaction_region | average_daily_amount | recent_transaction_count | has_dispute_history | risk_level |
+----------------+---------+------------------+---------------------+--------------------+--------------------+--------------------+----------------------+--------------------------+---------------------+------------+
|           1001 |    5001 | 2024-11-24       | 2024-11-24 14:30:00 |             100.00 | iPhone 12          | New York           |               100.00 |                       10 |                   0 | low        |
|           1002 |    5002 | 2024-11-24       | 2024-11-24 03:30:00 |             120.00 | iPhone 12          | New York           |               100.00 |                       15 |                   0 | medium     |
|           1003 |    5003 | 2024-11-24       | 2024-11-24 10:00:00 |             150.00 | Samsung S21        | Los Angeles        |               100.00 |                       30 |                   0 | medium     |
|           1004 |    5004 | 2024-11-24       | 2024-11-24 16:00:00 |             300.00 | MacBook Pro        | high_risk_region1  |               200.00 |                        5 |                   0 | high       |
|           1005 |    5005 | 2024-11-24       | 2024-11-24 11:00:00 |            1100.00 | iPad Pro           | Chicago            |               200.00 |                       10 |                   0 | high       |
+----------------+---------+------------------+---------------------+--------------------+--------------------+--------------------+----------------------+--------------------------+---------------------+------------+
```

## Дополнительная справка {#more-help}

- Полное описание синтаксиса: см. руководство по команде [UPDATE](../../sql-manual/sql-statements/data-modification/DML/UPDATE).
- Справка в командной строке: выполните `HELP UPDATE` в клиенте MySQL, чтобы просмотреть встроенную документацию.
