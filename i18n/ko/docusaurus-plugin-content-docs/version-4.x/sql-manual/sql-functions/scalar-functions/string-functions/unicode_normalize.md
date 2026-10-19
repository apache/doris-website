---
{
    "title": "UNICODE_NORMALIZE",
    "language": "ko",
    "description": "입력 문자열에 Unicode 정규화를 수행합니다."
}
---

## 설명 {#description}

입력 문자열에 [Unicode 정규화](https://unicode-org.github.io/icu/userguide/transforms/normalization/)를 수행합니다.

Unicode 정규화는 서로 동등한 Unicode 문자 시퀀스를 통일된 형식으로 변환하는 과정입니다. 예를 들어, 문자 "é"는 하나의 코드 포인트(U+00E9)로 표현하거나 "e" + 결합 악센트(U+0065 + U+0301)로 표현할 수 있습니다. 정규화는 이러한 동등한 표현을 일관되게 처리할 수 있도록 합니다.

## 구문 {#syntax}

```sql
UNICODE_NORMALIZE(<str>, <mode>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|-----------|-------------|
| `<str>` | 정규화할 입력 문자열입니다. 타입: VARCHAR |
| `<mode>` | 정규화 모드로, 상수 문자열이어야 합니다(대소문자 구분 없음). 지원되는 모드:<br/>- `NFC`: 정준 분해(Canonical Decomposition) 후 정준 합성(Canonical Composition)<br/>- `NFD`: 정준 분해(Canonical Decomposition)<br/>- `NFKC`: 호환 분해(Compatibility Decomposition) 후 정준 합성(Canonical Composition)<br/>- `NFKD`: 호환 분해(Compatibility Decomposition)<br/>- `NFKC_CF`: NFKC 적용 후 케이스 폴딩(Case Folding) |

## 반환값 {#return-value}

입력 문자열을 정규화한 결과를 VARCHAR 타입으로 반환합니다.

## 예제 {#examples}

1. NFC와 NFD의 차이(합성된 문자와 분해된 문자)

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

2. NFKC_CF를 사용한 케이스 폴딩

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

3. NFKC를 사용한 전각 문자 처리(호환 분해)

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

4. NFKD를 사용한 특수 기호 처리(호환 분해)

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

5. 원으로 둘러싸인 숫자 처리

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

6. 동일한 문자열에 서로 다른 모드를 적용하여 비교

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

7. 문자열 동등성 비교 시나리오

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
