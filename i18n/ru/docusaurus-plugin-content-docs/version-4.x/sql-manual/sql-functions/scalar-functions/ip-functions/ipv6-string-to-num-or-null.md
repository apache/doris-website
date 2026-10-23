---
{
    "title": "IPV6_STRING_TO_NUM_OR_NULL | Функции IP",
    "language": "ru",
    "description": "Функция, обратная IPV6_NUM_TO_STRING, принимает IP-адрес типа String и возвращает IPv6-адрес в двоичном формате.",
    "sidebar_label": "IPV6_STRING_TO_NUM_OR_NULL"
}
---

# IPV6_STRING_TO_NUM_OR_NULL {#ipv6_string_to_num_or_null}

## Описание {#description}
Функция, обратная IPV6_NUM_TO_STRING, принимает IP-адрес типа String и возвращает IPv6-адрес в двоичном формате.

## Псевдоним {#alias}
- INET6_ATON

## Синтаксис {#syntax}
```sql
IPV6_STRING_TO_NUM_OR_NULL(<ipv6_string>)
```

## Параметры {#parameters}
| Параметр | Описание                                      |
|-----------|--------------------------------------------------|
| `<ipv6_string>`      | IPv6-адрес типа String  |


## Возвращаемое значение {#return-value}
Возвращает IPv6-адрес в двоичном формате.
- Если передан недопустимый IP-адрес, возвращается `NULL`.
- Если входная строка содержит допустимый IPv4-адрес, возвращается его эквивалент в формате IPv6.

## Пример {#example}
```sql
select hex(ipv6_string_to_num_or_null('1111::ffff')) as r1, hex(ipv6_string_to_num_or_null('192.168.0.1')) as r2, hex(ipv6_string_to_num_or_null('notaaddress')) as r3;
```
```text
+----------------------------------+----------------------------------+------+
| r1                               | r2                               | r3   |
+----------------------------------+----------------------------------+------+
| 1111000000000000000000000000FFFF | 00000000000000000000FFFFC0A80001 | NULL |
+----------------------------------+----------------------------------+------+
```
