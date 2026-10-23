---
{
    "title": "DROP BROKER",
    "language": "ru",
    "description": "Эта инструкция используется для удаления узлов BROKER."
}
---

## Описание {#description}

Эта инструкция используется для удаления узлов BROKER.

## Синтаксис {#syntax}

1. Удаление всех узлов Broker
    ```sql
    ALTER SYSTEM DROP ALL BROKER broker_name;
    ```

2. Удаление одного или нескольких узлов Broker
    ```sql
    ALTER SYSTEM DROP BROKER <broker_name> "<host>:<ipc_port>"[, "<host>:<ipc_port>" [, ...] ];
    ```
## Обязательные параметры {#required-parameters}

**1. `<broker_name>`**

Имя удаляемого процесса broker.

**2. `<host>`**

IP-адрес узла, на котором расположен удаляемый процесс broker. Если включён FQDN, используйте FQDN узла.

**3. `<ipc_port>`**
Порт (PORT) узла, на котором расположен удаляемый процесс broker. Значение этого порта по умолчанию — 8000.


## Требования к правам доступа {#access-control-requirements}
Для выполнения этой операции пользователю необходимо право NODE_PRIV.

## Примеры {#examples}

1. Удаление всех узлов Broker

    ```sql
    ALTER SYSTEM DROP ALL BROKER broker_name;
    ```

2. Удаление конкретного узла Broker

    ```sql
    ALTER SYSTEM DROP BROKER broker_name "10.10.10.1:8000";
    ```
