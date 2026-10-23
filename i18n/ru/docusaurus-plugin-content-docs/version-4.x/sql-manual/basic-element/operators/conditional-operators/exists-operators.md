---
{
    "title": "Операторы EXISTS",
    "language": "ru",
    "description": "Условие EXISTS используется для проверки наличия строк в подзапросе."
}
---

## Описание {#description}

Условие EXISTS используется для проверки наличия строк в подзапросе.

## Обзор оператора {#operator-introduction}

| Оператор | Функция | Пример |
| ------ | ------------------------------------------------------- | ------------------------------------------------------------ |
| EXISTS | Возвращает TRUE, если подзапрос возвращает хотя бы одну строку данных | `SELECT department_id FROM departments d WHERE EXISTS (SELECT * FROM employees e WHERE d.department_id = e.department_id) ORDER BY department_id;` |
