---
{
    "title": "UNNEST",
    "language": "ru"
}
---

## Описание {#description}
`unnest` разворачивает выражения типов array/collection/map в несколько строк (табличная функция). Её можно использовать в списке SELECT и предложении FROM. Она поддерживает WITH ORDINALITY для добавления порядкового номера к каждой полученной строке. Как и семейство функций `explode`, `unnest` поддерживает несколько параметров, типы Map и Bitmap, а также семантику LEFT (внешнего соединения) при использовании FROM/LATERAL и JOIN.

## Синтаксис {#syntax}
```sql
UNNEST(<expr>[, ...]) [WITH ORDINALITY] [AS alias [(col1, col2, ...)]]
-- LATERAL can be added before the FROM clause: LATERAL UNNEST(...), where LATERAL is an optional keyword
```

## Параметры {#parameters}
- <expr>: ARRAY, MAP, BITMAP или список выражений (для нескольких параметров поддерживается только тип ARRAY).

## Возвращаемые значения {#return-values}
- Один параметр ARRAY: возвращает один столбец с несколькими строками, тип которого соответствует типу элементов (по одной строке на элемент). Если элемент равен NULL, выводится NULL.
- Несколько параметров ARRAY: объединяет по позиции элементы, полученные на каждом шаге развёртывания, в несколько столбцов (или в Struct). Длина развёртывания определяется самым длинным входным массивом, а более короткие столбцы дополняются значениями NULL.
- Параметр MAP: возвращает два столбца (Struct) (key, value); ключи и значения NULL остаются NULL.
- Параметр BITMAP: возвращает целочисленные значения по одному на элемент.
- WITH ORDINALITY: добавляет к результату столбец с порядковым номером, начиная с 0 (в качестве первого столбца или с именем, заданным псевдонимом).
- Пустой массив или NULL:
  - При формировании отдельной таблицы (в списке SELECT или FROM ... UNNEST), если параметр равен NULL или является пустым массивом, строки не создаются (0 строк).
  - При использовании совместно с FROM/LATERAL и LEFT JOIN (то есть с семантикой внешнего соединения), если все строки, полученные развёртыванием родительской строки, отфильтрованы или результат пуст, для родительской строки добавляется строка, в которой выходные столбцы UNNEST имеют значение NULL (чтобы сохранить строку левой таблицы).

## Примечания по использованию {#usage-notes}
1. Тип параметра должен быть ARRAY / MAP / BITMAP; в противном случае возникает ошибка.
2. При развёртывании нескольких параметров элементы сопоставляются по позиции; недостающие значения в столбцах заполняются NULL.
3. С помощью AS можно задать псевдоним и явно указать имена полученных столбцов; если имена столбцов не указаны, система создаёт имена по умолчанию.
4. При использовании JOIN:
   - INNER / CROSS JOIN: выполняет декартово произведение или сопоставление на основе результатов развёртывания.
   - LEFT JOIN LATERAL: реализует семантику внешнего соединения: если совпадений нет или все результаты развёртывания отфильтрованы условиями ON/фильтрации, создаётся строка со значениями NULL (чтобы сохранить строку левой таблицы).
5. WITH ORDINALITY добавляет к полученным строкам порядковый номер (начиная с 0).
6. Если UNNEST(...) используется непосредственно в списке SELECT, это эквивалентно применению табличной функции к источнику из одной строки: выражение разворачивается в несколько строк результата.

## Примеры {#examples}
Подготовка:
```sql
CREATE TABLE items (
    id INT,
    name VARCHAR(50),
    tags ARRAY<VARCHAR(50)>, 
    price DECIMAL(10,2),
    category_ids ARRAY<INT>  
) ENGINE=OLAP
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);

INSERT INTO items (id, name, tags, price, category_ids) VALUES
        (1, 'Laptop', ['Electronics', 'Office', 'High-End', 'Laptop'], 5999.99, [1, 2, 3]),
        (2, 'Mechanical Keyboard', ['Electronics', 'Accessories'], 399.99, [1, 2]),
        (3, 'Basketball', ['Sports', 'Outdoor'], 199.99, [1,3]),
        (4, 'Badminton Racket', ['Sports', 'Equipment'], 299.99, [3]),
        (5, 'Shirt', ['Clothing', 'Office', 'Shirt'], 259.00, [4]);
```
1. Использование в списке SELECT (одно выражение разворачивается в несколько строк):
```sql
SELECT unnest([1,2,3]);
```
Результат (пример):
```sql
+-----------------+
| unnest([1,2,3]) |
+-----------------+
|               1 |
|               2 |
|               3 |
+-----------------+
```
2. Развёртывание в FROM / LATERAL с указанными именами столбцов:
```sql
SELECT i.id, t.tag
FROM items i, unnest(i.tags) AS t(tag)
ORDER BY i.id, t.tag;
```
Результат (пример):
```sql
+------+-------------+
| id   | tag         |
+------+-------------+
|    1 | Electronics |
|    1 | High-End    |
|    1 | Laptop      |
|    1 | Office      |
|    2 | Accessories |
|    2 | Electronics |
|    3 | Outdoor     |
|    3 | Sports      |
|    4 | Equipment   |
|    4 | Sports      |
|    5 | Clothing    |
|    5 | Office      |
|    5 | Shirt       |
+------+-------------+
```
3. WITH ORDINALITY：
```sql
SELECT i.id, t.tag, t.ord
FROM items i, unnest(i.tags) WITH ORDINALITY AS t(ord, tag)
ORDER BY i.id, t.ord;
```
Результат (пример):
```sql
+------+-------------+------+
| id   | tag         | ord  |
+------+-------------+------+
|    1 | Electronics |    0 |
|    1 | High-End    |    2 |
|    1 | Laptop      |    3 |
|    1 | Office      |    1 |
|    2 | Accessories |    1 |
|    2 | Electronics |    0 |
|    3 | Outdoor     |    1 |
|    3 | Sports      |    0 |
|    4 | Equipment   |    1 |
|    4 | Sports      |    0 |
|    5 | Clothing    |    0 |
|    5 | Office      |    1 |
|    5 | Shirt       |    2 |
+------+-------------+------+
```
4. INNER JOIN для сохранения совпадающих строк:
```sql
SELECT i.id, t.tag, i.name
FROM items i
INNER JOIN unnest(i.tags) AS t(tag) ON t.tag = i.name;
```
Результат (пример):
```sql
+------+--------+--------+
| id   | tag    | name   |
+------+--------+--------+
|    1 | Laptop | Laptop |
|    5 | Shirt  | Shirt  |
+------+--------+--------+
```
5. LEFT JOIN для сохранения строк левой таблицы (при отсутствии совпадения столбцы UNNEST имеют значение NULL):
```sql
SELECT i.id, t.tag, i.name
FROM items i
LEFT JOIN unnest(i.tags) AS t(tag) ON t.tag = i.name;
```
Результат (пример):
```sql
+------+--------+---------------------+
| id   | tag    | name                |
+------+--------+---------------------+
|    1 | Laptop | Laptop              |
|    2 | NULL   | Mechanical Keyboard |
|    3 | NULL   | Basketball          |
|    4 | NULL   | Badminton Racket    |
|    5 | Shirt  | Shirt               |
+------+--------+---------------------+
```
6. Несколько параметров ARRAY / Map / Bitmap:
```sql
SELECT * FROM unnest([1,2], ['a','b']) AS t(c1, c2) ORDER BY 1;
+------+------+
| c1   | c2   |
+------+------+
|    1 | a    |
|    2 | b    |
+------+------+

SELECT * FROM unnest(bitmap_or(to_bitmap(23), to_bitmap(24))) AS t(col) ORDER BY 1;
+------+
| col  |
+------+
|   23 |
|   24 |
+------+

SELECT * FROM unnest({1:2, 3:4}) AS t(k, v) ORDER BY 1;
+------+------+
| k    | v    |
+------+------+
|    1 |    2 |
|    3 |    4 |
+------+------+
```
7. В списке SELECT
```sql
SELECT tags, category_ids, unnest(tags), unnest(category_ids) from items ORDER BY 1, 2;
+-------------------------------------------------+--------------+--------------+----------------------+
| tags                                            | category_ids | unnest(tags) | unnest(category_ids) |
+-------------------------------------------------+--------------+--------------+----------------------+
| ["Clothing", "Office", "Shirt"]                 | [4]          | Clothing     |                    4 |
| ["Clothing", "Office", "Shirt"]                 | [4]          | Office       |                 NULL |
| ["Clothing", "Office", "Shirt"]                 | [4]          | Shirt        |                 NULL |
| ["Electronics", "Accessories"]                  | [1, 2]       | Electronics  |                    1 |
| ["Electronics", "Accessories"]                  | [1, 2]       | Accessories  |                    2 |
| ["Electronics", "Office", "High-End", "Laptop"] | [1, 2, 3]    | Electronics  |                    1 |
| ["Electronics", "Office", "High-End", "Laptop"] | [1, 2, 3]    | Office       |                    2 |
| ["Electronics", "Office", "High-End", "Laptop"] | [1, 2, 3]    | High-End     |                    3 |
| ["Electronics", "Office", "High-End", "Laptop"] | [1, 2, 3]    | Laptop       |                 NULL |
| ["Sports", "Equipment"]                         | [3]          | Sports       |                    3 |
| ["Sports", "Equipment"]                         | [3]          | Equipment    |                 NULL |
| ["Sports", "Outdoor"]                           | [1, 3]       | Sports       |                    1 |
| ["Sports", "Outdoor"]                           | [1, 3]       | Outdoor      |                    3 |
+-------------------------------------------------+--------------+--------------+----------------------+
```
