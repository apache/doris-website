---
{
    "title": "XOR | Побитовые функции",
    "language": "ru",
    "description": "Выполняет побитовую операцию XOR над двумя значениями BOOLEAN.",
    "sidebar_label": "XOR"
}
---

# XOR {#xor}

## Описание {#description}
Выполняет побитовую операцию XOR над двумя значениями BOOLEAN.

## Синтаксис {#syntax}
```sql
<lhs> XOR <rhs>
```

## Параметры {#parameters}
- `<lhs>`: Первое значение BOOLEAN для побитовой операции XOR.
- `<rhs>`: Второе значение BOOLEAN для побитовой операции XOR.

## Возвращаемое значение {#return-value}
Возвращает результат операции XOR над двумя значениями BOOLEAN.

## Примеры {#examples}
1. Пример 1
    ```sql
    select true XOR false, true XOR true;
    ```
    ```text
    +----------------+---------------+
    | true XOR false | true XOR true |
    +----------------+---------------+
    |              1 |             0 |
    +----------------+---------------+
    ```
2. Аргумент NULL
    ```sql
    select true XOR NULL, NULL XOR true, false XOR NULL, NULL XOR false, NULL XOR NULL;
    ```
    ```text
    +---------------+---------------+----------------+----------------+---------------+
    | true XOR NULL | NULL XOR true | false XOR NULL | NULL XOR false | NULL XOR NULL |
    +---------------+---------------+----------------+----------------+---------------+
    |          NULL |          NULL |           NULL |           NULL |          NULL |
    +---------------+---------------+----------------+----------------+---------------+
    ```
