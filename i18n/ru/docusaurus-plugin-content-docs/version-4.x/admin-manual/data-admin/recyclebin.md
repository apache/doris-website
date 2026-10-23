---
{
    "title": "Восстановление из корзины",
    "language": "ru",
    "description": "Используйте корзину Doris для восстановления баз данных, таблиц и разделов, случайно удалённых командой DROP, и предотвращения потери данных. На этой странице описан полный порядок запроса списка объектов и их восстановления.",
    "keywords": [
        "корзина Doris",
        "восстановление данных",
        "восстановление после случайного удаления",
        "RECOVER",
        "SHOW CATALOG RECYCLE BIN",
        "восстановление после DROP DATABASE",
        "восстановление после DROP TABLE",
        "восстановление после DROP PARTITION",
        "DROP FORCE",
        "корзина",
        "восстановление данных",
        "случайное удаление базы данных",
        "восстановление разделов"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Database / table / partition accidental-deletion recovery / disaster recovery -->

Чтобы предотвратить потерю данных из-за ошибочных действий, Doris предоставляет корзину, из которой можно восстановить случайно удалённые базы данных, таблицы и разделы.

При выполнении `DROP DATABASE/TABLE/PARTITION` без ключевого слова `FORCE` Doris не удаляет данные физически сразу, а перемещает базу данных, таблицу или раздел в корзину. Впоследствии с помощью команды `RECOVER` можно восстановить объект и снова сделать его видимым.

:::warning Примечание
При выполнении `DROP ... FORCE` данные немедленно удаляются физически, и восстановить их из корзины невозможно.
:::

## Сценарии использования {#applicable-scenarios}

| Сценарий | Можно восстановить | Рекомендуемое действие |
| --- | --- | --- |
| Случайно выполнена команда `DROP DATABASE example_db` | Да | `RECOVER DATABASE example_db` |
| Случайно выполнена команда `DROP TABLE example_db.example_tbl` | Да | `RECOVER TABLE example_db.example_tbl` |
| Случайно выполнена команда `ALTER TABLE ... DROP PARTITION p1` | Да | `RECOVER PARTITION p1 FROM example_tbl` |
| Случайно выполнена команда `DROP ... FORCE` | Нет | Восстановить из резервной копии |

## Предварительные условия {#prerequisites}

- У текущего пользователя есть необходимые права, например `ALTER_PRIV`, на восстанавливаемый объект.
- Команда `DROP` была выполнена без `FORCE`.
- Объект не был окончательно удалён из корзины вручную (см. [DROP-CATALOG-RECYCLE-BIN](../../sql-manual/sql-statements/recycle/DROP-CATALOG-RECYCLE-BIN)).

## Обзор процесса восстановления {#recovery-workflow-overview}

1. Выполните `SHOW CATALOG RECYCLE BIN`, чтобы запросить список объектов в корзине, доступных для восстановления.
2. Выберите подходящую команду `RECOVER` в зависимости от типа объекта (DATABASE / TABLE / PARTITION).
3. После восстановления убедитесь, что объект снова виден, а данные не повреждены.

## Запрос содержимого корзины {#query-the-recycle-bin}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Confirm that the target object exists in the recycle bin before recovery -->

Перед восстановлением убедитесь, что нужный объект всё ещё находится в корзине.

```sql
SHOW CATALOG RECYCLE BIN [WHERE NAME [= "name" | LIKE "name_matcher"]];
```

Описание параметров:

| Параметр | Описание |
| --- | --- |
| `NAME = "name"` | Фильтрация объектов в корзине по точному имени |
| `NAME LIKE "name_matcher"` | Фильтрация объектов в корзине по шаблону с подстановочными символами (поддерживаются `%` и `_`) |

Подробное описание синтаксиса и рекомендации по использованию приведены в руководстве по команде [SHOW-CATALOG-RECYCLE-BIN](../../sql-manual/sql-statements/recycle/SHOW-CATALOG-RECYCLE-BIN). Дополнительную справку также можно получить, выполнив `HELP SHOW CATALOG RECYCLE BIN` в командной строке клиента MySQL.

## Восстановление данных {#perform-data-recovery}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Data restoration after database / table / partition accidental deletion -->

Выберите одну из следующих команд в зависимости от типа восстанавливаемого объекта.

### Восстановление базы данных {#recover-a-database}

Восстановите базу данных с именем `example_db`:

```sql
RECOVER DATABASE example_db;
```

### Восстановление таблицы {#recover-a-table}

Восстановите таблицу с именем `example_tbl` в базе данных `example_db`:

```sql
RECOVER TABLE example_db.example_tbl;
```

### Восстановление раздела {#recover-a-partition}

Восстановите раздел `p1` в таблице `example_tbl`:

```sql
RECOVER PARTITION p1 FROM example_tbl;
```

Подробное описание синтаксиса `RECOVER` и рекомендации по использованию приведены в руководстве по команде [RECOVER](../../sql-manual/sql-statements/recycle/RECOVER). Дополнительную справку также можно получить, выполнив `HELP RECOVER` в командной строке клиента MySQL.

## Часто задаваемые вопросы {#faq}

### Вопрос: что делать, если `RECOVER` сообщает, что объект не существует? {#q-what-if-recover-reports-that-the-object-does-not-exist}

Объект был удалён с помощью `DROP ... FORCE`, поэтому он не попал в корзину и не может быть восстановлен из неё. Восстановите данные из резервной копии.

### Вопрос: что делать, если `SHOW CATALOG RECYCLE BIN` не возвращает нужный объект? {#q-what-if-show-catalog-recycle-bin-does-not-return-the-target-object}

Объект уже был окончательно удалён командой `DROP CATALOG RECYCLE BIN`, и восстановить его невозможно. Восстановите данные из резервной копии.

### Вопрос: что делать, если при восстановлении возникает ошибка доступа? {#q-what-if-recovery-reports-a-permission-error}

У текущего пользователя нет необходимых прав. Попросите пользователя с соответствующими полномочиями предоставить вам права или выполнить восстановление за вас.

### Вопрос: что делать, если после восстановления данные не возвращаются? {#q-what-if-no-data-is-returned-after-recovery}

Был создан новый объект с тем же именем, который перекрывает восстановленный объект. Сначала выполните `RENAME` для нового объекта или удалите его, затем повторите восстановление.
