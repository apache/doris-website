---
{
    "title": "Recycler",
    "language": "en"
}
---

# Doris Storage-Compute Separation Data Recycling

## Introduction

In the era of big data, data lifecycle management has become one of the core challenges for distributed database systems. With the explosive growth of business data volumes, how to achieve efficient storage space reclamation while ensuring data security has become a critical issue that every database product must address.

Apache Doris, as a next-generation real-time analytical database, adopts a Mark-for-Deletion data recycling strategy under its storage-compute separation architecture, with deep optimization and enhancements built upon this foundation. By introducing fine-grained hierarchical recycling mechanisms, flexible and configurable expiration protection, multiple data consistency checks, and a comprehensive observability system, while fully considering the complexity of distributed environments, Doris has designed an independent Recycler component, intelligent concurrency control, and complete monitoring metrics. This provides users with an enterprise-grade data lifecycle management solution that is both efficient and controllable, achieving the optimal balance between performance, security, and controllability.

This article will provide an in-depth analysis of the data recycling mechanism under Doris's storage-compute separation architecture, from design philosophy to technical implementation, from core principles to practical tuning, comprehensively showcasing the technical details and application value of this mature solution.

## 1. Comparison of Common Data Recycling Strategies

### 1.1 Synchronous Deletion

The most straightforward deletion method. When data is deleted (e.g., drop table), the related metadata and corresponding files are immediately deleted. Once data is deleted, it cannot be recovered. While the operation is simple and direct, deletion speed is slow and risk is high.

### 1.2 Reconciliation Deletion (Reverse)

This approach determines which data can be deleted through periodic reconciliation mechanisms. When data is deleted (e.g., drop table), only metadata is deleted. The system periodically performs data reconciliation, scans file data, identifies data that is no longer referenced by metadata or has expired, and then performs batch deletion.

### 1.3 Mark-for-Deletion (Forward)

This approach determines which data can be deleted by periodically scanning deleted metadata. When data is deleted (e.g., drop table), instead of directly deleting the data, the metadata to be deleted is marked as deleted. The system periodically scans the marked metadata and finds corresponding files for batch deletion.

## 2. Benefits of Doris Storage-Compute Separation Mark-for-Deletion

Doris's storage-compute separation architecture chose the mark-for-deletion method, which effectively ensures data consistency while achieving the optimal balance between performance, security, and resource utilization.

Taking drop table as an example, mark-for-deletion has the following significant advantages over the other two approaches:

### 2.1 Performance Advantages

- **Fast Response Time**: Drop table operations only need to mark metadata KV data as deleted, without waiting for file I/O operations to complete, allowing users to receive immediate responses. This is particularly important in large table deletion scenarios, avoiding long blocking periods.
- **High Batch Processing Efficiency**: Periodically scanning deletion-marked metadata KV allows for batch processing of file deletion operations, reducing system call frequency and improving overall I/O efficiency.

### 2.2 Security Advantages

- **Misoperation Protection**: Mark-for-deletion provides a buffer period during which accidentally deleted tables can be recovered before actual file deletion, significantly reducing human operational risks.
- **Transaction Security**: Marking operations are lightweight metadata modifications that more easily ensure atomicity, reducing data inconsistency issues caused by system failures during deletion.

### 2.3 Resource Management Advantages

- **System Load Balancing**: File deletion operations can be performed during system idle time, avoiding the consumption of large amounts of I/O resources during business peak hours that would impact normal operations.
- **Controllable Deletion Pace**: Deletion speed can be dynamically adjusted based on system load, avoiding system impact from massive deletion operations.

### 2.4 Comparison with Other Solutions

- **Compared to Synchronous Deletion**: Avoids long waiting times when deleting large tables, improving user experience. Additionally, provides a deletion buffer period ensuring security and preventing human operational accidents to some extent.
- **Compared to Reconciliation Deletion**: Only scans deletion-marked metadata, making scan data more targeted, reducing unnecessary I/O operations, higher efficiency, no need to traverse all files to determine if they are referenced, faster and more efficient deletion.

## 3. Principles of Doris Data Recycling

The recycler is an independently deployed component responsible for periodically recycling expired garbage files. One recycler can simultaneously recycle multiple instances, and one instance can only be recycled by one recycler at the same time.

### 3.1 Mark-for-Deletion

Whenever a drop command is executed or the system generates garbage data (e.g., compacted rowset), the corresponding metadata KV is marked as recycled. The recycler periodically scans recycle KVs in the instance, deletes corresponding object files, and then deletes the recycle KV, ensuring deletion order safety.

### 3.2 Hierarchical Structure

When the recycler recycles instance data, multiple tasks run concurrently, such as recycle_indexes, recycle_partition, recycle_compacted_rowsets, recycle_txn, etc.

Data is deleted according to a hierarchical structure during recycling: deleting a table deletes corresponding partitions, deleting a partition deletes corresponding tablets, deleting a tablet deletes corresponding rowsets, deleting a rowset deletes corresponding segment files. The final execution object is Doris's smallest file unit, the segment file.

Taking drop table as an example, during the recycling process, the system first deletes segment object files, then deletes recycle rowset KV after success, deletes recycle tablet KV after all tablet rowsets are successfully deleted, and so on, ultimately deleting all object files and recycle KVs in the table.

### 3.3 Expiration Mechanism

Each object to be recycled records its corresponding expiration time in its KV. The system identifies objects to delete by scanning various recycle KVs and calculating expiration times. If a user accidentally drops a table, due to the expiration mechanism, the recycler will not immediately delete its data but will wait for a retention time, providing the possibility for data recovery.

### 3.4 Reliability Guarantees

1. **Phased Deletion**: First delete data files, then delete metadata, finally delete index or partition keys, ensuring deletion order safety.

2. **Lease Protection Mechanism**: Each recycler must obtain a lease before starting recycling, starts a background thread to periodically renew the lease. Only when the lease expires or status is IDLE can a new recycler take over, ensuring that one instance can only be recycled by one recycler at the same time, avoiding data inconsistency issues caused by concurrent recycling.

### 3.5 Multiple Check Mechanisms

The Recycler implements multiple mutual check mechanisms (checker) between FE metadata, MS KV, and object files. The checker performs forward and reverse checks on all Recycler KVs, object files, and FE in-memory metadata in the background.

Taking segment file KV and object file checking as an example:
- Forward Check: Scan all KVs to check if corresponding segment files exist and if corresponding segment information exists in FE memory.
- Reverse Check: Scan all segment files to verify if corresponding KVs exist and if corresponding segment information exists in FE memory.

Multiple check mechanisms ensure the correctness of recycler data deletion. If unrecycled or over-recycled situations occur under certain circumstances, the checker will capture relevant information. Operations personnel can manually delete excess garbage files based on checker information, or rely on object multi-versioning to recover accidentally deleted files, providing an effective safety net.

Currently, forward and reverse checks for segment files, idx files, delete bitmap metadata, etc., have been implemented. In the future, checks for all metadata will be implemented to further ensure recycler correctness and reliability.

## 4. Observability Mechanism

Recycler recycling efficiency and progress are of great concern to users. Therefore, we have greatly improved recycler observability by adding numerous visual monitoring metrics and necessary logs. Visual metrics allow users to intuitively see recycling progress, efficiency, exceptions, and other basic information. We also provide more metrics for users to see more detailed information, such as estimating the next recycle time for a certain instance. Added logs also enable operations and development teams to locate problems more quickly.

### 4.1 Addressing User Concerns

**Basic Questions:**
- Repository-level recycling speed: bytes recycled per second, quantity of various objects recycled per second
- Repository-level data volume and time consumption per recycling
- Repository-level recycling progress: recycled data volume, pending recycling data volume

**Advanced Questions:**
- Recycling status of each storage backend
- Recycler success time, failure time
- Estimated time for next Recycler execution

All this information can be observed in real-time through the MS panel.

### 4.2 Observation Metrics

| Variable Name | Metrics Name | Dimensions/Labels | Description | Example |
|---------------|--------------|-------------------|-------------|---------|
| g_bvar_recycler_vault_recycle_status | recycler_vault_recycle_status | instance_id, resource_id, status | Records status count of vault recycling operations by instance ID, resource ID, and status | recycler_vault_recycle_status{instance_id="default_instance_id",resource_id="1",status="normal"} 8 |
| g_bvar_recycler_vault_recycle_task_concurrency | recycler_vault_recycle_task_concurrency | instance_id, resource_id | Counts vault recycle file task concurrency by instance ID and resource ID | recycler_vault_recycle_task_concurrency{instance_id="default_instance_id",resource_id="1"} 2 |
| g_bvar_recycler_instance_last_round_recycled_num | recycler_instance_last_round_recycled_num | instance_id, resource_type | Counts recycled object quantity in the last round by instance ID and object type | recycler_instance_last_round_recycled_num{instance_id="default_instance_id",resource_type="recycle_rowsets"} 13 |
| g_bvar_recycler_instance_last_round_to_recycle_num | recycler_instance_last_round_to_recycle_num | instance_id, resource_type | Counts objects to be recycled in the last round by instance ID and object type | recycler_instance_last_round_to_recycle_num{instance_id="default_instance_id",resource_type="recycle_rowsets"} 13 |
| g_bvar_recycler_instance_last_round_recycled_bytes | recycler_instance_last_round_recycled_bytes | instance_id, resource_type | Counts recycled data size (bytes) in the last round by instance ID and object type | recycler_instance_last_round_recycled_bytes{instance_id="default_instance_id",resource_type="recycle_rowsets"} 13509 |
| g_bvar_recycler_instance_last_round_to_recycle_bytes | recycler_instance_last_round_to_recycle_bytes | instance_id, resource_type | Counts data size to be recycled (bytes) in the last round by instance ID and object type | recycler_instance_last_round_to_recycle_bytes{instance_id="default_instance_id",resource_type="recycle_rowsets"} 13509 |
| g_bvar_recycler_instance_last_round_recycle_elpased_ts | recycler_instance_last_round_recycle_elpased_ts | instance_id, resource_type | Records elapsed time (ms) of the last recycling operation by instance ID and object type | recycler_instance_last_round_recycle_elpased_ts{instance_id="default_instance_id",resource_type="recycle_rowsets"} 62 |
| g_bvar_recycler_instance_recycle_round | recycler_instance_recycle_round | instance_id, resource_type | Counts recycling operation rounds by instance ID and object type | recycler_instance_recycle_round{instance_id="default_instance_id_2",object_type="recycle_rowsets"} 2 |
| g_bvar_recycler_instance_recycle_time_per_resource | recycler_instance_recycle_time_per_resource | instance_id, resource_type | Records recycling speed by instance ID and object type (time needed per resource in ms, -1 means no recycling) | recycler_instance_recycle_time_per_resource{instance_id="default_instance_id",resource_type="recycle_rowsets"} 4.76923 |
| g_bvar_recycler_instance_recycle_bytes_per_ms | recycler_instance_recycle_bytes_per_ms | instance_id, resource_type | Records recycling speed by instance ID and object type (bytes recycled per millisecond, -1 means no recycling) | recycler_instance_recycle_bytes_per_ms{instance_id="default_instance_id",resource_type="recycle_rowsets"} 217.887 |
| g_bvar_recycler_instance_recycle_total_num_since_started | recycler_instance_recycle_total_num_since_started | instance_id, resource_type | Counts total recycled quantity since recycler started by instance ID and object type | recycler_instance_recycle_total_num_since_started{instance_id="default_instance_id",resource_type="recycle_rowsets"} 49 |
| g_bvar_recycler_instance_recycle_total_bytes_since_started | recycler_instance_recycle_total_bytes_since_started | instance_id, resource_type | Counts total recycled size (bytes) since recycler started by instance ID and object type | recycler_instance_recycle_total_bytes_since_started{instance_id="default_instance_id",resource_type="recycle_rowsets"} 40785 |
| g_bvar_recycler_instance_running_counter | recycler_instance_running_counter | - | Counts how many instances are currently recycling | recycler_instance_running_counter 0 |
| g_bvar_recycler_instance_last_recycle_duration | recycler_instance_last_round_recycle_duration | instance_id | Records total duration of the last recycling round by instance ID | recycler_instance_last_recycle_duration{instance_id="default_instance_id"} 64 |
| g_bvar_recycler_instance_next_ts | recycler_instance_next_ts | instance_id | Estimates next recycle time based on config's recycle_interval_seconds by instance ID | recycler_instance_next_ts{instance_id="default_instance_id"} 1750400266781 |
| g_bvar_recycler_instance_recycle_st_ts | recycler_instance_recycle_start_ts | instance_id | Records start time of total recycling process by instance ID | recycler_instance_recycle_st_ts{instance_id="default_instance_id"} 1750400236717 |
| g_bvar_recycler_instance_recycle_ed_ts | recycler_instance_recycle_end_ts | instance_id | Records end time of total recycling process by instance ID | recycler_instance_recycle_ed_ts{instance_id="default_instance_id"} 1750400236781 |
| g_bvar_recycler_instance_recycle_last_success_ts | recycler_instance_recycle_last_success_ts | instance_id | Records last successful recycling time by instance ID | recycler_instance_recycle_last_success_ts{instance_id="default_instance_id"} 1750400236781 |

## 5. Parameter Tuning

Common recycler parameters and their descriptions:

```
// Recycler interval in seconds
CONF_mInt64(recycle_interval_seconds, "3600");

// Common retention time, applies to all objects without their own retention time
CONF_mInt64(retention_seconds, "259200");

// Maximum number of instances a recycler can recycle simultaneously
CONF_Int32(recycle_concurrency, "16");

// Retention time for compacted rowsets in seconds
CONF_mInt64(compacted_rowset_retention_seconds, "1800");

// Retention time for dropped indexes in seconds
CONF_mInt64(dropped_index_retention_seconds, "10800");

// Retention time for dropped partitions in seconds
CONF_mInt64(dropped_partition_retention_seconds, "10800");

// Recycle whitelist, specify instance IDs separated by commas, defaults to recycling all instances if empty
CONF_Strings(recycle_whitelist, "");

// Recycle blacklist, specify instance IDs separated by commas, defaults to recycling all instances if empty
CONF_Strings(recycle_blacklist, "");

// Object IO worker concurrency: e.g., object list, delete
CONF_mInt32(instance_recycler_worker_pool_size, "32");

// Recycle object concurrency: e.g., recycle_tablet, recycle_rowset
CONF_Int32(recycle_pool_parallelism, "40");

// Whether to enable checker
CONF_Bool(enable_checker, "false");

// Whether to enable reverse checker
CONF_Bool(enable_inverted_check, "false");

// Checker interval
CONF_mInt32(check_object_interval_seconds, "43200");

// Whether to enable recycler observation metrics
CONF_Bool(enable_recycler_stats_metrics, "false");

// Recycle storage backend whitelist, specify vault names separated by commas, defaults to recycling all vaults if empty
CONF_Strings(recycler_storage_vault_white_list, "");
```

### Common Tuning Scenarios Q&A

#### 1. Recycling Performance Tuning

**Q1: What to do if recycling speed is too slow?**

A1: You can tune from the following aspects:
- Increase concurrency:
  - Increase recycle_concurrency (default 16): increase the number of instances recycled simultaneously
  - Increase instance_recycler_worker_pool_size (default 32): increase object IO operation concurrency
  - Increase recycle_pool_parallelism (default 40): increase recycle object concurrency
- Shorten recycling interval: Reduce recycle_interval_seconds from default 3600 seconds, e.g., to 1800 seconds
- Use whitelist mechanism: Prioritize recycling important instances through recycle_whitelist

**Q2: How to adjust when recycling pressure is too high and affects business?**

A2: You can adopt the following strategies to reduce recycling pressure:
- Reduce concurrency:
  - Appropriately reduce recycle_concurrency to avoid recycling too many instances simultaneously
  - Reduce instance_recycler_worker_pool_size and recycle_pool_parallelism
- Extend recycling interval: Increase recycle_interval_seconds, e.g., adjust to 7200 seconds
- Use blacklist: Temporarily exclude high-load instances through recycle_blacklist
- Off-peak recycling: Perform recycling operations during business off-peak hours

#### 2. Storage Space Tuning

**Q3: What to do when storage space is insufficient and garbage cleanup needs to be accelerated?**

A3: You can adjust retention times for various objects:
- Shorten general retention time: Reduce retention_seconds from default 259200 seconds (3 days)
- Targeted adjustment for specific objects:
  - compacted_rowset_retention_seconds (default 1800 seconds) can be appropriately shortened
  - dropped_index_retention_seconds and dropped_partition_retention_seconds (default 10800 seconds) can be adjusted as needed
- Selective storage backend recycling: Prioritize cleaning specific storage through recycler_storage_vault_white_list

**Q4: What to do when longer data retention is needed to prevent accidental deletion?**

A4: Extend corresponding retention times:
- Increase retention_seconds to a longer period, e.g., 604800 seconds
- Adjust corresponding retention parameters based on different object importance
- Important partitions can set longer retention times through dropped_partition_retention_seconds

#### 3. Monitoring and Troubleshooting Tuning

**Q5: How to enable better monitoring and troubleshooting capabilities?**

A5: It's recommended to enable the following monitoring features:
- Enable observation metrics: Set enable_recycler_stats_metrics = true
- Enable check mechanisms:
  - Set enable_checker = true to enable forward checking
  - Set enable_inverted_check = true to enable reverse checking
  - Adjust check_object_interval_seconds (default 43200 seconds/12 hours) to appropriate check frequency

**Q6: How to troubleshoot suspected data consistency issues?**

A6: Utilize the checker mechanism for inspection:
- Ensure both enable_checker and enable_inverted_check are true
- Appropriately shorten check_object_interval_seconds to increase check frequency
- Observe anomalies discovered by checker through MS panel
- Manually handle excess garbage files or supplement accidentally deleted files based on checker reports

#### 4. Special Scenario Tuning

**Q7: How to temporarily handle abnormal instance recycling?**

A7: Use whitelist and blacklist mechanisms:
- Temporarily skip problematic instances: Add abnormal instance IDs to recycle_blacklist
- Prioritize specific instances: Add instance IDs needing priority processing to recycle_whitelist
- Storage backend selection: Selectively recycle specific storage backends through recycler_storage_vault_white_list

**Q8: What to do when large table deletion causes recycling task backlog?**

A8: Comprehensive tuning strategy:
- Temporarily increase concurrency parameters to handle backlog
- Appropriately shorten retention time for large objects
- Use whitelist to prioritize instances with severe backlog
- Deploy multiple recyclers to share the load if necessary

**Q9: What to do when encountering "404 file not found" errors in object storage during long queries?**

A9: When query execution time is very long and tablets undergo compaction during the query, merged rowsets on object storage may have been recycled, causing query failure with "404 file not found" errors. Solution:
- Increase compacted rowset retention time: Increase compacted_rowset_retention_seconds from default 1800 seconds, e.g.:
  - For scenarios with long queries, recommend adjusting to 7200 seconds (or longer)
  - Set appropriate retention time based on maximum query time

This ensures that rowsets needed during long query execution are not prematurely recycled, avoiding query failures.

---

**Note**: The above tuning suggestions need to be specifically adjusted based on actual cluster scale, storage capacity, business characteristics, and other factors. It's recommended to closely monitor system load and business impact during the tuning process, gradually adjusting parameters to find the optimal configuration.

## Conclusion

The mark-for-deletion mechanism under Apache Doris's storage-compute separation architecture, through cleverly balancing performance, security, and resource utilization, not only solves the inherent defects of traditional data recycling methods but also provides users with a complete, reliable, and observable data management solution.

From fine-grained hierarchical recycling design to intelligent expiration protection mechanisms, from comprehensive multiple check systems to rich observability metrics, Doris's data recycling mechanism reflects deep understanding of user needs and relentless pursuit of technical quality in every detail. Particularly, its flexible parameter tuning capabilities enable users of different scales and scenarios to find the most suitable configuration solutions.

In the future, we will continue to optimize and improve this mechanism, maintaining existing advantages while further improving recycling efficiency, enhancing intelligence levels, and enriching monitoring dimensions, building a more efficient and reliable real-time data analysis platform for users. We welcome users to explore more possibilities in practice and work with us to continuously advance Apache Doris forward.