---
{
    "title": "DROP OBSERVER",
    "language": "ru",
    "description": "Эта инструкция удаляет узел FRONTEND с ролью OBSERVER (предназначена только для администраторов!)"
}
---

## Описание {#description}

Эта инструкция удаляет узел FRONTEND с ролью OBSERVER (предназначена только для администраторов!)

## Синтаксис {#syntax}

```sql
ALTER SYSTEM DROP OBSERVER "<observer_host>:<edit_log_port>"
```

## Обязательные параметры {#required-parameters}

**1. `<observer_host>`**

> Имя хоста или IP-адрес узла FE

**2. `<edit_log_port>`**

> Порт связи bdbje узла FE, по умолчанию 9010

## Требования к правам доступа {#access-control-requirements}

Пользователь, выполняющий эту команду SQL, должен иметь как минимум следующие права:

| Привилегия | Объект | Примечания |
|-----------|----|-------|
| NODE_PRIV |    |       |

## Примечания по использованию {#usage-notes}

1. После удаления узла OBSERVER используйте команду [`SHOW FRONTENDS`](./SHOW-FRONTENDS.md), чтобы убедиться, что узел успешно удалён.

## Примеры {#examples}

1. Удаление узла OBSERVER

   ```sql
   ALTER SYSTEM DROP OBSERVER "host_ip:9010"
   ```
   Эта команда удаляет узел OBSERVER из кластера (IP-адрес host_ip, порт 9010)
