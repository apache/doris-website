---
{
    "title": "位图索引",
    "language": "zh-CN",
    "description": "位图索引（Bitmap Index）就是用位图表示的索引，对列的每个键值建立一个位图，相对于其它索引，占用的存储空间非常小，创建和使用非常快，缺点是修改操作锁粒度大，不适合频繁更新。"
}
---

位图索引（Bitmap Index）就是用位图表示的索引，对列的每个键值建立一个位图，相对于其它索引，占用的存储空间非常小，创建和使用非常快，缺点是修改操作锁粒度大，不适合频繁更新。

如下图，bitmap 索引将每个被索引的列的值作为 KEY，使用每个 BIT 表示一行，当这行中包含这个值时，设置为 1，否则设置为 0。

![Bitmap Index](/images/bitmap-index-example.png)

## 适用场景

-   建在值重复度高的列上，建议在 100 到 100,000 之间，如：职业、地市等。重复度过高则对比其他类型索引没有明显优势；重复度过低，则空间效率和性能会大大降低。

-   特定类型的查询例如 count、or、and 等逻辑操作只需要进行位运算。如：通过多个条件组合查询，`select count(*) from table where city = ’南京市’and job = ’医生’ and phonetype = ‘iphone’and gender =’男’`。类似这种场景，如果在每个查询条件列上都建立了 Bitmap 索引，则数据库可以进行高效的 bit 运算，精确定位到需要的数据，减少磁盘 IO，并且筛选出的结果集越小，Bitmap 索引的优势越明显。

-   适用于即席查询、多维分析等分析场景。如果有一张表有 100 列，用户会使用其中的 20 个列作为查询条件（任意使用这 20 个列上的 N 的列），在这些列上创建 20 个 Bitmap 索引，那么所有的查询都可以应用到索引。

## 不适用场景

-   值重复度低的列，如：身份证号、手机号码等。

-   重复度过高的列，如：性别，可以建立 Bitmap 索引，但不建议单独作为查询条件使用，建议与其他条件共同过滤。

-   经常需要更新修改的列。

## 创建位图索引

在表名为 table_name 上为 siteid 创建 Bitmap 索引

```sql
CREATE INDEX [IF NOT EXISTS] index_name ON table1 (siteid) USING BITMAP;
```

## 查看位图索引

展示指定 table_name 的下索引

```sql
SHOW INDEX FROM table_name;
```

## 删除索引

删除指定 table_name 的下索引

```sql
DROP INDEX [IF EXISTS] index_name ON table_name;
```

## 注意事项

-   Bitmap 索引仅在单列上创建。

-   Bitmap 索引能够应用在 `Duplicate`、`Uniq` 数据模型的所有列和 `Aggregate`模型的 Key 列上。

-   Bitmap 索引支持的数据类型如下：

    -   `TINYINT`
    -   `SMALLINT`
    -   `INT`
    -   `BIGINT`
    -   `CHAR`
    -   `VARCHAR`
    -   `DATE`
    -   `DATETIME`
    -   `LARGEINT`
    -   `DECIMAL`
    -   `BOOL`