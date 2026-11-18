#!/usr/bin/env python3
"""Fait échouer la CI sur toute faille npm, sauf les avis acceptés explicitement ci-dessous.

Un avis n'est accepté que s'il ne touche que les outils de développement : les dépendances livrées
en production sont contrôlées à part par `npm audit --omit=dev`, sans aucune exception.
"""

import json
import subprocess
import sys

# Avis sans correctif publié : à retirer dès qu'une version corrigée existe.
ACCEPTED_ADVISORIES = {
    "GHSA-fc5q-39xc-vjpf": (
        "picomatch <= 4.0.7 (ReDoS), sans correctif : présent seulement via eslint-config-next, "
        "sur des motifs écrits par l'équipe et jamais sur une saisie d'utilisateur."
    ),
}


def advisory_id(url: str) -> str:
    return url.rstrip("/").rsplit("/", 1)[-1]


def main() -> int:
    project = sys.argv[1] if len(sys.argv) > 1 else "frontend"
    result = subprocess.run(
        ["npm", "audit", "--prefix", project, "--json"],
        capture_output=True,
        text=True,
        check=False,
    )
    try:
        vulnerabilities = json.loads(result.stdout)["vulnerabilities"]
    except (json.JSONDecodeError, KeyError):
        # Un audit illisible n'est jamais considéré comme réussi.
        print(f"::error::Résultat de npm audit illisible : {result.stderr.strip()}")
        return 1

    advisories = {
        advisory_id(source["url"]): f"{name} : {source['title']}"
        for name, vulnerability in vulnerabilities.items()
        for source in vulnerability["via"]
        if isinstance(source, dict)
    }

    for identifier in sorted(advisories.keys() & ACCEPTED_ADVISORIES.keys()):
        print(f"::warning::{identifier} accepté — {ACCEPTED_ADVISORIES[identifier]}")

    refused = sorted(advisories.keys() - ACCEPTED_ADVISORIES.keys())
    for identifier in refused:
        print(f"::error::{identifier} — {advisories[identifier]}")

    return 1 if refused else 0


if __name__ == "__main__":
    sys.exit(main())
