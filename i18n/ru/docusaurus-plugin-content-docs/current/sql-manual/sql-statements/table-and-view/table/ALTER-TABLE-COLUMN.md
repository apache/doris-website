---
{
    "title": "ALTER TABLE COLUMN",
    "language": "ru",
    "description": "Эта инструкция используется для изменения схемы существующей таблицы. Изменение схемы выполняется асинхронно,"
}
---

## Описание {#description}

Эта инструкция используется для изменения схемы существующей таблицы. Изменение схемы выполняется асинхронно, и управление возвращается после успешной отправки задачи. После этого можно отслеживать ход выполнения с помощью команды [SHOW ALTER TABLE COLUMN](../../../../sql-manual/sql-statements/table-and-view/table/SHOW-ALTER-TABLE).

В Doris после создания таблицы используется понятие материализованного индекса. Успешно созданная таблица является базовой таблицей, а ее материализованный индекс является базовым индексом. На основе базовой таблицы можно создавать индексы rollup. Как базовый индекс, так и индекс rollup являются материализованными индексами. Если при изменении схемы не указан rollup_index_name, операция по умолчанию выполняется над базовой таблицей.

:::tip
Doris 1.2.0 поддерживает light schema change для небольших изменений структуры, благодаря чему операции добавления и удаления столбцов значений могут выполняться быстрее и синхронно. При создании таблицы можно вручную указать "light_schema_change" = 'true'. В версиях 2.0.0 и более поздних этот параметр включен по умолчанию.
:::

### Синтаксис: {#grammar}

```sql
ALTER TABLE [database.]table alter_clause;
```

В alter_clause для изменения схемы поддерживаются следующие операции:

**1. Добавление столбца в указанную позицию указанного индекса**

**Синтаксис**

```sql
ALTER TABLE [database.]table table_name ADD COLUMN column_name column_type [KEY | agg_type] [DEFAULT "default_value"]
[AFTER column_name|FIRST]
[TO rollup_index_name]
[PROPERTIES ("key"="value", ...)]
```

**Пример**

1. Добавление ключевого столбца new_col в таблицу example_db.my_table после key_1 (модель без агрегации)
  
  ```sql
  ALTER TABLE example_db.my_table
  ADD COLUMN new_col INT KEY DEFAULT "0" AFTER key_1;
  ```

2. Добавление столбца значений new_col в таблицу example_db.my_table после value_1 (модель без агрегации)
  
  ```sql
  ALTER TABLE example_db.my_table
  ADD COLUMN new_col INT DEFAULT "0" AFTER value_1;
  ```

3. Добавление ключевого столбца new_col (модель с агрегацией) в таблицу example_db.my_table после key_1

  ```sql
  ALTER TABLE example_db.my_table
  ADD COLUMN new_col INT KEY DEFAULT "0" AFTER key_1;
  ```

4. Добавление столбца значений new_col с типом агрегации SUM в таблицу example_db.my_table после value_1 (модель с агрегацией)

  ```sql
  ALTER TABLE example_db.my_table   
  ADD COLUMN new_col INT SUM DEFAULT "0" AFTER value_1; 
  ```

5. Добавление new_col на первую позицию в таблице example_db.my_table (модель без агрегации)

  ```sql
  ALTER TABLE example_db.my_table
  ADD COLUMN new_col INT KEY DEFAULT "0" FIRST;
  ```

:::tip
- При добавлении столбца значений в модель с агрегацией необходимо указать agg_type
- Для моделей без агрегации (например, DUPLICATE KEY) при добавлении ключевого столбца необходимо указать ключевое слово KEY
- В индекс rollup нельзя добавлять столбцы, которые уже существуют в базовом индексе (при необходимости можно создать индекс rollup заново)
:::


**2. Добавление нескольких столбцов в указанный индекс**

**Синтаксис**

```sql
ALTER TABLE [database.]table table_name ADD COLUMN (column_name1 column_type [KEY | agg_type] DEFAULT "default_value", ...)
[TO rollup_index_name]
[PROPERTIES ("key"="value", ...)]
```


**Пример**

1. Добавление нескольких столбцов в таблицу example_db.my_table, где new_col и new_col2 имеют тип агрегации SUM (модель с агрегацией)
  
  ```sql
  ALTER TABLE example_db.my_table
  ADD COLUMN (new_col1 INT SUM DEFAULT "0" ,new_col2 INT SUM DEFAULT "0");
  ```

2. Добавление нескольких столбцов в таблицу example_db.my_table (модель без агрегации), где new_col1 является столбцом KEY, а new_col2 является столбцом значений
  
  ```sql
  ALTER TABLE example_db.my_table
  ADD COLUMN (new_col1 INT key DEFAULT "0" , new_col2 INT DEFAULT "0");
  ```

:::tip
  - При добавлении столбца значений в модель с агрегацией необходимо указать agg_type
  - При добавлении ключевого столбца в модель с агрегацией необходимо указать ключевое слово KEY
  - В индекс rollup нельзя добавлять столбцы, которые уже существуют в базовом индексе (при необходимости можно создать индекс rollup заново) 
:::

**3. Удаление столбца из указанного индекса**

**Синтаксис***

  ```sql
  ALTER TABLE [database.]table table_name DROP COLUMN column_name
  [FROM rollup_index_name]
  ```

**Пример**

1. Удаление столбца col1 из таблицы example_db.my_table
  
  ```sql
  ALTER TABLE example_db.my_table DROP COLUMN col1;
  ```

:::tip
  - Нельзя удалить столбец партиционирования
  - Модель с агрегацией не позволяет удалять столбцы KEY
  - При удалении столбца из базового индекса он также удаляется из индекса rollup, если присутствует в нем 
:::

**4. Изменение типа и позиции столбца в указанном индексе**

**Синтаксис**

```sql
ALTER TABLE [database.]table table_name MODIFY COLUMN column_name column_type [KEY | agg_type] [NULL | NOT NULL] [DEFAULT "default_value"]
[AFTER column_name|FIRST]
[FROM rollup_index_name]
[PROPERTIES ("key"="value", ...)]
```

**Пример**

1. Изменение типа ключевого столбца col1 базового индекса на BIGINT и перемещение его после столбца col2

  ```sql
  ALTER TABLE example_db.my_table 
  MODIFY COLUMN col1 BIGINT KEY DEFAULT "1" AFTER col2;
  ```

  :::tip
  При изменении как ключевого столбца, так и столбца значений необходимо указывать полное определение столбца
  :::

2. Изменение максимальной длины столбца val1 базового индекса. Исходное определение val1: (val1 VARCHAR(32) REPLACE DEFAULT "abc")

  ```sql
  ALTER TABLE example_db.my_table 
  MODIFY COLUMN val1 VARCHAR(64) REPLACE DEFAULT "abc";
  ```

  :::tip
  Можно изменить только тип данных столбца; остальные атрибуты столбца должны оставаться неизменными.
  :::

3. Изменение длины поля ключевого столбца таблицы Duplicate key

  ```sql
  ALTER TABLE example_db.my_table 
  MODIFY COLUMN k3 VARCHAR(50) KEY NULL COMMENT 'to 50';
  ```

:::tip
  - При изменении столбца значений в модели с агрегацией необходимо указать agg_type
  - При изменении ключевого столбца для типов без агрегации необходимо указать ключевое слово KEY
  - Можно изменить только тип столбца, остальные атрибуты должны оставаться прежними (то есть их нужно явно указать в инструкции в соответствии с исходными атрибутами; см. пример 2 выше)
  - Столбцы партиционирования и бакетирования нельзя изменять каким-либо образом
  - В настоящее время поддерживаются следующие преобразования типов (ответственность за возможную потерю точности несет пользователь)
    - Преобразование типов TINYINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE в числовые типы большего размера
    - Преобразование TINTINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE/DECIMAL в VARCHAR
    - Для VARCHAR поддерживается изменение максимальной длины
    - Преобразование VARCHAR/CHAR в TINTINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE
    - Преобразование VARCHAR/CHAR в DATE (в настоящее время поддерживаются шесть форматов: "%Y-%m-%d", "%y-%m-%d", "%Y%m%d", "%y%m%d", "%Y/%m/%d, "%y/%m/%d")
    - Преобразование DATETIME в DATE (сохраняется только дата в формате год-месяц-день, например: `2019-12-09 21:47:05` <--> `2019-12-09`)
    - Преобразование DATE в DATETIME (часы, минуты и секунды автоматически заполняются нулями, например: `2019-12-09` <--> `2019-12-09 00:00:00`)
    - Преобразование FLOAT в DOUBLE
    - Преобразование INT в DATE (если данные типа INT некорректны, преобразование завершается ошибкой, а исходные данные остаются неизменными)
    - Все типы, кроме DATE и DATETIME, могут быть преобразованы в STRING, но STRING нельзя преобразовать в какой-либо другой тип 
:::

**5. Изменение порядка столбцов в указанном индексе**

**Синтаксис**

  ```sql
  ALTER TABLE [database.]table table_name ORDER BY (column_name1, column_name2, ...)
  [FROM rollup_index_name]
  [PROPERTIES ("key"="value", ...)]
  ```

**Пример**

1. Изменение порядка ключевых столбцов и столбцов значений в таблице example_db.my_table (модель без агрегации)
  
  ```sql
  CREATE TABLE `my_table`(
  `k_1` INT NULL,
  `k_2` INT NULL,
  `v_1` INT NULL,
  `v_2` varchar NULL,
  `v_3` varchar NULL
  ) ENGINE=OLAP
  DUPLICATE KEY(`k_1`, `k_2`)
  COMMENT 'OLAP'
  DISTRIBUTED BY HASH(`k_1`) BUCKETS 5
  PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
  );

  ALTER TABLE example_db.my_table ORDER BY (k_2,k_1,v_3,v_2,v_1);

  mysql> desc my_table;
  +-------+------------+------+-------+---------+-------+
  | Field | Type       | Null | Key   | Default | Extra |
  +-------+------------+------+-------+---------+-------+
  | k_2   | INT        | Yes  | true  | NULL    |       |
  | k_1   | INT        | Yes  | true  | NULL    |       |
  | v_3   | VARCHAR(*) | Yes  | false | NULL    | NONE  |
  | v_2   | VARCHAR(*) | Yes  | false | NULL    | NONE  |
  | v_1   | INT        | Yes  | false | NULL    | NONE  |
  +-------+------------+------+-------+---------+-------+
  ```

2. Одновременное выполнение двух операций
  
  ```sql
  CREATE TABLE `my_table` (
  `k_1` INT NULL,
  `k_2` INT NULL,
  `v_1` INT NULL,
  `v_2` varchar NULL,
  `v_3` varchar NULL
  ) ENGINE=OLAP
  DUPLICATE KEY(`k_1`, `k_2`)
  COMMENT 'OLAP'
  DISTRIBUTED BY HASH(`k_1`) BUCKETS 5
  PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
  );

  ALTER TABLE example_db.my_table
  ADD COLUMN col INT DEFAULT "0" AFTER v_1,
  ORDER BY (k_2,k_1,v_3,v_2,v_1,col);

  mysql> desc my_table;
  +-------+------------+------+-------+---------+-------+
  | Field | Type       | Null | Key   | Default | Extra |
  +-------+------------+------+-------+---------+-------+
  | k_2   | INT        | Yes  | true  | NULL    |       |
  | k_1   | INT        | Yes  | true  | NULL    |       |
  | v_3   | VARCHAR(*) | Yes  | false | NULL    | NONE  |
  | v_2   | VARCHAR(*) | Yes  | false | NULL    | NONE  |
  | v_1   | INT        | Yes  | false | NULL    | NONE  |
  | col   | INT        | Yes  | false | 0       | NONE  |
  +-------+------------+------+-------+---------+-------+
  ```

:::tip
  - Необходимо перечислить все столбцы индекса
  - Столбцы значений должны располагаться после ключевых столбцов
  - Порядок ключевых столбцов можно изменять только в пределах группы ключевых столбцов. То же правило действует для столбцов значений
:::
  
## Ключевые слова {#keywords}

```text
ALTER, TABLE, COLUMN, ALTER TABLE
```

## Рекомендации по использованию {#best-practice}
