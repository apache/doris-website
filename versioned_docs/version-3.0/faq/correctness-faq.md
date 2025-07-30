---
{
    "title": "Data Integrity FAQ",
    "language": "en"
}
---

# Data Integrity Issues

This document is mainly used to record common data integrity issues encountered during the use of Doris. It will be updated periodically.

The term "duplicate key data in the table" refers to the appearance of duplicate key data in the merge-on-write Unique table. Duplicate key issues in merge-on-write Unique tables can be fixed by [triggering a full compaction](../admin-manual/trouble-shooting/repairing-data), while other types of integrity issues may require specific solutions based on the situation. For assistance, please contact community support.

| Issue Description | Occurrence Conditions | Affected Versions | Fix Versions | Impacted Scope | Fix PR |
|---|---|---|---|---|---|
| Partial column updates in merge-on-write Unique table reintroduce previously deleted data | A `__DORIS_DELETE_SIGN__` column is specified during partial column updates, and the historical data contains rows marked as deleted by the `__DORIS_DELETE_SIGN__` column | <2.1.8, <3.0.4 | >=2.1.8, >=3.0.4 | Compute-storage coupled mode, compute-storage decoupled mode, partial column updates | [#46194](https://github.com/apache/doris/pull/46194) |
| Duplicate key data in the table | Concurrent imports in merge-on-write Unique table in compute-storage decoupled mode | <3.0.4 | >=3.0.4 | Compute-storage decoupled mode | [#46039](https://github.com/apache/doris/pull/46039) |
| Duplicate key data in the table | Concurrent imports between imports and between import and compaction in merge-on-write Unique table in compute-storage decoupled mode | <3.0.4 | >=3.0.4 | Compute-storage decoupled mode | [#44975](https://github.com/apache/doris/pull/44975) |
| System-generated values for auto-increment column are 0 or duplicate | Network anomalies between BE and FE | <2.1.8, <3.0.3 | >=2.1.8, >=3.0.3 | Compute-storage coupled mode, compute-storage decoupled mode, auto-increment column | [#43774](https://github.com/apache/doris/pull/43774) |
| Stream Load import does not delete data that meets the `delete` condition in merge-on-write Unique table | Stream Load import with `merge_type: MERGE`, `partial_columns: true`, and `delete` parameters | <2.0.15, <2.17, <3.0.3 | >=2.0.15, >=2.17, >=3.0.3 | Compute-storage coupled mode, compute-storage decoupled mode, partial column updates | [#40730](https://github.com/apache/doris/pull/40730) |
| Partial column updates result in unintended update of auto-increment column values | The table has auto-increment column on the Value column, and the partial column update import does not specify values for those auto-increment column | <2.1.6, <3.0.2 | >=2.1.6, >=3.0.2 | Compute-storage coupled mode, compute-storage decoupled mode, auto-increment column | [#39996](https://github.com/apache/doris/pull/39996) |
| Duplicate key data in the table | User adds sequence column functionality to a merge-on-write Unique table that does not support sequence columns using `ALTER TABLE tbl ENABLE FEATURE "SEQUENCE_LOAD" WITH ...`, followed by new imports | <2.0.15, <2.1.6, <3.0.2 | >=2.0.15, >=2.1.6, >=3.0.2 | Compute-storage coupled mode, compute-storage decoupled mode | [#39958](https://github.com/apache/doris/pull/39958) |
| Duplicate key data in the table | Concurrent imports or concurrent imports and compactions in merge-on-write Unique table in compute-storage decoupled mode | <3.0.1 | >=3.0.1 | Compute-storage decoupled mode | [#39018](https://github.com/apache/doris/pull/39018) |
| Partial column update import results in data corruption in merge-on-write Unique table | Concurrent partial column updates in merge-on-write Unique table, with BE restart during the import process | <2.0.15, <2.1.6, <3.0.2 | >=2.0.15, >=2.1.6, >=3.0.2 | Compute-storage coupled mode, compute-storage decoupled mode, partial column updates | [#38331](https://github.com/apache/doris/pull/38331) |
| Duplicate key data in the table | Concurrent imports and compaction in merge-on-write Unique table in compute-storage decoupled mode | <3.0.2 | >=3.0.2 | Compute-storage decoupled mode | [#37670](https://github.com/apache/doris/pull/37670), [#41309](https://github.com/apache/doris/pull/41309), [#39791](https://github.com/apache/doris/pull/39791) |
| Duplicate key data in the table | Large single import in merge-on-write Unique table with sequence column triggers segment compaction | <2.0.15, <2.1.6, <3.0.2 | >=2.0.15, >=2.1.6, >=3.0.2 | Compute-storage coupled mode, compute-storage decoupled mode | [#38369](https://github.com/apache/doris/pull/38369) |
| Duplicate key data in the table | Failed full clone on merge-on-write Unique table in compute-storage coupled mode | <2.0.13, <2.1.5, <3.0.0 | >=2.0.13, >=2.1.5, >=3.0.0 | Compute-storage coupled mode | [#37001](https://github.com/apache/doris/pull/37001) |
| Duplicate key data in the table | Stream Load imports with internal retry process in merge-on-write Unique table in compute-storage decoupled mode | <3.0.0 | >=3.0.0 | Compute-storage decoupled mode | [#36670](https://github.com/apache/doris/pull/36670) |
| Inconsistent multi-replica data in merge-on-write Unique table | Partial column update import with `__DORIS_DELETE_SIGN__` column on merge-on-write Unique table, and inconsistent Base Compaction progress across replicas during import | <2.0.15, <2.1.5, <3.0.0 | >=2.0.15, >=2.1.5, >=3.0.0 | Compute-storage coupled mode, compute-storage decoupled mode, partial column updates | [#36210](https://github.com/apache/doris/pull/36210) |
| Duplicate key data in the table | Concurrent partial column updates and BE restart during imports on merge-on-write Unique table | <2.0.11, <2.1.4, <3.0.0 | >=2.0.11, >=2.1.4, >=3.0.0 | Compute-storage coupled mode, compute-storage decoupled mode, partial column updates | [#35739](https://github.com/apache/doris/pull/35739) |

