---
{
    "title": "URL_ENCODE",
    "language": "ko",
    "description": "UTF-8 인코딩을 사용하여 입력된 텍스트를 URL 인코딩합니다. 일반적으로 URL의 일부로 전달되는 매개변수 정보를 인코딩하는 데 사용됩니다"
}
---

## 설명 {#description}

UTF-8 인코딩을 사용하여 입력된 텍스트를 URL 인코딩합니다. 일반적으로 URL의 일부로 전달되는 매개변수 정보를 인코딩하는 데 사용됩니다

## 구문 {#syntax}

```sql
URL_ENCODE(  <str>  ) 
```

## 필수 매개변수 {#required-parameters}
| 매개변수 | 설명 |
|------|------|
| `<str>` | 인코딩할 문자열 |

##  반환 값 {#return-value}


UTF-8 인코딩을 사용하여 입력된 텍스트를 URL 인코딩한 결과를 반환합니다

##  예제 {#example}

```sql
select  URL_ENCODE('Doris Q&A');
```

```text
+-------------------------+
| url_encode('Doris Q&A') |
+-------------------------+
| Doris+Q%26A             |
+-------------------------+

```
