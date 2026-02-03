---
{
    "title": "Column Compression",
    "language": "en_US",
    "description": "Doris adopts a columnar storage model to organize and store data,"
}
---

Doris adopts a **columnar storage** model to organize and store data, which is particularly suitable for analytical workloads and can significantly improve query efficiency. In columnar storage, each column of the table is stored independently, facilitating the application of compression techniques and thus improving storage efficiency. Doris provides various compression algorithms, allowing users to choose the appropriate compression method based on workload requirements to optimize storage and query performance.

## Why Compression is Needed

In Doris, data compression mainly has the following two core objectives:

1. **Improve Storage Efficiency**
   Compression can significantly reduce the disk space required for data storage, allowing more data to be stored on the same physical resources.

2. **Optimize Performance**
   The volume of compressed data is smaller, requiring fewer I/O operations during queries, thereby accelerating query response times. Modern compression algorithms typically have very fast decompression speeds, which can enhance read efficiency while reducing storage space.

## Supported Compression Algorithms

Doris supports various compression algorithms, each with different trade-offs between compression ratio and decompression speed, allowing users to choose the appropriate algorithm based on their needs:

| **Compression Type**           | **Characteristics**          | **Applicable Scenarios**                                       |
|---------------------------------|--------------------------------------------|----------------------------------------------|
| **No Compression**             | - No compression applied to data.                                                                                     | Suitable for scenarios where compression is not needed, such as when the data is already compressed or storage space is not an issue. |
| **LZ4**                        | - Very fast compression and decompression speeds. <br /> - Moderate compression ratio.                                 | Suitable for scenarios with high decompression speed requirements, such as real-time queries or high-concurrency loads. |
| **LZ4F (LZ4 Frame)**           | - Extended version of LZ4 supporting more flexible compression configurations. <br /> - Fast speed with moderate compression ratio. | Needed when fast compression is required with fine control over configurations. |
| **LZ4HC (LZ4 High Compression)** | - Higher compression ratio compared to LZ4, but slower compression speed. <br /> - Decompression speed is comparable to LZ4. | Needed when a higher compression ratio is required, while still focusing on decompression speed. |
| **ZSTD (Zstandard)**           | - High compression ratio with flexible compression level adjustments. <br /> - Decompression speed remains fast even at high compression ratios. | Required for high storage efficiency demands, while balancing query performance. |
| **Snappy**                     | - Designed for fast decompression. <br /> - Moderate compression ratio.                                                 | Required for scenarios with high decompression speed and low CPU overhead demands. |
| **Zlib**                       | - Good balance between compression ratio and speed. <br /> - Slower compression and decompression speeds compared to other algorithms, but higher compression ratio. | Required for scenarios with high storage efficiency demands and insensitivity to decompression speed, such as archiving and cold data storage. |


## Compression Principles

**Column Compression**
   Due to the adoption of columnar storage, Doris can independently compress each column in the table. This method enhances compression efficiency because the data in the same column often has similar distribution characteristics.

**Encoding Before Compression**
   Before compressing data, Doris encodes the column data (e.g., **dictionary encoding**, **run-length encoding**, etc.) to transform the data into a form more suitable for compression, further enhancing compression efficiency.

**Storage Format V3 Optimizations**
   Starting from Doris Storage Format V3, the encoding strategy for numerical types has been further optimized. It defaults to `PLAIN_ENCODING` for integer types, which, when combined with LZ4/ZSTD, provides higher read throughput and lower CPU overhead. For more details, see [Storage Format V3](./storage-format).

**Page Compression**
   Doris adopts a **page**-level compression strategy. The data in each column is divided into multiple pages, and the data within each page is compressed independently. By compressing by page, Doris can efficiently handle large-scale datasets while ensuring high compression ratios and decompression performance.

**Configurable Compression Strategies**
   Users can specify the compression algorithm to be used when creating a table. This flexibility allows users to make the best choice between compression efficiency and performance based on specific workloads.

## Factors Affecting Compression Effectiveness

Although different compression algorithms have their own advantages and disadvantages, the effectiveness of compression depends not only on the chosen algorithm but also on the following factors:

### Order of Data
   The order of data has a significant impact on compression effectiveness. For columns with high sequentiality (e.g., timestamps or continuous numeric columns), compression algorithms can typically achieve better results. The more regular the order of the data, the more repetitive patterns the compression algorithm can identify during compression, thus improving the compression ratio.

### Data Redundancy
   The more duplicate values in a data column, the more pronounced the compression effect. For example, using dictionary encoding on duplicate values can significantly reduce storage space. However, for data columns without obvious duplicates, the compression effect may not meet expectations.

### Data Type
   The type of data can also affect compression effectiveness. Generally, numeric data types (such as integers and floating-point numbers) are easier to compress than string data types. For data types with a wide range of values, the effectiveness of the compression algorithm may be impacted.

### Column Length
   The length of data in a column can also affect compression effectiveness. Shorter columns are usually easier to compress than longer columns because compression algorithms can more efficiently find repetitive patterns in shorter data blocks.

### Nulls
   When the proportion of null values in a column is high, the compression algorithm may be more effective because it can encode these null values as a special pattern, reducing storage space.

## How to Choose the Right Compression Algorithm

Choosing the right compression algorithm should be based on workload characteristics:

- For **high-performance real-time analysis** scenarios, it is recommended to use **LZ4** or **Snappy**.
- For scenarios prioritizing **storage efficiency**, it is recommended to use **ZSTD** or **Zlib**.
- For scenarios that need to balance speed and compression ratio, **LZ4F** can be chosen.
- For **archiving or cold data storage** scenarios, it is advisable to use **Zlib** or **LZ4HC**.

## Setting Compression in Doris

When creating a table, you can specify the compression algorithm to determine how the data is stored:

```sql
CREATE TABLE example_table (
    id INT,
    name STRING,
    age INT
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES (
    "compression" = "zstd"
);
