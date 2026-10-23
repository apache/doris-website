---
{
    "title": "UNICODE_NORMALIZE",
    "language": "ru",
    "description": "Выполняет нормализацию Unicode для входной строки."
}
---

## Описание {#description}

Выполняет [нормализацию Unicode](https://unicode-org.github.io/icu/userguide/transforms/normalization/) для входной строки.

Нормализация Unicode — это процесс приведения эквивалентных последовательностей символов Unicode к единой форме. Например, символ "é" можно представить одной кодовой точкой (U+00E9) или сочетанием "e" и комбинируемого знака острого ударения (U+0065 + U+0301). Нормализация обеспечивает единообразную обработку этих эквивалентных представлений.

## Синтаксис {#syntax}

```sql
UNICODE_NORMALIZE(<str>, <mode>)
```

## Параметры {#parameters}

| Параметр | Описание |
|-----------|-------------|
| `<str>` | Входная строка для нормализации. Тип: VARCHAR |
| `<mode>` | Режим нормализации. Должен быть константной строкой (без учёта регистра). Поддерживаемые режимы:<br/>- `NFC`: каноническая декомпозиция с последующей канонической композицией<br/>- `NFD`: каноническая декомпозиция<br/>- `NFKC`: декомпозиция совместимости с последующей канонической композицией<br/>- `NFKD`: декомпозиция совместимости<br/>- `NFKC_CF`: NFKC с последующей свёрткой регистра |

## Возвращаемое значение {#return-value}

Возвращает значение типа VARCHAR, представляющее результат нормализации входной строки.

## Примеры {#examples}

1. Различие между NFC и NFD (символы в составной и разложенной формах)

```sql
-- 'Café' where é may be in composed form, NFD will decompose it into e + combining accent
SELECT length(unicode_normalize('Café', 'NFC')) AS nfc_len, length(unicode_normalize('Café', 'NFD')) AS nfd_len;
```

```text
+---------+---------+
| nfc_len | nfd_len |
+---------+---------+
|       4 |       5 |
+---------+---------+
```

2. NFKC_CF для свёртки регистра

```sql
SELECT unicode_normalize('ABC 123', 'nfkc_cf') AS result;
```

```text
+---------+
| result  |
+---------+
| abc 123 |
+---------+
```

3. Обработка полноширинных символов с помощью NFKC (декомпозиция совместимости)

```sql
-- Fullwidth digits '１２３' will be converted to halfwidth '123'
SELECT unicode_normalize('１２３ＡＢＣ', 'NFKC') AS result;
```

```text
+--------+
| result |
+--------+
| 123ABC |
+--------+
```

4. Обработка специальных символов с помощью NFKD (декомпозиция совместимости)

```sql
-- ℃ (degree Celsius symbol) will be decomposed to °C
SELECT unicode_normalize('25℃', 'NFKD') AS result;
```

```text
+--------+
| result |
+--------+
| 25°C   |
+--------+
```

5. Обработка чисел, обведённых кружком

```sql
-- ① ② ③ circled numbers will be converted to regular digits
SELECT unicode_normalize('①②③', 'NFKC') AS result;
```

```text
+--------+
| result |
+--------+
| 123    |
+--------+
```

6. Сравнение разных режимов на одной строке

```sql
SELECT 
    unicode_normalize('ﬁ', 'NFC') AS nfc_result,
    unicode_normalize('ﬁ', 'NFKC') AS nfkc_result;
```

```text
+------------+-------------+
| nfc_result | nfkc_result |
+------------+-------------+
| ﬁ          | fi          |
+------------+-------------+
```

7. Пример сравнения строк на равенство

```sql
-- Use normalization to compare visually identical but differently encoded strings
SELECT unicode_normalize('café', 'NFC') = unicode_normalize('café', 'NFC') AS is_equal;
```

```text
+----------+
| is_equal |
+----------+
|        1 |
+----------+
```
