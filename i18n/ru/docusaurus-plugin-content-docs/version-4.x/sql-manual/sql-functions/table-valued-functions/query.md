---
{
    "title": "QUERY",
    "language": "ru",
    "description": "Табличная функция Query (table-valued-function, tvf) позволяет прозрачно передавать запросы непосредственно в Catalog для получения данных"
}
---

## Описание {#description}

Табличная функция Query (table-valued-function, tvf) позволяет прозрачно передавать запросы непосредственно в Catalog для получения данных

Поддерживается начиная с версии Doris 2.1.3. В настоящее время поддерживается только прозрачная передача запросов в JDBC Catalog.
Сначала необходимо создать соответствующий Catalog в Doris.


## Синтаксис {#syntax}

```sql
QUERY(
    "catalog" = "<catalog>", 
    "query" = "<query_sql>"
  );
```

## Обязательные параметры {#required-parameters}
Каждый параметр табличной функции query (tvf) представляет собой пару `"key"="value"`.

| Поле       | Описание                                   |
|------------|--------------------------------------------|
| `catalog`  | Укажите имя нужного Catalog. |
| `query`    | Запрос, который требуется выполнить.       |


## Примеры {#examples}

Можно использовать с `desc function`

```sql
desc function query("catalog" = "jdbc", "query" = "select * from test.student");
```
```text
+-------+------+------+-------+---------+-------+
| Field | Type | Null | Key   | Default | Extra |
+-------+------+------+-------+---------+-------+
| id    | int  | Yes  | true  | NULL    |       |
| name  | text | Yes  | false | NULL    | NONE  |
+-------+------+------+-------+---------+-------+
```

Прозрачная передача запросов к таблицам источника данных JDBC Catalog

```sql
select * from query("catalog" = "jdbc", "query" = "select * from test.student");
```
```text
+------+---------+
| id   | name    |
+------+---------+
| 1    | alice   |
| 2    | bob     |
| 3    | jack    |
+------+---------+
```
```sql
select * from query("catalog" = "jdbc", "query" = "select * from test.score");
```
```text
+------+---------+
| id   | score   |
+------+---------+
| 1    | 100     |
| 2    | 90      |
| 3    | 80      |
+------+---------+
```

Прозрачная передача запроса с соединением таблиц источника данных JDBC Catalog

```sql
select * from query("catalog" = "jdbc", "query" = "select a.id, a.name, b.score from test.student a join test.score b on a.id = b.id");
```
```
+------+---------+---------+
| id   | name    | score   |
+------+---------+---------+
| 1    | alice   | 100     |
| 2    | bob     | 90      |
| 3    | jack    | 80      |
+------+---------+---------+
```
