---
{
  "title": "PARQUET_META",
  "language": "ru",
  "description": "Табличная функция parquet_meta (tvf) позволяет читать метаданные Footer файлов Parquet без сканирования страниц данных. С её помощью можно быстро просматривать статистику Row Group, Schema, метаданные уровня файла, метаданные KV и результаты проверок Bloom Filter."
}
---

Табличная функция `parquet_meta` (tvf) позволяет читать метаданные Footer файлов Parquet без сканирования страниц данных. С её помощью можно быстро просматривать статистику Row Group, Schema, метаданные уровня файла, метаданные KV и результаты проверок Bloom Filter.

> Это экспериментальная функция, поддерживаемая начиная с версии 4.1.0.

## Синтаксис {#syntax}

```sql
PARQUET_META(
    "uri" = "<uri>",
    "mode" = "<mode>",
    {OptionalParameters},
    {ConnectionParameters}
  );
```

- `uri`

  Путь к файлу.

- `mode`

  Режим запроса метаданных. Необязательный параметр, по умолчанию — `parquet_metadata`. Возможные значения приведены в разделе «Поддерживаемые режимы».

- `{OptionalParameters}`

  - `column`: обязателен для режима `parquet_bloom_probe`, задаёт имя столбца для проверки.
  - `value`: обязателен для режима `parquet_bloom_probe`, задаёт литеральное значение для проверки.

- `{ConnectionParameters}`

  Параметры, необходимые для доступа к системе хранения, в которой находится файл. Подробнее см.:

  * [HDFS](../../../lakehouse/storages/hdfs.md)
  * [AWS S3](../../../lakehouse/storages/s3.md)
  * [Google Cloud Storage](../../../lakehouse/storages/gcs.md)
  * [Azure Blob](../../../lakehouse/storages/azure-blob.md)
  * [Alibaba Cloud OSS](../../../lakehouse/storages/aliyun-oss.md)
  * [Tencent Cloud COS](../../../lakehouse/storages/tencent-cos.md)
  * [Huawei Cloud OBS](../../../lakehouse/storages/huawei-obs.md)
  * [MinIO](../../../lakehouse/storages/minio.md)

## Поддерживаемые режимы {#supported-modes}

### `parquet_metadata` {#parquet_metadata}

Режим по умолчанию.

Этот режим позволяет запрашивать метаданные, содержащиеся в файлах Parquet. Метаданные раскрывают различные сведения о внутренней структуре файла Parquet, например статистику по отдельным столбцам. Это помогает определить, какие операции пропуска данных можно выполнять при чтении файлов Parquet, и даже быстро получить представление о содержимом отдельных столбцов.

| Имя поля | Тип |
| --- | --- |
| file_name | STRING |
| row_group_id | BIGINT |
| row_group_num_rows | BIGINT |
| row_group_num_columns | BIGINT |
| row_group_bytes | BIGINT |
| column_id | BIGINT |
| file_offset | BIGINT |
| num_values | BIGINT |
| path_in_schema | STRING |
| type | STRING |
| stats_min | STRING |
| stats_max | STRING |
| stats_null_count | BIGINT |
| stats_distinct_count | BIGINT |
| stats_min_value | STRING |
| stats_max_value | STRING |
| compression | STRING |
| encodings | STRING |
| index_page_offset | BIGINT |
| dictionary_page_offset | BIGINT |
| data_page_offset | BIGINT |
| total_compressed_size | BIGINT |
| total_uncompressed_size | BIGINT |
| key_value_metadata | `MAP<VARBINARY, VARBINARY>` |
| bloom_filter_offset | BIGINT |
| bloom_filter_length | BIGINT |
| min_is_exact | BOOLEAN |
| max_is_exact | BOOLEAN |
| row_group_compressed_bytes | BIGINT |

### `parquet_schema` {#parquet_schema}

Этот режим позволяет запрашивать внутреннюю схему файлов Parquet. Обратите внимание: речь идёт о структуре, содержащейся в метаданных файла Parquet.

| Имя поля | Тип |
| --- | --- |
| file_name | VARCHAR |
| name | VARCHAR |
| type | VARCHAR |
| type_length | BIGINT |
| repetition_type | VARCHAR |
| num_children | BIGINT |
| converted_type | VARCHAR |
| scale | BIGINT |
| precision | BIGINT |
| field_id | BIGINT |
| logical_type | VARCHAR |

### `parquet_file_metadata` {#parquet_file_metadata}

Этот режим позволяет запрашивать метаданные уровня файла, например версию формата и используемый алгоритм шифрования.

| Имя поля | Тип |
| --- | --- |
| file_name | STRING |
| created_by | STRING |
| num_rows | BIGINT |
| num_row_groups | BIGINT |
| format_version | BIGINT |
| encryption_algorithm | STRING |
| footer_signing_key_metadata | STRING |

### `parquet_kv_metadata` {#parquet_kv_metadata}

Этот режим позволяет запрашивать пользовательские метаданные, заданные в виде пар «ключ — значение».

| Имя поля | Тип |
| --- | --- |
| file_name | STRING |
| key | STRING |
| value | STRING |

### `parquet_bloom_probe` {#parquet_bloom_probe}

Doris поддерживает использование Bloom Filter в файлах Parquet для фильтрации данных и отсечения ненужных данных при чтении. Этот режим позволяет с помощью Bloom Filter проверить наличие указанного значения в указанном столбце.

| Имя поля | Тип |
| --- | --- |
| file_name | STRING |
| row_group_id | INT |
| bloom_filter_excludes | INT |

Значения `bloom_filter_excludes`:

- `1`: Bloom Filter определяет, что эта Row Group точно не содержит указанного значения
- `0`: Bloom Filter определяет, что она может содержать указанное значение
- `-1`: в файле нет Bloom Filter

## Примеры {#examples}

- Локальный файл (без схемы)

    ```sql
    SELECT * FROM parquet_meta(
      "uri" = "/path/to/test.parquet"
    );
    ```

- Файл S3 (со схемой + параметрами хранилища)

    ```sql
    SELECT * FROM parquet_meta(
      "uri" = "s3://bucket/path/test.parquet",
      "mode" = "parquet_schema",
      "s3.access_key" = "...",
      "s3.secret_key" = "...",
      "s3.endpoint" = "s3.xxx.com",
      "s3.region" = "us-east-1"
    );
    ```

- Использование подстановочных символов (glob)

    ```sql
    SELECT file_name FROM parquet_meta(
      "uri" = "s3://bucket/path/*meta.parquet",
      "mode" = "parquet_file_metadata"
    );
    ```

- Использование режима `parquet_bloom_probe`

    ```sql
    select * from parquet_meta(
        "uri" = "${basePath}/bloommeta.parquet",
        "mode" = "parquet_bloom_probe",
        "column" = "col",
        "value" = 500,
        "s3.access_key" = "${ak}",
        "s3.secret_key" = "${sk}",
        "s3.endpoint" = "${endpoint}",
        "s3.region" = "${region}",
    );
    ```

## Примечания и ограничения {#notes-and-limitations}

- `parquet_meta` читает только метаданные Footer файлов Parquet, не обращаясь к страницам данных, поэтому подходит для быстрого просмотра метаданных.
- Поддерживаются подстановочные символы (например, `*`, `{}`, `[]`). Если подходящие файлы не найдены, возвращается ошибка.
