---
{
    "title": "INSERT OVERWRITE",
    "language": "ru",
    "description": "Этот оператор перезаписывает таблицу или отдельные партиции таблицы"
}
---

## Описание {#description}

Этот оператор перезаписывает таблицу или отдельные партиции таблицы.

```sql
INSERT OVERWRITE table table_name
    [ PARTITION (p1, ... | *) ]
    [ WITH LABEL label]
    [ (column [, ...]) ]
    [ [ hint [, ...] ] ]
    { VALUES ( { expression | DEFAULT } [, ...] ) [, ...] | query }
```

 Параметры

> table_name: целевая таблица для перезаписи. Эта таблица должна существовать. Имя можно указать в формате `db_name.table_name`.
>
> partitions: партиции таблицы, которые нужно перезаписать. Поддерживаются следующие два формата:
>
> > 1. Имена партиций. Это должны быть имена существующих партиций в `table_name`, разделённые запятыми.
> > 2. Звёздочка(*). Включает [автоматическое определение партиций](#overwrite-auto-detect-partition). Операция записи автоматически определяет, к каким партициям относятся данные, и перезаписывает эти партиции. Этот формат поддерживается начиная с версии Apache Doris 2.1.3.
>
> label: метка задачи Insert.
>
> column_name: указанный целевой столбец должен быть одним из существующих столбцов в `table_name`.
>
> expression: выражение, значение которого нужно присвоить соответствующему столбцу.
>
> DEFAULT: использовать для столбца значение по умолчанию.
>
> query: обычный запрос, результат которого перезапишет целевую таблицу или партиции.
>
> hint: подсказка, определяющая поведение при выполнении `INSERT`. Можно выбрать одно из следующих значений: `/*+ STREAMING */`, `/*+ SHUFFLE */` или `/*+ NOSHUFFLE */`.
>
> 1. STREAMING: в настоящее время не оказывает практического эффекта и сохранена только для совместимости с предыдущими версиями. (В предыдущей версии добавление этой подсказки приводило к возврату метки, а теперь метка возвращается по умолчанию.)
> 2. SHUFFLE: если целевая таблица партиционирована, включение этой подсказки приводит к повторному партиционированию данных.
> 3. NOSHUFFLE: даже если целевая таблица партиционирована, повторное партиционирование данных не выполняется, однако выполняются другие операции, обеспечивающие правильное распределение данных по партициям.

Обратите внимание:

1. В текущей версии переменная сеанса `enable_insert_strict` по умолчанию имеет значение `true`. Если при выполнении оператора `INSERT OVERWRITE` отфильтровываются данные, не соответствующие формату целевой таблицы, например при перезаписи партиции данные не удовлетворяют всем условиям партиционирования, операция перезаписи целевой таблицы завершится ошибкой.
2. Оператор `INSERT OVERWRITE` сначала создаёт новую таблицу, вставляет в неё данные для перезаписи, а затем атомарно заменяет старую таблицу новой и изменяет её имя. Поэтому во время перезаписи таблицы данные в старой таблице остаются доступны в обычном режиме вплоть до завершения перезаписи.

### Для таблиц с автоматическим партиционированием {#for-auto-partition-table}

Если целевая таблица INSERT OVERWRITE использует автоматическое партиционирование, поведение определяется [переменной сеанса](../../session/variable/SET-VARIABLE.md) `enable_auto_create_when_overwrite` следующим образом:

1. Если PARTITION не указан (перезаписывается вся таблица), то при значении `enable_auto_create_when_overwrite`, равном `true`, таблица перезаписывается, а для данных без соответствующей партиции создаются партиции по правилам автоматического партиционирования таблицы, и эти данные принимаются. Если `enable_auto_create_when_overwrite` имеет значение `false`, строки, для которых не найдена партиция, учитываются как ошибочные, пока операция не завершится ошибкой.
2. Если указана PARTITION для перезаписи, таблица AUTO PARTITION в ходе этой операции ведёт себя как обычная партиционированная таблица: данные, не удовлетворяющие условиям существующей партиции, отфильтровываются, а новые партиции не создаются.
3. Если PARTITION указан как `partition(*)` (автоматическое определение партиций и перезапись), то при значении `enable_auto_create_when_overwrite`, равном `true`, перезаписываются партиции, соответствующие записываемым данным, а остальные существующие партиции остаются без изменений. Одновременно для данных без соответствующих партиций создаются партиции по правилам автоматического партиционирования таблицы, и эти данные размещаются в них. Если `enable_auto_create_when_overwrite` имеет значение `false`, строки, для которых не найдена партиция, учитываются как ошибочные, пока операция не завершится ошибкой.

В версиях без `enable_auto_create_when_overwrite` поведение соответствует значению переменной `false`.

Сводка поведения приведена ниже:

1. Для таблиц с автоматическим партиционированием, у которых включена переменная `enable_auto_create_when_overwrite`:

|    | Перезаписываемые партиции | Очистка остальных партиций | Автосоздание партиций для данных без соответствующей партиции |
|-|-|-|-|
| Без указания партиций (вся таблица) | Все | √ | √ |
| Указанная партиция | Явно указанная партиция | × | × |
| `partition(*)` | Партиция, к которой относятся данные | × | √ |

2. Для обычных таблиц и таблиц с автоматическим партиционированием, у которых отключена переменная `enable_auto_create_when_overwrite`:

|    | Перезаписываемые партиции | Очистка остальных партиций | Автосоздание партиций для данных без соответствующей партиции |
|-|-|-|-|
| Без указания партиций (вся таблица) | Все | √ | × |
| Указанная партиция | Явно указанная партиция | × | × |
| `partition(*)` | Партиция, к которой относятся данные | × | × |

Ниже приведены примеры:

```sql
mysql> create table auto_list(
    ->              k0 varchar null
    ->          )
    ->          auto partition by list (k0)
    ->          (
    ->              PARTITION p1 values in (("Beijing"), ("BEIJING")),
    ->              PARTITION p2 values in (("Shanghai"), ("SHANGHAI")),
    ->              PARTITION p3 values in (("xxx"), ("XXX")),
    ->              PARTITION p4 values in (("list"), ("LIST")),
    ->              PARTITION p5 values in (("1234567"), ("7654321"))
    ->          )
    ->          DISTRIBUTED BY HASH(`k0`) BUCKETS 1
    ->          properties("replication_num" = "1");
Query OK, 0 rows affected (0.14 sec)

mysql> insert into auto_list values ("Beijing"),("Shanghai"),("xxx"),("list"),("1234567");
Query OK, 5 rows affected (0.22 sec)

mysql> insert overwrite table auto_list partition(*) values ("BEIJING"), ("new1");
Query OK, 2 rows affected (0.28 sec)

mysql> select * from auto_list;
+----------+ --- p1 is overwritten, new1 gets the new partition, and the other partitions remain unchanged.
| k0       |
+----------+
| 1234567  |
| BEIJING  |
| list     |
| xxx      |
| new1     |
| Shanghai |
+----------+
6 rows in set (0.48 sec)

mysql> insert overwrite table auto_list values ("SHANGHAI"), ("new2");
Query OK, 2 rows affected (0.17 sec)

mysql> select * from auto_list;
+----------+ --- The whole table is overwritten, and new2 gets the new partition.
| k0       |
+----------+
| new2     |
| SHANGHAI |
+----------+
2 rows in set (0.15 sec)
```

## Пример {#example}

Предположим, существует таблица с именем `test`. Она содержит два столбца, `c1` и `c2`, и две партиции, `p1` и `p2`.

```sql
CREATE TABLE IF NOT EXISTS test (
  `c1` int NOT NULL DEFAULT "1",
  `c2` int NOT NULL DEFAULT "4"
) ENGINE=OLAP
UNIQUE KEY(`c1`)
PARTITION BY LIST (`c1`)
(
PARTITION p1 VALUES IN ("1","2","3"),
PARTITION p2 VALUES IN ("4","5","6")
)
DISTRIBUTED BY HASH(`c1`) BUCKETS 3
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1",
  "in_memory" = "false",
  "storage_format" = "V2"
);
```

Вторая таблица, `test2`, используется в приведённых ниже примерах перезаписи на основе запроса. Она имеет ту же структуру `(c1, c2)`, поэтому оператор `INSERT OVERWRITE test SELECT * FROM test2` выполняется успешно:

```sql
CREATE TABLE IF NOT EXISTS test2 (
  `c1` int NOT NULL,
  `c2` int NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(`c1`)
DISTRIBUTED BY HASH(`c1`) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO test2 VALUES (1, 10), (2, 20);
```

### Перезапись таблицы {#overwrite-table}

1. Перезапись таблицы `test` с помощью `VALUES`.

   ```sql
   // Single-row overwrite.
   INSERT OVERWRITE table test VALUES (1, 2);
   INSERT OVERWRITE table test (c1, c2) VALUES (1, 2);
   INSERT OVERWRITE table test (c1, c2) VALUES (1, DEFAULT);
   INSERT OVERWRITE table test (c1) VALUES (1);
   // Multi-row overwrite.
   INSERT OVERWRITE table test VALUES (1, 2), (3, 2 + 2);
   INSERT OVERWRITE table test (c1, c2) VALUES (1, 2), (3, 2 * 2);
   INSERT OVERWRITE table test (c1, c2) VALUES (1, DEFAULT), (3, DEFAULT);
   INSERT OVERWRITE table test (c1) VALUES (1), (3);
   ```

- Первый и второй операторы дают одинаковый результат. Если при перезаписи целевые столбцы не указаны, по умолчанию используется порядок столбцов в таблице. После успешной перезаписи в таблице `test` остаётся только одна строка данных.
- Третий и четвёртый операторы дают одинаковый результат. Для неуказанного столбца `c2` используется значение по умолчанию 4. После успешной перезаписи в таблице `test` остаётся только одна строка данных.
- Пятый и шестой операторы дают одинаковый результат. В операторе можно использовать выражения, например `2+2`, `2*2`. Результат выражения вычисляется при выполнении оператора, а затем записывается в таблицу `test` при перезаписи. После успешной перезаписи в таблице `test` остаются две строки данных.
- Седьмой и восьмой операторы дают одинаковый результат. Для неуказанного столбца `c2` используется значение по умолчанию 4. После успешной перезаписи в таблице `test` остаются две строки данных.

2. Перезапись таблицы `test` с помощью запроса. Форматы данных таблиц `test2` и `test` должны совпадать. Если они не совпадают, выполняется неявное преобразование типов данных.

   ```sql
   INSERT OVERWRITE table test SELECT * FROM test2;
   INSERT OVERWRITE table test (c1, c2) SELECT * from test2;
   ```

- Первый и второй операторы дают одинаковый результат. Они получают данные из таблицы `test2` и перезаписывают ими таблицу `test`. После успешной перезаписи данные в таблице `test` будут совпадать с данными в таблице `test2`.

3. Перезапись таблицы `test` с указанием метки.

   ```sql
   INSERT OVERWRITE table test WITH LABEL `label1` SELECT * FROM test2;
   INSERT OVERWRITE table test WITH LABEL `label2` (c1, c2) SELECT * from test2;
   ```

- Команда `SHOW LOAD;` позволяет проверить состояние задания загрузки с указанной меткой `label`. Обратите внимание, что метка должна быть уникальной.

### Перезапись партиций таблицы {#overwrite-table-partition}

При использовании INSERT OVERWRITE для перезаписи партиций следующие три шага объединяются в одну транзакцию. Если в процессе выполнения произойдёт ошибка, уже выполненные операции будут отменены:

1. Предположим, для перезаписи указана партиция `p1`. Сначала создаётся пустая временная партиция `pTMP` с той же структурой, что и у целевой партиции для перезаписи.
2. Данные записываются в `pTMP`.
3. Партиция `p1` атомарно заменяется партицией `pTMP`.

Ниже приведены примеры:

1. Перезапись партиций `P1` и `P2` таблицы `test` с помощью `VALUES`.

   ```sql
   // Single-row overwrite.
   INSERT OVERWRITE table test PARTITION(p1,p2) VALUES (1, 2);
   INSERT OVERWRITE table test PARTITION(p1,p2) (c1, c2) VALUES (1, 2);
   INSERT OVERWRITE table test PARTITION(p1,p2) (c1, c2) VALUES (1, DEFAULT);
   INSERT OVERWRITE table test PARTITION(p1,p2) (c1) VALUES (1);
   // Multi-row overwrite.
   INSERT OVERWRITE table test PARTITION(p1,p2) VALUES (1, 2), (4, 2 + 2);
   INSERT OVERWRITE table test PARTITION(p1,p2) (c1, c2) VALUES (1, 2), (4, 2 * 2);
   INSERT OVERWRITE table test PARTITION(p1,p2) (c1, c2) VALUES (1, DEFAULT), (4, DEFAULT);
   INSERT OVERWRITE table test PARTITION(p1,p2) (c1) VALUES (1), (4);
   ```

   В отличие от перезаписи всей таблицы, приведённые выше операторы перезаписывают отдельные партиции. Можно перезаписать одну партицию или несколько партиций одновременно. Успешно записываются только данные, удовлетворяющие условию фильтрации соответствующей партиции. Если среди записываемых данных есть строки, не соответствующие ни одной из указанных партиций, перезапись завершится ошибкой. Ниже приведён пример такой ошибки.

   ```sql
   INSERT OVERWRITE table test PARTITION(p1,p2) VALUES (7, 2);
   ```

   Данные, записываемые приведённым выше оператором (`c1=7`), не удовлетворяют условиям партиций `P1` и `P2`, поэтому перезапись завершится ошибкой.

2. Перезапись партиций `P1` и `P2` таблицы `test` с помощью запроса. Форматы данных таблиц `test2` и `test` должны совпадать. Если они не совпадают, выполняется неявное преобразование типов данных.

   ```sql
   INSERT OVERWRITE table test PARTITION(p1,p2) SELECT * FROM test2;
   INSERT OVERWRITE table test PARTITION(p1,p2) (c1, c2) SELECT * from test2;
   ```

3. Перезапись партиций `P1` и `P2` таблицы `test` с указанием метки.

   ```sql
   INSERT OVERWRITE table test PARTITION(p1,p2) WITH LABEL `label3` SELECT * FROM test2;
   INSERT OVERWRITE table test PARTITION(p1,p2) WITH LABEL `label4` (c1, c2) SELECT * from test2;
   ```

### Перезапись с автоматическим определением партиций {#overwrite-auto-detect-partition}

> Эта возможность доступна начиная с версии 2.1.3.

Если в команде INSERT OVERWRITE предложение PARTITION указано как `PARTITION(*)`, при перезаписи автоматически определяются партиции, к которым относятся данные. Пример:

```sql
mysql> create table test(
    -> k0 int null
    -> )
    -> partition by range (k0)
    -> (
    -> PARTITION p10 values less than (10),
    -> PARTITION p100 values less than (100),
    -> PARTITION pMAX values less than (maxvalue)
    -> )
    -> DISTRIBUTED BY HASH(`k0`) BUCKETS 1
    -> properties("replication_num" = "1");
Query OK, 0 rows affected (0.11 sec)

mysql> insert into test values (1), (2), (15), (100), (200);
Query OK, 5 rows affected (0.29 sec)

mysql> select * from test order by k0;
+------+
| k0   |
+------+
|    1 |
|    2 |
|   15 |
|  100 |
|  200 |
+------+
5 rows in set (0.23 sec)

mysql> insert overwrite table test partition(*) values (3), (1234);
Query OK, 2 rows affected (0.24 sec)

mysql> select * from test order by k0;
+------+
| k0   |
+------+
|    3 |
|   15 |
| 1234 |
+------+
3 rows in set (0.20 sec)
```

Как видно из примера, все данные в партициях `p10` и `pMAX`, к которым относятся значения 3 и 1234, перезаписываются, а партиция `p100` остаётся без изменений. Эту операцию можно рассматривать как синтаксический сахар для явного указания перезаписываемых партиций в предложении PARTITION при выполнении INSERT OVERWRITE. Она реализована так же, как [перезапись явно указанных партиций](#overwrite-table-partition). Синтаксис `PARTITION(*)` избавляет от необходимости вручную перечислять все имена партиций при перезаписи большого их количества.

## Ключевые слова {#keywords}

INSERT OVERWRITE, OVERWRITE, AUTO DETECT
