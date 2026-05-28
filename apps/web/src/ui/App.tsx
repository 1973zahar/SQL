import {
  BarChart3,
  Boxes,
  Building2,
  CircleDollarSign,
  FileText,
  LayoutDashboard,
  MessageSquare,
  PackageSearch,
  PlugZap,
  ShoppingCart,
  Store
} from "lucide-react";

const navItems = [
  { label: "Огляд", icon: LayoutDashboard, active: true },
  { label: "Товари", icon: PackageSearch },
  { label: "Залишки", icon: Boxes },
  { label: "Замовлення", icon: ShoppingCart },
  { label: "Клієнти", icon: Building2 },
  { label: "Фінанси", icon: CircleDollarSign },
  { label: "Комунікації", icon: MessageSquare },
  { label: "Маркетплейси", icon: Store },
  { label: "1C обмін", icon: PlugZap },
  { label: "Аналітика", icon: BarChart3 },
  { label: "Документи", icon: FileText }
];

const metrics = [
  { label: "Замовлення сьогодні", value: "0", hint: "Очікує підключення каналів" },
  { label: "Товарів у CRM", value: "0", hint: "Імпорт із 1C ще не запущено" },
  { label: "Подій обміну", value: "0", hint: "Inbox / outbox готові" },
  { label: "Помилок синхронізації", value: "0", hint: "Моніторинг буде в API" }
];

export function App() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark">CRM</div>
          <div>
            <strong>Marketplace CRM</strong>
            <span>Modular business hub</span>
          </div>
        </div>

        <nav className="nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button className={item.active ? "active" : ""} key={item.label} type="button">
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <h1>Операційна панель</h1>
            <p>Єдина точка для сайту, marketplace, B2B, retail і 1C.</p>
          </div>
          <button type="button">Створити замовлення</button>
        </header>

        <section className="metrics">
          {metrics.map((metric) => (
            <article className="metric" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <p>{metric.hint}</p>
            </article>
          ))}
        </section>

        <section className="workspace">
          <div className="panel">
            <h2>Поточний план запуску</h2>
            <div className="steps">
              <span>1. PostgreSQL hub</span>
              <span>2. Prisma models</span>
              <span>3. NestJS API</span>
              <span>4. React CRM</span>
              <span>5. 1C exchange</span>
            </div>
          </div>

          <div className="panel">
            <h2>Канали продажу</h2>
            <div className="channels">
              <span>Marketplace</span>
              <span>Сайт</span>
              <span>B2B</span>
              <span>Роздрібний магазин</span>
              <span>1C</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
