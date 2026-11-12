---
{
    "title": "BOOLEAN",
    "language": "ru",
    "description": "BOOL, BOOLEAN Как и в TINYINT, 0 обозначает false, а 1 обозначает true."
}
---

## Описание {#description}

BOOLEAN (псевдоним: BOOL) — это тип данных в Doris, представляющий логические значения true и false.

Внутри BOOLEAN хранится как значение uint8, где 0 обозначает false, а 1 обозначает true.

В отличие от MySQL, где BOOLEAN является псевдонимом TINYINT(1), Doris рассматривает BOOLEAN как отдельный тип данных, аналогично PostgreSQL, Oracle и другим системам баз данных.

## Диапазон значений {#value-range}

BOOLEAN может принимать только следующие значения:
- `true` (при выводе отображается как 1)
- `false` (при выводе отображается как 0)

В памяти значения типа BOOLEAN могут быть только 0 или 1; другие значения невозможны.

## Литералы {#literal-values}

В Doris для записи логических литералов можно использовать ключевые слова `true` и `false` (без учёта регистра):

```sql
mysql> select TrUe, False, true;
+------+-------+------+
| TrUe | False | true |
+------+-------+------+
|    1 |     0 |    1 |
+------+-------+------+
```

## Поддерживаемые операции {#supported-operations}

### Логические операции {#logical-operations}

Тип BOOLEAN поддерживает логические операции, такие как AND, OR, NOT и XOR:

```sql
mysql> select true AND false, true OR false, NOT true, true XOR false;
+----------------+---------------+----------+----------------+
| true AND false | true OR false | NOT true | true XOR false |
+----------------+---------------+----------+----------------+
|              0 |             1 |        0 |              1 |
+----------------+---------------+----------+----------------+
```

### Арифметические операции {#arithmetic-operations}

Хотя BOOLEAN напрямую не поддерживает арифметические операции, выражения вида `true + true` работают благодаря неявному преобразованию типов:

```sql
mysql> select true + true;
+-------------+
| true + true |
+-------------+
|           2 |
+-------------+
```

Это работает, потому что логические значения неявно приводятся к SMALLINT: `CAST(TRUE AS smallint) + CAST(TRUE AS smallint)`.

## Преобразование типов {#type-conversion}

Следует учитывать, что в Doris BOOLEAN не эквивалентен TINYINT, хотя из-за соглашений MySQL они могут казаться похожими.

При вставке логического литерала в столбец TINYINT выполняется неявное преобразование типа:

```sql
CREATE TABLE test_boolean(
    u8 TINYINT
)
properties("replication_num" = "1");

mysql> insert into test_boolean values(true);
```

В этом примере логический литерал `true` преобразуется в значение типа TINYINT.

## Ключевые слова {#keywords}

BOOL, BOOLEAN
