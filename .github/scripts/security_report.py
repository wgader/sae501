#!/usr/bin/env python3
"""Assemble SECURITY-REPORT.md à partir des sorties brutes de Gitleaks, Trivy et Hadolint.

Usage : security_report.py <dossier des rapports> <résultat gitleaks> <résultat trivy> <résultat hadolint>
Les résultats sont ceux des étapes GitHub Actions (success, failure, skipped…).
Le rapport ne contient jamais la valeur d’un secret : Gitleaks est lancé avec --redact
et seuls la règle, le fichier et le commit sont repris.
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

STATUS_LABELS = {"success": "✅ conforme", "failure": "❌ bloquant", "skipped": "⏭️ non exécuté"}


def load_json(path: Path):
    if not path.is_file() or path.stat().st_size == 0:
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def gitleaks_section(reports: Path) -> list[str]:
    findings = load_json(reports / "gitleaks.json")
    if findings is None:
        return ["Rapport Gitleaks indisponible : le scan n’a pas produit de résultat exploitable."]
    if not findings:
        return ["Aucun nouveau secret détecté dans l’historique Git."]
    lines = ["| Règle | Fichier | Commit |", "|---|---|---|"]
    for finding in findings:
        lines.append(f"| {finding.get('RuleID', '?')} | `{finding.get('File', '?')}` | `{str(finding.get('Commit', ''))[:7]}` |")
    return lines


def trivy_section(reports: Path) -> list[str]:
    data = load_json(reports / "trivy.json")
    if data is None:
        return ["Rapport Trivy indisponible : le scan n’a pas produit de résultat exploitable."]
    rows = []
    for result in data.get("Results") or []:
        target = result.get("Target", "?")
        for vuln in result.get("Vulnerabilities") or []:
            fixed = vuln.get("FixedVersion") or "aucun correctif"
            rows.append(f"| {vuln.get('Severity')} | Vulnérabilité | `{target}` | {vuln.get('PkgName')} {vuln.get('InstalledVersion')} → {fixed} ({vuln.get('VulnerabilityID')}) |")
        for misconfig in result.get("Misconfigurations") or []:
            if misconfig.get("Status") == "FAIL":
                rows.append(f"| {misconfig.get('Severity')} | Configuration | `{target}` | {misconfig.get('ID')} : {misconfig.get('Title')} |")
    if not rows:
        return ["Aucune vulnérabilité ni mauvaise configuration HIGH ou CRITICAL."]
    return ["| Gravité | Type | Cible | Détail |", "|---|---|---|---|", *rows]


def hadolint_section(reports: Path) -> list[str]:
    lines = []
    for report in sorted(reports.glob("hadolint-*.txt")):
        name = report.stem.removeprefix("hadolint-")
        content = report.read_text(encoding="utf-8").strip()
        lines.append(f"**Dockerfile {name}** : " + ("aucune remarque." if not content else ""))
        if content:
            lines.extend(["```", content, "```"])
    return lines or ["Rapport Hadolint indisponible."]


def main() -> int:
    if len(sys.argv) != 5:
        print(__doc__, file=sys.stderr)
        return 2

    reports = Path(sys.argv[1])
    outcomes = {"Gitleaks (secrets)": sys.argv[2], "Trivy (dépendances, configuration)": sys.argv[3], "Hadolint (Dockerfiles)": sys.argv[4]}
    commit = os.environ.get("GITHUB_SHA", "local")[:7]
    run_url = ""
    if os.environ.get("GITHUB_RUN_ID"):
        run_url = f"{os.environ.get('GITHUB_SERVER_URL')}/{os.environ.get('GITHUB_REPOSITORY')}/actions/runs/{os.environ['GITHUB_RUN_ID']}"

    lines = [
        "# Rapport de sécurité CI",
        "",
        f"- Date : {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        f"- Commit : `{commit}`",
    ]
    if run_url:
        lines.append(f"- Exécution : {run_url}")
    lines += [
        "- Seuils bloquants : tout nouveau secret, toute vulnérabilité ou configuration CRITICAL, toute erreur Hadolint.",
        "",
        "| Contrôle | Résultat |",
        "|---|---|",
        *[f"| {name} | {STATUS_LABELS.get(outcome, outcome)} |" for name, outcome in outcomes.items()],
        "",
        "## Secrets (Gitleaks)",
        "",
        *gitleaks_section(reports),
        "",
        "## Dépendances et configuration (Trivy, HIGH et CRITICAL)",
        "",
        *trivy_section(reports),
        "",
        "## Dockerfiles (Hadolint)",
        "",
        *hadolint_section(reports),
        "",
    ]
    print("\n".join(lines))
    return 0


if __name__ == "__main__":
    sys.exit(main())
