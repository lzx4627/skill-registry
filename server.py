#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import re
from collections import Counter
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
STATIC_DIR = ROOT / "web"
HOME = Path.home()


def resolve_skill_roots() -> list[tuple[str, Path]]:
    env_value = os.environ.get("SKILL_ROOTS", "").strip()
    if env_value:
        roots: list[tuple[str, Path]] = []
        for index, raw in enumerate(env_value.split(os.pathsep), start=1):
            raw = raw.strip()
            if not raw:
                continue
            path = Path(raw).expanduser().resolve()
            label = "codex" if index == 1 else f"root-{index}"
            roots.append((label, path))
        return roots

    codex_root = Path(
        os.environ.get("CODEX_SKILLS_ROOT", str(HOME / ".codex" / "skills"))
    ).expanduser().resolve()
    agents_root = Path(
        os.environ.get("AGENTS_SKILLS_ROOT", str(HOME / ".agents" / "skills"))
    ).expanduser().resolve()

    return [
        ("codex", codex_root),
        ("agents", agents_root),
    ]


SKILL_ROOTS = resolve_skill_roots()
REFRESH_MS = int(os.environ.get("CATALOG_REFRESH_MS", "15000"))
SHOW_ABSOLUTE_PATHS = os.environ.get("SHOW_ABSOLUTE_PATHS", "").lower() in {
    "1",
    "true",
    "yes",
}

MANUAL_NOTES = {
    "design-an-interface": [
        "最佳效果依赖并行子代理；没有 delegation 能力时会降级为单线程设计比较。",
    ],
    "github-triage": [
        "依赖 `gh` 和一套约定好的 GitHub labels / 状态机。",
    ],
    "improve-codebase-architecture": [
        "流程默认会创建 GitHub issue RFC。",
        "最佳效果依赖子代理探索代码库。",
    ],
    "migrate-to-shoehorn": [
        "只适合 TypeScript 测试代码，而且需要 `@total-typescript/shoehorn`。",
    ],
    "prd-to-issues": [
        "会按流程直接创建 GitHub issues。",
    ],
    "prd-to-plan": [
        "会把输出落到当前仓库的 `./plans/`。",
    ],
    "qa": [
        "按原说明会在对话后直接创建 GitHub issues。",
        "最佳效果依赖后台代码探索或子代理。",
    ],
    "request-refactor-plan": [
        "会把重构方案提交成 GitHub issue。",
    ],
    "setup-pre-commit": [
        "会安装依赖、改 hook 配置，并建议直接提交 commit。",
    ],
    "triage-issue": [
        "按原说明会直接创建 GitHub issue。",
        "最佳效果依赖子代理做根因探索。",
    ],
    "ubiquitous-language": [
        "会在当前工作目录生成或覆写 `UBIQUITOUS_LANGUAGE.md`。",
    ],
    "write-a-prd": [
        "最终产出默认是 GitHub issue，而不是本地文档。",
    ],
    "brainstorming": [
        "这是 superpowers 工作流的一部分，偏规范驱动，不是一次性的单点技巧。",
    ],
    "dispatching-parallel-agents": [
        "依赖并行子代理能力，适合复杂任务拆分。",
    ],
    "finishing-a-development-branch": [
        "流程里可能涉及 `git push`、创建 PR 和清理 worktree。",
    ],
    "subagent-driven-development": [
        "是强流程型 skill，默认要求先有计划、再分发子代理执行。",
    ],
    "systematic-debugging": [
        "适合复杂排障，流程更重，但比拍脑袋试错稳得多。",
    ],
    "test-driven-development": [
        "这是 superpowers 版本的 TDD，与现有 `tdd` skill 不同名但理念相近。",
    ],
    "using-git-worktrees": [
        "会创建独立 git worktree，并可能安装依赖、跑基线测试。",
    ],
    "using-superpowers": [
        "这是 superpowers 的入口说明 skill，用来理解整套工作流。",
    ],
    "writing-plans": [
        "偏工程执行计划，不是产品 PRD；输出粒度通常更细。",
    ],
    "writing-skills": [
        "这是 superpowers 版本的写 skill 方法论，与现有 `write-a-skill` 不同名。",
    ],
}


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="utf-8", errors="replace")


def parse_frontmatter(text: str) -> tuple[dict[str, str], str]:
    if not text.startswith("---\n"):
        return {}, text

    parts = text.split("\n---\n", 1)
    if len(parts) != 2:
        return {}, text

    raw = parts[0][4:]
    body = parts[1]
    data: dict[str, str] = {}
    key = None
    buffer: list[str] = []

    for line in raw.splitlines():
        match = re.match(r"^([A-Za-z0-9_-]+):\s*(.*)$", line)
        if match:
            if key is not None:
                data[key] = "\n".join(buffer).strip().strip('"').strip("'")
            key = match.group(1)
            buffer = [match.group(2)]
        elif key is not None:
            buffer.append(line)

    if key is not None:
        data[key] = "\n".join(buffer).strip().strip('"').strip("'")

    return data, body


def split_description(description: str) -> tuple[str, str]:
    if not description:
        return "", ""

    marker = " Use when "
    if marker in description:
        purpose, use_when = description.split(marker, 1)
        purpose = purpose.strip()
        if not purpose.endswith("."):
            purpose += "."
        return purpose, use_when.strip().rstrip(".")

    return description.strip(), ""


def extract_headings(body: str, skill_name: str) -> list[str]:
    headings: list[str] = []
    for heading in re.findall(r"^#{1,3}\s+(.+)$", body, re.MULTILINE):
        clean = heading.strip().strip("`")
        if clean.lower() == skill_name.lower().replace("-", " "):
            continue
        if clean not in headings:
            headings.append(clean)
        if len(headings) == 4:
            break
    return headings


def mask_path(path: Path) -> str:
    resolved = path.resolve()
    if SHOW_ABSOLUTE_PATHS:
        return str(resolved)

    try:
        return f"~/{resolved.relative_to(HOME)}"
    except ValueError:
        return str(resolved)


def classify_warnings(name: str, body: str) -> list[dict[str, str]]:
    warnings: list[dict[str, str]] = []

    def add(flag_id: str, label: str, detail: str) -> None:
        warnings.append({"id": flag_id, "label": label, "detail": detail})

    if re.search(r"\bgh issue create\b", body):
        add("writes-issues", "会直接建 Issue", "按原说明会调用 `gh issue create`。")
    if re.search(r"\bgit push\b|\bgh pr create\b", body):
        add("pushes-or-prs", "会推分支或开 PR", "说明文档里包含 `git push` 或 `gh pr create`。")
    if re.search(r"\bgit commit\b|commit with message", body, re.IGNORECASE):
        add("creates-commit", "会建议直接提交", "按原说明会进入 `git commit` 流程。")
    if re.search(r"\bgit worktree add\b|\busing-git-worktrees\b", body, re.IGNORECASE):
        add("creates-worktree", "会创建 worktree", "技能流程里包含 git worktree 工作区管理。")
    if re.search(
        r"\bnpm i\b|\bnpm install\b|\bpnpm add\b|\byarn add\b|\bpip install\b|\bbrew install\b|\bapt(?:-get)? install\b",
        body,
        re.IGNORECASE,
    ):
        add("installs-packages", "会装依赖", "技能步骤里包含依赖安装。")
    if re.search(r"sub-agent|subagent|parallel sub-agents|Agent tool", body, re.IGNORECASE):
        add("needs-subagents", "依赖子代理", "说明文档里把并行子代理作为主流程的一部分。")
    if re.search(r"/mnt/|/Users/|C:\\\\|D:\\\\", body):
        add("hardcoded-path", "硬编码路径", "文档里包含固定本地路径，跨机器可移植性较差。")
    if "Claude Code" in body:
        add("claude-only", "Claude 专用", "说明直接面向 Claude Code。")
    if "ai-hero-cli" in body:
        add("repo-specific", "项目特定工具", "依赖 `ai-hero-cli` 约定。")
    if "@total-typescript/shoehorn" in body:
        add("niche-tooling", "窄场景工具", "依赖 `@total-typescript/shoehorn`。")

    for note in MANUAL_NOTES.get(name, []):
        add("note", "补充提醒", note)

    return warnings


def collect_skills() -> list[dict[str, object]]:
    items: list[dict[str, object]] = []

    for discovery_root, root_path in SKILL_ROOTS:
        if not root_path.exists():
            continue

        found_paths: list[Path] = []
        for dirpath, dirnames, filenames in os.walk(root_path, followlinks=True):
            dirnames[:] = [name for name in dirnames if name != ".git"]
            if "SKILL.md" in filenames:
                found_paths.append(Path(dirpath) / "SKILL.md")

        for path in sorted(found_paths):
            raw = read_text(path)
            meta, body = parse_frontmatter(raw)
            name = meta.get("name") or path.parent.name
            description = (meta.get("description") or "").strip()
            purpose, use_when = split_description(description)
            rel_dir = path.parent.relative_to(root_path)
            source = (
                "system"
                if discovery_root == "codex" and rel_dir.parts and rel_dir.parts[0] == ".system"
                else "custom"
            )
            cohort = "system" if source == "system" else discovery_root

            extra_files = sorted(
                [child.name for child in path.parent.iterdir() if child.name != "SKILL.md"]
            )

            items.append(
                {
                    "name": name,
                    "description": description,
                    "purpose": purpose,
                    "useWhen": use_when,
                    "source": source,
                    "cohort": cohort,
                    "path": mask_path(path.parent),
                    "relativePath": f"{discovery_root}/{rel_dir}",
                    "discoveryRoot": discovery_root,
                    "headings": extract_headings(body, name),
                    "extraFiles": extra_files,
                    "warnings": classify_warnings(name, body),
                }
            )

    duplicates = {
        name for name, count in Counter(item["name"] for item in items).items() if count > 1
    }
    for item in items:
        item["duplicateName"] = item["name"] in duplicates
        if item["duplicateName"]:
            item["warnings"].append(
                {
                    "id": "duplicate-name",
                    "label": "名字重复",
                    "detail": "全局目录里存在同名 skill，判断触发来源时要留意。",
                }
            )

    return items


def build_payload() -> dict[str, object]:
    skills = collect_skills()
    root_labels = {label: mask_path(path) for label, path in SKILL_ROOTS}
    summary = {
        "total": len(skills),
        "system": sum(1 for skill in skills if skill["source"] == "system"),
        "custom": sum(1 for skill in skills if skill["source"] == "custom"),
        "codexManaged": sum(1 for skill in skills if skill["discoveryRoot"] == "codex"),
        "agentLinked": sum(1 for skill in skills if skill["discoveryRoot"] == "agents"),
        "byRoot": {
            label: sum(1 for skill in skills if skill["discoveryRoot"] == label)
            for label, _ in SKILL_ROOTS
        },
        "duplicates": sorted({skill["name"] for skill in skills if skill["duplicateName"]}),
        "warningHeavy": sum(1 for skill in skills if len(skill["warnings"]) >= 2),
    }

    audit = {
        "catalog": {
            "roots": root_labels,
            "assessment": [
                "这个目录页只反映当前机器在配置扫描路径下真实存在的 skill。",
                "扫描条件很简单：目录里存在 `SKILL.md` 就会被视为一个 skill。",
                "风险标签是基于 `SKILL.md` 文本内容的启发式判断，不是静态白名单。",
                "默认路径展示会脱敏成 `~` 前缀；如需真实绝对路径，可设置 `SHOW_ABSOLUTE_PATHS=true`。",
            ],
        },
        "globalWarnings": [
            "同名 skill 表示相同名称在多个目录里同时存在，可能影响理解和触发判断。",
            "部分 skill 假设具备子代理能力；在不允许 delegation 的会话里会降级。",
            "若某个 skill 涉及 `gh issue create`、`git push`、`gh pr create`、`git commit` 或依赖安装，建议先确认当前仓库和账号上下文。",
        ],
    }

    usage = {
        "direct": "直接在请求里点名 skill，例如 `$tdd` 或 “用 write-a-prd 帮我整理这个需求”。",
        "natural": "也可以只描述场景；系统会根据每个 skill 的 `description` 和 `Use when ...` 自动尝试匹配。",
        "safety": "目录页里的风险标签来自文档启发式扫描，使用前仍建议人工判断上下文。",
    }

    config = {
        "refreshMs": REFRESH_MS,
        "showAbsolutePaths": SHOW_ABSOLUTE_PATHS,
    }

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "summary": summary,
        "audit": audit,
        "usage": usage,
        "config": config,
        "skills": skills,
    }


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/catalog":
            payload = build_payload()
            encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(encoded)))
            self.end_headers()
            self.wfile.write(encoded)
            return

        if parsed.path in {"/", "/index.html"}:
            self.path = "/index.html"

        return super().do_GET()

    def log_message(self, fmt: str, *args) -> None:
        print(f"[{self.log_date_time_string()}] {self.address_string()} {fmt % args}")


def main() -> None:
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "4455"))
    server = ThreadingHTTPServer((host, port), Handler)
    print(f"Serving Skill Registry at http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
