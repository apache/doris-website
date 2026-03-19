---
{
  "title": "XOR | ビット演算関数",
  "sidebar_label": "XOR",
  "description": "2つのBOOLEAN値に対してビット単位のXOR演算を実行します。",
  "language": "ja"
}
---
# XOR

## デスクリプション
2つのBOOLEAN値に対してビット単位のXOR演算を実行します。

## Syntax

```sql
<lhs> XOR <rhs>
```
## パラメータ
- `<lhs>`: ビット単位XOR演算の最初のBOOLEAN値。
- `<rhs>`: ビット単位XOR演算の2番目のBOOLEAN値。

## Return Value
2つのBOOLEAN値のXOR値を返します。

## Examples
1. Example 1

    ```sql
    select true XOR false, true XOR true;
    ```
    ```text
    +----------------+---------------+
    | true XOR false | true XOR true |
    +----------------+---------------+
    |              1 |             0 |
    +----------------+---------------+
    ```
2. NULL引数

    ```sql
    select true XOR NULL, NULL XOR true, false XOR NULL, NULL XOR false, NULL XOR NULL;
    ```
    ```text
    +---------------+---------------+----------------+----------------+---------------+
    | true XOR NULL | NULL XOR true | false XOR NULL | NULL XOR false | NULL XOR NULL |
    +---------------+---------------+----------------+----------------+---------------+
    |          NULL |          NULL |           NULL |           NULL |          NULL |
    +---------------+---------------+----------------+----------------+---------------+
    ```
