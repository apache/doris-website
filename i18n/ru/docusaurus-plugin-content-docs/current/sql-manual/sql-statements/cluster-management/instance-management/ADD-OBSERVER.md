---
{
    "title": "ADD OBSERVER",
    "language": "ru",
    "description": "Эта инструкция добавляет узел FRONTEND с ролью OBSERVER (только для администраторов!)"
}
---

## Описание {#description}

Эта инструкция добавляет узел FRONTEND с ролью OBSERVER (только для администраторов!)

## Синтаксис {#syntax}

```sql
ALTER SYSTEM ADD OBSERVER "<observer_host>:<edit_log_port>"
```

## Обязательные параметры {#required-parameters}

**1. `<observer_host>`**

> Имя хоста или IP-адрес узла FE

**2. `<edit_log_port>`**

> Порт связи bdbje узла FE, по умолчанию — 9010

## Требования к правам доступа {#access-control-requirements}

Пользователь, выполняющий эту команду SQL, должен иметь как минимум следующие права:

| Привилегия | Объект | Примечания |
|-----------|----|-------|
| NODE_PRIV |    |       |

## Примечания по использованию {#usage-notes}

1. Перед добавлением нового узла OBSERVER убедитесь, что он правильно настроен.
2. После добавления узла OBSERVER выполните команду [`SHOW FRONTENDS`](./SHOW-FRONTENDS.md), чтобы убедиться, что узел успешно добавлен и находится в нормальном состоянии.

## Примеры {#examples}

1. Добавление узла OBSERVER
   ```sql
   ALTER SYSTEM ADD OBSERVER "host_ip:9010"
   ```
   Эта команда добавляет в кластер узел OBSERVER (IP-адрес host_ip, порт 9010)
