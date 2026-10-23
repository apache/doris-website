---
{
    "title": "DESC FUNCTION",
    "language": "ru",
    "description": "Используйте desc function tablevaluedfunction, чтобы получить сведения о схеме соответствующей табличной функции."
}
---

## Описание {#description}

Используйте desc function table_valued_function, чтобы получить сведения о схеме соответствующей табличной функции.

## Синтаксис {#syntax}

```sql
DESC FUNCTION <table_valued_function>
```

## Обязательные параметры {#required-parameters}

**<table_valued_function>**

> table_valued_function — имя табличной функции, например CATALOGS. Список поддерживаемых табличных функций приведён в разделе «[Табличные функции](https://doris.apache.org/docs/dev/lakehouse/file-analysis)».

## Примеры {#examples}

Запрос сведений о табличной функции CATALOGS:

```sql
DESC FUNCTION catalogs();
```

Результат выглядит следующим образом:

```sql
+-------------+--------+------+-------+---------+-------+
| Field       | Type   | Null | Key   | Default | Extra |
+-------------+--------+------+-------+---------+-------+
| CatalogId   | bigint | No   | false | NULL    | NONE  |
| CatalogName | text   | No   | false | NULL    | NONE  |
| CatalogType | text   | No   | false | NULL    | NONE  |
| Property    | text   | No   | false | NULL    | NONE  |
| Value       | text   | No   | false | NULL    | NONE  |
+-------------+--------+------+-------+---------+-------+
```
