---
{
    "title": "BEGIN",
    "language": "ru",
    "description": "Пользователи могут указать Label. Если Label не указан, система сгенерирует его автоматически."
}
---

## Описание {#description}

Пользователи могут указать Label. Если Label не указан, система сгенерирует его автоматически.

## Синтаксис {#syntax}

```sql
BEGIN [ WITH LABEL <label> ]
```

## Необязательный параметр {#optional-parameter}

`[ WITH LABEL <label> ]`

> Позволяет явно указать Label, связанный с транзакцией. Если он не указан, система автоматически сгенерирует [label](../../../data-operate/transaction).

## Примечания {#notes}

- Если явная транзакция начата, но не зафиксирована и не отменена, повторное выполнение команды BEGIN не даст эффекта.

## Примеры {#examples}

Начало явной транзакции с Label, сгенерированным системой

```sql
mysql> BEGIN;
{'label':'txn_insert_624a0e16ef4c43d4-9814c7fa3e83a705', 'status':'PREPARE', 'txnId':''}
```

Начало явной транзакции с указанным Label

```sql
mysql> BEGIN WITH LABEL load_1;
{'label':'load_1', 'status':'PREPARE', 'txnId':''}
```
