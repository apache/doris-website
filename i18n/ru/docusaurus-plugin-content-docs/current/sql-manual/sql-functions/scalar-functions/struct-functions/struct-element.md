---
{
    "title": "STRUCT_ELEMENT",
    "language": "ru",
    "description": "Возвращает указанное поле из столбца данных типа struct. Функция поддерживает доступ к полям struct по позиции (индексу) или имени поля."
}
---

:::caution
Поскольку ни одна другая база данных или движок запросов не предоставляет подобную функцию, `STRUCT_ELEMENT` удалена начиная с версии 4.1.3. Используйте вместо неё функцию [`ELEMENT_AT`](../variant-functions/element-at.md) (или эквивалентный синтаксис обращения по индексу `s[k]` / `s['field_name']` и через точку `s.field_name`).
:::

## Описание {#description}

Возвращает указанное поле из столбца данных типа struct. Функция поддерживает доступ к полям struct по позиции (индексу) или имени поля.

## Синтаксис {#syntax}

```sql
STRUCT_ELEMENT( <struct>, <field_location_or_name> )
```

## Параметры {#parameters}

- `<struct>`: Входной столбец типа struct
- `<field_location_or_name>`: Позиция поля (начиная с 1) или имя поля; поддерживаются только константы

## Возвращаемое значение {#return-value}

Тип возвращаемого значения: тип значения поля, поддерживаемый struct

Значение результата:
- Возвращается значение указанного поля
- Если входное значение struct равно null, возвращается null
- Если указанное поле не существует, возникает ошибка

## Использование {#usage}

- Поддерживается доступ по позиции поля (индексу); индексация начинается с 1
- Поддерживается доступ по имени поля; имя поля сопоставляется **без учёта регистра**
- Второй параметр должен быть константой (не может быть столбцом)
- Функция помечена как AlwaysNullable; возвращаемое значение может быть null
- Начиная с версии 4.1.3, `STRUCT_ELEMENT` удалена. Используйте вместо неё `ELEMENT_AT(<struct>, ...)`, операторы обращения по индексу `<struct>[<index>]` / `<struct>['<field_name>']` или оператор точки `<struct_col>.<field_name>`. Все эти способы доступа к полю struct эквивалентны.

## Примеры {#examples}

**Примеры запросов:**

Доступ по позиции:
```sql
select struct_element(named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing'), 1);
+--------------------------------------------------------------------------------+
| struct_element(named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing'), 1) |
+--------------------------------------------------------------------------------+
| Alice                                                                          |
+--------------------------------------------------------------------------------+
```

Доступ по имени поля:
```sql
select struct_element(named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing'), 'age');
+------------------------------------------------------------------------------------+
| struct_element(named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing'), 'age') |
+------------------------------------------------------------------------------------+
|                                                                                 25 |
+------------------------------------------------------------------------------------+
```

Доступ с помощью оператора обращения по индексу (эквивалентен вызовам выше):
```sql
select named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing')[1] as by_index,
       named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing')['age'] as by_name;
+----------+---------+
| by_index | by_name |
+----------+---------+
| Alice    |      25 |
+----------+---------+
```

Доступ к полям структуры struct, содержащей сложные типы:
```sql
select struct_element(named_struct('array', [1,2,3], 'map', {'key':'value'}), 'array');
+---------------------------------------------------------------------------------+
| struct_element(named_struct('array', [1,2,3], 'map', {'key':'value'}), 'array') |
+---------------------------------------------------------------------------------+
| [1, 2, 3]                                                                       |
+---------------------------------------------------------------------------------+
```

Доступ к полю со значением null:
```sql
select struct_element(named_struct('name', null, 'age', 25), 'name');
+---------------------------------------------------------------+
| struct_element(named_struct('name', null, 'age', 25), 'name') |
+---------------------------------------------------------------+
| NULL                                                          |
+---------------------------------------------------------------+
```

Примеры ошибок

Доступ по имени несуществующего поля:
```sql
select struct_element(named_struct('name', 'Alice', 'age', 25), 'nonexistent');
ERROR 1105 (HY000): errCode = 2, detailMessage = the specified field name nonexistent was not found: struct_element(named_struct('name', 'Alice', 'age', 25), 'nonexistent')
```

Доступ по индексу за пределами допустимого диапазона:
```sql
select struct_element(named_struct('name', 'Alice', 'age', 25), 5);
ERROR 1105 (HY000): errCode = 2, detailMessage = the specified field index out of bound: struct_element(named_struct('name', 'Alice', 'age', 25), 5)
```

Второй параметр не является константой:
```sql
select struct_element(named_struct('name', 'Alice', 'age', 25), inv) from var_with_index where k = 4;
ERROR 1105 (HY000): errCode = 2, detailMessage = element_at over a struct only allows a constant int or string second parameter: element_at(named_struct('name', 'Alice', 'age', 25), inv)
```

Если входное значение struct равно NULL, возникает ошибка:
```sql
select struct_element(NULL, 5);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: struct_element(NULL, TINYINT)
```
