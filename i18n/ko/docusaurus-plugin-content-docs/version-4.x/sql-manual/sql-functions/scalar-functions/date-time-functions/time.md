---
{
    "title": "TIME | 날짜 및 시간 함수",
    "language": "ko",
    "description": "TIME 함수는 Datetime 값의 시간 부분을 가져옵니다.",
    "sidebar_label": "TIME"
}
---

# TIME {#time}

## 설명 {#description}
`TIME` 함수는 Datetime 값의 `time` 부분을 가져옵니다.

## 구문 {#syntax}

```sql
TIME(<datetime>)
```

## 매개변수 {#parameters}

| 매개변수       | 설명                  |
|----------------|-----------------------|
| `<datetime>`   | datetime 값입니다.    |

## 반환 값 {#return-value}
`TIME` 타입의 값을 반환합니다.

## 예제 {#example}

```sql
SELECT TIME('2025-1-1 12:12:12');
```

```text
mysql> 
+---------------------------+
| time('2025-1-1 12:12:12') |
+---------------------------+
| 12:12:12                  |
+---------------------------+
```
