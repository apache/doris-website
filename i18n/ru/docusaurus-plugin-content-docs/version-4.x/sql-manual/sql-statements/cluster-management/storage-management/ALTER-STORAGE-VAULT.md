---
{
    "title": "ALTER STORAGE VAULT",
    "language": "ru",
    "description": "Изменяет свойства Storage Vault, доступные для изменения."
}
---

## Описание {#description}

Изменяет свойства Storage Vault, доступные для изменения.

## Синтаксис {#syntax}

```sql
ALTER STORAGE VAULT <storage_vault_name>
PROPERTIES (<storage_vault_property>)
```

## Обязательные параметры {#required-parameters}

**<storage_vault_property>**

> - type: допустимые значения: s3, hdfs. После 3.0.8 это поле необязательно.

>Если type имеет значение s3, допускаются следующие поля свойств:
>
>- s3.access_key: ak для хранилища s3
>- s3.secret_key: sk для хранилища s3
>- vault_name: Имя хранилища. Если хранилище назначено хранилищем по умолчанию с помощью оператора `SET <original_vault_name> DEFAULT STORAGE VAULT`, его имя изменить нельзя. Чтобы переименовать хранилище, сначала необходимо отменить назначение хранилища по умолчанию, выполнив команду `UNSET DEFAULT STORAGE VAULT`, а затем изменить его имя. После этого при необходимости можно назначить переименованное хранилище хранилищем по умолчанию с помощью оператора `SET <new_vault_name> DEFAULT STORAGE VAULT`.
>- use_path_style: Разрешено ли использование URL в формате path style. Допустимые значения: true, false. Значение по умолчанию: false.

>Если type имеет значение hdfs, допускаются следующие поля свойств:
>
>- path_prefix: Префикс пути хранения
>- fs.defaultFS: Имя hdfs

## Управление правами доступа {#permission-control}

Пользователь, выполняющий эту команду SQL, должен обладать как минимум правами ADMIN_PRIV.

## Примеры {#examples}

Изменение ak для хранилища s3

```sql
ALTER STORAGE VAULT old_vault_name
PROPERTIES (
  "type"="S3",
  "VAULT_NAME" = "new_vault_name",
   "s3.access_key" = "new_ak"
);
```

Изменение хранилища hdfs

```sql
ALTER STORAGE VAULT old_vault_name
PROPERTIES (
  "type"="hdfs",
  "VAULT_NAME" = "new_vault_name",
  "hadoop.username" = "hdfs"
);
```
