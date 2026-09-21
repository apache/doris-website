---
{
    "title": "Peer Cache Read: Reading File Cache from Other BEs and Compute Groups (Compute-Storage Decoupled)",
    "sidebar_label": "Peer Cache Read",
    "language": "en",
    "description": "Peer cache read in compute-storage decoupled mode: on a local File Cache miss, read the block from another BE (including other compute groups) before falling back to object storage.",
    "keywords": ["peer cache read", "peer read", "cross compute group cache", "File Cache miss", "cold read", "compute group scaling", "enable_cache_read_from_peer", "peer_cache_fill_compute_group_id", "compute-storage decoupled"]
}
---

<!-- Knowledge type: Architecture decision -->
<!-- Applicable scenarios: Cold read optimization / Compute group scaling / Cross compute group cache reuse -->

Peer cache read is a File Cache miss-handling strategy in compute-storage decoupled mode: when the local File Cache of a BE misses, the BE first tries to read the block from the File Cache of another BE, and only falls back to object storage when no peer has it. It only affects the cold-read path; reads that hit the local cache are unchanged.

:::caution Version

Peer cache read is supported since version 4.2.0 and is disabled by default. Enable it on the BE with `enable_cache_read_from_peer = true`.

:::

![Peer cache read flow: after a local File Cache miss, the peer read races the object storage read, the first result wins and is written to the local cache](/images/next/compute-storage-decoupled/peer-cache-read-flow.jpg)

:::info Placeholder

This English page is a placeholder. The full content is currently available in the Chinese version of this page (switch the site language to 中文) and will be translated after review.

:::
