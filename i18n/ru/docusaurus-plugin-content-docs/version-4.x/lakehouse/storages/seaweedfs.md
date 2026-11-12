---
{
    "title": "SeaweedFS | Хранилища",
    "language": "ru",
    "description": "В этом документе описаны параметры доступа к SeaweedFS, применяемые в следующих сценариях:",
    "sidebar_label": "SeaweedFS"
}
---

# SeaweedFS {#seaweedfs}

В этом документе описаны параметры доступа к [SeaweedFS](https://seaweedfs.com/), применяемые в следующих сценариях:

- Свойства Catalog
- Свойства Table Valued Function
- Свойства Broker Load
- Свойства Export
- Свойства Outfile

**Doris использует S3 Client для доступа к SeaweedFS по S3-совместимому протоколу.** На этой странице рассматриваются обычные бакеты SeaweedFS S3. Сведения о таблицах Iceberg, хранящихся в SeaweedFS S3 Table Buckets (REST Catalog и S3 обслуживаются одним процессом `weed`), см. в разделе [Интеграция с SeaweedFS](../best-practices/doris-seaweedfs.md).

## Быстрый запуск с `weed mini` {#quick-start-with-weed-mini}

`weed mini` запускает конечную точку SeaweedFS S3 в одном процессе, задавая учётные данные и создавая бакет на основе переменных окружения:

```bash
AWS_ACCESS_KEY_ID=admin \
AWS_SECRET_ACCESS_KEY=secret \
S3_BUCKET=my-bucket \
weed mini -dir=/data
```

После запуска конечная точка S3 доступна по адресу `http://localhost:8333`, бакет `my-bucket` уже создан, а `admin` / `secret` используются как действительные учётные данные. Сведения об использовании Docker, нестандартных портов, нескольких бакетов и обратного прокси см. в разделе [Быстрый запуск с `weed mini`](https://github.com/seaweedfs/seaweedfs/wiki/Quick-Start-with-weed-mini).

## Обзор параметров {#parameter-overview}

Доступ к SeaweedFS осуществляется по S3-совместимому протоколу, поэтому используются те же свойства `s3.*`, что и для AWS S3.

| Имя свойства                    | Описание                                                                                             | По умолчанию | Обязательное |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- | ------- | -------- |
| s3.endpoint                     | Конечная точка шлюза SeaweedFS S3, например `http://seaweedfs.example.com:8333`                         |         | Да       |
| s3.access_key                   | Ключ доступа, заданный в конфигурации IAM для SeaweedFS S3                                             |         | Да       |
| s3.secret_key                   | Секретный ключ, соответствующий `s3.access_key`                                                       |         | Да       |
| s3.region                       | Регион. SeaweedFS не проверяет это значение, но AWS S3 SDK требует его указать, например `us-east-1`  |         | Да       |
| s3.use_path_style               | Установите значение `true`. SeaweedFS предоставляет объекты по адресам `http://<endpoint>/<bucket>/<key>` | FALSE   | Нет      |
| s3.connection.maximum           | Максимальное количество соединений со шлюзом SeaweedFS S3                                            | 50      | Нет      |
| s3.connection.request.timeout   | Время ожидания запроса в миллисекундах                                                                | 3000    | Нет      |
| s3.connection.timeout           | Время ожидания установления соединения в миллисекундах                                                | 1000    | Нет      |

### Использование доступа path-style {#using-path-style-access}

SeaweedFS использует адресацию path-style (`http://<endpoint>/<bucket>/<key>`) и не создаёт отдельные поддомены DNS для бакетов, поэтому задайте `s3.use_path_style = true` для каждого соединения.

## Пример конфигурации {#example-configuration}

```properties
"s3.access_key" = "your-access-key",
"s3.secret_key" = "your-secret-key",
"s3.endpoint" = "http://seaweedfs.example.com:8333",
"s3.region" = "us-east-1",
"s3.use_path_style" = "true"
```

## Рекомендации по использованию {#usage-recommendations}

* Задайте `s3.use_path_style = true`. SeaweedFS не использует отдельные поддомены DNS для бакетов.
* `s3.region` требуется для AWS S3 SDK, но игнорируется SeaweedFS: подойдёт любое непустое значение.
* Для HTTPS настройте завершение TLS на обратном прокси и запустите `weed` с `-s3.externalUrl=https://<proxy>`, чтобы проверка подписи S3 работала корректно.
* Сведения о таблицах Iceberg в SeaweedFS S3 Table Buckets см. в разделе [Интеграция с SeaweedFS](../best-practices/doris-seaweedfs.md).
