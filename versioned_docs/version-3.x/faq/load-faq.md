---
{
    "title": "Load FAQ",
    "language": "en"
}
---

## General Load FAQ

### Error "[DATA_QUALITY_ERROR] Encountered unqualified data"
**Problem Description**: Data quality error during loading.

**Solution**:
- Stream Load and Insert Into operations will return an error URL, while for Broker Load you can check the error URL through the `Show Load` command.
- Use a browser or curl command to access the error URL to view the specific data quality error reasons.
- Use the strict_mode and max_filter_ratio parameters to control the acceptable error rate.

### Error "[E-235] Failed to init rowset builder"
**Problem Description**: Error -235 occurs when the load frequency is too high and data hasn't been compacted in time, exceeding version limits.

**Solution**:
- Increase the batch size of data loading and reduce loading frequency.
- Increase the `max_tablet_version_num` parameter in `be.conf`, it is recommended not to exceed 5000.

### Error "[E-238] Too many segments in rowset"
**Problem Description**: Error -238 occurs when the number of segments under a single rowset exceeds the limit.

**Common Causes**:
- The bucket number configured during table creation is too small.
- Data skew occurs; consider using more balanced bucket keys.

### Error "Transaction commit successfully, BUT data will be visible later"
**Problem Description**: Data load is successful but temporarily not visible.

**Cause**: Usually due to transaction publish delay caused by system resource pressure.

### Error "Failed to commit kv txn [...] Transaction exceeds byte limit"
**Problem Description**: In shared-nothing mode, too many partitions and tablets are involved in a single load, exceeding the transaction size limit.

**Solution**:
- Load data by partition in batches to reduce the number of partitions involved in a single load.
- Optimize table structure to reduce the number of partitions and tablets.

### Extra "\r" in the last column of CSV file
**Problem Description**: Usually caused by Windows line endings.

**Solution**:
Specify the correct line delimiter: `-H "line_delimiter:\r\n"`

### CSV data with quotes imported as null
**Problem Description**: CSV data with quotes becomes null after import.

**Solution**:
Use the `trim_double_quotes` parameter to remove double quotes around fields.

## Stream Load

### Reasons for Slow Loading
- Bottlenecks in CPU, IO, memory, or network card resources.
- Slow network between client machine and BE machines, can be initially diagnosed through ping latency from client to BE machines.
- Webserver thread count bottleneck, too many concurrent Stream Loads on a single BE (exceeding be.conf webserver_num_workers configuration) may cause thread count bottleneck.
- Memtable Flush thread count bottleneck, check BE metrics doris_be_flush_thread_pool_queue_size to see if queuing is severe. Can be resolved by increasing the be.conf flush_thread_num_per_store parameter.

### Handling Special Characters in Column Names
When column names contain special characters, use single quotes with backticks to specify the columns parameter:
```shell
curl --location-trusted -u root:"" \
    -H 'columns:`@coltime`,colint,colvar' \
    -T a.csv \
    -H "column_separator:," \
    http://127.0.0.1:8030/api/db/loadtest/_stream_load
```

## Routine Load 

### Major Bug Fixes

| Issue Description | Trigger Conditions | Impact Scope | Temporary Solution | Affected Versions | Fixed Versions | Fix PR |
|------------------|-------------------|--------------|-------------------|------------------|----------------|---------|
| When at least one job times out while connecting to Kafka, it affects the import of other jobs, slowing down global Routine Load imports. | At least one job times out while connecting to Kafka. | Shared-nothing and shared-storage | Stop or manually pause the job to resolve the issue. | <2.1.9 <3.0.5 | 2.1.9 3.0.5 | [#47530](https://github.com/apache/doris/pull/47530) |
| User data may be lost after restarting the FE Master. | The job's offset is set to OFFSET_END, and the FE is restarted. | Shared-storage | Change the consumption mode to OFFSET_BEGINNING. | 3.0.2-3.0.4 | 3.0.5 | [#46149](https://github.com/apache/doris/pull/46149) |
| A large number of small transactions are generated during import, causing compaction to fail and resulting in continuous -235 errors. | Doris consumes data too quickly, or Kafka data flow is in small batches. | Shared-nothing and shared-storage | Pause the Routine Load job and execute the following command: `ALTER ROUTINE LOAD FOR jobname FROM kafka ("property.enable.partition.eof" = "false");` | <2.1.8 <3.0.4 | 2.1.8 3.0.4 | [#45528](https://github.com/apache/doris/pull/45528), [#44949](https://github.com/apache/doris/pull/44949), [#39975](https://github.com/apache/doris/pull/39975) |
| Kafka third-party library destructor hangs, causing data consumption to fail. | Kafka topic deletion (possibly other conditions). | Shared-nothing and shared-storage | Restart all BE nodes. | <2.1.8 <3.0.4 | 2.1.8 3.0.4 | [#44913](https://github.com/apache/doris/pull/44913) |
| Routine Load scheduling hangs. | Timeout occurs when FE aborts a transaction in Meta Service. | Shared-storage | Restart the FE node. | <3.0.2 | 3.0.2 | [#41267](https://github.com/apache/doris/pull/41267) |
| Routine Load restart issue. | Restarting BE nodes. | Shared-nothing and shared-storage | Manually resume the job. | <2.1.7 <3.0.2 | 2.1.7 3.0.2 | [#3727](https://github.com/apache/doris/pull/40728) |

### Default Configuration Optimizations

| Optimization Content | Applied Versions | Corresponding PR |
|---------------------|------------------|------------------|
| Increased the timeout duration for Routine Load. | 2.1.7 3.0.3 | [#42042](https://github.com/apache/doris/pull/42042), [#40818](https://github.com/apache/doris/pull/40818) |
| Adjusted the default value of `max_batch_interval`. | 2.1.8 3.0.3 | [#42491](https://github.com/apache/doris/pull/42491) |
| Removed the restriction on `max_batch_interval`. | 2.1.5 3.0.0 | [#29071](https://github.com/apache/doris/pull/29071) |
| Adjusted the default values of `max_batch_rows` and `max_batch_size`. | 2.1.5 3.0.0 | [#36632](https://github.com/apache/doris/pull/36632) |

### Observability Optimizations

| Optimization Content | Applied Versions | Corresponding PR |
|---------------------|------------------|------------------|
| Added observability-related metrics. | 3.0.5 | [#48209](https://github.com/apache/doris/pull/48209), [#48171](https://github.com/apache/doris/pull/48171), [#48963](https://github.com/apache/doris/pull/48963) |

### Error "failed to get latest offset"
**Problem Description**: Routine Load cannot get the latest Kafka offset.

**Common Causes**:
- Usually due to network connectivity issues with Kafka. Verify by pinging or using telnet to test the Kafka domain name.
- Timeout caused by third-party library bug, error: java.util.concurrent.TimeoutException: Waited X seconds

### Error "failed to get partition meta: Local:'Broker transport failure"
**Problem Description**: Routine Load cannot get Kafka Topic Partition Meta.

**Common Causes**:
- Usually due to network connectivity issues with Kafka. Verify by pinging or using telnet to test the Kafka domain name.
- If using domain names, try configuring domain name mapping in /etc/hosts

### Error "Broker: Offset out of range"
**Problem Description**: The consumed offset doesn't exist in Kafka, possibly because it has been cleaned up by Kafka.

**Solution**:
- Need to specify a new offset for consumption, for example, set offset to OFFSET_BEGINNING.
- Need to set appropriate Kafka log cleanup parameters based on import speed: log.retention.hours, log.retention.bytes, etc.
