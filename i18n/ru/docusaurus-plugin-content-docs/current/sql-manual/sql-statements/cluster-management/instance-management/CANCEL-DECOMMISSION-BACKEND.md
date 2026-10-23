---
{
    "title": "CANCEL DECOMMISSION BACKEND",
    "language": "ru",
    "description": "Этот оператор используется для отмены вывода узла BE из эксплуатации."
}
---

## Описание {#description}

Этот оператор используется для отмены вывода узла BE из эксплуатации.

:::tip
Этот оператор не поддерживается в режиме с разделением хранения и вычислений.
:::

## Синтаксис {#syntax}

```sql
CANCEL DECOMMISSION BACKEND "<be_identifier>" [, "<be_identifier>" ... ]
```

Где:

```sql
be_identifier
  : "<be_host>:<be_heartbeat_port>"
  | "<backend_id>"
```

## Обязательные параметры {#required-parameters}

**<be_host>**

> Имя хоста или IP-адрес узла BE.

**<heartbeat_port>**

> Порт heartbeat узла BE. Значение по умолчанию — 9050.

**<backend_id>**

> ID узла BE.

:::tip
`<be_host>`, `<be_heartbeat_port>` и `<backend_id>` можно получить, выполнив запрос с помощью оператора [SHOW BACKENDS](./SHOW-BACKENDS.md).
:::

## Требования к правам доступа {#access-control-requirements}

Пользователь, выполняющий этот SQL, должен иметь как минимум следующие права:

| Привилегия | Объект | Примечания |
|-----------|----|-------|
| NODE_PRIV |    |       |

## Примечания по использованию {#usage-notes}

1. После выполнения этой команды можно проверить состояние вывода из эксплуатации (значение столбца `SystemDecommissioned` равно false) и ход вывода из эксплуатации (значение столбца `TabletNum` больше не уменьшается постепенно) с помощью оператора [SHOW BACKENDS](./SHOW-BACKENDS.md).
2. Кластер будет постепенно переносить tablets с других узлов обратно на текущий BE, чтобы со временем количество tablets на каждом BE выровнялось.

## Примеры {#examples}

1. Безопасно выведите из эксплуатации два узла кластера, используя Host и HeartbeatPort узлов BE.
   ```sql
   CANCEL DECOMMISSION BACKEND "192.168.0.1:9050", "192.168.0.2:9050";
   ```

2. Безопасно выведите из эксплуатации один узел кластера, используя ID узла BE.
   ```sql
   CANCEL DECOMMISSION BACKEND "10002";
   ```
