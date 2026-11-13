---
{
    "title": "Aliyun OSS",
    "language": "ru",
    "description": "В этом документе описаны параметры для доступа к Alibaba Cloud OSS, которые применяются в следующих сценариях:"
}
---

В этом документе описаны параметры для доступа к Alibaba Cloud OSS, которые применяются в следующих сценариях:

- Свойства Catalog
- Свойства Table Valued Function
- Свойства Broker Load
- Свойства Export
- Свойства Outfile

## Когда настраивать доступ к OSS {#when-to-configure-oss-access}

Эти свойства задают доступ к файлам в OSS. Укажите их в операции, которая читает или записывает эти файлы:

| Сценарий | Где настроить доступ | Пример |
| --- | --- | --- |
| Напрямую запросить файл CSV, Parquet или ORC | В табличной функции `S3(...)` | Пример запроса ниже |
| Импортировать файлы OSS в существующую таблицу Doris | В `S3(...)` для `INSERT INTO ... SELECT` или в разделе `WITH S3` команды Broker Load | [Импорт данных из OSS](../../data-operate/import/data-source/aliyun-oss.md) |
| Запросить таблицы Hive, данные которых хранятся в OSS | В свойствах Catalog при выполнении `CREATE CATALOG` | [Hive Catalog](../catalogs/hive-catalog) |
| Экспортировать результаты запроса в OSS | В свойствах команды экспорта | [SELECT INTO OUTFILE](../../data-operate/export/outfile.md) |

Например, загрузите в свой бакет OSS файл `users.csv` в кодировке UTF-8 без строки заголовков:

```text
1,Alice
2,Bob
```

Убедитесь, что узлы Doris FE и BE могут подключиться к конечной точке OSS, а указанные учетные данные позволяют читать объект. Замените ниже имя бакета, путь к объекту и учетные данные. Этот запрос читает файл напрямую; создавать таблицу Doris не требуется. В нем используются имена свойств `s3.*`, совместимые с S3.

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

Ожидаемый результат для приведенного выше файла:

```text
+------+-------+
| id   | name  |
+------+-------+
|    1 | Alice |
|    2 | Bob   |
+------+-------+
```

Чтобы сохранить данные в Doris, создайте целевую таблицу и выполните `INSERT INTO ... SELECT`, как показано в приведенном выше руководстве по импорту данных из OSS. Для других операций укажите свойства подключения в соответствующей команде создания Catalog, загрузки или экспорта.

## OSS {#oss}

Doris использует S3 Client для доступа к Alibaba Cloud OSS по протоколу, совместимому с S3.

### Обзор параметров {#parameter-overview}

| Имя свойства | Прежнее имя | Описание | Значение по умолчанию |
| ------------------------------ | ---------------------------- | ------------------------------------------------------------ | ------------- |
| oss.endpoint | s3.endpoint | Конечная точка доступа к Alibaba Cloud OSS. Обратите внимание, что у OSS и OSS HDFS разные конечные точки. | Нет |
| oss.access_key | s3.access_key | OSS Access Key для аутентификации | Нет |
| oss.secret_key | s3.secret_key | OSS Secret Key, используемый вместе с Access Key | Нет |
| oss.region | s3.region | Регион Alibaba Cloud OSS | Нет |
| oss.use_path_style | s3.use_path_style | Использовать ли доступ с указанием бакета в пути. Для совместимости с MinIO и другими сервисами S3, не относящимися к AWS, рекомендуется установить true | FALSE |
| oss.connection.maximum | s3.connection.maximum | Максимальное число соединений с сервисом OSS | 50 |
| oss.connection.request.timeout | s3.connection.request.timeout | Тайм-аут запроса при подключении к сервису OSS, в миллисекундах | 3000 |
| oss.connection.timeout | s3.connection.timeout | Тайм-аут установления соединения с сервисом OSS, в миллисекундах | 1000 |

> В версиях до 3.1 используйте прежние имена.

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

* Рекомендуется использовать префикс `oss.` в именах параметров конфигурации для единообразия и ясной связи с Alibaba Cloud OSS.
* Для версий до 3.1 используйте прежний префикс `s3.`.
* Рекомендуется задавать `oss.region`: это может повысить точность и производительность доступа.
* Параметры пула соединений можно менять в зависимости от требуемого уровня параллелизма, чтобы избежать блокировки соединений.

## OSS-HDFS {#oss-hdfs}

Сервис OSS-HDFS (JindoFS) — облачное хранилище озера данных Alibaba Cloud. Благодаря единому управлению метаданными он совместим с интерфейсами файловой системы HDFS и подходит для вычислений над озерами данных в сфере больших данных и AI.

Доступ к данным в OSS-HDFS немного отличается от прямого доступа к сервисам OSS. Подробности приведены в этом документе.

### Обзор параметров {#parameter-overview-1}

| Имя свойства | Прежнее имя | Описание | Значение по умолчанию | Обязательный параметр |
| ------------------------------ |----------------| ----------------------------------------------------------- | ------------- | -------- |
| oss.hdfs.endpoint | oss.endpoint | Конечная точка сервиса Alibaba Cloud OSS-HDFS, например `cn-hangzhou.oss-dls.aliyuncs.com`. | Нет | Да |
| oss.hdfs.access_key | oss.access_key | OSS Access Key для аутентификации | Нет | Да |
| oss.hdfs.secret_key | oss.secret_key | OSS Secret Key, используемый вместе с Access Key | Нет | Да |
| oss.hdfs.region | oss.region | Идентификатор региона, в котором находится бакет OSS, например `cn-beijing`. | Нет | Да |
| oss.hdfs.fs.defaultFS |                | Поддерживается в версии 3.1. Задает путь доступа к файловой системе OSS, например `oss://my-bucket/`. | Нет | Нет |
| oss.hdfs.hadoop.config.resources |                | Поддерживается в версии 3.1. Задает путь к конфигурации файловой системы OSS. Путь должен быть относительным. Каталог по умолчанию — `/plugins/hadoop_conf/` в каталоге установки FE/BE (его можно изменить с помощью hadoop_config_dir в fe.conf/be.conf). На всех узлах FE и BE необходимо указать одинаковый относительный путь. Пример: `hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml`. | Нет | Нет |
| fs.oss-hdfs.support |oss.hdfs.enabled  | Поддерживается в версии 3.1. Явно включает функциональность OSS-HDFS. Необходимо установить true | Нет | Нет |

> Для версий до 3.1 используйте прежние имена.

### Настройка конечной точки {#endpoint-configuration}

`oss.hdfs.endpoint`: задает конечную точку сервиса OSS-HDFS.

Конечная точка — это адрес для доступа к Alibaba Cloud OSS в формате `<region>.oss-dls.aliyuncs.com`, например `cn-hangzhou.oss-dls.aliyuncs.com`.

Формат строго проверяется на соответствие формату конечных точек Alibaba Cloud OSS.

Для обратной совместимости в значении конечной точки допускаются префиксы https:// и http://. При проверке формата система автоматически выделяет и игнорирует часть с протоколом.

При использовании прежних имен система определяет, относится ли сервис к OSS-HDFS, по наличию `oss-dls` в значении `endpoint`.

Начиная с версии 4.1.5 пути к XML-файлам в `oss.hdfs.hadoop.config.resources` не должны содержать сегмент родительского каталога `..`. Проверяются пути как с прямой, так и с обратной косой чертой в качестве разделителя. Используйте обычные пути к файлам.

### Файлы конфигурации {#configuration-files}

> Поддерживается в версии 3.1

OSS-HDFS позволяет указать расположение файлов конфигурации HDFS с помощью параметра `oss.hdfs.hadoop.config.resources`.

Каталог конфигурации должен содержать файлы `hdfs-site.xml` и `core-site.xml`. По умолчанию используется каталог `/plugins/hadoop_conf/` в каталоге установки FE/BE. На всех узлах FE и BE необходимо указать одинаковый относительный путь.

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
