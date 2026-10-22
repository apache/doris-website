---
{
    "title": "GROUPING",
    "language": "ru",
    "description": "Указывает, агрегировано ли заданное выражение столбца из списка GROUP BY. GROUPING возвращает 1, если столбец агрегирован (т. е.,"
}
---

## Описание {#description}

Указывает, агрегировано ли заданное выражение столбца из списка GROUP BY. GROUPING возвращает 1, если столбец агрегирован (то есть входит в итоговую строку, созданную операцией ROLLUP, CUBE или GROUPING SETS), и 0, если он не агрегирован. Эта функция позволяет отличать значения NULL, созданные этими операциями, от фактических значений NULL в данных.

## Синтаксис {#syntax}

```sql
GROUPING( <column_expression> )
```

## Параметры {#parameters}

| Параметр              | Описание                                                                     |
|-----------------------|------------------------------------------------------------------------------|
| `<column_expression>` | Столбец или выражение, присутствующее в предложении GROUP BY.                 |

## Возвращаемое значение {#return-value}

Возвращает значение типа BIGINT. Функция возвращает 1, если указанное выражение столбца агрегировано, и 0 в противном случае.

## Примеры {#examples}

В следующем примере данные группируются по столбцу `camp` и подсчитывается количество значений `occupation`. Функция GROUPING применяется к столбцу `camp`, чтобы отличить итоговую строку, добавленную операцией ROLLUP, от фактических значений NULL в данных.

```sql
CREATE TABLE `roles` (
  role_id       INT,
  occupation    VARCHAR(32),
  camp          VARCHAR(32),
  register_time DATE
)
UNIQUE KEY(role_id)
DISTRIBUTED BY HASH(role_id) BUCKETS 1
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
);

INSERT INTO `roles` VALUES
(0, 'who am I', NULL, NULL),
(1, 'mage', 'alliance', '2018-12-03 16:11:28'),
(2, 'paladin', 'alliance', '2018-11-30 16:11:28'),
(3, 'rogue', 'horde', '2018-12-01 16:11:28'),
(4, 'priest', 'alliance', '2018-12-02 16:11:28'),
(5, 'shaman', 'horde', NULL),
(6, 'warrior', 'alliance', NULL),
(7, 'warlock', 'horde', '2018-12-04 16:11:28'),
(8, 'hunter', 'horde', NULL);

SELECT 
  camp, 
  COUNT(occupation) AS occ_cnt,
  GROUPING(camp) AS grouping
FROM
  `roles`
GROUP BY
  ROLLUP(camp);
```

В результирующем наборе в столбце `camp` показаны два значения NULL. Первое значение NULL, для которого значение grouping равно 1, относится к итоговой строке, добавленной операцией ROLLUP и содержащей агрегированные данные по всем группам `camp`. Второе значение NULL, для которого значение grouping равно 0, представляет фактическое значение NULL из данных.

```text
+----------+---------+----------+
| camp     | occ_cnt | grouping |
+----------+---------+----------+
| NULL     |       9 |        1 |
| NULL     |       1 |        0 |
| alliance |       4 |        0 |
| horde    |       4 |        0 |
+----------+---------+----------+
```
