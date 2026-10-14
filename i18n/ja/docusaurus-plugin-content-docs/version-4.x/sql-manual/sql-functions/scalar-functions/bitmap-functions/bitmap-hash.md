---
{
    "title": "BITMAP_HASH",
    "language": "ja",
    "description": "任意の入力型の値から 32 ビットのハッシュ値を計算し、そのハッシュ値を含む Bitmap を返します。"
}
---

## 説明

任意の入力型の値から 32 ビットのハッシュ値を計算し、そのハッシュ値を含む Bitmap を返します。

## 構文

```sql
BITMAP_HASH(<expr>)
```

## パラメータ

| パラメータ | 説明 |
|-----------|------|
| `<expr>`  | 任意の値またはフィールド式 |

## 戻り値

パラメータ `<expr>` の 32 ビットのハッシュ値を含む Bitmap を返します。
- パラメータが NULL の場合、空の Bitmap を返します。

::: note

使用するハッシュアルゴリズムは MurMur3 です。  
MurMur3 は、高速で衝突が少なく、ランダムな分布に近い値を生成し、カイ二乗分布検定に合格できるハッシュアルゴリズムです。計算されるハッシュ値は、ハードウェアプラットフォームやシード値によって異なる場合がある点に注意してください。  
このアルゴリズムの性能について詳しくは、[Smhasher](http://rurban.github.io/smhasher/) ベンチマークを参照してください。

:::

## 例

値の MurMur3 ハッシュを計算するには、次のようにします。

```sql
select bitmap_to_array(bitmap_hash('hello'))[1];
```

結果は次のとおりです。

```text
+-------------------------------------------------------------+
| %element_extract%(bitmap_to_array(bitmap_hash('hello')), 1) |
+-------------------------------------------------------------+
|                                                  1321743225 |
+-------------------------------------------------------------+
```

Bitmap を使用して列内の異なる値の数を数える方法は、場合によっては `count distinct` より効率的です。次の例では、4 種類の値を含む 6 行を `words` テーブルに挿入します。ドキュメントコーパス規模では、同じ形式の実際のクエリが数百万という結果を返すこともあります。

```sql
CREATE TABLE `words` (`word` VARCHAR(64))
DISTRIBUTED BY HASH(`word`) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO `words` VALUES ('apple'), ('banana'), ('cherry'), ('apple'), ('date'), ('banana');

select bitmap_count(bitmap_union(bitmap_hash(`word`))) from `words`;
```

```text
+-------------------------------------------------+
| bitmap_count(bitmap_union(bitmap_hash(`word`))) |
+-------------------------------------------------+
|                                               4 |
+-------------------------------------------------+
```

```sql
select bitmap_to_string(bitmap_hash(NULL)) AS res;
```

結果は次のとおりです。

```text
+------+
| res  |
+------+
|      |
+------+
```
