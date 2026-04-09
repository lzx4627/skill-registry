const state = {
  filter: "all",
  query: "",
  payload: null,
};

const els = {
  generatedAt: document.getElementById("generatedAt"),
  keyPoints: document.getElementById("keyPoints"),
  total: document.getElementById("metricTotal"),
  system: document.getElementById("metricSystem"),
  custom: document.getElementById("metricCustom"),
  customLabel: document.getElementById("metricCustomLabel"),
  newlyInstalled: document.getElementById("metricNew"),
  newlyInstalledLabel: document.getElementById("metricNewLabel"),
  summaryNote: document.getElementById("summaryNote"),
  legendRow: document.getElementById("legendRow"),
  scenarioList: document.getElementById("scenarioList"),
  usageList: document.getElementById("usageList"),
  auditSummary: document.getElementById("auditSummary"),
  skippedList: document.getElementById("skippedList"),
  warningList: document.getElementById("warningList"),
  newInstallStrip: document.getElementById("newInstallStrip"),
  filters: document.getElementById("filters"),
  search: document.getElementById("searchInput"),
  resultMeta: document.getElementById("resultMeta"),
  skillGroups: document.getElementById("skillGroups"),
  groupTemplate: document.getElementById("groupTemplate"),
  skillTemplate: document.getElementById("skillTemplate"),
};

const staticFilterLabels = {
  all: "全部",
  system: "系统内置",
  duplicates: "重名",
  warnings: "高副作用",
};

const guideDefinitions = [
  {
    title: "先按目录看",
    description: "如果你知道 skill 是怎么安装的，先按扫描根目录过滤，缩小范围最快。",
  },
  {
    title: "再按风险看",
    description: "如果你担心副作用，直接看“高副作用”分组，先排查会建 Issue、推分支、建 worktree 或装依赖的 skill。",
  },
  {
    title: "短词搜索更严格",
    description: "像 `ui`、`qa`、`pr` 这类短词会按词前缀匹配，避免把 `build` 这种误伤结果算进去。",
  },
  {
    title: "结果会自动刷新",
    description: "只要新的 skill 最终落到扫描目录里，页面会在自动刷新周期内把它显示出来。",
  },
];

async function boot() {
  await refreshPayload();
  bindEvents();
  renderSkills();
  window.setInterval(() => {
    refreshPayload().catch((error) => console.error(error));
  }, getRefreshMs());
}

function getRefreshMs() {
  return state.payload?.config?.refreshMs ?? 15000;
}

async function refreshPayload() {
  const response = await fetch("/api/catalog", { cache: "no-store" });
  const payload = await response.json();
  state.payload = payload;
  ensureValidFilter(payload);
  renderChrome(payload);
  renderSkills();
}

function ensureValidFilter(payload) {
  const valid = new Set([
    "all",
    "system",
    "duplicates",
    "warnings",
    ...Object.keys(payload.audit.catalog.roots),
  ]);
  if (!valid.has(state.filter)) {
    state.filter = "all";
  }
}

function bindEvents() {
  els.search.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderSkills();
  });

  els.filters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;

    state.filter = button.dataset.filter;
    syncActiveFilterButtons();
    renderSkills();
  });
}

function renderChrome(payload) {
  const { summary, usage, audit, config, generatedAt } = payload;
  const rootEntries = getRootEntries(payload);
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Shanghai",
  });

  els.generatedAt.textContent = `自动扫描 ${rootEntries.map((entry) => entry.label).join(" + ")}，最后刷新：${formatter.format(new Date(generatedAt))}`;

  els.total.textContent = summary.total;
  els.system.textContent = summary.system;

  const firstRoot = rootEntries[0];
  const secondRoot = rootEntries[1];
  els.customLabel.textContent = firstRoot ? firstRoot.label : "根目录 1";
  els.custom.textContent = firstRoot ? firstRoot.count : 0;
  els.newlyInstalledLabel.textContent = secondRoot ? secondRoot.label : "其他根目录";
  els.newlyInstalled.textContent = secondRoot ? secondRoot.count : 0;

  const hiddenRoots = rootEntries.length > 2 ? rootEntries.length - 2 : 0;
  const hiddenRootText =
    hiddenRoots > 0 ? `，另外还有 ${hiddenRoots} 个附加根目录` : "";
  els.summaryNote.textContent =
    `当前共 ${summary.total} 个 skill，其中 ${summary.system} 个是系统内置；页面每 ${Math.round(config.refreshMs / 1000)} 秒自动重新扫描一次${hiddenRootText}。`;

  const keyPoints = [
    `页面扫描的是当前机器配置的 skill 目录，不依赖硬编码的仓库名单。`,
    `如果你从命令行把新 skill 装进任一扫描目录，页面会自动显示出来。`,
    `风险标签来自 ` + "`SKILL.md`" + ` 文本启发式分析，不是白名单。`,
    summary.duplicates.length > 0
      ? `当前存在重名 skill：${summary.duplicates.join("、")}。`
      : `当前没有重名 skill。`,
  ];
  els.keyPoints.replaceChildren(...keyPoints.map(makeListItem));

  const legendItems = [
    ...rootEntries.slice(0, 2).map((entry, index) =>
      makeBadge(entry.label, index === 0 ? "accent" : "muted"),
    ),
    makeBadge("系统内置", "system"),
    makeBadge("会建 Issue", "warn"),
    makeBadge("建 worktree", "warn"),
    makeBadge("重名", "danger"),
  ];
  els.legendRow.replaceChildren(...legendItems);

  const usageEntries = [usage.direct, usage.natural, usage.safety];
  els.usageList.replaceChildren(...usageEntries.map(makeListItem));

  els.auditSummary.innerHTML = audit.catalog.assessment
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");

  els.skippedList.replaceChildren(
    ...rootEntries.map((entry) => makeListItem(`${entry.key}：${entry.label}`)),
  );

  els.warningList.replaceChildren(
    ...audit.globalWarnings.map((line) => makeListItem(line)),
  );

  els.newInstallStrip.replaceChildren(
    ...rootEntries.map((entry, index) =>
      makeTag(`扫描路径 ${index + 1}：${entry.label}`, index === 0 ? "accent" : "muted"),
    ),
    makeTag("识别条件：目录内存在 SKILL.md", "system"),
    makeTag(`更新方式：每 ${Math.round(config.refreshMs / 1000)} 秒自动同步`, "warn"),
  );

  renderGuides();
  renderFilters(payload);
}

function renderGuides() {
  const fragment = document.createDocumentFragment();

  for (const block of guideDefinitions) {
    const article = document.createElement("article");
    article.className = "scenario-card";

    const title = document.createElement("h3");
    title.textContent = block.title;

    const desc = document.createElement("p");
    desc.textContent = block.description;

    article.append(title, desc);
    fragment.appendChild(article);
  }

  els.scenarioList.replaceChildren(fragment);
}

function renderFilters(payload) {
  const rootEntries = getRootEntries(payload);
  const buttons = [
    makeFilterButton("all", "全部"),
    ...rootEntries.map((entry) => makeFilterButton(entry.key, entry.label)),
    makeFilterButton("system", "系统内置"),
    makeFilterButton("duplicates", "重名"),
    makeFilterButton("warnings", "高副作用"),
  ];
  els.filters.replaceChildren(...buttons);
  syncActiveFilterButtons();
}

function syncActiveFilterButtons() {
  for (const current of els.filters.querySelectorAll(".filter")) {
    current.classList.toggle("is-active", current.dataset.filter === state.filter);
  }
}

function getRootEntries(payload) {
  return Object.entries(payload.audit.catalog.roots).map(([key, label]) => ({
    key,
    label,
    count: payload.summary.byRoot[key] ?? 0,
  }));
}

function getFilterLabel(filter) {
  if (staticFilterLabels[filter]) return staticFilterLabels[filter];
  const root = getRootEntries(state.payload).find((entry) => entry.key === filter);
  return root ? root.label : filter;
}

function renderSkills() {
  const payload = state.payload;
  if (!payload) return;

  const visible = payload.skills.filter(matchesFilter).filter(matchesQuery);
  els.resultMeta.textContent = `当前显示 ${visible.length} / ${payload.skills.length} 个 skill，过滤条件：${getFilterLabel(state.filter)}`;

  if (visible.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "没有匹配项。换个关键词，或者切回“全部”再看。";
    els.skillGroups.replaceChildren(empty);
    return;
  }

  const groups = buildGroups(visible);
  const fragment = document.createDocumentFragment();

  groups.forEach((group) => {
    if (group.items.length === 0) return;
    fragment.appendChild(renderGroup(group));
  });

  els.skillGroups.replaceChildren(fragment);
}

function buildGroups(skills) {
  const payload = state.payload;

  if (state.filter === "duplicates") {
    return [
      {
        kicker: "Duplicates",
        title: "重名 skill",
        note: "这些 skill 名在全局目录里出现了不止一次。",
        items: sortSkills(skills),
      },
    ];
  }

  if (state.filter === "warnings") {
    return [
      {
        kicker: "High Side Effects",
        title: "高副作用 skill",
        note: "这组 skill 带有较明显的自动动作或环境依赖，使用前先看匹配字段和提醒。",
        items: sortSkills(skills),
      },
    ];
  }

  const groups = [
    ...getRootEntries(payload).map((entry) => ({
      key: entry.key,
      kicker: `Root: ${entry.key}`,
      title: entry.label,
      note: `来自 ${entry.label} 的 skill。`,
      items: [],
    })),
    {
      key: "system",
      kicker: "System Built-In",
      title: "系统内置",
      note: "随 Codex 提供的系统级 skill。",
      items: [],
    },
  ];

  for (const skill of skills) {
    const match = groups.find((group) => {
      if (group.key === "system") return skill.source === "system";
      return skill.discoveryRoot === group.key;
    });
    if (match) {
      match.items.push(skill);
    }
  }

  return groups.map((group) => ({ ...group, items: sortSkills(group.items) }));
}

function renderGroup(group) {
  const node = els.groupTemplate.content.firstElementChild.cloneNode(true);
  node.querySelector(".group-kicker").textContent = group.kicker;
  node.querySelector(".group-title").textContent = group.title;
  node.querySelector(".group-note").textContent = group.note;

  const list = node.querySelector(".group-list");
  const fragment = document.createDocumentFragment();
  group.items.forEach((skill, index) => fragment.appendChild(renderSkill(skill, index === 0)));
  list.replaceChildren(fragment);

  return node;
}

function renderSkill(skill, openByDefault = false) {
  const node = els.skillTemplate.content.firstElementChild.cloneNode(true);
  const details = node;
  if (openByDefault && !state.query) {
    details.open = true;
  }

  const titleEl = node.querySelector(".skill-title");
  const purposeEl = node.querySelector(".skill-purpose");
  const matchReasonEl = node.querySelector(".match-reason");
  const useWhenEl = node.querySelector(".use-when");
  const pathEl = node.querySelector(".info-path");
  const extraFilesEl = node.querySelector(".extra-files");

  setHighlightedText(titleEl, skill.name, state.query);
  setHighlightedText(
    purposeEl,
    skill.purpose || skill.description || "没有 frontmatter 描述。",
    state.query,
  );
  setHighlightedText(
    useWhenEl,
    skill.useWhen || "这个 skill 没有写清楚 `Use when ...`，建议点名使用。",
    state.query,
  );
  node.querySelector(".usage-hint").textContent = buildUsageHint(skill);
  setHighlightedText(pathEl, skill.path, state.query);
  setHighlightedText(
    extraFilesEl,
    skill.extraFiles.length > 0
      ? skill.extraFiles.join("，")
      : "只有 SKILL.md，没有额外资源文件。",
    state.query,
  );

  const matchReasons = getMatchReasons(skill, state.query);
  if (state.query && matchReasons.length > 0) {
    matchReasonEl.textContent = `匹配字段：${matchReasons.join("、")}`;
    matchReasonEl.hidden = false;
  } else {
    matchReasonEl.textContent = "";
    matchReasonEl.hidden = true;
  }

  const headings = node.querySelector(".headings");
  headings.replaceChildren(
    ...(skill.headings.length > 0
      ? skill.headings.map((heading) => makeListItem(heading))
      : [makeListItem("没有显式章节，主要依赖短说明。")]),
  );

  const warnings = node.querySelector(".warnings");
  warnings.replaceChildren(
    ...(skill.warnings.length > 0
      ? skill.warnings.map((warning) =>
          makeListItem(`${warning.label}：${warning.detail}`),
        )
      : [makeListItem("没有发现明显的自动副作用或硬编码环境依赖。")]),
  );

  const badgeWrap = node.querySelector(".skill-badges");
  badgeWrap.replaceChildren(...collectBadges(skill).map((badge) => makeBadge(badge.label, badge.tone)));

  return node;
}

function matchesFilter(skill) {
  const rootKeys = Object.keys(state.payload?.audit?.catalog?.roots ?? {});
  if (rootKeys.includes(state.filter)) {
    return skill.discoveryRoot === state.filter;
  }

  switch (state.filter) {
    case "system":
      return skill.source === "system";
    case "duplicates":
      return skill.duplicateName;
    case "warnings":
      return skill.warnings.length >= 2;
    default:
      return true;
  }
}

function matchesQuery(skill) {
  if (!state.query) return true;
  return getMatchReasons(skill, state.query).length > 0;
}

function sortSkills(skills) {
  return skills.slice().sort((a, b) => a.name.localeCompare(b.name));
}

function collectBadges(skill) {
  const badges = [];

  if (skill.source === "system") {
    badges.push({ label: "系统内置", tone: "system" });
  } else {
    const root = getRootEntries(state.payload).find((entry) => entry.key === skill.discoveryRoot);
    badges.push({
      label: root ? root.label : skill.discoveryRoot,
      tone: skill.discoveryRoot === "codex" ? "accent" : "muted",
    });
  }

  if (skill.duplicateName) {
    badges.push({ label: "重名", tone: "danger" });
  }

  if (skill.warnings.some((warning) => warning.id === "writes-issues")) {
    badges.push({ label: "会建 Issue", tone: "warn" });
  }

  if (skill.warnings.some((warning) => warning.id === "creates-commit")) {
    badges.push({ label: "会提交", tone: "warn" });
  }

  if (skill.warnings.some((warning) => warning.id === "installs-packages")) {
    badges.push({ label: "装依赖", tone: "warn" });
  }

  if (skill.warnings.some((warning) => warning.id === "creates-worktree")) {
    badges.push({ label: "建 worktree", tone: "warn" });
  }

  if (skill.warnings.some((warning) => warning.id === "pushes-or-prs")) {
    badges.push({ label: "推分支 / PR", tone: "danger" });
  }

  if (skill.warnings.some((warning) => warning.id === "needs-subagents")) {
    badges.push({ label: "依赖子代理", tone: "info" });
  }

  return badges;
}

function buildUsageHint(skill) {
  const direct = `直接说“用 ${skill.name} 做这个任务”，或者写“$${skill.name}”。`;
  if (skill.useWhen) {
    return `${direct} 如果不点名，也可以直接描述这类场景：${skill.useWhen}。`;
  }
  return `${direct} 由于它的触发描述不完整，点名使用更稳。`;
}

function getMatchReasons(skill, query) {
  if (!query) return [];

  const fields = [
    ["名称", skill.name],
    ["描述", skill.purpose || skill.description],
    ["适用场景", skill.useWhen],
    ["路径", skill.path],
    ["相对路径", skill.relativePath],
    ["附加文件", skill.extraFiles.join(" ")],
  ];

  return fields
    .filter(([, value]) => fieldMatchesQuery(value || "", query))
    .map(([label]) => label);
}

function fieldMatchesQuery(text, query) {
  const normalizedText = (text || "").toLowerCase();
  const normalizedQuery = (query || "").toLowerCase();
  if (!normalizedText || !normalizedQuery) return false;

  if (isShortAsciiQuery(normalizedQuery)) {
    return tokenizeSearchText(normalizedText).some((token) =>
      token.startsWith(normalizedQuery),
    );
  }

  return normalizedText.includes(normalizedQuery);
}

function isShortAsciiQuery(query) {
  return /^[a-z0-9]{1,2}$/.test(query);
}

function tokenizeSearchText(text) {
  return text.split(/[^a-z0-9]+/).filter(Boolean);
}

function setHighlightedText(element, text, query) {
  const content = text || "";
  if (!query || !content) {
    element.textContent = content;
    return;
  }

  const normalizedQuery = query.toLowerCase();
  const normalizedText = content.toLowerCase();

  if (!normalizedText.includes(normalizedQuery)) {
    element.textContent = content;
    return;
  }

  const escapedQuery = escapeRegExp(query);
  element.innerHTML = escapeHtml(content).replace(
    new RegExp(escapedQuery, "gi"),
    (match) => `<mark class="search-hit">${match}</mark>`,
  );
}

function makeListItem(text) {
  const li = document.createElement("li");
  li.textContent = text;
  return li;
}

function makeTag(text, tone) {
  const span = document.createElement("span");
  span.className = `tag tag-${tone}`;
  span.textContent = text;
  return span;
}

function makeBadge(text, tone) {
  const span = document.createElement("span");
  span.className = `badge badge-${tone}`;
  span.textContent = text;
  return span;
}

function makeFilterButton(filter, label) {
  const button = document.createElement("button");
  button.className = "filter";
  button.dataset.filter = filter;
  button.textContent = label;
  return button;
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

boot().catch((error) => {
  console.error(error);
  els.resultMeta.textContent = "加载失败，请检查服务端日志。";
});
