(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* Topbar border on scroll ------------------------------------------------ */
  const topbar = $("#topbar");
  const onScroll = () => topbar && topbar.classList.toggle("scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Mobile navigation ------------------------------------------------------ */
  const menuBtn = $("#menu-btn");
  const sidebar = $("#sidebar");
  const scrim = $("#nav-scrim");

  const setNav = (open) => {
    document.body.classList.toggle("nav-open", open);
    document.body.classList.toggle("nav-locked", open);
    if (menuBtn) menuBtn.setAttribute("aria-expanded", String(open));
    if (scrim) scrim.hidden = !open;
  };

  menuBtn?.addEventListener("click", () => {
    setNav(!document.body.classList.contains("nav-open"));
  });
  scrim?.addEventListener("click", () => setNav(false));
  $$(".sidebar a").forEach((a) => a.addEventListener("click", () => setNav(false)));
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("nav-open")) setNav(false);
  });

  /* Search ----------------------------------------------------------------- */
  const modal = $("#search-modal");
  const backdrop = $("#search-backdrop");
  const input = $("#search-input");
  const results = $("#search-results");
  const closeBtn = $("#search-close");
  const triggers = [$("#search-trigger"), ...$$("[data-open-search]")].filter(Boolean);

  let entries = null;
  let loading = false;
  let selected = -1;
  let matches = [];

  const normalize = (value) =>
    (value || "")
      .toLocaleLowerCase("en")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const loadIndex = async () => {
    if (entries || loading) return entries;
    loading = true;
    try {
      const response = await fetch("/search-index.json", { credentials: "same-origin" });
      entries = response.ok ? await response.json() : [];
    } catch {
      entries = [];
    }
    loading = false;
    return entries;
  };

  const score = (entry, q) => {
    const title = normalize(entry.title);
    const description = normalize(entry.description);
    const summary = normalize(entry.summary);
    const tags = (entry.tags || []).map(normalize);
    if (title === q) return 120;
    if (title.startsWith(q)) return 100;
    if (title.includes(q)) return 75;
    if (tags.some((tag) => tag.includes(q))) return 55;
    if (description.includes(q)) return 35;
    if (summary.includes(q)) return 25;
    return 0;
  };

  const render = (query) => {
    if (!results) return;
    results.textContent = "";
    selected = -1;

    if (!entries) {
      results.innerHTML = '<p class="search-empty">Loading index…</p>';
      return;
    }

    const q = normalize(query.trim());
    matches = q
      ? entries
          .map((entry) => ({ entry, rank: score(entry, q) }))
          .filter((item) => item.rank > 0)
          .sort((a, b) => b.rank - a.rank)
          .slice(0, 12)
          .map((item) => item.entry)
      : entries.slice(0, 8);

    if (!matches.length) {
      results.innerHTML = '<p class="search-empty">No results. Try a different word.</p>';
      return;
    }

    const fragment = document.createDocumentFragment();
    matches.forEach((entry, index) => {
      const link = document.createElement("a");
      link.className = "search-result";
      link.href = entry.url;
      link.dataset.index = String(index);

      const title = document.createElement("h3");
      title.textContent = entry.title;
      link.append(title);

      const text = entry.description || entry.summary;
      if (text) {
        const p = document.createElement("p");
        p.textContent = text;
        link.append(p);
      }

      if (entry.tags?.length) {
        const tag = document.createElement("span");
        tag.className = "search-tag";
        tag.textContent = entry.tags.slice(0, 2).join(" · ");
        link.append(tag);
      }

      fragment.append(link);
    });
    results.append(fragment);
  };

  const select = (index) => {
    const items = $$(".search-result", results);
    if (!items.length) return;
    selected = (index + items.length) % items.length;
    items.forEach((item, i) => item.classList.toggle("selected", i === selected));
    items[selected].scrollIntoView({ block: "nearest" });
  };

  const openSearch = async () => {
    if (!modal) return;
    modal.hidden = false;
    if (backdrop) backdrop.hidden = false;
    document.body.classList.add("nav-locked");
    input.value = "";
    results.innerHTML = '<p class="search-empty">Loading index…</p>';
    input.focus();
    await loadIndex();
    render("");
  };

  const closeSearch = () => {
    if (!modal) return;
    modal.hidden = true;
    if (backdrop) backdrop.hidden = true;
    document.body.classList.remove("nav-locked");
  };

  triggers.forEach((trigger) => trigger.addEventListener("click", openSearch));
  closeBtn?.addEventListener("click", closeSearch);
  backdrop?.addEventListener("click", closeSearch);
  input?.addEventListener("input", (e) => render(e.target.value));

  document.addEventListener("keydown", (e) => {
    const isOpen = modal && !modal.hidden;
    const commandK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";

    if (commandK) {
      e.preventDefault();
      isOpen ? closeSearch() : openSearch();
      return;
    }
    if (!isOpen) {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "");
      if (e.key === "/" && !typing) {
        e.preventDefault();
        openSearch();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      closeSearch();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      select(selected + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      select(selected - 1);
    } else if (e.key === "Enter") {
      const item = $$(".search-result", results)[selected];
      if (item) {
        e.preventDefault();
        window.location.href = item.href;
      }
    }
  });

  /* Copy buttons ----------------------------------------------------------- */
  $$(".prose pre").forEach((pre) => {
    const code = pre.querySelector("code");
    if (!code) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "copy-btn";
    button.textContent = "Copy";
    button.setAttribute("aria-label", "Copy code");
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code.innerText);
        button.textContent = "Copied";
        button.classList.add("copied");
      } catch {
        button.textContent = "Failed";
      }
      setTimeout(() => {
        button.textContent = "Copy";
        button.classList.remove("copied");
      }, 1600);
    });
    pre.append(button);
  });

  /* Active table of contents ----------------------------------------------- */
  const tocLinks = $$(".toc a[href^='#']");
  if (tocLinks.length) {
    const headings = tocLinks
      .map((link) => document.getElementById(decodeURIComponent(link.hash.slice(1))))
      .filter(Boolean);

    const updateToc = () => {
      let current = headings[0]?.id;
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= 130) current = heading.id;
        else break;
      }
      tocLinks.forEach((link) => {
        link.classList.toggle("active", link.hash === `#${current}`);
      });
    };

    if (headings.length) {
      updateToc();
      window.addEventListener("scroll", updateToc, { passive: true });
    }
  }
})();
