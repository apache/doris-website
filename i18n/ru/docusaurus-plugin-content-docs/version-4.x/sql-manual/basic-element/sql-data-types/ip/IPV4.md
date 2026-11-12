---
{
    "title": "IPV4",
    "language": "ru",
    "description": "Тип IPv4 хранится в формате UInt32, занимает 4 байта и используется для представления адресов IPv4. Диапазон значений: ['0.0.0.0', '255.255.255.255']."
}
---

## IPV4 {#ipv4}

### Описание {#description}

Тип IPv4 хранится в формате UInt32, занимает 4 байта и используется для представления адресов IPv4.
Диапазон значений: ['0.0.0.0', '255.255.255.255'].

`Inputs that exceed the value range or have invalid format will return NULL`

### Примеры {#example}

Пример создания таблицы:

```
CREATE TABLE ipv4_test (
  `id` int,
  `ip_v4` ipv4
) ENGINE=OLAP
DISTRIBUTED BY HASH(`id`) BUCKETS 4
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
```

Пример вставки данных:

```
insert into ipv4_test values(1, '0.0.0.0');
insert into ipv4_test values(2, '127.0.0.1');
insert into ipv4_test values(3, '59.50.185.152');
insert into ipv4_test values(4, '255.255.255.255');
insert into ipv4_test values(5, '255.255.255.256'); // invalid data
```

Пример выборки данных:

```
mysql> select * from ipv4_test order by id;
+------+-----------------+
| id   | ip_v4           |
+------+-----------------+
|    1 | 0.0.0.0         |
|    2 | 127.0.0.1       |
|    3 | 59.50.185.152   |
|    4 | 255.255.255.255 |
|    5 | NULL            |
+------+-----------------+
```

### Ключевые слова {#keywords}

IPV4
