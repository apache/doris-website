---
{
    "title": "Логические операторы",
    "language": "ru",
    "description": "Логические условия объединяют результаты двух составляющих условий, формируя на их основе единый результат,"
}
---

## Описание {#description}

Логические условия объединяют результаты двух составляющих условий, формируя на их основе единый результат, или инвертируют результат условия.

## Обзор операторов {#operator-introduction}

| Оператор | Функция                                                      | Пример                 |
| ------- | ------------------------------------------------------------ | ---------------------- |
| NOT    | Возвращает TRUE, если следующее за ним условие имеет значение FALSE. Возвращает FALSE, если оно имеет значение TRUE. Если значение условия равно UNKNOWN, оно остаётся UNKNOWN. | `SELECT NOT (TRUE)`     |
| AND    | Возвращает TRUE, если оба составляющих условия имеют значение TRUE. Возвращает FALSE, если хотя бы одно из них имеет значение FALSE. В остальных случаях возвращает UNKNOWN. | `SELECT TRUE AND FALSE` |
| OR     | Возвращает TRUE, если хотя бы одно из составляющих условий имеет значение TRUE. Возвращает FALSE, если оба имеют значение FALSE. В остальных случаях возвращает UNKNOWN. | `SELECT TRUE OR NULL`  |

## Таблицы истинности {#truth-tables}

### Таблица истинности NOT {#not-truth-table}

|       | TRUE   | FALSE | UNKNOWN |
| :----  | :------ | :------ |
| NOT    | FALSE  | TRUE   | UNKNOWN |

### Таблица истинности AND {#and-truth-table}

| AND      | TRUE    | FALSE | UNKNOWN |
| :------ | :------ | :---- | :------ |
| TRUE    | TRUE    | FALSE | UNKNOWN |
| FALSE   | FALSE   | FALSE | FALSE   |
| UNKNOWN | UNKNOWN | FALSE | UNKNOWN |

### Таблица истинности OR {#or-truth-table}

| OR       | TRUE | FALSE   | UNKNOWN |
| :------ | :--- | :------ | :------ |
| TRUE    | TRUE | TRUE    | TRUE    |
| FALSE   | TRUE | FALSE   | UNKNOWN |
| UNKNOWN | TRUE | UNKNOWN | UNKNOWN |
