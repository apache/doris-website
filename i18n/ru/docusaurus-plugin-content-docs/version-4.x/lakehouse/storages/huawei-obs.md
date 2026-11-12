---
{
    "title": "Huawei OBS",
    "language": "ru",
    "description": "В этом документе описаны параметры, необходимые для доступа к Huawei Cloud OBS и используемые в следующих сценариях:"
}
---

В этом документе описаны параметры, необходимые для доступа к Huawei Cloud OBS и используемые в следующих сценариях:

- Свойства Catalog
- Свойства Table Valued Function
- Свойства Broker Load
- Свойства Export
- Свойства Outfile

**Doris использует S3 Client для доступа к Huawei Cloud OBS по S3-совместимому протоколу.**

## Обзор параметров {#parameter-overview}

| Имя свойства                 | Прежнее имя              | Описание                                                     | Значение по умолчанию | Обязательный |
| ---------------------------- | ------------------------ | ------------------------------------------------------------ | ------------- | -------- |
| obs.endpoint                 | s3.endpoint              | Конечная точка OBS, задающая адрес доступа к Huawei Cloud OBS |               | Да       |
| obs.access_key               | s3.access_key            | Ключ доступа OBS, используемый для аутентификации            |               | Да       |
| obs.secret_key               | s3.secret_key            | Секретный ключ OBS, используемый вместе с ключом доступа для аутентификации |               | Да       |
| obs.region                   | s3.region                | Регион OBS, задающий регион Huawei Cloud OBS                |               | Нет      |
| obs.use_path_style           | s3.use_path_style        | Использовать ли доступ в стиле path-style. Для совместимости с S3-сервисами, не относящимися к AWS, такими как MinIO/Ceph, рекомендуется установить true | FALSE         | Нет      |
| obs.connection.maximum       | s3.connection.maximum    | Максимальное количество соединений с сервисом OBS           | 50            | Нет      |
| obs.connection.request.timeout | s3.connection.request.timeout | Тайм-аут запроса при подключении к сервису OBS, в миллисекундах | 3000          | Нет      |
| obs.connection.timeout       | s3.connection.timeout    | Тайм-аут установления соединения с сервисом OBS, в миллисекундах | 1000          | Нет      |

> В версиях до 3.1 используйте прежние имена параметров

## Пример конфигурации {#example-configuration}

```properties
"obs.access_key" = "your-access-key",
"obs.secret_key" = "your-secret-key",
"obs.endpoint" = "obs.cn-north-4.myhuaweicloud.com",
"obs.region" = "cn-north-4"
```

Для версий до 3.1:

```properties
"s3.access_key" = "your-access-key",
"s3.secret_key" = "your-secret-key",
"s3.endpoint" = "obs.cn-north-4.myhuaweicloud.com",
"s3.region" = "cn-north-4",
```

## Рекомендации по использованию {#usage-recommendations}

* Рекомендуется использовать префикс `obs.` в параметрах конфигурации, чтобы настройки Huawei Cloud OBS были единообразными и понятными.
* В версиях до 3.1 используйте прежние имена с префиксом `s3.`.
* Настройка `obs.region` может повысить точность и производительность доступа, поэтому рекомендуется задавать этот параметр.
* Параметры пула соединений можно настроить в соответствии с требованиями к параллелизму, чтобы избежать блокировки соединений.
