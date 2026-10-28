export const project = {
  name: "Следующий шаг",
  eyebrow: "Мини-CRM для небольшой команды",
  title: "Видно, кому написать сегодня",
  lead: "Каждая активная запись хранит владельца, этап и следующее действие. Этого хватает, чтобы перестать терять клиентов.",
  recordType: "client",
  entitySingular: "клиент",
  entityPlural: "клиенты",
  createLabel: "Добавить клиента",
  fields: {
    title: "Имя клиента",
    contact: "Контакт",
    owner: "Ответственный",
    nextAction: "Следующее действие",
    dueDate: "Дата",
    note: "Заметка",
  },
  statuses: [
    { value: "new", label: "Новая заявка" },
    { value: "in_progress", label: "В работе" },
    { value: "done", label: "Готово" },
  ],
  seeds: [
    {
      status: "new",
      payload: {
        title: "Анна Смирнова",
        contact: "@anna_demo",
        owner: "Макс",
        nextAction: "Уточнить задачу",
        dueDate: "2026-07-15",
        note: "Пришла после поста про AI-процессы.",
      },
    },
    {
      status: "in_progress",
      payload: {
        title: "Студия Север",
        contact: "team@example.test",
        owner: "Руслан",
        nextAction: "Отправить короткий план",
        dueDate: "2026-07-14",
        note: "Нужен трекер заявок без тяжёлой CRM.",
      },
    },
  ],
};
