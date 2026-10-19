---
{
    "title": "STR_TO_MAP",
    "language": "ko",
    "description": "문자열에서 Map<String, String>을 생성합니다."
}
---

## 설명 {#description}

문자열에서 `Map<String, String>`을 생성합니다.

:::tip
이 함수는 버전 3.0.6부터 지원됩니다.
:::

## 구문 {#syntax}

```sql
STR_TO_MAP(<str> [, <pair_delimiter> [, <key_value_delimiter>]])
```

## 매개변수 {#parameters}
- `<str>` 맵으로 변환할 문자열입니다.
- `<pair_delimiter>` 문자열에서 쌍을 구분하는 구분자로, 기본값은 `,`입니다.
- `<key_value_delimiter>` 문자열에서 키와 값을 구분하는 구분자로, 기본값은 `:`입니다.

## 반환 값 {#return-value}

문자열에서 생성한 `Map<String, String>`을 반환합니다.

## 예제 {#example}

```sql
select str_to_map('a=1&b=2&c=3', '&', '=') as map1, str_to_map('x:10|y:20|z:30', '|', ':') as map2;
```

```text
+-----------------------------+--------------------------------+
| map1                        | map2                           |
+-----------------------------+--------------------------------+
| {"a":"1", "b":"2", "c":"3"} | {"x":"10", "y":"20", "z":"30"} |
+-----------------------------+--------------------------------+
```
