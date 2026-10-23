---
{
    "title": "SHA2",
    "language": "ru",
    "description": "Данные хешируются с помощью SHA2."
}
---

## Описание {#description}

Данные хешируются с помощью SHA2.

## Синтаксис {#syntax}

```sql
SHA2( <input>, <digest_length>)
```

## Параметры {#parameters}

| Параметр         | Описание                |
|-------------------|----------------------------|
| `<input>`           | Данные для хеширования; поддерживаются строковые и двоичные типы      |
| `<digest_length>` | Длина хеша; поддерживаются 224, 256, 384, 512. Значение должно быть константой |

## Возвращаемое значение {#return-value}

Возвращает значение sha2 для входной строки

## Примеры {#examples}

```sql
select sha2('abc', 224), sha2('abc', 384), sha2(NULL, 512);
```

```text
+----------------------------------------------------------+--------------------------------------------------------------------------------------------------+-----------------+
| sha2('abc', 224)                                         | sha2('abc', 384)                                                                                 | sha2(NULL, 512) |
+----------------------------------------------------------+--------------------------------------------------------------------------------------------------+-----------------+
| 23097d223405d8228642a477bda255b32aadbce4bda0b3f7e36c9da7 | cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7 | NULL            |
+----------------------------------------------------------+--------------------------------------------------------------------------------------------------+-----------------+
```

```SQL
select sha2('abc', 225);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = sha2 functions only support digest length of [224, 256, 384, 512]
```

Второй аргумент (`<digest_length>`) должен быть литералом; передача ссылки на столбец приводит к ошибке, даже если его значение допустимо:

```sql
-- setup
CREATE TABLE str (k0 VARCHAR(64), k1 INT)
DISTRIBUTED BY HASH(k0) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO str VALUES ('hello', 224), ('world', 256);
```

```SQL
select sha2('str', k1) from str;
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = the second parameter of sha2 must be a literal but got: k1
```

```SQL
select sha2(k0, k1) from str;
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = the second parameter of sha2 must be a literal but got: k1
```

Для выполнения следующих двух иллюстративных примеров требуется внешний Catalog MySQL с именем `mysql_catalog`, содержащий таблицу `binary_test.binary_test`. В большинстве кластеров такой Catalog не настроен. Примеры показывают, что `SHA2` вычисляет одинаковый хеш для столбца `VARBINARY` и столбца `VARCHAR`, если исходные байты совпадают.

```sql
-- vb (VarBinary) and vc (VarChar) used the same string during insertion.
SELECT * FROM mysql_catalog.binary_test.binary_test;
```
```text
+------+------------+------+
| id   | vb         | vc   |
+------+------------+------+
|    1 | 0x616263   | abc  |
|    2 | 0x78797A   | xyz  |
|    3 | NULL       | NULL |
+------+------------+------+
```

```sql
SELECT SHA2(vb, 224), SHA2(vc, 224) FROM mysql_catalog.binary_test.binary_test;
```
```text
+----------------------------------------------------------+----------------------------------------------------------+
| SHA2(vb, 224)                                            | SHA2(vc, 224)                                            |
+----------------------------------------------------------+----------------------------------------------------------+
| 23097d223405d8228642a477bda255b32aadbce4bda0b3f7e36c9da7 | 23097d223405d8228642a477bda255b32aadbce4bda0b3f7e36c9da7 |
| 30e90f1cd0ceff8eb3dd6a540a605c0666f841d35de63c57e4dd2877 | 30e90f1cd0ceff8eb3dd6a540a605c0666f841d35de63c57e4dd2877 |
| NULL                                                     | NULL                                                     |
+----------------------------------------------------------+----------------------------------------------------------+
```
