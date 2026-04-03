---
{
  "title": "BloomFilterインデックス",
  "language": "ja",
  "description": "BloomFilterインデックスは、BloomFilterに基づくスキップインデックスの一種です。"
}
---
## インデックスの原理

BloomFilterインデックスは、BloomFilterに基づくスキップインデックスの一種です。その原理は、BloomFilterを使用して等価クエリに対して指定された条件を満たさないデータブロックをスキップし、それによってIOを削減してクエリを高速化することです。

BloomFilterは、1970年にBloomによって提案された高速検索アルゴリズムで、複数のハッシュ関数を使用します。100%の精度を必要とせずに、要素が集合に属するかどうかを迅速に判断する必要があるシナリオで一般的に使用されます。BloomFilterには以下の特徴があります：

- 要素が集合内にあるかどうかをチェックするために使用される、空間効率の良い確率的データ構造です。
- メンバーシップチェックに対して、BloomFilterは2つの結果のうち1つを返します：集合内にある可能性があるか、確実に集合内にないかです。

BloomFilterは、非常に長いバイナリビット配列と一連のハッシュ関数で構成されています。ビット配列は最初にすべて0に設定されています。要素をチェックする際は、一連のハッシュ関数によってハッシュ化されて一連の値が生成され、配列内のこれらの位置のビットが1に設定されます。

下図は、m=18およびk=3のBloomFilterの例を示しています（mはビット配列のサイズ、kはハッシュ関数の数）。集合内の要素x、y、zが3つの異なるハッシュ関数によってビット配列にハッシュされています。要素wをクエリする際、ハッシュ関数によって計算されたビットのいずれかが0であれば、wは集合内にありません。逆に、すべてのビットが1であれば、wが集合内にある可能性があることを示すのみで、ハッシュ衝突の可能性があるため確実ではありません。

![Bloom Filter](/images/Bloom_filter.svg.png)

したがって、計算された位置のすべてのビットが1であっても、ハッシュ衝突の可能性があるため、要素が集合内にある可能性を示すのみで、確実ではありません。これがBloomFilterの「偽陽性」の性質です。そのため、BloomFilterベースのインデックスは条件を満たさないデータをスキップすることはできますが、条件を満たすデータを正確に特定することはできません。

DorisのBloomFilterインデックスはページ単位で構築され、各データブロックがBloomFilterを格納します。書き込み時には、データブロック内の各値が対応するBloomFilterにハッシュされます。クエリ時には、等価条件に対して各データブロックのBloomFilterが値を含んでいるかどうかをチェックします。含んでいない場合、そのデータブロックはスキップされ、IOが削減されてクエリが高速化されます。

## 使用事例

BloomFilterインデックスは等価クエリ（=およびINを含む）を高速化することができ、useridのような一意のIDフィールドなど、高カーディナリティフィールドに対して効果的です。

:::tip

BloomFilterには以下の制限があります：

1. inおよび=以外のクエリ（!=、NOT IN、>、<など）には効果がありません。
2. Tinyint、Float、Double型の列でのBloomFilterインデックス作成をサポートしていません。
3. 低カーディナリティフィールドに対する高速化効果は限定的です。例えば、2つの値のみを持つ「性別」フィールドは、ほぼすべてのデータブロックに含まれる可能性が高く、BloomFilterインデックスが無意味になります。

クエリに対するBloomFilterインデックスの効果を確認するには、Query Profileで関連するメトリクスを分析できます。

- BlockConditionsFilteredBloomFilterTimeは、BloomFilterインデックスによって消費された時間です。
- RowsBloomFilterFilteredは、BloomFilterによってフィルタリングされた行数です。他のRows値と比較してBloomFilterインデックスのフィルタリング効果を分析できます。

:::

## インデックスの管理

### テーブル作成時のBloomFilterインデックスの作成

歴史的な理由により、BloomFilterインデックスの定義構文は、転置インデックスで使用される一般的なINDEX構文とは異なります。BloomFilterインデックスは、「bloom_filter_columns」を使用してテーブルのPROPERTIESで指定され、1つまたは複数のフィールドを指定できます。

```sql
PROPERTIES (
"bloom_filter_columns" = "column_name1,column_name2"
);
```
### BloomFilter インデックスの表示

```sql
SHOW CREATE TABLE table_name;
```
### 既存テーブルでのBloomFilterインデックスの追加または削除

ALTER TABLEを使用してテーブルのbloom_filter_columnsプロパティを変更し、BloomFilterインデックスを追加または削除します。

**column_name3のBloomFilterインデックスを追加**

```sql
ALTER TABLE table_name SET ("bloom_filter_columns" = "column_name1,column_name2,column_name3");
```
**column_name1のBloomFilterインデックスを削除する**

```sql
ALTER TABLE table_name SET ("bloom_filter_columns" = "column_name2,column_name3");
```
## インデックスの使用

BloomFilterインデックスは、WHERE句での等価クエリを高速化するために使用されます。適用可能な場合は自動的に有効になり、特別な構文は必要ありません。

BloomFilterインデックスの高速化効果は、Query Profileの以下のメトリクスを使用して分析できます：
- RowsBloomFilterFiltered: BloomFilterインデックスによってフィルタリングされた行数。他のRows値と比較して、インデックスのフィルタリング効果を分析できます。
- BlockConditionsFilteredBloomFilterTime: BloomFilter転置インデックスによって消費された時間。

## 使用例

以下は、DorisでBloomFilterインデックスを作成する方法の例です。

DorisのBloomFilterインデックスは、CREATE TABLE文で"bloom_filter_columns"プロパティを追加することで作成され、k1、k2、k3がBloomFilterインデックスのキー列となります。例えば、以下はsaler_idとcategory_idにBloomFilterインデックスを作成します。

```sql
CREATE TABLE IF NOT EXISTS sale_detail_bloom  (
    sale_date date NOT NULL COMMENT "Sale date",
    customer_id int NOT NULL COMMENT "Customer ID",
    saler_id int NOT NULL COMMENT "Salesperson",
    sku_id int NOT NULL COMMENT "Product ID",
    category_id int NOT NULL COMMENT "Product category",
    sale_count int NOT NULL COMMENT "Sales quantity",
    sale_price DECIMAL(12,2) NOT NULL COMMENT "Unit price",
    sale_amt DECIMAL(20,2)  COMMENT "Total sales amount"
)
DUPLICATE KEY(sale_date, customer_id, saler_id, sku_id, category_id)
DISTRIBUTED BY HASH(saler_id) BUCKETS 10
PROPERTIES (
"replication_num" = "1",
"bloom_filter_columns"="saler_id,category_id"
);
```
