---
{
  "title": "XOR | ビット演算関数",
  "language": "ja",
  "description": "2つのBOOLEAN値に対してビット単位のXOR演算を実行します。",
  "sidebar_label": "XOR"
}
---
# XOR

## 説明
2つのBOOLEAN値に対してビット単位のXOR演算を実行します。

## 構文

```sql
<lhs> XOR <rhs>
```
## パラメータ
- `<lhs>`: ビット単位XOR演算の最初のBOOLEAN値。
- `<rhs>`: ビット単位XOR演算の2番目のBOOLEAN値。

## 戻り値
2つのBOOLEAN値のXOR値を返します。

## 例
1. 例1

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
