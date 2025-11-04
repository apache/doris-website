---
{
    "title": "HLL (HyperLogLog)",
    "language": "en"
}
---

## HLL (HyperLogLog)
### Description
HLL

HLL cannot be used as a key column. The columns of the HLL type can be used in Aggregate tables, Duplicate tables and Unique tables. When used in an Aggregate table, the aggregation type is HLL_UNION when building table.
The user does not need to specify the length and default value. 
The length is controlled within the system according to the degree of data aggregation.
And HLL columns can only be queried or used through the matching hll_union_agg, hll_raw_agg, hll_cardinality, and hll_hash.
    
HLL is approximate count of distinct elements, and its performance is better than Count Distinct when the amount of data is large.
The error of HLL is usually around 1%, sometimes up to 2%.

### example

    select hour, HLL_UNION_AGG(pv) over(order by hour) uv from(
       select hour, HLL_RAW_AGG(device_id) as pv
       from metric_table -- Query the accumulated UV per hour
       where datekey=20200922
    group by hour order by 1
    ) final;
    
### keywords
HLL,HYPERLOGLOG
