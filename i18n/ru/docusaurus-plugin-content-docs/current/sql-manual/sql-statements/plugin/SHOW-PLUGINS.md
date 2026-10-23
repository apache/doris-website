---
{
    "title": "SHOW PLUGINS",
    "language": "ru",
    "description": "Этот оператор используется для отображения установленных плагинов"
}
---

## Описание {#description}

Этот оператор используется для отображения установленных плагинов

## Синтаксис {#syntax}

```sql
SHOW PLUGINS
```

## Возвращаемое значение {#return-value}

| Столбец | Описание |
| ------ | ----------- |
| Description | Описание плагина |
| Version | Номер версии плагина |
| JavaVersion | Номер версии Java |
| ClassName | Имя класса программы |
| SoName | Имя разделяемого объекта программы |
| Sources | Источник плагина |
| Status | Состояние установки |
| Properties | Свойства плагина  |

## Управление правами доступа {#permission-control}

Пользователь, выполняющий эту команду SQL, должен обладать как минимум следующими правами:

| Права         | Объект   | Примечания            |
|:-----------|:-----|:--------------|
| ADMIN_PRIV | Весь кластер | Требуются права администратора для всего кластера |

## Пример {#example}

- Показать установленные плагины:

    ```SQL
    SHOW PLUGINS;
    ```

    ```text
    +-------------------------------+---------+-----------------------------------------------------------+---------+-------------+------------------------------------------------------------+--------+---------+-----------+------------+
   | Name                          | Type    | Description                                               | Version | JavaVersion | ClassName                                                  | SoName | Sources | Status    | Properties |
   +-------------------------------+---------+-----------------------------------------------------------+---------+-------------+------------------------------------------------------------+--------+---------+-----------+------------+
   | __builtin_AuditLoader         | AUDIT   | builtin audit loader, to load audit log to internal table | 2.1.0   | 1.8.31      | org.apache.doris.plugin.audit.AuditLoader                  | NULL   | Builtin | INSTALLED | {}         |
   | __builtin_AuditLogBuilder     | AUDIT   | builtin audit logger                                      | 0.12.0  | 1.8.31      | org.apache.doris.plugin.audit.AuditLogBuilder              | NULL   | Builtin | INSTALLED | {}         |
   | __builtin_SqlDialectConverter | DIALECT | builtin sql dialect converter                             | 2.1.0   | 1.8.31      | org.apache.doris.plugin.dialect.HttpDialectConverterPlugin | NULL   | Builtin | INSTALLED | {}         |
   +-------------------------------+---------+-----------------------------------------------------------+---------+-------------+------------------------------------------------------------+--------+---------+-----------+------------+
    ```
