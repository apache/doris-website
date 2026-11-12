---
{
    "title": "ADD BROKER",
    "language": "ru",
    "description": "Этот оператор используется для добавления одного или нескольких узлов BROKER."
}
---

## Описание {#description}

Этот оператор используется для добавления одного или нескольких узлов BROKER.

## Синтаксис {#syntax}

```sql
ALTER SYSTEM ADD BROKER <broker_name> "<host>:<ipc_port>" [, "<host>:<ipc_port>" [, ... ] ];
```

## Обязательные параметры {#required-parameters}

**1. `<broker_name>`**

Имя, присваиваемое добавляемому процессу broker. Рекомендуется использовать одинаковое значение broker_name в пределах одного кластера.

**2. `<host>`**

IP-адрес узла, на котором необходимо добавить процесс broker. Если использование FQDN включено, укажите FQDN узла.

**3. `<ipc_port>`**

Порт узла, на котором необходимо добавить процесс broker. Значение этого порта по умолчанию составляет 8000.


## Требования к правам доступа {#access-control-requirements}
Пользователю, выполняющему эту операцию, необходимо разрешение NODE_PRIV.

## Примеры {#examples}

1. Добавление двух узлов Broker

    ```sql
    ALTER SYSTEM ADD BROKER broker1 "host1:port", "host2:port";
    ```
2. Добавление узла Broker с использованием FQDN

    ```sql
    ALTER SYSTEM ADD BROKER broker1 "broker_fqdn1:port";
    ```
