---
{
    "title": "SHOW LAST INSERT",
    "language": "ru",
    "description": "Этот синтаксис используется для просмотра результата последней операции вставки в текущем подключении сеанса"
}
---

## Описание {#description}

Этот синтаксис используется для просмотра результата последней операции вставки в текущем подключении сеанса

## Синтаксис {#syntax}

```sql
SHOW LAST INSERT
```

Пример возвращаемого результата:

```
     TransactionId: 64067
             Label: insert_ba8f33aea9544866-8ed77e2844d0cc9b
          Database: default_cluster:db1
             Table: t1
TransactionStatus: VISIBLE
        LoadedRows: 2
      FilteredRows: 0
```

## Возвращаемое значение {#return-value}

* TransactionId: идентификатор транзакции
* Label: метка, соответствующая задаче вставки
* Database: база данных, в которую выполняется вставка
* Table: таблица, в которую выполняется вставка
* TransactionStatus: статус транзакции
   * PREPARE: этап подготовки
   * PRECOMMITTED: этап предварительной фиксации
   * COMMITTED: транзакция выполнена успешно, но данные ещё не видны
   * VISIBLE: транзакция выполнена успешно, данные видны
   * ABORTED: транзакция завершилась с ошибкой
* LoadedRows: количество загруженных строк
* FilteredRows: количество отфильтрованных строк

## Пример {#example}

## Ключевые слова {#keywords}

    SHOW, LAST, INSERT

## Рекомендации по использованию {#best-practice}
