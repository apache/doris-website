---
{
    "title": "Aliyun OSS",
    "language": "ru",
    "description": "В этом документе описаны параметры доступа к Alibaba Cloud OSS, применимые в следующих сценариях:"
}
---

В этом документе описаны параметры доступа к Alibaba Cloud OSS, применимые в следующих сценариях:

- Свойства Catalog
- Свойства Table Valued Function
- Свойства Broker Load
- Свойства Export
- Свойства Outfile

## OSS {#oss}

Doris использует S3 Client для доступа к Alibaba Cloud OSS по S3-совместимому протоколу.

### Обзор параметров {#parameter-overview}

| Имя свойства                   | Прежнее имя                  | Описание                                                     | Значение по умолчанию |
| ------------------------------ | ---------------------------- | ------------------------------------------------------------ | ------------- |
| oss.endpoint                   | s3.endpoint                  | Конечная точка OSS, задающая адрес доступа к Alibaba Cloud OSS. Обратите внимание: у OSS и OSS HDFS разные конечные точки. | Нет           |
| oss.access_key                 | s3.access_key                | Access Key OSS для аутентификации                             | Нет           |
| oss.secret_key                 | s3.secret_key                | Secret Key OSS, используемый вместе с Access Key              | Нет           |
| oss.region                     | s3.region                    | Регион OSS, задающий регион Alibaba Cloud OSS                 | Нет           |
| oss.use_path_style             | s3.use_path_style            | Использовать ли доступ в стиле path-style. Для совместимости с MinIO и другими сервисами S3, отличными от AWS, рекомендуется установить значение true | FALSE         |
| oss.connection.maximum         | s3.connection.maximum        | Максимальное количество соединений, устанавливаемых с сервисом OSS | 50            |
| oss.connection.request.timeout | s3.connection.request.timeout| Время ожидания запроса (в миллисекундах) при подключении к сервису OSS | 3000          |
| oss.connection.timeout         | s3.connection.timeout        | Время ожидания установления соединения (в миллисекундах) с сервисом OSS | 1000          |

> В версиях до 3.1 используйте прежнее имя.

## Пример конфигурации {#example-configuration}

```properties
"oss.access_key" = "your-access-key",
"oss.secret_key" = "your-secret-key",
"oss.endpoint" = "oss-cn-beijing.aliyuncs.com",
"oss.region" = "cn-beijing"
```

Для версий до 3.1:

```
"s3.access_key" = "your-access-key",
"s3.secret_key" = "your-secret-key",
"s3.endpoint" = "oss-cn-beijing.aliyuncs.com",
"s3.region" = "cn-beijing"
```

### Рекомендации по использованию {#usage-recommendations}

* Для единообразия и ясности конфигурации Alibaba Cloud OSS рекомендуется использовать префикс `oss.` в именах параметров.
* В версиях до 3.1 используйте прежний префикс `s3.`.
* Рекомендуется задать `oss.region`: это позволяет точнее определять адрес доступа и повысить производительность.
* Параметры пула соединений можно настроить с учётом требований к параллельной работе, чтобы избежать блокировки соединений.

## OSS-HDFS {#oss-hdfs}

Сервис OSS-HDFS (сервис JindoFS) предоставляет облачное хранилище для озера данных в Alibaba Cloud. Благодаря единому управлению метаданными он совместим с интерфейсами файловой системы HDFS и подходит для вычислений в озере данных в области больших данных и ИИ.

Доступ к данным, хранящимся в OSS-HDFS, несколько отличается от прямого доступа к сервисам OSS. Подробности приведены в этом документе.

### Обзор параметров {#parameter-overview-1}

| Имя свойства                   | Прежнее имя    | Описание                                                    | Значение по умолчанию | Обязательный |
| ------------------------------ |----------------| ----------------------------------------------------------- | ------------- | -------- |
| oss.hdfs.endpoint              | oss.endpoint   | Конечная точка сервиса Alibaba Cloud OSS-HDFS, например `cn-hangzhou.oss-dls.aliyuncs.com`. | Нет           | Да       |
| oss.hdfs.access_key            | oss.access_key | Access Key OSS для аутентификации                            | Нет           | Да       |
| oss.hdfs.secret_key            | oss.secret_key | Secret Key OSS, используемый вместе с Access Key             | Нет           | Да       |
| oss.hdfs.region                | oss.region     | Идентификатор региона, в котором находится бакет OSS, например `cn-beijing`. | Нет           | Да       |
| oss.hdfs.fs.defaultFS          |                | Поддерживается в версии 3.1. Задаёт путь доступа к файловой системе OSS, например `oss://my-bucket/`. | Нет           | Нет      |
| oss.hdfs.hadoop.config.resources |                | Поддерживается в версии 3.1. Задаёт путь к конфигурации файловой системы OSS. Требуется относительный путь. По умолчанию используется каталог `/plugins/hadoop_conf/` внутри каталога развёртывания (FE/BE). Его можно изменить с помощью hadoop_config_dir в fe.conf/be.conf. На всех узлах FE и BE необходимо настроить одинаковый относительный путь. Пример: `hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml`. | Нет           | Нет      |
| fs.oss-hdfs.support              |oss.hdfs.enabled  | Поддерживается в версии 3.1. Явно включает функциональность OSS-HDFS. Необходимо установить значение true | Нет           | Нет      |

> В версиях до 3.1 используйте прежние имена.

### Настройка конечной точки {#endpoint-configuration}

`oss.hdfs.endpoint`: задаёт конечную точку сервиса OSS-HDFS.

Конечная точка представляет собой адрес доступа к Alibaba Cloud OSS в формате `<region>.oss-dls.aliyuncs.com`, например `cn-hangzhou.oss-dls.aliyuncs.com`.

Формат строго проверяется на соответствие формату конечных точек Alibaba Cloud OSS.

Для обратной совместимости в настройке конечной точки допускаются префиксы https:// и http://. При проверке формата система автоматически распознаёт и игнорирует часть, обозначающую протокол.

При использовании прежних имён система определяет, относится ли конечная точка к сервису OSS-HDFS, проверяя, содержит ли `endpoint` строку `oss-dls`.

Начиная с версии 4.1.5, пути к XML-файлам в `oss.hdfs.hadoop.config.resources` не должны содержать сегмент родительского каталога `..`. Проверяются разделители как в виде прямой, так и в виде обратной косой черты. Используйте обычные пути к файлам.

### Файлы конфигурации {#configuration-files}

> Поддерживается в версии 3.1

OSS-HDFS позволяет указывать каталоги файлов конфигурации HDFS с помощью параметра `oss.hdfs.hadoop.config.resources`.

Каталог конфигурации должен содержать файлы `hdfs-site.xml` и `core-site.xml`. По умолчанию используется каталог `/plugins/hadoop_conf/` внутри каталога развёртывания (FE/BE). На всех узлах FE и BE необходимо настроить одинаковый относительный путь.

Если файлы конфигурации содержат параметры, перечисленные выше в этом документе, приоритет имеют значения, явно заданные пользователем. Можно указать несколько файлов через запятую, например `hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml`.

### Пример конфигурации {#example-configuration-1}

```properties
"fs.oss-hdfs.support" = "true",
"oss.hdfs.access_key" = "your-access-key",
"oss.hdfs.secret_key" = "your-secret-key",
"oss.hdfs.endpoint" = "cn-hangzhou.oss-dls.aliyuncs.com",
"oss.hdfs.region" = "cn-hangzhou"
```

Для версий до 3.1:

```
"oss.hdfs.enabled" = "true",
"oss.access_key" = "your-access-key",
"oss.secret_key" = "your-secret-key",
"oss.endpoint" = "cn-hangzhou.oss-dls.aliyuncs.com",
"oss.region" = "cn-hangzhou"
```
