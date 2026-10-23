---
{
    "title": "ALTER RESOURCE",
    "language": "ru",
    "description": "Эта инструкция используется для изменения существующего ресурса. Изменять ресурсы могут только пользователи root или admin."
}
---

## Описание {#description}

Эта инструкция используется для изменения существующего ресурса. Изменять ресурсы могут только пользователи root или admin.

Начиная с версии 4.1.5, только root может изменять или удалять вновь созданный AI Resource, помеченный как созданный пользователем root; другие пользователи `ADMIN` не могут выполнять эти действия. Это ограничение не распространяется на ресурсы, созданные до обновления и не имеющие такой отметки. См. [Права доступа к AI Resource](../../../sql-functions/ai-functions/overview.md).

## Синтаксис {#syntax}

```sql
ALTER RESOURCE '<resource_name>'
PROPERTIES (
  `<property>`, 
  [ , ... ]
);
```

## Параметры {#parameters}

1.`<property>`

Формат `<property>` имеет вид `<key>` = `<value>`. Изменение `<value>`, когда `<key>` равно 'type', не поддерживается.

Сведения об изменяемых свойствах приведены в разделе [CREATE-RESOURCE](./CREATE-RESOURCE.md).


## Примеры {#examples}

1. Изменение рабочего каталога ресурса Spark с именем spark0:

```sql
ALTER RESOURCE 'spark0' PROPERTIES ("working_dir" = "hdfs://127.0.0.1:10000/tmp/doris_new");
```

2. Изменение максимального количества подключений к ресурсу S3 с именем remote_s3:

```sql
ALTER RESOURCE 'remote_s3' PROPERTIES ("s3.connection.maximum" = "100");
```

3. Изменение параметров ресурсов S3 для разделения горячих и холодных данных

- Поддерживаются
  - `s3.access_key`  s3 ak
  - `s3.secret_key`  s3 sk
  - `s3.session_token` токен s3
  - `s3.connection.maximum` по умолчанию 50
  - `s3.connection.timeout` по умолчанию 1000ms
  - `s3.connection.request.timeout` по умолчанию 3000ms
- Не поддерживаются
  - `s3.region`
  - `s3.bucket"`
  - `s3.root.path`
  - `s3.endpoint`

```sql
  ALTER RESOURCE "showPolicy_1_resource" PROPERTIES("s3.connection.maximum" = "1111");
```
