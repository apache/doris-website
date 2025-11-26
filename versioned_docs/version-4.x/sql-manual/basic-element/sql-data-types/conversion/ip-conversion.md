---
{
    "title": "Cast to IP Types",
    "language": "en"
}
---

IP types are used to store and process IP addresses, including IPv4 and IPv6 types. IPv4 is stored as uint32, while IPv6 is stored as uint128.

## Cast to IPv4

### FROM String

#### Strict Mode

##### BNF Definition

```xml
<ipv4> ::= <whitespace>* <octet> "." <octet> "." <octet> "." <octet> <whitespace>*

<octet> ::= <digit> | <digit><digit> | <digit><digit><digit>

<digit> ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

<whitespace> ::= " " | "\t" | "\n" | "\r" | "\f" | "\v"
```

##### Rule Description

An IPv4 address consists of 4 numeric segments separated by dots: number.number.number.number, for example: 192.168.1.1. Each segment must be within the range of 0 to 255. Numbers may have leading zeros. Any number of whitespace characters (including spaces, tabs, newlines, etc.) can be included before and after the address.

If the format doesn't conform, an error is reported.

##### Examples

| Input String | Parse Result | Comment |
| --- | --- | --- |
| "192.168.1.1" | Success | Standard valid address |
| "0.0.0.0" | Success | Minimum value boundary |
| "255.255.255.255" | Success | Maximum value boundary |
| "10.20.30.40" | Success | Regular address |
| "   192.168.1.1 " | Success | Can have whitespace before and after |
| "192.168.01.1" | Success | Leading zeros allowed (01 = 1) |
| "1.2.3" | Error | Only 3 segments (must have 4) |
| "1.2.3.4.5" | Error | 5 segments (must have 4) |
| "256.0.0.1" | Error | First segment > 255 (256 out of range) |
| "1.300.2.3" | Error | Second segment > 255 |
| "1.2.3." | Error | Fourth segment missing |
| ".1.2.3" | Error | First segment missing |
| "1..2.3" | Error | Second segment missing |
| "a.b.c.d" | Error | Non-numeric characters |
| "1.2.+3.4" | Error | Sign + is invalid |

#### Non-Strict Mode

##### BNF Definition

```xml
<ipv4> ::= <whitespace>* <octet> "." <octet> "." <octet> "." <octet> <whitespace>*

<octet> ::= <digit> | <digit><digit> | <digit><digit><digit>

<digit> ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

<whitespace> ::= " " | "\t" | "\n" | "\r" | "\f" | "\v"
```

##### Rule Description

An IPv4 address consists of 4 numeric segments separated by dots: number.number.number.number, for example: 192.168.1.1. Each segment must be within the range of 0 to 255. Numbers may have leading zeros. Any number of whitespace characters (including spaces, tabs, newlines, etc.) can be included before and after the address.

If the format doesn't conform, null is returned.

##### Examples

| Input String | Parse Result | Comment |
| --- | --- | --- |
| "192.168.1.1" | Success | Standard valid address |
| "0.0.0.0" | Success | Minimum value boundary |
| "255.255.255.255" | Success | Maximum value boundary |
| "10.20.30.40" | Success | Regular address |
| "   192.168.1.1 " | Success | Can have whitespace before and after |
| "192.168.01.1" | Success | Leading zeros allowed (01 = 1) |
| "1.2.3" | null | Only 3 segments (must have 4) |
| "1.2.3.4.5" | null | 5 segments (must have 4) |
| "256.0.0.1" | null | First segment > 255 (256 out of range) |
| "1.300.2.3" | null | Second segment > 255 |
| "1.2.3." | null | Fourth segment missing |
| ".1.2.3" | null | First segment missing |
| "1..2.3" | null | Second segment missing |
| "a.b.c.d" | null | Non-numeric characters |
| "1.2.+3.4" | null | Sign + is invalid |

## Cast to IPv6

### FROM String

:::caution Behavior Change
Before version 4.0, Doris had more relaxed requirements for IPv6 address formats, for example:
- Allowing multiple consecutive colons (like '1:1:::1')
- Allowing double colons without actually abbreviating anything (like '1:1:1::1:1:1:1:1')

Starting from version 4.0, these two non-standard formats will result in an error in strict mode or return null in non-strict mode.
:::

#### Strict Mode

##### BNF Definition

```xml
<ipv6> ::= <whitespace>* <ipv6-standard> <whitespace>*
         | <whitespace>* <ipv6-compressed> <whitespace>*
         | <whitespace>* <ipv6-ipv4-mapped> <whitespace>*

<ipv6-standard> ::= <h16> ":" <h16> ":" <h16> ":" <h16> ":" <h16> ":" <h16> ":" <h16> ":" <h16>

<h16> ::= <hexdigit>{1,4}

<hexdigit> ::= <digit> | "a" | "b" | "c" | "d" | "e" | "f" | "A" | "B" | "C" | "D" | "E" | "F"

<digit> ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

<whitespace> ::= " " | "\t" | "\n" | "\r" | "\f" | "\v"
```

##### Rule Description

1. Standard format: 8 groups of hexadecimal digits, each group consisting of 1 to 4 hexadecimal digits, separated by colons. Example: 2001:0db8:85a3:0000:0000:8a2e:0370:7334
2. Compressed format:
  - Double colons (::) can be used to represent one or more consecutive groups of zeros.
  - Double colons (::) can only appear once in the entire address.
  - Just :: is also a valid address, representing all zeros.
  - 1:1:1::1:1:1:1:1 is not valid because :: doesn't represent consecutive zeros.
  - The following addresses are all valid and identical:
    - 2001:0db8:0000:0000:0000:0000:1428:57ab
    - 2001:0db8:0000:0000:0000::1428:57ab
    - 2001:0db8:0:0:0:0:1428:57ab
    - 2001:0db8:0::0:1428:57ab
    - 2001:0db8::1428:57ab
3. IPv4-mapped addresses:
  - IPv4 dotted decimal format can be used in the last 32 bits (last two groups) of an IPv6 address.
  - This format is typically used to represent the mapping of IPv4 addresses to IPv6.
  - Example: ::ffff:192.168.89.9 is equivalent to ::ffff:c0a8:5909
4. Any number of whitespace characters (including spaces, tabs, newlines, etc.) can be included before and after the address.
5. Hexadecimal letters can be uppercase (A-F) or lowercase (a-f).
6. The IPv4 part must follow IPv4 rules: each segment must be within the range of 0 to 255.
7. If the address format doesn't conform to the above rules, an error is reported.

##### Examples

| Input String | Parse Result | Comment |
| --- | --- | --- |
| 2001:db8:85a3:0000:0000:8a2e:0370:7334 | Success | Standard valid address |
| :: | Success | All zeros address |
| 2001:db8:: | Success | Using compressed format |
| ::ffff:192.168.1.1 | Success | IPv4-mapped address |
| 2001:db8::1 | Success | Can have whitespace before and after |
| 2001:db8::1::2 | Error | Double colons (::) appear twice |
| 2001:db8:85a3:0000:0000:8a2e:0370:7334:1234 | Error | More than 8 groups |
| 2001:db8:85a3:0000:8a2e:0370 | Error | Only 6 groups (must have 8 or use compressed format) |
| 2001:db8:85g3:0000:0000:8a2e:0370:7334 | Error | Contains invalid hexadecimal character 'g' |
| 2001:db8::ffff:192.168.1.260 | Error | IPv4 part out of range (260 > 255) |
| 2001:db8::ffff:192.168..1 | Error | IPv4 part format error (missing a segment) |
| 2001:0db8:85a3:::8a2e:0370:7334 | Error | Three colons in a row |
| 20001:db8::1 | Error | First group exceeds 4 hexadecimal digits |

#### Non-Strict Mode

##### BNF Definition

```xml
<ipv6> ::= <whitespace>* <ipv6-standard> <whitespace>*
         | <whitespace>* <ipv6-compressed> <whitespace>*
         | <whitespace>* <ipv6-ipv4-mapped> <whitespace>*

<ipv6-standard> ::= <h16> ":" <h16> ":" <h16> ":" <h16> ":" <h16> ":" <h16> ":" <h16> ":" <h16>

<h16> ::= <hexdigit>{1,4}

<hexdigit> ::= <digit> | "a" | "b" | "c" | "d" | "e" | "f" | "A" | "B" | "C" | "D" | "E" | "F"

<digit> ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

<whitespace> ::= " " | "\t" | "\n" | "\r" | "\f" | "\v"
```

##### Rule Description

1. Standard format: 8 groups of hexadecimal digits, each group consisting of 1 to 4 hexadecimal digits, separated by colons. Example: 2001:0db8:85a3:0000:0000:8a2e:0370:7334
2. Compressed format:
  - Double colons (::) can be used to represent one or more consecutive groups of zeros.
  - Double colons (::) can only appear once in the entire address.
  - Just :: is also a valid address, representing all zeros.
  - 1:1:1::1:1:1:1:1 is not valid because :: doesn't represent consecutive zeros.
  - The following addresses are all valid and identical:
    - 2001:0db8:0000:0000:0000:0000:1428:57ab
    - 2001:0db8:0000:0000:0000::1428:57ab
    - 2001:0db8:0:0:0:0:1428:57ab
    - 2001:0db8:0::0:1428:57ab
    - 2001:0db8::1428:57ab
3. IPv4-mapped addresses:
  - IPv4 dotted decimal format can be used in the last 32 bits (last two groups) of an IPv6 address.
  - This format is typically used to represent the mapping of IPv4 addresses to IPv6.
  - Example: ::ffff:192.168.89.9 is equivalent to ::ffff:c0a8:5909
4. Any number of whitespace characters (including spaces, tabs, newlines, etc.) can be included before and after the address.
5. Hexadecimal letters can be uppercase (A-F) or lowercase (a-f).
6. The IPv4 part must follow IPv4 rules: each segment must be within the range of 0 to 255.
7. If the address format doesn't conform to the above rules, null is returned.

##### Examples

| Input String | Parse Result | Comment |
| --- | --- | --- |
| 2001:db8:85a3:0000:0000:8a2e:0370:7334 | Success | Standard valid address |
| :: | Success | All zeros address |
| 2001:db8:: | Success | Using compressed format |
| ::ffff:192.168.1.1 | Success | IPv4-mapped address |
| 2001:db8::1 | Success | Can have whitespace before and after |
| 2001:db8::1::2 | null | Double colons (::) appear twice |
| 2001:db8:85a3:0000:0000:8a2e:0370:7334:1234 | null | More than 8 groups |
| 2001:db8:85a3:0000:8a2e:0370 | null | Only 6 groups (must have 8 or use compressed format) |
| 2001:db8:85g3:0000:0000:8a2e:0370:7334 | null | Contains invalid hexadecimal character 'g' |
| 2001:db8::ffff:192.168.1.260 | null | IPv4 part out of range (260 > 255) |
| 2001:db8::ffff:192.168..1 | null | IPv4 part format error (missing a segment) |
| 2001:0db8:85a3:::8a2e:0370:7334 | null | Three colons in a row |
| 20001:db8::1 | null | First group exceeds 4 hexadecimal digits |

### FROM IPv4

Any IPv4 address can be converted to IPv6. Conversion will always succeed, and behavior is consistent between strict and non-strict modes.

| Input IPv4 | Converted IPv6 |
| --- | --- |
| 192.168.0.0 | ::ffff:192.168.0.0 |
| 0.0.0.0 | ::ffff:0.0.0.0 |
