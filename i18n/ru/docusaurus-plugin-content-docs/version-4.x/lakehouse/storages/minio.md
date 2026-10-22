---
{
    "title": "MinIO | Хранилища",
    "language": "ru",
    "description": "В этом документе описаны параметры, необходимые для доступа к MinIO, которые применяются в следующих сценариях:",
    "sidebar_label": "MinIO"
}
---

# MinIO {#minio}

В этом документе описаны параметры, необходимые для доступа к MinIO, которые применяются в следующих сценариях:

- Свойства Catalog
- Свойства Table Valued Function
- Свойства Broker Load
- Свойства Export
- Свойства Outfile

**Doris использует S3 Client для доступа к MinIO по протоколу, совместимому с S3.**

## Обзор параметров {#parameter-overview}

| Название свойства              | Устаревшее название      | Описание                                                     | Значение по умолчанию | Обязательный |
| ------------------------------ | ------------------------ | ------------------------------------------------------------ | ------------- | -------- |
| minio.endpoint                 | s3.endpoint              | Конечная точка MinIO, используемая для доступа к MinIO         |               | Да       |
| minio.access_key               | s3.access_key            | Ключ доступа MinIO, используемый для аутентификации           |               | Да       |
| minio.secret_key               | s3.secret_key            | Секретный ключ MinIO, используемый вместе с ключом доступа    |               | Да       |
| minio.connection.maximum       | s3.connection.maximum    | Максимальное число соединений S3: задаёт максимальное количество соединений, устанавливаемых со службой MinIO | 50            | Нет      |
| minio.connection.request.timeout | s3.connection.request.timeout | Время ожидания запроса S3 в миллисекундах: задаёт время ожидания запроса при подключении к службе MinIO | 3000          | Нет      |
| minio.connection.timeout       | s3.connection.timeout    | Время ожидания соединения S3 в миллисекундах: задаёт время ожидания при установлении соединения со службой MinIO | 1000          | Нет      |
| minio.use_path_style           | s3.use_path_style        | Использовать ли доступ Path-style. Для совместимости с MinIO и другими службами S3, отличными от AWS, рекомендуется установить значение true | FALSE         | Нет      |

### Использование доступа Path-style {#using-path-style-access}

По умолчанию MinIO использует доступ Host-style, но также поддерживает доступ Path-style. Переключить способ доступа можно с помощью параметра `minio.use_path_style`.

- Доступ Host-style (по умолчанию): `https://bucket.minio.example.com`
- Доступ Path-style (если включён): `https://minio.example.com/bucket`

## Пример конфигурации {#example-configuration}

```properties
"minio.access_key" = "your-access-key",
"minio.secret_key" = "your-secret-key",
"minio.endpoint" = "http://minio.example.com:9000"
```

Для версий до 3.1:

```properties
"s3.access_key" = "your-access-key",
"s3.secret_key" = "your-secret-key",
"s3.endpoint" = "http://minio.example.com:9000"
```

## Рекомендации по использованию {#usage-recommendations}

* Рекомендуется использовать префикс `minio.` для параметров конфигурации, чтобы их связь с MinIO была понятной и единообразной.
* Для версий до 3.1 используйте устаревший префикс `s3.`.
* Параметры пула соединений можно настраивать с учётом требований к параллельной работе, чтобы избежать подключения
