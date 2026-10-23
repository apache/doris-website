---
{
    "title": "WARM UP",
    "language": "ru",
    "description": "Оператор WARM UP COMPUTE GROUP используется для прогрева данных в вычислительной группе, чтобы повысить производительность запросов."
}
---

## Описание {#description}

Оператор `WARM UP COMPUTE GROUP` используется для прогрева данных в вычислительной группе, чтобы повысить производительность запросов. При прогреве можно получать ресурсы из другой вычислительной группы или указывать конкретные таблицы и разделы для прогрева. Операция возвращает идентификатор задания, по которому можно отслеживать состояние задания прогрева.

> Сведения о прогреве кэша для запросов к Catalog см. в [документации по кэшу данных](../../../../lakehouse/data-cache.md).

## Синтаксис {#syntax}

```sql
WARM UP COMPUTE GROUP <destination_compute_group_name> WITH COMPUTE GROUP <source_compute_group_name> FORCE;
```
```sql
WARM UP COMPUTE GROUP <destination_compute_group_name> WITH <warm_up_list>;
```
```sql
warm_up_list ::= warm_up_item [AND warm_up_item...];
```
```sql
warm_up_item ::= TABLE <table_name> [PARTITION <partition_name>];

```
## Параметры {#parameters}

| Имя параметра                  | Описание                                                         |
|---------------------------|--------------------------------------------------------------|
| destination_compute_group_name | Имя целевой вычислительной группы, для которой выполняется прогрев.                                   |
| source_compute_group_name  | Имя исходной вычислительной группы, из которой получаются ресурсы.                                 |
| warm_up_list              | Список конкретных объектов для прогрева, который может включать таблицы и разделы.                   |
| table_name                | Имя таблицы, используемой для прогрева.                                         |
| partition_name            | Имя раздела, используемого для прогрева.                                       |

## Возвращаемое значение {#return-value}

* JobId:  Идентификатор задания прогрева.

## Требования к правам доступа {#access-control-requirements}

Начиная с версии 4.1.5, для прогрева требуется привилегия `USAGE` на целевую вычислительную группу и, если указана исходная вычислительная группа, привилегия `USAGE` на неё. Для каждой внутренней таблицы, явно указанной с помощью `WITH TABLE`, требуется привилегия `SELECT`. Прогрев по событиям с использованием правил `ON TABLES` дополнительно требует глобальной привилегии `ADMIN`. Если хотя бы одна из необходимых привилегий отсутствует, операция отклоняется.

## Примеры {#examples}

1. Прогрев вычислительной группы с именем destination_group_name с использованием вычислительной группы с именем source_group_name

```sql
   WARM UP COMPUTE GROUP destination_group_name WITH COMPUTE GROUP source_group_name;
```

2. Прогрев таблиц sales_data и customer_info, а также раздела q1_2024 таблицы orders с использованием вычислительной группы с именем destination_group.

```sql
    WARM UP COMPUTE GROUP destination_group WITH 
        TABLE sales_data 
        AND TABLE customer_info 
        AND TABLE orders PARTITION q1_2024;

```
