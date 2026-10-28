import { project } from "./project.js";
import { store } from "./data/store.js";
import {
  escapeHtml,
  formatDate,
  onRouteChange,
  qs,
  qsa,
  renderLogin,
  renderShell,
  route,
  setNotice,
  statusLabel,
} from "./ui.js";
import { renderStyleguide } from "./styleguide.js";

const nav = (active) => [
  { href: "#/", label: "О продукте", active: active === "/" },
  { href: "#/workspace", label: "Рабочий экран", active: active === "/workspace" },
  { href: "#/styleguide", label: "Стиль", active: active === "/styleguide" },
];

function renderHome() {
  renderShell({
    title: `${project.name} — ${project.title}`,
    nav: nav("/"),
    content: `
      <section class="hero">
        <div class="container hero-grid">
          <div>
            <p class="eyebrow">${escapeHtml(project.eyebrow)}</p>
            <h1>${escapeHtml(project.title)}</h1>
            <p class="lead">${escapeHtml(project.lead)}</p>
            <div class="actions">
              <a class="button" href="#/workspace">Открыть рабочий экран</a>
            </div>
          </div>
          <aside class="panel">
            <p class="eyebrow">V1</p>
            <h2 style="font-size:32px">Один ежедневный вопрос</h2>
            <p>Кто требует внимания, что сделать и когда.</p>
            <p class="muted">Чтобы превратить starter в трекер задач, поменяй язык сущностей в <code>src/project.js</code>. Архитектура останется прежней.</p>
          </aside>
        </div>
      </section>
      <section class="section section--soft">
        <div class="container grid grid-3">
          <article class="card"><h3>Владелец</h3><p>У каждой записи понятен ответственный.</p></article>
          <article class="card"><h3>Этап</h3><p>Три статуса вместо длинной корпоративной воронки.</p></article>
          <article class="card"><h3>Следующий шаг</h3><p>Конкретное действие и дата не прячутся в комментариях.</p></article>
        </div>
      </section>
    `,
  });
}

function isOverdue(record) {
  const date = record.payload.dueDate;
  return date && record.status !== "done" && new Date(`${date}T23:59:59`) < new Date();
}

function recordCard(record) {
  const p = record.payload;
  return `
    <article class="record" data-id="${record.id}">
      <div class="split">
        <div>
          <span class="badge">${escapeHtml(statusLabel(record.status))}</span>
          ${isOverdue(record) ? '<span class="badge" style="color:var(--danger);margin-left:6px">Просрочено</span>' : ""}
          <h3 style="margin-top:12px">${escapeHtml(p.title || "Без названия")}</h3>
          <p><strong>${escapeHtml(p.nextAction || "Следующий шаг не указан")}</strong>${p.dueDate ? ` · ${escapeHtml(p.dueDate)}` : ""}</p>
          <p class="muted">${escapeHtml(p.contact || "Контакт не указан")} · ${escapeHtml(p.owner || "Нет ответственного")}</p>
          ${p.note ? `<p>${escapeHtml(p.note)}</p>` : ""}
          <p class="record-meta">Обновлено: ${formatDate(record.updated_at)}</p>
        </div>
        <div class="stack" style="min-width:190px">
          <label>
            Этап
            <select class="status-select">
              ${project.statuses.map((status) => `
                <option value="${status.value}" ${record.status === status.value ? "selected" : ""}>${escapeHtml(status.label)}</option>
              `).join("")}
            </select>
          </label>
          <button class="edit-next button button--secondary button--small">Изменить следующий шаг</button>
          <button class="archive button button--danger button--small">В архив</button>
        </div>
      </div>
      <form class="next-form stack" hidden style="margin-top:18px">
        <div class="grid grid-2">
          <label>${escapeHtml(project.fields.nextAction)}<input name="nextAction" value="${escapeHtml(p.nextAction || "")}" maxlength="160" required></label>
          <label>${escapeHtml(project.fields.dueDate)}<input name="dueDate" type="date" value="${escapeHtml(p.dueDate || "")}"></label>
        </div>
        <label>${escapeHtml(project.fields.note)}<textarea name="note" maxlength="1200">${escapeHtml(p.note || "")}</textarea></label>
        <div class="inline">
          <button class="button button--small" type="submit">Сохранить</button>
          <button class="cancel-next button button--secondary button--small" type="button">Отмена</button>
        </div>
      </form>
    </article>
  `;
}

async function workspaceMarkup(filter = "all") {
  const session = await store.session();
  if (store.mode === "supabase" && !session) return renderLogin();

  let records = await store.list(project.recordType);
  if (filter === "overdue") records = records.filter(isOverdue);
  if (filter === "missing") records = records.filter((record) => !record.payload.nextAction && record.status !== "done");

  const counts = Object.fromEntries(project.statuses.map((status) => [
    status.value,
    records.filter((record) => record.status === status.value).length,
  ]));

  return `
    <section class="section">
      <div class="container">
        <div class="split">
          <div>
            <p class="eyebrow">Рабочий экран</p>
            <h1 style="font-size:clamp(38px,6vw,64px)">${escapeHtml(project.name)}</h1>
            <p class="lead">${store.mode === "local" ? "Демо-данные хранятся в этом браузере." : `Вход: ${escapeHtml(session?.user?.email || "участник")}`}</p>
          </div>
          <div class="inline">
            ${store.mode === "local" ? '<button id="seed-records" class="button button--secondary">Вернуть демо</button>' : ""}
            ${store.mode === "supabase" ? '<button id="logout" class="button button--secondary">Выйти</button>' : ""}
          </div>
        </div>

        <div class="grid grid-3" style="margin:30px 0">
          ${project.statuses.map((status) => `
            <article class="card">
              <span class="metric">${counts[status.value] || 0}</span>
              <h3>${escapeHtml(status.label)}</h3>
            </article>
          `).join("")}
        </div>

        <div class="inline" style="margin-bottom:18px">
          <button class="filter button button--small ${filter === "all" ? "" : "button--secondary"}" data-filter="all">Все</button>
          <button class="filter button button--small ${filter === "overdue" ? "" : "button--secondary"}" data-filter="overdue">Просроченные</button>
          <button class="filter button button--small ${filter === "missing" ? "" : "button--secondary"}" data-filter="missing">Без следующего шага</button>
        </div>

        <div class="grid grid-2">
          <form id="create-form" class="panel stack">
            <div>
              <p class="eyebrow">Новая запись</p>
              <h2 style="font-size:30px">${escapeHtml(project.createLabel)}</h2>
            </div>
            <label>${escapeHtml(project.fields.title)}<input name="title" maxlength="120" required></label>
            <label>${escapeHtml(project.fields.contact)}<input name="contact" maxlength="160"></label>
            <label>${escapeHtml(project.fields.owner)}<input name="owner" maxlength="80" required></label>
            <label>${escapeHtml(project.fields.nextAction)}<input name="nextAction" maxlength="160" required></label>
            <label>${escapeHtml(project.fields.dueDate)}<input name="dueDate" type="date"></label>
            <label>${escapeHtml(project.fields.note)}<textarea name="note" maxlength="1200"></textarea></label>
            <p id="create-error" class="field-error" hidden></p>
            <button class="button" type="submit">${escapeHtml(project.createLabel)}</button>
          </form>

          <div>
            <div class="record-list">
              ${records.length ? records.map(recordCard).join("") : `
                <div class="empty">
                  <h3>Подходящих записей нет</h3>
                  <p>Смени фильтр или создай первую запись.</p>
                </div>
              `}
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

let currentFilter = "all";

async function renderWorkspace() {
  renderShell({
    title: `${project.name} — рабочий экран`,
    nav: nav("/workspace"),
    content: '<section class="section"><div class="container">Загружаю…</div></section>',
  });
  qs("#main").innerHTML = await workspaceMarkup(currentFilter);

  const loginForm = qs("#login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const error = qs("#login-error");
      try {
        await store.signIn(String(data.get("email")), String(data.get("password")));
        await renderWorkspace();
      } catch (cause) {
        error.textContent = cause instanceof Error ? cause.message : "Не удалось войти";
        error.hidden = false;
      }
    });
    return;
  }

  qs("#logout")?.addEventListener("click", async () => {
    await store.signOut();
    await renderWorkspace();
  });

  qs("#seed-records")?.addEventListener("click", async () => {
    await store.reset(project.recordType, project.seeds);
    currentFilter = "all";
    await renderWorkspace();
  });

  for (const button of qsa(".filter")) {
    button.addEventListener("click", async () => {
      currentFilter = button.dataset.filter;
      await renderWorkspace();
    });
  }

  qs("#create-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = Object.fromEntries(["title", "contact", "owner", "nextAction", "dueDate", "note"].map((key) => [key, String(data.get(key) || "").trim()]));
    const error = qs("#create-error");
    if (payload.title.length < 2 || payload.owner.length < 2 || payload.nextAction.length < 3) {
      error.textContent = "Заполни название, ответственного и конкретное следующее действие.";
      error.hidden = false;
      return;
    }
    try {
      await store.create(project.recordType, payload, "new");
      form.reset();
      currentFilter = "all";
      await renderWorkspace();
      setNotice(`${project.entitySingular[0].toUpperCase()}${project.entitySingular.slice(1)} добавлен`);
    } catch (cause) {
      error.textContent = cause instanceof Error ? cause.message : "Не удалось создать запись";
      error.hidden = false;
    }
  });

  for (const node of qsa(".record")) {
    const id = node.dataset.id;
    const statusSelect = qs(".status-select", node);
    statusSelect.addEventListener("change", async () => {
      try {
        await store.update(id, { status: statusSelect.value });
        setNotice("Этап сохранён");
      } catch (cause) {
        setNotice(cause instanceof Error ? cause.message : "Не удалось сохранить", "error");
      }
    });

    const nextForm = qs(".next-form", node);
    qs(".edit-next", node).addEventListener("click", () => { nextForm.hidden = false; });
    qs(".cancel-next", node).addEventListener("click", () => { nextForm.hidden = true; });
    nextForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const current = (await store.list(project.recordType)).find((record) => record.id === id);
      const data = new FormData(event.currentTarget);
      try {
        await store.update(id, {
          payload: {
            ...current.payload,
            nextAction: String(data.get("nextAction") || "").trim(),
            dueDate: String(data.get("dueDate") || ""),
            note: String(data.get("note") || "").trim(),
          },
        });
        await renderWorkspace();
        setNotice("Следующий шаг сохранён");
      } catch (cause) {
        setNotice(cause instanceof Error ? cause.message : "Не удалось сохранить", "error");
      }
    });

    qs(".archive", node).addEventListener("click", async () => {
      try {
        await store.archive(id);
        await renderWorkspace();
        setNotice("Запись отправлена в архив");
      } catch (cause) {
        setNotice(cause instanceof Error ? cause.message : "Не удалось архивировать", "error");
      }
    });
  }
}

async function render() {
  const current = route();
  if (current === "/workspace") return renderWorkspace();
  if (current === "/styleguide") return renderStyleguide();
  return renderHome();
}

onRouteChange(() => {
  render().catch((error) => {
    console.error(error);
    setNotice(error.message || "Ошибка приложения", "error");
  });
});
