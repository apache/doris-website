---
{
    "title": "DROP BACKEND",
    "language": "ru",
    "description": "Эта инструкция используется для удаления узлов BE из кластера Doris."
}
---

## Описание {#description}

Эта инструкция используется для удаления узлов BE из кластера Doris.

## Синтаксис {#syntax}

```sql
ALTER SYSTEM DROP BACKEND "<be_identifier>" [, "<be_identifier>" ... ]
```

Здесь:

```sql
be_identifier
  : "<be_host>:<be_heartbeat_port>"
  | "<backend_id>"
```

## Обязательные параметры {#required-parameters}

**1. <be_host>**

> Имя хоста или IP-адрес узла BE.

**2. <heartbeat_port>**

> Порт heartbeat узла BE, по умолчанию 9050.

**3. <backend_id>**

> Идентификатор узла BE.

:::tip
`<be_host>`, `<be_heartbeat_port>` и `<backend_id>` можно получить, выполнив запрос с помощью инструкции [SHOW BACKENDS](./SHOW-BACKENDS.md).
:::

## Требования к правам доступа {#access-control-requirements}

Пользователь, выполняющий эту инструкцию SQL, должен иметь как минимум следующие права:

| Привилегия | Объект | Примечания |
|-----------|----|-------|
| NODE_PRIV |    |       |

## Примечания по использованию {#usage-notes}

1. Не рекомендуется использовать эту команду для вывода узла BE из эксплуатации. Она немедленно удаляет узел BE из кластера. Данные текущего узла не будут перераспределены между другими узлами BE. Если в кластере есть таблицы с единственной репликой, возможна потеря данных. Для корректного вывода узла BE из эксплуатации лучше использовать команду [DECOMMISSION BACKEND](./DECOMMISSION-BACKEND.md).
2. Эта операция сопряжена с высоким риском. Попытка выполнить команду напрямую:
   ```sql
   ALTER SYSTEM DROP BACKEND "127.0.0.1:9050";
   ```
   ```text
   ERROR 1105 (HY000): errCode = 2, detailMessage = It is highly NOT RECOMMENDED to use DROP BACKEND stmt.It is not safe to directly drop a backend. All data on this backend will be discarded permanently. If you insist, use DROPP instead of DROP
   ```
   приведёт к появлению приведённого выше предупреждения. Если вы понимаете последствия своих действий, можно заменить ключевое слово `DROP` на `DROPP` и продолжить:
   ```sql
   ALTER SYSTEM DROPP BACKEND "127.0.0.1:9050";
   ```

## Примеры {#examples}

1. Удаление двух узлов из кластера по значениям Host и HeartbeatPort узлов BE:
   ```sql
   ALTER SYSTEM DROPP BACKEND "192.168.0.1:9050", "192.168.0.2:9050";
   ```

2. Удаление одного узла из кластера по идентификатору узла BE:
    ```sql
    ALTER SYSTEM DROPP BACKEND "10002";
    ```
