---
{
    "title": "Apache Ozone",
    "language": "ru",
    "description": "Начиная с версии 4.0.4, Doris поддерживает доступ к Apache Ozone через S3 Gateway.",
    "sidebar_label": "Apache Ozone"
}
---

# Apache Ozone {#apache-ozone}

Начиная с версии 4.0.4, Doris поддерживает доступ к Apache Ozone через S3 Gateway.

В этом документе описаны параметры, необходимые для доступа к Apache Ozone. Эти параметры применяются к:

- свойствам Catalog
- свойствам Table Valued Function
- свойствам Broker Load
- свойствам Export
- свойствам Outfile

**Чтобы использовать Ozone как отдельный тип хранилища, явно задайте `"fs.ozone.support" = "true"`.**

## Обзор параметров {#parameter-overview}

| Имя свойства | Прежнее имя | Описание | Значение по умолчанию | Обязательно |
| --- | --- | --- | --- | --- |
| ozone.endpoint | s3.endpoint | Конечная точка Ozone S3 Gateway, например `http://ozone-s3g:9878` | Нет | Да |
| ozone.region | s3.region | Регион Ozone S3 Gateway | `us-east-1` | Нет |
| ozone.access_key | s3.access_key, s3.access-key-id | Ключ доступа для аутентификации | Нет | Нет* |
| ozone.secret_key | s3.secret_key, s3.secret-access-key | Секретный ключ для аутентификации | Нет | Нет* |
| ozone.session_token | s3.session_token, s3.session-token | Токен сеанса | Нет | Нет |
| ozone.connection.maximum | s3.connection.maximum | Максимальное количество соединений | `100` | Нет |
| ozone.connection.request.timeout | s3.connection.request.timeout | Тайм-аут запроса в миллисекундах | `10000` | Нет |
| ozone.connection.timeout | s3.connection.timeout | Тайм-аут подключения в миллисекундах | `10000` | Нет |
| ozone.use_path_style | use_path_style, s3.path-style-access | Использовать ли доступ в формате path-style | `true` | Нет |
| ozone.force_parsing_by_standard_uri | force_parsing_by_standard_uri | Принудительно использовать ли стандартный разбор URI | `false` | Нет |
| fs.ozone.support |  | Включить ли Ozone как тип хранилища | `false` | Да |

Примечания:

- `ozone.access_key` и `ozone.secret_key` необходимо настраивать вместе.
- Ключи `fs.s3a.*` не обрабатываются напрямую через свойства Ozone. Используйте ключи `ozone.*` или совместимые ключи `s3.*`.
- Ozone поддерживает схемы URI `s3://`, `s3a://` и `s3n://`.
- Указание только `ozone.endpoint` (или `s3.endpoint`) не включает поддержку Ozone. Необходимо задать `fs.ozone.support=true`.

## Пример конфигурации {#example-configuration}

С использованием ключей `ozone.*`:

```properties
"fs.ozone.support" = "true",
"ozone.endpoint" = "http://ozone-s3g:9878",
"ozone.access_key" = "hadoop",
"ozone.secret_key" = "hadoop",
"ozone.region" = "us-east-1",
"ozone.use_path_style" = "true"
```

С использованием совместимых псевдонимов `s3.*`:

```properties
"fs.ozone.support" = "true",
"s3.endpoint" = "http://ozone-s3g:9878",
"s3.access_key" = "hadoop",
"s3.secret_key" = "hadoop",
"s3.region" = "us-east-1",
"s3.path-style-access" = "true"
```
