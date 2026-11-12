---
{
    "title": "HDFS | Табличные функции",
    "language": "ru",
    "description": "Читайте файлы из HDFS в виде реляционной таблицы с помощью табличной функции HDFS.",
    "sidebar_label": "HDFS"
}
---

<a id="local"></a>

# HDFS {#hdfs}

## Описание {#description}

Табличная функция HDFS (TVF) позволяет читать файлы из HDFS в виде реляционной таблицы. Она поддерживает форматы `csv`, `csv_with_names`, `csv_with_names_and_types`, `json`, `parquet`, `orc` и `avro`.

## Синтаксис {#syntax}

```sql
HDFS(
    "uri" = "<uri>",
    "fs.defaultFS" = "<fs_defaultFS>",
    "hadoop.username" = "<hadoop_username>",
    "format" = "<format>"
    [, "<optional_property_key>" = "<optional_property_value>" [, ...] ]
)
```

## Параметры {#parameters}

### Обязательные параметры {#required-parameters}

| Параметр | Описание |
| --- | --- |
| `uri` | URI файла в HDFS для чтения. Если путь не существует или файл пуст, TVF возвращает пустой результат. |
| `fs.defaultFS` | URI файловой системы HDFS по умолчанию. |
| `hadoop.username` | Имя пользователя HDFS. Укажите непустую строку. |
| `format` | Формат файла: `csv`, `csv_with_names`, `csv_with_names_and_types`, `json`, `parquet`, `orc` или `avro`. |

### Необязательные параметры {#optional-parameters}

Используйте следующие ключи для `<optional_property_key>` и соответствующие им значения для `<optional_property_value>`:

| Параметр | Описание | Примечания |
| --- | --- | --- |
| `hadoop.security.authentication` | Тип аутентификации HDFS. | |
| `hadoop.kerberos.principal` | Принципал Kerberos. | |
| `hadoop.kerberos.keytab` | Файл keytab Kerberos. | |
| `dfs.client.read.shortcircuit` | Включает чтение HDFS в режиме short-circuit. | |
| `dfs.domain.socket.path` | Путь к доменному сокету. | |
| `dfs.nameservices` | Nameservice, используемый в режиме HA. | |
| `dfs.ha.namenodes.<nameservice>` | Идентификаторы NameNode для указанного nameservice в режиме HA. | |
| `dfs.namenode.rpc-address.<nameservice>.<namenode>` | RPC-адрес указанного NameNode. | |
| `dfs.client.failover.proxy.provider.<nameservice>` | Класс провайдера прокси для переключения при отказе nameservice. | |
| `column_separator` | Разделитель столбцов; по умолчанию `\t`. | |
| `line_delimiter` | Разделитель строк; по умолчанию `\n`. | |
| `compress_type` | Сжатие: `UNKNOWN`, `PLAIN`, `GZ`, `LZO`, `BZ2`, `LZ4FRAME`, `DEFLATE` или `SNAPPYBLOCK`. По умолчанию используется `UNKNOWN`, при котором сжатие определяется по суффиксу URI. | |
| `read_json_by_line` | Чтение JSON построчно; по умолчанию `true`. | [Загрузка JSON](../../../data-operate/import/file-format/json) |
| `strip_outer_array` | Удаление внешнего массива JSON; по умолчанию `false`. | [Загрузка JSON](../../../data-operate/import/file-format/json) |
| `json_root` | Путь к корню JSON; по умолчанию пустой. | [Загрузка JSON](../../../data-operate/import/file-format/json) |
| `json_paths` | Пути к полям JSON; по умолчанию пустые. | [Загрузка JSON](../../../data-operate/import/file-format/json) |
| `num_as_string` | Чтение чисел JSON как строк; по умолчанию `false`. | [Загрузка JSON](../../../data-operate/import/file-format/json) |
| `fuzzy_parse` | Включает нечёткий разбор JSON; по умолчанию `false`. | [Загрузка JSON](../../../data-operate/import/file-format/json) |
| `trim_double_quotes` | Логический параметр для CSV; по умолчанию `false`. Если включён, удаляет внешние двойные кавычки из каждого поля. | |
| `skip_lines` | Целочисленный параметр для CSV; по умолчанию `0`. Пропускает начальные строки; игнорируется для `csv_with_names` и `csv_with_names_and_types`. | |
| `path_partition_keys` | Имена столбцов партиционирования, закодированные в пути и разделённые запятыми. Для `/path/to/city=beijing/date=2023-07-09` используйте `city,date`, чтобы извлечь эти значения. | |
| `resource` | Существующий Resource HDFS для доступа к HDFS. См. [CREATE RESOURCE](../../sql-statements/cluster-management/compute-management/CREATE-RESOURCE). | Начиная с 2.1.4 |
| `enable_mapping_varbinary` | По умолчанию `false`. Для бинарных полей Parquet и ORC по умолчанию используется тип STRING, а при включении параметра используется VARBINARY. Этот параметр не зависит от `enable_mapping_timestamp_tz`. | Начиная с 4.0.3 |
| `enable_mapping_timestamp_tz` | Начиная с 4.1.5 принимается только для совместимости; значение игнорируется. Parquet Timestamp с `isAdjustedToUTC=true` и ORC `TIMESTAMP_INSTANT` всегда сопоставляются с `TIMESTAMPTZ`, даже если для этого параметра задано `false`. | Начиная с 4.0.3 |
| `hive.parquet.time-zone` | Необязательная строка, по умолчанию пустая. Задаёт часовой пояс, используемый при записи Parquet INT96: часовой пояс IANA или смещение относительно UTC от `-12:00` до `+14:00`; короткие псевдонимы, такие как `CST` и `PRC`, не допускаются. См. [Parquet](../../../lakehouse/file-formats/parquet.md#timestamp-and-date-compatibility). | Начиная с 4.1.5 |

### Требования к управлению доступом {#access-control-requirements}

При использовании параметра `resource` пользователю, выполняющему запрос, требуется привилегия `USAGE` для этого Resource. Doris также должен иметь сетевой доступ к HDFS и действительные учётные данные HDFS или Kerberos для доступа к файлам.

## Возвращаемое значение {#return-value}

Возвращает таблицу, имена и типы столбцов которой определяются по файлам. Поля NULL возвращаются как SQL NULL. Если путь не существует или файл пуст, возвращается пустой результат. Недопустимые параметры, недоступное хранилище или файлы с некорректным форматом могут привести к ошибке анализа или выполнения.

## Примеры {#examples}

В следующих примерах предполагается, что файл HDFS `student.csv` содержит:

```text
1,alice,18
2,bob,20
3,jack,24
4,jackson,19
5,liming,18
```

### Чтение файла CSV {#read-a-csv-file}

```sql
SELECT * FROM HDFS(
    "uri" = "hdfs://127.0.0.1:8424/user/doris/csv_format_test/student.csv",
    "fs.defaultFS" = "hdfs://127.0.0.1:8424",
    "hadoop.username" = "doris",
    "format" = "csv",
    "column_separator" = ","
);
```

```text
+------+---------+------+
| c1   | c2      | c3   |
+------+---------+------+
| 1    | alice   | 18   |
| 2    | bob     | 20   |
| 3    | jack    | 24   |
| 4    | jackson | 19   |
| 5    | liming  | 18   |
+------+---------+------+
```

### Чтение файла CSV из HDFS в режиме HA {#read-a-csv-file-from-ha-hdfs}

Настройте nameservice и адреса обоих NameNode для своего кластера HA. URI и `fs.defaultFS` используют логический nameservice:

```sql
SELECT * FROM HDFS(
    "uri" = "hdfs://my_hdfs/user/doris/csv_format_test/student.csv",
    "fs.defaultFS" = "hdfs://my_hdfs",
    "hadoop.username" = "doris",
    "format" = "csv",
    "column_separator" = ",",
    "dfs.nameservices" = "my_hdfs",
    "dfs.ha.namenodes.my_hdfs" = "nn1,nn2",
    "dfs.namenode.rpc-address.my_hdfs.nn1" = "namenode01:8020",
    "dfs.namenode.rpc-address.my_hdfs.nn2" = "namenode02:8020",
    "dfs.client.failover.proxy.provider.my_hdfs" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
);
```

```text
+------+---------+------+
| c1   | c2      | c3   |
+------+---------+------+
| 1    | alice   | 18   |
| 2    | bob     | 20   |
| 3    | jack    | 24   |
| 4    | jackson | 19   |
| 5    | liming  | 18   |
+------+---------+------+
```

### Просмотр автоматически определённой схемы {#inspect-the-inferred-schema}

```sql
DESC FUNCTION HDFS(
    "uri" = "hdfs://127.0.0.1:8424/user/doris/csv_format_test/student.csv",
    "fs.defaultFS" = "hdfs://127.0.0.1:8424",
    "hadoop.username" = "doris",
    "format" = "csv",
    "column_separator" = ","
);
```

```text
+-------+------+------+-------+---------+-------+
| Field | Type | Null | Key   | Default | Extra |
+-------+------+------+-------+---------+-------+
| c1    | TEXT | Yes  | false | NULL    | NONE  |
| c2    | TEXT | Yes  | false | NULL    | NONE  |
| c3    | TEXT | Yes  | false | NULL    | NONE  |
+-------+------+------+-------+---------+-------+
```

## Примечания по использованию {#usage-notes}

Другие общие параметры файлов описаны в разделе [S3 TVF](./s3.md). Настройки аутентификации и HA для HDFS описаны в разделе [Хранилище HDFS](../../../lakehouse/storages/hdfs.md).
