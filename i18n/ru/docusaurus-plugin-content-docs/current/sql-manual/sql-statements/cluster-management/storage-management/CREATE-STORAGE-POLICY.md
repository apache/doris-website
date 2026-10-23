---
{
    "title": "CREATE STORAGE POLICY",
    "language": "ru",
    "description": "Чтобы создать политику хранения, сначала необходимо создать ресурс хранения,"
}
---

## Описание {#description}

Чтобы создать политику хранения, сначала необходимо создать ресурс хранения, а затем при создании политики миграции указать имя созданного ресурса хранения. Подробнее см. раздел RESOURCE.

## Синтаксис {#syntax}

```sql
CREATE STORAGE POLICY <policy_name>
PROPERTIES(
    "storage_resource" = "<storage_resource_name>"
    [{, "cooldown_datetime" = "<cooldown_datetime>"
    | , "cooldown_ttl" = "<cooldown_ttl>"}]
);
```

## Обязательные параметры {#required-parameters}

1. `<policy_name>`: Имя создаваемой политики хранения
2. `<storage_resource_name>`: Имя связанного ресурса хранения. Подробнее о его создании см. раздел RESOURCE

## Необязательные параметры {#optional-parameters}

1. `<cooldown_datetime>`: Задаёт момент перевода данных в холодное хранилище при создании политики миграции данных
2. `<cooldown_ttl>`: Задаёт срок хранения горячих данных при создании политики миграции данных

## Требования к правам доступа {#access-control-requirements}

Для успешного выполнения этой команды SQL необходимы права ADMIN_PRIV. См. документацию по правам доступа.

| Право      | Объект                               | Примечания                      |
| :--------- | :----------------------------------- | :------------------------------ |
| ADMIN_PRIV | Права на управление всем кластером   | Все права, кроме NODE_PRIV      |

## Примеры {#examples}

1. Создание политики миграции данных с заданным временем перевода данных в холодное хранилище.

    ```sql
    CREATE STORAGE POLICY testPolicy
    PROPERTIES(
    "storage_resource" = "s3",
    "cooldown_datetime" = "2022-06-08 00:00:00"
    );
    ```

2. Создание политики миграции данных с заданным сроком хранения горячих данных

    ```sql
    CREATE STORAGE POLICY testPolicy
    PROPERTIES(
    "storage_resource" = "s3",
    "cooldown_ttl" = "1d"
    );
    ```
