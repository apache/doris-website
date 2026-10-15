---
{
    "title": "UNCOMPRESS",
    "language": "ja",
    "description": "UNCOMPRESS 関数は、バイナリデータを展開して文字列または値に戻します。バイナリデータは COMPRESS 関数の結果である必要があります。"
}
---

## 説明
UNCOMPRESS 関数は、バイナリデータを展開して文字列または値に戻します。バイナリデータは `COMPRESS` 関数の結果である必要があります。

## 構文

```sql
UNCOMPRESS(<compressed_str>)
```

## パラメータ

| パラメータ | 説明 |
|----------|------|
| `<compressed_str>` | 圧縮されたバイナリデータ。型は VARCHAR または STRING |

## 戻り値

戻り値の型は、入力 `compressed_str` の型と同じです。

特殊なケース:
- `compressed_str` が `COMPRESS` で生成されたバイナリデータでない場合、NULL を返します。


## 例

``` sql
select uncompress(compress('abc'));
```
```text 
+-----------------------------+
| uncompress(compress('abc')) |
+-----------------------------+
| abc                         |
+-----------------------------+
```
```sql
select uncompress(compress(''));
```
```text 
+--------------------------+
| uncompress(compress('')) |
+--------------------------+
|                          |
+--------------------------+
```
```sql
select uncompress('abc');
```
```text 
+-------------------+
| uncompress('abc') |
+-------------------+
| NULL              |
+-------------------+
```

### キーワード

    UNCOMPRESS, COMPRESS
