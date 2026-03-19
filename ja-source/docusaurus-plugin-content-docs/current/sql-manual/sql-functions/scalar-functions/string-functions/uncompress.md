---
{
  "title": "UNCOMPRESS",
  "language": "ja",
  "description": "UNCOMPRESS関数は、バイナリデータを文字列または値に展開します。バイナリデータがCOMPRESS関数の結果であることを確認する必要があります。"
}
---
## 説明
UNCOMPRESS関数は、バイナリデータを文字列または値に展開します。バイナリデータが`COMPRESS`関数の結果であることを確認する必要があります。

## 構文

```sql
UNCOMPRESS(<compressed_str>)
```
## パラメータ

| パラメータ          | 説明            |
|--------------------|------------------------|
| `<compressed_str>` | 圧縮されたバイナリデータ、パラメータタイプはvarcharまたはstring |

## 戻り値

戻り値のタイプは入力の`compressed_str`タイプと同じです。

特殊なケース：
- `compressed_str`が`COMPRESS`から取得されたバイナリデータでない場合、NULLを返します。


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
