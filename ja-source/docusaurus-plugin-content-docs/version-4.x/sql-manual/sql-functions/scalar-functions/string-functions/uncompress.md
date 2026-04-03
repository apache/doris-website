---
{
  "title": "UNCOMPRESS",
  "description": "UNCOMPRESS関数は、バイナリデータを文字列または値に展開します。バイナリデータがCOMPRESS関数の結果であることを確認する必要があります。",
  "language": "ja"
}
---
## 説明
UNCOMPRESS関数はバイナリデータを文字列または値に展開します。バイナリデータが`COMPRESS`関数の結果であることを確認する必要があります。

## 構文

```sql
UNCOMPRESS(<compressed_str>)
```
## パラメータ

| Parameter          | デスクリプション            |
|--------------------|------------------------|
| `<compressed_str>` | 圧縮されたバイナリデータ、パラメータタイプはvarcharまたはstring |

## Return Value

戻り値の型は入力の`compressed_str`の型と同じです。

特殊なケース:
- `compressed_str`が`COMPRESS`から取得されたバイナリデータでない場合、NULLを返します。


## Examples

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
### Keywords

    UNCOMPRESS, COMPRESS
