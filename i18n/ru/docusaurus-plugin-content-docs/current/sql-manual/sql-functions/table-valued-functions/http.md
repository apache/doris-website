---
{
    "title": "HTTP",
    "language": "ru",
    "description": "Табличная функция HTTP (TVF) в Apache Doris позволяет напрямую выполнять SQL-запросы к данным любых конечных точек HTTP/HTTPS, включая ответы REST API, удалённые файлы данных и наборы данных Hugging Face. Поддерживается разбор форматов JSON, CSV, Parquet и ORC."
}
---

Табличная функция HTTP (TVF) позволяет пользователям читать данные, возвращаемые любой конечной точкой HTTP, как данные реляционной таблицы. Если возвращаемые данные имеют поддерживаемый формат, их можно напрямую запрашивать и анализировать с помощью SQL. В настоящее время поддерживаются форматы данных `csv/csv_with_names/csv_with_names_and_types/json/parquet/orc`.

Типичные сценарии использования:

- Запросы к файлам данных, доступным по HTTP/HTTPS (например, на GitHub, S3 и т. д.).
- Прямые запросы к конечным точкам HTTP API, возвращающим данные в формате JSON.
- Доступ к наборам данных, размещённым на Hugging Face.

:::note
Поддерживается начиная с версии 4.0.2.
:::

## Синтаксис {#syntax}

```sql
HTTP(
    "uri" = "<uri>",
    "format" = "<format>"
    [, "<optional_property_key>" = "<optional_property_value>" [, ...] ]
  )
```

### Обязательные параметры {#required-parameters}

| Параметр          | Описание                     |
|-------------------|------------------------------|
| uri               | HTTP-адрес для доступа к данным. Поддерживаются протоколы `http`, `https` и `hf`. Это может быть URL файла данных или конечной точки API, возвращающей данные. |
| format            | Формат данных, то есть способ разбора содержимого, возвращаемого конечной точкой HTTP. Поддерживаются `csv/csv_with_names/csv_with_names_and_types/json/parquet/orc`. |

Для `hf://` (Hugging Face) см. раздел [Анализ данных Hugging Face](../../../lakehouse/huggingface.md).

### Необязательные параметры {#optional-parameters}

| Параметр       | Описание       | Примечания |
|-------|-----------|------------------------|
| `http.header.xxx`  | Позволяет задавать произвольные заголовки HTTP, которые передаются непосредственно HTTP-клиенту. | Например, при `"http.header.Authorization" = "Bearer hf_MWYzOJJoZEymb..."` результирующий заголовок будет иметь вид `Authorization: Bearer hf_MWYzOJJoZEymb...` |
| `http.enable.range.request` | Использовать ли диапазонные запросы для доступа к HTTP-сервису. Значение по умолчанию: `true`. | |
| `http.max.request.size.bytes` | Максимальный объём данных при доступе в режиме без диапазонных запросов. Значение по умолчанию: 100 MB. | |

Если `http.enable.range.request` имеет значение `true`, система сначала попытается обратиться к HTTP-сервису с помощью диапазонных запросов. Если HTTP-сервис не поддерживает диапазонные запросы, система автоматически перейдёт в режим без них. Максимальный объём доступных данных ограничивается параметром `http.max.request.size.bytes`.

## Примеры {#examples}

### Чтение файлов данных по HTTP {#reading-data-files-over-http}

- Чтение данных CSV с GitHub

    ```sql
    SELECT COUNT(*) FROM
    HTTP(
        "uri" = "https://raw.githubusercontent.com/apache/doris/refs/heads/master/regression-test/data/load_p0/http_stream/all_types.csv",
        "format" = "csv",
        "column_separator" = ","
    );
    ```

- Чтение данных Parquet с GitHub

    ```sql
    SELECT arr_map, id FROM
    HTTP(
        "uri" = "https://raw.githubusercontent.com/apache/doris/refs/heads/master/regression-test/data/external_table_p0/tvf/t.parquet",
        "format" = "parquet"
    );
    ```

- Чтение данных JSON с GitHub и просмотр схемы с помощью `DESC FUNCTION`

    ```sql
    DESC FUNCTION
    HTTP(
        "uri" = "https://raw.githubusercontent.com/apache/doris/refs/heads/master/regression-test/data/load_p0/stream_load/basic_data.json",
        "format" = "json",
        "strip_outer_array" = "true"
    );
    ```

### Запросы к конечным точкам HTTP API {#querying-http-api-endpoints}

Табличную функцию HTTP можно использовать для прямых запросов к конечным точкам HTTP API, возвращающим данные в формате JSON. Например, запрос к REST API, возвращающему данные JSON:

```sql
SELECT * FROM
HTTP(
    "uri" = "https://api.example.com/v1/data",
    "format" = "json",
    "http.header.Authorization" = "Bearer your_token",
    "strip_outer_array" = "true"
);
```

:::tip
Для конечных точек HTTP API, которые не поддерживают диапазонные запросы (Range Requests), система автоматически перейдёт в режим без диапазонных запросов. Их можно отключить вручную с помощью параметра `http.enable.range.request`.
:::
