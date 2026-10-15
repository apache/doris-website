---
{
    "title": "XOR | ビット演算関数",
    "language": "ja",
    "description": "両方の BOOLEAN 値に対してビット単位の XOR 演算を実行します。",
    "sidebar_label": "XOR"
}
---

# XOR

## 説明
両方の BOOLEAN 値に対してビット単位の XOR 演算を実行します。

## 構文
```sql
<lhs> XOR <rhs>
```

## パラメータ
- `<lhs>`: ビット単位の XOR 演算の最初の BOOLEAN 値。
- `<rhs>`: ビット単位の XOR 演算の次の BOOLEAN 値。

## 戻り値
両方の BOOLEAN 値に対する XOR 演算の結果を返します。

## 使用例
1. 使用例 1
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
2. NULL 引数
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
