---
{
    "title": "Aliyun OSS",
    "language": "ru",
    "description": "В этом документе описаны параметры, необходимые для доступа к Alibaba Cloud OSS. Они применяются в следующих сценариях:"
}
---

В этом документе описаны параметры, необходимые для доступа к Alibaba Cloud OSS. Они применяются в следующих сценариях:

- Свойства Catalog
- Свойства табличной функции (Table Valued Function)
- Свойства Broker Load
- Свойства экспорта
- Свойства Outfile

## Когда настраивать доступ к OSS {#when-to-configure-oss-access}

Эти свойства задают доступ к файлам в OSS. Указывайте их в операции, которая читает или записывает файлы:

| Сценарий | Где настроить доступ | Пример |
| --- | --- | --- |
| Прямой запрос к файлу CSV, Parquet или ORC | В табличной функции `S3(...)` | Пример запроса ниже |
| Импорт файлов из OSS в существующую таблицу Doris | В `S3(...)` для `INSERT INTO ... SELECT` или в предложении `WITH S3` команды Broker Load | [Импорт данных из OSS](../../data-operate/import/data-source/aliyun-oss.md) |
| Запрос к таблицам Hive, данные которых хранятся в OSS | В свойствах каталога при выполнении `CREATE CATALOG` | [Hive Catalog](../catalogs/hive-catalog) |
| Экспорт результатов запроса в OSS | В свойствах команды экспорта | [SELECT INTO OUTFILE](../../data-operate/export/outfile.md) |

Например, загрузите в свой бакет OSS файл `users.csv` в кодировке UTF-8 без строки заголовка:

```text
1,Alice
2,Bob
```

Убедитесь, что узлы Doris FE и BE могут подключиться к конечной точке OSS, а указанные учётные данные позволяют читать объект. Замените ниже имя бакета, путь к объекту и учётные данные. Этот запрос читает файл напрямую; создавать таблицу Doris не требуется. В нём используются имена свойств `s3.*`, совместимые с S3.

```sql
SELECT id, name
FROM S3(
    "uri" = "s3://your-bucket/users.csv",
    "format" = "csv",
    "s3.endpoint" = "oss-cn-beijing.aliyuncs.com",
    "s3.region" = "cn-beijing",
    "s3.access_key" = "<your-access-key>",
    "s3.secret_key" = "<your-secret-key>",
    "column_separator" = ",",
    "csv_schema" = "id:int;name:string"
)
ORDER BY id;
```

Ожидаемый результат для файла выше:

```text
+------+-------+
| id   | name  |
+------+-------+
|    1 | Alice |
|    2 | Bob   |
+------+-------+
```

Чтобы сохранить данные в Doris, создайте целевую таблицу и используйте `INSERT INTO ... SELECT`, как показано в руководстве по импорту данных из OSS, ссылка на которое приведена выше. Для других операций указывайте свойства подключения в соответствующей команде создания каталога, загрузки или экспорта.

## OSS {#oss}

Doris использует S3 Client для доступа к Alibaba Cloud OSS по протоколу, совместимому с S3.

### Обзор параметров {#parameter-overview}

| Имя свойства | Прежнее имя | Описание | Значение по умолчанию |
| --- | --- | --- | --- |
| oss.endpoint | s3.endpoint | Конечная точка OSS для доступа к Alibaba Cloud OSS. Обратите внимание: у OSS и OSS HDFS разные конечные точки. | Не задано |
| oss.access_key | s3.access_key | OSS Access Key для аутентификации | Не задано |
| oss.secret_key | s3.secret_key | OSS Secret Key, используемый вместе с Access Key | Не задано |
| oss.region | s3.region | Регион Alibaba Cloud OSS | Не задано |
| oss.use_path_style | s3.use_path_style | Использовать ли адресацию по пути. Для совместимости с MinIO и другими сервисами S3, отличными от AWS, рекомендуется установить значение true | FALSE |
| oss.connection.maximum | s3.connection.maximum | Максимальное число подключений к сервису OSS | 50 |
| oss.connection.request.timeout | s3.connection.request.timeout | Время ожидания запроса при подключении к сервису OSS, в миллисекундах | 3000 |
| oss.connection.timeout | s3.connection.timeout | Время ожидания при установлении подключения к сервису OSS, в миллисекундах | 1000 |

> Для версий до 3.1 используйте прежние имена.

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

* Рекомендуется использовать префикс `oss.` в именах параметров конфигурации, чтобы они ясно указывали на Alibaba Cloud OSS.
* Для версий до 3.1 используйте прежние имена с префиксом `s3.`.
* Параметр `oss.region` рекомендуется задавать: он может повысить точность и производительность доступа.
* Параметры пула подключений можно настроить в соответствии с требованиями к параллельной работе, чтобы избежать блокировки подключений.

## OSS-HDFS {#oss-hdfs}

Сервис OSS-HDFS (JindoFS) — это функция облачного хранилища Alibaba Cloud для озёр данных. Благодаря единому управлению метаданными он совместим с интерфейсами файловой системы HDFS и подходит для вычислений в озёрах данных в области больших данных и AI.

Доступ к данным в OSS-HDFS немного отличается от прямого доступа к сервису OSS. Подробности приведены в этом документе.

### Обзор параметров {#parameter-overview-1}

| Имя свойства | Прежнее имя | Описание | Значение по умолчанию | Обязательный параметр |
| --- | --- | --- | --- | --- |
| oss.hdfs.endpoint | oss.endpoint | Конечная точка сервиса Alibaba Cloud OSS-HDFS, например `cn-hangzhou.oss-dls.aliyuncs.com`. | Не задано | Да |
| oss.hdfs.access_key | oss.access_key | OSS Access Key для аутентификации | Не задано | Да |
| oss.hdfs.secret_key | oss.secret_key | OSS Secret Key, используемый вместе с Access Key | Не задано | Да |
| oss.hdfs.region | oss.region | ID региона, в котором расположен бакет OSS, например `cn-beijing`. | Не задано | Да |
| oss.hdfs.fs.defaultFS | | Поддерживается в версии 3.1. Задаёт путь доступа к файловой системе OSS, например `oss://my-bucket/`. | Не задано | Нет |
| oss.hdfs.hadoop.config.resources | | Поддерживается в версии 3.1. Задаёт путь к конфигурации файловой системы OSS. Требуется относительный путь. Каталог по умолчанию — `/plugins/hadoop_conf/` внутри каталога развёртывания (FE/BE); его можно изменить с помощью параметра hadoop_config_dir в fe.conf/be.conf. На всех узлах FE и BE необходимо указать одинаковый относительный путь. Пример: `hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml`. | Не задано | Нет |
| fs.oss-hdfs.support | oss.hdfs.enabled | Поддерживается в версии 3.1. Явно включает функцию OSS-HDFS. Необходимо установить значение true | Не задано | Нет |

> Для версий до 3.1 используйте прежние имена.

### Настройка конечной точки {#endpoint-configuration}

`oss.hdfs.endpoint`: задаёт конечную точку сервиса OSS-HDFS.

Конечная точка — это адрес для доступа к Alibaba Cloud OSS в формате `<region>.oss-dls.aliyuncs.com`, например `cn-hangzhou.oss-dls.aliyuncs.com`.

Формат конечной точки строго проверяется на соответствие формату конечных точек Alibaba Cloud OSS.

Для обратной совместимости в значении конечной точки допускаются префиксы https:// и http://. При проверке формата система автоматически распознаёт и игнорирует часть с протоколом.

При использовании прежних имён система определяет, относится ли сервис к OSS-HDFS, по наличию `oss-dls` в значении `endpoint`.

Начиная с версии 4.1.5 пути к XML-файлам в `oss.hdfs.hadoop.config.resources` не должны содержать сегмент родительского каталога `..`. Проверяются пути как с прямой, так и с обратной косой чертой в качестве разделителя. Используйте обычные пути к файлам.

### Файлы конфигурации {#configuration-files}

> Поддерживается в версии 3.1

OSS-HDFS позволяет задавать расположение файлов конфигурации HDFS с помощью параметра `oss.hdfs.hadoop.config.resources`.

Каталог конфигурации должен содержать файлы `hdfs-site.xml` и `core-site.xml`. По умолчанию используется каталог `/plugins/hadoop_conf/` внутри каталога развёртывания (FE/BE). На всех узлах FE и BE необходимо указать одинаковый относительный путь.

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
