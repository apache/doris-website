---
{
    "title": "BITMAP",
    "language": "ru",
    "description": "Узнайте, как загружать данные BITMAP в Apache Doris: правила проектирования таблиц, пример Stream Load и два способа загрузки BITMAP с несколькими элементами.",
    "keywords": [
        "Doris BITMAP",
        "BITMAP load",
        "BITMAP_UNION",
        "to_bitmap",
        "bitmap_from_string",
        "bitmap_from_array",
        "Stream Load Bitmap",
        "Aggregate table Bitmap"
    ]
}
---

<!-- Knowledge type: Procedure + Configuration parameters -->
<!-- Applicable scenarios: BITMAP data loading / exact deduplication / user profile tags -->

Тип BITMAP обычно используется для точной дедупликации, хранения тегов профилей пользователей и подобных задач. В этом документе описаны правила проектирования таблиц со столбцами BITMAP в Apache Doris и показаны два варианта загрузки через Stream Load: для BITMAP с одним элементом и с несколькими элементами.

## Ограничения типа BITMAP {#bitmap-type-constraints}

Перед загрузкой данных BITMAP ознакомьтесь со следующими ограничениями:

| Ограничение | Описание |
| --- | --- |
| Поддерживаемые модели таблиц | Таблица Duplicate, таблица Unique, таблица Aggregate |
| Позиция столбца | Может использоваться только как столбец Value, но не как столбец Key |
| Требование к таблице Aggregate | В таблице Aggregate столбец BITMAP должен использовать тип агрегации `BITMAP_UNION` |
| Длина и значение по умолчанию | Указывать длину и значение по умолчанию не требуется; система автоматически определяет длину в зависимости от уровня агрегации |

Подробнее о типе см. в разделе [Тип данных BITMAP](../../../sql-manual/basic-element/sql-data-types/aggregate/BITMAP).

## Сценарий 1: загрузка данных BITMAP с одним элементом {#scenario-1-loading-single-value-bitmap-data}

Этот вариант подходит, если каждая строка исходных данных содержит только одно целое число. Используйте функцию `to_bitmap`, чтобы преобразовать целое число в BITMAP.

### Шаг 1: подготовьте данные {#step-1-prepare-the-data}

Создайте файл CSV `test_bitmap.csv`, в котором каждая строка содержит одно целое число:

```text
1|koga|17723
2|nijg|146285
3|lojn|347890
4|lofn|489871
5|jfin|545679
6|kon|676724
7|nhga|767689
8|nfubg|879878
9|huang|969798
10|buag|97997
```

### Шаг 2: создайте целевую таблицу {#step-2-create-the-target-table}

Создайте таблицу Aggregate со столбцом BITMAP в базе данных `testdb`:

```sql
CREATE TABLE testdb.test_bitmap(
    typ_id     BIGINT                NULL   COMMENT "ID",
    hou        VARCHAR(10)           NULL   COMMENT "one",
    arr        BITMAP  BITMAP_UNION  NOT NULL   COMMENT "two"
)
AGGREGATE KEY(typ_id,hou)
DISTRIBUTED BY HASH(typ_id,hou) BUCKETS 10;
```

### Шаг 3: выполните загрузку через Stream Load {#step-3-run-stream-load}

Используйте функцию `to_bitmap`, чтобы преобразовать столбец целых чисел в BITMAP:

```shell
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:|" \
    -H "columns:typ_id,hou,arr,arr=to_bitmap(arr)" \
    -T test_bitmap.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_bitmap/_stream_load
```

### Шаг 4: проверьте результат загрузки {#step-4-verify-the-load-result}

Используйте `bitmap_to_string`, чтобы преобразовать BITMAP обратно в строку и просмотреть загруженные данные:

```sql
mysql> select typ_id,hou,bitmap_to_string(arr) from testdb.test_bitmap;
+--------+-------+-----------------------+
| typ_id | hou   | bitmap_to_string(arr) |
+--------+-------+-----------------------+
|      4 | lofn  | 489871                |
|      6 | kon   | 676724                |
|      9 | huang | 969798                |
|      3 | lojn  | 347890                |
|      8 | nfubg | 879878                |
|      7 | nhga  | 767689                |
|      1 | koga  | 17723                 |
|      2 | nijg  | 146285                |
|      5 | jfin  | 545679                |
|     10 | buag  | 97997                 |
+--------+-------+-----------------------+
10 rows in set (0.07 sec)
```

## Сценарий 2: загрузка данных BITMAP с несколькими элементами {#scenario-2-loading-multi-element-bitmap-data}

Если каждая строка исходных данных содержит несколько целых чисел (например, несколько идентификаторов пользователей), выберите один из следующих двух способов в зависимости от формата исходного файла. Различия между способами приведены ниже:

| Способ | Формат исходного файла | Требуется преобразование через cast | Примечания |
| --- | --- | --- | --- |
| `bitmap_from_string` | Значения через запятую, квадратные скобки **недопустимы** | Нет | Квадратные скобки считаются ошибкой качества данных |
| `bitmap_from_array` | Значения через запятую, квадратные скобки **допустимы** | Необходимо выполнить `cast` к типу `array<int>` | Без преобразования загрузка завершается ошибкой из-за несоответствия сигнатуры функции |

### Способ A: использование bitmap_from_string {#method-a-using-bitmap_from_string}

#### Требования к формату данных {#data-format-requirements}

В столбце `arr` исходного файла значения разделяются запятыми и не должны содержать квадратных скобок:

```text
1|koga|17,723
2|nijg|146,285
3|lojn|347,890
4|lofn|489,871
5|jfin|545,679
6|kon|676,724
7|nhga|767,689
8|nfubg|879,878
9|huang|969,798
10|buag|97,997
```

#### Команда Stream Load {#stream-load-command}

```shell
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:|" \
    -H "columns:typ_id,hou,arr,arr=bitmap_from_string(arr)" \
    -T test_bitmap.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_bitmap/_stream_load
```

### Способ B: использование bitmap_from_array {#method-b-using-bitmap_from_array}

#### Требования к формату данных {#data-format-requirements-1}

Столбец `arr` исходного файла может содержать квадратные скобки:

```text
1|koga|[17,723]
2|nijg|[146,285]
3|lojn|[347,890]
4|lofn|[489,871]
5|jfin|[545,679]
6|kon|[676,724]
7|nhga|[767,689]
8|nfubg|[879,878]
9|huang|[969,798]
10|buag|[97,997]
```

#### Команда Stream Load {#stream-load-command-1}

В Stream Load сначала необходимо выполнить `cast` строки к типу `array<int>`, а затем преобразовать её с помощью `bitmap_from_array`:

```shell
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:|" \
    -H "columns:typ_id,hou,arr_str,arr=bitmap_from_array(cast(arr_str as array<int>))" \
    -T test_bitmap.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_bitmap/_stream_load
```

## Устранение неполадок {#troubleshooting}

### Ошибка «функция не существует» при использовании bitmap_from_array {#function-does-not-exist-error-when-using-bitmap_from_array}

Пример ошибки:

```text
[ANALYSIS_ERROR]TStatus: errCode = 2, detailMessage = Does not support non-builtin functions, or function does not exist: bitmap_from_array(<slot 8>)
```

- **Причина**: строка не была явно приведена к типу `array<int>`, поэтому не удаётся подобрать подходящую сигнатуру функции `bitmap_from_array`.
- **Решение**: в параметре `columns` метода Stream Load используйте `cast(arr_str as array<int>)` для явного преобразования типа.

### Как просмотреть содержимое столбца BITMAP в запросах {#how-to-view-bitmap-column-contents-in-queries}

BITMAP представляет собой двоичный агрегатный тип, содержимое которого нельзя просмотреть напрямую с помощью `SELECT`. Для этого необходимо преобразовать его с помощью функций:

- `bitmap_to_string(col)`: преобразует BITMAP в строку со значениями, разделёнными запятыми.
- `bitmap_count(col)`: возвращает количество уникальных элементов в BITMAP.

### Почему BITMAP нельзя использовать в качестве столбца Key {#why-bitmap-cannot-be-used-as-a-key-column}

BITMAP представляет собой агрегатный двоичный тип. Его нельзя использовать в качестве столбца Key для сортировки или дедупликации. Он может храниться только в столбце Value для сохранения результатов агрегации.
