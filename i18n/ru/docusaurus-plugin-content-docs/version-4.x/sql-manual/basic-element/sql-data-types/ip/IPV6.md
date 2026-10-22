---
{
    "title": "IPV6",
    "language": "ru",
    "description": "Тип IPv6 хранится в формате UInt128, занимает 16 байт и используется для представления адресов IPv6. Диапазон значений: ['::',"
}
---

## IPV6 {#ipv6}

### Описание {#description}

Тип IPv6 хранится в формате UInt128, занимает 16 байт и используется для представления адресов IPv6.
Диапазон значений: ['::', 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff'].

`Inputs that exceed the value range or have invalid format will return NULL`

### Пример {#example}

Пример создания таблицы:

```
CREATE TABLE ipv6_test (
  `id` int,
  `ip_v6` ipv6
) ENGINE=OLAP
DISTRIBUTED BY HASH(`id`) BUCKETS 4
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
```

Пример вставки данных:

```
insert into ipv6_test values(1, '::');
insert into ipv6_test values(2, '2001:16a0:2:200a::2');
insert into ipv6_test values(3, 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff');
insert into ipv6_test values(4, 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffffg'); // invalid data
```

Пример выборки данных:

```
mysql> select * from ipv6_test order by id;
+------+-----------------------------------------+
| id   | ip_v6                                   |
+------+-----------------------------------------+
|    1 | ::                                      |
|    2 | 2001:16a0:2:200a::2                     |
|    3 | ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff |
|    4 | NULL                                    |
+------+-----------------------------------------+
```

## Рекомендации: хранение адресов IPv4/IPv6 в одном столбце IPV6 с инвертированным индексом {#best-practice-store-mixed-ipv4ipv6-in-a-single-ipv6-column-with-an-inverted-index}

Один столбец `IPV6` позволяет хранить адреса IPv4 и IPv6: записывайте IPv4 в формате IPv4-mapped IPv6 (`::ffff:x.y.z.w`), например `192.168.1.1` хранится как `::ffff:192.168.1.1`, а обычные адреса IPv6 (например, `2001:16a0:2:200a::2`) записывайте без изменений. Это позволяет хранить поле со смешанными IP-адресами в одном столбце. Инвертированный индекс для этого столбца ускоряет фильтрацию по IP, поддерживая проверки равенства (`=`), `IN` и функции CIDR, такие как `is_ip_address_in_range()`.

### Схема {#schema}

```sql
CREATE TABLE access_log (
  `id`            BIGINT NOT NULL,
  `request_time`  DATETIME NOT NULL,
  `client_ip`     IPV6 NULL COMMENT 'Stored uniformly as IPv6; IPv4 stored in ::ffff: form',
  INDEX idx_client_ip (`client_ip`) USING INVERTED
) ENGINE=OLAP
DUPLICATE KEY(`id`, `request_time`)
DISTRIBUTED BY HASH(`id`) BUCKETS 4
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
);
```

### Нормализация при загрузке {#normalizing-on-load}

Независимо от способа загрузки, главное использовать одно и то же выражение в сопоставлении столбцов для преобразования исходной строки IP в IPv6 (ниже `ip_str` обозначает исходное поле, а `client_ip` обозначает столбец таблицы типа `IPV6`):

```sql
client_ip = COALESCE(
    ipv4_to_ipv6(to_ipv4_or_null(ip_str)),
    to_ipv6_or_null(ip_str)
)
```

- Обычная строка IPv4 сначала разбирается как `IPV4` с помощью `to_ipv4_or_null()`, затем преобразуется в `::ffff:x.y.z.w` с помощью `ipv4_to_ipv6()`;
- Если строка не является корректным адресом IPv4, `COALESCE` использует `to_ipv6_or_null()` и разбирает её как текстовое представление обычного адреса IPv6;
- Если оба преобразования завершились неудачей, записывается `NULL`. Чтобы вместо этого отклонять некорректные данные, замените `_or_null` строгими функциями `to_ipv4` / `to_ipv6` и настройте обработку ошибок с помощью порога ошибок загрузки.

#### Routine Load {#routine-load}

```sql
CREATE ROUTINE LOAD example_db.access_log_job ON access_log
COLUMNS TERMINATED BY ",",
COLUMNS(
  id, request_time, ip_str,
  client_ip = COALESCE(
      ipv4_to_ipv6(to_ipv4_or_null(ip_str)),
      to_ipv6_or_null(ip_str)
  )
)
PROPERTIES ("desired_concurrent_number" = "3", "max_error_number" = "1000")
FROM KAFKA ("kafka_broker_list" = "broker:9092", "kafka_topic" = "ip_logs");
```

#### Stream Load {#stream-load}

Примените то же преобразование в заголовке `columns`:

```shell
curl --location-trusted -u user:passwd \
  -H "format: csv" \
  -H "column_separator: ," \
  -H "columns: id, request_time, ip_str, client_ip=COALESCE(ipv4_to_ipv6(to_ipv4_or_null(ip_str)), to_ipv6_or_null(ip_str))" \
  -T data.csv \
  "http://<fe_host>:8030/api/example_db/access_log/_stream_load"
```

#### INSERT INTO (миграция из старой таблицы VARCHAR) {#insert-into-migrating-from-an-old-varchar-table}

Преобразуйте исходную строку IP в IPv6 в выражении `SELECT` (`ip_str` обозначает столбец VARCHAR старой таблицы):

```sql
INSERT INTO access_log (id, request_time, client_ip)
SELECT
  id, request_time,
  COALESCE(
      ipv4_to_ipv6(to_ipv4_or_null(ip_str)),
      to_ipv6_or_null(ip_str)
  )
FROM access_log_varchar;
```

### Переписывание запросов (важно) {#rewriting-queries-important}

После того как все адреса сохранены в отображённом формате IPv6, **условия запросов с адресами IPv4 также необходимо переписать в отображённом формате IPv6**; иначе из-за несовпадения типа или семейства адресов индекс не используется:

- **IPv6 CIDR**: указывайте напрямую.

  ```sql
  is_ip_address_in_range(client_ip, '2001:4860:4801::/48')
  ```

- **IPv4 CIDR → CIDR отображённого IPv6-адреса**: добавьте к адресу префикс `::ffff:`, а к длине префикса прибавьте **+96** (первые 96 бит отображённого адреса образуют фиксированный префикс).

  | IPv4 CIDR          | CIDR отображённого IPv6-адреса |
  | ------------------ | --------------------------- |
  | `10.42.0.0/16`     | `::ffff:10.42.0.0/112`      |
  | `192.178.4.0/24`   | `::ffff:192.178.4.0/120`    |
  | `3.219.120.76/32`  | `::ffff:3.219.120.76/128`   |

  ```sql
  is_ip_address_in_range(client_ip, '::ffff:10.42.0.0/112')
  ```

- **Точное совпадение IPv4**: также сравнивайте с отображённым значением.

  ```sql
  client_ip = ipv4_to_ipv6(to_ipv4('3.219.120.76'))
  -- or
  client_ip = to_ipv6('::ffff:3.219.120.76')
  ```

- **Список разрешённых адресов (оставить только строки из диапазона)**: используйте `is_ip_address_in_range(...)` непосредственно как условие фильтрации.

  ```sql
  WHERE is_ip_address_in_range(client_ip, '::ffff:10.42.0.0/112')
  ```

- **Список блокируемых адресов (исключить строки из диапазона)**: используйте `NOT is_ip_address_in_range(...)` и избегайте формы `is_ip_address_in_range(...) = 0` (её сложнее передать на выполнение индексу).

  ```sql
  WHERE NOT is_ip_address_in_range(client_ip, '::ffff:10.42.0.0/112')
  ```

Полный пример: запрос статистики, исключающий несколько диапазонов. Поскольку он содержит условия по диапазонам CIDR, сначала уменьшите порог, чтобы обеспечить использование индекса:

```sql
SET inverted_index_skip_threshold = 0;

SELECT client_ip, COUNT(*) AS cnt
FROM access_log
WHERE request_time BETWEEN '2026-06-01 00:00:00' AND '2026-06-02 00:00:00'
  AND client_ip NOT IN (to_ipv6('::ffff:3.219.120.76'))               -- exact IPv4 exclusion -> mapped
  AND NOT is_ip_address_in_range(client_ip, '::ffff:10.42.0.0/112')   -- IPv4 /16 -> /112
  AND NOT is_ip_address_in_range(client_ip, '2001:4860:4801::/48')    -- IPv6 range
GROUP BY client_ip;
```

### Условия использования индекса {#conditions-for-hitting-the-index}

- Столбец должен иметь встроенный тип `IPV4` / `IPV6` и построенный для него инвертированный индекс `USING INVERTED`;
- Аргумент CIDR функции `is_ip_address_in_range()` должен быть **константной строкой**;
- Столбец `IPV6` обрабатывает только диапазоны CIDR для IPv6 (диапазоны IPv4 необходимо сначала преобразовать в отображённый формат `::ffff:`), а столбец `IPV4` обрабатывает только диапазоны CIDR для IPv4; при несовпадении типа и семейства CIDR индекс не используется, а фильтрация выполняется по выражению;
- Переменная сеанса `inverted_index_skip_threshold` по умолчанию равна `50`: если более 50% строк в сегменте соответствуют условию индекса, индекс не используется, и данные читаются напрямую (bypass).

:::caution Для запросов по диапазонам CIDR требуется меньшее значение `inverted_index_skip_threshold`
Для запроса по диапазону CIDR функция `is_ip_address_in_range()` внутри разбивается на два запроса BKD: `>= range start` и `<= range end`. **Каждой части по отдельности часто соответствуют более 50% строк** (даже если итоговое пересечение небольшое), что вызывает bypass и пропуск индекса. Поэтому для надёжного использования индекса в таких запросах нужно выполнить в сеансе `SET inverted_index_skip_threshold = 0;` (или задать меньшее значение). Проверки равенства и `IN` представляют собой высокоселективные точечные запросы, и эта проблема их не затрагивает.
:::

### Ключевые слова {#keywords}

IPV6
