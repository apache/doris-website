---
{
    "title": "Iceberg JDBC Catalog",
    "language": "ru",
    "description": "В этом документе описаны поддерживаемые параметры подключения к службам метаданных Iceberg Catalog и доступа к ним через интерфейс JDBC."
}
---

В этом документе описаны поддерживаемые параметры подключения к службам метаданных Iceberg Catalog и доступа к ним через интерфейс JDBC с помощью оператора `CREATE CATALOG`.

:::tip Примечание
Это экспериментальная функция, доступная начиная с версии 4.1.0.
:::

## Обзор параметров {#parameter-overview}

| Имя свойства | Описание | Значение по умолчанию | Обязательное |
| --- | --- | --- | --- | 
| iceberg.jdbc.uri | Указывает URI подключения JDBC | - | Да |
| iceberg.jdbc.catalog_name | Указывает ключ изоляции `catalog_name` в таблицах метаданных Iceberg JDBC. Это значение может отличаться от имени каталога в Doris. | - | Да |
| iceberg.jdbc.user | Имя пользователя для подключения JDBC | - | Нет |
| iceberg.jdbc.password | Пароль для подключения JDBC | - | Нет |
| warehouse | Указывает хранилище Iceberg | - | Да |
| iceberg.jdbc.init-catalog-tables | Нужно ли автоматически инициализировать структуры таблиц, связанных с Catalog, при первом использовании | `true` | Нет |
| iceberg.jdbc.schema-version | Версия схемы, используемая JDBC Catalog; поддерживаются `V0` и `V1` | `V0` | Нет |
| iceberg.jdbc.strict-mode | Нужно ли включать строгий режим, в котором выполняется более строгая проверка метаданных | `false` | Нет |
| iceberg.jdbc.driver_class | Имя класса драйвера JDBC, например `org.postgresql.Driver`, `com.mysql.cj.jdbc.Driver` и т. д. | - | Нет |
| iceberg.jdbc.driver_url | Путь к JAR-файлу драйвера JDBC | - | Нет |

> Примечание:
>
> 1. Iceberg JDBC Catalog поддерживает различные реляционные базы данных в качестве внутреннего хранилища, включая PostgreSQL, MySQL, SQLite и другие.
>
> 2. Убедитесь, что JAR-файл драйвера JDBC доступен. Расположение драйвера можно указать с помощью `iceberg.jdbc.driver_url`.
>
> 3. `iceberg.jdbc.catalog_name` должно совпадать с именем Iceberg JDBC Catalog, используемым средством записи, например `spark_catalog` для метаданных, записанных Spark.
>
> 4. Если указан параметр `iceberg.jdbc.driver_url`, необходимо также указать `iceberg.jdbc.driver_class`.

Начиная с версии 4.1.5, при создании или изменении Catalog расположение драйвера JDBC проверяется по единым правилам. Значение без схемы URI должно быть именем файла, соответствующим шаблону `[A-Za-z0-9._-]+.jar`; для абсолютного пути используйте `file:///...`. Путь после URL-декодирования не должен содержать сегмент `..`, указывающий на родительский каталог. По-прежнему действуют ограничения безопасности для путей к драйверам и ограничения списка разрешённых URL.

## Примеры конфигураций {#example-configurations}

### PostgreSQL в качестве хранилища метаданных {#postgresql-as-metadata-storage}

Использование базы данных PostgreSQL для хранения метаданных Iceberg:

```sql
CREATE CATALOG iceberg_jdbc_postgresql PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'jdbc',
    'iceberg.jdbc.catalog_name' = 'iceberg_jdbc_postgresql',
    'iceberg.jdbc.uri' = 'jdbc:postgresql://127.0.0.1:5432/iceberg_db',
    'iceberg.jdbc.user' = 'iceberg_user',
    'iceberg.jdbc.password' = 'password',
    'iceberg.jdbc.init-catalog-tables' = 'true',
    'iceberg.jdbc.schema-version' = 'V1',
    'iceberg.jdbc.driver_class' = 'org.postgresql.Driver',
    'iceberg.jdbc.driver_url' = '<jdbc_driver_jar>',
    'warehouse' = 's3://bucket/warehouse',
    's3.access_key' = '<ak>',
    's3.secret_key' = '<sk>',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1'
);
```

### MySQL в качестве хранилища метаданных {#mysql-as-metadata-storage}

Использование базы данных MySQL для хранения метаданных Iceberg:

```sql
CREATE CATALOG iceberg_jdbc_mysql PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'jdbc',
    'iceberg.jdbc.catalog_name' = 'iceberg_jdbc_mysql',
    'iceberg.jdbc.uri' = 'jdbc:mysql://127.0.0.1:3306/iceberg_db',
    'iceberg.jdbc.user' = 'iceberg_user',
    'iceberg.jdbc.password' = 'password',
    'iceberg.jdbc.init-catalog-tables' = 'true',
    'iceberg.jdbc.schema-version' = 'V1',
    'iceberg.jdbc.driver_class' = 'com.mysql.cj.jdbc.Driver',
    'iceberg.jdbc.driver_url' = '<jdbc_driver_jar>',
    'warehouse' = 's3://bucket/warehouse',
    's3.access_key' = '<ak>',
    's3.secret_key' = '<sk>',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1'
);
```

### SQLite в качестве хранилища метаданных {#sqlite-as-metadata-storage}

Использование базы данных SQLite для хранения метаданных Iceberg (подходит для тестовых сред):

```sql
CREATE CATALOG iceberg_jdbc_sqlite PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'jdbc',
    'iceberg.jdbc.catalog_name' = 'iceberg_jdbc_sqlite',
    'iceberg.jdbc.uri' = 'jdbc:sqlite:/tmp/iceberg_catalog.db',
    'iceberg.jdbc.init-catalog-tables' = 'true',
    'iceberg.jdbc.schema-version' = 'V1',
    'iceberg.jdbc.driver_class' = 'org.sqlite.JDBC',
    'iceberg.jdbc.driver_url' = '<jdbc_driver_jar>',
    'warehouse' = 's3://bucket/warehouse',
    's3.access_key' = '<ak>',
    's3.secret_key' = '<sk>',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1'
);
```
