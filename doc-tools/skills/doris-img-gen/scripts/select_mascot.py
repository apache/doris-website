#!/usr/bin/env python3
"""Randomly select D-Crew mascots for one image or an illustration batch."""

from __future__ import annotations

import argparse
import secrets


MASCOTS = ["Pip", "Dori", "Flux"]


def positive_int(value: str) -> int:
    count = int(value)
    if count < 1:
        raise argparse.ArgumentTypeError("count must be at least 1")
    return count


def select_mascots(count: int) -> list[str]:
    rng = secrets.SystemRandom()
    selected: list[str] = []

    while len(selected) < count:
        cycle = MASCOTS.copy()
        rng.shuffle(cycle)

        if selected and cycle[0] == selected[-1]:
            cycle[0], cycle[1] = cycle[1], cycle[0]

        selected.extend(cycle)

    return selected[:count]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Select Pip, Dori, and Flux in randomized, balanced cycles."
    )
    parser.add_argument(
        "--count",
        type=positive_int,
        default=1,
        help="number of mascot-bearing image slots to fill (default: 1)",
    )
    args = parser.parse_args()

    print("\n".join(select_mascots(args.count)))


if __name__ == "__main__":
    main()
