---
{
    "title": "Операторы полнотекстового поиска",
    "language": "ru",
    "description": "Операторы полнотекстового поиска определяют, удовлетворяет ли столбец заданным условиям полнотекстового поиска (ключевым словам, фразам и т. д.), при этом результатом является TRUE,"
}
---

## Описание {#description}

Операторы полнотекстового поиска определяют, удовлетворяет ли столбец заданным условиям полнотекстового поиска (ключевым словам, фразам и т. д.), при этом результатом является TRUE, FALSE или UNKNOWN.

Ограничения:

1. Левый операнд должен быть именем столбца, а правый операнд должен быть строковым литералом.
2. Оператор можно использовать только в предложении WHERE. Его нельзя использовать в других предложениях, таких как SELECT, GROUP BY, ORDER BY и т. д. Его можно объединять с другими условиями в предложении WHERE с помощью логических операций AND, OR, NOT.

## Обзор операторов {#operator-introduction}

| Оператор | Назначение | Пример |
| ------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| MATCH | Эквивалентен MATCH_ANY | `SELECT * FROM t WHERE column1 MATCH 'word1 word2'` |
| `<column_name>` MATCH_ANY `<string_literal>` | Разбивает column_name и string_literal на токены с помощью токенизатора индекса column_name. Если какой-либо токен из column_name содержит хотя бы одно слово, полученное после токенизации string_literal, результат равен TRUE, иначе FALSE. | `SELECT * FROM t WHERE column1 MATCH_ANY 'word1 word2'` |
| `<column_name>` MATCH_ALL `<string_literal>` | Разбивает column_name и string_literal на токены с помощью токенизатора индекса column_name. Если все токены из column_name содержат каждое слово, полученное после токенизации string_literal, результат равен TRUE, иначе FALSE. | `SELECT * FROM t WHERE column1 MATCH_ALL 'word1 word2'` |
| `<column_name>` MATCH_PHRASE `<string_literal>` | Разбивает column_name и string_literal на токены с помощью токенизатора индекса column_name. Если все токены из column_name содержат каждое слово, полученное после токенизации string_literal, и порядок слов совпадает (то есть они образуют фразу), результат равен TRUE, иначе FALSE. | `SELECT * FROM t WHERE column1 MATCH_PHRASE 'word1 word2'` |
| `<column_name>` MATCH_PHRASE_PREFIX `<string_literal>` | Расширение MATCH_PHRASE, позволяющее последнему слову, полученному после токенизации string_literal, совпадать только с префиксом, а не с целым словом. Аналогично функции подсказок в поисковых системах. | `SELECT * FROM t WHERE column1 MATCH_PHRASE_PREFIX 'word1 wor'` |
| `<column_name>` MATCH_PHRASE_EDGE `<string_literal>` | Расширение MATCH_PHRASE_PREFIX, позволяющее первому слову, полученному после токенизации string_literal, совпадать с суффиксом, а последнему слову совпадать с префиксом. | `SELECT * FROM t WHERE column1 MATCH_PHRASE_EDGE 'rd wor'` |
| `<column_name>` MATCH_REGEXP `<string_literal>` | Расширение MATCH_ANY, в котором string_literal задаёт регулярное выражение, а токены из column_name сопоставляются с этим регулярным выражением. | `SELECT * FROM t WHERE column1 MATCH_REGEXP 'word.'` |
