---
{
    "title": "Paimon JDBC Catalog",
    "language": "ru",
    "description": "В этом документе описаны параметры, поддерживаемые при подключении к службам метаданных Paimon Catalog и доступе к ним через интерфейс JDBC."
}
---

В этом документе описаны параметры, поддерживаемые при подключении к службам метаданных Paimon Catalog и доступе к ним через интерфейс JDBC с помощью оператора `CREATE CATALOG`.

:::tip Примечание
Это экспериментальная функция, поддерживаемая начиная с версии 4.1.0.
:::

## Обзор параметров {#parameter-overview}

| Имя свойства | Описание | Значение по умолчанию | Обязателен |
| --- | --- | --- | --- | 
| paimon.jdbc.uri | Указывает URI подключения JDBC | - | Да |
| paimon.jdbc.user | Имя пользователя для подключения JDBC | - | Да |
| paimon.jdbc.password | Пароль для подключения JDBC | - | Да |
| warehouse | Указывает хранилище Paimon | - | Да |
| paimon.jdbc.driver_class | Имя класса драйвера JDBC, например `org.postgresql.Driver`, `com.mysql.cj.jdbc.Driver` и т. д. | - | Нет |
| paimon.jdbc.driver_url | Путь к JAR-файлу драйвера JDBC | - | Нет |

> Примечание:
>
> 1. Paimon JDBC Catalog поддерживает различные реляционные базы данных в качестве внутреннего хранилища, включая PostgreSQL, MySQL и другие.
>
> 2. Убедитесь, что JAR-файл драйвера JDBC доступен. Расположение драйвера можно указать с помощью `paimon.jdbc.driver_url`.

Начиная с версии 4.1.5, при создании или изменении Catalog расположение драйвера JDBC проверяется по единым правилам. Значение без схемы URI должно быть именем файла, соответствующим шаблону `[A-Za-z0-9._-]+.jar`; для абсолютного пути используйте `file:///...`. После URL-декодирования путь не должен содержать сегмент `..`, обозначающий родительский каталог. Существующие ограничения, связанные с безопасностью путей к драйверам и списком разрешённых URL, по-прежнему действуют.

## Примеры конфигураций {#example-configurations}

### PostgreSQL в качестве хранилища метаданных {#postgresql-as-metadata-storage}

Использование базы данных PostgreSQL для хранения метаданных Paimon:

```sql
CREATE CATALOG paimon_jdbc_postgresql PROPERTIES (
    'type' = 'paimon',
    'paimon.catalog.type' = 'jdbc',
    'paimon.jdbc.uri' = 'jdbc:postgresql://127.0.0.1:5432/paimon_db',
    'paimon.jdbc.user' = 'paimon_user',
    'paimon.jdbc.password' = 'password',
    'paimon.jdbc.driver_class' = 'org.postgresql.Driver',
    'paimon.jdbc.driver_url' = '<jdbc_driver_jar>',
    'warehouse' = 's3://bucket/warehouse',
    's3.access_key' = '<ak>',
    's3.secret_key' = '<sk>',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1'
);
```

### MySQL в качестве хранилища метаданных {#mysql-as-metadata-storage}

Использование базы данных MySQL для хранения метаданных Paimon:

```sql
CREATE CATALOG paimon_jdbc_mysql PROPERTIES (
    'type' = 'paimon',
    'paimon.catalog.type' = 'jdbc',
    'paimon.jdbc.uri' = 'jdbc:mysql://127.0.0.1:3306/paimon_db',
    'paimon.jdbc.user' = 'paimon_user',
    'paimon.jdbc.password' = 'password',
    'paimon.jdbc.driver_class' = 'com.mysql.cj.jdbc.Driver',
    'paimon.jdbc.driver_url' = '<jdbc_driver_jar>',
    'warehouse' = 's3://bucket/warehouse',
    's3.access_key' = '<ak>',
    's3.secret_key' = '<sk>',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1'
);
```
