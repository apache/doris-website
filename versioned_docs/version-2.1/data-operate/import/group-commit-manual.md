---
{
    "title": "High Concurrency LOAD Optimization(Group Commit)",
    "language": "en",
    "description": "In high-frequency small batch write scenarios, traditional loading methods have the following issues:"
}
---

In high-frequency small batch write scenarios, traditional loading methods have the following issues:

- Each load creates an independent transaction, requiring FE to parse SQL and generate execution plans, affecting overall performance
- Each load generates a new version, causing rapid version growth and increasing background compaction pressure

To solve these problems, Doris introduced the Group Commit mechanism. Group Commit is not a new loading method, but rather an optimization extension of existing loading methods, mainly targeting:

- `INSERT INTO tbl VALUES(...)` statements
- Stream Load

By merging multiple small batch loads into one large transaction commit in the background, it significantly improves high-concurrency small batch write performance. Additionally, using Group Commit with PreparedStatement can achieve even higher performance improvements.

## Group Commit Modes

Group Commit has three modes:

* Off Mode (`off_mode`)

    Group Commit is disabled.

* Synchronous Mode (`sync_mode`)

    Doris commits multiple loads in one transaction based on load and table's `group_commit_interval` property, returning after transaction commit. This is suitable for high-concurrency write scenarios requiring immediate data visibility after loading.

* Asynchronous Mode (`async_mode`)

    Doris first writes data to WAL (Write Ahead Log), then returns immediately. Doris asynchronously commits data based on load and table's `group_commit_interval` property, making data visible after commit. To prevent WAL from occupying too much disk space, it automatically switches to `sync_mode` for large single loads. This is suitable for write latency-sensitive and high-frequency write scenarios.

    WAL count can be viewed through FE http interface as shown [here](../../admin-manual/open-api/fe-http/get-wal-size-action), or by searching for `wal` keyword in BE metrics.

## How to Use Group Commit

Assuming the table structure is:
```sql
CREATE TABLE `dt` (
    `id` int(11) NOT NULL,
    `name` varchar(50) NULL,
    `score` int(11) NULL
) ENGINE=OLAP
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_num" = "1"
);
```

### Using JDBC

When users write using JDBC's `insert into values` method, to reduce SQL parsing and planning overhead, we support MySQL protocol's `PreparedStatement` feature on the FE side. When using `PreparedStatement`, SQL and its load plan are cached in session-level memory cache, and subsequent loads directly use the cached objects, reducing FE CPU pressure. Here's an example of using `PreparedStatement` in JDBC:

**1. Set JDBC URL and enable Prepared Statement on Server side**

```
url = jdbc:mysql://127.0.0.1:9030/db?useServerPrepStmts=true&useLocalSessionState=true&rewriteBatchedStatements=true&cachePrepStmts=true&prepStmtCacheSqlLimit=99999&prepStmtCacheSize=500
```

**2. Configure `group_commit` session variable in one of two ways:**

* Through JDBC url by adding `sessionVariables=group_commit=async_mode`

```
url = jdbc:mysql://127.0.0.1:9030/db?useServerPrepStmts=true&useLocalSessionState=true&rewriteBatchedStatements=true&cachePrepStmts=true&prepStmtCacheSqlLimit=99999&prepStmtCacheSize=500&sessionVariables=group_commit=async_mode
```

* Through SQL execution

```
try (Statement statement = conn.createStatement()) {
    statement.execute("SET group_commit = async_mode;");
}
```

**3. Use `PreparedStatement`**

```java
private static final String JDBC_DRIVER = "com.mysql.jdbc.Driver";
private static final String URL_PATTERN = "jdbc:mysql://%s:%d/%s?useServerPrepStmts=true&useLocalSessionState=true&rewriteBatchedStatements=true&cachePrepStmts=true&prepStmtCacheSqlLimit=99999&prepStmtCacheSize=50$sessionVariables=group_commit=async_mode";
private static final String HOST = "127.0.0.1";
private static final int PORT = 9087;
private static final String DB = "db";
private static final String TBL = "dt";
private static final String USER = "root";
private static final String PASSWD = "";
private static final int INSERT_BATCH_SIZE = 10;

private static void groupCommitInsertBatch() throws Exception {
    Class.forName(JDBC_DRIVER);
    // add rewriteBatchedStatements=true and cachePrepStmts=true in JDBC url
    // set session variables by sessionVariables=group_commit=async_mode in JDBC url
    try (Connection conn = DriverManager.getConnection(
            String.format(URL_PATTERN, HOST, PORT, DB), USER, PASSWD)) {

        String query = "insert into " + TBL + " values(?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(query)) {
            for (int j = 0; j < 5; j++) {
                // 10 rows per insert
                for (int i = 0; i < INSERT_BATCH_SIZE; i++) {
                    stmt.setInt(1, i);
                    stmt.setString(2, "name" + i);
                    stmt.setInt(3, i + 10);
                    stmt.addBatch();
                }
                int[] result = stmt.executeBatch();
            }
        }
    } catch (Exception e) {
        e.printStackTrace();
    }
}
```

Note: Since high-frequency insert into statements will print large amounts of audit logs affecting final performance, printing prepared statement audit logs is disabled by default. You can control whether to print prepared statement audit logs through session variable settings.

```sql
# Configure session variable to enable printing prepared statement audit log, default is false
set enable_prepared_stmt_audit_log=true;
```

For more about **JDBC** usage, refer to [Using Insert Method to Synchronize Data](./import-way/insert-into-manual.md).

### Using Golang for Group Commit

Since Golang has limited support for prepared statements, we can improve Group Commit performance through manual client-side batching. Here's a sample program:

```Golang
package main

import (
	"database/sql"
	"fmt"
	"math/rand"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

const (
	host     = "127.0.0.1"
	port     = 9038
	db       = "test"
	user     = "root"
	password = ""
	table    = "async_lineitem"
)

var (
	threadCount = 20
	batchSize   = 100
)

var totalInsertedRows int64
var rowsInsertedLastSecond int64

func main() {
	dbDSN := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?parseTime=true", user, password, host, port, db)
	db, err := sql.Open("mysql", dbDSN)
	if err != nil {
		fmt.Printf("Error opening database: %s\n", err)
		return
	}
	defer db.Close()

	var wg sync.WaitGroup
	for i := 0; i < threadCount; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			groupCommitInsertBatch(db)
		}()
	}

	go logInsertStatistics()

	wg.Wait()
}

func groupCommitInsertBatch(db *sql.DB) {
	for {
		valueStrings := make([]string, 0, batchSize)
		valueArgs := make([]interface{}, 0, batchSize*16)
		for i := 0; i < batchSize; i++ {
		    valueStrings = append(valueStrings, "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
			valueArgs = append(valueArgs, rand.Intn(1000))
			valueArgs = append(valueArgs, rand.Intn(1000))
			valueArgs = append(valueArgs, rand.Intn(1000))
			valueArgs = append(valueArgs, rand.Intn(1000))
			valueArgs = append(valueArgs, sql.NullFloat64{Float64: 1.0, Valid: true})
			valueArgs = append(valueArgs, sql.NullFloat64{Float64: 1.0, Valid: true})
			valueArgs = append(valueArgs, sql.NullFloat64{Float64: 1.0, Valid: true})
			valueArgs = append(valueArgs, sql.NullFloat64{Float64: 1.0, Valid: true})
			valueArgs = append(valueArgs, "N")
			valueArgs = append(valueArgs, "O")
			valueArgs = append(valueArgs, time.Now())
			valueArgs = append(valueArgs, time.Now())
			valueArgs = append(valueArgs, time.Now())
			valueArgs = append(valueArgs, "DELIVER IN PERSON")
			valueArgs = append(valueArgs, "SHIP")
			valueArgs = append(valueArgs, "N/A")
		}
		stmt := fmt.Sprintf("INSERT INTO %s VALUES %s",
			table, strings.Join(valueStrings, ","))
		_, err := db.Exec(stmt, valueArgs...)
		if err != nil {
			fmt.Printf("Error executing batch: %s\n", err)
			return
		}
		atomic.AddInt64(&rowsInsertedLastSecond, int64(batchSize))
		atomic.AddInt64(&totalInsertedRows, int64(batchSize))
	}
}

func logInsertStatistics() {
	for {
		time.Sleep(1 * time.Second)
		fmt.Printf("Total inserted rows: %d\n", totalInsertedRows)
		fmt.Printf("Rows inserted in the last second: %d\n", rowsInsertedLastSecond)
		rowsInsertedLastSecond = 0
	}
}

```

### INSERT INTO VALUES

* Asynchronous Mode

```sql
# Configure session variable to enable group commit (default is off_mode), enable asynchronous mode
mysql> set group_commit = async_mode;

# The returned label is prefixed with group_commit, indicating whether group commit is used
mysql> insert into dt values(1, 'Bob', 90), (2, 'Alice', 99);
Query OK, 2 rows affected (0.05 sec)
{'label':'group_commit_a145ce07f1c972fc-bd2c54597052a9ad', 'status':'PREPARE', 'txnId':'181508'}

# The label, txn_id, and previous one are the same, indicating that they are accumulated into the same import task
mysql> insert into dt(id, name) values(3, 'John');
Query OK, 1 row affected (0.01 sec)
{'label':'group_commit_a145ce07f1c972fc-bd2c54597052a9ad', 'status':'PREPARE', 'txnId':'181508'}

# Cannot query immediately
mysql> select * from dt;
Empty set (0.01 sec)

# 10 seconds later, data can be queried, and data visibility delay can be controlled by table attribute group_commit_interval.
mysql> select * from dt;
+------+-------+-------+
| id   | name  | score |
+------+-------+-------+
|    1 | Bob   |    90 |
|    2 | Alice |    99 |
|    3 | John  |  NULL |
+------+-------+-------+
3 rows in set (0.02 sec)
```

* Synchronous Mode

```sql
# Configure session variable to enable group commit (default is off_mode), enable synchronous mode
mysql> set group_commit = sync_mode;

# The returned label is prefixed with group_commit, indicating whether group commit is used, and import time is at least table attribute group_commit_interval.
mysql> insert into dt values(4, 'Bob', 90), (5, 'Alice', 99);
Query OK, 2 rows affected (10.06 sec)
{'label':'group_commit_d84ab96c09b60587_ec455a33cb0e9e87', 'status':'PREPARE', 'txnId':'3007', 'query_id':'fc6b94085d704a94-a69bfc9a202e66e2'}

# Data can be read immediately
mysql> select * from dt;
+------+-------+-------+
| id   | name  | score |
+------+-------+-------+
|    1 | Bob   |    90 |
|    2 | Alice |    99 |
|    3 | John  |  NULL |
|    4 | Bob   |    90 |
|    5 | Alice |    99 |
+------+-------+-------+
5 rows in set (0.03 sec)
```

* Off Mode

```sql
mysql> set group_commit = off_mode;
```

### Stream Load

Assuming `data.csv` contains:

```sql
6,Amy,60
7,Ross,98
```

* Asynchronous Mode

```sql
# Import with "group_commit:async_mode" configuration in header

curl --location-trusted -u {user}:{passwd} -T data.csv -H "group_commit:async_mode"  -H "column_separator:,"  http://{fe_host}:{http_port}/api/db/dt/_stream_load
{
    "TxnId": 7009,
    "Label": "group_commit_c84d2099208436ab_96e33fda01eddba8",
    "Comment": "",
    "GroupCommit": true,
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 2,
    "NumberLoadedRows": 2,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 19,
    "LoadTimeMs": 35,
    "StreamLoadPutTimeMs": 5,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 26
}

# The returned GroupCommit is true, indicating that the group commit process is entered
# The returned Label is prefixed with group_commit, indicating the label associated with the import that truly consumes data
```

* Synchronous Mode

```sql
# Import with "group_commit:sync_mode" configuration in header

curl --location-trusted -u {user}:{passwd} -T data.csv -H "group_commit:sync_mode"  -H "column_separator:,"  http://{fe_host}:{http_port}/api/db/dt/_stream_load
{
    "TxnId": 3009,
    "Label": "group_commit_d941bf17f6efcc80_ccf4afdde9881293",
    "Comment": "",
    "GroupCommit": true,
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 2,
    "NumberLoadedRows": 2,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 19,
    "LoadTimeMs": 10044,
    "StreamLoadPutTimeMs": 4,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 10038
}

# The returned GroupCommit is true, indicating that the group commit process is entered
# The returned Label is prefixed with group_commit, indicating the label associated with the import that truly consumes data
```

About Stream Load usage, please refer to [Stream Load](./import-way/stream-load-manual).


Data is automatically committed when either time interval (default 10 seconds) or data volume (default 64 MB) condition is met. These parameters should be used together and tuned based on actual scenarios.

### Modifying Commit Interval

Default commit interval is 10 seconds, users can adjust through table configuration:

```sql
# Modify commit interval to 2 seconds
ALTER TABLE dt SET ("group_commit_interval_ms" = "2000");
```

**Parameter Adjustment Recommendations**:
- Shorter intervals (e.g., 2 seconds):
  - Pros: Lower data visibility latency, suitable for scenarios requiring high real-time performance
  - Cons: More commits, faster version growth, higher background compaction pressure

- Longer intervals (e.g., 30 seconds):
  - Pros: Larger commit batches, slower version growth, lower system overhead
  - Cons: Higher data visibility latency

Recommend setting based on business tolerance for data visibility delay. If system pressure is high, consider increasing the interval.

### Modifying Commit Data Volume

Group Commit's default commit data volume is 64 MB, users can adjust through table configuration:

```sql
# Modify commit data volume to 128MB
ALTER TABLE dt SET ("group_commit_data_bytes" = "134217728");
```

**Parameter Adjustment Recommendations**:
- Smaller threshold (e.g., 32MB):
  - Pros: Less memory usage, suitable for resource-constrained environments
  - Cons: Smaller commit batches, potentially limited throughput

- Larger threshold (e.g., 256MB):
  - Pros: Higher batch commit efficiency, greater system throughput
  - Cons: Uses more memory

Recommend balancing based on system memory resources and data reliability requirements. If memory is sufficient and higher throughput is desired, consider increasing to 128MB or more.


### BE Configuration

1. `group_commit_wal_path`

   * Description: Directory for storing group commit WAL files

   * Default: Creates a `wal` directory under each configured `storage_root_path`. Configuration example:
  
   ```
   group_commit_wal_path=/data1/storage/wal;/data2/storage/wal;/data3/storage/wal
   ```

## Usage Limitations

* **Group Commit Limitations**

  * `INSERT INTO VALUES` statements degrade to non-Group Commit mode in these cases:
    - Transaction writes (`Begin; INSERT INTO VALUES; COMMIT`)
    - Specified Label (`INSERT INTO dt WITH LABEL {label} VALUES`)
    - VALUES containing expressions (`INSERT INTO dt VALUES (1 + 100)`)
    - Column update writes
    - Table doesn't support lightweight mode changes

  * `Stream Load` degrades to non-Group Commit mode in these cases:
    - Using two-phase commit
    - Specified Label (`-H "label:my_label"`)
    - Column update writes
    - Table doesn't support lightweight mode changes

* **Unique Model**
  - Group Commit doesn't guarantee commit order, recommend using Sequence column to ensure data consistency.

* **WAL Limitations**
  - `async_mode` writes data to WAL, deletes after success, recovers through WAL on failure.
  - WAL files are stored with a single replica on one BE, disk damage or accidental file deletion may cause data loss.
  - When offlining BE nodes, use `DECOMMISSION` command to prevent data loss.
  - `async_mode` switches to `sync_mode` in these cases:
    - Load data volume too large (exceeds 80% of WAL single directory space)
    - Unknown data volume chunked stream load
    - Insufficient disk space
  - During heavyweight Schema Change, Group Commit writes are rejected, client needs to retry.

## Performance

We have separately tested the write performance of group commit in high-concurrency scenarios with small data volumes using `Stream Load` and `JDBC` (in `async mode`).

### Stream Load

#### Environment

* 1 Front End (FE) server: Alibaba Cloud with 8-core CPU, 16GB RAM, and one 100GB ESSD PL1 SSD.

* 3 Backend (BE) servers: Alibaba Cloud with 16-core CPU, 64GB RAM, and one 1TB ESSD PL1 SSD.

* 1 Test Client: Alibaba Cloud with 16-core CPU, 64GB RAM, and one 100GB ESSD PL1 SSD.

* The version for testing is Doris-2.1.5.

#### DataSet

* `httplogs`, 31 GB, 247249096 (247 million) rows

#### Test Tool

* [doris-streamloader](../../ecosystem/doris-streamloader)

#### Test Method

* Testing with different data sizes per request and concurrency levels between `non group_commit` and `group_commit=async mode` modes.

#### Test Results

| Load Way           | Single-concurrency Data Size | Concurrency | Cost Seconds | Rows / Seconds | MB / Seconds |
|------------------|-------------|--------|-------------|--------------------|-------------------|
| group_commit     | 10 KB       | 10     | 3306      | 74,787         | 9.8              |
| group_commit     | 10 KB       | 30     | 3264      | 75,750         | 10.0            |
| group_commit     | 100 KB      | 10     | 424       | 582,447        | 76.7             |
| group_commit     | 100 KB      | 30     | 366       | 675,543        | 89.0             |
| group_commit     | 500 KB      | 10     | 187       | 1,318,661       | 173.7            |
| group_commit     | 500 KB      | 30     | 183       | 1,351,087       | 178.0            |
| group_commit     | 1 MB        | 10     | 178       | 1,385,148       | 182.5            |
| group_commit     | 1 MB        | 30     | 178       | 1,385,148       | 182.5            |
| group_commit     | 10 MB       | 10     | 177       | 1,396,887       | 184.0            |
| non group_commit   | 1 MB        | 10     | 2824      | 87,536          | 11.5             |
| non group_commit   | 10 MB       | 10     | 450       | 549,442         | 68.9             |
| non group_commit   | 10 MB       | 30     | 177       | 1,396,887       | 184.0            |

In the above test, the CPU usage of BE fluctuates between 10-40%.

The `group_commit` effectively enhances load performance while reducing the number of versions, thereby alleviating the pressure on compaction.

### JDBC

#### Environment

1 Front End (FE) server: Alibaba Cloud with an 8-core CPU, 16GB RAM, and one 100GB ESSD PL1 SSD.

1 Backend (BE) server: Alibaba Cloud with a 16-core CPU, 64GB RAM, and one 500GB ESSD PL1 SSD.

1 Test Client: Alibaba Cloud with a 16-core CPU, 64GB RAM, and one 100GB ESSD PL1 SSD.

The testing version is Doris-2.1.5.

Disable the printing of prepared statement audit logs to enhance performance.

#### DataSet

* The data of tpch sf10 `lineitem` table, 20 files, 14 GB, 120 million rows

#### Test Method

* [DataX](https://github.com/alibaba/DataX)

#### Test Method

* Use `txtfilereader` wtite data to `mysqlwriter`, config different concurrenncy and rows for per `INSERT` sql.

#### Test Results


| Rows per insert | Concurrency | Rows / Second | MB / Second |
|-------------------|--------|--------------------|--------------------|
| 100               | 10     | 107,172            | 11.47              |
| 100               | 20     | 140,317            | 14.79              |
| 100               | 30     | 142,882            | 15.28              |

In the above test, the CPU usage of BE fluctuates between 10-20%, FE fluctuates between 60-70%.


### Insert into Sync Mode Small Batch Data

**Machine Configuration**

* 1 Front-End (FE): Alibaba Cloud, 16-core CPU, 64GB RAM, 1 x 500GB ESSD PL1 cloud disk
* 5 Back-End (BE) nodes: Alibaba Cloud, 16-core CPU, 64GB RAM, 1 x 1TB ESSD PL1 cloud disk.
* 1 Testing Client: Alibaba Cloud, 16-core CPU, 64GB RAM, 1 x 100GB ESSD PL1 cloud disk
* Test version: Doris-2.1.5

**Dataset**

* The data of tpch sf10 `lineitem` table.

* The create table statement is
```sql
CREATE TABLE IF NOT EXISTS lineitem (
  L_ORDERKEY    INTEGER NOT NULL,
  L_PARTKEY     INTEGER NOT NULL,
  L_SUPPKEY     INTEGER NOT NULL,
  L_LINENUMBER  INTEGER NOT NULL,
  L_QUANTITY    DECIMAL(15,2) NOT NULL,
  L_EXTENDEDPRICE  DECIMAL(15,2) NOT NULL,
  L_DISCOUNT    DECIMAL(15,2) NOT NULL,
  L_TAX         DECIMAL(15,2) NOT NULL,
  L_RETURNFLAG  CHAR(1) NOT NULL,
  L_LINESTATUS  CHAR(1) NOT NULL,
  L_SHIPDATE    DATE NOT NULL,
  L_COMMITDATE  DATE NOT NULL,
  L_RECEIPTDATE DATE NOT NULL,
  L_SHIPINSTRUCT CHAR(25) NOT NULL,
  L_SHIPMODE     CHAR(10) NOT NULL,
  L_COMMENT      VARCHAR(44) NOT NULL
)
DUPLICATE KEY(L_ORDERKEY, L_PARTKEY, L_SUPPKEY, L_LINENUMBER)
DISTRIBUTED BY HASH(L_ORDERKEY) BUCKETS 32
PROPERTIES (
  "replication_num" = "3"
);
```

**Testing Tool**

* [Jmeter](https://jmeter.apache.org/)

JMeter Parameter Settings as Shown in the Images

![jmeter1](/images/group-commit/jmeter1.jpg)
![jmeter2](/images/group-commit/jmeter2.jpg)

1. Set the Init Statement Before Testing:
set group_commit=async_mode and set enable_nereids_planner=false.

2. Enable JDBC Prepared Statement:
Complete URL:
jdbc:mysql://127.0.0.1:9030?useServerPrepStmts=true&useLocalSessionState=true&rewriteBatchedStatements=true&cachePrepStmts=true&prepStmtCacheSqlLimit=99999&prepStmtCacheSize=50&sessionVariables=group_commit=async_mode,enable_nereids_planner=false.

3. Set the Import Type to Prepared Update Statement.

4. Set the Import Statement.

5. Set the Values to Be Imported:
Ensure that the imported values match the data types one by one.

**Testing Methodology**

* Use JMeter to write data into Doris. Each thread writes 1 row of data per execution using the insert into statement.

**Test Results**

* Data unit: rows per second.

* The following tests are divided into 30, 100, and 500 concurrency.

**Performance Test with 30 Concurrent Users in Sync Mode, 5 BEs, and 3 Replicas**

| Group Commit Interval | 10ms | 20ms | 50ms | 100ms |
|-----------------------|---------------|---------------|---------------|---------------|
|                       | 321.5      | 307.3      | 285.8    | 224.3    |

**Performance Test with 100 Concurrent Users in Sync Mode, 5 BEs, and 3 Replicas**

| Group Commit Interval | 10ms | 20ms | 50ms | 100ms |
|-----------------------|---------------|---------------|---------------|---------------|
|                       | 1175.2     | 1108.7     | 1016.3    | 704.5  |

**Performance Test with 500 Concurrent Users in Sync Mode, 5 BEs, and 3 Replicas**

| Group Commit Interval | 10ms | 20ms | 50ms | 100ms |
|-----------------------|---------------|---------------|---------------|---------------|
|                       | 3289.8    | 3686.7      | 3280.7    | 2609.2   |

### Insert into Sync Mode Large Batch Data

**Machine Configuration**

* 1 Front-End (FE): Alibaba Cloud, 16-core CPU, 64GB RAM, 1 x 500GB ESSD PL1 cloud disk

* 5 Back-End (BE) nodes: Alibaba Cloud, 16-core CPU, 64GB RAM, 1 x 1TB ESSD PL1 cloud disk.

* 1 Testing Client: Alibaba Cloud, 16-core CPU, 64GB RAM, 1 x 100GB ESSD PL1 cloud disk

* Test version: Doris-2.1.5

**Dataset**

* Insert into statement for 1000 rows: `insert into tbl values(1,1)...` (1000 rows omitted)

**Testing Tool**

* [Jmeter](https://jmeter.apache.org/)

**Testing Methodology**

* Use JMeter to write data into Doris. Each thread writes 1000 row of data per execution using the insert into statement.

**Test Results**

* Data unit: rows per second.

* The following tests are divided into 30, 100, and 500 concurrency.

**Performance Test with 30 Concurrent Users in Sync Mode, 5 BEs, and 3 Replicas**

| Group commit interval | 10ms | 20ms | 50ms | 100ms |
|-----------------------|---------------|---------------|---------------|---------------|
|                       | 92.2K     | 85.9K     | 84K     | 83.2K     |

**Performance Test with 100 Concurrent Users in Sync Mode, 5 BEs, and 3 Replicas**

| Group commit interval | 10ms | 20ms | 50ms | 100ms |
|-----------------------|---------------|---------------|---------------|---------------|
|                       | 70.4K     |70.5K     | 73.2K      | 69.4K    |

**Performance Test with 500 Concurrent Users in Sync Mode, 5 BEs, and 3 Replicas**

| Group commit interval | 10ms | 20ms | 50ms | 100ms |
|-----------------------|---------------|---------------|---------------|---------------|
|                       | 46.3K      | 47.7K     | 47.4K      | 46.5K      |
