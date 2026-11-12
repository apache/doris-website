---
title: Ускорение запросов JOIN с помощью словарей
sidebar_label: Ускорение с помощью словарей
language: ru
description: Используйте словари Doris, чтобы заменить JOIN с таблицами измерений поиском по ключу в памяти и ускорить выполнение запросов.
keywords:
    - Doris Dictionary
    - Dictionary
    - JOIN acceleration
    - dimension table query
    - dict_get
    - HASH_MAP
    - IP_TRIE
    - KV lookup
---

<!-- Knowledge type: Feature definition / Operation steps / Configuration parameters -->
<!-- Applicable scenarios: Query performance tuning / Dimension table join acceleration -->

Словарь представляет собой специальную структуру данных Doris для ускорения операций JOIN. Он строится на основе обычной таблицы, использует соответствующие столбцы исходной таблицы как пары «ключ-значение» и предварительно загружает все данные этих столбцов в память для быстрого поиска, повышая производительность запросов.

Словари особенно полезны в сценариях, где требуется частый поиск по ключу. Как структура для поиска по ключу, словарь не допускает повторяющихся ключей.

:::tip
Эта функция является экспериментальной и поддерживается начиная с версии 4.1.0.
:::

## Сценарии использования {#use-cases}

<!-- Knowledge type: Architecture selection decision -->

Словари подходят прежде всего для следующих сценариев:

1. Требуется частый поиск по ключу
2. Таблица измерений достаточно мала, чтобы целиком помещаться в памяти
3. Данные обновляются относительно редко

С помощью словаря поиск по ключу, для которого раньше требовался LEFT OUTER JOIN, можно превратить в обычный вызов функции, полностью устранив накладные расходы на JOIN.

### Пример сценария {#scenario-example}

В системе электронной коммерции таблица заказов (`orders`, таблица фактов) содержит большой объём данных о транзакциях. Её часто требуется соединять с таблицей товаров (`products`, таблица измерений), чтобы получить подробную информацию о товарах.

**Шаг 1: Создайте базовую таблицу фактов и таблицу измерений и вставьте тестовые данные**

```sql
-- Product dimension table
CREATE TABLE products (
    product_id BIGINT NOT NULL COMMENT "Product ID",
    product_name VARCHAR(128) NOT NULL COMMENT "Product name",
    brand_name VARCHAR(64) NOT NULL COMMENT "Brand name",
    category_name VARCHAR(64) NOT NULL COMMENT "Category name",
    retail_price DECIMAL(10,2) NOT NULL COMMENT "Retail price",
    update_time DATETIME NOT NULL COMMENT "Update time"
)
DISTRIBUTED BY HASH(`product_id`) BUCKETS 10;

-- Order fact table
CREATE TABLE orders (
    order_id BIGINT NOT NULL COMMENT "Order ID",
    product_id BIGINT NOT NULL COMMENT "Product ID",
    user_id BIGINT NOT NULL COMMENT "User ID",
    quantity INT NOT NULL COMMENT "Purchase quantity",
    actual_price DECIMAL(10,2) NOT NULL COMMENT "Actual transaction price",
    order_time DATETIME NOT NULL COMMENT "Order time"
)
DISTRIBUTED BY HASH(`order_id`) BUCKETS 32;

-- Insert sample data
INSERT INTO products VALUES
(1001, 'iPhone 15 Pro 256G Black', 'Apple', 'Mobile & Digital', 8999.00, '2024-01-01 00:00:00'),
(1002, 'MacBook Pro M3 Max', 'Apple', 'Computers & Office', 19999.00, '2024-01-01 00:00:00'),
(1003, 'AirPods Pro 2', 'Apple', 'Phone Accessories', 1999.00, '2024-01-01 00:00:00');

INSERT INTO orders VALUES
(10001, 1001, 88001, 1, 8899.00, '2024-02-22 10:15:00'),
(10002, 1002, 88002, 1, 19599.00, '2024-02-22 11:30:00'),
(10003, 1003, 88001, 2, 1899.00, '2024-02-22 14:20:00');
```

**Шаг 2: Традиционный подход с JOIN**

Раньше для подсчёта количества заказов и общей суммы продаж по каждой категории приходилось использовать LEFT OUTER JOIN, чтобы получить информацию о товарах из таблицы товаров:

```sql
-- Count the number of orders and total sales for each category
SELECT 
    p.category_name,
    p.brand_name,
    COUNT(DISTINCT o.order_id) as order_count,
    SUM(o.quantity) as total_quantity,
    SUM(o.actual_price * o.quantity) as total_amount
FROM orders o
LEFT JOIN products p ON o.product_id = p.product_id
WHERE o.order_time >= '2024-02-22 00:00:00'
GROUP BY p.category_name, p.brand_name
ORDER BY total_amount DESC;
```

```text
+---------------------+------------+-------------+----------------+--------------+
| category_name       | brand_name | order_count | total_quantity | total_amount |
+---------------------+------------+-------------+----------------+--------------+
| Computers & Office  | Apple      |           1 |              1 |     19599.00 |
| Mobile & Digital    | Apple      |           1 |              1 |      8899.00 |
| Phone Accessories   | Apple      |           1 |              2 |      3798.00 |
+---------------------+------------+-------------+----------------+--------------+
```

В таких запросах часто требуется находить дополнительную информацию о товаре по `product_id`, что по сути является операцией поиска KV.

**Шаг 3: Используйте словарь вместо JOIN**

Определив соответствие между ключами и значениями, можно заранее создать словарь и полностью заменить прежнюю операцию JOIN более лёгким поиском по ключу, повысив эффективность выполнения SQL:

```sql
-- Create the product information dictionary
CREATE DICTIONARY product_info_dict USING products
(
    product_id KEY,
    product_name VALUE,
    brand_name VALUE,
    category_name VALUE,
    retail_price VALUE
)
LAYOUT(HASH_MAP)
PROPERTIES(
    'data_lifetime'='300'  -- Considering how often product information changes, refresh every 5 minutes
);
```

При использовании словаря операция JOIN в исходном запросе заменяется поиском через функцию `dict_get`, которая выполняет лёгкую операцию поиска KV:

```sql
SELECT
    dict_get("test.product_info_dict", "category_name", o.product_id) as category_name,
    dict_get("test.product_info_dict", "brand_name", o.product_id) as brand_name,
    COUNT(DISTINCT o.order_id) as order_count,
    SUM(o.quantity) as total_quantity,
    SUM(o.actual_price * o.quantity) as total_amount
FROM orders o
WHERE o.order_time >= '2024-02-22 00:00:00'
GROUP BY
    dict_get("test.product_info_dict", "category_name", o.product_id),
    dict_get("test.product_info_dict", "brand_name", o.product_id)
ORDER BY total_amount DESC;
```

```text
+---------------------+------------+-------------+----------------+--------------+
| category_name       | brand_name | order_count | total_quantity | total_amount |
+---------------------+------------+-------------+----------------+--------------+
| Computers & Office  | Apple      |           1 |              1 |     19599.00 |
| Mobile & Digital    | Apple      |           1 |              1 |      8899.00 |
| Phone Accessories   | Apple      |           1 |              2 |      3798.00 |
+---------------------+------------+-------------+----------------+--------------+
```

## Определение словаря {#dictionary-definition}

Начиная с версии 4.1.5, для создания словаря требуются право `CREATE` на целевой объект словаря и право `SELECT` на исходную таблицу. Для удаления требуется право `DROP` на объект словаря. Права на исходную таблицу также проверяются, если она находится во внешнем Catalog.

<!-- Knowledge type: Configuration parameters / Operation steps -->

### Базовый синтаксис {#basic-syntax}

```sql
CREATE DICTIONARY <dict_name> USING <source_table>
(
    <key_column> KEY[,
    ...,
    <key_columns> VALUE]
    <value_column> VALUE[,
    ...,
    <value_columns> VALUE]
)
LAYOUT(<layout_type>)
PROPERTIES(
    "<priority_item_key>" = "<priority_item_value>"[,
    ...,
    "<priority_item_key>" = "<priority_item_value>"]
);
```

Описание параметров:

| Параметр | Значение |
| --- | --- |
| `<dict_name>` | Имя словаря |
| `<source_table>` | Таблица исходных данных |
| `<key_column>` | Имя столбца исходной таблицы, используемого в качестве ключа |
| `<value_column>` | Имя столбца исходной таблицы, используемого в качестве значения |
| `<layout_type>` | Тип структуры хранения словаря; подробности приведены ниже |
| `<priority_item_key>` | Имя свойства словаря |
| `<priority_item_value>` | Значение свойства словаря |

Необходимо указать хотя бы один `<key_column>` и один `<value_column>`. При этом `<key_column>` не обязательно должен предшествовать `<value_column>`.

### Типы структур хранения {#layout-types}

В настоящее время поддерживаются два типа структур хранения:

| Тип структуры хранения | Сценарий использования | Описание |
| --- | --- | --- |
| `HASH_MAP` | Общие сценарии поиска по ключу | Реализация на основе хеш-таблицы |
| `IP_TRIE` | Поиск по IP-адресам | Реализация на основе префиксного дерева, оптимизированная для поиска по IP-адресам. Столбец ключа должен содержать IP-адреса в нотации CIDR; при выполнении запросов сопоставление выполняется по этой нотации |

### Свойства {#properties}

| Свойство | Тип значения | Значение | Обязательное |
| --- | --- | --- | --- |
| `data_lifetime` | Целое число, в секундах | Срок действия данных. Если время с последнего обновления словаря превышает это значение и данные базовой таблицы изменились, автоматически запускается повторный импорт. Логика импорта описана в разделе [Автоматический импорт](#auto-import) | Да |
| `skip_null_key` | Логический | Если при загрузке данных в словарь в столбце ключа встречается значение null, строка пропускается, когда это свойство равно `true`; в противном случае возникает ошибка. Значение по умолчанию: `false` | Нет |
| `memory_limit` | Целое число, в байтах | Верхний предел объёма памяти, используемой словарём на одном BE. Значение по умолчанию: `2147483648`, то есть 2GB | Нет |

### Пример создания {#creation-example}

```sql
-- Create the source data table
CREATE TABLE source_table (
    id INT NOT NULL,
    city VARCHAR(32) NOT NULL,
    code VARCHAR(32) NOT NULL
) ENGINE=OLAP
DISTRIBUTED BY HASH(id) BUCKETS 1;

-- Create the dictionary
CREATE DICTIONARY city_dict USING source_table
(
    city KEY,
    id VALUE
)
LAYOUT(HASH_MAP)
PROPERTIES('data_lifetime' = '600');
```

На основе этой таблицы можно использовать словарь `city_dict` вместе с функцией `dict_get`, чтобы находить соответствующий `id` по значению `city` из `source_table`.

### Ограничения использования {#usage-restrictions}

**1. Ограничения для столбца ключа**

- Столбец ключа словаря IP_TRIE должен иметь тип Varchar или String, а **значения в этом столбце должны быть в формате CIDR**.
- Словарь IP_TRIE допускает только один столбец ключа.
- Столбец ключа словаря HASH_MAP поддерживает все простые типы, то есть вложенные типы, такие как Map и Array, исключены.
- Столбец, используемый в качестве ключа, **не должен содержать повторяющиеся значения в исходной таблице**; в противном случае при загрузке данных в словарь возникает ошибка.

**2. Обработка значений null**

- Все столбцы словаря могут быть Nullable, но столбец ключа фактически не должен содержать значения null. Если такие значения встречаются, поведение зависит от `skip_null_key` в разделе [Свойства](#properties).

## Использование и управление {#usage-and-management}

### Загрузка (обновление) данных {#loading-refreshing-data}

<!-- Knowledge type: Operation steps -->

Словари поддерживают автоматическую и ручную загрузку данных. Загрузку словаря также называют операцией обновления.

#### Автоматический импорт {#auto-import}

Автоматическая загрузка выполняется в следующих случаях:

1. После создания словаря
2. Когда срок действия данных словаря истёк (см. раздел [Свойства](#properties))
3. Когда состояние BE указывает на отсутствие данных этого словаря (например, при подключении нового BE или перезапуске существующего BE)

Doris каждые `dictionary_auto_refresh_interval_seconds` секунд проверяет, не истёк ли срок действия данных словарей. Если словарь не обновлялся более `data_lifetime` секунд и **данные базовой таблицы изменились с момента последней загрузки**, Doris автоматически отправляет задачу загрузки этого словаря.

Если на некоторых BE отсутствуют данные, а данные базовой таблицы не изменились с момента последней загрузки, Doris загружает текущую версию данных только на эти BE. Задача обновления для всех BE не создаётся, а версия словаря не меняется.

#### Ручной импорт {#manual-import}

- **Назначение**: вручную запустить обновление данных словаря.
- **Команда**:

    ```sql
    REFRESH DICTIONARY <dict_name>;
    ```

- **Описание**: `<dict_name>` обозначает имя словаря, в который требуется загрузить данные.

#### Примечания по загрузке {#notes-for-loading}

1. Запросы к словарю можно выполнять только после загрузки данных.
2. Если при загрузке в столбце ключа обнаружены повторяющиеся значения, транзакция загрузки завершается ошибкой.
3. Если транзакция загрузки уже выполняется (поле Status словаря имеет значение `LOADING`), ручная загрузка завершается ошибкой. Дождитесь завершения текущей загрузки и повторите попытку.
4. Если размер загруженного словаря превышает настроенный `memory_limit`, транзакция загрузки завершается ошибкой.

### Запросы к словарю {#querying-a-dictionary}

<!-- Knowledge type: Operation steps -->

Функции `dict_get` и `dict_get_many` позволяют выполнять запросы к словарю с одним столбцом ключа и значения или с несколькими столбцами ключей и значений соответственно.

Перед первым запросом дождитесь завершения загрузки словаря.

#### Синтаксис {#syntax}

```sql
dict_get("<db_name>.<dict_name>", "<query_column>", <query_key_value>);
dict_get_many("<db_name>.<dict_name>", <query_columns>, <query_key_values>);
```

Описание параметров:

| Параметр | Описание |
| --- | --- |
| `<db_name>` | Имя базы данных, которой принадлежит словарь |
| `<dict_name>` | Имя словаря |
| `<query_column>` | Имя запрашиваемого столбца значений типа `VARCHAR`; **должно быть константой** |
| `<query_columns>` | Имена всех запрашиваемых столбцов значений типа `ARRAY<VARCHAR>`; **должны быть заданы константой** |
| `<query_key_value>` | Данные столбца ключа, используемые для запроса |
| `<query_key_values>` | STRUCT с данными для запроса по **всем столбцам ключей** словаря |

Типы возвращаемых значений:

- Тип возвращаемого значения `dict_get` совпадает с типом столбца словаря, соответствующего `<query_column>`.
- Тип возвращаемого значения `dict_get_many` представляет собой [STRUCT](../sql-manual/basic-element/sql-data-types/semi-structured/STRUCT), состоящий из типов столбцов словаря, соответствующих `<query_columns>`.

#### Примеры запросов {#query-examples}

**Пример 1: Запрос с одним ключом и одним значением**

Выполните запрос к словарю `city_dict` в базе данных `test_db`, чтобы получить значение `id` для ключа "Beijing":

```sql
SELECT dict_get("test_db.city_dict", "id", "Beijing");
```

**Пример 2: Запрос с одним ключом и несколькими значениями**

Выполните запрос к словарю `single_key_dict` в базе данных `test_db`, чтобы получить значения столбцов `k1` и `k3` для ключа 1:

```sql
SELECT dict_get_many("test_db.single_key_dict", ["k1", "k3"], struct(1));
```

**Пример 3: Запрос с несколькими ключами и несколькими значениями**

Выполните запрос к словарю `multi_key_dict` в базе данных `test_db`, чтобы получить значения столбцов `k2` и `k3`, когда значения двух столбцов ключей равны 2 и 'ABC' соответственно:

```sql
SELECT dict_get_many("test_db.multi_key_dict", ["k2", "k3"], struct(2, 'ABC'));
```

Например, если таблица создана следующим образом:

```sql
create table if not exists multi_key_table(
    k0 int not null,
    k1 varchar not null,
    k2 float not null,
    k3 varchar not null
)
DISTRIBUTED BY HASH(`k0`) BUCKETS auto;

create dictionary multi_key_dict using multi_key_table
(
    k0 KEY,
    k1 KEY,
    k2 VALUE,
    k3 VALUE
)
LAYOUT(HASH_MAP)
PROPERTIES('data_lifetime' = '600');
```

то тип возвращаемого значения предыдущего запроса

```sql
SELECT dict_get_many("test_db.multi_key_dict", ["k2", "k3"], struct(2, 'ABC'));
```

будет `STRUCT<float, varchar>`.

#### Примечания по запросам {#notes-for-queries}

1. Если запрашиваемый ключ отсутствует в словаре **или данные ключа равны null**, возвращается null.
2. При запросе к словарю IP_TRIE **тип `<query_key_value>` должен быть `IPV4` или `IPV6`**.
3. При использовании словаря IP_TRIE как данные в столбце ключа `<key_column>`, так и значение `<query_key_value>`, используемое для запроса, поддерживают форматы `IPV4` и `IPV6`.
4. Если на определённом BE отсутствуют данные словаря из-за недавнего подключения или перезапуска после простоя, запросы к этому словарю завершатся ошибкой, если будут назначены на этот BE. Назначение запроса на конкретный BE зависит от нескольких факторов. Если FE Master не испытывает высокой нагрузки, уменьшение [параметра конфигурации](#configuration-items) `dictionary_auto_refresh_interval_seconds` может сократить период недоступности словаря.

### Управление словарями {#dictionary-management}

<!-- Knowledge type: Operation steps -->

Для управления словарями и проверки их состояния поддерживаются следующие команды:

**1. Просмотр состояния всех словарей в текущей базе данных**

```sql
SHOW DICTIONARIES [LIKE <LIKE_NAME>];
```

**2. Просмотр определения конкретного словаря**

```sql
DESC DICTIONARY <dict_name>;
```

**3. Удаление словаря**

```sql
DROP DICTIONARY <dict_name>;
```

После удаления словаря его данные могут удалиться с BE не сразу.

#### Параметры конфигурации {#configuration-items}

Словари поддерживают следующие параметры конфигурации, все они относятся к FE CONFIG:

| Параметр конфигурации | Значение по умолчанию | Динамическое изменение | Описание |
| --- | --- | --- | --- |
| `dictionary_task_queue_size` | 1024 | Нет | Длина очереди пула потоков для всех задач словарей. Обычно изменять не требуется |
| `job_dictionary_task_consumer_thread_num` | 3 | Нет | Количество потоков в пуле для всех задач словарей |
| `dictionary_rpc_timeout_ms` | 5000 (5s) | Да | Время ожидания для всех RPC, связанных со словарями. Обычно изменять не требуется |
| `dictionary_auto_refresh_interval_seconds` | 5 (секунд) | Да | Интервал автоматической проверки срока действия данных всех словарей |

### Отображение состояния {#status-display}

Команда `SHOW DICTIONARIES` показывает базовую таблицу каждого словаря, номер текущей версии данных и соответствующее состояние на FE и BE.

```sql
> SHOW DICTIONARIES;
```

```text
+--------------+----------------+----------------------------------------------+---------+--------+------------------------------------+------------------------------+
| DictionaryId | DictionaryName | BaseTableName                                | Version | Status | DataDistribution                   | LastUpdateResult             |
+--------------+----------------+----------------------------------------------+---------+--------+------------------------------------+------------------------------+
| 51           | precision_dict | internal.test_refresh_dict.precision_test    | 2       | NORMAL | {10.16.10.2:9767 ver=2 memory=368} | 2025-02-18 09:58:12: succeed |
| 48           | product_dict   | internal.test_refresh_dict.product_info      | 2       | NORMAL | {10.16.10.2:9767 ver=2 memory=240} | 2025-02-18 09:58:12: succeed |
| 49           | ip_dict        | internal.test_refresh_dict.ip_info           | 2       | NORMAL | {10.16.10.2:9767 ver=2 memory=194} | 2025-02-18 09:58:12: succeed |
| 52           | order_dict     | internal.test_refresh_dict.column_order_test | 2       | NORMAL | {10.16.10.2:9767 ver=2 memory=432} | 2025-02-18 09:58:12: succeed |
| 50           | user_dict      | internal.test_refresh_dict.user_info         | 2       | NORMAL | {10.16.10.2:9767 ver=2 memory=240} | 2025-02-18 09:58:12: succeed |
+--------------+----------------+----------------------------------------------+---------+--------+------------------------------------+------------------------------+
```

Значения полей:

1. `Version`: номер версии данных, который увеличивается на 1 при каждой загрузке данных.
2. `Status`: состояние словаря со следующими значениями:

    | Название состояния | Значение |
    | --- | --- |
    | NORMAL | Словарь находится в нормальном состоянии |
    | LOADING | В словарь загружаются данные |
    | OUT_OF_DATE | Срок действия данных словаря истёк |

    Повторная загрузка словаря невозможна, пока текущая загрузка не завершена.

3. `DataDistribution`: текущее состояние на каждом BE, включая номер версии и объём используемой памяти (KB).
4. `LastUpdateResult`: результат предыдущей загрузки, автоматической или ручной. При возникновении ошибки здесь отображается подробная информация.

Для просмотра определений столбцов словаря используйте `DESC DICTIONARY`. Например:

```sql
> DESC DICTIONARY city_code_dict;
+-------------+-------------+------+-------+
| Field       | Type        | Null | Key   |
+-------------+-------------+------+-------+
| city_name   | varchar(32) | NO   | true  |
| region_code | varchar(32) | NO   | false |
+-------------+-------------+------+-------+
```

## Примечания {#notes}

<!-- Knowledge type: Best practices -->

### Согласованность данных {#data-consistency}

- Каждое обновление словаря создаёт новую версию. Если во время запроса версия, записанная на BE, отличается от версии на FE, запрос завершается ошибкой.
- Doris не обеспечивает строгую согласованность данных между словарём и базовой таблицей. Необходимо задать подходящее значение `data_lifetime` словаря для автоматических обновлений и при необходимости дополнять их ручными обновлениями с учётом бизнес-логики.
- При удалении исходной таблицы любым способом соответствующий словарь также автоматически удаляется.

### Производительность {#performance-considerations}

- Словари подходят для относительно статичных данных, например данных таблиц измерений.
- Словарь представляет собой таблицу, полностью размещённую в памяти. Все его данные хранятся в памяти каждого BE, что требует значительного объёма памяти. Необходимо найти баланс между потреблением памяти и производительностью запросов и выбирать подходящие таблицы для создания словарей.

### Рекомендации {#best-practices}

1. **Обоснованно выбирайте столбцы ключей и значений**:

    - Выбирайте в качестве ключей столбцы с умеренной кардинальностью.

2. **Выбор структуры хранения**:

    - Используйте структуру HASH_MAP для общих сценариев.
    - Используйте структуру IP_TRIE для сопоставления IP-адресов с диапазонами.

3. **Управление состоянием**:

    - Регулярно отслеживайте потребление памяти словарями.
    - Выбирайте подходящий интервал обновления данных и обновляйте словарь вручную со стороны приложения, когда известно, что данные устарели.
    - При использовании словарей следите за памятью BE, чтобы слишком большое количество словарей или слишком крупные словари не потребляли чрезмерный объём памяти и не приводили к сбоям в работе BE.

## Полные примеры {#complete-examples}

<!-- Knowledge type: Operation steps -->

### Пример 1: HASH_MAP, один ключ и одно значение {#example-1-hash_map-single-key-and-single-value}

```sql
-- Create the source data table
CREATE TABLE cities (
    city_id INT NOT NULL,
    city_name VARCHAR(32) NOT NULL,
    region_code VARCHAR(32) NOT NULL
) ENGINE=OLAP
DISTRIBUTED BY HASH(city_id) BUCKETS 1;

-- Insert data
INSERT INTO cities VALUES
(1, 'Beijing', 'BJ'),
(2, 'Shanghai', 'SH'),
(3, 'Guangzhou', 'GZ');

-- Create the dictionary
CREATE DICTIONARY city_code_dict USING cities
(
    city_name KEY,
    region_code VALUE
)
LAYOUT(HASH_MAP)
PROPERTIES('data_lifetime' = '600');

-- Query using the dictionary
SELECT dict_get("test_refresh_dict.city_code_dict", "region_code", "Beijing");
```

```text
+------------------------------------------------------------------------+
| dict_get('test_refresh_dict.city_code_dict', 'region_code', 'Beijing') |
+------------------------------------------------------------------------+
| BJ                                                                     |
+------------------------------------------------------------------------+
```

### Пример 2: IP_TRIE, поиск по IP-адресу на основе CIDR {#example-2-ip_trie-cidr-based-ip-lookup}

```sql
-- Create the source data table
CREATE TABLE ip_locations (
    ip_range VARCHAR(30) NOT NULL,
    country VARCHAR(64) NOT NULL,
    region VARCHAR(64) NOT NULL,
    city VARCHAR(64) NOT NULL
) ENGINE=OLAP
DISTRIBUTED BY HASH(ip_range) BUCKETS 1;

-- Insert some sample data
INSERT INTO ip_locations VALUES
('1.0.0.0/24', 'United States', 'California', 'Los Angeles'),
('1.0.1.0/24', 'China', 'Beijing', 'Beijing'),
('1.0.4.0/24', 'Japan', 'Tokyo', 'Tokyo');

-- Create the IP address dictionary
CREATE DICTIONARY ip_location_dict USING ip_locations
(
    ip_range KEY,
    country VALUE,
    region VALUE,
    city VALUE
)
LAYOUT(IP_TRIE)
PROPERTIES('data_lifetime' = '600');

-- Query the location information for an IP address, matched by CIDR.
SELECT
    dict_get("test_refresh_dict.ip_location_dict", "country", cast('1.0.0.1' as ipv4)) AS country,
    dict_get("test_refresh_dict.ip_location_dict", "region", cast('1.0.0.2' as ipv4)) AS region,
    dict_get("test_refresh_dict.ip_location_dict", "city", cast('1.0.0.3' as ipv4)) AS city;
```

```text
+---------------+------------+-------------+
| country       | region     | city        |
+---------------+------------+-------------+
| United States | California | Los Angeles |
+---------------+------------+-------------+
```

### Пример 3: HASH_MAP, несколько ключей и несколько значений {#example-3-hash_map-multiple-keys-and-multiple-values}

```sql
-- Product SKU dimension table: contains the basic attributes of products
CREATE TABLE product_sku_info (
    product_id INT NOT NULL COMMENT "Product ID",
    color_code VARCHAR(32) NOT NULL COMMENT "Color code",
    size_code VARCHAR(32) NOT NULL COMMENT "Size code",
    product_name VARCHAR(128) NOT NULL COMMENT "Product name",
    color_name VARCHAR(32) NOT NULL COMMENT "Color name",
    size_name VARCHAR(32) NOT NULL COMMENT "Size name",
    stock INT NOT NULL COMMENT "Stock",
    price DECIMAL(10,2) NOT NULL COMMENT "Price",
    update_time DATETIME NOT NULL COMMENT "Update time"
)
DISTRIBUTED BY HASH(`product_id`) BUCKETS 10;

-- Order detail table: records actual sales data
CREATE TABLE order_details (
    order_id BIGINT NOT NULL COMMENT "Order ID",
    product_id INT NOT NULL COMMENT "Product ID",
    color_code VARCHAR(32) NOT NULL COMMENT "Color code",
    size_code VARCHAR(32) NOT NULL COMMENT "Size code",
    quantity INT NOT NULL COMMENT "Purchase quantity",
    order_time DATETIME NOT NULL COMMENT "Order time"
)
DISTRIBUTED BY HASH(`order_id`) BUCKETS 10;

-- Insert product SKU data
INSERT INTO product_sku_info VALUES
(1001, 'BLK', 'M', 'Nike Sports T-Shirt', 'Black', 'Size M', 100, 199.00, '2024-02-23 10:00:00'),
(1001, 'BLK', 'L', 'Nike Sports T-Shirt', 'Black', 'Size L', 80, 199.00, '2024-02-23 10:00:00'),
(1001, 'WHT', 'M', 'Nike Sports T-Shirt', 'White', 'Size M', 90, 199.00, '2024-02-23 10:00:00'),
(1001, 'WHT', 'L', 'Nike Sports T-Shirt', 'White', 'Size L', 70, 199.00, '2024-02-23 10:00:00'),
(1002, 'RED', 'S', 'Adidas Sports Pants', 'Red', 'Size S', 50, 299.00, '2024-02-23 10:00:00'),
(1002, 'RED', 'M', 'Adidas Sports Pants', 'Red', 'Size M', 60, 299.00, '2024-02-23 10:00:00'),
(1002, 'BLU', 'S', 'Adidas Sports Pants', 'Blue', 'Size S', 55, 299.00, '2024-02-23 10:00:00'),
(1002, 'BLU', 'M', 'Adidas Sports Pants', 'Blue', 'Size M', 65, 299.00, '2024-02-23 10:00:00');

-- Insert order data
INSERT INTO order_details VALUES
(10001, 1001, 'BLK', 'M', 2, '2024-02-23 12:01:00'),
(10002, 1001, 'WHT', 'L', 1, '2024-02-23 12:05:00'),
(10003, 1002, 'RED', 'S', 1, '2024-02-23 12:10:00'),
(10004, 1001, 'BLK', 'L', 3, '2024-02-23 12:15:00'),
(10005, 1002, 'BLU', 'M', 2, '2024-02-23 12:20:00');

-- Create a multi-key, multi-value dictionary
CREATE DICTIONARY sku_dict USING product_sku_info
(
    product_id KEY,
    color_code KEY,
    size_code KEY,
    product_name VALUE,
    color_name VALUE,
    size_name VALUE,
    price VALUE,
    stock VALUE
)
LAYOUT(HASH_MAP)
PROPERTIES('data_lifetime'='300');

-- Example of a query using dict_get_many: get order details and SKU information
WITH order_sku_info AS (
    SELECT 
        o.order_id,
        o.quantity,
        o.order_time,
        dict_get_many("test.sku_dict", 
            ["product_name", "color_name", "size_name", "price", "stock"],
            struct(o.product_id, o.color_code, o.size_code)
        ) as sku_info
    FROM order_details o
    WHERE o.order_time >= '2024-02-23 12:00:00'
        AND o.order_time < '2024-02-23 13:00:00'
)
SELECT 
    order_id,
    order_time,
    struct_element(sku_info, 'product_name') as product_name,
    struct_element(sku_info, 'color_name') as color_name,
    struct_element(sku_info, 'size_name') as size_name,
    quantity,
    struct_element(sku_info, 'price') as unit_price,
    quantity * struct_element(sku_info, 'price') as total_amount,
    struct_element(sku_info, 'stock') as current_stock
FROM order_sku_info
ORDER BY order_time;
```

```text
+----------+---------------------+---------------------+------------+-----------+----------+------------+--------------+---------------+
| order_id | order_time          | product_name        | color_name | size_name | quantity | unit_price | total_amount | current_stock |
+----------+---------------------+---------------------+------------+-----------+----------+------------+--------------+---------------+
|    10001 | 2024-02-23 12:01:00 | Nike Sports T-Shirt | Black      | Size M    |        2 |     199.00 |       398.00 |           100 |
|    10002 | 2024-02-23 12:05:00 | Nike Sports T-Shirt | White      | Size L    |        1 |     199.00 |       199.00 |            70 |
|    10003 | 2024-02-23 12:10:00 | Adidas Sports Pants | Red        | Size S    |        1 |     299.00 |       299.00 |            50 |
|    10004 | 2024-02-23 12:15:00 | Nike Sports T-Shirt | Black      | Size L    |        3 |     199.00 |       597.00 |            80 |
|    10005 | 2024-02-23 12:20:00 | Adidas Sports Pants | Blue       | Size M    |        2 |     299.00 |       598.00 |            65 |
+----------+---------------------+---------------------+------------+-----------+----------+------------+--------------+---------------+
```

## Устранение неполадок {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Troubleshooting -->

| Признак ошибки | Решение |
| --- | --- |
| Запрос сообщает `can not find dict name` | Сначала выполните `SHOW DICTIONARIES`, чтобы проверить, существует ли словарь. Если он существует, повторно обновите его данные |
| Запрос сообщает `dict_get() only support IP type for IP_TRIE` | Проверьте, строго ли значения в столбце ключа словаря IP_TRIE соответствуют формату CIDR |
| Загрузка сообщает `Version ID is not greater than the existing version ID for the dictionary.` | Используйте команду `DROP DICTIONARY`, чтобы удалить соответствующий словарь, затем создайте его заново и повторно загрузите данные |
| `SHOW DICTIONARIES` показывает, что версия словаря на определённом BE выше версии на FE | Используйте команду `DROP DICTIONARY`, чтобы удалить соответствующий словарь, затем создайте его заново и повторно загрузите данные |
| Загрузка сообщает `Dictionary X commit version Y failed` | Повторно загрузите словарь |

**Запасной способ решения**: для подавляющего большинства ошибок, если обычные операции не помогают, проблему можно устранить, удалив словарь и создав его заново.

## Часто задаваемые вопросы {#faq}

**Вопрос 1: Чем словарь отличается от обычного материализованного представления?**

Словарь представляет собой структуру KV, полностью размещённую в памяти и предназначенную для ускорения поиска по ключу и замены исходной операции JOIN вызовом функции `dict_get`. Материализованное представление предназначено для более общих сценариев предварительных вычислений.

**Вопрос 2: Обеспечивается ли строгая согласованность данных словаря с базовой таблицей?**

Нет. Doris не обеспечивает строгую согласованность данных между словарём и его базовой таблицей. Данные необходимо синхронизировать с помощью автоматических обновлений через `data_lifetime` или ручного выполнения `REFRESH DICTIONARY`.

**Вопрос 3: Когда следует выбирать IP_TRIE вместо HASH_MAP?**

Используйте IP_TRIE, если требуется выполнять запросы для сопоставления IP-адресов с диапазонами на основе CIDR. Для всех остальных сценариев поиска по ключу используйте HASH_MAP.

**Вопрос 4: Что делать, если словарь потребляет слишком много памяти?**

Свойство `memory_limit` позволяет задать верхний предел потребления памяти на одном BE. Также рекомендуется выбирать в качестве источника для словаря столбцы с умеренной кардинальностью, чтобы словарь не становился слишком большим.

**Вопрос 5: Почему запрос к словарю может возвращать null?**

Если запрашиваемый ключ отсутствует в словаре или данные запрашиваемого ключа равны null, возвращается null.
