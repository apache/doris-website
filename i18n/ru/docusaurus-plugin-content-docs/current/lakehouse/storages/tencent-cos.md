---
{
    "title": "Tencent COS",
    "language": "ru",
    "description": "В этом документе описаны параметры доступа к Tencent Cloud COS, применяемые в следующих сценариях:"
}
---

В этом документе описаны параметры доступа к Tencent Cloud COS, применяемые в следующих сценариях:

- Свойства Catalog
- Свойства Table Valued Function
- Свойства Broker Load
- Свойства Export
- Свойства Outfile

**Doris использует S3 Client для доступа к Tencent Cloud COS по протоколу, совместимому с S3.**

## Обзор параметров {#parameter-overview}

| Имя свойства                   | Прежнее имя              | Описание                                                     | Значение по умолчанию | Обязательный |
| ------------------------------ | ------------------------ | ------------------------------------------------------------ | ------------- | -------- |
| cos.endpoint                   | s3.endpoint              | Конечная точка COS: задаёт адрес доступа к Tencent Cloud COS |               | Да       |
| cos.access_key                 | s3.access_key            | Ключ доступа COS, используемый для аутентификации при доступе к COS |               | Да       |
| cos.secret_key                 | s3.secret_key            | Секретный ключ COS, используемый вместе с ключом доступа для аутентификации |               | Да       |
| cos.region                     | s3.region                | Регион COS: задаёт регион Tencent Cloud COS                   |               | Нет      |
| cos.connection.maximum         | s3.connection.maximum    | Максимальное количество соединений S3: задаёт максимальное число соединений с сервисом COS | 50            | Нет      |
| cos.connection.request.timeout | s3.connection.request.timeout | Тайм-аут запроса S3 в миллисекундах: задаёт время ожидания запроса при подключении к сервису COS | 3000          | Нет      |
| cos.connection.timeout         | s3.connection.timeout    | Тайм-аут соединения S3 в миллисекундах: задаёт время ожидания при установлении соединения с сервисом COS | 1000          | Нет      |

> В версиях до 3.1 используйте прежние имена параметров

## Примеры настройки {#configuration-examples}

```properties
"cos.access_key" = "your-access-key",
"cos.secret_key" = "your-secret-key",
"cos.endpoint" = "cos.ap-beijing.myqcloud.com",
"cos.region" = "ap-beijing"
```

Для версий до 3.1:

```properties
"s3.access_key" = "ak",
"s3.secret_key" = "sk",
"s3.endpoint" = "cos.ap-beijing.myqcloud.com",
"s3.region" = "ap-beijing"
```

## Рекомендации по использованию {#usage-recommendations}

* Для параметров конфигурации рекомендуется использовать префикс `cos.`, чтобы обеспечить единообразие настроек и явно обозначить их связь с Tencent Cloud COS.
* В версиях до 3.1 используйте прежний префикс `s3.`.
* Указание `cos.region` может повысить точность выбора точки доступа и производительность, поэтому рекомендуется задать этот параметр.
* Параметры пула соединений можно настраивать с учётом требований к параллелизму, чтобы избежать блокировки соединений.
