---
{
    "title": "FAQ",
    "language": "en",
    "description": "Common errors and questions when using Flink Doris Connector, such as duplicate labels, expired transactions, too many running transactions, dirty data, and 307 redirects."
}
---

# FAQ

Most write-side errors are related to the write mode and two-phase commit; see [Write Modes](./write.md#write-modes) first.

**1. errCode = 2, detailMessage = Label [label_0_1] has already been used, relate to txn [19650]**

In Exactly-Once scenarios, when a Flink Job restarts, it must start from the latest Checkpoint/Savepoint, otherwise the above error is reported. When Exactly-Once is not required, you can also resolve this by disabling 2PC commit (`sink.enable-2pc=false`) or by using a different `sink.label-prefix`.

**2. errCode = 2, detailMessage = transaction [19650] not found**

This occurs during the Commit phase. The transaction ID recorded in the Checkpoint has expired on the FE side. Committing again at this point will result in the above error. In this case, you cannot start from the Checkpoint. You can extend the expiration time by modifying the `streaming_label_keep_max_second` configuration in `fe.conf` (default 12 hours). After Doris 2.0, this is also limited by the `label_num_threshold` configuration in `fe.conf` (default 2000), which can be increased or set to -1 (-1 means only the time limit applies).

**3. errCode = 2, detailMessage = current running txns on db 10006 is 100, larger than limit 100**

This occurs when concurrent imports for the same database exceed 100. You can resolve this by adjusting the `max_running_txn_num_per_db` parameter in `fe.conf`. For details, see [max_running_txn_num_per_db](../../../admin-manual/config/fe-config.md#max_running_txn_num_per_db). In addition, frequently changing the label and restarting a job can also cause this error. In 2pc scenarios (Duplicate/Aggregate models), each job's label must be unique, and only when restarting from Checkpoint will the Flink job actively abort the previous txns that have been precommitted successfully but not yet committed. Frequently changing the label and restarting will cause a large number of successfully precommitted txns to be unable to abort, occupying transactions. Under the Unique model, you can also disable 2pc to achieve idempotent writes.

**4. tablet writer write failed, tablet_id=190958, txn_id=3505530, err=-235**

This usually occurs before Connector 1.1.0 and is caused by writes being too frequent, leading to too many versions. You can reduce the Stream Load frequency by setting the `sink.batch.size` and `sink.batch.interval` parameters. After Connector 1.1.0, the default write timing is controlled by Checkpoint, and you can reduce the write frequency by increasing the Checkpoint interval.

**5. Flink import has dirty data, how to skip it?**

When Flink imports data, if there is dirty data (such as field format or length issues), Stream Load reports an error, and Flink retries continuously. To skip this, you can disable Stream Load's strict mode (`strict_mode=false`, `max_filter_ratio=1`) or filter the data before the Sink operator.

**6. The network between the Flink machine and the BE machine is not connected. How should it be configured?**

When Flink initiates a write to Doris, Doris redirects to BE for writing. The address returned at this point is the internal IP of the BE (that is, the IP seen via `show backends`). If Flink and Doris cannot communicate, an error is reported. In this case, you can configure the BE's external IP in `benodes`.

**7. stream load error: HTTP/1.1 307 Temporary Redirect**

Flink first sends a request to FE. After receiving 307, it sends the request to the redirected BE. When FE is in FullGC, under heavy load, or experiencing network latency, HttpClient by default sends data after a certain time (3 seconds) without receiving a response. Since the request body is an InputStream by default, when a 307 response is received, the data cannot be replayed and an error is reported directly. There are three ways to resolve this:

1. Upgrade to Connector 25.1.0 or above, where the default time has been extended.
2. Set `auto-redirect=false` to send requests directly to BE (not applicable in some cloud scenarios).
3. The primary key model can enable batch mode.
