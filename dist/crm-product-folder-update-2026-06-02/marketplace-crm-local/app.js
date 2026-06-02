"use strict";

const STORAGE_KEY = "marketplace-crm-v1";
const APP_VERSION = "2026.06.02.7";
const APP_BUILD = "20260602-product-group-1";
const APP_BUILD_DATE = "2026-06-02";
const APP_BUILD_DAY = "вівторок";
const APP_BUILD_TIME = "16:05";

function createSafeStorage(storageName) {
  const memory = new Map();
  try {
    const storage = window[storageName];
    const testKey = `__crm_storage_test_${Date.now()}`;
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return storage;
  } catch (error) {
    return {
      getItem(key) {
        return memory.has(key) ? memory.get(key) : null;
      },
      setItem(key, value) {
        memory.set(key, String(value));
      },
      removeItem(key) {
        memory.delete(key);
      }
    };
  }
}

const appLocalStorage = createSafeStorage("localStorage");
const appSessionStorage = createSafeStorage("sessionStorage");

const NAV = [
  ["dashboard", "Панель", "ПН"],
  ["sales", "Продажі", "ПР"],
  ["products", "Товари", "ТВ"],
  ["reports", "Аналітика та звіти", "АЗ"],
  ["finance", "Фінанси", "ФН"],
  ["settings", "Налаштування", "НЛ"]
];

const SUBVIEWS = {
  sales: [
    ["orders", "Замовлення"],
    ["warehouse", "Склад"],
    ["logistics", "Логістика"],
    ["clients", "Клієнти"],
    ["communication", "Комунікація"]
  ],
  products: [
    ["catalog", "Каталог"],
    ["stock", "Залишки на складі"],
    ["publications", "Публікації"]
  ],
  finance: [
    ["payments", "Оплати за замовлення"],
    ["settlements", "Розрахунки із маркетплейсами"]
  ],
  settings: [
    ["dataExchange", "Обмін даними"],
    ["logistics", "Логістика"],
    ["communicators", "Комунікатори та зв'язок"],
    ["funnels", "Воронки"],
    ["team", "Команда"]
  ]
};

const ROLE_SUBVIEW_PERMISSIONS = Object.entries(SUBVIEWS).flatMap(([viewId, items]) => {
  const viewLabel = NAV.find(([id]) => id === viewId)?.[1] || viewId;
  return items.map(([subviewId, label]) => [`${viewId}:${subviewId}`, `${viewLabel} / ${label}`]);
});

const SUBVIEW_SECTION_PREFIXES = {
  sales: {
    orders: ["2.1", "Імпортовані замовлення"],
    warehouse: ["2.2"],
    logistics: ["2.3"],
    clients: ["2.4"],
    communication: ["2.5"]
  },
  products: {
    catalog: ["3.1"],
    stock: ["3.2"],
    publications: ["3.3"]
  },
  finance: {
    payments: ["5.1"],
    settlements: ["5.2"]
  },
  settings: {
    dataExchange: ["6.1", "Обмін даними", "Підключені маркетплейси"],
    logistics: ["6.2"],
    communicators: ["6.3"],
    funnels: ["6.4"],
    team: ["6.5"]
  }
};

const VARIANT_DICTIONARY_DEFINITIONS = [
  { key: "documentTypes", label: "Типи документів", legacyKey: "documentTypes" },
  { key: "purchaseDocumentTypes", label: "Типи документів приходу" },
  { key: "salesChannels", label: "Канали продажу" },
  { key: "delivery", label: "Служби доставки", legacyKey: "delivery" },
  { key: "deliveryPayers", label: "Платники доставки" },
  { key: "paymentModes", label: "Режими оплати продажу" },
  { key: "paymentSources", label: "Джерела оплати" },
  { key: "paymentTerms", label: "Умови оплат клієнтів" },
  { key: "clientTypes", label: "Типи клієнтів" },
  { key: "taxModes", label: "Податкові режими" },
  { key: "financeMethods", label: "Методи витрат" },
  { key: "b2bReportSources", label: "Джерела B2B звіту" },
  { key: "cashArticles", label: "Статті руху коштів", legacyKey: "cashArticles" },
  { key: "expenseArticles", label: "Статті витрат", legacyKey: "expenseArticles" },
  { key: "warehouseKinds", label: "Типи складів" }
];

const CATALOG_PARAMETER_DEFINITIONS = [
  { key: "productTypes", label: "Типи товарів", valueHint: "weapon / regular" },
  { key: "brands", label: "Бренди", productDictionaryKey: "brands" },
  { key: "categories", label: "Категорії", productDictionaryKey: "categories" },
  { key: "calibers", label: "Калібри", productDictionaryKey: "calibers" },
  { key: "catalogTags", label: "Акції / розпродаж", valueHint: "Акція / Розпродаж" }
];

const DEFAULT_VARIANT_DICTIONARIES = {
  documentTypes: ["Рахунок", "Видаткова накладна", "Реалізація", "Акт відповідального зберігання", "Повернення", "Переміщення"],
  purchaseDocumentTypes: ["Прибуткова накладна", "Імпорт BAS/BAF", "Акт приймання", "Коригування приходу"],
  salesChannels: ["Rozetka", "Prom", "Epicentr", "Allo"],
  delivery: ["Нова пошта", "Укрпошта", "Міст", "Спецзв'язок Укрпошти"],
  deliveryPayers: ["Клієнт", "Компанія", "Маркетплейс"],
  paymentModes: ["Оплачено", "Попередня оплата часткова", "Відтермінування"],
  paymentSources: [
    { id: "payment-source-cash", name: "Готівкова каса", value: "cash" },
    { id: "payment-source-bank", name: "Банк", value: "bank" },
    { id: "payment-source-card", name: "Оплата карткою", value: "card" }
  ],
  paymentTerms: ["Попередня оплата", "Відтермінування 7 днів", "Відтермінування 14 днів", "Відтермінування 30 днів", "Оплата при продажу"],
  clientTypes: [
    { id: "client-type-b2b", name: "B2B", value: "B2B" },
    { id: "client-type-retail", name: "Роздріб", value: "Retail" },
    { id: "client-type-marketplace", name: "Маркетплейс", value: "Marketplace" }
  ],
  taxModes: ["ПДВ", "без ПДВ", "роздріб"],
  financeMethods: ["Каса", "Безготівка", "Банк API", "Конвертація"],
  b2bReportSources: ["Кабінет клієнта", "Звіт клієнта менеджеру", "Імпорт файлу"],
  cashArticles: ["Продаж товарів", "Передоплата B2B", "Повернення коштів", "Конвертація валюти", "Інкасація"],
  expenseArticles: ["Комісія маркетплейсу", "Логістика", "Оренда", "Зарплата", "Банківська комісія", "Закупівля товару"],
  warehouseKinds: [
    { id: "warehouse-own", name: "Основний", value: "own" },
    { id: "warehouse-retail", name: "Магазин", value: "retail" },
    { id: "warehouse-responsible", name: "Відповідальне зберігання", value: "responsible" }
  ]
};

const DEFAULT_CATALOG_PARAMETERS = {
  productTypes: [
    { id: "catalog-type-weapon", name: "Зброя", value: "weapon", active: true },
    { id: "catalog-type-regular", name: "Звичайний товар", value: "regular", active: true }
  ],
  brands: ["Delta Arms", "Nord Hunt", "Optix", "FieldLine"],
  categories: ["Зброя нарізна", "Зброя гладкоствольна", "Оптика", "Чохли та кейси", "Аксесуари"],
  calibers: ["5.56x45", "12/76", "9x19", ".308 Win", "без калібру"],
  catalogTags: ["Акція", "Розпродаж"]
};

const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Kyiv" });

const DEFAULT_SALES_FUNNEL = [
  { id: "new_order", label: "Нове замовлення", className: "marketplace-new", slaHours: 1, reminder: "Прийняти замовлення з маркетплейсу і призначити менеджера.", active: true },
  { id: "in_progress", label: "В роботі", className: "marketplace-progress", slaHours: 1, reminder: "Відкрити картку, перевірити товар, клієнта, оплату і доставку.", active: true },
  { id: "waiting_client", label: "Очікує підтвердження клієнта", className: "marketplace-waiting", slaHours: 2, reminder: "Повторно зателефонувати або написати клієнту для підтвердження.", active: true },
  { id: "confirmed_by_client", label: "Підтверджено клієнтом", className: "marketplace-confirmed", slaHours: 2, reminder: "Зафіксувати підтвердження, адресу, оплату і склад замовлення.", active: true },
  { id: "upsell", label: "Апсел / крос-сел", className: "marketplace-upsell", slaHours: 4, reminder: "Запропонувати додаткові товари, комплект або витратні матеріали.", active: true },
  { id: "waiting_payment", label: "Очікує оплату", className: "marketplace-payment-waiting", slaHours: 24, reminder: "Перевірити оплату і нагадати покупцю, якщо потрібно.", active: true },
  { id: "paid", label: "Оплачено", className: "marketplace-paid", slaHours: 2, reminder: "Звірити оплату і передати замовлення на комплектацію.", active: true },
  { id: "picking", label: "На комплектації", className: "marketplace-warehouse", slaHours: 4, reminder: "Склад має зарезервувати і зібрати товар.", active: true },
  { id: "picked", label: "Зібрано", className: "marketplace-picked", slaHours: 4, reminder: "Перевірити зібране замовлення і підготувати ТТН.", active: true },
  { id: "shipped", label: "Відправлено", className: "marketplace-delivery", slaHours: 24, reminder: "Перевірити ТТН, рух посилки і повідомити покупця.", active: true },
  { id: "delivered", label: "Доставлено", className: "marketplace-delivered", slaHours: 24, reminder: "Підтвердити доставку і якість контакту.", active: true },
  { id: "completed", label: "Завершено", className: "marketplace-completed", slaHours: 24, reminder: "Закрити продаж і підготувати післяпродажний контакт.", active: true },
  { id: "follow_up", label: "Follow-up", className: "marketplace-aftersale", slaHours: 72, reminder: "Зв'язатися після отримання: відгук, гарантія, сервіс.", active: true },
  { id: "repeat_sale", label: "Повторний продаж", className: "marketplace-repeat", slaHours: 168, reminder: "Перевести клієнта у повторну воронку і підготувати пропозицію.", active: true },
  { id: "cancelled", label: "Скасовано", className: "marketplace-cancelled", slaHours: 1, reminder: "Зафіксувати причину скасування і закрити активні дії.", active: true }
];

const MARKETPLACE_ORDER_STATUSES = DEFAULT_SALES_FUNNEL.map(({ id, label, className }) => ({ id, label, className }));
const MARKETPLACE_ORDER_STATUS_MAP = Object.fromEntries(MARKETPLACE_ORDER_STATUSES.map((item) => [item.id, item]));
const SALES_FUNNEL_DESCRIPTIONS = {
  new_order: "Замовлення прийшло з маркетплейсу",
  in_progress: "Менеджер відкрив і почав обробку",
  waiting_client: "Менеджер не додзвонився / очікує відповідь",
  confirmed_by_client: "Клієнт підтвердив замовлення",
  upsell: "Менеджер пропонує додаткові товари",
  waiting_payment: "Замовлення підтверджене, але не оплачене",
  paid: "Оплата отримана",
  picking: "Передано на склад",
  picked: "Склад підтвердив комплектацію",
  shipped: "Створена ТТН",
  delivered: "Замовлення доставлене клієнту",
  completed: "Продаж закрито",
  follow_up: "Післяпродажний контакт",
  repeat_sale: "Клієнт переведений у повторну воронку",
  cancelled: "Замовлення скасоване"
};
const SALES_FUNNEL_WORKFLOW_RULES = {
  new_order: {
    menuLocation: "Панель → картка статусу; Продажі → Замовлення",
    entryCondition: "Замовлення імпортоване з маркетплейсу або створене вручну в CRM; є номер замовлення, покупець і товар.",
    completionCondition: "CRM створила або оновила клієнта, призначила менеджера і підготувала замовлення до обробки.",
    switchBy: "Автоматично при імпорті/створенні або кнопкою «Авто». Далі переходить у «В роботі» після відкриття картки замовлення менеджером."
  },
  in_progress: {
    menuLocation: "Продажі → Замовлення; картка замовлення",
    entryCondition: "Менеджер відкрив нове замовлення або взяв його в роботу.",
    completionCondition: "Перевірені покупець, товар, кількість, ціна, спосіб оплати і доставка; визначено наступну дію.",
    switchBy: "Автоматично при відкритті картки нового замовлення; далі кнопками «Очікує клієнта» або «Підтверджено»."
  },
  waiting_client: {
    menuLocation: "Продажі → Замовлення; комунікація по замовленню",
    entryCondition: "Менеджер не додзвонився, покупець не відповів або треба дочекатися уточнення.",
    completionCondition: "Є відповідь покупця: підтвердження, відмова або уточнені дані доставки/оплати.",
    switchBy: "Кнопка «Очікує клієнта», повідомлення/дзвінок менеджера або вибір статусу у формі замовлення."
  },
  confirmed_by_client: {
    menuLocation: "Продажі → Замовлення; картка клієнта",
    entryCondition: "Покупець підтвердив замовлення, контакти і доставку.",
    completionCondition: "Клієнт створений у CRM, товар і спосіб оплати узгоджені.",
    switchBy: "Кнопка «Підтверджено» або вибір статусу у формі замовлення."
  },
  upsell: {
    menuLocation: "Продажі → Замовлення; комунікація з покупцем",
    entryCondition: "Замовлення підтверджене клієнтом; менеджер може запропонувати супутні товари.",
    completionCondition: "Апсел запропоновано і зафіксовано результат: додано товар, відмова або без змін.",
    switchBy: "Кнопка «Апсел» або вибір статусу у формі замовлення."
  },
  waiting_payment: {
    menuLocation: "Продажі → Замовлення; Фінанси → Оплати за замовлення",
    entryCondition: "Замовлення підтверджене, але оплата ще не отримана або потребує перевірки.",
    completionCondition: "Оплата підтверджена маркетплейсом, банком, післяплатою або менеджером.",
    switchBy: "Кнопка «Очікує оплату», API оплати або вибір статусу у формі замовлення."
  },
  paid: {
    menuLocation: "Продажі → Замовлення; Фінанси → Оплати за замовлення",
    entryCondition: "Оплата отримана або підтверджена API/банком/післяплатою.",
    completionCondition: "Оплата звірена з сумою замовлення; можна передавати на склад.",
    switchBy: "Кнопка «Оплата», API оплати або статус оплати «оплачено» у формі замовлення."
  },
  picking: {
    menuLocation: "Продажі → Замовлення; Продажі → Логістика; Товари → Залишки",
    entryCondition: "Клієнт підтвердив замовлення; товар доступний або створена накладна/резерв.",
    completionCondition: "Склад прийняв завдання, зарезервував товар і почав комплектацію.",
    switchBy: "Кнопка «Комплектація» або створення накладної з замовлення."
  },
  picked: {
    menuLocation: "Продажі → Логістика; картка замовлення",
    entryCondition: "Замовлення передано на комплектацію і склад має товар для відвантаження.",
    completionCondition: "Склад підтвердив, що товар зібрано і готовий до відправки.",
    switchBy: "Кнопка «Зібрано»."
  },
  shipped: {
    menuLocation: "Продажі → Логістика; картка замовлення",
    entryCondition: "Замовлення зібрано; внесено або створено ТТН.",
    completionCondition: "Посилка передана перевізнику, ТТН записана в CRM.",
    switchBy: "Кнопка «Відправлено» або API логістики."
  },
  delivered: {
    menuLocation: "Продажі → Логістика; картка замовлення",
    entryCondition: "Перевізник або менеджер підтвердив вручення/доставку.",
    completionCondition: "Доставка зафіксована, немає відкритих проблем по отриманню.",
    switchBy: "Кнопка «Доставлено» / «Відстежити доставку» або API логістики."
  },
  completed: {
    menuLocation: "Продажі → Замовлення; Панель → воронка",
    entryCondition: "Замовлення доставлено клієнту.",
    completionCondition: "Продаж закрито, документи і оплата звірені, наступна дія — післяпродажний контакт.",
    switchBy: "Кнопка «Завершено»."
  },
  follow_up: {
    menuLocation: "Продажі → Комунікація; Панель → воронка",
    entryCondition: "Продаж завершено; настав час післяпродажного контакту.",
    completionCondition: "Покупцю написали або зателефонували: відгук, гарантія, сервіс, додаткові потреби.",
    switchBy: "Кнопка «Follow-up» або зафіксована комунікація менеджера."
  },
  repeat_sale: {
    menuLocation: "Продажі → Комунікація; Аналітика та звіти → повторні продажі",
    entryCondition: "Післяпродажний контакт виконано і є потенціал повторної покупки.",
    completionCondition: "Клієнт переведений у повторну воронку або створено нову пропозицію/замовлення.",
    switchBy: "Кнопка «Повтор»."
  },
  cancelled: {
    menuLocation: "Продажі → Замовлення; Панель → воронка",
    entryCondition: "Клієнт, маркетплейс або менеджер скасував замовлення; або неможливо виконати оплату/склад/доставку.",
    completionCondition: "Причину скасування зафіксовано, резерви складу/документи/оплати перевірені.",
    switchBy: "Кнопка «Скасовано» або вибір статусу у формі замовлення."
  }
};
const SALES_FUNNEL_CLASS_OPTIONS = [
  ["marketplace-new", "жовтий / новий"],
  ["marketplace-progress", "синій / в роботі"],
  ["marketplace-waiting", "помаранчевий / очікування"],
  ["marketplace-confirmed", "фіолетовий / підтверджено"],
  ["marketplace-upsell", "індиго / апсел"],
  ["marketplace-payment-waiting", "бурштин / оплата"],
  ["marketplace-paid", "зелений / оплачено"],
  ["marketplace-warehouse", "бірюзовий / склад"],
  ["marketplace-picked", "зелений / зібрано"],
  ["marketplace-delivery", "синій / доставка"],
  ["marketplace-delivered", "зелений / доставлено"],
  ["marketplace-completed", "зелений / завершено"],
  ["marketplace-aftersale", "ціан / follow-up"],
  ["marketplace-repeat", "пурпурний / повтор"],
  ["marketplace-cancelled", "червоний / скасовано"]
];
const MARKETPLACE_STATUS_ALIASES = {
  agreed: "confirmed_by_client",
  sent_to_warehouse: "picking",
  sent_to_delivery: "shipped",
  aftersale: "follow_up",
  invoiced: "picking",
  payment_expected: "waiting_payment",
  shipped_to_customer: "shipped",
  done: "completed",
  closed: "completed",
  canceled: "cancelled"
};
const MARKETPLACE_FINAL_STATUSES = ["completed", "repeat_sale", "cancelled"];

const seedState = {
  currentView: "dashboard",
  currentEmployeeId: "emp-001",
  currentRole: "Адміністратор",
  currentManager: "Марія Шевчук",
  settings: {
    closedDay: "2026-05-21",
    baseCurrency: "UAH",
    rates: { UAH: 40.2, USD: 1, EUR: 0.92 },
    firms: [
      { id: "vat", name: "ТОВ Альфа Армс, ПДВ", vat: true },
      { id: "fop", name: "ФОП без ПДВ", vat: false }
    ],
    paymentTerminals: [
      { id: "term-vat-main", name: "POS Monobank · магазин", firmId: "vat", provider: "Mono" },
      { id: "term-vat-b2b", name: "POS ПриватБанк · B2B", firmId: "vat", provider: "ПриватБанк" },
      { id: "term-fop-main", name: "POS LiqPay · ФОП", firmId: "fop", provider: "LiqPay" }
    ],
    suppliers: [
      { id: "sup-delta", name: "Delta Arms", edrpou: "", phone: "", email: "" },
      { id: "sup-nord", name: "Nord Hunt", edrpou: "", phone: "", email: "" },
      { id: "sup-optix", name: "Optix", edrpou: "", phone: "", email: "" },
      { id: "sup-fieldline", name: "FieldLine", edrpou: "", phone: "", email: "" }
    ],
    productDictionaries: {
      categories: ["Зброя нарізна", "Зброя гладкоствольна", "Оптика", "Чохли та кейси", "Аксесуари"],
      units: ["шт", "компл", "упак"],
      brands: ["Delta Arms", "Nord Hunt", "Optix", "FieldLine"],
      models: ["Карабін AR-15 Civil", "Рушниця помпова Hunter 12", "Приціл коліматорний R-Point", "Чохол тактичний 120 см"],
      calibers: ["5.56x45", "12/76", "9x19", ".308 Win", "без калібру"],
      uktzed: ["9303300000", "9303201000", "9013109000", "4202921900"],
      supplierSkus: ["DA-AR15-CIV", "NH-PUMP-12", "OP-RPOINT", "FL-CASE-120"],
      internalCodes: ["WPN-AR15-001", "WPN-H12-002", "ACC-OPT-001", "ACC-BAG-120"]
    },
    catalogParameters: DEFAULT_CATALOG_PARAMETERS,
    delivery: ["Нова пошта", "Укрпошта", "Міст", "Спецзв'язок Укрпошти"],
    documentTypes: ["Рахунок", "Видаткова накладна", "Реалізація", "Акт відповідального зберігання", "Повернення", "Переміщення"],
    priceTypes: ["Маркетплейс", "Акційна", "Рекомендована"],
    cashArticles: ["Продаж товарів", "Передоплата B2B", "Повернення коштів", "Конвертація валюти", "Інкасація"],
    expenseArticles: ["Комісія маркетплейсу", "Логістика", "Оренда", "Зарплата", "Банківська комісія", "Закупівля товару"],
    salesFunnel: DEFAULT_SALES_FUNNEL,
    communicators: {
      viber: {
        enabled: true,
        mode: "test",
        senderName: "Marketplace CRM",
        authToken: "",
        webhookUrl: "http://192.168.4.14:8789/api/viber/webhook",
        defaultTemplate: "Вітаємо, {buyer}. Ваше замовлення {order} у статусі: {status}. Менеджер: {manager}."
      },
      callRecording: {
        enabled: true,
        consentRequired: true,
        retentionDays: 180,
        source: "browser_microphone"
      }
    },
    dataExchange: {
      channel: "marketplaces",
      mode: "all",
      marketplaceIds: ["rozetka", "prom", "epicentr", "allo"],
      marketplaceData: ["products", "publications", "stock", "prices", "orders", "photos", "payments", "logistics", "clients", "messages", "orderQuestions", "sellerQuestions", "callCenterRequests", "returnRequests", "marketplaceThreads", "messageTemplates", "orderStatuses", "deliveryMethods", "productGroups", "reviews", "bundles"],
      basData: ["products", "stock"],
      oneCConnection: {
        system: "1c_utp_ukraine_1_2",
        transport: "file_json",
        server: "192.168.0.5",
        infobase: "pp_hor",
        endpoint: "http://192.168.0.5/arms-crm/exchange",
        format: "json",
        login: "",
        password: "",
        lastExport: "",
        lastImport: "",
        lastStatus: "draft",
        lastMessage: "Стартовий контур: 1C -> CRM, товари та залишки через файловий JSON."
      }
    },
    variantDictionaries: DEFAULT_VARIANT_DICTIONARIES,
    numberPrefix: "INV",
    defaultDueDays: 14,
    vatRate: 20
  },
  roles: [
    {
      name: "Адміністратор",
      canEditClosedDay: true,
      canSellWeapon: true,
      canChangePrices: true,
      canExportAccounting: true,
      canApproveCredit: true,
      canManageUsers: true,
      canViewReports: true,
      canEditSettings: true,
      canPrint: true
    },
    {
      name: "Керівник маркетплейсів",
      canEditClosedDay: false,
      canSellWeapon: true,
      canChangePrices: true,
      canExportAccounting: true,
      canApproveCredit: true,
      canManageUsers: false,
      canViewReports: true,
      canEditSettings: false,
      canPrint: true
    },
    {
      name: "Менеджер маркетплейсів",
      canEditClosedDay: false,
      canSellWeapon: true,
      canChangePrices: false,
      canExportAccounting: false,
      canApproveCredit: false,
      canManageUsers: false,
      canViewReports: false,
      canEditSettings: false,
      canPrint: false
    },
    {
      name: "Оператор складу",
      canEditClosedDay: false,
      canSellWeapon: true,
      canChangePrices: false,
      canExportAccounting: false,
      canApproveCredit: false,
      canManageUsers: false,
      canViewReports: true,
      canEditSettings: false,
      canPrint: true
    },
    {
      name: "Логіст",
      canEditClosedDay: false,
      canSellWeapon: false,
      canChangePrices: false,
      canExportAccounting: false,
      canApproveCredit: false,
      canManageUsers: false,
      canViewReports: false,
      canEditSettings: false,
      canPrint: true
    },
    {
      name: "Аналітик маркетплейсів",
      canEditClosedDay: false,
      canSellWeapon: false,
      canChangePrices: false,
      canExportAccounting: false,
      canApproveCredit: false,
      canManageUsers: false,
      canViewReports: false,
      canEditSettings: false,
      canPrint: false
    }
  ],
  employees: [
    { id: "emp-001", name: "Марія Шевчук", roleName: "Адміністратор", department: "Адміністрація", phone: "+380671112233", email: "m.shevchuk@example.com", login: "admin", password: "admin", active: true },
    { id: "emp-002", name: "Олег Кравець", roleName: "Керівник маркетплейсів", department: "Маркетплейси", phone: "+380672224455", email: "o.kravets@example.com", login: "lead", password: "1234", active: true },
    { id: "emp-003", name: "Ірина Бойко", roleName: "Менеджер маркетплейсів", department: "Операції каналів", phone: "+380673336677", email: "i.boiko@example.com", login: "manager", password: "1234", active: true },
    { id: "emp-004", name: "Сергій Данилюк", roleName: "Оператор складу", department: "Комплектація", phone: "+380674448899", email: "s.danyliuk@example.com", login: "sklad", password: "1234", active: true },
    { id: "emp-005", name: "Наталія Литвин", roleName: "Логіст", department: "Логістика", phone: "+380675559900", email: "n.lytvyn@example.com", login: "logist", password: "1234", active: true },
    { id: "emp-006", name: "Андрій Мельник", roleName: "Аналітик маркетплейсів", department: "Аналітика", phone: "+380676661122", email: "a.melnyk@example.com", login: "analyst", password: "1234", active: true }
  ],
  managers: ["Марія Шевчук", "Олег Кравець", "Ірина Бойко", "Сергій Данилюк", "Наталія Литвин", "Андрій Мельник"],
  clients: [
    {
      id: "c-001",
      name: "Магазин Тактик Про",
      type: "B2B",
      manager: "Марія Шевчук",
      paymentTerms: "Відтермінування 14 днів",
      creditLimitUAH: 450000,
      cabinetEnabled: true,
      portalLogin: "tactic",
      portalPassword: "tactic",
      edrpou: "40112233",
      phone: "+380501234567",
      email: "office@tactic-pro.ua",
      priceType: "B2B дилер",
      currency: "UAH",
      taxMode: "ПДВ",
      responsibleStorage: true,
      address: "Київ, вул. Складська, 12"
    },
    {
      id: "c-002",
      name: "Стрілецький Дім",
      type: "B2B",
      manager: "Олег Кравець",
      paymentTerms: "Попередня оплата",
      creditLimitUAH: 0,
      cabinetEnabled: true,
      portalLogin: "strilets",
      portalPassword: "strilets",
      edrpou: "30998877",
      phone: "+380631112233",
      email: "sales@striletskyi-dim.ua",
      priceType: "B2B базова",
      currency: "UAH",
      taxMode: "без ПДВ",
      responsibleStorage: true,
      address: "Львів, вул. Промислова, 4"
    },
    {
      id: "c-003",
      name: "Роздрібний покупець",
      type: "Retail",
      manager: "Ірина Бойко",
      paymentTerms: "Оплата при продажу",
      creditLimitUAH: 0,
      cabinetEnabled: false,
      edrpou: "",
      phone: "",
      email: "",
      priceType: "Роздріб",
      currency: "UAH",
      taxMode: "роздріб",
      responsibleStorage: false,
      address: ""
    }
  ],
  warehouses: [
    { id: "wh-main", name: "Центральний склад", kind: "own" },
    { id: "wh-store", name: "Магазин", kind: "retail" },
    { id: "wh-b2b", name: "Відповідальне зберігання", kind: "responsible" },
    { id: "wh-client-c-001", name: "Склад клієнта · Магазин Тактик Про", kind: "client_responsible", clientId: "c-001" },
    { id: "wh-client-c-002", name: "Склад клієнта · Стрілецький Дім", kind: "client_responsible", clientId: "c-002" }
  ],
  products: [
    {
      id: "p-100",
      type: "weapon",
      model: "Карабін AR-15 Civil",
      caliber: "5.56x45",
      brand: "Delta Arms",
      erzRequired: true,
      barcode: "4820001000019",
      supplierSku: "DA-AR15-CIV",
      internalCode: "WPN-AR15-001",
      uktzed: "9303300000",
      price: 86500,
      currency: "UAH",
      cost: 1620,
      costCurrency: "USD",
      category: "Зброя нарізна",
      unit: "шт",
      minStock: 2,
      leadTimeDays: 21,
      description: "Цивільний карабін із серійним обліком та ЄРЗ контролем.",
      photos: []
    },
    {
      id: "p-101",
      type: "weapon",
      model: "Рушниця помпова Hunter 12",
      caliber: "12/76",
      brand: "Nord Hunt",
      erzRequired: true,
      barcode: "4820001000026",
      supplierSku: "NH-PUMP-12",
      internalCode: "WPN-H12-002",
      uktzed: "9303201000",
      price: 31200,
      currency: "UAH",
      cost: 620,
      costCurrency: "EUR",
      category: "Зброя гладкоствольна",
      unit: "шт",
      minStock: 3,
      leadTimeDays: 18,
      description: "Помпова рушниця для цивільного ринку.",
      photos: []
    },
    {
      id: "p-200",
      type: "regular",
      model: "Приціл коліматорний R-Point",
      caliber: "",
      brand: "Optix",
      erzRequired: false,
      barcode: "4820002000018",
      supplierSku: "OP-RPOINT",
      internalCode: "ACC-OPT-001",
      uktzed: "9013109000",
      price: 5400,
      currency: "UAH",
      cost: 92,
      costCurrency: "USD",
      category: "Оптика",
      unit: "шт",
      minStock: 12,
      leadTimeDays: 14,
      catalogTag: "Акція",
      description: "Коліматорний приціл для роздрібного та B2B продажу.",
      photos: []
    },
    {
      id: "p-201",
      type: "regular",
      model: "Чохол тактичний 120 см",
      caliber: "",
      brand: "FieldLine",
      erzRequired: false,
      barcode: "4820002000025",
      supplierSku: "FL-CASE-120",
      internalCode: "ACC-BAG-120",
      uktzed: "4202921900",
      price: 2100,
      currency: "UAH",
      cost: 46,
      costCurrency: "EUR",
      category: "Чохли та кейси",
      unit: "шт",
      minStock: 15,
      leadTimeDays: 10,
      catalogTag: "Розпродаж",
      description: "Тканинний тактичний чохол 120 см.",
      photos: []
    }
  ],
  serials: [
    {
      id: "s-001",
      productId: "p-100",
      serial: "AR15-UA-24001",
      warehouseId: "wh-main",
      status: "available",
      erzStatus: "verified",
      actual: true,
      basSynced: true,
      purchaseId: "pin-240520-001",
      clientId: "",
      permitNumber: "",
      permitDate: ""
    },
    {
      id: "s-002",
      productId: "p-100",
      serial: "AR15-UA-24002",
      warehouseId: "wh-b2b",
      status: "responsible_storage",
      erzStatus: "verified",
      actual: true,
      basSynced: true,
      purchaseId: "pin-240520-001",
      clientId: "c-001",
      permitNumber: "",
      permitDate: ""
    },
    {
      id: "s-003",
      productId: "p-101",
      serial: "H12-UA-88015",
      warehouseId: "wh-store",
      status: "available",
      erzStatus: "pending",
      actual: true,
      basSynced: false,
      purchaseId: "pin-240521-002",
      clientId: "",
      permitNumber: "",
      permitDate: ""
    },
    {
      id: "s-004",
      productId: "p-100",
      serial: "AR15-UA-24003",
      warehouseId: "wh-client-c-001",
      status: "responsible_storage",
      erzStatus: "verified",
      actual: true,
      basSynced: true,
      purchaseId: "rs-240523-001",
      clientId: "c-001",
      permitNumber: "",
      permitDate: "",
      responsibleStorageDocId: "rs-240523-001"
    }
  ],
  stock: [
    { productId: "p-200", warehouseId: "wh-main", firmId: "vat", qty: 31 },
    { productId: "p-200", warehouseId: "wh-store", firmId: "vat", qty: 8 },
    { productId: "p-201", warehouseId: "wh-main", firmId: "fop", qty: 44 },
    { productId: "p-201", warehouseId: "wh-client-c-002", firmId: "vat", qty: 12, clientId: "c-002", responsibleStorageDocId: "rs-240522-002" }
  ],
  responsibleStorageDocs: [
    {
      id: "rs-240523-001",
      date: "2026-05-23",
      clientId: "c-001",
      warehouseId: "wh-client-c-001",
      productId: "p-100",
      qty: 1,
      serialIds: ["s-004"],
      manager: "Марія Шевчук",
      paymentDays: 14,
      status: "in_storage",
      ownership: "ours_until_client_sale",
      comment: "Передано на відповідальне зберігання, власність наша до продажу клієнтом."
    },
    {
      id: "rs-240522-002",
      date: "2026-05-22",
      clientId: "c-002",
      warehouseId: "wh-client-c-002",
      productId: "p-201",
      qty: 12,
      serialIds: [],
      manager: "Олег Кравець",
      paymentDays: 10,
      status: "in_storage",
      ownership: "ours_until_client_sale",
      comment: "Кількісний товар на складі клієнта."
    }
  ],
  b2bShipmentRequests: [
    {
      id: "req-240523-001",
      date: "2026-05-23",
      desiredDate: "2026-05-25",
      clientId: "c-001",
      productId: "p-200",
      qty: 2,
      status: "request_new",
      manager: "Марія Шевчук",
      comment: "Попередня заявка з B2B кабінету. Менеджер має підтвердити наявність, фірму, умови та відвантаження.",
      firmId: "",
      serialIds: [],
      price: "",
      currency: "",
      paymentDays: "",
      delivery: "",
      ttn: "",
      responsibleDocId: "",
      validation: []
    }
  ],
  purchases: [
    {
      id: "pin-240520-001",
      date: "2026-05-20",
      supplier: "Delta Arms",
      supplierDoc: "DA-8801",
      firmId: "vat",
      warehouseId: "wh-main",
      productId: "p-100",
      productType: "weapon",
      qty: 2,
      cost: 1620,
      currency: "USD",
      serials: ["AR15-UA-24001", "AR15-UA-24002"],
      accounting: true,
      basStatus: "exported",
      comment: "Імпортовано в BAS/BAF, серії актуальні"
    },
    {
      id: "pin-240521-002",
      date: "2026-05-21",
      supplier: "Nord Hunt",
      supplierDoc: "NH-772",
      firmId: "vat",
      warehouseId: "wh-store",
      productId: "p-101",
      productType: "weapon",
      qty: 1,
      cost: 620,
      currency: "EUR",
      serials: ["H12-UA-88015"],
      accounting: true,
      basStatus: "pending",
      comment: "Очікує підтвердження ЄРЗ та експорту BAS/BAF"
    }
  ],
  invoices: [
    {
      id: "inv-240521-001",
      date: "2026-05-21",
      firmId: "vat",
      channel: "B2B",
      clientId: "c-001",
      manager: "Марія Шевчук",
      currency: "UAH",
      total: 86500,
      paid: 30000,
      dueDate: "2026-06-04",
      accounting: true,
      locked: true,
      status: "partial",
      lines: [
        { productId: "p-100", qty: 1, price: 86500, serialId: "s-002", permitNumber: "ДЗ-450112", permitDate: "2026-05-19" }
      ],
      delivery: "Спецзв'язок Укрпошти",
      ttn: "SZ-009812"
    },
    {
      id: "inv-240522-002",
      date: "2026-05-22",
      firmId: "fop",
      channel: "Rozetka",
      clientId: "c-003",
      manager: "Ірина Бойко",
      currency: "UAH",
      total: 10800,
      paid: 10800,
      dueDate: "2026-05-22",
      accounting: false,
      locked: false,
      status: "paid",
      lines: [{ productId: "p-200", qty: 2, price: 5400, serialId: "", permitNumber: "", permitDate: "" }],
      delivery: "Нова пошта",
      ttn: "NP-590010222"
    }
  ],
  payments: [
    {
      id: "pay-001",
      invoiceId: "inv-240521-001",
      date: "2026-05-21",
      amount: 30000,
      currency: "UAH",
      rate: 1,
      method: "Безготівка",
      bankRef: "mono-88210"
    },
    {
      id: "pay-002",
      invoiceId: "inv-240522-002",
      date: "2026-05-22",
      amount: 10800,
      currency: "UAH",
      rate: 1,
      method: "Каса",
      bankRef: "cash-shift-47"
    }
  ],
  expenses: [
    { id: "exp-001", date: "2026-05-22", article: "Комісія маркетплейсу", amount: 648, currency: "UAH", method: "Безготівка", manager: "Ірина Бойко", supplier: "Rozetka", comment: "Комісія по замовленню NP-590010222" },
    { id: "exp-002", date: "2026-05-21", article: "Логістика", amount: 920, currency: "UAH", method: "Безготівка", manager: "Марія Шевчук", supplier: "Спецзв'язок Укрпошти", comment: "Доставка серійного товару" },
    { id: "exp-003", date: "2026-05-20", article: "Банківська комісія", amount: 18, currency: "USD", method: "Банк API", manager: "Олег Кравець", supplier: "Банк", comment: "SWIFT/еквайринг" }
  ],
  payables: [
    { id: "ap-001", supplier: "Delta Arms", manager: "Марія Шевчук", article: "Закупівля товару", amount: 3240, currency: "USD", dueDate: "2026-06-02", status: "open" },
    { id: "ap-002", supplier: "Optix", manager: "Олег Кравець", article: "Закупівля товару", amount: 1840, currency: "USD", dueDate: "2026-05-30", status: "open" },
    { id: "ap-003", supplier: "FieldLine", manager: "Ірина Бойко", article: "Закупівля товару", amount: 920, currency: "EUR", dueDate: "2026-06-08", status: "planned" }
  ],
  cashShifts: [
    { id: "shift-47", date: "2026-05-22", manager: "Ірина Бойко", expected: 10800, actual: 10800, closed: true },
    { id: "shift-48", date: "2026-05-23", manager: "Сергій Данилюк", expected: 0, actual: 0, closed: false }
  ],
  salesPlans: [
    { manager: "Марія Шевчук", period: "2026-05", plan: 320000, currency: "UAH" },
    { manager: "Олег Кравець", period: "2026-05", plan: 260000, currency: "UAH" },
    { manager: "Ірина Бойко", period: "2026-05", plan: 180000, currency: "UAH" }
  ],
  marketplaceStats: [
    { marketplace: "Rozetka", sku: "OP-RPOINT", productId: "p-200", price: 5400, sold: 2, commission: 648, logistics: 260, otherCosts: 80, cost: 92, costCurrency: "USD", currency: "UAH" },
    { marketplace: "Prom", sku: "FL-CASE-120", productId: "p-201", price: 2100, sold: 5, commission: 420, logistics: 350, otherCosts: 60, cost: 46, costCurrency: "EUR", currency: "UAH" },
    { marketplace: "Allo", sku: "OP-RPOINT", productId: "p-200", price: 5350, sold: 3, commission: 722, logistics: 390, otherCosts: 90, cost: 92, costCurrency: "USD", currency: "UAH" }
  ],
  marketplacePublications: [
    { id: "pub-001", marketplace: "Rozetka", productId: "p-200", sku: "OP-RPOINT-RZ", externalId: "rz-93001", title: "Приціл коліматорний R-Point", price: 5400, currency: "UAH", stockQty: 39, status: "published", photosStatus: "ok", lastSync: "2026-05-23 09:15", manager: "Ірина Бойко" },
    { id: "pub-002", marketplace: "Prom", productId: "p-201", sku: "FL-CASE-120-PR", externalId: "pr-12044", title: "Чохол тактичний 120 см", price: 2100, currency: "UAH", stockQty: 56, status: "needs_sync", photosStatus: "missing", lastSync: "2026-05-22 18:20", manager: "Олег Кравець" },
    { id: "pub-003", marketplace: "Allo", productId: "p-200", sku: "OP-RPOINT-AL", externalId: "al-55120", title: "Коліматорний приціл R-Point", price: 5350, currency: "UAH", stockQty: 39, status: "published", photosStatus: "ok", lastSync: "2026-05-23 08:40", manager: "Ірина Бойко" }
  ],
  marketplaceOrders: [
    {
      id: "mpo-001",
      marketplace: "Rozetka",
      externalOrderId: "RZ-20260523-101",
      date: "2026-05-23",
      status: "new_order",
      dates: { created: "2026-05-23", agreed: "", warehouse: "", delivery: "", delivered: "", paid: "" },
      warehouseStatus: "new",
      manager: "Ірина Бойко",
      productId: "p-200",
      sku: "OP-RPOINT-RZ",
      qty: 1,
      price: 5400,
      currency: "UAH",
      buyer: { name: "Олександр Клименко", phone: "+380501119900", email: "buyer101@example.com", edrpou: "", address: "Київ, відділення Нової пошти 12" },
      delivery: { service: "Нова пошта", city: "Київ", warehouse: "Відділення 12", ttn: "", status: "new", apiStatus: "Очікує ТТН", lastCheck: "" },
      payment: { method: "Післяплата маркетплейсу", status: "expected", amount: 5400, source: "RozetkaPay", apiStatus: "Очікує оплату", lastCheck: "", paidAt: "" },
      clientId: "",
      invoiceId: ""
    }
  ],
  viberMessages: [],
  communicationEvents: [],
  marketplaceCustomerQuestions: [
    {
      id: "mq-001",
      marketplace: "Rozetka",
      sourceType: "order_question",
      externalId: "chat-205506",
      chatId: "205506",
      orderId: "mpo-001",
      externalOrderId: "RZ-20260523-101",
      buyerName: "Олександр Клименко",
      buyerContact: "+380501119900",
      subject: "Питання про замовлення",
      message: "Добрий день. Коли буде відправка і чи можна змінити відділення Нової пошти?",
      status: "new",
      priority: "normal",
      createdAt: "2026-05-27 10:20",
      updatedAt: "2026-05-27 10:20",
      manager: "Ірина Бойко",
      answer: "",
      answeredAt: "",
      apiStatus: "отримано з Rozetka API",
      raw: {}
    },
    {
      id: "mq-002",
      marketplace: "Rozetka",
      sourceType: "seller_question",
      externalId: "chat-item-93001",
      chatId: "93001",
      orderId: "",
      externalOrderId: "",
      buyerName: "Покупець Rozetka",
      buyerContact: "",
      subject: "Запитання продавцю",
      message: "Чи підходить цей товар для комплектації з іншим набором?",
      status: "waiting_customer",
      priority: "normal",
      createdAt: "2026-05-27 11:05",
      updatedAt: "2026-05-27 11:05",
      manager: "Марія Шевчук",
      answer: "Підходить, але потрібно перевірити модель товару.",
      answeredAt: "2026-05-27 11:20",
      apiStatus: "відповідь зафіксована в CRM",
      raw: {}
    },
    {
      id: "mq-003",
      marketplace: "Rozetka",
      sourceType: "return_request",
      externalId: "call-264",
      requestId: "264",
      orderId: "mpo-001",
      externalOrderId: "RZ-20260523-101",
      buyerName: "Олександр Клименко",
      buyerContact: "+380501119900",
      subject: "Заявка на повернення",
      message: "Покупець просить уточнити умови повернення після отримання.",
      status: "open",
      priority: "high",
      createdAt: "2026-05-27 12:10",
      updatedAt: "2026-05-27 12:10",
      manager: "Ірина Бойко",
      answer: "",
      answeredAt: "",
      apiStatus: "очікує відповіді менеджера",
      raw: {}
    }
  ],
  marketplaceServiceThreads: [
    {
      id: "msth-001",
      marketplace: "Rozetka",
      sourceType: "marketplace_thread",
      externalId: "support-12",
      requestId: "12",
      subject: "Питання по API",
      message: "ROZETKA просить уточнити дані інтеграції та перевірити доступ до листування.",
      status: "open",
      createdAt: "2026-05-27 09:40",
      updatedAt: "2026-05-27 09:40",
      manager: "Марія Шевчук",
      answer: "",
      answeredAt: "",
      apiStatus: "переписка з ROZETKA",
      raw: {}
    }
  ],
  marketplaceMessageTemplates: [
    { id: "mtpl-001", name: "Уточнення по замовленню", text: "Добрий день. Уточніть, будь ласка, деталі по замовленню {order}. Після підтвердження передамо його в роботу." },
    { id: "mtpl-002", name: "Відповідь на питання про товар", text: "Добрий день. Товар доступний. Можемо уточнити сумісність, якщо напишете модель або призначення." },
    { id: "mtpl-003", name: "Повернення", text: "Добрий день. Ми перевірили заявку на повернення по замовленню {order}. Напишіть, будь ласка, причину та фото товару/упаковки." }
  ],
  callRecordings: [],
  reportBuilder: {
    reportId: "sales",
    from: "2026-05-01",
    to: "2026-05-23",
    columns: [],
    sortBy: "date",
    sortDir: "desc",
    groupBy: ""
  },
  periodFilters: {
    salesDocs: { from: "2026-05-01", to: "2026-05-23" },
    purchaseDocs: { from: "2026-05-01", to: "2026-05-23" },
    serialDocs: { from: "2026-05-01", to: "2026-05-23" },
    warehouseDocs: { from: "2026-05-01", to: "2026-05-23" },
    b2bDocs: { from: "2026-05-01", to: "2026-05-23" },
    financeDocs: { from: "2026-05-01", to: "2026-05-23" },
    marketplaceDocs: { from: "2026-05-01", to: "2026-05-23" },
    integrationDocs: { from: "2026-05-01", to: "2026-05-23" },
    clientPortal: { from: "2026-05-01", to: "2026-05-23" },
    clientCatalogHistory: { from: "2026-05-01", to: "2026-05-23" }
  },
  smartListPreferences: {},
  marketplaceOrderFilters: {
    from: "2026-05-01",
    to: "2026-05-23",
    status: "",
    marketplace: "",
    expanded: false
  },
  marketplaceCommunicationFilters: {
    questionType: "order_question"
  },
  marketplaceFunnelManager: "",
  marketplacePublicationFilters: {
    search: "",
    expanded: false
  },
  salesClientFilters: {
    search: "",
    source: "",
    from: "",
    to: "",
    expanded: false
  },
  productTableFilters: {
    catalog: "",
    stock: "",
    publications: ""
  },
  b2bShipmentRequestFilters: {
    from: "2026-05-01",
    to: "2026-05-23",
    status: "",
    search: "",
    sortBy: "date",
    sortDir: "desc",
    expanded: false
  },
  b2bResponsibleStorageFilters: {
    from: "2026-05-01",
    to: "2026-05-23",
    clientId: "",
    productId: "",
    search: "",
    sortBy: "date",
    sortDir: "desc",
    expanded: false
  },
  rozetkaImportedOrderFilters: {
    from: "2026-05-01",
    to: "2026-05-23",
    status: "",
    sortBy: "date",
    sortDir: "desc",
    expanded: false
  },
  rozetkaInbound: {
    lastGoodsSync: "",
    lastOrdersSync: "",
    lastGoodsCount: 0,
    lastOrdersCount: 0,
    lastError: "",
    progress: {
      status: "idle",
      percent: 0,
      stage: "Очікує запуск",
      message: "Запустіть імпорт з Rozetka в блоці Обмін даними.",
      code: "",
      updatedAt: ""
    }
  },
  inventoryFilters: {
    warehouseId: "",
    firmId: ""
  },
  integrations: [
    { id: "rozetka", name: "Rozetka", status: "token_needed", lastSync: "2026-05-22 18:10", scope: "тільки завантаження: товари, публікації, замовлення" },
    { id: "prom", name: "Prom", status: "ok", lastSync: "2026-05-23 09:15", scope: "товари, замовлення, залишки, ціни" },
    { id: "epicentr", name: "Epicentr", status: "mapping_needed", lastSync: "2026-05-21 16:45", scope: "замовлення, статуси, доставка, клієнтські дані" },
    { id: "allo", name: "Allo", status: "ok", lastSync: "2026-05-23 08:40", scope: "товари, замовлення, залишки, ціни" },
    { id: "bas", name: "1C / BAS / BAF", status: "ok", lastSync: "2026-05-23 07:10", scope: "товари, клієнти, оплати, борги, залишки, відвантаження" },
    { id: "bank", name: "Банки", status: "mapping_needed", lastSync: "2026-05-22 20:00", scope: "виписки, платежі, валюта" }
  ],
  audit: [
    { at: "2026-05-23 09:15", actor: "system", action: "Prom sync: оновлено 4 залишки та 2 ціни" },
    { at: "2026-05-22 18:10", actor: "system", action: "Rozetka sync: потрібне оновлення токена" },
    { at: "2026-05-22 12:25", actor: "Марія Шевчук", action: "Накладну inv-240521-001 позначено для BAS/BAF" }
  ]
};

const ROLE_BASIC_PERMISSIONS = [
  ["canEditClosedDay", "Закритий день"],
  ["canSellWeapon", "Продаж зброї"],
  ["canChangePrices", "Зміна цін"],
  ["canExportAccounting", "BAS/BAF"],
  ["canApproveCredit", "Кредит / відтермінування"],
  ["canManageUsers", "Працівники"],
  ["canViewReports", "Звіти"],
  ["canEditSettings", "Налаштування"],
  ["canPrint", "Друк документів і звітів"]
];

const ROLE_DOCUMENT_PERMISSIONS = [
  ["salesInvoice", "Продаж / накладна"],
  ["purchase", "Прихід"],
  ["responsibleShipment", "Відповідальне зберігання"],
  ["b2bShipmentRequest", "Заявка B2B на відвантаження"],
  ["b2bSaleReport", "Звіт продажу B2B"],
  ["payment", "Оплата"],
  ["expense", "Витрата"],
  ["payable", "Кредиторка"],
  ["productCard", "Картка товару"],
  ["productEdit", "Зміна картки товару"],
  ["clientCard", "Картка клієнта"],
  ["clientEdit", "Зміна картки клієнта"],
  ["serialCorrection", "Серійний облік"],
  ["marketplacePublication", "Публікація маркетплейсу"],
  ["marketplacePublicationEdit", "Зміна публікації маркетплейсу"],
  ["marketplaceOrder", "Замовлення маркетплейсу"],
  ["marketplaceOrderEdit", "Зміна замовлення маркетплейсу"],
  ["marketplaceCommunication", "Комунікація з покупцем"],
  ["marketplaceCustomerQuestions", "Питання покупців маркетплейсу"],
  ["marketplaceServiceThreads", "Переписка з маркетплейсом"],
  ["marketplaceStatus", "Зміна статусу маркетплейсу"],
  ["warehousePicking", "Складська відбірка замовлення"],
  ["warehouseHandover", "Передача замовлення логісту"],
  ["logisticsAcceptance", "Підтвердження логістом передачі"],
  ["deliveryTracking", "Відстеження доставки / ТТН"],
  ["paymentTracking", "Відстеження оплати"],
  ["dataExchange", "Обмін даними"],
  ["settingsDocument", "Налаштування"]
];

const ROLE_POSTED_DOCUMENT_PERMISSIONS = [
  ["salesInvoice", "Проведена накладна продажу"],
  ["purchase", "Проведений прихід"],
  ["responsibleShipment", "Проведене відповідальне зберігання"],
  ["b2bSaleReport", "Проведений звіт продажу B2B"],
  ["payment", "Проведена оплата"],
  ["expense", "Проведена витрата"],
  ["payable", "Проведена кредиторка"],
  ["marketplaceOrder", "Проведене замовлення маркетплейсу"],
  ["serialCorrection", "Проведений серійний документ"]
];

const ROLE_FIELD_PERMISSIONS = [
  ["productRequisites", "Реквізити товару"],
  ["clientRequisites", "Реквізити клієнта"],
  ["date", "Дата документа"],
  ["client", "Клієнт"],
  ["product", "Товар / QR"],
  ["warehouse", "Склад"],
  ["logistics", "Логістика"],
  ["price", "Ціна"],
  ["discount", "Знижка"],
  ["cost", "Собівартість"],
  ["serials", "Серійні номери"],
  ["permit", "Дозвіл покупця"],
  ["payment", "Оплата / каса / банк / курс"],
  ["due", "Відтермінування"],
  ["manager", "Менеджер"],
  ["accounting", "Бухоблік BAS/BAF"],
  ["marketplace", "Маркетплейс"],
  ["marketplaceStatus", "Статус маркетплейс-замовлення"],
  ["deliveryTracking", "ТТН / статус доставки"],
  ["paymentTracking", "Статус оплати маркетплейсу"],
  ["dataExchangeScope", "Обмін: вся інформація / вибірково"]
];

const DEFAULT_PRICE_TYPES = [
  { id: "purchase", name: "Прихідна", kind: "cost", active: true, system: true },
  { id: "marketplace", name: "Маркетплейс", kind: "sale", active: true, system: true },
  { id: "promo", name: "Акційна", kind: "sale", active: true, system: true }
];

const DATA_EXCHANGE_MARKETPLACE_DATA = [
  ["products", "Товари"],
  ["publications", "Публікації"],
  ["stock", "Залишки"],
  ["prices", "Ціни"],
  ["orders", "Замовлення"],
  ["photos", "Фото"],
  ["payments", "Оплати"],
  ["logistics", "Логістика"],
  ["clients", "Покупці / клієнти"],
  ["messages", "Повідомлення / чат"],
  ["orderQuestions", "Питання про замовлення"],
  ["sellerQuestions", "Запитання продавцю"],
  ["callCenterRequests", "Звернення в Call Center"],
  ["returnRequests", "Заявки на повернення"],
  ["marketplaceThreads", "Переписка з маркетплейсом"],
  ["messageTemplates", "Шаблони повідомлень"],
  ["orderStatuses", "Статуси замовлень"],
  ["deliveryMethods", "Способи доставки"],
  ["productGroups", "Групи / категорії товарів"],
  ["reviews", "Відгуки"],
  ["bundles", "Комплекти товарів"]
];

const DATA_EXCHANGE_MARKETPLACE_CAPABILITIES = [
  {
    marketplace: "Rozetka",
    exchange: "Товари, публікації, фото, замовлення, чати з покупцями, питання про замовлення, запитання продавцю, звернення Call Center, заявки на повернення, переписка з ROZETKA, доставка, відгуки, комплекти",
    direction: "GET у CRM; відповіді в чат покупця через /messages/create за наявності API-доступу",
    note: "Rozetka API має окремий блок письмової комунікації з покупцем: /messages/counts, /messages/search і /messages/create. Звернення Call Center підтягуються окремо через /calls/search."
  },
  {
    marketplace: "Prom",
    exchange: "Товари, замовлення, клієнти, повідомлення, групи товарів, оплата, доставка, статуси, чат",
    direction: "GET/POST за токеном API",
    note: "Для CRM можна вмикати всю інформацію або тільки вибрані блоки."
  },
  {
    marketplace: "Epicentr",
    exchange: "Замовлення, клієнтські дані замовлення, статуси, доставка/ТТН, способи оплати та довідники через Swagger",
    direction: "Merchant API",
    note: "За документацією Epicentr обмін цін і залишків наразі недоступний, тому їх не позначаємо як гарантований канал."
  },
  {
    marketplace: "Allo",
    exchange: "API-інтеграція для швидкої роботи з кабінетом продавця",
    direction: "Партнерський доступ",
    note: "Публічна сторінка підтверджує наявність API, детальні методи залежать від доступу в партнерському кабінеті."
  }
];

const DATA_EXCHANGE_BAS_DATA = [
  ["products", "Номенклатура / товари"],
  ["clients", "Контрагенти / клієнти"],
  ["orders", "Замовлення маркетплейсів"],
  ["salesDocs", "Продажі / накладні"],
  ["shipments", "Відвантаження / ТТН"],
  ["payments", "Оплати"],
  ["receivables", "Дебіторка"],
  ["payables", "Кредиторка"],
  ["purchaseDocs", "Приходи"],
  ["stock", "Залишки"],
  ["stockMoves", "Складські рухи"],
  ["expenses", "Витрати"]
];

const DEMO_EMPLOYEE_LOGINS = {
  "emp-001": "admin",
  "emp-002": "lead",
  "emp-003": "manager",
  "emp-004": "sklad",
  "emp-005": "logist",
  "emp-006": "analyst"
};

let state = normalizeState(loadState());
bootstrapMarketplaceOrderAutomation();
let saleDraft = {
  clientId: "",
  priceType: "",
  lines: [{ productId: "p-200", qty: 1, serialIds: [], permitNumber: "", permitDate: "", barcode: "" }]
};
let purchaseDraft = {
  lines: []
};
let marketplacePublicationDraft = {
  lines: []
};
let b2bDraft = { shipmentProductId: "p-100", saleProductId: "p-100", saleClientId: "c-001", shipmentFirmId: "vat", saleFirmId: "vat" };
let clientPortalDraft = { productId: "", firmId: "", barcode: "", qty: 1, serialIds: [], permitNumber: "", permitDate: "" };
let paymentDraft = { source: "cash", kind: "invoice", clientId: "", invoiceId: "", firmId: "", terminalId: "", prro: "true" };
let authEmployeeId = appSessionStorage.getItem("arms-crm-auth-employee-id") || "";
let authClientId = appSessionStorage.getItem("arms-crm-auth-client-id") || "";
let authMode = appSessionStorage.getItem("arms-crm-auth-mode") || (authClientId ? "client" : authEmployeeId ? "employee" : "");
let clientPortalView = appSessionStorage.getItem("arms-crm-client-view") || "cabinet";
let clientCatalogFilters = loadClientCatalogFilters();
let sidebarCollapsed = appLocalStorage.getItem("arms-crm-sidebar-collapsed") === "true";
let subnavHideTimer = null;
let productImagesDraft = [];
let oneCAutoImportEnabled = appLocalStorage.getItem("arms-crm-onec-auto-import") === "true";
let oneCAutoImportTimer = null;
let activeCallRecorder = null;
let activeCallStream = null;
let activeCallChunks = [];
let activeCallMeta = null;

const MARKETPLACE_IMAGE_TYPES = ["image/jpeg", "image/png"];
const MARKETPLACE_IMAGE_EXTENSIONS = ".jpg,.jpeg,.png";
const MAX_PRODUCT_PHOTOS = 6;
const MAX_PRODUCT_PHOTO_BYTES = 8 * 1024 * 1024;
const PRODUCT_PHOTO_MAX_SIDE = 1280;
const PRODUCT_PHOTO_JPEG_QUALITY = 0.82;

const B2B_SHIPMENT_REQUEST_STATUSES = [
  { id: "request_new", label: "нова заявка" },
  { id: "request_review", label: "потребує виправлення" },
  { id: "request_approved", label: "підтверджено" },
  { id: "request_rejected", label: "відхилено" },
  { id: "request_cancelled", label: "скасовано клієнтом" }
];
const B2B_SHIPMENT_REQUEST_STATUS_MAP = Object.fromEntries(B2B_SHIPMENT_REQUEST_STATUSES.map((item) => [item.id, item]));
const ROZETKA_GOODS_SORT_OPTIONS = ["price_offer_id", "rz_item_id", "price", "price_old", "price_promo", "-price_offer_id", "-rz_item_id", "-price", "-price_old", "-price_promo"];
const ROZETKA_ORDER_SORT_OPTIONS = ["-id", "id", "-created", "created", "-changed", "changed", "-amount", "amount", "-status", "status", "-last_update_status", "last_update_status"];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const DECIMAL_FIELD_NAMES = new Set([
  "price",
  "cost",
  "paid",
  "amount",
  "rate",
  "discount",
  "creditLimitUAH"
]);

function slugId(value, prefix = "price") {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яіїєґ]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return slug ? `${prefix}-${slug}` : uniqueId(prefix);
}

function normalizePriceTypes(priceTypes = []) {
  const source = Array.isArray(priceTypes) && priceTypes.length ? priceTypes : seedState.settings.priceTypes;
  const normalized = source.map((item) => {
    if (typeof item === "string") {
      const name = item.trim();
      const lower = name.toLowerCase();
      const mappedId = lower.includes("роздр") ? "retail" : lower === "b2b" ? "b2b" : slugId(name, "price");
      return { id: mappedId, name, kind: "sale", active: true, system: ["retail", "b2b"].includes(mappedId) };
    }
    const name = String(item.name || item.label || "").trim();
    const id = item.id || slugId(name, "price");
    return {
      id,
      name: name || id,
      kind: item.kind === "cost" ? "cost" : "sale",
      active: item.active !== false,
      system: item.system === true || ["purchase", "retail", "b2b"].includes(id)
    };
  });
  const byKey = new Map();
  [...DEFAULT_PRICE_TYPES, ...normalized].forEach((item) => {
    const key = item.id || slugId(item.name, "price");
    const previous = byKey.get(key) || {};
    byKey.set(key, { ...previous, ...item, id: key });
  });
  return Array.from(byKey.values());
}

function activeSalePriceTypes(includeInactiveSelected = "") {
  const selected = String(includeInactiveSelected || "");
  return (state.settings.priceTypes || [])
    .filter((item) => item.kind !== "cost" && (item.active !== false || item.id === selected || item.name === selected));
}

function priceTypeById(idOrName) {
  return (state.settings.priceTypes || []).find((item) => item.id === idOrName || item.name === idOrName);
}

function priceTypeName(idOrName) {
  return priceTypeById(idOrName)?.name || idOrName || "-";
}

function marketplacePriceTypeId() {
  return activeSalePriceTypes().find((item) => item.name.toLowerCase().includes("маркет") || item.id.toLowerCase().includes("market"))?.id || "retail";
}

function priceTypeOptions(selected = "") {
  return activeSalePriceTypes(selected).map((item) => option(item.id, item.name, item.id === selected || item.name === selected)).join("");
}

function normalizeProductPrices(product, priceTypes = []) {
  const prices = { ...(product.prices || {}) };
  const baseCurrency = product.currency || "UAH";
  const basePrice = parseDecimal(product.price, 0);
  priceTypes.filter((item) => item.kind !== "cost").forEach((item) => {
    const oldValue = prices[item.id] || prices[item.name] || {};
    prices[item.id] = {
      amount: parseDecimal(oldValue.amount ?? oldValue.price ?? basePrice, basePrice),
      currency: oldValue.currency || baseCurrency
    };
  });
  return prices;
}

function productSalePrice(product, priceTypeId = "") {
  const type = priceTypeById(priceTypeId) || activeSalePriceTypes()[0] || { id: "retail", name: "Роздрібна" };
  const prices = product.prices || {};
  const entry = prices[type.id] || prices[type.name] || {};
  return {
    priceTypeId: type.id,
    priceTypeName: type.name,
    amount: parseDecimal(entry.amount ?? product.price ?? 0, 0),
    currency: entry.currency || product.currency || "UAH"
  };
}

function applyImportedProductPrice(product, amount, currency = "UAH") {
  const price = parseDecimal(amount, product.price || 0);
  if (!Number.isFinite(price) || price <= 0) return;
  product.price = price;
  product.currency = currency || product.currency || "UAH";
  product.prices = normalizeProductPrices(product, state.settings.priceTypes);
  activeSalePriceTypes().forEach((type) => {
    product.prices[type.id] = {
      ...(product.prices[type.id] || {}),
      amount: price,
      currency: product.currency
    };
  });
}

function productPriceInputs(product = {}) {
  return activeSalePriceTypes().map((item) => {
    const entry = (product.prices || {})[item.id] || {};
    const amount = entry.amount ?? product.price ?? 0;
    const currency = entry.currency || product.currency || "UAH";
    return `
      <label class="field"><span>${escapeHtml(item.name)}</span><input name="price_${escapeHtml(item.id)}" inputmode="decimal" data-field-lock="price" value="${escapeHtml(amount)}"></label>
      <label class="field"><span>Валюта ${escapeHtml(item.name)}</span><select name="currency_${escapeHtml(item.id)}" data-field-lock="price">${Object.keys(state.settings.rates).map((code) => option(code, code, code === currency)).join("")}</select></label>
    `;
  }).join("");
}

function productPriceSummary(product) {
  return activeSalePriceTypes().map((item) => {
    const entry = productSalePrice(product, item.id);
    return `<span class="pill info">${escapeHtml(item.name)}: ${formatMoney(entry.amount, entry.currency)}</span>`;
  }).join(" ") || formatMoney(product.price, product.currency);
}

function collectProductPrices(data, fallbackProduct = {}) {
  const prices = {};
  activeSalePriceTypes().forEach((item) => {
    const fallback = productSalePrice(fallbackProduct, item.id);
    prices[item.id] = {
      amount: data[`price_${item.id}`] === undefined ? fallback.amount : parseDecimal(data[`price_${item.id}`], fallback.amount),
      currency: data[`currency_${item.id}`] || fallback.currency || "UAH"
    };
  });
  return prices;
}

function normalizeVariantEntry(item, key, index = 0) {
  if (typeof item === "string") {
    return {
      id: slugId(item, key),
      name: item,
      value: item,
      parentId: "",
      active: true
    };
  }
  const name = String(item.name || item.label || item.value || "").trim();
  const value = String(item.value || name).trim();
  return {
    id: item.id || slugId(`${key}-${value || index}`, key),
    name: name || value || `${key} ${index + 1}`,
    value: value || name,
    parentId: item.parentId || "",
    active: item.active !== false
  };
}

function normalizeVariantDictionaries(settings = {}) {
  const loaded = settings.variantDictionaries || {};
  const result = {};
  VARIANT_DICTIONARY_DEFINITIONS.forEach((definition) => {
    const defaults = DEFAULT_VARIANT_DICTIONARIES[definition.key] || [];
    const legacyValues = definition.legacyKey ? (settings[definition.legacyKey] || []) : [];
    const merged = [...defaults, ...legacyValues, ...(loaded[definition.key] || [])].map((item, index) => normalizeVariantEntry(item, definition.key, index));
    const byKey = new Map();
    merged.forEach((entry) => {
      const uniqueKey = `${entry.parentId || ""}:${entry.value || entry.name}`.toLowerCase();
      byKey.set(uniqueKey, { ...(byKey.get(uniqueKey) || {}), ...entry });
    });
    result[definition.key] = Array.from(byKey.values());
  });
  return result;
}

function variantEntries(key, includeInactive = false, settings = state.settings) {
  const entries = (settings.variantDictionaries?.[key] || []).map((entry, index) => normalizeVariantEntry(entry, key, index));
  return entries
    .filter((entry) => includeInactive || entry.active !== false)
    .sort((first, second) => variantPathLabel(first, entries).localeCompare(variantPathLabel(second, entries), "uk"));
}

function variantPathLabel(entry, entries = []) {
  const source = entries.length ? entries : variantEntries("", true);
  const parent = source.find((item) => item.id === entry.parentId);
  return parent ? `${parent.name} / ${entry.name}` : entry.name;
}

function syncLegacyVariantDictionaries(settings = state.settings) {
  VARIANT_DICTIONARY_DEFINITIONS.forEach((definition) => {
    if (!definition.legacyKey) return;
    settings[definition.legacyKey] = variantEntries(definition.key, true, settings)
      .filter((entry) => entry.active !== false)
      .map((entry) => entry.value || entry.name);
  });
}

function variantOptions(key, selected = "", config = {}) {
  const entries = variantEntries(key, true);
  return entries
    .filter((entry) => config.includeInactive || entry.active !== false || entry.value === selected || entry.name === selected || entry.id === selected)
    .map((entry) => {
      const value = config.useId ? entry.id : (entry.value || entry.name);
      const label = `${entry.parentId ? "— " : ""}${variantPathLabel(entry, entries)}${entry.active === false ? " (вимкнено)" : ""}`;
      return option(value, label, selected === value || selected === entry.name || selected === entry.id);
    })
    .join("");
}

function variantLabel(key, value) {
  const entries = variantEntries(key, true);
  const entry = entries.find((item) => item.value === value || item.name === value || item.id === value);
  return entry ? variantPathLabel(entry, entries) : value || "-";
}

function defaultClientCatalogFilters() {
  return { type: "", brand: "", category: "", caliber: "", catalogTag: "", sort: "name" };
}

function loadClientCatalogFilters() {
  try {
    return { ...defaultClientCatalogFilters(), ...JSON.parse(appSessionStorage.getItem("arms-crm-client-catalog-filters") || "{}") };
  } catch (error) {
    return defaultClientCatalogFilters();
  }
}

function saveClientCatalogFilters() {
  appSessionStorage.setItem("arms-crm-client-catalog-filters", JSON.stringify(clientCatalogFilters));
}

function normalizeCatalogParameterEntry(item, key, index = 0) {
  if (typeof item === "string") {
    return {
      id: slugId(`${key}-${item}`, key),
      name: item,
      value: item,
      active: true
    };
  }
  const name = String(item.name || item.label || item.value || "").trim();
  const value = String(item.value || name).trim();
  return {
    id: item.id || slugId(`${key}-${value || index}`, key),
    name: name || value || `${key} ${index + 1}`,
    value: value || name,
    active: item.active !== false
  };
}

function normalizeCatalogParameters(settings = {}) {
  const loaded = settings.catalogParameters || {};
  const result = {};
  CATALOG_PARAMETER_DEFINITIONS.forEach((definition) => {
    const defaults = DEFAULT_CATALOG_PARAMETERS[definition.key] || [];
    const merged = [...defaults, ...(loaded[definition.key] || [])].map((item, index) => normalizeCatalogParameterEntry(item, definition.key, index));
    const byKey = new Map();
    merged.forEach((entry) => {
      const uniqueKey = String(entry.value || entry.name).trim().toLowerCase();
      byKey.set(uniqueKey, { ...(byKey.get(uniqueKey) || {}), ...entry });
    });
    result[definition.key] = Array.from(byKey.values());
  });
  return result;
}

function catalogParameterEntries(key, includeInactive = false, settings = state.settings) {
  const entries = (settings.catalogParameters?.[key] || []).map((entry, index) => normalizeCatalogParameterEntry(entry, key, index));
  return entries
    .filter((entry) => includeInactive || entry.active !== false)
    .sort((first, second) => first.name.localeCompare(second.name, "uk"));
}

function catalogParameterOptions(key, selected = "", allLabel = "Усі") {
  return [
    option("", allLabel, !selected),
    ...catalogParameterEntries(key, true)
      .filter((entry) => entry.active !== false || entry.value === selected)
      .map((entry) => option(entry.value, entry.name, entry.value === selected || entry.name === selected))
  ].join("");
}

function catalogTagOptions(selected = "") {
  return [
    option("", "Без акції / звичайний", !selected),
    ...catalogParameterEntries("catalogTags", true)
      .filter((entry) => entry.active !== false || entry.value === selected)
      .map((entry) => option(entry.value, entry.name, entry.value === selected || entry.name === selected))
  ].join("");
}

function addCatalogParameterEntry(key, name, value = "") {
  state.settings.catalogParameters = normalizeCatalogParameters(state.settings);
  state.settings.catalogParameters[key] = state.settings.catalogParameters[key] || [];
  const normalizedName = String(name || "").trim();
  const normalizedValue = String(value || normalizedName).trim();
  if (!normalizedName || !normalizedValue) return null;
  const existing = state.settings.catalogParameters[key].find((entry) => (
    String(entry.value || entry.name).trim().toLowerCase() === normalizedValue.toLowerCase()
  ));
  if (existing) {
    existing.name = normalizedName;
    existing.value = normalizedValue;
    existing.active = true;
    return existing;
  }
  const entry = normalizeCatalogParameterEntry({ id: uniqueId(key), name: normalizedName, value: normalizedValue }, key);
  state.settings.catalogParameters[key].push(entry);
  const definition = CATALOG_PARAMETER_DEFINITIONS.find((item) => item.key === key);
  if (definition?.productDictionaryKey) {
    state.settings.productDictionaries[definition.productDictionaryKey] = uniqueList([...(state.settings.productDictionaries[definition.productDictionaryKey] || []), normalizedValue]);
  }
  return entry;
}

function normalizeDecimalText(value) {
  const raw = String(value ?? "").trim().replace(/\s+/g, "").replaceAll("'", "");
  if (!raw) return "";
  const comma = raw.lastIndexOf(",");
  const dot = raw.lastIndexOf(".");
  if (comma >= 0 && dot >= 0) {
    const decimalIndex = Math.max(comma, dot);
    return `${raw.slice(0, decimalIndex).replace(/[.,]/g, "")}.${raw.slice(decimalIndex + 1)}`;
  }
  return raw.replace(",", ".");
}

function parseDecimal(value, fallback = 0) {
  const number = Number(normalizeDecimalText(value));
  return Number.isFinite(number) ? number : fallback;
}

function isDecimalFieldName(name) {
  const key = String(name || "");
  return DECIMAL_FIELD_NAMES.has(key) || /^[A-Z]{3}$/.test(key);
}

function prepareDecimalInputs(root = document) {
  $$("input", root).forEach((input) => {
    if (isDecimalFieldName(input.name)) {
      input.type = "text";
      input.inputMode = "decimal";
      input.dataset.decimal = "true";
      input.autocomplete = "off";
      input.title = "Можна вводити копійки/центи через кому або крапку";
    } else if (input.type === "number" && !input.step) {
      input.step = "1";
    }
  });
}

const FIELD_LOCKS = {
  date: ["date"],
  client: ["clientId", "clientName"],
  product: ["productId", "barcode"],
  warehouse: ["warehouseId"],
  price: ["price", "currency", "priceType"],
  discount: ["discount"],
  cost: ["cost", "costCurrency"],
  serials: ["serialIds", "serials"],
  permit: ["permitNumber", "permitDate"],
  payment: ["paid", "paymentMode", "paymentKind", "paymentSource", "clientId", "invoiceId", "firmId", "terminalId", "prro", "amount", "currency", "rate", "method", "bankRef"],
  due: ["dueDays", "paymentDays", "dueDate"],
  manager: ["manager"],
  accounting: ["accounting", "firmId"],
  marketplace: ["marketplace", "sku", "externalId"],
  marketplaceStatus: ["status"],
  deliveryTracking: ["ttn", "deliveryStatus"],
  paymentTracking: ["paymentStatus"],
  productRequisites: [],
  clientRequisites: []
};

function applyRoleFieldLocks(root = document) {
  Object.entries(FIELD_LOCKS).forEach(([fieldKey, names]) => {
    if (canEditField(fieldKey)) return;
    $$(`[data-field-lock="${fieldKey}"]`, root).forEach((element) => {
      element.disabled = true;
      element.title = "Поле заблоковане поточною роллю";
    });
    names.forEach((name) => {
      $$(`[name="${name}"]`, root).forEach((element) => {
        element.disabled = true;
        element.title = "Поле заблоковане поточною роллю";
      });
    });
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function uniqueList(values) {
  const seen = new Set();
  return values.reduce((list, value) => {
    const text = String(value ?? "").trim();
    const key = text.toLowerCase();
    if (!text || seen.has(key)) return list;
    seen.add(key);
    list.push(text);
    return list;
  }, []);
}

function loadState() {
  try {
    const raw = appLocalStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : clone(seedState);
  } catch (error) {
    console.warn("Cannot load state", error);
    return clone(seedState);
  }
}

function roleHasAdminAccess(roleItem) {
  return roleItem?.canManageUsers === true || roleItem?.name === "Адміністратор" || roleItem?.name === "РђРґРјС–РЅС–СЃС‚СЂР°С‚РѕСЂ";
}

function defaultRoleAccess(roleItem) {
  const admin = roleHasAdminAccess(roleItem);
  const warehouseLead = ["Зав склад", "Оператор складу"].includes(roleItem.name);
  const logistic = roleItem.name === "Логіст";
  const roleName = String(roleItem.name || "").toLowerCase();
  const marketplaceOperator = roleName.includes("маркетплейс") && !roleName.includes("аналітик");
  const views = Object.fromEntries(NAV.map(([id]) => {
    const allowed = admin
      || id === "dashboard"
      || (id === "reports" && roleItem.canViewReports)
      || (id === "settings" && roleItem.canEditSettings)
      || (id === "roles" && roleItem.canManageUsers)
      || (id === "finance" && (roleItem.canApproveCredit || roleItem.canViewReports))
      || (warehouseLead && ["purchases", "serials", "warehouse", "marketplaces", "reports"].includes(id))
      || (logistic && ["marketplaces", "integrations"].includes(id))
      || !["reports", "settings", "roles", "integrations"].includes(id);
    return [id, Boolean(allowed)];
  }));
  const subviews = Object.fromEntries(ROLE_SUBVIEW_PERMISSIONS.map(([key]) => {
    const [viewId, subviewId] = key.split(":");
    const viewAllowed = views[viewId] !== false;
    const salesAllowed = viewId === "sales" && (
      subviewId === "orders"
      || (subviewId === "warehouse" && (marketplaceOperator || warehouseLead || logistic))
      || (subviewId === "logistics" && (marketplaceOperator || warehouseLead || logistic))
      || (subviewId === "clients" && (marketplaceOperator || roleItem.canApproveCredit || roleItem.canViewReports))
      || (subviewId === "communication" && (marketplaceOperator || roleItem.canApproveCredit))
    );
    const financeAllowed = viewId === "finance" && (roleItem.canApproveCredit || roleItem.canViewReports);
    const settingsAllowed = viewId === "settings" && (
      (subviewId === "dataExchange" && (roleItem.canEditSettings || roleItem.canExportAccounting))
      || (subviewId !== "dataExchange" && roleItem.canEditSettings)
    );
    const allowed = admin
      || (viewAllowed && viewId === "products")
      || (viewAllowed && salesAllowed)
      || (viewAllowed && financeAllowed)
      || (viewAllowed && settingsAllowed);
    return [key, Boolean(allowed)];
  }));
  const documents = Object.fromEntries(ROLE_DOCUMENT_PERMISSIONS.map(([key]) => {
    const allowed = admin
      || ["salesInvoice", "purchase", "productCard", "productEdit", "clientCard", "clientEdit", "marketplacePublication"].includes(key)
      || (["marketplacePublicationEdit", "marketplaceOrder", "marketplaceOrderEdit", "marketplaceCommunication", "marketplaceCustomerQuestions", "marketplaceServiceThreads"].includes(key) && (marketplaceOperator || roleItem.canChangePrices || roleItem.canApproveCredit || warehouseLead || logistic))
      || (key === "marketplaceStatus" && (marketplaceOperator || roleItem.canApproveCredit || warehouseLead || logistic))
      || (key === "warehousePicking" && (marketplaceOperator || warehouseLead))
      || (key === "warehouseHandover" && (marketplaceOperator || warehouseLead || logistic))
      || (key === "logisticsAcceptance" && (marketplaceOperator || logistic))
      || (key === "deliveryTracking" && (marketplaceOperator || warehouseLead || logistic))
      || (key === "paymentTracking" && (marketplaceOperator || roleItem.canApproveCredit))
      || (key === "dataExchange" && (roleItem.canEditSettings || roleItem.canExportAccounting))
      || (warehouseLead && ["purchase", "serialCorrection", "responsibleShipment", "b2bShipmentRequest"].includes(key))
      || (["payment", "payable", "b2bSaleReport", "responsibleShipment", "b2bShipmentRequest"].includes(key) && roleItem.canApproveCredit)
      || (key === "expense" && roleItem.canViewReports)
      || (key === "serialCorrection" && roleItem.canSellWeapon)
      || (key === "settingsDocument" && roleItem.canEditSettings);
    return [key, Boolean(allowed)];
  }));
  const posted = Object.fromEntries(ROLE_POSTED_DOCUMENT_PERMISSIONS.map(([key]) => {
    const allowed = admin
      || (roleItem.canEditClosedDay && ["salesInvoice", "purchase", "payment", "expense", "payable"].includes(key));
    return [key, Boolean(allowed)];
  }));
  const fields = Object.fromEntries(ROLE_FIELD_PERMISSIONS.map(([key]) => {
    const allowed = admin
      || !["price", "discount", "cost", "accounting", "permit", "serials", "payment", "due", "marketplace", "marketplaceStatus", "warehouse", "logistics", "deliveryTracking", "paymentTracking", "dataExchangeScope"].includes(key)
      || (["price", "discount"].includes(key) && roleItem.canChangePrices)
      || (["permit", "serials"].includes(key) && roleItem.canSellWeapon)
      || (key === "accounting" && roleItem.canExportAccounting)
      || (["payment", "due"].includes(key) && roleItem.canApproveCredit)
      || (key === "marketplace" && (marketplaceOperator || roleItem.canEditSettings || roleItem.canChangePrices || logistic))
      || (["marketplaceStatus", "deliveryTracking"].includes(key) && (marketplaceOperator || warehouseLead || logistic))
      || (key === "warehouse" && (marketplaceOperator || warehouseLead || roleItem.canEditSettings))
      || (key === "logistics" && (marketplaceOperator || warehouseLead || logistic || roleItem.canEditSettings))
      || (key === "paymentTracking" && (marketplaceOperator || roleItem.canApproveCredit))
      || (key === "dataExchangeScope" && (roleItem.canEditSettings || roleItem.canExportAccounting));
    return [key, Boolean(allowed)];
  }));
  return { views, subviews, documents, posted, fields };
}

function normalizeRole(roleItem) {
  const base = {
    canEditClosedDay: false,
    canSellWeapon: false,
    canChangePrices: false,
    canExportAccounting: false,
    canApproveCredit: false,
    canManageUsers: false,
    canViewReports: false,
    canEditSettings: false,
    canPrint: false,
    ...roleItem
  };
  const defaults = defaultRoleAccess(base);
  base.access = {
    views: { ...defaults.views, ...(roleItem.access?.views || {}) },
    subviews: { ...defaults.subviews, ...(roleItem.access?.subviews || {}) },
    documents: { ...defaults.documents, ...(roleItem.access?.documents || {}) },
    posted: { ...defaults.posted, ...(roleItem.access?.posted || {}) },
    fields: { ...defaults.fields, ...(roleItem.access?.fields || {}) }
  };
  return base;
}

function defaultEmployeeLogin(employee, index) {
  const currentLogin = String(employee.login || "").trim();
  if (currentLogin && !/^emp-\d{3}$/i.test(currentLogin)) return currentLogin;
  if (DEMO_EMPLOYEE_LOGINS[employee.id]) return DEMO_EMPLOYEE_LOGINS[employee.id];
  if (index === 0 || employee.roleName === "Адміністратор" || employee.roleName === "РђРґРјС–РЅС–СЃС‚СЂР°С‚РѕСЂ") return "admin";
  return employee.id || `emp-${String(index + 1).padStart(3, "0")}`;
}

function defaultClientLogin(client, index) {
  if (client.portalLogin) return client.portalLogin;
  if (client.id === "c-001") return "tactic";
  if (client.id === "c-002") return "strilets";
  if (client.edrpou) return client.edrpou;
  if (client.email) return client.email.split("@")[0];
  return client.id || `client-${String(index + 1).padStart(3, "0")}`;
}

function normalizeExchangeRates(rates) {
  const fallback = { UAH: 40.2, USD: 1, EUR: 0.92 };
  const next = { ...fallback, ...(rates || {}) };
  const uah = Number(next.UAH || 0);
  const usd = Number(next.USD || 0);
  const eur = Number(next.EUR || 0);
  if (uah === 1 && usd > 5 && eur > 5) {
    next.UAH = usd;
    next.USD = 1;
    next.EUR = usd / eur;
  }
  Object.keys(next).forEach((currency) => {
    const value = Number(next[currency]);
    next[currency] = Number.isFinite(value) && value > 0 ? value : (fallback[currency] || 1);
  });
  return next;
}

function rateUnits(currency, rates) {
  const value = Number((rates || {})[currency]);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function convertMoneyWithRates(amount, fromCurrency = "UAH", toCurrency = "UAH", rates = {}) {
  return Number(amount || 0) / rateUnits(fromCurrency, rates) * rateUnits(toCurrency, rates);
}

function uahRateWithRates(currency, rates = {}) {
  return convertMoneyWithRates(1, currency, "UAH", rates);
}

function paymentAmountInInvoiceCurrency(payment, invoiceCurrency, rates = {}) {
  const amount = Number(payment.amount || 0);
  const customRate = Number(payment.rate || 0);
  if (payment.rateMode === "uah-per-unit" && customRate > 0) {
    return convertMoneyWithRates(amount * customRate, "UAH", invoiceCurrency, rates);
  }
  return convertMoneyWithRates(amount, payment.currency, invoiceCurrency, rates);
}

function normalizePaymentRates(next) {
  (next.payments || []).forEach((payment) => {
    const invoice = (next.invoices || []).find((item) => item.id === payment.invoiceId);
    payment.clientId = payment.clientId || invoice?.clientId || "";
    payment.firmId = payment.firmId || invoice?.firmId || "";
    payment.source = payment.source || (payment.method === "Банк" || payment.method === "Безготівка" || payment.method === "Банк API" ? "bank" : "cash");
    payment.paymentKind = payment.paymentKind || (payment.invoiceId ? "invoice" : "advance");
    payment.advance = payment.advance === true || !payment.invoiceId;
    payment.terminalId = payment.terminalId || "";
    payment.prro = payment.prro === true;
    if (payment.rateMode) return;
    const rate = Number(payment.rate || 0);
    if (payment.currency === "UAH") {
      payment.rate = 1;
      payment.rateMode = "uah-per-unit";
    } else if (rate > 0 && Math.abs(rate - 1) > 0.0001) {
      payment.rateMode = "uah-per-unit";
    } else {
      payment.rate = uahRateWithRates(payment.currency, next.settings.rates);
      payment.rateMode = "settings";
    }
  });
}

function recalculateInvoicePayments(next) {
  (next.invoices || []).forEach((invoice) => {
    const payments = (next.payments || []).filter((payment) => payment.invoiceId === invoice.id);
    if (!payments.length) return;
    const paid = payments.reduce((sum, payment) => (
      sum + paymentAmountInInvoiceCurrency(payment, invoice.currency, next.settings.rates)
    ), 0);
    invoice.paid = Math.min(Number(invoice.total || 0), paid);
    invoice.status = invoicePostStatus(invoice);
  });
}

function normalizeSalesFunnel(items = []) {
  const incoming = new Map((Array.isArray(items) ? items : []).map((item) => [item.id, item]));
  return DEFAULT_SALES_FUNNEL.map((stage) => {
    const saved = incoming.get(stage.id) || {};
    const workflowRule = SALES_FUNNEL_WORKFLOW_RULES[stage.id] || {};
    const slaHours = Number(saved.slaHours ?? stage.slaHours);
    const className = SALES_FUNNEL_CLASS_OPTIONS.some(([value]) => value === saved.className) ? saved.className : stage.className;
    return {
      ...stage,
      ...saved,
      label: String(saved.label || stage.label).trim() || stage.label,
      description: String(saved.description || SALES_FUNNEL_DESCRIPTIONS[stage.id] || stage.reminder || "").trim(),
      menuLocation: String(saved.menuLocation || workflowRule.menuLocation || "Продажі → Замовлення").trim(),
      entryCondition: String(saved.entryCondition || workflowRule.entryCondition || "").trim(),
      completionCondition: String(saved.completionCondition || workflowRule.completionCondition || "").trim(),
      switchBy: String(saved.switchBy || workflowRule.switchBy || "").trim(),
      className,
      slaHours: Number.isFinite(slaHours) && slaHours > 0 ? slaHours : stage.slaHours,
      reminder: String(saved.reminder || stage.reminder).trim() || stage.reminder,
      active: saved.active === false ? false : true
    };
  });
}

function normalizeMarketplaceOrderStatus(status = "") {
  const raw = String(status || "new_order");
  const normalized = MARKETPLACE_STATUS_ALIASES[raw] || raw;
  return MARKETPLACE_ORDER_STATUS_MAP[normalized] ? normalized : "new_order";
}

function funnelDateKey(status) {
  return {
    new_order: "created",
    in_progress: "inProgress",
    waiting_client: "waitingClient",
    confirmed_by_client: "agreed",
    upsell: "upsell",
    waiting_payment: "paymentWaiting",
    paid: "paid",
    picking: "warehouse",
    picked: "picked",
    shipped: "delivery",
    delivered: "delivered",
    completed: "completed",
    follow_up: "aftersale",
    repeat_sale: "repeat",
    cancelled: "cancelled"
  }[status] || "created";
}

function statusOrderIndex(status) {
  const normalized = normalizeMarketplaceOrderStatus(status);
  const index = DEFAULT_SALES_FUNNEL.findIndex((stage) => stage.id === normalized);
  return index === -1 ? 0 : index;
}

function statusAtLeast(status, compareTo) {
  return statusOrderIndex(status) >= statusOrderIndex(compareTo);
}

function dateToIso(dateString) {
  const date = String(dateString || today).slice(0, 10);
  return `${date}T09:00:00`;
}

function nowIso() {
  return new Date().toISOString();
}

function addHoursIso(isoString, hours) {
  const date = new Date(isoString || nowIso());
  date.setHours(date.getHours() + Number(hours || 0));
  return date.toISOString();
}

function defaultFunnelNextAction(status) {
  const stage = DEFAULT_SALES_FUNNEL.find((item) => item.id === normalizeMarketplaceOrderStatus(status)) || DEFAULT_SALES_FUNNEL[0];
  return stage.reminder;
}

function normalizeMarketplaceWorkflow(order, status, dates) {
  const existing = order.workflow || {};
  const stage = normalizeMarketplaceOrderStatus(status);
  const stageStartedAt = existing.stage === stage && existing.stageStartedAt
    ? existing.stageStartedAt
    : dateToIso(dates[funnelDateKey(stage)] || dates.created || order.date || today);
  const rule = DEFAULT_SALES_FUNNEL.find((item) => item.id === stage) || DEFAULT_SALES_FUNNEL[0];
  return {
    ...(existing || {}),
    acceptedAt: existing.acceptedAt || dateToIso(dates.created || order.date || today),
    assignedAt: existing.assignedAt || existing.acceptedAt || dateToIso(dates.created || order.date || today),
    stage,
    stageStartedAt,
    reminderAt: existing.stage === stage && existing.reminderAt ? existing.reminderAt : addHoursIso(stageStartedAt, rule.slaHours),
    lastReminderAt: existing.lastReminderAt || "",
    nextAction: existing.nextAction || defaultFunnelNextAction(stage),
    upsellOfferedAt: existing.upsellOfferedAt || "",
    aftersaleContactedAt: existing.aftersaleContactedAt || "",
    repeatSalePlannedAt: existing.repeatSalePlannedAt || ""
  };
}

function normalizeMarketplaceOrder(order) {
  const date = order.date || order.dates?.created || today;
  const qty = Number(order.qty || 1);
  const price = parseDecimal(order.price, 0);
  let status = normalizeMarketplaceOrderStatus(order.status || "new_order");
  const paymentStatus = status === "paid" || order.payment?.status === "paid" ? "paid" : order.payment?.status || "expected";
  if (paymentStatus === "paid" && !["paid", "picking", "picked", "shipped", "delivered", "completed", "follow_up", "repeat_sale", "cancelled"].includes(status)) status = "paid";

  const dates = {
    created: date,
    inProgress: "",
    waitingClient: "",
    agreed: "",
    paymentWaiting: "",
    warehouse: "",
    picked: "",
    delivery: "",
    delivered: "",
    completed: "",
    paid: "",
    upsell: "",
    aftersale: "",
    repeat: "",
    cancelled: "",
    ...(order.dates || {})
  };
  const activeFlow = status !== "cancelled";
  if (activeFlow && statusAtLeast(status, "in_progress") && !dates.inProgress) dates.inProgress = date;
  if (activeFlow && statusAtLeast(status, "waiting_client") && !dates.waitingClient) dates.waitingClient = date;
  if (activeFlow && statusAtLeast(status, "confirmed_by_client") && !dates.agreed) dates.agreed = date;
  if (activeFlow && statusAtLeast(status, "upsell") && !dates.upsell) dates.upsell = date;
  if (activeFlow && statusAtLeast(status, "waiting_payment") && !dates.paymentWaiting) dates.paymentWaiting = date;
  if (activeFlow && statusAtLeast(status, "paid") && !dates.paid) dates.paid = order.payment?.paidAt || today;
  if (activeFlow && statusAtLeast(status, "picking") && !dates.warehouse) dates.warehouse = date;
  if (activeFlow && statusAtLeast(status, "picked") && !dates.picked) dates.picked = date;
  if (activeFlow && statusAtLeast(status, "shipped") && !dates.delivery) dates.delivery = date;
  if (activeFlow && statusAtLeast(status, "delivered") && !dates.delivered) dates.delivered = date;
  if (activeFlow && statusAtLeast(status, "completed") && !dates.completed) dates.completed = date;
  if (activeFlow && statusAtLeast(status, "follow_up") && !dates.aftersale) dates.aftersale = date;
  if (status === "repeat_sale" && !dates.repeat) dates.repeat = date;
  if (status === "cancelled" && !dates.cancelled) dates.cancelled = date;

  const deliveryStatus = order.delivery?.status || (["delivered", "completed", "follow_up", "repeat_sale"].includes(status) ? "delivered" : status === "shipped" ? "sent_to_delivery" : ["picking", "picked"].includes(status) ? "sent_to_warehouse" : "new");
  const payment = {
    method: "Маркетплейс",
    amount: price * qty,
    source: `${order.marketplace || "Marketplace"}Pay`,
    apiStatus: paymentStatus === "paid" ? "Оплата підтверджена API" : "Очікує підтягування оплати",
    lastCheck: "",
    paidAt: "",
    ...(order.payment || {}),
    status: paymentStatus
  };
  return {
    ...order,
    date,
    status,
    dates,
    warehouseStatus: order.warehouseStatus || (activeFlow && statusAtLeast(status, "picking") ? "reserved" : "new"),
    buyer: {
      name: "",
      phone: "",
      email: "",
      edrpou: "",
      address: "",
      ...(order.buyer || {})
    },
    delivery: {
      service: "",
      city: "",
      warehouse: "",
      ttn: "",
      status: deliveryStatus,
      apiStatus: deliveryStatus === "delivered" ? "Вручено отримувачу" : deliveryStatus === "sent_to_delivery" ? "У дорозі" : "Очікує ТТН",
      lastCheck: "",
      ...(order.delivery || {})
    },
    payment,
    workflow: normalizeMarketplaceWorkflow(order, status, dates)
  };
}

function normalizeState(loaded) {
  const next = { ...clone(seedState), ...loaded };
  next.settings = { ...clone(seedState.settings), ...(loaded.settings || {}) };
  next.settings.rates = normalizeExchangeRates(next.settings.rates);
  next.settings.priceTypes = normalizePriceTypes(next.settings.priceTypes);
  next.settings.dataExchange = {
    ...clone(seedState.settings.dataExchange),
    ...(loaded.settings?.dataExchange || {})
  };
  next.settings.salesFunnel = normalizeSalesFunnel(loaded.settings?.salesFunnel || next.settings.salesFunnel);
  next.settings.communicators = {
    ...clone(seedState.settings.communicators),
    ...(loaded.settings?.communicators || {}),
    viber: {
      ...clone(seedState.settings.communicators.viber),
      ...(loaded.settings?.communicators?.viber || {})
    },
    callRecording: {
      ...clone(seedState.settings.communicators.callRecording),
      ...(loaded.settings?.communicators?.callRecording || {})
    }
  };
  const loadedRoles = loaded.roles && loaded.roles.length ? loaded.roles : [];
  const roles = loadedRoles.length
    ? [...loadedRoles, ...seedState.roles.filter((seedRole) => !loadedRoles.some((loadedRole) => loadedRole.name === seedRole.name))]
    : seedState.roles;
  next.roles = roles.map(normalizeRole);
  const loadedEmployees = loaded.employees && loaded.employees.length ? loaded.employees : null;
  const generatedEmployees = (loaded.managers || seedState.managers).map((name, index) => ({
      id: `emp-${String(index + 1).padStart(3, "0")}`,
      name,
    roleName: index === 0 ? "Адміністратор" : "Менеджер маркетплейсів",
      department: index === 0 ? "Адміністрація" : "Продажі",
      phone: "",
      email: "",
      active: true
    }));
  const employees = loadedEmployees
    ? [...loadedEmployees, ...seedState.employees.filter((seedEmployee) => !loadedEmployees.some((employee) => employee.id === seedEmployee.id || employee.name === seedEmployee.name))]
    : generatedEmployees;
  next.employees = employees.map((employee, index) => ({
    department: "Продажі",
    phone: "",
    email: "",
    active: true,
    ...employee,
    roleName: employee.id === "emp-004" && employee.department === "Склад" && employee.roleName === "Менеджер магазину" ? "Оператор складу" : employee.roleName,
    login: defaultEmployeeLogin(employee, index),
    password: employee.password || (index === 0 ? "admin" : "1234")
  }));
  next.currentEmployeeId = loaded.currentEmployeeId || next.employees[0]?.id || "emp-001";
  const activeEmployee = next.employees.find((employee) => employee.id === next.currentEmployeeId) || next.employees[0];
  next.currentManager = activeEmployee?.name || loaded.currentManager || "Адміністратор";
  next.currentRole = activeEmployee?.roleName || loaded.currentRole || "Адміністратор";
  next.managers = next.employees.filter((employee) => employee.active).map((employee) => employee.name);
  next.warehouses = (loaded.warehouses || seedState.warehouses).map((warehouse) => ({
    clientId: "",
    ...warehouse
  }));
  next.settings.suppliers = (loaded.settings?.suppliers && loaded.settings.suppliers.length)
    ? loaded.settings.suppliers.map((supplier) => ({ edrpou: "", phone: "", email: "", ...supplier }))
    : seedState.settings.suppliers;
  next.settings.paymentTerminals = (loaded.settings?.paymentTerminals && loaded.settings.paymentTerminals.length)
    ? loaded.settings.paymentTerminals.map((terminal) => ({ provider: "", firmId: next.settings.firms[0]?.id || "", ...terminal }))
    : seedState.settings.paymentTerminals;
  next.settings.productDictionaries = {
    ...clone(seedState.settings.productDictionaries),
    ...(loaded.settings?.productDictionaries || {})
  };
  next.settings.catalogParameters = normalizeCatalogParameters(next.settings);
  next.settings.variantDictionaries = normalizeVariantDictionaries(next.settings);
  syncLegacyVariantDictionaries(next.settings);
  next.clients = (loaded.clients || seedState.clients).map((client, index) => ({
    edrpou: "",
    phone: "",
    email: "",
    priceType: "Роздріб",
    currency: "UAH",
    taxMode: "без ПДВ",
    responsibleStorage: false,
    address: "",
    sourceType: "crm",
    sourceName: "",
    sourceText: "",
    sourceOrderId: "",
    sourceFile: "",
    counterpartyCode: "",
    externalId: "",
    oneCRef: "",
    createdFrom: "",
    createdAt: "",
    updatedAt: "",
    importedAt: "",
    sources: [],
    ...client
  })).map((client, index) => {
    const priceType = next.settings.priceTypes.find((item) => item.id === client.priceType || item.name === client.priceType);
    client.priceType = priceType?.id || next.settings.priceTypes.find((item) => item.kind !== "cost" && item.active !== false)?.id || client.priceType;
    client.portalLogin = defaultClientLogin(client, index);
    client.portalPassword = client.portalPassword || (client.id === "c-001" ? "tactic" : client.id === "c-002" ? "strilets" : "1234");
    client.sources = normalizeClientSources(client);
    client.sourceText = clientSourceLabel(client);
    return client;
  });
  next.products = (loaded.products || seedState.products).map((product) => ({
    category: product.type === "weapon" ? "Зброя" : "Аксесуари",
    unit: "шт",
    minStock: 0,
    leadTimeDays: 14,
    description: "",
    catalogTag: "",
    photos: [],
    ...product
  })).map((product) => {
    product.brand = cleanImportedSourceBrand(product.brand);
    product.prices = normalizeProductPrices(product, next.settings.priceTypes);
    const retail = product.prices.retail || Object.values(product.prices)[0] || {};
    product.price = parseDecimal(retail.amount ?? product.price, 0);
    product.currency = retail.currency || product.currency || "UAH";
    return product;
  });
  seedProductDictionaries(next);
  syncCatalogParametersFromProducts(next);
  const purchaseRows = loaded.purchases || seedState.purchases;
  next.serials = (loaded.serials || seedState.serials).map((serial) => ({
    actual: true,
    basSynced: false,
    purchaseId: "",
    ...serial,
    firmId: serial.firmId || purchaseRows.find((purchase) => purchase.id === serial.purchaseId)?.firmId || "vat"
  }));
  const invoiceRows = loaded.invoices || seedState.invoices;
  next.invoices = invoiceRows.map((invoice) => {
    const normalized = {
      lines: [],
      deliveryPayer: "",
      pendingPaid: 0,
      requestIds: [],
      ...invoice,
      posted: invoice.posted === false ? false : true,
      storageShipment: invoice.storageShipment === true
    };
    if (normalized.posted !== false && normalized.status === "draft") {
      normalized.status = Number(normalized.paid || 0) > 0 ? "partial" : "payment_expected";
    }
    if (normalized.posted === false) {
      normalized.status = "draft";
      normalized.draftKey = normalized.draftKey || invoiceDraftKey(normalized);
    }
    return normalized;
  });
  next.invoices.forEach((invoice) => {
    (invoice.lines || []).forEach((line) => {
      if (!line.serialId) return;
      const serial = next.serials.find((item) => item.id === line.serialId);
      if (serial && invoice.posted !== false && invoice.status !== "cancelled") {
        serial.status = "sold";
        serial.clientId = invoice.clientId;
        serial.permitNumber = line.permitNumber || serial.permitNumber || "";
        serial.permitDate = line.permitDate || serial.permitDate || "";
      }
    });
  });
  next.expenses = loaded.expenses || seedState.expenses;
  next.payables = loaded.payables || seedState.payables;
  next.purchases = purchaseRows;
  next.stock = normalizeStockRows(loaded.stock || seedState.stock, next);
  next.responsibleStorageDocs = loaded.responsibleStorageDocs || seedState.responsibleStorageDocs;
  next.b2bShipmentRequests = (loaded.b2bShipmentRequests || seedState.b2bShipmentRequests || []).map((request, index) => ({
    id: request.id || `req-${String(index + 1).padStart(3, "0")}`,
    date: request.date || today,
    desiredDate: request.desiredDate || "",
    clientId: request.clientId || "",
    productId: request.productId || "",
    qty: Number(request.qty || 1),
    status: request.status || "request_new",
    manager: request.manager || "",
    comment: request.comment || "",
    firmId: request.firmId || "",
    warehouseId: request.warehouseId || "",
    serialIds: Array.isArray(request.serialIds) ? request.serialIds : [],
    price: request.price || "",
    currency: request.currency || "",
    paymentDays: request.paymentDays || "",
    delivery: request.delivery || "",
    ttn: request.ttn || "",
    responsibleDocId: request.responsibleDocId || "",
    validation: Array.isArray(request.validation) ? request.validation : []
  }));
  next.salesPlans = loaded.salesPlans || seedState.salesPlans;
  next.marketplaceStats = loaded.marketplaceStats || seedState.marketplaceStats;
  next.marketplacePublications = loaded.marketplacePublications || seedState.marketplacePublications;
  next.marketplaceOrders = (loaded.marketplaceOrders || seedState.marketplaceOrders).map(normalizeMarketplaceOrder);
  next.viberMessages = Array.isArray(loaded.viberMessages) ? loaded.viberMessages : clone(seedState.viberMessages);
  next.communicationEvents = Array.isArray(loaded.communicationEvents) ? loaded.communicationEvents : clone(seedState.communicationEvents);
  next.marketplaceCustomerQuestions = Array.isArray(loaded.marketplaceCustomerQuestions) ? loaded.marketplaceCustomerQuestions : clone(seedState.marketplaceCustomerQuestions);
  next.marketplaceServiceThreads = Array.isArray(loaded.marketplaceServiceThreads) ? loaded.marketplaceServiceThreads : clone(seedState.marketplaceServiceThreads);
  next.marketplaceMessageTemplates = Array.isArray(loaded.marketplaceMessageTemplates) ? loaded.marketplaceMessageTemplates : clone(seedState.marketplaceMessageTemplates);
  next.callRecordings = Array.isArray(loaded.callRecordings) ? loaded.callRecordings : clone(seedState.callRecordings);
  next.reportBuilder = { ...clone(seedState.reportBuilder), ...(loaded.reportBuilder || {}) };
  next.periodFilters = { ...clone(seedState.periodFilters), ...(loaded.periodFilters || {}) };
  next.smartListPreferences = loaded.smartListPreferences || {};
  next.marketplaceOrderFilters = { ...clone(seedState.marketplaceOrderFilters), ...(loaded.marketplaceOrderFilters || {}) };
  next.marketplaceCommunicationFilters = { ...clone(seedState.marketplaceCommunicationFilters), ...(loaded.marketplaceCommunicationFilters || {}) };
  next.marketplaceFunnelManager = loaded.marketplaceFunnelManager || seedState.marketplaceFunnelManager || "";
  next.marketplacePublicationFilters = { ...clone(seedState.marketplacePublicationFilters), ...(loaded.marketplacePublicationFilters || {}) };
  next.salesClientFilters = { ...clone(seedState.salesClientFilters), ...(loaded.salesClientFilters || {}) };
  next.productTableFilters = { ...clone(seedState.productTableFilters), ...(loaded.productTableFilters || {}) };
  next.b2bShipmentRequestFilters = { ...clone(seedState.b2bShipmentRequestFilters), ...(loaded.b2bShipmentRequestFilters || {}) };
  next.b2bResponsibleStorageFilters = { ...clone(seedState.b2bResponsibleStorageFilters), ...(loaded.b2bResponsibleStorageFilters || {}) };
  next.rozetkaImportedOrderFilters = { ...clone(seedState.rozetkaImportedOrderFilters), ...(loaded.rozetkaImportedOrderFilters || {}) };
  next.rozetkaInbound = { ...clone(seedState.rozetkaInbound), ...(loaded.rozetkaInbound || {}) };
  next.inventoryFilters = { ...clone(seedState.inventoryFilters), ...(loaded.inventoryFilters || {}) };
  normalizePaymentRates(next);
  recalculateInvoicePayments(next);
  return next;
}

function seedProductDictionaries(next) {
  const dictionaries = next.settings.productDictionaries;
  const map = {
    categories: "category",
    units: "unit",
    brands: "brand",
    models: "model",
    calibers: "caliber",
    uktzed: "uktzed",
    supplierSkus: "supplierSku",
    internalCodes: "internalCode"
  };
  Object.entries(map).forEach(([key, productField]) => {
    dictionaries[key] = uniqueList([...(dictionaries[key] || []), ...next.products.map((product) => product[productField]).filter(Boolean)]);
  });
}

function syncCatalogParametersFromProducts(next) {
  next.settings.catalogParameters = normalizeCatalogParameters(next.settings);
  [
    ["brands", "brand"],
    ["categories", "category"],
    ["calibers", "caliber"],
    ["catalogTags", "catalogTag"]
  ].forEach(([key, productField]) => {
    const existing = next.settings.catalogParameters[key] || [];
    const values = uniqueList([
      ...existing.map((entry) => entry.value || entry.name),
      ...next.products.map((product) => product[productField]).filter(Boolean)
    ]);
    next.settings.catalogParameters[key] = values.map((value, index) => {
      const previous = existing.find((entry) => String(entry.value || entry.name).trim().toLowerCase() === String(value).trim().toLowerCase());
      return previous || normalizeCatalogParameterEntry(value, key, index);
    });
  });
}

function saveState() {
  try {
    appLocalStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Cannot save state", error);
  }
}

function byId(list, id) {
  return list.find((item) => item.id === id);
}

function productName(id) {
  const product = byId(state.products, id);
  return product ? productLabel(product) : "Невідомий товар";
}

function productLabel(product) {
  return [product?.brand, product?.model].filter(Boolean).join(" ").trim() || product?.name || product?.title || product?.id || "";
}

function clientName(id) {
  const client = byId(state.clients, id);
  return client ? client.name : "Невідомий клієнт";
}

function invoiceDebt(invoice) {
  return Math.max(Number(invoice?.total || 0) - Number(invoice?.paid || 0), 0);
}

function openPaymentInvoices() {
  return state.invoices.filter((invoice) => invoiceDebt(invoice) > 0);
}

function paymentClients(kind = "invoice") {
  if (kind === "advance") return state.clients;
  const clientIds = new Set(openPaymentInvoices().map((invoice) => invoice.clientId));
  return state.clients.filter((client) => clientIds.has(client.id));
}

function paymentSourceLabel(source) {
  if (source === "bank") return "Банк";
  if (source === "card") return "Картка";
  return "Готівкова каса";
}

function paymentMethodFromSource(source) {
  if (source === "bank") return "Банк";
  if (source === "card") return "Картка";
  return "Каса";
}

function paymentTerminalsForFirm(firmId = "") {
  const terminals = state.settings.paymentTerminals || [];
  return terminals.filter((terminal) => !firmId || terminal.firmId === firmId);
}

function terminalName(id) {
  const terminal = byId(state.settings.paymentTerminals || [], id);
  return terminal ? terminal.name : "-";
}

function resolvePaymentDraft() {
  const kind = paymentDraft.kind === "advance" ? "advance" : "invoice";
  const clients = paymentClients(kind);
  const source = ["cash", "bank", "card"].includes(paymentDraft.source) ? paymentDraft.source : "cash";
  const clientId = clients.some((client) => client.id === paymentDraft.clientId)
    ? paymentDraft.clientId
    : (clients[0]?.id || "");
  const invoices = openPaymentInvoices().filter((invoice) => !clientId || invoice.clientId === clientId);
  const invoiceId = kind === "advance" ? "" : invoices.some((invoice) => invoice.id === paymentDraft.invoiceId)
    ? paymentDraft.invoiceId
    : (invoices[0]?.id || "");
  const invoice = byId(state.invoices, invoiceId);
  const firmId = state.settings.firms.some((firm) => firm.id === paymentDraft.firmId)
    ? paymentDraft.firmId
    : (invoice?.firmId || state.settings.firms[0]?.id || "");
  const terminals = paymentTerminalsForFirm(firmId);
  const terminalId = terminals.some((terminal) => terminal.id === paymentDraft.terminalId)
    ? paymentDraft.terminalId
    : (terminals[0]?.id || "");
  const prro = paymentDraft.prro === "false" ? "false" : "true";
  return { source, kind, clientId, invoiceId, firmId, terminalId, prro };
}

function paymentInvoiceOptions(invoices, selectedId) {
  if (!invoices.length) return '<option value="">Немає накладних з боргом</option>';
  return invoices.map((invoice) => option(
    invoice.id,
    `${invoice.id} · борг ${formatMoney(invoiceDebt(invoice), invoice.currency)} · сума ${formatMoney(invoice.total, invoice.currency)}`,
    invoice.id === selectedId
  )).join("");
}

function warehouseName(id) {
  const warehouse = byId(state.warehouses, id);
  return warehouse ? warehouse.name : "Невідомий склад";
}

function firmName(id) {
  const firm = byId(state.settings.firms, id);
  return firm ? firm.name : "Невідома фірма";
}

function currentEmployee() {
  return state.employees.find((employee) => employee.id === state.currentEmployeeId) || state.employees[0];
}

function authenticatedEmployee() {
  return state.employees.find((employee) => employee.id === authEmployeeId && employee.active !== false);
}

function isAuthenticated() {
  return authMode === "employee" && Boolean(authenticatedEmployee());
}

function authenticatedClient() {
  return state.clients.find((client) => (
    client.id === authClientId
    && client.type === "B2B"
    && client.cabinetEnabled !== false
  ));
}

function isClientAuthenticated() {
  return authMode === "client" && Boolean(authenticatedClient());
}

function activateEmployeeSession(employee) {
  authEmployeeId = employee.id;
  authClientId = "";
  authMode = "employee";
  appSessionStorage.setItem("arms-crm-auth-employee-id", employee.id);
  appSessionStorage.removeItem("arms-crm-auth-client-id");
  appSessionStorage.setItem("arms-crm-auth-mode", "employee");
  state.currentEmployeeId = employee.id;
  state.currentManager = employee.name;
  state.currentRole = employee.roleName;
}

function activateClientSession(client) {
  authClientId = client.id;
  authEmployeeId = "";
  authMode = "client";
  appSessionStorage.setItem("arms-crm-auth-client-id", client.id);
  appSessionStorage.removeItem("arms-crm-auth-employee-id");
  appSessionStorage.setItem("arms-crm-auth-mode", "client");
}

function role() {
  const employee = currentEmployee();
  const roleName = employee?.roleName || state.currentRole;
  return state.roles.find((item) => item.name === roleName) || state.roles[0];
}

function isAdmin() {
  return role().canManageUsers === true || role().name === "Адміністратор";
}

function canAccessView(viewId) {
  return roleHasAdminAccess(role()) || role().access?.views?.[viewId] !== false || viewId === "dashboard";
}

function subviewPermissionKey(viewId, subviewId) {
  return `${viewId}:${subviewId}`;
}

function canAccessSubview(viewId, subviewId) {
  const key = subviewPermissionKey(viewId, subviewId);
  const managed = ROLE_SUBVIEW_PERMISSIONS.some(([permissionKey]) => permissionKey === key);
  return !managed || roleHasAdminAccess(role()) || role().access?.subviews?.[key] !== false;
}

function canCreateDocument(documentKey) {
  return roleHasAdminAccess(role()) || role().access?.documents?.[documentKey] !== false;
}

function canEditPostedDocument(documentKey) {
  return roleHasAdminAccess(role()) || role().access?.posted?.[documentKey] === true;
}

function canEditField(fieldKey) {
  return roleHasAdminAccess(role()) || role().access?.fields?.[fieldKey] !== false;
}

function canPrintDocuments() {
  if (isClientAuthenticated()) {
    const clientRole = state.roles.find((item) => item.name === "B2B клієнт");
    return clientRole?.canPrint === true;
  }
  return roleHasAdminAccess(role()) || role().canPrint === true;
}

function employeeOptions(selectedName = state.currentManager) {
  return state.employees
    .filter((employee) => employee.active)
    .map((employee) => option(employee.name, employee.name, employee.name === selectedName))
    .join("");
}

function supplierOptions(selectedId = "") {
  return [
    ...state.settings.suppliers.map((supplier) => option(supplier.id, supplier.name, supplier.id === selectedId || supplier.name === selectedId)),
    option("__new", "+ Новий постачальник")
  ].join("");
}

function supplierName(idOrName) {
  const supplier = state.settings.suppliers.find((item) => item.id === idOrName || item.name === idOrName);
  return supplier ? supplier.name : idOrName;
}

function dictionaryOptions(key, selected = "") {
  const values = uniqueList(state.settings.productDictionaries?.[key] || []);
  return [
    ...values.map((value) => option(value, value, value === selected)),
    option("__new", "+ Додати нове", selected === "__new")
  ].join("");
}

function dictionaryField(key, label, selectName, newName, config = {}) {
  const className = `field${config.wide ? " wide" : ""}`;
  const required = config.required === false ? "" : "required";
  const placeholder = config.placeholder || "заповніть, якщо обрано + Додати нове";
  return `
    <label class="${className}"><span>${escapeHtml(label)}</span><select name="${escapeHtml(selectName)}" ${required}>${dictionaryOptions(key, config.selected || "")}</select></label>
    <label class="${className}"><span>${escapeHtml(label)}: нове</span><input name="${escapeHtml(newName)}" placeholder="${escapeHtml(placeholder)}"></label>
  `;
}

function resolveDictionaryValue(key, selected, fresh, label, config = {}) {
  const value = String(selected === "__new" ? fresh : selected || "").trim();
  if (config.required !== false && !value) {
    throw new Error(`Заповніть поле "${label}".`);
  }
  if (!value) return "";
  state.settings.productDictionaries[key] = uniqueList([...(state.settings.productDictionaries[key] || []), value]);
  return value;
}

function findProductByCode(code) {
  const normalized = String(code || "").trim().toLowerCase();
  if (!normalized) return null;
  return state.products.find((product) => [product.barcode, product.qrCode, product.supplierSku, product.internalCode]
    .filter(Boolean)
    .some((value) => String(value).trim().toLowerCase() === normalized));
}

function normalizedText(value) {
  return String(value || "").trim().toLowerCase();
}

function invoiceUsesSerial(serialId, options = {}) {
  const includeDrafts = options.includeDrafts === true;
  const excludeInvoiceId = options.excludeInvoiceId || "";
  return state.invoices.some((invoice) => (
    invoice.id !== excludeInvoiceId
    && invoice.status !== "cancelled"
    && (includeDrafts || invoice.posted !== false)
    && invoice.lines.some((line) => line.serialId === serialId || (line.serialIds || []).includes(serialId))
  ));
}

function serialIsSold(serial) {
  return serial.status === "sold" || invoiceUsesSerial(serial.id);
}

function serialIsOnStock(serial) {
  return ["available", "responsible_storage"].includes(serial.status);
}

function serialMatchesProduct(serial, product) {
  if (!serial || !product) return false;
  return serial.productId === product.id;
}

function serialIsSelectable(serial) {
  return serialIsOnStock(serial) && !serialIsSold(serial) && serial.actual !== false && serial.erzStatus === "verified";
}

function serialMatchesStockContext(serial, { warehouseId = "", firmId = "", clientId = "" } = {}) {
  if (warehouseId && serial.warehouseId !== warehouseId) return false;
  if (firmId && (serial.firmId || "vat") !== firmId) return false;
  return (serial.clientId || "") === (clientId || "");
}

function serialStatusText(serial) {
  if (serialIsSold(serial)) return "продано";
  if (serial.actual === false) return "неактуальна";
  if (!serialIsOnStock(serial)) return serial.status || "не на складі";
  if (serial.erzStatus !== "verified") return "ЄРЗ очікує";
  return serial.status === "responsible_storage" ? "відп. зберігання" : "на складі";
}

function serialsForProduct(product) {
  return state.serials
    .filter((serial) => serialMatchesProduct(serial, product))
    .sort((first, second) => Number(serialIsSelectable(second)) - Number(serialIsSelectable(first)) || first.serial.localeCompare(second.serial, "uk"));
}

function serialOption(serial, selectedIds = [], context = {}) {
  const isSelectable = serialIsSelectable(serial) && serialMatchesStockContext(serial, context);
  const isSold = serialIsSold(serial);
  const linkedProduct = byId(state.products, serial.productId);
  const label = `${serial.serial} · ${linkedProduct?.model || "модель"} · ${warehouseName(serial.warehouseId)} · ${firmName(serial.firmId || "vat")} · ${serialStatusText(serial)}`;
  const className = isSelectable ? "serial-available" : isSold ? "serial-sold" : "serial-blocked";
  return `<option value="${escapeHtml(serial.id)}" ${selectedIds.includes(serial.id) ? "selected" : ""} ${isSelectable ? "" : "disabled"} class="${className}">${escapeHtml(label)}</option>`;
}

function validateScannedCode(code, product) {
  const normalized = String(code || "").trim();
  if (!normalized) return "QR або штрихкод обов'язковий.";
  if (!product.barcode && !product.qrCode) return "У картці товару немає QR/штрихкоду. Створіть його в товарі або внесіть у приході.";
  const allowed = [product.barcode, product.qrCode].filter(Boolean).map((value) => String(value).trim().toLowerCase());
  if (!allowed.includes(normalized.toLowerCase())) {
    return `QR/штрихкод не відповідає вибраній позиції ${product.brand} ${product.model}.`;
  }
  return "";
}

function generateEan13(prefix = "482") {
  const base = `${prefix}${String(Date.now()).slice(-8)}${Math.floor(Math.random() * 10)}`.slice(0, 12);
  const sum = base.split("").reduce((total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 1 : 3), 0);
  const checksum = (10 - (sum % 10)) % 10;
  return `${base}${checksum}`;
}

function fileToMarketplacePhoto(file) {
  if (!MARKETPLACE_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`Фото "${file.name}" має бути JPG/JPEG або PNG.`);
  }
  if (file.size > MAX_PRODUCT_PHOTO_BYTES) {
    throw new Error(`Фото "${file.name}" більше 8 МБ. Оберіть менший файл.`);
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      const scale = Math.min(1, PRODUCT_PHOTO_MAX_SIDE / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      context.fillStyle = "#fff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve({
        id: uniqueId("photo"),
        name: file.name,
        type: "image/jpeg",
        format: "JPG",
        originalType: file.type,
        originalSize: file.size,
        width,
        height,
        dataUrl: canvas.toDataURL("image/jpeg", PRODUCT_PHOTO_JPEG_QUALITY)
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Не вдалося прочитати фото "${file.name}".`));
    };
    image.src = url;
  });
}

async function handleProductPhotos(input) {
  const files = Array.from(input.files || []);
  if (!files.length) return;
  if (productImagesDraft.length + files.length > MAX_PRODUCT_PHOTOS) {
    input.value = "";
    alert(`Можна додати максимум ${MAX_PRODUCT_PHOTOS} фото до одного товару.`);
    return;
  }
  try {
    const photos = [];
    for (const file of files) {
      photos.push(await fileToMarketplacePhoto(file));
    }
    productImagesDraft = [...productImagesDraft, ...photos].slice(0, MAX_PRODUCT_PHOTOS);
    renderProductPhotoPreview(input.closest("form") || document);
  } catch (error) {
    alert(error.message);
  } finally {
    input.value = "";
  }
}

function renderProductPhotoPreview(root = document) {
  const preview = $("[data-product-photo-preview]", root) || $("#product-photo-preview");
  if (!preview) return;
  if (!productImagesDraft.length) {
    preview.innerHTML = '<div class="photo-empty">Фото ще не додані. Дозволено до 6 файлів JPG/JPEG або PNG.</div>';
    return;
  }
  preview.innerHTML = productImagesDraft.map((photo, index) => `
    <figure class="photo-thumb">
      <img src="${escapeHtml(photo.dataUrl)}" alt="${escapeHtml(photo.name)}">
      <figcaption>
        <strong>${index + 1}. ${escapeHtml(photo.name)}</strong>
        <span>${photo.format} · ${photo.width}×${photo.height}</span>
      </figcaption>
      <button class="icon-button danger photo-remove" type="button" data-remove-product-photo="${escapeHtml(photo.id)}" title="Видалити фото" aria-label="Видалити фото" ${canEditField("productRequisites") ? "" : "disabled"}>×</button>
    </figure>
  `).join("");
  }

  function rozetkaImageUrl(url) {
    const value = String(url || "").trim();
    if (!value || value.includes("no-image")) return "";
    return `/api/rozetka/image?url=${encodeURIComponent(value)}`;
  }

  function productPhotoSrc(photo) {
    if (!photo) return "";
    if (typeof photo === "string") return rozetkaImageUrl(photo);
    if (photo.dataUrl) return photo.dataUrl;
    if (photo.url) return rozetkaImageUrl(photo.url);
    return "";
  }

  function productPhotoName(photo, fallback = "Фото товару") {
    if (!photo || typeof photo === "string") return fallback;
    return photo.name || fallback;
  }

  function productPhotoThumbs(product) {
    const photos = (product.photos || []).filter((photo) => productPhotoSrc(photo));
    if (!photos.length) return '<span class="small muted">немає</span>';
    return `
      <div class="product-photo-stack">
        ${photos.slice(0, 3).map((photo) => `<img src="${escapeHtml(productPhotoSrc(photo))}" alt="${escapeHtml(productPhotoName(photo, product.model))}" loading="lazy">`).join("")}
        ${photos.length > 3 ? `<span class="photo-count">+${photos.length - 3}</span>` : ""}
      </div>
    `;
  }

  function productCatalogPhoto(product) {
    const photos = (product.photos || []).filter((photo) => productPhotoSrc(photo));
  if (photos.length) {
      return `
        <div class="catalog-photo">
          <img src="${escapeHtml(productPhotoSrc(photos[0]))}" alt="${escapeHtml(productPhotoName(photos[0], product.model))}" loading="lazy">
        </div>
        ${photos.length > 1 ? `
          <div class="catalog-photo-strip">
            ${photos.slice(1, 6).map((photo) => `<img src="${escapeHtml(productPhotoSrc(photo))}" alt="${escapeHtml(productPhotoName(photo, product.model))}" loading="lazy">`).join("")}
          </div>
        ` : ""}
      `;
  }
  const initials = `${String(product.brand || "AC").slice(0, 1)}${String(product.model || "CRM").slice(0, 1)}`.toUpperCase();
  return `<div class="catalog-photo catalog-photo-placeholder"><span>${escapeHtml(initials)}</span></div>`;
}

function productCatalogSpecs(product) {
  const rows = [
    ["Тип", product.type === "weapon" ? "Зброя" : "Звичайний товар"],
    ["Бренд", product.brand],
    ["Модель", product.model],
    ["Категорія", product.category],
    ["Одиниця", product.unit],
    ["Калібр", product.caliber],
    ["ЄРЗ", product.erzRequired ? "потрібна перевірка" : "не потрібна"],
    ["QR / штрихкод", product.barcode || product.qrCode],
    ["Артикул постач.", product.supplierSku],
    ["Внутр. код", product.internalCode],
    ["УКТЗЕД", product.uktzed],
    ["Каталог", product.catalogTag],
    ["SKU маркетплейсу", product.marketplaceSku]
  ];
  return rows
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim())
    .map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`)
    .join("");
}

function b2bCatalogPrice(product, client) {
  return productSalePrice(product, client.priceType);
}

function b2bCatalogPriceUah(product, client) {
  const price = b2bCatalogPrice(product, client);
  return uah(price.amount, price.currency);
}

function filterB2BCatalogProducts(products, client) {
  const filters = { ...defaultClientCatalogFilters(), ...clientCatalogFilters };
  const filtered = products.filter((product) => (
    (!filters.type || product.type === filters.type)
    && (!filters.brand || product.brand === filters.brand)
    && (!filters.category || product.category === filters.category)
    && (!filters.caliber || (product.caliber || "без калібру") === filters.caliber)
    && (!filters.catalogTag || product.catalogTag === filters.catalogTag)
  ));
  return filtered.sort((first, second) => {
    if (filters.sort === "price_asc" || filters.sort === "price_desc") {
      const priceDelta = b2bCatalogPriceUah(first, client) - b2bCatalogPriceUah(second, client);
      return filters.sort === "price_desc" ? -priceDelta : priceDelta;
    }
    return `${first.brand} ${first.model}`.localeCompare(`${second.brand} ${second.model}`, "uk");
  });
}

function renderB2BCatalogFilters(allProducts, products) {
  const filters = { ...defaultClientCatalogFilters(), ...clientCatalogFilters };
  return `
    <form class="catalog-filter-bar no-print" data-client-catalog-filters>
      <label class="field"><span>Тип</span><select name="type" data-client-catalog-filter>${catalogParameterOptions("productTypes", filters.type, "Усі типи")}</select></label>
      <label class="field"><span>Бренд</span><select name="brand" data-client-catalog-filter>${catalogParameterOptions("brands", filters.brand, "Усі бренди")}</select></label>
      <label class="field"><span>Категорія</span><select name="category" data-client-catalog-filter>${catalogParameterOptions("categories", filters.category, "Усі категорії")}</select></label>
      <label class="field"><span>Калібр</span><select name="caliber" data-client-catalog-filter>${catalogParameterOptions("calibers", filters.caliber, "Усі калібри")}</select></label>
      <label class="field"><span>Акція / розпродаж</span><select name="catalogTag" data-client-catalog-filter>${catalogParameterOptions("catalogTags", filters.catalogTag, "Усі позиції")}</select></label>
      <label class="field"><span>Сортування</span><select name="sort" data-client-catalog-filter>
        ${option("name", "За назвою", filters.sort === "name")}
        ${option("price_asc", "Від найдешевших", filters.sort === "price_asc")}
        ${option("price_desc", "Від найдорожчих", filters.sort === "price_desc")}
      </select></label>
      <button class="ghost" type="button" data-reset-client-catalog-filters>Скинути відбір</button>
      <span class="pill info">${products.length} із ${allProducts.length} позицій</span>
    </form>
  `;
}

function b2bShipmentRequestPrice(request, client) {
  const product = byId(state.products, request.productId);
  const fallback = product ? productSalePrice(product, client.priceType) : { amount: 0, currency: client.currency || "UAH" };
  const hasManagerPrice = request.price !== "" && request.price !== undefined && request.price !== null;
  return {
    amount: hasManagerPrice ? parseDecimal(request.price, fallback.amount) : fallback.amount,
    currency: request.currency || fallback.currency || client.currency || "UAH"
  };
}

function b2bShipmentRequestLineTotal(request, client) {
  const price = b2bShipmentRequestPrice(request, client);
  return {
    amount: Math.round(Number(request.qty || 0) * price.amount * 100) / 100,
    currency: price.currency
  };
}

function b2bShipmentRequestTotals(requests, client) {
  const totals = new Map();
  requests
    .filter((request) => !["request_rejected", "request_cancelled"].includes(request.status))
    .forEach((request) => {
      const total = b2bShipmentRequestLineTotal(request, client);
      totals.set(total.currency, Math.round(((totals.get(total.currency) || 0) + total.amount) * 100) / 100);
    });
  return totals;
}

function formatCurrencyTotals(totals, fallbackCurrency = "UAH") {
  const entries = Array.from(totals.entries()).filter(([, amount]) => Number(amount || 0) !== 0);
  if (!entries.length) return formatMoney(0, fallbackCurrency);
  return entries.map(([currency, amount]) => formatMoney(amount, currency)).join(" + ");
}

function canManageB2BClientRequest(request) {
  if (!request || ["request_approved", "request_rejected", "request_cancelled"].includes(request.status)) return false;
  if (isClientAuthenticated()) return request.clientId === authClientId && request.status === "request_draft";
  return canCreateDocument("b2bShipmentRequest");
}

function renderB2BRequestCatalogCard(product, client) {
  const price = productSalePrice(product, client.priceType);
  const openRequest = findOpenB2BShipmentRequest(client.id, product.id, today, ["request_draft"]);
  const openQty = openRequest ? Number(openRequest.qty || 0) : 0;
  return `
    <article class="catalog-card">
      <div class="catalog-media">
        ${productCatalogPhoto(product)}
        <div class="catalog-badges">
          <span class="pill ${product.type === "weapon" ? "danger" : "good"}">${product.type === "weapon" ? "зброя" : "товар"}</span>
          ${product.erzRequired ? '<span class="pill info">ЄРЗ</span>' : ""}
          ${product.catalogTag ? `<span class="pill warn">${escapeHtml(product.catalogTag)}</span>` : ""}
          ${product.photos?.length ? `<span class="pill good">${product.photos.length} фото</span>` : '<span class="pill warn">фото немає</span>'}
        </div>
      </div>
      <div class="catalog-card-body">
        <div class="catalog-title">
          <h3>${escapeHtml(product.brand)} ${escapeHtml(product.model)}</h3>
          <strong>${formatMoney(price.amount, price.currency)}</strong>
          <span>${escapeHtml(price.priceTypeName || priceTypeName(client.priceType))}</span>
        </div>
        <p class="catalog-description">${escapeHtml(product.description || product.category || "Опис ще не заповнений у картці товару.")}</p>
        <dl class="catalog-specs">${productCatalogSpecs(product)}</dl>
        <form class="catalog-request-form" data-action="create-b2b-shipment-request">
          <input type="hidden" name="clientId" value="${escapeHtml(client.id)}">
          <input type="hidden" name="manager" value="${escapeHtml(client.manager || "")}">
          <input type="hidden" name="date" value="${today}">
          <input type="hidden" name="productId" value="${escapeHtml(product.id)}">
          <label class="field"><span>Кількість</span><input name="qty" type="number" min="1" value="1"></label>
          <label class="field"><span>Бажана дата</span><input name="desiredDate" type="date" value="${today}"></label>
          ${openQty ? `<div class="catalog-open-request"><span class="pill warn">у кошику ${openQty} од.</span></div>` : ""}
          <label class="field catalog-comment"><span>Коментар</span><input name="comment" placeholder="побажання по доставці або умовах"></label>
          <button class="primary" type="submit">${openQty ? "Додати в кошик" : "У кошик"}</button>
        </form>
      </div>
    </article>
  `;
}

function renderClientB2BRequestRows(requests, client, config = {}) {
  const showActions = config.showActions === true;
  const emptyText = config.emptyText || "Заявок за вибраний період немає.";
  const colspan = showActions ? 10 : 9;
  return requests.map((request) => {
    const price = b2bShipmentRequestPrice(request, client);
    const lineTotal = b2bShipmentRequestLineTotal(request, client);
    const canEditRequest = showActions && canManageB2BClientRequest(request);
    return `
      <tr data-client-request-row="${escapeHtml(request.id)}">
        <td><strong>${escapeHtml(request.batchId || request.id)}</strong>${request.batchId ? `<br><span class="small muted">${escapeHtml(request.id)}</span>` : ""}</td>
        <td>${request.date}</td>
        <td>${productName(request.productId)}</td>
        <td>
          ${showActions
            ? `<input class="compact-input" data-client-request-qty="${escapeHtml(request.id)}" data-client-id="${escapeHtml(client.id)}" type="number" min="0" step="1" inputmode="numeric" value="${escapeHtml(request.qty)}" ${canEditRequest ? "" : "disabled"}>`
            : escapeHtml(request.qty)}
        </td>
        <td>${formatMoney(price.amount, price.currency)}</td>
        <td><strong data-client-request-line-total="${escapeHtml(request.id)}">${formatMoney(lineTotal.amount, lineTotal.currency)}</strong></td>
        <td>${request.desiredDate || "-"}</td>
        <td>${statusPill(request.status)}</td>
        <td>${escapeHtml(request.comment || "-")}</td>
        ${showActions ? `
          <td class="row-actions">
            <button class="danger" type="button" data-cancel-client-request="${escapeHtml(request.id)}" ${canEditRequest ? "" : "disabled"}>Відмінити</button>
          </td>
        ` : ""}
      </tr>
    `;
  }).join("") || `<tr><td colspan="${colspan}" class="muted">${escapeHtml(emptyText)}</td></tr>`;
}

function b2bRequestGroupId(request) {
  return request.batchId || request.id;
}

function b2bRequestStatusSummary(requests) {
  const statuses = uniqueList(requests.map((request) => request.status));
  return statuses.map((status) => statusPill(status)).join(" ");
}

function groupB2BClientRequests(requests, client) {
  const groups = new Map();
  requests.forEach((request) => {
    const groupId = b2bRequestGroupId(request);
    if (!groups.has(groupId)) {
      groups.set(groupId, {
        id: groupId,
        date: request.date,
        submittedAt: request.submittedAt || "",
        clientId: request.clientId,
        requests: []
      });
    }
    const group = groups.get(groupId);
    group.requests.push(request);
    if ((request.submittedAt || "") > (group.submittedAt || "")) group.submittedAt = request.submittedAt;
    if ((request.date || "") > (group.date || "")) group.date = request.date;
  });
  return Array.from(groups.values()).map((group) => {
    const totals = b2bShipmentRequestTotals(group.requests, client);
    const qty = group.requests.reduce((sum, request) => sum + Number(request.qty || 0), 0);
    return {
      ...group,
      qty,
      totals,
      positions: group.requests.length
    };
  }).sort((first, second) => (
    String(second.submittedAt || second.date).localeCompare(String(first.submittedAt || first.date), "uk")
  ));
}

function renderB2BClientRequestHistoryRows(groups, client) {
  return groups.map((group) => `
    <tr class="clickable-row" data-open-client-request-batch="${escapeHtml(group.id)}" data-client-id="${escapeHtml(client.id)}" title="Відкрити заявку для перегляду">
      <td><strong>${escapeHtml(group.id)}</strong><br><span class="small muted">${group.positions} поз.</span></td>
      <td>${escapeHtml(group.date || "-")}<br><span class="small muted">${escapeHtml(group.submittedAt || "час не зафіксовано")}</span></td>
      <td><strong>${group.qty}</strong></td>
      <td><strong>${formatCurrencyTotals(group.totals, client.currency || "UAH")}</strong></td>
      <td>${b2bRequestStatusSummary(group.requests)}</td>
    </tr>
  `).join("") || '<tr><td colspan="5" class="muted">За вибраний період підтверджених заявок немає.</td></tr>';
}

function renderB2BRequestCatalog(client, draftRequests, historyRequests, historyPeriod) {
  const allProducts = [...state.products];
  const products = filterB2BCatalogProducts(allProducts, client);
  const requestTotals = b2bShipmentRequestTotals(draftRequests, client);
  const hasDrafts = draftRequests.some((request) => Number(request.qty || 0) > 0 && request.status === "request_draft");
  const cartQty = draftRequests.reduce((sum, request) => sum + Number(request.qty || 0), 0);
  const historyGroups = groupB2BClientRequests(historyRequests, client);
  return `
    <button class="floating-cart-summary no-print" type="button" data-scroll-to-client-cart data-client-id="${escapeHtml(client.id)}">
      <span>Кошик</span>
      <strong data-floating-cart-qty="${escapeHtml(client.id)}">${cartQty} од.</strong>
      <em data-floating-cart-total="${escapeHtml(client.id)}">${formatCurrencyTotals(requestTotals, client.currency || "UAH")}</em>
    </button>
    <section class="panel section-band">
      <div class="split">
        <div>
          <h2>Прайс-каталог для заявки на відвантаження</h2>
          <p class="small muted">Прайс клієнта: ${escapeHtml(priceTypeName(client.priceType))}. Залишки, склади та серійні номери в цьому каталозі не показуються.</p>
        </div>
        <span class="pill info">${products.length} позицій</span>
      </div>
      ${renderB2BCatalogFilters(allProducts, products)}
      <div class="b2b-catalog-grid">
        ${products.map((product) => renderB2BRequestCatalogCard(product, client)).join("") || '<p class="notice warn">За вибраними параметрами товарів немає. Змініть відбір або скиньте фільтри.</p>'}
      </div>
      <h2 class="section-title" id="client-request-cart">Кошик</h2>
      <div class="table-wrap b2b-request-history">
        <table>
          <thead><tr><th>Позиція</th><th>Дата</th><th>Товар</th><th>К-сть</th><th>Ціна од.</th><th>Сума</th><th>Бажана дата</th><th>Статус</th><th>Коментар</th><th>Дії</th></tr></thead>
          <tbody>
            ${renderClientB2BRequestRows(draftRequests, client, { showActions: true, emptyText: "Кошик порожній. Натисніть “У кошик” біля потрібної позиції каталогу." })}
          </tbody>
        </table>
      </div>
      <div class="catalog-request-total">
        <span>Загальна сума кошика</span>
        <strong data-client-request-total="${escapeHtml(client.id)}">${formatCurrencyTotals(requestTotals, client.currency || "UAH")}</strong>
        <button class="primary" type="button" data-confirm-client-requests="${escapeHtml(client.id)}" ${hasDrafts ? "" : "disabled"}>Підтвердити заявку</button>
      </div>
      <p class="notice small">Після підтвердження кошик очиститься, а заявка потрапить менеджеру в основний B2B кабінет для перевірки наявності, умов відвантаження, серійних номерів і фінального проведення.</p>
    </section>

    <section class="panel section-band" data-print-area="clientCatalogHistory" data-print-title="Історія заявок B2B · ${escapeHtml(client.name)}">
      <h2>Історія заявок</h2>
      ${renderPeriodPrintControls("clientCatalogHistory", "Історія заявок", historyPeriod, historyGroups.length)}
      <div class="table-wrap b2b-request-history">
        <table>
          <thead><tr><th>Заявка</th><th>Дата</th><th>Кількість</th><th>Сума заявки</th><th>Статус</th></tr></thead>
          <tbody>
            ${renderB2BClientRequestHistoryRows(historyGroups, client)}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  `;
}

function selectedValues(select) {
  return select ? Array.from(select.selectedOptions).map((optionNode) => optionNode.value).filter(Boolean) : [];
}

function resolveSupplier(raw) {
  if (raw.supplierId === "__new") {
    const name = String(raw.newSupplier || "").trim();
    if (!name) throw new Error("Вкажіть назву нового постачальника.");
    let supplier = state.settings.suppliers.find((item) => item.name.toLowerCase() === name.toLowerCase());
    if (!supplier) {
      supplier = { id: uniqueId("sup"), name, edrpou: "", phone: "", email: "" };
      state.settings.suppliers.push(supplier);
    }
    return supplier.name;
  }
  if (raw.supplierId) return supplierName(raw.supplierId);
  const name = String(raw.supplier || "").trim();
  if (!name) throw new Error("Вкажіть постачальника.");
  if (!state.settings.suppliers.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
    state.settings.suppliers.push({ id: uniqueId("sup"), name, edrpou: "", phone: "", email: "" });
  }
  return name;
}

function isLocked(date, locked) {
  return locked || (!role().canEditClosedDay && date <= state.settings.closedDay);
}

function documentEditLocked(documentKey, document = {}) {
  return isLocked(document.date || document.dueDate || today, document.locked) && !canEditPostedDocument(documentKey);
}

function invoicePostedPermissionKey(invoice = {}) {
  return invoice.responsibleStorage ? "b2bSaleReport" : "salesInvoice";
}

function formatMoney(amount, currency = "UAH") {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(amount || 0));
}

function uah(amount, currency) {
  return convertMoneyWithRates(amount, currency, "UAH", state.settings.rates);
}

function convertMoney(amount, fromCurrency = "UAH", toCurrency = "UAH") {
  return convertMoneyWithRates(amount, fromCurrency, toCurrency, state.settings.rates);
}

function uahRate(currency) {
  return uahRateWithRates(currency, state.settings.rates);
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
}

function periodFilter(key, fallbackFrom = "2026-05-01", fallbackTo = today) {
  const period = state.periodFilters?.[key] || {};
  return {
    from: period.from || fallbackFrom,
    to: period.to || fallbackTo
  };
}

function dateInPeriod(date, period) {
  if (!date) return true;
  return String(date) >= period.from && String(date) <= period.to;
}

function dateInOptionalPeriod(date, period) {
  if (!date) return true;
  const value = String(date);
  return (!period.from || value >= period.from) && (!period.to || value <= period.to);
}

function dateInSingleAwarePeriod(date, period) {
  if (!date) return true;
  const value = String(date).slice(0, 10);
  if (period.from && !period.to) return value === period.from;
  if (!period.from && period.to) return value === period.to;
  return (!period.from || value >= period.from) && (!period.to || value <= period.to);
}

function marketplaceOrderFilter() {
  const filter = state.marketplaceOrderFilters || {};
  return {
    from: filter.from || "",
    to: filter.to || "",
    status: filter.status || "",
    marketplace: filter.marketplace || "",
    expanded: Boolean(filter.expanded)
  };
}

function marketplaceCommunicationFilter() {
  const filter = state.marketplaceCommunicationFilters || {};
  return {
    questionType: filter.questionType || "order_question"
  };
}

function salesClientFilter() {
  const filter = state.salesClientFilters || {};
  return {
    search: filter.search || "",
    source: filter.source || "",
    from: filter.from || "",
    to: filter.to || "",
    expanded: Boolean(filter.expanded)
  };
}

function periodLabel(period) {
  return `${period.from} — ${period.to}`;
}

function renderPeriodPrintControls(key, title, period, resultCount = null) {
  return `
    <form class="period-toolbar no-print" data-period-filter="${escapeHtml(key)}">
      <input type="hidden" name="key" value="${escapeHtml(key)}">
      <label class="field compact"><span>Дата від</span><input name="from" type="date" value="${escapeHtml(period.from)}"></label>
      <label class="field compact"><span>Дата до</span><input name="to" type="date" value="${escapeHtml(period.to)}"></label>
      ${resultCount === null ? "" : `<span class="pill info">${resultCount} рядків</span>`}
      <button class="secondary" type="button" data-print-scope="${escapeHtml(key)}" ${canPrintDocuments() ? "" : "disabled"}>Друк</button>
      ${canPrintDocuments() ? "" : '<span class="notice warn small">Друк заборонено поточною роллю.</span>'}
    </form>
    <p class="small muted no-print">Період для “${escapeHtml(title)}”: ${escapeHtml(periodLabel(period))}</p>
  `;
}

function uniqueId(prefix) {
  return `${prefix}-${String(Date.now()).slice(-8)}-${Math.random().toString(36).slice(2, 6)}`;
}

function statusPill(status) {
  const map = {
    paid: ["good", "оплачено"],
    partial: ["warn", "частково"],
    overdue: ["danger", "прострочено"],
    draft: ["info", "чернетка"],
    cancelled: ["danger", "скасовано"],
    published: ["good", "опубліковано"],
    needs_sync: ["warn", "потрібен обмін"],
    hidden: ["info", "приховано"],
    moderation: ["warn", "модерація"],
    new_order: ["marketplace-new", "Нове замовлення"],
    in_progress: ["marketplace-progress", "В роботі"],
    waiting_client: ["marketplace-waiting", "Очікує підтвердження клієнта"],
    confirmed_by_client: ["marketplace-confirmed", "Підтверджено клієнтом"],
    upsell: ["marketplace-upsell", "Апсел / крос-сел"],
    waiting_payment: ["marketplace-payment-waiting", "Очікує оплату"],
    picking: ["marketplace-warehouse", "На комплектації"],
    picked: ["marketplace-picked", "Зібрано"],
    shipped: ["marketplace-delivery", "Відправлено"],
    delivered: ["marketplace-delivered", "Доставлено"],
    completed: ["marketplace-completed", "Завершено"],
    follow_up: ["marketplace-aftersale", "Follow-up"],
    repeat_sale: ["marketplace-repeat", "Повторний продаж"],
    agreed: ["marketplace-confirmed", "Підтверджено клієнтом"],
    sent_to_warehouse: ["marketplace-warehouse", "На комплектації"],
    sent_to_delivery: ["marketplace-delivery", "Відправлено"],
    aftersale: ["marketplace-aftersale", "Follow-up"],
    invoiced: ["good", "накладна"],
    payment_expected: ["marketplace-payment-waiting", "Очікує оплату"],
    request_new: ["warn", "нова заявка"],
    request_draft: ["info", "чернетка клієнта"],
    request_review: ["danger", "потребує виправлення"],
    request_approved: ["good", "підтверджено"],
    request_rejected: ["danger", "відхилено"],
    request_cancelled: ["danger", "скасовано клієнтом"],
    in_storage: ["info", "на зберіганні"],
    reported_sale: ["warn", "звіт продажу"],
    ownership_transferred: ["good", "власність перейшла"],
    available: ["good", "в наявності"],
    responsible_storage: ["info", "відп. зберігання"],
    sold: ["danger", "продано"],
    verified: ["good", "ЄРЗ перевірено"],
    pending: ["warn", "ЄРЗ очікує"],
    new: ["warn", "нове"],
    answered: ["good", "відповіли"],
    waiting_customer: ["info", "очікує клієнта"],
    waiting_marketplace: ["warn", "очікує маркетплейс"],
    archived: ["info", "архів"],
    closed: ["good", "закрито"],
    ok: ["good", "активно"],
    open: ["warn", "відкрито"],
    planned: ["info", "план"],
    token_needed: ["danger", "потрібен токен"],
    mapping_needed: ["warn", "мапінг"],
    pending_export: ["warn", "BAS очікує"],
    pending_import: ["warn", "імпорт"],
    exported: ["good", "експорт"],
    imported: ["good", "імпорт"],
    error: ["danger", "помилка"]
  };
  const [kind, label] = map[status] || ["info", status || "стан"];
  return `<span class="pill ${kind}">${label}</span>`;
}

function currentTimestamp() {
  return `${today} ${new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}`;
}

function marketplaceOrderStatusPill(status) {
  const item = salesFunnelStage(normalizeMarketplaceOrderStatus(status));
  return `<span class="pill ${item.className}">${item.label}</span>`;
}

function marketplaceOrderStatusOptions(selected = "") {
  return salesFunnelRules().map((item) => option(item.id, item.label, item.id === selected)).join("");
}

const DELIVERY_STATUS_META = {
  new: ["info", "очікує ТТН"],
  sent_to_warehouse: ["marketplace-warehouse", "на складі"],
  picked: ["marketplace-warehouse", "відбірка ОК"],
  warehouse_handover: ["warn", "передано логісту"],
  logistics_accepted: ["marketplace-delivery", "логіст прийняв"],
  sent_to_delivery: ["marketplace-delivery", "у доставці"],
  in_transit: ["marketplace-delivery", "в дорозі"],
  arrived_branch: ["warn", "у відділенні"],
  delivered: ["marketplace-delivered", "вручено"],
  delivery_problem: ["danger", "проблема доставки"]
};

const DELIVERY_STATUS_ORDER = Object.keys(DELIVERY_STATUS_META);

function marketplaceDeliveryStatusPill(status) {
  const [kind, label] = DELIVERY_STATUS_META[status] || ["info", status || "доставка"];
  return `<span class="pill ${kind}">${label}</span>`;
}

function deliveryStatusLabel(status) {
  return (DELIVERY_STATUS_META[status] && DELIVERY_STATUS_META[status][1]) || status || "доставка";
}

function deliveryStatusOptions(selected = "new") {
  return DELIVERY_STATUS_ORDER.map((status) => option(status, deliveryStatusLabel(status), selected === status)).join("");
}

function deliveryApiSettings() {
  state.settings.deliveryApi = {
    nova_poshta: {
      provider: "Нова пошта",
      enabled: false,
      mode: "test",
      apiKey: "",
      endpoint: "https://api.novaposhta.ua/v2.0/json/",
      status: "not_configured",
      lastCheck: ""
    },
    ukrposhta: {
      provider: "Укрпошта",
      enabled: false,
      mode: "test",
      apiKey: "",
      endpoint: "https://www.ukrposhta.ua/ecom/0.0.1/",
      status: "not_configured",
      lastCheck: ""
    },
    ...(state.settings.deliveryApi || {})
  };
  return state.settings.deliveryApi;
}

function deliveryProviderKey(service = "") {
  const normalized = String(service).toLowerCase();
  if (normalized.includes("укр") || normalized.includes("ukr")) return "ukrposhta";
  return "nova_poshta";
}

function deliveryProviderForOrder(order) {
  const settings = deliveryApiSettings();
  return settings[deliveryProviderKey(order?.delivery?.service || "")] || settings.nova_poshta;
}

function deliveryApiProviderPill(provider) {
  const kind = provider.enabled && provider.apiKey ? "good" : provider.enabled ? "warn" : "info";
  const label = provider.enabled && provider.apiKey ? "API готовий" : provider.enabled ? "нема ключа API" : "API вимкнено";
  return `<span class="pill ${kind}">${escapeHtml(provider.provider)}: ${label}</span>`;
}

function marketplacePaymentStatusPill(status) {
  const map = {
    expected: ["warn", "очікує"],
    pending: ["warn", "перевіряється"],
    paid: ["marketplace-paid", "оплачено"],
    failed: ["danger", "помилка"]
  };
  const [kind, label] = map[status] || ["info", status || "оплата"];
  return `<span class="pill ${kind}">${label}</span>`;
}

function canManageMarketplaceOrder() {
  return canCreateDocument("marketplaceOrder");
}

function canEditMarketplaceOrder() {
  return canCreateDocument("marketplaceOrderEdit") || canEditPostedDocument("marketplaceOrder");
}

function canEditMarketplacePublication() {
  return canCreateDocument("marketplacePublicationEdit");
}

function canContactMarketplaceBuyer() {
  return canCreateDocument("marketplaceCommunication");
}

function canChangeMarketplaceOrderStatus() {
  return canCreateDocument("marketplaceStatus") && canEditField("marketplaceStatus");
}

function canTrackMarketplaceDelivery() {
  return canCreateDocument("deliveryTracking") && canEditField("deliveryTracking");
}

function canSendMarketplaceOrderToWarehouse() {
  return canChangeMarketplaceOrderStatus() && canEditField("warehouse");
}

function canConfirmMarketplacePicking() {
  return canCreateDocument("warehousePicking") && canEditField("warehouse");
}

function canHandoverMarketplaceOrderToLogistics() {
  return canCreateDocument("warehouseHandover") && canEditField("warehouse");
}

function canAcceptMarketplaceOrderLogistics() {
  return canCreateDocument("logisticsAcceptance") && canEditField("logistics");
}

function canTrackMarketplacePayment() {
  return canCreateDocument("paymentTracking") && canEditField("paymentTracking");
}

function navCount(view) {
  if (view === "dashboard") return state.audit.length;
  if (view === "sales") return state.marketplaceOrders.filter((order) => order.status === "new_order").length || state.marketplaceOrders.length;
  if (view === "products") return state.marketplacePublications.filter((item) => item.status !== "published").length || state.products.length;
  if (view === "reports") return state.marketplaceStats.length;
  if (view === "finance") return state.marketplaceOrders.filter((order) => order.payment?.status !== "paid").length;
  if (view === "settings") return state.integrations.filter((item) => item.status !== "ok").length || "";
  return "";
}

function syncSidebarToggleButton() {
  const toggle = $("#sidebar-toggle");
  if (!toggle) return;
  toggle.setAttribute("aria-expanded", sidebarCollapsed ? "false" : "true");
  toggle.title = sidebarCollapsed ? "Розгорнути меню" : "Згорнути меню";
  toggle.setAttribute("aria-label", sidebarCollapsed ? "Розгорнути меню" : "Згорнути меню");
}

function subviewsFor(viewId) {
  return (SUBVIEWS[viewId] || []).filter(([subviewId]) => canAccessSubview(viewId, subviewId));
}

function currentSubview(viewId = state.currentView) {
  const items = subviewsFor(viewId);
  if (!items.length) return "";
  state.currentSubViews = state.currentSubViews || {};
  const current = state.currentSubViews[viewId];
  if (items.some(([id]) => id === current)) return current;
  state.currentSubViews[viewId] = items[0][0];
  return state.currentSubViews[viewId];
}

function renderSubviewSelector() {
  const items = subviewsFor(state.currentView);
  if (!items.length) return "";
  const current = currentSubview(state.currentView);
  return `
    <label class="field compact subview-field" id="subview-field">
      <span>Підпункт</span>
      <select id="subview-select" aria-label="Підпункт розділу">
        ${items.map(([id, label]) => option(id, label, id === current)).join("")}
      </select>
    </label>
  `;
}

function renderSubviewFlyout(viewId = state.currentView) {
  const items = subviewsFor(viewId);
  if (!items.length) return "";
  const navItem = NAV.find(([id]) => id === viewId);
  const current = currentSubview(viewId);
  return `
    <aside class="subnav-flyout" id="subnav-flyout" data-subnav-view="${escapeHtml(viewId)}" aria-label="Підпункти розділу">
      <div class="subnav-head">
        <span>${escapeHtml(navItem?.[2] || "")}</span>
        <strong>${escapeHtml(navItem?.[1] || "Розділ")}</strong>
      </div>
      <div class="subnav-list">
        ${items.map(([id, label]) => `
          <button class="${id === current ? "active" : ""}" type="button" data-subview-button="${escapeHtml(id)}">
            <span class="subnav-marker" aria-hidden="true"></span>
            <span>${escapeHtml(label)}</span>
          </button>
        `).join("")}
      </div>
    </aside>
  `;
}

function hideSidebarSubnav() {
  $("#subnav-flyout")?.remove();
}

function cancelSidebarSubnavHide() {
  if (subnavHideTimer) {
    clearTimeout(subnavHideTimer);
    subnavHideTimer = null;
  }
}

function scheduleSidebarSubnavHide() {
  cancelSidebarSubnavHide();
  subnavHideTimer = setTimeout(() => {
    hideSidebarSubnav();
    subnavHideTimer = null;
  }, 160);
}

function elementInsideSidebarSubnav(element) {
  return element?.closest?.(".sidebar, #subnav-flyout");
}

function handleSidebarSubnavHover(event) {
  const navButton = event.target.closest?.("#nav button[data-view]");
  if (navButton) {
    showSidebarSubnav(navButton.dataset.view);
    return;
  }
  if (event.target.closest?.("#subnav-flyout")) {
    cancelSidebarSubnavHide();
    return;
  }
  if ($("#subnav-flyout") && !elementInsideSidebarSubnav(event.target)) {
    scheduleSidebarSubnavHide();
  }
}

function handleSidebarSubnavLeave(event) {
  if (!elementInsideSidebarSubnav(event.target)) return;
  if (elementInsideSidebarSubnav(event.relatedTarget)) return;
  scheduleSidebarSubnavHide();
}

function showSidebarSubnav(viewId) {
  if (!canAccessView(viewId) || !subviewsFor(viewId).length) {
    scheduleSidebarSubnavHide();
    return;
  }
  cancelSidebarSubnavHide();
  const existing = $("#subnav-flyout");
  if (existing?.dataset.subnavView === viewId) return;
  existing?.remove();
  $(".sidebar")?.insertAdjacentHTML("afterend", renderSubviewFlyout(viewId));
}

function syncAppVersion() {
  const node = $("#app-version");
  if (!node) return;
  node.innerHTML = `
    <span>Версія</span>
    <strong>v${escapeHtml(APP_VERSION)}</strong>
    <small>${escapeHtml(APP_BUILD)}</small>
    <small>${escapeHtml(APP_BUILD_DAY)}, ${escapeHtml(APP_BUILD_DATE)}</small>
    <small>час ${escapeHtml(APP_BUILD_TIME)}</small>
  `;
}

function renderShell() {
  document.body.classList.toggle("sidebar-collapsed", sidebarCollapsed);
  syncSidebarToggleButton();
  syncAppVersion();
  $("#export-json")?.removeAttribute("hidden");
  $("#reset-demo")?.removeAttribute("hidden");
  $("#nav").innerHTML = NAV.filter(([id]) => canAccessView(id)).map(([id, label, icon]) => `
    <button data-view="${id}" class="${state.currentView === id ? "active" : ""}" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}" aria-haspopup="${subviewsFor(id).length ? "menu" : "false"}">
      <span class="nav-icon">${icon}</span>
      <span class="nav-label">${label}</span>
      <span class="nav-count">${navCount(id)}</span>
    </button>
  `).join("");

  const employee = currentEmployee();
  state.currentRole = employee?.roleName || state.currentRole;
  state.currentManager = employee?.name || state.currentManager;
  state.managers = state.employees.filter((item) => item.active).map((item) => item.name);
  $$(".toolbar .field.compact").forEach((element) => element.remove());
  if (!$("#user-badge")) {
    $(".toolbar")?.insertAdjacentHTML("afterbegin", '<div class="session-user" id="user-badge"></div><button class="secondary" id="logout-button" type="button">Змінити користувача</button>');
  }
  const badge = $("#user-badge");
  if (badge) {
    badge.innerHTML = `<strong>${escapeHtml(employee?.name || "-")}</strong><small>${escapeHtml(employee?.roleName || "-")}</small>`;
  }
  $("#subview-field")?.remove();
  $("#subnav-flyout")?.remove();

  const navItem = NAV.find(([id]) => id === state.currentView);
  $("#page-title").textContent = navItem ? navItem[1] : "CRM";
}

function renderClientShell(client) {
  document.body.classList.toggle("sidebar-collapsed", sidebarCollapsed);
  syncSidebarToggleButton();
  syncAppVersion();
  $("#export-json")?.setAttribute("hidden", "hidden");
  $("#reset-demo")?.setAttribute("hidden", "hidden");
  const clientViews = [
    ["cabinet", "Мій кабінет", "B2", clientStorageRows(client.id).reduce((sum, row) => sum + row.qty, 0)],
    ["catalog", "Каталоги / прайси / акції", "КП", state.products.length]
  ];
  if (!clientViews.some(([id]) => id === clientPortalView)) clientPortalView = "cabinet";
  $("#nav").innerHTML = clientViews.map(([id, label, icon, count]) => `
    <button data-client-view="${id}" class="${clientPortalView === id ? "active" : ""}" type="button" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">
      <span class="nav-icon">${icon}</span>
      <span class="nav-label">${label}</span>
      <span class="nav-count">${count || ""}</span>
    </button>
  `).join("");
  $$(".toolbar .field.compact").forEach((element) => element.remove());
  if (!$("#user-badge")) {
    $(".toolbar")?.insertAdjacentHTML("afterbegin", '<div class="session-user" id="user-badge"></div><button class="secondary" id="logout-button" type="button">Змінити користувача</button>');
  }
  const badge = $("#user-badge");
  if (badge) {
    badge.innerHTML = `<strong>${escapeHtml(client.name || "-")}</strong><small>B2B клієнт</small>`;
  }
  $("#page-title").textContent = clientViews.find(([id]) => id === clientPortalView)?.[1] || "B2B кабінет";
}

function option(value, label, selected = false) {
  return `<option value="${escapeHtml(value)}" ${selected ? "selected" : ""}>${escapeHtml(label)}</option>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function applySubpageVisibility(root = $("#app")) {
  if (!root) return;
  const rules = SUBVIEW_SECTION_PREFIXES[state.currentView];
  const selected = currentSubview(state.currentView);
  if (!rules || !selected) return;
  const allPrefixes = Object.values(rules).flat();
  const selectedPrefixes = rules[selected] || [];
  root.querySelectorAll(".panel, section[data-rozetka-inbound-panel]").forEach((element) => {
    const title = element.querySelector("h2")?.textContent?.trim() || "";
    if (!title) return;
    const managed = allPrefixes.some((prefix) => title.startsWith(prefix) || title.includes(prefix));
    if (!managed) return;
    element.hidden = !selectedPrefixes.some((prefix) => title.startsWith(prefix) || title.includes(prefix));
  });
}

function sortableTextValue(text) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  if (!value) return { type: "empty", value: "" };
  const isoDate = value.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoDate) return { type: "date", value: `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}` };
  const uaDate = value.match(/\b(\d{2})\.(\d{2})\.(\d{4})\b/);
  if (uaDate) return { type: "date", value: `${uaDate[3]}-${uaDate[2]}-${uaDate[1]}` };
  const numeric = value
    .replace(/[^\d,.\-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  if (numeric && numeric !== "-" && !Number.isNaN(Number(numeric))) {
    return { type: "number", value: Number(numeric) };
  }
  return { type: "text", value: value.toLocaleLowerCase("uk-UA") };
}

function compareSortableText(first, second) {
  const left = sortableTextValue(first);
  const right = sortableTextValue(second);
  if (left.type === "empty" && right.type !== "empty") return 1;
  if (right.type === "empty" && left.type !== "empty") return -1;
  if (left.type === "number" && right.type === "number") return left.value - right.value;
  if (left.type === "date" && right.type === "date") return left.value.localeCompare(right.value);
  return String(left.value).localeCompare(String(right.value), "uk", { numeric: true, sensitivity: "base" });
}

function sortDomTable(table, columnIndex) {
  const tbody = table.tBodies?.[0];
  if (!tbody) return;
  const currentIndex = table.dataset.sortIndex;
  const nextDir = currentIndex === String(columnIndex) && table.dataset.sortDir === "asc" ? "desc" : "asc";
  table.dataset.sortIndex = String(columnIndex);
  table.dataset.sortDir = nextDir;
  const rows = Array.from(tbody.rows);
  const sortableRows = rows.filter((row) => row.cells.length > columnIndex && !row.cells[0]?.hasAttribute("colspan"));
  const restRows = rows.filter((row) => !sortableRows.includes(row));
  sortableRows.sort((first, second) => {
    const result = compareSortableText(first.cells[columnIndex]?.textContent || "", second.cells[columnIndex]?.textContent || "");
    return nextDir === "asc" ? result : -result;
  });
  [...sortableRows, ...restRows].forEach((row) => tbody.appendChild(row));
  table.querySelectorAll("[data-table-sort-index]").forEach((button) => {
    const active = button.dataset.tableSortIndex === String(columnIndex);
    button.classList.toggle("active", active);
    button.setAttribute("aria-sort", active ? (nextDir === "asc" ? "ascending" : "descending") : "none");
    const indicator = button.querySelector(".sort-indicator");
    if (indicator) indicator.textContent = active ? (nextDir === "asc" ? "↑" : "↓") : "↕";
  });
}

function datesInText(text) {
  const value = String(text || "");
  const dates = [];
  value.replace(/\b(20\d{2})-(\d{2})-(\d{2})\b/g, (match, year, month, day) => {
    dates.push(`${year}-${month}-${day}`);
    return match;
  });
  value.replace(/\b(\d{2})\.(\d{2})\.(20\d{2})\b/g, (match, day, month, year) => {
    dates.push(`${year}-${month}-${day}`);
    return match;
  });
  return Array.from(new Set(dates));
}

function smartListPreferences(key) {
  state.smartListPreferences = state.smartListPreferences || {};
  if (!state.smartListPreferences[key]) {
    state.smartListPreferences[key] = { collapsed: false, from: "", to: "" };
  }
  return state.smartListPreferences[key];
}

function smartListTitle(list, index) {
  const container = list.closest(".panel, .card, section, article") || list.parentElement;
  const heading = container?.querySelector("h2, h3");
  if (heading?.textContent?.trim()) return heading.textContent.trim();
  const firstHeader = list.querySelector("th")?.textContent?.trim();
  return firstHeader ? `Список: ${firstHeader}` : `Список ${index + 1}`;
}

function smartListKey(title, index) {
  const subview = currentSubview(state.currentView) || "all";
  return `${authMode || "crm"}|${state.currentView}|${subview}|${index}|${title}`;
}

function smartListRows(list) {
  const table = list.matches("table") ? list : list.querySelector("table");
  if (table?.tBodies?.[0]) return Array.from(table.tBodies[0].rows);
  return Array.from(list.children).filter((child) => !child.matches(".smart-list-empty"));
}

function smartListDateMatches(dates, preferences, listHasDates) {
  const from = preferences.from || "";
  const to = preferences.to || "";
  if (!from && !to) return true;
  if (!dates.length) return !listHasDates;
  if (from && !to) return dates.some((date) => date === from);
  if (!from && to) return dates.some((date) => date === to);
  const start = from <= to ? from : to;
  const end = from <= to ? to : from;
  return dates.some((date) => date >= start && date <= end);
}

function applySmartListState(frame) {
  const key = frame.dataset.smartListKey;
  const preferences = smartListPreferences(key);
  const list = frame.querySelector("[data-smart-list-body]");
  if (!list) return;
  const rows = smartListRows(list).map((row) => ({
    row,
    dates: datesInText(row.textContent)
  }));
  const listHasDates = rows.some(({ dates }) => dates.length);
  let visibleCount = 0;
  rows.forEach(({ row, dates }) => {
    const visible = smartListDateMatches(dates, preferences, listHasDates);
    row.hidden = !visible;
    if (visible) visibleCount += 1;
  });
  const collapsed = Boolean(preferences.collapsed);
  frame.classList.toggle("smart-list-collapsed", collapsed);
  list.hidden = collapsed;
  const empty = frame.querySelector(".smart-list-empty");
  if (empty) empty.hidden = collapsed || visibleCount > 0 || rows.length === 0;
  const toggle = frame.querySelector("[data-smart-list-toggle]");
  if (toggle) {
    toggle.textContent = collapsed ? "▸" : "▾";
    toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    toggle.title = collapsed ? "Розгорнути список" : "Згорнути список";
    toggle.setAttribute("aria-label", collapsed ? "Розгорнути список" : "Згорнути список");
  }
  const count = frame.querySelector("[data-smart-list-count]");
  if (count) count.textContent = `${visibleCount}/${rows.length}`;
  const fromInput = frame.querySelector('[name="smartListFrom"]');
  const toInput = frame.querySelector('[name="smartListTo"]');
  if (fromInput && fromInput.value !== preferences.from) fromInput.value = preferences.from;
  if (toInput && toInput.value !== preferences.to) toInput.value = preferences.to;
}

function enhanceSmartLists(root = $("#app")) {
  if (!root) return;
  const lists = root.querySelectorAll(".table-wrap, .dashboard-list, .timeline");
  lists.forEach((list, index) => {
    if (list.closest("[hidden]")) return;
    if (list.closest(".smart-list-frame")) return;
    const title = smartListTitle(list, index);
    const key = smartListKey(title, index);
    const preferences = smartListPreferences(key);
    const frame = document.createElement("div");
    frame.className = "smart-list-frame";
    frame.dataset.smartListKey = key;
    frame.innerHTML = `
      <div class="smart-list-toolbar">
        <div class="smart-list-title">
          <strong>${escapeHtml(title)}</strong>
          <span class="pill info" data-smart-list-count>0/0</span>
        </div>
        <div class="smart-list-controls">
          <label class="field compact">
            <span>Дата від</span>
            <input name="smartListFrom" type="date" value="${escapeHtml(preferences.from || "")}" data-smart-list-date>
          </label>
          <label class="field compact">
            <span>Дата до</span>
            <input name="smartListTo" type="date" value="${escapeHtml(preferences.to || "")}" data-smart-list-date>
          </label>
          <button class="icon-button" type="button" data-smart-list-clear title="Скинути дати" aria-label="Скинути дати">×</button>
          <button class="icon-button" type="button" data-smart-list-toggle aria-expanded="true" title="Згорнути список" aria-label="Згорнути список">▾</button>
        </div>
      </div>
    `;
    list.parentNode.insertBefore(frame, list);
    list.dataset.smartListBody = "true";
    frame.appendChild(list);
    frame.insertAdjacentHTML("beforeend", '<p class="smart-list-empty muted small" hidden>Немає рядків за вибраною датою.</p>');
    applySmartListState(frame);
  });
}

function enhanceTables(root = $("#app")) {
  if (!root) return;
  root.querySelectorAll(".table-wrap").forEach((wrap) => wrap.classList.add("scroll-list"));
  root.querySelectorAll("table").forEach((table) => {
    const headerCells = Array.from(table.tHead?.rows?.[0]?.cells || []);
    headerCells.forEach((th, index) => {
      if (th.querySelector("button, input, select, textarea")) return;
      const label = th.textContent.trim();
      if (!label || /^дії$/i.test(label)) return;
      th.innerHTML = `
        <button class="table-sort" type="button" data-table-sort-index="${index}" aria-sort="none">
          <span>${escapeHtml(label)}</span>
          <span class="sort-indicator">↕</span>
        </button>
      `;
    });
  });
  enhanceSmartLists(root);
}

function fieldSuggestions(input) {
  const key = `${input.name || ""} ${input.placeholder || ""}`.toLowerCase();
  const all = [
    ...state.clients.map((client) => client.name),
    ...state.clients.map((client) => client.phone || ""),
    ...state.clients.map((client) => client.email || ""),
    ...state.products.map((product) => product.model),
    ...state.products.map((product) => product.brand),
    ...state.products.map((product) => product.barcode),
    ...state.products.map((product) => product.supplierSku),
    ...state.products.map((product) => product.internalCode),
    ...state.settings.suppliers.map((supplier) => supplier.name),
    ...state.warehouses.map((warehouse) => warehouse.name),
    ...state.managers,
    ...state.settings.cashArticles,
    ...state.settings.expenseArticles,
    ...state.settings.delivery,
    ...Object.values(state.settings.variantDictionaries || {}).flat().map((entry) => entry.name),
    ...state.serials.map((serial) => serial.serial),
    ...state.marketplacePublications.map((publication) => publication.sku),
    ...state.marketplaceOrders.map((order) => order.externalOrderId)
  ];
  if (key.includes("client") || key.includes("клієнт") || key.includes("покуп")) return uniqueList(state.clients.map((client) => client.name));
  if (key.includes("phone") || key.includes("тел")) return uniqueList(state.clients.map((client) => client.phone));
  if (key.includes("email")) return uniqueList(state.clients.map((client) => client.email));
  if (key.includes("supplier") || key.includes("постач")) return uniqueList(state.settings.suppliers.map((supplier) => supplier.name));
  if (key.includes("barcode") || key.includes("qr") || key.includes("штрих")) return uniqueList(state.products.map((product) => product.barcode));
  if (key.includes("sku") || key.includes("артикул")) return uniqueList([...state.products.map((product) => product.supplierSku), ...state.marketplacePublications.map((publication) => publication.sku)]);
  if (key.includes("code") || key.includes("код")) return uniqueList(state.products.map((product) => product.internalCode));
  if (key.includes("model") || key.includes("модель")) return uniqueList(state.products.map((product) => product.model));
  if (key.includes("brand") || key.includes("бренд")) return uniqueList(state.products.map((product) => product.brand));
  if (key.includes("manager") || key.includes("менедж")) return uniqueList(state.managers);
  return uniqueList(all).slice(0, 80);
}

function attachFieldSuggestions() {
  let host = $("#crm-suggestions");
  if (!host) {
    host = document.createElement("div");
    host.id = "crm-suggestions";
    document.body.appendChild(host);
  }
  const datalists = [];
  $$("input").forEach((input, index) => {
    if (["date", "number", "file", "checkbox", "radio", "password", "hidden"].includes(input.type) || input.disabled || input.readOnly) return;
    const values = fieldSuggestions(input);
    if (!values.length) return;
    const id = `crm-suggest-${index}`;
    input.setAttribute("list", id);
    datalists.push(`<datalist id="${id}">${values.map((value) => `<option value="${escapeHtml(value)}"></option>`).join("")}</datalist>`);
  });
  host.innerHTML = datalists.join("");
}

function demoEmployeeAccounts() {
  return state.employees
    .filter((employee) => employee.active !== false && employee.login && employee.password)
    .slice(0, 12);
}

function renderDemoEmployeeAccounts() {
  const accounts = demoEmployeeAccounts();
  if (!accounts.length) return "";
  return `
    <div class="demo-users">
      <div class="demo-users-head">
        <h2>Тестові користувачі</h2>
        <span class="pill info">${accounts.length} акаунтів</span>
      </div>
      <div class="demo-user-grid">
        ${accounts.map((employee) => `
          <button class="demo-user-button" type="button" data-demo-login="${escapeHtml(employee.login)}" data-demo-password="${escapeHtml(employee.password)}">
            <strong>${escapeHtml(employee.name)}</strong>
            <span>${escapeHtml(employee.roleName)}</span>
            <code>${escapeHtml(employee.login)} / ${escapeHtml(employee.password)}</code>
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function renderLogin() {
  document.body.classList.add("auth-locked");
  $(".app-shell")?.setAttribute("aria-hidden", "true");
  let screen = $("#login-screen");
  if (!screen) {
    screen = document.createElement("main");
    screen.id = "login-screen";
    document.body.prepend(screen);
  }
  screen.innerHTML = `
    <section class="login-card">
      <div>
        <span class="brand-mark">MP</span>
        <h1>Вхід до Marketplace CRM</h1>
        <p class="muted">Операційний кабінет для публікацій, залишків, цін, замовлень і синхронізації маркетплейсів.</p>
      </div>
      <div class="login-options single">
        <form class="form-grid" data-action="login">
          <h2>Працівник</h2>
          <label class="field full"><span>Логін</span><input name="login" autocomplete="username" required autofocus></label>
          <label class="field full"><span>Пароль</span><input name="password" type="password" autocomplete="current-password" required></label>
          <button class="primary" type="submit">Увійти в CRM</button>
        </form>
      </div>
      ${renderDemoEmployeeAccounts()}
      <p class="notice small">Demo: можна зайти вручну або натиснути потрібного тестового користувача.</p>
    </section>
  `;
}

function clearLoginScreen() {
  document.body.classList.remove("auth-locked");
  $(".app-shell")?.removeAttribute("aria-hidden");
  $("#login-screen")?.remove();
}

function render() {
  if (isClientAuthenticated()) {
    const client = authenticatedClient();
    clearLoginScreen();
    renderClientShell(client);
    $("#app").innerHTML = clientPortalView === "catalog" ? renderClientCatalogPage(client) : renderClientPortal(client);
    enhanceTables($("#app"));
    attachFieldSuggestions();
    prepareDecimalInputs($("#app"));
    saveState();
    return;
  }
  if (!isAuthenticated()) {
    authEmployeeId = "";
    authClientId = "";
    authMode = "";
    appSessionStorage.removeItem("arms-crm-auth-employee-id");
    appSessionStorage.removeItem("arms-crm-auth-client-id");
    appSessionStorage.removeItem("arms-crm-auth-mode");
    renderLogin();
    saveState();
    return;
  }
  clearLoginScreen();
  activateEmployeeSession(authenticatedEmployee());
  if (!NAV.some(([id]) => id === state.currentView) || !canAccessView(state.currentView)) {
    state.currentView = NAV.find(([id]) => canAccessView(id))?.[0] || "dashboard";
  }
  renderShell();
  const viewMap = {
    dashboard: renderDashboard,
    sales: renderMarketplaceSales,
    products: renderMarketplaceProducts,
    purchases: renderPurchases,
    serials: renderSerials,
    warehouse: renderWarehouse,
    b2b: renderB2B,
    clients: renderClients,
    finance: renderMarketplaceFinance,
    reports: renderMarketplaceAnalytics,
    marketplaces: renderMarketplaces,
    integrations: renderIntegrations,
    settings: renderMarketplaceSettings,
    roles: renderRoles
  };
  $("#app").innerHTML = (viewMap[state.currentView] || renderDashboard)();
  applySubpageVisibility($("#app"));
  enhanceTables($("#app"));
  if (state.currentView === "products") renderProductPhotoPreview();
  attachFieldSuggestions();
  prepareDecimalInputs($("#app"));
  applyRoleFieldLocks($("#app"));
  saveState();
}

function totals() {
  const receivable = state.invoices.reduce((sum, invoice) => sum + Math.max(invoice.total - invoice.paid, 0), 0);
  const paid = state.payments.reduce((sum, payment) => sum + uah(payment.amount, payment.currency), 0);
  const stockValue = inventoryRows().reduce((sum, row) => sum + row.valueUAH, 0);
  const weaponAvailable = state.serials.filter((serial) => serial.status === "available").length;
  return { receivable, paid, stockValue, weaponAvailable };
}

function marketplaceOrderTotal(order) {
  return Number(order.qty || 1) * Number(order.price || 0);
}

function salesFunnelRules() {
  state.settings.salesFunnel = normalizeSalesFunnel(state.settings.salesFunnel);
  return state.settings.salesFunnel;
}

function salesFunnelStage(status) {
  return salesFunnelRules().find((stage) => stage.id === status) || salesFunnelRules()[0];
}

function activeSalesFunnelStages() {
  return salesFunnelRules().filter((stage) => stage.active !== false);
}

function marketplaceFunnelManager() {
  const selected = state.marketplaceFunnelManager || state.currentManager || "";
  if (selected === "__all") return "__all";
  return state.managers.includes(selected) ? selected : (state.managers.includes(state.currentManager) ? state.currentManager : "__all");
}

function nextMarketplaceManager() {
  const activeManagers = state.employees
    .filter((employee) => employee.active !== false && employee.roleName !== "B2B клієнт")
    .map((employee) => employee.name);
  const candidates = activeManagers.length ? activeManagers : state.managers;
  if (!candidates.length) return state.currentManager;
  const load = new Map(candidates.map((manager) => [manager, 0]));
  state.marketplaceOrders.forEach((order) => {
    if (load.has(order.manager) && !MARKETPLACE_FINAL_STATUSES.includes(order.status)) {
      load.set(order.manager, load.get(order.manager) + 1);
    }
  });
  return [...load.entries()].sort((first, second) => first[1] - second[1] || first[0].localeCompare(second[0], "uk"))[0]?.[0] || state.currentManager;
}

function marketplaceOrderStockControl(order) {
  const available = productAvailableQty(order.productId, "wh-main", "fop");
  const qty = Number(order.qty || 1);
  if (!order.productId) return { className: "danger", label: "товар не знайдено", detail: "Потрібно зіставити товар перед складом." };
  if (available >= qty) return { className: "good", label: "склад OK", detail: `Доступно ${available}, потрібно ${qty}.` };
  return { className: "danger", label: "бракує складу", detail: `Доступно ${available}, потрібно ${qty}.` };
}

function addOrderIssue(list, key, label, level = "warn") {
  if (!list.some((item) => item.key === key)) list.push({ key, label, level });
}

function marketplaceOrderPendingActionKeys(order) {
  const status = normalizeMarketplaceOrderStatus(order.status);
  const paymentStatus = order.payment?.status || "expected";
  if (status === "cancelled" || status === "repeat_sale") return [];
  if (status === "new_order" || status === "in_progress") return ["waitClient", "confirm"];
  if (status === "waiting_client") return ["confirm"];
  if (status === "confirmed_by_client" || status === "upsell") {
    return paymentStatus === "paid" ? ["warehouse"] : ["waitPayment", "createPayment"];
  }
  if (status === "waiting_payment") return ["pay", "createPayment"];
  if (status === "paid") return ["warehouse"];
  if (status === "picking") return ["picked"];
  if (status === "picked") {
    const deliveryStatus = order.delivery?.status || "sent_to_warehouse";
    if (deliveryStatus === "warehouse_handover") return ["logisticsAccept"];
    if (["logistics_accepted", "sent_to_delivery", "in_transit", "arrived_branch", "delivered"].includes(deliveryStatus)) return ["trackDelivery"];
    return ["handoverDelivery"];
  }
  if (status === "shipped") return ["trackDelivery"];
  if (status === "delivered") return ["complete"];
  if (status === "completed") return ["followUp"];
  if (status === "follow_up") return ["repeat"];
  return [];
}

function marketplaceOrderPendingActionLabels(order) {
  const labels = {
    waitClient: "зв'язатися з клієнтом / поставити очікування",
    confirm: "підтвердити замовлення клієнтом",
    waitPayment: "перевести в очікування оплати",
    pay: "підтягнути або створити оплату",
    createPayment: "створити оплату",
    warehouse: "передати на комплектацію",
    picked: "підтвердити відбірку завскладом",
    handoverDelivery: "передати замовлення логісту",
    logisticsAccept: "логіст підтверджує передачу в доставку",
    trackDelivery: "перевірити статус доставки за ТТН",
    ship: "створити ТТН і відправити",
    delivered: "підтвердити доставку",
    complete: "завершити продаж",
    followUp: "зробити післяпродажний контакт",
    repeat: "запланувати повторний продаж"
  };
  return marketplaceOrderPendingActionKeys(order).map((key) => labels[key]).filter(Boolean);
}

function marketplaceOrderMissingFields(order) {
  const buyer = marketplaceOrderBuyer(order || {});
  const delivery = order.delivery || {};
  const payment = order.payment || {};
  const dates = order.dates || {};
  const status = normalizeMarketplaceOrderStatus(order.status);
  const warehouseFlow = order.warehouseFlow || {};
  const deliveryProvider = deliveryProviderForOrder(order);
  const issues = [];
  const cancelled = status === "cancelled";
  if (!String(order.date || "").trim()) addOrderIssue(issues, "date", "дата замовлення", "danger");
  if (!String(order.marketplace || "").trim()) addOrderIssue(issues, "marketplace", "маркетплейс", "danger");
  if (!order.productId || !byId(state.products, order.productId)) addOrderIssue(issues, "productId", "товар", "danger");
  if (!String(order.sku || "").trim()) addOrderIssue(issues, "sku", "SKU", "warn");
  if (!Number(order.qty || 0)) addOrderIssue(issues, "qty", "кількість", "danger");
  if (!Number(order.price || 0)) addOrderIssue(issues, "price", "ціна", "danger");
  if (!String(order.currency || "").trim()) addOrderIssue(issues, "currency", "валюта", "warn");
  if (!String(order.manager || "").trim()) addOrderIssue(issues, "manager", "менеджер", "warn");
  if (!String(buyer.name || "").trim()) addOrderIssue(issues, "buyerName", "покупець", "danger");
  if (!String(buyer.phone || buyer.email || "").trim()) addOrderIssue(issues, "buyerContact", "телефон або email покупця", "danger");
  if (statusAtLeast(status, "confirmed_by_client") && !cancelled && !order.clientId) addOrderIssue(issues, "clientId", "клієнт у CRM", "warn");
  if (!String(delivery.service || "").trim()) addOrderIssue(issues, "deliveryService", "служба доставки", "warn");
  if (statusAtLeast(status, "confirmed_by_client") && !cancelled) {
    if (!String(delivery.city || "").trim()) addOrderIssue(issues, "deliveryCity", "місто доставки", "warn");
    if (!String(delivery.warehouse || buyer.address || "").trim()) addOrderIssue(issues, "deliveryAddress", "відділення або адреса доставки", "warn");
  }
  if (statusAtLeast(status, "shipped") && !cancelled && !String(delivery.ttn || "").trim()) addOrderIssue(issues, "deliveryTtn", "ТТН", "danger");
  if (statusAtLeast(status, "picked") && !cancelled && !warehouseFlow.pickingConfirmedAt) addOrderIssue(issues, "warehousePicking", "підтвердження відбірки завскладом", "danger");
  if (statusAtLeast(status, "picked") && !cancelled && ["new", "sent_to_warehouse", "picked", ""].includes(delivery.status || "")) addOrderIssue(issues, "warehouseHandover", "передача логісту", "warn");
  if ((statusAtLeast(status, "shipped") || ["warehouse_handover", "logistics_accepted", "sent_to_delivery", "in_transit", "arrived_branch"].includes(delivery.status || "")) && !cancelled && !warehouseFlow.logisticsAcceptedAt) addOrderIssue(issues, "logisticsAccepted", "підтвердження логіста", "danger");
  if (statusAtLeast(status, "shipped") && !cancelled && !delivery.lastCheck) addOrderIssue(issues, "deliveryLastCheck", "перевірка статусу доставки", "warn");
  if (statusAtLeast(status, "shipped") && !cancelled && deliveryProvider.enabled && !deliveryProvider.apiKey) addOrderIssue(issues, "deliveryApiKey", `API ключ ${deliveryProvider.provider}`, "danger");
  if (!String(payment.method || "").trim()) addOrderIssue(issues, "paymentMethod", "метод оплати", "warn");
  if (!Number(payment.amount || marketplaceOrderTotal(order) || 0)) addOrderIssue(issues, "paymentAmount", "сума оплати", "warn");
  if (statusAtLeast(status, "paid") && !cancelled && payment.status !== "paid") addOrderIssue(issues, "paymentStatus", "оплата не підтверджена", "danger");
  if (statusAtLeast(status, "confirmed_by_client") && !cancelled && !String(payment.source || "").trim()) addOrderIssue(issues, "paymentSource", "джерело оплати", "warn");
  const dateRequirements = [
    ["in_progress", "inProgress", "дата “В роботі”"],
    ["confirmed_by_client", "agreed", "дата підтвердження клієнтом"],
    ["paid", "paid", "дата оплати"],
    ["picking", "warehouse", "дата передачі на склад"],
    ["picked", "picked", "дата збірки"],
    ["shipped", "delivery", "дата відправки"],
    ["delivered", "delivered", "дата доставки"],
    ["completed", "completed", "дата завершення"],
    ["follow_up", "aftersale", "дата Follow-up"],
    ["repeat_sale", "repeat", "дата повторного продажу"]
  ];
  dateRequirements.forEach(([stageId, dateKey, label]) => {
    if (statusAtLeast(status, stageId) && !cancelled && !dates[dateKey]) addOrderIssue(issues, `date:${dateKey}`, label, "warn");
  });
  if (status === "waiting_client" && !dates.waitingClient) addOrderIssue(issues, "date:waitingClient", "дата очікування клієнта", "warn");
  if (status === "waiting_payment" && !dates.paymentWaiting) addOrderIssue(issues, "date:paymentWaiting", "дата очікування оплати", "warn");
  if (status === "upsell" && !dates.upsell) addOrderIssue(issues, "date:upsell", "дата апселу", "warn");
  if (cancelled && !dates.cancelled) addOrderIssue(issues, "date:cancelled", "дата скасування", "warn");
  if (!cancelled && workflowMetrics(order).urgency === "overdue") addOrderIssue(issues, "workflowSla", "прострочений SLA поточного статусу", "danger");
  const pendingActions = marketplaceOrderPendingActionLabels(order);
  if (pendingActions.length) addOrderIssue(issues, "pendingAction", "поточна дія статусу", "warn");
  pendingActions.forEach((label, index) => addOrderIssue(issues, `action:${index}`, label, "warn"));
  return issues;
}

function missingIssueLevel(issues, keys) {
  const set = new Set(keys);
  const found = issues.filter((issue) => set.has(issue.key));
  if (!found.length) return "";
  return found.some((issue) => issue.level === "danger") ? "danger" : "warn";
}

function orderCellClass(issues, keys) {
  const level = missingIssueLevel(issues, keys);
  return level ? ` class="cell-missing ${level}"` : "";
}

function orderFieldClass(issues, keys, base = "field") {
  const level = missingIssueLevel(issues, keys);
  return level ? `${base} field-missing ${level}` : base;
}

function orderActionClass(order, actionKey, base = "ghost") {
  return `${base}${marketplaceOrderPendingActionKeys(order).includes(actionKey) ? " action-needed" : ""}`;
}

function marketplaceOrderDeliveryActionState(order) {
  const status = normalizeMarketplaceOrderStatus(order.status);
  const deliveryStatus = order.delivery?.status || "new";
  const handedOver = ["warehouse_handover", "logistics_accepted", "sent_to_delivery", "in_transit", "arrived_branch", "delivered"].includes(deliveryStatus);
  const logisticsAccepted = ["logistics_accepted", "sent_to_delivery", "in_transit", "arrived_branch", "delivered"].includes(deliveryStatus);
  return {
    canWarehouse: ["confirmed_by_client", "upsell", "waiting_payment", "paid", "picking"].includes(status),
    canPicked: ["picking", "picked"].includes(status),
    canHandover: status === "picked" && !handedOver,
    canLogisticsAccept: status === "picked" && deliveryStatus === "warehouse_handover",
    canTrack: ["shipped", "delivered"].includes(status) || logisticsAccepted
  };
}

function renderOrderIssueSummary(order) {
  const issues = marketplaceOrderMissingFields(order).filter((issue) => issue.key !== "pendingAction");
  if (!issues.length) return '<p class="notice good small full">Усі обов’язкові атрибути та поточні дії виконані.</p>';
  const danger = issues.filter((issue) => issue.level === "danger");
  const warn = issues.filter((issue) => issue.level !== "danger");
  return `
    <div class="order-issues notice danger full">
      <strong>Потрібно доповнити / виконати</strong>
      <div class="issue-pill-list">
        ${danger.map((issue) => `<span class="pill danger">${escapeHtml(issue.label)}</span>`).join("")}
        ${warn.map((issue) => `<span class="pill warn">${escapeHtml(issue.label)}</span>`).join("")}
      </div>
    </div>
  `;
}

function renderOrderIssueCompact(order) {
  const issues = marketplaceOrderMissingFields(order).filter((issue) => issue.key !== "pendingAction");
  if (!issues.length) return "";
  const danger = issues.filter((issue) => issue.level === "danger").length;
  return `<span class="pill ${danger ? "danger" : "warn"}">${issues.length} не виконано</span>`;
}

function marketplaceOrderIssueBuckets(order) {
  const issues = marketplaceOrderMissingFields(order).filter((issue) => issue.key !== "pendingAction");
  return {
    issues,
    danger: issues.filter((issue) => issue.level === "danger"),
    warn: issues.filter((issue) => issue.level !== "danger")
  };
}

function renderMarketplaceOrderProcessControl() {
  const activeOrders = state.marketplaceOrders.filter((order) => !MARKETPLACE_FINAL_STATUSES.includes(normalizeMarketplaceOrderStatus(order.status)));
  const rows = state.marketplaceOrders.map((order) => {
    const buckets = marketplaceOrderIssueBuckets(order);
    const metrics = workflowMetrics(order);
    const actions = marketplaceOrderPendingActionLabels(order);
    return { order, ...buckets, metrics, actions };
  }).filter((row) => row.issues.length || row.metrics.urgency === "overdue");
  const orderedRows = rows.sort((first, second) => {
    const firstScore = (first.danger.length ? 100 : 0) + (first.metrics.urgency === "overdue" ? 50 : 0) + first.warn.length;
    const secondScore = (second.danger.length ? 100 : 0) + (second.metrics.urgency === "overdue" ? 50 : 0) + second.warn.length;
    return secondScore - firstScore;
  }).slice(0, 12);
  const blockerCount = rows.filter((row) => row.danger.length).length;
  const overdueCount = rows.filter((row) => row.metrics.urgency === "overdue").length;
  const actionCount = rows.filter((row) => row.actions.length).length;
  return `
    <section class="panel section-band">
      <div class="split">
        <h2>Контроль обробки замовлень</h2>
        <span class="pill ${blockerCount || overdueCount ? "danger" : actionCount ? "warn" : "good"}">${rows.length} потребують уваги</span>
      </div>
      <div class="grid four">
        <article class="card metric info"><span>Активні</span><strong>${activeOrders.length}</strong><small>Не завершені і не скасовані.</small></article>
        <article class="card metric danger"><span>Блокери</span><strong>${blockerCount}</strong><small>Немає критичних реквізитів або прострочено SLA.</small></article>
        <article class="card metric warn"><span>Дії менеджера</span><strong>${actionCount}</strong><small>Потрібне наступне ручне рішення.</small></article>
        <article class="card metric danger"><span>SLA</span><strong>${overdueCount}</strong><small>Статуси з перевищеним терміном.</small></article>
      </div>
      <div class="table-wrap compact-table">
        <table>
          <thead><tr><th>Замовлення</th><th>Статус</th><th>SLA</th><th>Що зробити</th><th>Не заповнено / не виконано</th></tr></thead>
          <tbody>
            ${orderedRows.map(({ order, danger, warn, metrics, actions }) => {
              const buyer = marketplaceOrderBuyer(order);
              const issueText = [...danger, ...warn].slice(0, 5).map((issue) => `<span class="pill ${issue.level === "danger" ? "danger" : "warn"}">${escapeHtml(issue.label)}</span>`).join("");
              return `
                <tr class="clickable-row ${danger.length || metrics.urgency === "overdue" ? "row-has-issues" : ""}" data-edit-marketplace-order="${escapeHtml(order.id)}" title="Відкрити замовлення">
                  <td><strong>${escapeHtml(order.externalOrderId || order.id)}</strong><br><span class="small muted">${escapeHtml(order.marketplace || "-")} · ${escapeHtml(buyer.name || "-")}</span></td>
                  <td>${marketplaceOrderStatusPill(order.status)}<br>${marketplacePaymentStatusPill(order.payment?.status)}</td>
                  <td><span class="pill ${metrics.urgency === "overdue" ? "danger" : metrics.urgency === "soon" ? "warn" : "info"}">${escapeHtml(metrics.label)}</span><br><span class="small muted">до ${workflowDateTime(metrics.dueAt)}</span></td>
                  <td>${actions.length ? actions.slice(0, 3).map((item) => `<span class="pill warn">${escapeHtml(item)}</span>`).join("") : '<span class="pill good">дій немає</span>'}</td>
                  <td><div class="issue-pill-list">${issueText || '<span class="pill good">заповнено</span>'}</div></td>
                </tr>
              `;
            }).join("") || '<tr><td colspan="5" class="muted">Критичних проблем у замовленнях немає.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function workflowDateTime(isoString) {
  if (!isoString) return "-";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return String(isoString);
  return date.toLocaleString("uk-UA", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function formatWorkflowHours(hours) {
  const abs = Math.abs(Number(hours || 0));
  if (abs < 1) return `${Math.max(1, Math.round(abs * 60))} хв`;
  if (abs >= 24) return `${Math.round(abs / 24)} дн`;
  return `${Math.round(abs)} год`;
}

function workflowMetrics(order) {
  const stage = salesFunnelStage(order.status);
  const startedAt = order.workflow?.stageStartedAt || dateToIso(order.dates?.[funnelDateKey(order.status)] || order.date || today);
  const dueAt = addHoursIso(startedAt, stage.slaHours);
  const remainingHours = (new Date(dueAt).getTime() - Date.now()) / 36e5;
  const isDone = MARKETPLACE_FINAL_STATUSES.includes(order.status);
  const urgency = isDone ? "done" : remainingHours < 0 ? "overdue" : remainingHours <= 2 ? "soon" : "ok";
  const label = isDone
    ? "цикл завершено"
    : urgency === "overdue"
      ? `прострочено на ${formatWorkflowHours(remainingHours)}`
      : urgency === "soon"
        ? `нагадати за ${formatWorkflowHours(remainingHours)}`
        : `є ${formatWorkflowHours(remainingHours)}`;
  return { stage, startedAt, dueAt, remainingHours, urgency, label };
}

function setMarketplaceOrderWorkflowStage(order, status, details = {}) {
  const normalizedStatus = normalizeMarketplaceOrderStatus(status);
  const stage = salesFunnelStage(normalizedStatus);
  const dateKey = funnelDateKey(normalizedStatus);
  order.status = normalizedStatus;
  order.dates = {
    created: order.date || today,
    inProgress: "",
    waitingClient: "",
    agreed: "",
    paymentWaiting: "",
    warehouse: "",
    picked: "",
    delivery: "",
    delivered: "",
    completed: "",
    paid: "",
    upsell: "",
    aftersale: "",
    repeat: "",
    cancelled: "",
    ...(order.dates || {}),
    [dateKey]: today
  };
  const startedAt = nowIso();
  order.workflow = {
    ...(order.workflow || {}),
    stage: normalizedStatus,
    stageStartedAt: startedAt,
    reminderAt: addHoursIso(startedAt, stage.slaHours),
    nextAction: details.nextAction || stage.reminder,
    lastReminderAt: details.lastReminderAt || order.workflow?.lastReminderAt || ""
  };
}

function runMarketplaceOrderAutomation(order, options = {}) {
  if (!order) return null;
  if (!order.manager || !state.managers.includes(order.manager)) {
    order.manager = nextMarketplaceManager();
  }
  const client = ensureClientFromMarketplaceOrder(order);
  const dates = {
    created: order.date || today,
    inProgress: "",
    waitingClient: "",
    agreed: "",
    paymentWaiting: "",
    warehouse: "",
    picked: "",
    delivery: "",
    delivered: "",
    completed: "",
    paid: "",
    upsell: "",
    aftersale: "",
    repeat: "",
    cancelled: "",
    ...(order.dates || {})
  };
  order.dates = dates;
  order.status = normalizeMarketplaceOrderStatus(order.status || "new_order");
  order.workflow = normalizeMarketplaceWorkflow(order, order.status, dates);
  order.workflow.acceptedAt = order.workflow.acceptedAt || nowIso();
  order.workflow.assignedAt = order.workflow.assignedAt || nowIso();
  order.workflow.nextAction = salesFunnelStage(order.status).reminder;
  order.notifiedAt = order.notifiedAt || currentTimestamp();
  if (options.audit) {
    addAudit(`CRM автоматично прийняла ${order.externalOrderId}: клієнт ${client.name}, менеджер ${order.manager}, етап ${salesFunnelStage(order.status).label}`, "system");
  }
  return client;
}

function bootstrapMarketplaceOrderAutomation() {
  (state.marketplaceOrders || []).forEach((order) => runMarketplaceOrderAutomation(order, { audit: false }));
}

function marketplaceFunnelRows() {
  return activeSalesFunnelStages().map((stage) => {
    const orders = state.marketplaceOrders.filter((order) => order.status === stage.id);
    const overdue = orders.filter((order) => workflowMetrics(order).urgency === "overdue").length;
    return {
      ...stage,
      orders,
      count: orders.length,
      overdue
    };
  });
}

function renderFunnelHoverOrderList(stage) {
  if (!stage.orders.length) {
    return '<div class="funnel-hover-empty">Немає замовлень</div>';
  }
  return stage.orders.map((order) => {
    const buyer = marketplaceOrderBuyer(order);
    const metrics = workflowMetrics(order);
    const overdue = metrics.urgency === "overdue";
    return `
      <button class="funnel-hover-order ${overdue ? "overdue" : ""}" type="button" data-edit-marketplace-order="${escapeHtml(order.id)}">
        <span>
          <strong>${escapeHtml(order.externalOrderId)}</strong>
          <small>${escapeHtml(order.marketplace)} · ${escapeHtml(buyer.name || "Покупець")}</small>
        </span>
        <span>
          <strong>${formatMoney(marketplaceOrderTotal(order), order.currency)}</strong>
          <small>${overdue ? "прострочено" : workflowDateTime(metrics.dueAt)}</small>
        </span>
        ${renderOrderIssueCompact(order)}
      </button>
    `;
  }).join("");
}

function renderMarketplaceFunnelBoard() {
  return `
    <section class="panel section-band dashboard-funnel-panel">
      <div class="split">
        <h2>Панель</h2>
        <span class="pill info">${state.marketplaceOrders.length} замовлень</span>
      </div>
      <div class="funnel-grid">
        ${marketplaceFunnelRows().map((stage) => `
          <article class="funnel-card ${stage.overdue ? "overdue" : ""}" tabindex="0" ${stage.orders.length === 1 ? `data-open-funnel-order="${escapeHtml(stage.orders[0].id)}"` : ""} title="${stage.orders.length === 1 ? "Клікніть, щоб відкрити замовлення" : "Наведіть курсор, щоб побачити замовлення"}">
            <span class="pill ${stage.overdue ? "danger" : stage.className}">${escapeHtml(stage.label)}</span>
            <strong>${stage.count}</strong>
            <small>${stage.overdue ? `${stage.overdue} прострочено` : `SLA ${stage.slaHours} год`}</small>
            <div class="funnel-hover-menu" role="menu" aria-label="Замовлення: ${escapeHtml(stage.label)}">
              <div class="funnel-hover-head">
                <strong>${escapeHtml(stage.label)}</strong>
                <span>${stage.count}</span>
              </div>
              ${renderFunnelHoverOrderList(stage)}
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderOrderProcessStrip(order) {
  const activeStages = activeSalesFunnelStages();
  const currentIndex = Math.max(0, activeStages.findIndex((stage) => stage.id === order.status));
  const metrics = workflowMetrics(order);
  return `
    <div class="process-strip" aria-label="Процес замовлення">
      ${activeStages.map((stage, index) => {
        const stateClass = index < currentIndex ? "complete" : index === currentIndex ? `current ${metrics.urgency}` : "pending";
        return `<span class="process-step ${stateClass} ${stage.className}" title="${escapeHtml(stage.label)}"></span>`;
      }).join("")}
    </div>
  `;
}

function renderOrderStatusRuleCard(order) {
  const stage = salesFunnelStage(order.status);
  return `
    <div class="workflow-rule-card full">
      <div class="split">
        <strong>${escapeHtml(stage.label)}</strong>
        <span class="pill ${stage.className}">SLA ${escapeHtml(stage.slaHours)} год</span>
      </div>
      <dl>
        <div><dt>Де знаходиться</dt><dd>${escapeHtml(stage.menuLocation || "Продажі → Замовлення")}</dd></div>
        <div><dt>Умова входу</dt><dd>${escapeHtml(stage.entryCondition || "")}</dd></div>
        <div><dt>Умова виконання</dt><dd>${escapeHtml(stage.completionCondition || "")}</dd></div>
        <div><dt>Перехід далі</dt><dd>${escapeHtml(stage.switchBy || "")}</dd></div>
      </dl>
    </div>
  `;
}

function renderMarketplaceOrderControlActions(order) {
  const canOrder = canManageMarketplaceOrder();
  const canStatus = canChangeMarketplaceOrderStatus();
  const canDelivery = canTrackMarketplaceDelivery();
  const canPayment = canTrackMarketplacePayment();
  const canSendWarehouse = canSendMarketplaceOrderToWarehouse();
  const canPicking = canConfirmMarketplacePicking();
  const canWarehouseHandover = canHandoverMarketplaceOrderToLogistics();
  const canLogisticsAccept = canAcceptMarketplaceOrderLogistics();
  const deliveryAction = marketplaceOrderDeliveryActionState(order);
  return `
    <div class="workflow-actions no-print">
      ${renderOrderCommunicationButtons(order)}
      <button class="ghost" data-run-order-automation="${escapeHtml(order.id)}" ${canOrder ? "" : "disabled"}>Авто</button>
      <button class="${orderActionClass(order, "waitClient")}" data-marketplace-wait-client="${escapeHtml(order.id)}" ${canStatus && ["new_order", "in_progress", "waiting_client"].includes(order.status) ? "" : "disabled"}>Очікує клієнта</button>
      <button class="${orderActionClass(order, "confirm")}" data-agree-marketplace-order="${escapeHtml(order.id)}" ${canStatus && ["new_order", "in_progress", "waiting_client"].includes(order.status) ? "" : "disabled"}>Підтверджено</button>
      <button class="${orderActionClass(order, "waitPayment")}" data-marketplace-wait-payment="${escapeHtml(order.id)}" ${canStatus && order.payment?.status !== "paid" && ["confirmed_by_client", "upsell", "waiting_payment"].includes(order.status) ? "" : "disabled"}>Очікує оплату</button>
      <button class="${orderActionClass(order, "pay", "secondary")}" data-pull-marketplace-payment="${escapeHtml(order.id)}" ${canPayment && order.status !== "cancelled" && order.payment?.status !== "paid" ? "" : "disabled"}>Оплатити</button>
      <button class="${orderActionClass(order, "createPayment", "secondary")}" data-open-marketplace-payment="${escapeHtml(order.id)}" ${canCreateDocument("payment") && canEditField("payment") && order.status !== "cancelled" && order.payment?.status !== "paid" ? "" : "disabled"}>Створити оплату</button>
      <button class="secondary" data-marketplace-upsell="${escapeHtml(order.id)}" ${canOrder && ["confirmed_by_client", "upsell", "waiting_payment", "paid"].includes(order.status) ? "" : "disabled"}>Апсел</button>
      <button class="${orderActionClass(order, "warehouse")}" data-marketplace-to-warehouse="${escapeHtml(order.id)}" ${canSendWarehouse && deliveryAction.canWarehouse ? "" : "disabled"}>На відбірку</button>
      <button class="${orderActionClass(order, "picked")}" data-marketplace-picked="${escapeHtml(order.id)}" ${canPicking && deliveryAction.canPicked ? "" : "disabled"}>Відбірка ОК</button>
      <button class="${orderActionClass(order, "handoverDelivery", "secondary")}" data-marketplace-handover-delivery="${escapeHtml(order.id)}" ${canWarehouseHandover && deliveryAction.canHandover ? "" : "disabled"}>Передати логісту</button>
      <button class="${orderActionClass(order, "logisticsAccept", "secondary")}" data-marketplace-to-delivery="${escapeHtml(order.id)}" ${canLogisticsAccept && deliveryAction.canLogisticsAccept ? "" : "disabled"}>Логіст прийняв</button>
      <button class="${orderActionClass(order, "trackDelivery", "secondary")}" data-track-marketplace-delivery="${escapeHtml(order.id)}" ${canDelivery && deliveryAction.canTrack ? "" : "disabled"}>Статус доставки</button>
      <button class="${orderActionClass(order, "complete")}" data-marketplace-complete="${escapeHtml(order.id)}" ${canOrder && ["delivered", "completed"].includes(order.status) ? "" : "disabled"}>Завершено</button>
      <button class="${orderActionClass(order, "followUp")}" data-marketplace-aftersale="${escapeHtml(order.id)}" ${canOrder && ["completed", "follow_up"].includes(order.status) ? "" : "disabled"}>Follow-up</button>
      <button class="${orderActionClass(order, "repeat")}" data-marketplace-repeat-sale="${escapeHtml(order.id)}" ${canOrder && ["follow_up", "repeat_sale"].includes(order.status) ? "" : "disabled"}>Повтор</button>
      <button class="ghost" data-remind-marketplace-order="${escapeHtml(order.id)}" ${canOrder ? "" : "disabled"}>Нагадати</button>
      <button class="danger" data-marketplace-cancel="${escapeHtml(order.id)}" ${canOrder && !MARKETPLACE_FINAL_STATUSES.includes(order.status) ? "" : "disabled"}>Скасовано</button>
    </div>
  `;
}

function renderOrderCommunicationButtons(order) {
  const buyer = marketplaceOrderBuyer(order);
  const canContact = canContactMarketplaceBuyer();
  return `
    <button class="secondary" type="button" data-open-order-callback="${escapeHtml(order.id)}" ${canContact && buyer.phone ? "" : "disabled"}>Передзвонити</button>
    <button class="secondary" type="button" data-open-order-message="${escapeHtml(order.id)}" ${canContact && (buyer.phone || buyer.email || viberReceiver(order)) ? "" : "disabled"}>Написати</button>
  `;
}

function renderWorkflowOrderCard(order) {
  const buyer = marketplaceOrderBuyer(order);
  const metrics = workflowMetrics(order);
  const stock = marketplaceOrderStockControl(order);
  return `
    <article class="workflow-order ${metrics.urgency}">
      <div class="split">
        <strong>${escapeHtml(order.externalOrderId)}</strong>
        ${marketplaceOrderStatusPill(order.status)}
      </div>
      ${renderOrderProcessStrip(order)}
      <p class="small muted">${escapeHtml(buyer.name || "Покупець")} · ${escapeHtml(buyer.phone || "-")}</p>
      <p class="small">${formatMoney(marketplaceOrderTotal(order), order.currency)} · ${escapeHtml(productName(order.productId))}</p>
      <div class="workflow-badges">
        <span class="pill ${metrics.urgency === "overdue" ? "danger" : metrics.urgency === "soon" ? "warn" : "good"}">${escapeHtml(metrics.label)}</span>
        <span class="pill ${stock.className}">${escapeHtml(stock.label)}</span>
        ${renderOrderIssueCompact(order)}
      </div>
      <p class="small muted">До: ${workflowDateTime(metrics.dueAt)} · ${escapeHtml(order.workflow?.nextAction || metrics.stage.reminder)}</p>
      ${renderMarketplaceOrderControlActions(order)}
    </article>
  `;
}

function renderManagerSalesFunnel() {
  const selectedManager = marketplaceFunnelManager();
  const orders = state.marketplaceOrders.filter((order) => selectedManager === "__all" || order.manager === selectedManager);
  const overdueCount = orders.filter((order) => workflowMetrics(order).urgency === "overdue").length;
  const soonCount = orders.filter((order) => workflowMetrics(order).urgency === "soon").length;
  return `
    <section class="panel section-band manager-funnel-section">
      <div class="split">
        <div>
          <h2>Менеджерська воронка продажів</h2>
          <p class="small muted">Автоприйом замовлення → клієнт → менеджер → оплата → склад → доставка → апсел → післяпродаж → повторний продаж.</p>
        </div>
        <form class="manager-funnel-filter no-print" data-manager-funnel-filter>
          <label class="field compact"><span>Менеджер</span><select name="manager" data-manager-funnel-select>
            ${option("__all", "Усі менеджери", selectedManager === "__all")}
            ${state.managers.map((manager) => option(manager, manager, selectedManager === manager)).join("")}
          </select></label>
        </form>
      </div>
      <div class="workflow-summary">
        <span class="pill info">${orders.length} у контролі</span>
        <span class="pill ${overdueCount ? "danger" : "good"}">${overdueCount} прострочено</span>
        <span class="pill ${soonCount ? "warn" : "good"}">${soonCount} нагадати скоро</span>
      </div>
      <div class="manager-funnel-board">
        ${activeSalesFunnelStages().map((stage) => {
          const stageOrders = orders.filter((order) => order.status === stage.id);
          return `
            <section class="funnel-column ${stage.className}">
              <header>
                <span class="pill ${stage.className}">${escapeHtml(stage.label)}</span>
                <strong>${stageOrders.length}</strong>
                <small>SLA ${stage.slaHours} год</small>
              </header>
              <div class="funnel-column-list">
                ${stageOrders.map(renderWorkflowOrderCard).join("") || '<p class="small muted">Немає замовлень.</p>'}
              </div>
            </section>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function communicatorSettings() {
  state.settings.communicators = {
    ...clone(seedState.settings.communicators),
    ...(state.settings.communicators || {}),
    viber: {
      ...clone(seedState.settings.communicators.viber),
      ...(state.settings.communicators?.viber || {})
    },
    callRecording: {
      ...clone(seedState.settings.communicators.callRecording),
      ...(state.settings.communicators?.callRecording || {})
    }
  };
  return state.settings.communicators;
}

function viberSettings() {
  return communicatorSettings().viber;
}

function callRecordingSettings() {
  return communicatorSettings().callRecording;
}

function viberReceiver(order) {
  const buyer = marketplaceOrderBuyer(order);
  return order.viberReceiver || buyer.viberId || buyer.phone || "";
}

function fillViberTemplate(template, order) {
  const buyer = marketplaceOrderBuyer(order);
  const stage = salesFunnelStage(order.status);
  return String(template || seedState.settings.communicators.viber.defaultTemplate)
    .replaceAll("{buyer}", buyer.name || "покупець")
    .replaceAll("{order}", order.externalOrderId || "")
    .replaceAll("{status}", stage.label || order.status || "")
    .replaceAll("{manager}", order.manager || state.currentManager || "");
}

function viberMessagesForOrder(order) {
  return (state.viberMessages || []).filter((message) => message.orderId === order.id);
}

function communicationEventsForOrder(order) {
  return (state.communicationEvents || []).filter((event) => event.orderId === order.id);
}

function orderDefaultMessage(order) {
  return fillViberTemplate(viberSettings().defaultTemplate, order);
}

function cleanPhone(phone = "") {
  return String(phone || "").replace(/[^\d+]/g, "");
}

function messengerPhone(phone = "") {
  return cleanPhone(phone).replace(/^\+/, "");
}

function communicationReceiver(order, channel) {
  const buyer = marketplaceOrderBuyer(order);
  if (channel === "email") return buyer.email || "";
  if (channel === "viber") return viberReceiver(order);
  return buyer.phone || "";
}

function communicatorLabel(channel) {
  const labels = {
    phone: "Телефон",
    ip_telephony: "IP-телефонія",
    viber: "Viber",
    sms: "SMS",
    email: "Email",
    whatsapp: "WhatsApp",
    telegram: "Telegram"
  };
  return labels[channel] || channel || "комунікатор";
}

function communicatorOptions(order, kind, selected = "") {
  const buyer = marketplaceOrderBuyer(order);
  const phone = buyer.phone || "";
  const email = buyer.email || "";
  const receiver = viberReceiver(order);
  const options = kind === "call"
    ? [
        ["phone", "Телефон", phone],
        ["ip_telephony", "IP-телефонія/API", phone],
        ["viber", "Viber", receiver]
      ]
    : [
        ["viber", "Viber", receiver],
        ["sms", "SMS", phone],
        ["email", "Email", email],
        ["whatsapp", "WhatsApp", phone],
        ["telegram", "Telegram", phone]
      ];
  const available = options.filter(([, , value]) => value);
  return (available.length ? available : options).map(([value, label, receiverValue]) => option(
    value,
    `${label}${receiverValue ? ` · ${receiverValue}` : ""}`,
    value === selected || (!selected && receiverValue && value === available[0]?.[0])
  )).join("");
}

const MARKETPLACE_CUSTOMER_QUESTION_TYPES = [
  ["order_question", "Питання про замовлення"],
  ["seller_question", "Запитання продавцю"],
  ["call_center", "Звернення в Call Center"],
  ["return_request", "Заявки на повернення"],
  ["archived", "Архів"]
];

function marketplaceCustomerQuestionTypeLabel(type) {
  return MARKETPLACE_CUSTOMER_QUESTION_TYPES.find(([id]) => id === type)?.[1] || type || "Повідомлення";
}

function marketplaceQuestionStatusPill(status) {
  return statusPill(status || "new");
}

function marketplaceQuestionOrder(question) {
  if (question.orderId) {
    const order = byId(state.marketplaceOrders, question.orderId);
    if (order) return order;
  }
  const externalOrderId = String(question.externalOrderId || "").trim();
  if (!externalOrderId) return null;
  return state.marketplaceOrders.find((order) => order.externalOrderId === externalOrderId || order.externalOrderId === `RZ-${externalOrderId}`);
}

function marketplaceQuestionTemplateOptions(selected = "") {
  return (state.marketplaceMessageTemplates || []).map((template) => option(template.id, template.name, template.id === selected)).join("");
}

function fillMarketplaceReplyTemplate(templateText, item = {}) {
  return String(templateText || "")
    .replaceAll("{order}", item.externalOrderId || "")
    .replaceAll("{buyer}", item.buyerName || "покупець")
    .replaceAll("{marketplace}", item.marketplace || "маркетплейс");
}

function renderMarketplaceCustomerQuestionTypeCards(questions, selectedType = "order_question") {
  return `
    <div class="marketplace-comm-menu">
      ${MARKETPLACE_CUSTOMER_QUESTION_TYPES.map(([type, label]) => {
        const rows = questions.filter((item) => item.sourceType === type);
        const openRows = rows.filter((item) => !["answered", "archived", "closed"].includes(item.status));
        const active = selectedType === type;
        return `
          <button class="marketplace-comm-card ${active ? "active" : ""}" type="button" data-marketplace-question-type="${escapeHtml(type)}" aria-pressed="${active ? "true" : "false"}">
            <strong>${escapeHtml(label)}</strong>
            <span class="pill ${openRows.length ? "warn" : "good"}">${openRows.length} активних</span>
            <small>${rows.length} всього</small>
            <em>Відкрити список</em>
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function renderMarketplaceCustomerQuestionRows(rows) {
  const canReply = canContactMarketplaceBuyer() && canCreateDocument("marketplaceCustomerQuestions");
  if (!rows.length) return '<tr><td colspan="6" class="muted">Питань з маркетплейсів ще немає.</td></tr>';
  return rows.map((question) => {
    const order = marketplaceQuestionOrder(question);
    return `
      <tr class="clickable-row" data-open-marketplace-question="${escapeHtml(question.id)}" title="Клікніть, щоб відповісти">
        <td>
          <strong>${escapeHtml(marketplaceCustomerQuestionTypeLabel(question.sourceType))}</strong><br>
          <span class="small muted">${escapeHtml(question.createdAt || "-")}</span>
        </td>
        <td>${escapeHtml(question.marketplace || "-")}<br><span class="small muted">${escapeHtml(question.externalId || question.chatId || question.requestId || "-")}</span></td>
        <td>
          <strong>${escapeHtml(question.externalOrderId || order?.externalOrderId || "без замовлення")}</strong><br>
          <span class="small muted">${escapeHtml(question.buyerName || marketplaceOrderBuyer(order || {}).name || "покупець")} · ${escapeHtml(question.buyerContact || "")}</span>
        </td>
        <td>
          <strong>${escapeHtml(question.subject || "-")}</strong><br>
          <span class="small">${escapeHtml(question.message || "")}</span>
          ${question.answer ? `<br><span class="small muted">Відповідь: ${escapeHtml(question.answer)}</span>` : ""}
        </td>
        <td>${marketplaceQuestionStatusPill(question.status)}<br><span class="small muted">${escapeHtml(question.apiStatus || "")}</span></td>
        <td>
          <div class="row-actions no-print">
            <button class="secondary" type="button" data-reply-marketplace-question="${escapeHtml(question.id)}" ${canReply ? "" : "disabled"}>Відповісти</button>
            <button class="ghost" type="button" data-edit-marketplace-order="${escapeHtml(order?.id || "")}" ${order ? "" : "disabled"}>Замовлення</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function renderMarketplaceServiceThreadRows(rows) {
  const canReply = canContactMarketplaceBuyer() && canCreateDocument("marketplaceServiceThreads");
  if (!rows.length) return '<tr><td colspan="5" class="muted">Переписки з маркетплейсом ще немає.</td></tr>';
  return rows.map((thread) => `
    <tr class="clickable-row" data-open-marketplace-thread="${escapeHtml(thread.id)}" title="Клікніть, щоб відповісти маркетплейсу">
      <td><strong>${escapeHtml(thread.marketplace || "-")}</strong><br><span class="small muted">${escapeHtml(thread.externalId || thread.requestId || "-")}</span></td>
      <td><strong>${escapeHtml(thread.subject || "-")}</strong><br><span class="small">${escapeHtml(thread.message || "")}</span></td>
      <td>${statusPill(thread.status || "open")}<br><span class="small muted">${escapeHtml(thread.apiStatus || "")}</span></td>
      <td>${escapeHtml(thread.manager || "-")}<br><span class="small muted">${escapeHtml(thread.updatedAt || thread.createdAt || "-")}</span></td>
      <td>
        <div class="row-actions no-print">
          <button class="secondary" type="button" data-reply-marketplace-thread="${escapeHtml(thread.id)}" ${canReply ? "" : "disabled"}>Відповісти</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function recordingsForOrder(order) {
  return (state.callRecordings || []).filter((recording) => recording.orderId === order.id);
}

function renderViberHistory(order) {
  const messages = viberMessagesForOrder(order).slice(0, 3);
  if (!messages.length) return '<span class="small muted">Viber історії ще немає.</span>';
  return messages.map((message) => `
    <div class="comm-log-item">
      <strong>${escapeHtml(message.status)}</strong>
      <span class="small muted">${escapeHtml(message.at)} · ${escapeHtml(message.receiver || "-")}</span>
      <span class="small">${escapeHtml(message.text)}</span>
    </div>
  `).join("");
}

function renderCommunicationHistory(order) {
  const events = communicationEventsForOrder(order).slice(0, 4);
  if (!events.length) return '<span class="small muted">Подій зв’язку ще немає.</span>';
  return events.map((event) => `
    <div class="comm-log-item">
      <strong>${escapeHtml(event.type === "call" ? "Дзвінок" : "Повідомлення")} · ${escapeHtml(communicatorLabel(event.channel))}</strong>
      <span class="small muted">${escapeHtml(event.at || "")} · ${escapeHtml(event.status || "")}</span>
      ${event.text ? `<span class="small">${escapeHtml(event.text)}</span>` : ""}
    </div>
  `).join("");
}

function renderRecordingHistory(order) {
  const rows = recordingsForOrder(order).slice(0, 2);
  if (!rows.length) return '<span class="small muted">Записів ще немає.</span>';
  return rows.map((recording) => `
    <div class="recording-item">
      <div class="row-main">
        <strong>${escapeHtml(recording.startedAt || recording.at)}</strong>
        <button class="ghost danger no-print" type="button" data-delete-call-recording="${escapeHtml(recording.id)}">Видалити</button>
      </div>
      <span class="small muted">${escapeHtml(recording.manager || "-")} · ${Math.round(Number(recording.durationMs || 0) / 1000)} с · ${escapeHtml(recording.consent ? "згода підтверджена" : "без позначки згоди")}</span>
      ${recording.dataUrl ? `<audio controls src="${escapeHtml(recording.dataUrl)}"></audio>` : `<span class="small muted">${escapeHtml(recording.url || "аудіо не збережено")}</span>`}
    </div>
  `).join("");
}

function renderOrderCommunicationHub() {
  const settings = communicatorSettings();
  const activeOrderId = activeCallMeta?.orderId || "";
  const customerQuestions = [...(state.marketplaceCustomerQuestions || [])].sort((first, second) => String(second.updatedAt || second.createdAt || "").localeCompare(String(first.updatedAt || first.createdAt || "")));
  const serviceThreads = [...(state.marketplaceServiceThreads || [])].sort((first, second) => String(second.updatedAt || second.createdAt || "").localeCompare(String(first.updatedAt || first.createdAt || "")));
  const communicationFilter = marketplaceCommunicationFilter();
  const selectedQuestionType = MARKETPLACE_CUSTOMER_QUESTION_TYPES.some(([type]) => type === communicationFilter.questionType)
    ? communicationFilter.questionType
    : "order_question";
  const selectedQuestionLabel = marketplaceCustomerQuestionTypeLabel(selectedQuestionType);
  const visibleCustomerQuestions = customerQuestions.filter((item) => item.sourceType === selectedQuestionType);
  const openCustomerQuestions = customerQuestions.filter((item) => !["answered", "archived", "closed"].includes(item.status)).length;
  const openServiceThreads = serviceThreads.filter((item) => !["answered", "archived", "closed"].includes(item.status)).length;
  return `
    <section class="panel section-band communication-hub">
      <div class="split">
        <div>
          <h2>2.5 Комунікація з покупцями по замовленнях</h2>
          <p class="small muted">Питання покупців до і після замовлення, відповіді через маркетплейс, Viber, дзвінки, записи розмов і історія контакту.</p>
        </div>
        <div class="workflow-summary no-print">
          <span class="pill ${openCustomerQuestions ? "warn" : "good"}">${openCustomerQuestions} питань</span>
          <span class="pill ${openServiceThreads ? "warn" : "good"}">${openServiceThreads} ROZETKA</span>
          <span class="pill ${settings.viber.enabled ? "good" : "warn"}">Viber ${settings.viber.enabled ? "увімкнено" : "вимкнено"}</span>
          <span class="pill ${settings.callRecording.enabled ? "good" : "warn"}">Запис ${settings.callRecording.enabled ? "увімкнено" : "вимкнено"}</span>
          <span class="pill info">${state.callRecordings.length} записів</span>
        </div>
      </div>
      <p class="notice small">Rozetka API: питання покупців завантажуються через <code>/messages/search</code>, відповідь покупцю може йти через <code>/messages/create</code>; звернення Call Center та комунікація з ROZETKA підтягуються окремо. Viber у тестовому режимі фіксується локально.</p>
      <div class="grid two marketplace-communication-blocks">
        <article class="api-box">
          <div class="split">
            <h3>Переписка з клієнтами</h3>
            <span class="pill ${openCustomerQuestions ? "warn" : "good"}">${customerQuestions.length} рядків</span>
          </div>
          ${renderMarketplaceCustomerQuestionTypeCards(customerQuestions, selectedQuestionType)}
          <div class="communication-list-head" data-marketplace-question-list>
            <div>
              <strong>${escapeHtml(selectedQuestionLabel)}</strong>
              <span class="small muted">Клікніть рядок або кнопку «Відповісти», щоб відкрити форму відповіді через маркетплейс.</span>
            </div>
            <span class="pill info">${visibleCustomerQuestions.length}/${customerQuestions.length}</span>
          </div>
          <div class="table-wrap compact-table">
            <table>
              <thead><tr><th>Блок</th><th>Маркетплейс</th><th>Замовлення / покупець</th><th>Питання</th><th>Статус</th><th>Дії</th></tr></thead>
              <tbody>${renderMarketplaceCustomerQuestionRows(visibleCustomerQuestions)}</tbody>
            </table>
          </div>
        </article>
        <article class="api-box">
          <div class="split">
            <h3>Переписка з ROZETKA</h3>
            <span class="pill ${openServiceThreads ? "warn" : "good"}">${serviceThreads.length} рядків</span>
          </div>
          <p class="small muted">Окремий блок для питань до маркетплейсу: API, модерація, кабінет продавця, звернення служб підтримки та статуси запитів. Клікніть рядок або кнопку «Відповісти».</p>
          <div class="table-wrap compact-table">
            <table>
              <thead><tr><th>Маркетплейс</th><th>Тема</th><th>Статус</th><th>Менеджер</th><th>Дії</th></tr></thead>
              <tbody>${renderMarketplaceServiceThreadRows(serviceThreads)}</tbody>
            </table>
          </div>
        </article>
      </div>
      <div class="api-box marketplace-template-box">
        <div class="split">
          <h3>Шаблони повідомлень</h3>
          <span class="pill info">${(state.marketplaceMessageTemplates || []).length} шаблонів</span>
        </div>
        <div class="marketplace-template-list">
          ${(state.marketplaceMessageTemplates || []).map((template) => `
            <article class="comm-log-item">
              <strong>${escapeHtml(template.name)}</strong>
              <span class="small">${escapeHtml(template.text)}</span>
            </article>
          `).join("") || '<span class="small muted">Шаблонів ще немає.</span>'}
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Замовлення</th><th>Покупець</th><th>Viber</th><th>Дзвінок / запис</th><th>Наступний контакт</th><th>Історія</th></tr></thead>
          <tbody>
            ${state.marketplaceOrders.map((order) => {
              const buyer = marketplaceOrderBuyer(order);
              const topic = salesFunnelStage(order.status).reminder || (order.delivery?.ttn ? "Надіслати статус доставки" : "Погодити адресу та ТТН");
              const receiver = viberReceiver(order);
              const isRecording = activeOrderId === order.id;
              return `
                <tr>
                  <td><strong>${escapeHtml(order.externalOrderId)}</strong><br><span class="small muted">${escapeHtml(order.marketplace)} · ${marketplaceOrderStatusPill(order.status)}</span></td>
                  <td>${escapeHtml(buyer.name)}<br><span class="small muted">${escapeHtml(buyer.phone || "-")} · ${escapeHtml(buyer.email || "-")}</span></td>
                  <td>
                    <span class="small muted">Receiver: ${escapeHtml(receiver || "не задано")}</span>
                    <div class="row-actions no-print">
                      <button class="secondary" type="button" data-send-viber-order="${escapeHtml(order.id)}" ${settings.viber.enabled && receiver ? "" : "disabled"}>Viber</button>
                      <button class="ghost" type="button" data-open-viber-chat="${escapeHtml(order.id)}" ${buyer.phone ? "" : "disabled"}>Відкрити</button>
                    </div>
                  </td>
                  <td>
                    <div class="row-actions no-print">
                      <button class="secondary" type="button" data-start-call-recording="${escapeHtml(order.id)}" ${settings.callRecording.enabled && !activeCallRecorder ? "" : "disabled"}>Почати запис</button>
                      <button class="danger" type="button" data-stop-call-recording="${escapeHtml(order.id)}" ${isRecording ? "" : "disabled"}>Стоп</button>
                    </div>
                    <span class="small muted">${isRecording ? "йде запис розмови" : settings.callRecording.consentRequired ? "потрібна згода покупця" : "запис без обов'язкової позначки згоди"}</span>
                  </td>
                  <td>${escapeHtml(topic)}<br><span class="small muted">Менеджер: ${escapeHtml(order.manager || "-")}</span></td>
                  <td>
                    <div class="comm-history">
                      ${renderCommunicationHistory(order)}
                      ${renderViberHistory(order)}
                      ${renderRecordingHistory(order)}
                    </div>
                  </td>
                </tr>
              `;
            }).join("") || '<tr><td colspan="6" class="muted">Поки немає покупців для комунікації.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderStatusChangeFeed(limit = 12) {
  const orderEvents = state.marketplaceOrders.flatMap((order) => [
    { at: order.dates?.created || order.date, actor: order.manager, action: `${order.marketplace}: нове замовлення ${order.externalOrderId}` },
    order.dates?.inProgress ? { at: order.dates.inProgress, actor: order.manager, action: `${order.externalOrderId}: взято в роботу` } : null,
    order.dates?.waitingClient ? { at: order.dates.waitingClient, actor: order.manager, action: `${order.externalOrderId}: очікує підтвердження клієнта` } : null,
    order.dates?.agreed ? { at: order.dates.agreed, actor: order.manager, action: `${order.externalOrderId}: підтверджено клієнтом` } : null,
    order.dates?.upsell ? { at: order.dates.upsell, actor: order.manager, action: `${order.externalOrderId}: апсел / крос-сел` } : null,
    order.dates?.paymentWaiting ? { at: order.dates.paymentWaiting, actor: order.manager, action: `${order.externalOrderId}: очікує оплату` } : null,
    order.dates?.paid ? { at: order.dates.paid, actor: order.manager, action: `${order.externalOrderId}: оплачено` } : null,
    order.dates?.warehouse ? { at: order.dates.warehouse, actor: order.manager, action: `${order.externalOrderId}: на комплектації` } : null,
    order.dates?.picked ? { at: order.dates.picked, actor: order.manager, action: `${order.externalOrderId}: зібрано` } : null,
    order.dates?.delivery ? { at: order.dates.delivery, actor: order.manager, action: `${order.externalOrderId}: відправлено` } : null,
    order.dates?.delivered ? { at: order.dates.delivered, actor: order.manager, action: `${order.externalOrderId}: доставлено` } : null,
    order.dates?.completed ? { at: order.dates.completed, actor: order.manager, action: `${order.externalOrderId}: завершено` } : null,
    order.dates?.aftersale ? { at: order.dates.aftersale, actor: order.manager, action: `${order.externalOrderId}: Follow-up` } : null,
    order.dates?.repeat ? { at: order.dates.repeat, actor: order.manager, action: `${order.externalOrderId}: повторний продаж` } : null,
    order.dates?.cancelled ? { at: order.dates.cancelled, actor: order.manager, action: `${order.externalOrderId}: скасовано` } : null
  ].filter(Boolean));
  const publicationEvents = state.marketplacePublications.map((publication) => ({
    at: publication.lastSync || today,
    actor: publication.manager,
    action: `${publication.marketplace}: публікація ${publication.sku} — ${publication.status}`
  }));
  const events = [...orderEvents, ...publicationEvents, ...state.audit]
    .sort((first, second) => String(second.at).localeCompare(String(first.at)))
    .slice(0, limit);
  return `
    <div class="timeline">
      ${events.map((item) => `
        <div class="timeline-item">
          <strong>${escapeHtml(item.action)}</strong>
          <span class="small muted">${escapeHtml(item.at || "-")} · ${escapeHtml(item.actor || "system")}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderDashboard() {
  return renderMarketplaceFunnelBoard();
}

function renderMarketplaceSales() {
  return `
    <section class="grid three section-band">
      <article class="card metric danger"><span>Нові замовлення</span><strong>${state.marketplaceOrders.filter((order) => order.status === "new_order").length}</strong><small>Очікують дії менеджера.</small></article>
      <article class="card metric warn"><span>У русі</span><strong>${state.marketplaceOrders.filter((order) => ["in_progress", "waiting_client", "confirmed_by_client", "upsell", "waiting_payment", "picking", "picked", "shipped"].includes(order.status)).length}</strong><small>Обробка, оплата, склад або доставка.</small></article>
      <article class="card metric good"><span>Оплати</span><strong>${state.marketplaceOrders.filter((order) => order.payment?.status === "paid").length}</strong><small>Підтверджені по замовленнях.</small></article>
    </section>

    ${renderManagerSalesFunnel()}
    ${renderMarketplaceOrderProcessControl()}

    <section class="panel section-band">
      <div class="split">
        <h2>2.1 Замовлення</h2>
        <button class="primary no-print" type="button" data-open-create-marketplace-order>Створити замовлення</button>
      </div>
      <div class="dashboard-list">
        ${state.marketplaceOrders.map((order) => {
          const buyer = marketplaceOrderBuyer(order);
          const issues = marketplaceOrderMissingFields(order);
          return `
            <article class="dashboard-row clickable-row ${issues.length ? "row-has-issues" : ""}" data-edit-marketplace-order="${escapeHtml(order.id)}" title="Клікніть, щоб змінити замовлення">
              <div class="row-main">
                <span class="row-title">${order.marketplace} · ${order.externalOrderId}</span>
                <strong>${formatMoney(marketplaceOrderTotal(order), order.currency)}</strong>
              </div>
              <div class="row-main muted small">
                <span>${order.date} · ${escapeHtml(order.sku)} · ${productName(order.productId)}</span>
                <span>${escapeHtml(buyer.name)} · ${escapeHtml(buyer.phone || "-")}</span>
              </div>
              <div class="row-meta">
                ${marketplaceOrderStatusPill(order.status)}
                ${marketplacePaymentStatusPill(order.payment?.status)}
                ${renderOrderIssueCompact(order)}
              </div>
              <div class="workflow-actions no-print">
                ${renderOrderCommunicationButtons(order)}
              </div>
            </article>
          `;
        }).join("") || '<p class="muted">Поки немає замовлень маркетплейсів.</p>'}
        </div>
    </section>

    ${renderWarehouseDeliveryControl()}
    ${renderRozetkaImportedOrdersPanel()}

    <section class="panel section-band">
      <h2>2.3 Логістика з рухом замовлень</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Замовлення</th><th>Служба</th><th>Адреса</th><th>ТТН</th><th>Склад / логістика</th><th>Рух</th><th>API доставки</th><th>Зв'язок</th><th>Дії</th></tr></thead>
          <tbody>
            ${state.marketplaceOrders.map((order) => {
              const provider = deliveryProviderForOrder(order);
              return `
              <tr class="clickable-row" data-edit-marketplace-order="${escapeHtml(order.id)}" title="Клікніть, щоб змінити замовлення">
                <td><strong>${escapeHtml(order.externalOrderId)}</strong><br><span class="small muted">${escapeHtml(order.marketplace)}</span></td>
                <td>${escapeHtml(order.delivery?.service || "-")}</td>
                <td>${escapeHtml(order.delivery?.city || "-")} · ${escapeHtml(order.delivery?.warehouse || "-")}</td>
                <td>${escapeHtml(order.delivery?.ttn || "не внесено")}</td>
                <td>${renderWarehouseFlowSummary(order)}</td>
                <td>${marketplaceDeliveryStatusPill(order.delivery?.status || "new")}</td>
                <td>${escapeHtml(order.delivery?.apiStatus || "API не перевірявся")}</td>
                <td class="row-actions no-print">${renderOrderCommunicationButtons(order)}</td>
                <td class="row-actions no-print">${renderMarketplaceOrderControlActions(order)}</td>
              </tr>
              <tr>
                <td colspan="9" class="small muted">
                  ${deliveryApiProviderPill(provider)}
                  ${order.delivery?.lastCheck ? ` · перевірка ${escapeHtml(order.delivery.lastCheck)}` : ""}
                </td>
              </tr>`;
            }).join("") || '<tr><td colspan="9" class="muted">Немає логістичних рухів.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>

    ${renderSalesClientsPanel()}

    ${renderOrderCommunicationHub()}
  `;
}

function marketplaceOrderCreateForm() {
  const product = state.products[0] || {};
  const price = product.id ? productSalePrice(product, marketplacePriceTypeId()) : { amount: 0, currency: "UAH" };
  return `
    <form class="form-grid" data-action="create-marketplace-order">
      <label class="field"><span>Дата замовлення</span><input name="date" type="date" value="${today}"></label>
      <label class="field"><span>Маркетплейс</span><select name="marketplace">${marketplaceNames().map((name) => option(name, name, false)).join("")}</select></label>
      <label class="field"><span>ID замовлення</span><input name="externalOrderId" placeholder="заповниться автоматично"></label>
      <label class="field"><span>Статус</span><select name="status">${marketplaceOrderStatusOptions("new_order")}</select></label>
      <label class="field"><span>Менеджер</span><select name="manager">${employeeOptions(state.currentManager)}</select></label>
      <label class="field wide"><span>Товар</span><select name="productId">${state.products.map((item) => option(item.id, `${item.brand} ${item.model}`, item.id === product.id)).join("")}</select></label>
      <label class="field"><span>SKU</span><input name="sku" value="${escapeHtml(product.supplierSku || product.internalCode || "")}" placeholder="SKU маркетплейсу"></label>
      <label class="field"><span>Кількість</span><input name="qty" type="number" min="1" value="1"></label>
      <label class="field"><span>Ціна</span><input name="price" inputmode="decimal" value="${escapeHtml(price.amount || product.price || 0)}"></label>
      <label class="field"><span>Валюта</span><select name="currency">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === (price.currency || product.currency || "UAH"))).join("")}</select></label>
      <label class="field"><span>Покупець</span><input name="buyerName" required placeholder="ПІБ покупця"></label>
      <label class="field"><span>Телефон</span><input name="buyerPhone" required placeholder="+380..."></label>
      <label class="field"><span>Email</span><input name="buyerEmail" placeholder="email покупця"></label>
      <label class="field"><span>ЄДРПОУ / ІПН</span><input name="buyerEdrpou" placeholder="за наявності"></label>
      <label class="field full"><span>Адреса покупця</span><input name="buyerAddress" placeholder="адреса або коментар до доставки"></label>
      <label class="field"><span>Служба доставки</span><select name="deliveryService">${variantOptions("delivery", "Нова пошта")}</select></label>
      <label class="field"><span>Місто</span><input name="deliveryCity" placeholder="місто"></label>
      <label class="field"><span>Відділення</span><input name="deliveryWarehouse" placeholder="відділення / поштомат"></label>
      <label class="field"><span>ТТН</span><input name="deliveryTtn" placeholder="можна додати пізніше"></label>
      <label class="field"><span>Статус доставки</span><select name="deliveryStatus">${deliveryStatusOptions("new")}</select></label>
      <label class="field"><span>Статус оплати</span><select name="paymentStatus">${["expected", "pending", "paid", "failed"].map((status) => option(status, marketplacePaymentStatusPill(status).replace(/<[^>]+>/g, ""), status === "expected")).join("")}</select></label>
      <label class="field"><span>Сума оплати</span><input name="paymentAmount" inputmode="decimal" placeholder="якщо відрізняється від суми замовлення"></label>
      <label class="field"><span>Метод оплати</span><input name="paymentMethod" value="Маркетплейс"></label>
      <label class="field"><span>Джерело оплати</span><input name="paymentSource" value="Ручне замовлення CRM"></label>
      <p class="notice small full">Після створення CRM автоматично створить/оновить клієнта, призначить менеджера і поставить замовлення у воронку контролю часу.</p>
      <button class="primary" type="submit">Створити замовлення</button>
    </form>
  `;
}

function openCreateMarketplaceOrderForm() {
  if (!state.products.length) return alert("Спочатку створіть товар у каталозі.");
  openModal("Створити замовлення вручну", marketplaceOrderCreateForm());
}

function orderCommunicationReceiverMap(order) {
  return {
    phone: communicationReceiver(order, "phone"),
    ip_telephony: communicationReceiver(order, "phone"),
    viber: communicationReceiver(order, "viber"),
    sms: communicationReceiver(order, "sms"),
    email: communicationReceiver(order, "email"),
    whatsapp: communicationReceiver(order, "whatsapp"),
    telegram: communicationReceiver(order, "telegram")
  };
}

function syncCommunicationReceiver(form) {
  const order = byId(state.marketplaceOrders, form?.elements.orderId?.value);
  if (!order || !form?.elements.receiver) return;
  const channel = form.elements.channel?.value || "";
  form.elements.receiver.value = orderCommunicationReceiverMap(order)[channel] || "";
}

function openOrderCallbackForm(id) {
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  if (!canContactMarketplaceBuyer()) return alert("Поточна роль не має права комунікувати з покупцем.");
  const buyer = marketplaceOrderBuyer(order);
  const receiver = communicationReceiver(order, "phone");
  openModal(`Передзвонити · ${order.externalOrderId}`, `
    <form class="form-grid" data-action="order-callback" data-order-communication-form>
      <input type="hidden" name="orderId" value="${escapeHtml(order.id)}">
      <label class="field"><span>Комунікатор</span><select name="channel" data-communication-channel>${communicatorOptions(order, "call", "phone")}</select></label>
      <label class="field"><span>Кому дзвонити</span><input name="receiver" value="${escapeHtml(receiver)}" required></label>
      <label class="field"><span>Запис розмови</span><select name="recordCall">${option("false", "не записувати", true)}${option("true", "почати запис", false)}</select></label>
      <label class="field"><span>Відкрити додаток</span><select name="openExternal">${option("true", "так", true)}${option("false", "тільки записати в CRM", false)}</select></label>
      <label class="field full"><span>Коментар менеджера</span><textarea name="note" placeholder="тема дзвінка, домовленість, причина повторного контакту">Передзвонити покупцю ${escapeHtml(buyer.name || "")} по замовленню ${escapeHtml(order.externalOrderId)}.</textarea></label>
      <button class="primary" type="submit">Передзвонити</button>
    </form>
  `);
}

function openOrderMessageForm(id) {
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  if (!canContactMarketplaceBuyer()) return alert("Поточна роль не має права комунікувати з покупцем.");
  const receiver = communicationReceiver(order, "viber") || communicationReceiver(order, "sms") || communicationReceiver(order, "email");
  openModal(`Написати покупцю · ${order.externalOrderId}`, `
    <form class="form-grid" data-action="order-message" data-order-communication-form>
      <input type="hidden" name="orderId" value="${escapeHtml(order.id)}">
      <label class="field"><span>Комунікатор</span><select name="channel" data-communication-channel>${communicatorOptions(order, "message", "viber")}</select></label>
      <label class="field"><span>Одержувач</span><input name="receiver" value="${escapeHtml(receiver)}" required></label>
      <label class="field"><span>Відкрити додаток</span><select name="openExternal">${option("false", "тільки записати в CRM", true)}${option("true", "відкрити додаток", false)}</select></label>
      <label class="field full"><span>Повідомлення</span><textarea name="message" required>${escapeHtml(orderDefaultMessage(order))}</textarea></label>
      <button class="primary" type="submit">Написати повідомлення</button>
    </form>
  `);
}

function defaultMarketplaceReplyText(item) {
  const preferred = (state.marketplaceMessageTemplates || []).find((template) => {
    if (item.sourceType === "return_request") return template.name.toLowerCase().includes("повер");
    if (item.sourceType === "seller_question") return template.name.toLowerCase().includes("товар");
    return template.name.toLowerCase().includes("замов");
  }) || (state.marketplaceMessageTemplates || [])[0];
  return fillMarketplaceReplyTemplate(preferred?.text || "", item);
}

function openMarketplaceQuestionReply(id) {
  const question = byId(state.marketplaceCustomerQuestions || [], id);
  if (!question) return;
  if (!canContactMarketplaceBuyer() || !canCreateDocument("marketplaceCustomerQuestions")) return alert("Поточна роль не має права відповідати на питання маркетплейсу.");
  openModal(`Відповідь через ${question.marketplace} · ${marketplaceCustomerQuestionTypeLabel(question.sourceType)}`, `
    <form class="form-grid" data-action="reply-marketplace-question">
      <input type="hidden" name="questionId" value="${escapeHtml(question.id)}">
      <div class="notice small full">
        <strong>${escapeHtml(question.subject || "Питання")}</strong><br>
        ${escapeHtml(question.message || "")}<br>
        <span class="muted">${escapeHtml(question.externalOrderId || "без замовлення")} · ${escapeHtml(question.buyerName || "покупець")}</span>
      </div>
      <label class="field"><span>Шаблон</span><select name="templateId">${option("", "без шаблону", true)}${marketplaceQuestionTemplateOptions()}</select></label>
      <label class="field"><span>Дія API</span><select name="sendApi">${option("false", "записати в CRM", true)}${option("true", "відправити через Rozetka API /messages/create")}</select></label>
      <label class="field"><span>Email покупцю</span><select name="sendEmailUser">${option("0", "ні", true)}${option("1", "так")}</select></label>
      <label class="field"><span>Статус після відповіді</span><select name="status">${option("answered", "відповіли", true)}${option("waiting_customer", "очікує клієнта")}${option("waiting_marketplace", "очікує маркетплейс")}${option("archived", "архів")}</select></label>
      <label class="field full"><span>Відповідь менеджера</span><textarea name="answer" required>${escapeHtml(question.answer || defaultMarketplaceReplyText(question))}</textarea></label>
      <button class="primary" type="submit">Зберегти / відправити через маркетплейс</button>
    </form>
  `);
}

function openMarketplaceThreadReply(id) {
  const thread = byId(state.marketplaceServiceThreads || [], id);
  if (!thread) return;
  if (!canContactMarketplaceBuyer() || !canCreateDocument("marketplaceServiceThreads")) return alert("Поточна роль не має права відповідати маркетплейсу.");
  openModal(`Переписка з ${thread.marketplace}`, `
    <form class="form-grid" data-action="reply-marketplace-thread">
      <input type="hidden" name="threadId" value="${escapeHtml(thread.id)}">
      <div class="notice small full">
        <strong>${escapeHtml(thread.subject || "Звернення")}</strong><br>
        ${escapeHtml(thread.message || "")}<br>
        <span class="muted">${escapeHtml(thread.externalId || thread.requestId || "")}</span>
      </div>
      <label class="field"><span>Статус після відповіді</span><select name="status">${option("waiting_marketplace", "очікує маркетплейс", true)}${option("answered", "відповіли")}${option("closed", "закрито")}</select></label>
      <label class="field full"><span>Коментар / відповідь менеджера</span><textarea name="answer" required>${escapeHtml(thread.answer || "")}</textarea></label>
      <button class="primary" type="submit">Зберегти відповідь</button>
    </form>
  `);
}

function renderWarehouseFlowSummary(order) {
  const flow = order.warehouseFlow || {};
  const items = [
    ["Склад отримав", flow.warehouseSentAt, flow.warehouseSentBy],
    ["Відбірка ОК", flow.pickingConfirmedAt, flow.pickingConfirmedBy],
    ["Передано логісту", flow.deliveryHandoverAt, flow.deliveryHandoverBy],
    ["Логіст прийняв", flow.logisticsAcceptedAt, flow.logisticsAcceptedBy]
  ];
  return `
    <div class="small muted">
      ${items.map(([label, at, by]) => `<div><strong>${escapeHtml(label)}:</strong> ${escapeHtml(at || "очікує")}${by ? ` · ${escapeHtml(by)}` : ""}</div>`).join("")}
    </div>
  `;
}

function renderDeliveryApiSettingsSummary() {
  const settings = deliveryApiSettings();
  return Object.values(settings).map((provider) => deliveryApiProviderPill(provider)).join("");
}

function renderWarehouseDeliveryOrderRows(orders) {
  if (!orders.length) return '<p class="muted small">Немає замовлень у цьому стані.</p>';
  return orders.map((order) => {
    const buyer = marketplaceOrderBuyer(order);
    const issues = marketplaceOrderMissingFields(order);
    return `
      <article class="dashboard-row compact clickable-row ${issues.length ? "row-has-issues" : ""}" data-edit-marketplace-order="${escapeHtml(order.id)}">
        <div>
          <strong>${escapeHtml(order.externalOrderId || order.id)}</strong>
          <p class="small muted">${escapeHtml(order.marketplace || "")} · ${escapeHtml(buyer.name || "покупець")} · ${formatMoney(marketplaceOrderTotal(order), order.currency)}</p>
          ${renderWarehouseFlowSummary(order)}
        </div>
        <div>
          ${marketplaceOrderStatusPill(order.status)}
          ${marketplaceDeliveryStatusPill(order.delivery?.status || "new")}
          <p class="small muted">${escapeHtml(order.delivery?.service || "служба не вказана")} · ${escapeHtml(order.delivery?.ttn || "ТТН не внесено")}</p>
          ${renderOrderIssueCompact(order)}
        </div>
        ${renderMarketplaceOrderControlActions(order)}
      </article>
    `;
  }).join("");
}

function renderWarehouseDeliveryControl() {
  const orders = state.marketplaceOrders || [];
  const picking = orders.filter((order) => normalizeMarketplaceOrderStatus(order.status) === "picking");
  const handover = orders.filter((order) => normalizeMarketplaceOrderStatus(order.status) === "picked" && !["warehouse_handover", "logistics_accepted", "sent_to_delivery", "in_transit", "arrived_branch", "delivered"].includes(order.delivery?.status || ""));
  const logistics = orders.filter((order) => normalizeMarketplaceOrderStatus(order.status) === "picked" && (order.delivery?.status || "") === "warehouse_handover");
  const tracking = orders.filter((order) => ["shipped", "delivered"].includes(normalizeMarketplaceOrderStatus(order.status)) || ["logistics_accepted", "sent_to_delivery", "in_transit", "arrived_branch", "delivery_problem"].includes(order.delivery?.status || ""));
  return `
    <section class="panel section-band" data-print-area="warehouseDelivery" data-print-title="Склад і відбірка замовлень">
      <div class="split">
        <div>
          <h2>2.2 Склад і відбірка замовлень</h2>
          <p class="muted small">Операційний контроль відбірки, передачі логісту, підтвердження логіста і відстеження ТТН.</p>
        </div>
        <div class="status-legend no-print">${renderDeliveryApiSettingsSummary()}</div>
      </div>
      <div class="grid two">
        <article class="card stack">
          <div class="split"><strong>Відбірка завскладом</strong><span class="pill info">${picking.length}</span></div>
          ${renderWarehouseDeliveryOrderRows(picking)}
        </article>
        <article class="card stack">
          <div class="split"><strong>Передати логісту</strong><span class="pill warn">${handover.length}</span></div>
          ${renderWarehouseDeliveryOrderRows(handover)}
        </article>
        <article class="card stack">
          <div class="split"><strong>Підтвердження логіста</strong><span class="pill warn">${logistics.length}</span></div>
          ${renderWarehouseDeliveryOrderRows(logistics)}
        </article>
        <article class="card stack">
          <div class="split"><strong>Трекінг доставки</strong><span class="pill info">${tracking.length}</span></div>
          ${renderWarehouseDeliveryOrderRows(tracking)}
        </article>
      </div>
    </section>
  `;
}

function renderMarketplaceProducts() {
  const stockRows = inventoryRows();
  const tableFilters = productTableFilters();
  const visibleProducts = state.products.filter((product) => productTableMatchesName(product, tableFilters.catalog));
  const visibleStockRows = stockRows.filter((row) => productTableMatchesName(row, tableFilters.stock));
  const visiblePublications = state.marketplacePublications.filter((publication) => productTableMatchesName(publication, tableFilters.publications));
  return `
    <section class="grid three section-band">
      <article class="card metric info"><span>Товари</span><strong>${state.products.length}</strong><small>Внутрішній каталог для каналів.</small></article>
      <article class="card metric good"><span>Залишок</span><strong>${stockRows.reduce((sum, row) => sum + Number(row.qty || 0), 0)}</strong><small>Усі доступні складські одиниці.</small></article>
      <article class="card metric warn"><span>Публікації до синхронізації</span><strong>${state.marketplacePublications.filter((publication) => publication.status !== "published").length}</strong><small>Потрібен обмін з каналами.</small></article>
    </section>

    ${renderMarketplacePublicationControl()}

    <section class="panel section-band">
      <div class="split">
        <h2>3.1 Каталог</h2>
        <button class="primary no-print" type="button" data-open-create-product>Створити товар</button>
      </div>
      ${renderProductTableSearch("catalog", "назва, бренд, модель або код", visibleProducts.length, state.products.length)}
      <div class="table-wrap">
        <table>
          <thead><tr><th>Товар</th><th>Категорія</th><th>Коди</th><th>Ціна</th><th>Публікації</th></tr></thead>
          <tbody>
            ${state.products.map((product) => `
              <tr class="clickable-row" data-product-table-row="catalog" data-product-search-text="${escapeHtml(productTableSearchText(product))}" data-open-product="${escapeHtml(product.id)}" title="Клікніть, щоб змінити товар" ${productTableMatchesName(product, tableFilters.catalog) ? "" : 'style="display: none;"'}>
                <td><strong>${escapeHtml(productLabel(product))}</strong><br><span class="small muted">${product.type === "weapon" ? "серійний товар" : "кількісний товар"}</span></td>
                <td>${escapeHtml(product.category || "-")}</td>
                <td>${productCodes(product)}</td>
                <td>${formatMoney(product.price, product.currency)}</td>
                <td>${state.marketplacePublications.filter((publication) => publication.productId === product.id).length}</td>
              </tr>
            `).join("")}
            ${state.products.length ? "" : '<tr><td colspan="5" class="muted">Немає товарів.</td></tr>'}
            <tr data-product-table-empty="catalog" ${visibleProducts.length || !state.products.length ? 'style="display: none;"' : ""}><td colspan="5" class="muted">За назвою нічого не знайдено.</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel section-band">
      <h2>3.2 Залишки на складі</h2>
      ${renderProductTableSearch("stock", "назва товару або код", visibleStockRows.length, stockRows.length)}
      <div class="table-wrap">
        <table>
          <thead><tr><th>Товар</th><th>Склад</th><th>Фірма</th><th>Кількість</th><th>Вартість</th></tr></thead>
          <tbody>
            ${stockRows.map((row) => `
              <tr class="clickable-row" data-product-table-row="stock" data-product-search-text="${escapeHtml(productTableSearchText(row))}" data-open-product="${escapeHtml(row.product?.id || row.productId)}" title="Клікніть, щоб змінити товар" ${productTableMatchesName(row, tableFilters.stock) ? "" : 'style="display: none;"'}>
                <td>${escapeHtml(productName(row.product?.id || row.productId))}</td>
                <td>${warehouseName(row.warehouseId)}</td>
                <td>${firmName(row.firmId || "vat")}</td>
                <td>${row.qty}</td>
                <td>${formatMoney(row.valueUAH)}</td>
              </tr>
            `).join("") || '<tr><td colspan="5" class="muted">Немає залишків.</td></tr>'}
            <tr data-product-table-empty="stock" ${visibleStockRows.length || !stockRows.length ? 'style="display: none;"' : ""}><td colspan="5" class="muted">За назвою нічого не знайдено.</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel section-band">
      <div class="split">
        <h2>3.3 Публікації</h2>
        <button class="primary no-print" type="button" data-open-create-publication>Створити публікацію</button>
      </div>
      ${renderProductTableSearch("publications", "назва товару, назва публікації або SKU", visiblePublications.length, state.marketplacePublications.length)}
      <div class="table-wrap">
        <table>
          <thead><tr><th>Маркетплейс</th><th>SKU / ID</th><th>Товар</th><th>Категорія / фільтри</th><th>Ціна</th><th>Залишок каналу</th><th>Статус</th><th>Готовність</th><th>Дії</th></tr></thead>
          <tbody>
            ${state.marketplacePublications.map((publication) => {
              const readiness = marketplacePublicationReadiness(publication);
              return `
                <tr class="clickable-row ${readiness.issues.length ? "row-has-issues" : ""}" data-product-table-row="publications" data-product-search-text="${escapeHtml(productTableSearchText(publication))}" data-edit-publication="${escapeHtml(publication.id)}" title="Клікніть, щоб змінити публікацію" ${productTableMatchesName(publication, tableFilters.publications) ? "" : 'style="display: none;"'}>
                  <td><strong>${publication.marketplace}</strong><br><span class="small muted">${publication.manager || "-"}</span></td>
                  <td>${publication.sku}<br><span class="small muted">${publication.externalId || "-"}</span></td>
                  <td>${escapeHtml(productName(publication.productId))}</td>
                  <td>${publicationMarketplaceRequirementsSummary(publication)}</td>
                  <td>${formatMoney(publication.price, publication.currency)}</td>
                  <td>${publication.stockQty ?? "-"}</td>
                  <td>${statusPill(publication.status)}<br><span class="small muted">фото: ${publication.photosStatus || "-"}</span></td>
                  <td>${renderPublicationIssueCompact(publication)}</td>
                  <td class="row-actions no-print">
                    <button class="ghost" type="button" data-edit-publication="${escapeHtml(publication.id)}" ${canEditMarketplacePublication() ? "" : "disabled"}>Редагувати</button>
                    <button class="secondary" type="button" data-sync-publication="${escapeHtml(publication.id)}">Синхронізувати</button>
                  </td>
                </tr>
              `;
            }).join("") || '<tr><td colspan="9" class="muted">Немає публікацій.</td></tr>'}
            <tr data-product-table-empty="publications" ${visiblePublications.length || !state.marketplacePublications.length ? 'style="display: none;"' : ""}><td colspan="9" class="muted">За назвою нічого не знайдено.</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderMarketplaceAnalytics() {
  const rows = state.marketplaceStats.map((row) => {
    const revenue = uah(Number(row.price || 0) * Number(row.sold || 0), row.currency);
    const cost = Number(row.sold || 0) * uah(row.cost, row.costCurrency);
    const expenses = Number(row.commission || 0) + Number(row.logistics || 0) + Number(row.otherCosts || 0);
    const profit = revenue - cost - expenses;
    const margin = revenue ? (profit / revenue) * 100 : 0;
    return { ...row, revenue, cost, expenses, profit, margin };
  });
  return `
    <section class="grid four section-band">
      <article class="card metric good"><span>Виторг</span><strong>${formatMoney(rows.reduce((sum, row) => sum + row.revenue, 0))}</strong><small>Продажі за каналами.</small></article>
      <article class="card metric warn"><span>Комісії та логістика</span><strong>${formatMoney(rows.reduce((sum, row) => sum + row.expenses, 0))}</strong><small>Витрати маркетплейсів.</small></article>
      <article class="card metric info"><span>Собівартість</span><strong>${formatMoney(rows.reduce((sum, row) => sum + row.cost, 0))}</strong><small>За проданими SKU.</small></article>
      <article class="card metric danger"><span>Прибуток</span><strong>${formatMoney(rows.reduce((sum, row) => sum + row.profit, 0))}</strong><small>Після комісій і собівартості.</small></article>
    </section>

    <section class="panel section-band">
      <h2>4. Аналітика та звіти</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Маркетплейс</th><th>SKU</th><th>Продано</th><th>Виторг</th><th>Комісія</th><th>Логістика</th><th>Собівартість</th><th>Прибуток</th><th>Маржа</th></tr></thead>
          <tbody>
            ${rows.map((row) => `
              <tr class="clickable-row" data-open-product="${escapeHtml(row.productId || "")}" title="Клікніть, щоб відкрити товар">
                <td>${row.marketplace}</td>
                <td>${row.sku}<br><span class="small muted">${productName(row.productId)}</span></td>
                <td>${row.sold}</td>
                <td>${formatMoney(row.revenue)}</td>
                <td>${formatMoney(row.commission)}</td>
                <td>${formatMoney(row.logistics)}</td>
                <td>${formatMoney(row.cost)}</td>
                <td>${formatMoney(row.profit)}</td>
                <td>${row.margin.toFixed(1)}%</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderMarketplaceFinance() {
  const canPayment = canTrackMarketplacePayment();
  const canManualPayment = canCreateDocument("payment") && canEditField("payment");
  const settlementRows = marketplaceNames().map((name) => {
    const rows = state.marketplaceStats.filter((row) => row.marketplace === name);
    const revenue = rows.reduce((sum, row) => sum + uah(Number(row.price || 0) * Number(row.sold || 0), row.currency), 0);
    const deductions = rows.reduce((sum, row) => sum + Number(row.commission || 0) + Number(row.logistics || 0) + Number(row.otherCosts || 0), 0);
    return { name, revenue, deductions, payout: revenue - deductions };
  });
  return `
    <section class="panel section-band">
      <h2>5.1 Оплати за замовлення</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Замовлення</th><th>Маркетплейс</th><th>Покупець</th><th>Метод</th><th>Сума</th><th>Статус</th><th>API</th><th>Дії</th></tr></thead>
          <tbody>
            ${state.marketplaceOrders.map((order) => {
              const buyer = marketplaceOrderBuyer(order);
              const canPayOrder = order.status !== "cancelled" && order.payment?.status !== "paid";
              return `
                <tr class="clickable-row" data-edit-marketplace-order="${escapeHtml(order.id)}" title="Клікніть, щоб змінити замовлення">
                  <td><strong>${order.externalOrderId}</strong><br><span class="small muted">${order.date}</span></td>
                  <td>${order.marketplace}</td>
                  <td>${escapeHtml(buyer.name)}</td>
                  <td>${escapeHtml(order.payment?.method || "-")}</td>
                  <td>${formatMoney(order.payment?.amount || marketplaceOrderTotal(order), order.currency)}</td>
                  <td>${marketplacePaymentStatusPill(order.payment?.status)}</td>
                  <td>${escapeHtml(order.payment?.apiStatus || "API не перевірявся")}</td>
                  <td class="row-actions no-print">
                    ${renderOrderCommunicationButtons(order)}
                    <button class="ghost" data-edit-marketplace-order="${escapeHtml(order.id)}">Відкрити</button>
                    <button class="secondary" data-pull-marketplace-payment="${escapeHtml(order.id)}" ${canPayment && canPayOrder ? "" : "disabled"}>Оплатити</button>
                    <button class="secondary" data-open-marketplace-payment="${escapeHtml(order.id)}" ${canManualPayment && canPayOrder ? "" : "disabled"}>Створити оплату</button>
                  </td>
                </tr>
              `;
            }).join("") || '<tr><td colspan="8" class="muted">Поки немає оплат за замовлення.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel section-band">
      <h2>5.2 Розрахунки із маркетплейсами</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Маркетплейс</th><th>Виторг</th><th>Утримання</th><th>Очікувана виплата</th><th>Стан</th></tr></thead>
          <tbody>
            ${settlementRows.map((row) => `
              <tr>
                <td><strong>${row.name}</strong></td>
                <td>${formatMoney(row.revenue)}</td>
                <td>${formatMoney(row.deductions)}</td>
                <td>${formatMoney(row.payout)}</td>
                <td>${row.revenue ? '<span class="pill warn">звірити акт</span>' : '<span class="pill info">немає продажів</span>'}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function dataExchangeState() {
  const settings = state.settings.dataExchange || {};
  const defaults = seedState.settings.dataExchange;
  return {
    ...clone(defaults),
    ...settings,
    marketplaceIds: Array.isArray(settings.marketplaceIds) ? settings.marketplaceIds : clone(defaults.marketplaceIds),
    marketplaceData: Array.isArray(settings.marketplaceData) ? settings.marketplaceData : clone(defaults.marketplaceData),
    basData: Array.isArray(settings.basData) ? settings.basData : clone(defaults.basData),
    oneCConnection: {
      ...clone(defaults.oneCConnection),
      ...(settings.basConnection || {}),
      ...(settings.oneCConnection || {})
    }
  };
}

function exchangeCheckboxGroup(name, items, selected, disabled = "") {
  const selectedSet = new Set(selected || []);
  return `
    <div class="exchange-check-grid">
      ${items.map(([value, label]) => `
        <label class="check-tile">
          <input type="checkbox" name="${escapeHtml(name)}" value="${escapeHtml(value)}" ${selectedSet.has(value) ? "checked" : ""} ${disabled}>
          <span>${escapeHtml(label)}</span>
        </label>
      `).join("")}
    </div>
  `;
}

function renderMarketplaceCapabilityMatrix() {
  return `
    <div class="exchange-capabilities full">
      <div class="split">
        <h3>Можливості обміну з маркетплейсами</h3>
        <span class="pill info">перевірено по API</span>
      </div>
      <div class="table-wrap compact-table">
        <table>
          <thead>
            <tr>
              <th>Маркетплейс</th>
              <th>Дані</th>
              <th>Напрям</th>
              <th>Важливо</th>
            </tr>
          </thead>
          <tbody>
            ${DATA_EXCHANGE_MARKETPLACE_CAPABILITIES.map((item) => `
              <tr>
                <td><strong>${escapeHtml(item.marketplace)}</strong></td>
                <td>${escapeHtml(item.exchange)}</td>
                <td>${escapeHtml(item.direction)}</td>
                <td>${escapeHtml(item.note)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function oneCExchangeMetrics() {
  const shipments = state.marketplaceOrders.filter((order) => (
    order.delivery?.ttn
    || ["shipped", "delivered", "completed", "follow_up", "repeat_sale"].includes(normalizeMarketplaceOrderStatus(order.status))
  ));
  const receivables = state.invoices.filter((invoice) => invoiceDebt(invoice) > 0);
  return [
    ["products", "Товари", state.products.length, "номенклатура, коди, штрихкоди"],
    ["clients", "Клієнти", state.clients.length, "контрагенти та контакти"],
    ["orders", "Замовлення", state.marketplaceOrders.length, "маркетплейси → 1C"],
    ["shipments", "Відвантаження", shipments.length, "ТТН і статус доставки"],
    ["payments", "Оплати", state.payments.length, "каса, банк, маркетплейси"],
    ["receivables", "Дебіторка", receivables.length, "непогашений борг клієнтів"],
    ["payables", "Кредиторка", (state.payables || []).length, "борги постачальникам"],
    ["stock", "Залишки", inventoryRows().length, "склади, фірми, кількість"]
  ];
}

function renderOneCConnectionFields(settings, disabled = "") {
  const connection = settings.oneCConnection || {};
  return `
    <div class="onec-connection-grid full">
      <label class="field"><span>Система</span><select name="oneCSystem" ${disabled}>
        ${option("1c_utp_ukraine_1_2", "1C УТП Україна 1.2", connection.system === "1c_utp_ukraine_1_2")}
        ${option("bas_baf", "BAS / BAF", connection.system === "bas_baf")}
      </select></label>
      <label class="field"><span>Режим обміну</span><select name="oneCTransport" ${disabled}>
        ${option("file_json", "Файловий JSON через VPN/RDP", connection.transport !== "http_bridge")}
        ${option("http_bridge", "HTTP-шлюз у внутрішній мережі", connection.transport === "http_bridge")}
      </select></label>
      <label class="field"><span>Сервер 1C</span><input name="oneCServer" value="${escapeHtml(connection.server || "")}" placeholder="192.168.0.5" ${disabled}></label>
      <label class="field"><span>Інфобаза</span><input name="oneCInfobase" value="${escapeHtml(connection.infobase || "")}" placeholder="pp_hor" ${disabled}></label>
      <label class="field wide"><span>HTTP endpoint майбутнього шлюзу</span><input name="oneCEndpoint" value="${escapeHtml(connection.endpoint || "")}" placeholder="http://192.168.0.5/arms-crm/exchange" ${disabled}></label>
      <label class="field"><span>Формат</span><select name="oneCFormat" ${disabled}>
        ${option("json", "JSON", connection.format !== "xml")}
        ${option("xml", "XML", connection.format === "xml")}
      </select></label>
      <label class="field"><span>Логін 1C/API</span><input name="oneCLogin" value="${escapeHtml(connection.login || "")}" autocomplete="username" ${disabled}></label>
      <label class="field"><span>Пароль 1C/API</span><input name="oneCPassword" type="password" placeholder="${connection.password ? "залишити порожнім, щоб не змінювати" : ""}" autocomplete="current-password" ${disabled}></label>
    </div>
  `;
}

function renderOneCExchangeStatus(settings) {
  const connection = settings.oneCConnection || {};
  const metrics = oneCExchangeMetrics();
  return `
    <div class="onec-status-grid full">
      ${metrics.map(([key, label, value, hint]) => `
        <article class="exchange-status-card ${settings.basData?.includes(key) || settings.mode !== "selective" ? "" : "muted-card"}">
          <strong>${escapeHtml(label)}</strong>
          <span class="metric-number">${escapeHtml(value)}</span>
          <small>${escapeHtml(hint)}</small>
        </article>
      `).join("")}
    </div>
    <div class="exchange-progress full" data-progress-status="${escapeHtml(connection.lastStatus || "draft")}">
      <div class="split">
        <strong>Стан 1C-обміну</strong>
        ${statusPill(connection.lastStatus || "draft")}
      </div>
      <div class="progress-track"><div class="progress-bar" style="width: ${connection.lastStatus === "imported" ? 100 : connection.lastStatus === "exported" ? 65 : connection.lastStatus === "error" ? 100 : 20}%"></div></div>
      <span class="small muted">${escapeHtml(connection.lastMessage || "Файловий JSON готовий. HTTP-шлюз можна підключити після публікації обробки у внутрішній мережі.")}</span>
      <span class="small muted">Останній експорт: ${escapeHtml(connection.lastExport || "ще не було")} · останній імпорт: ${escapeHtml(connection.lastImport || "ще не було")}</span>
    </div>
  `;
}

function renderOneCTools(settings, canManage) {
  const disabled = canManage ? "" : "disabled";
  return `
    <div class="onec-tools" data-onec-exchange-tools ${settings.channel === "bas" ? "" : "hidden"}>
      <section class="panel section-band">
        <div class="split">
          <h3>1C JSON-пакет</h3>
          <span class="pill info">файл зараз, HTTP після шлюзу</span>
        </div>
        <div class="inline-actions">
          <button class="secondary" type="button" data-export-onec-package ${disabled}>Експорт пакета 1C</button>
          <button class="primary" type="button" data-import-onec-latest ${disabled}>Імпорт з папки ToCRM</button>
          <button class="primary" type="button" data-import-onec-sql ${disabled}>Імпорт із SQL</button>
          <button class="ghost" type="button" data-toggle-onec-auto-import ${disabled}>${oneCAutoImportEnabled ? "Вимкнути автоімпорт" : "Увімкнути автоімпорт"}</button>
          <button class="ghost" type="button" data-download-onec-bridge-spec ${disabled}>Завантажити схему шлюзу</button>
          <button class="ghost" type="button" data-import-onec-demo ${disabled}>Імпорт demo-відповіді 1C</button>
        </div>
        <form class="form-grid" data-action="import-onec-package">
          <label class="field full"><span>Файл відповіді з 1C / BAS / BAF</span><input name="oneCFile" type="file" accept=".json,application/json" data-onec-payload-file ${disabled}></label>
          <label class="field full"><span>Імпорт відповіді з 1C / BAS / BAF JSON</span><textarea name="oneCPayload" placeholder='{"schema":"marketplace-crm.onec.exchange.v1","products":[],"clients":[],"payments":[],"stock":[],"shipments":[]}' ${disabled}></textarea></label>
          <button class="primary" type="submit" ${disabled}>Імпортувати відповідь 1C</button>
        </form>
        <p class="notice small">Поточний стабільний контур: 1C формує файл товарів і залишків у D:\\CRM_Exchange\\ToCRM, CRM забирає останній JSON через локальний API. Для повної автоматики потрібен запуск CRM-сервера на машині, яка бачить цю папку, або мережева шара.</p>
      </section>
    </div>
  `;
}

function renderDataExchangePanel() {
  const settings = dataExchangeState();
  const canManage = canCreateDocument("dataExchange") && canEditField("dataExchangeScope");
  const disabled = canManage ? "" : "disabled";
  const channelLabel = settings.channel === "bas" ? "1C / BAS / BAF" : "Маркетплейси";
  const modeLabel = settings.mode === "selective" ? "вибірково" : "вся інформація";
  const marketplaceItems = state.integrations
    .filter((item) => ["rozetka", "prom", "epicentr", "allo"].includes(item.id))
    .map((item) => [item.id, item.name]);
  const basIntegration = state.integrations.find((item) => item.id === "bas");
  return `
    <article class="panel settings-wide" data-data-exchange-panel>
      <div class="split">
        <h2>6.1 Обмін даними</h2>
        <span class="pill info">${escapeHtml(channelLabel)} · ${escapeHtml(modeLabel)}</span>
      </div>
      <form class="form-grid data-exchange-form" data-action="update-data-exchange" data-data-exchange-form>
        <label class="field"><span>Канал обміну</span><select name="channel" ${disabled} data-data-exchange-channel>
          ${option("marketplaces", "Маркетплейси", settings.channel !== "bas")}
          ${option("bas", "1C / BAS / BAF", settings.channel === "bas")}
        </select></label>
        <label class="field"><span>Обсяг інформації</span><select name="mode" ${disabled} data-data-exchange-mode>
          ${option("all", "Вся інформація", settings.mode !== "selective")}
          ${option("selective", "Вибірково", settings.mode === "selective")}
        </select></label>
        <div class="exchange-summary">
          <strong>${escapeHtml(channelLabel)}</strong>
          <span>${settings.mode === "selective" ? "CRM обмінює тільки вибрані блоки даних." : "CRM обмінює весь доступний набір даних цього каналу."}</span>
        </div>

        <fieldset class="exchange-fieldset full" data-exchange-channel-panel="marketplaces" ${settings.channel === "bas" ? "hidden" : ""}>
          <legend>Маркетплейси</legend>
          ${exchangeCheckboxGroup("marketplaceIds", marketplaceItems, settings.marketplaceIds, disabled)}
          <h3>Дані маркетплейсів</h3>
          ${exchangeCheckboxGroup("marketplaceData", DATA_EXCHANGE_MARKETPLACE_DATA, settings.marketplaceData, disabled)}
          ${renderMarketplaceCapabilityMatrix()}
        </fieldset>

        <fieldset class="exchange-fieldset full" data-exchange-channel-panel="bas" ${settings.channel === "bas" ? "" : "hidden"}>
          <legend>1C / BAS / BAF</legend>
          <div class="exchange-status-card">
            <strong>${escapeHtml(basIntegration?.name || "1C / BAS / BAF")}</strong>
            ${statusPill(basIntegration?.status || "ok")}
            <span class="small muted">${escapeHtml(basIntegration?.scope || "документи, номенклатура, контрагенти, залишки")}</span>
          </div>
          <h3>Підключення 1C</h3>
          ${renderOneCConnectionFields(settings, disabled)}
          <h3>Дані 1C / BAS / BAF</h3>
          ${exchangeCheckboxGroup("basData", DATA_EXCHANGE_BAS_DATA, settings.basData, disabled)}
          ${renderOneCExchangeStatus(settings)}
        </fieldset>

        <button class="primary" type="submit" ${disabled}>Зберегти обмін даними</button>
        <p class="notice ${canManage ? "" : "warn"} small full">${canManage ? "Права на цей блок керуються у Налаштування → Команда → Ролі: “Обмін даними” та “Обмін: вся інформація / вибірково”." : "Поточна роль не має права змінювати налаштування обміну даними."}</p>
      </form>
      <div data-exchange-embedded-rozetka ${settings.channel === "bas" ? "hidden" : ""}>
        ${renderRozetkaInboundPanel({ embedded: true })}
      </div>
      ${renderOneCTools(settings, canManage)}
    </article>
  `;
}

function renderFunnelSettings() {
  const canManage = role().canEditSettings || isAdmin();
  const disabled = canManage ? "" : "disabled";
  return `
    <article class="panel settings-wide">
      <div class="split">
        <h2>6.4 Воронки</h2>
        <span class="pill info">SLA, умови, нагадування, переходи статусів</span>
      </div>
      <form class="stack" data-action="update-sales-funnel">
        <div class="table-wrap compact-table funnel-settings-table">
          <table>
            <thead><tr><th>№</th><th>Код</th><th>Колір / статус</th><th>Назва</th><th>Опис</th><th>Де знаходиться</th><th>Умова входу</th><th>Умова виконання</th><th>Чим перемикається</th><th>Термін, год</th><th>Нагадування менеджеру</th><th>Активний</th></tr></thead>
            <tbody>
              ${salesFunnelRules().map((stage, index) => `
                <tr>
                  <td><strong>${index + 1}</strong></td>
                  <td><code>${escapeHtml(stage.id)}</code></td>
                  <td>
                    <span class="pill ${stage.className}">${escapeHtml(stage.label)}</span>
                    <select name="class_${escapeHtml(stage.id)}" ${disabled}>${SALES_FUNNEL_CLASS_OPTIONS.map(([value, label]) => option(value, label, value === stage.className)).join("")}</select>
                  </td>
                  <td><input class="compact-input" name="label_${escapeHtml(stage.id)}" value="${escapeHtml(stage.label)}" ${disabled}></td>
                  <td><textarea class="compact-area" name="description_${escapeHtml(stage.id)}" rows="2" ${disabled}>${escapeHtml(stage.description || "")}</textarea></td>
                  <td><textarea class="condition-area" name="menu_${escapeHtml(stage.id)}" rows="2" ${disabled}>${escapeHtml(stage.menuLocation || "")}</textarea></td>
                  <td><textarea class="condition-area" name="entry_${escapeHtml(stage.id)}" rows="3" ${disabled}>${escapeHtml(stage.entryCondition || "")}</textarea></td>
                  <td><textarea class="condition-area" name="completion_${escapeHtml(stage.id)}" rows="3" ${disabled}>${escapeHtml(stage.completionCondition || "")}</textarea></td>
                  <td><textarea class="condition-area" name="switch_${escapeHtml(stage.id)}" rows="3" ${disabled}>${escapeHtml(stage.switchBy || "")}</textarea></td>
                  <td><input class="compact-input" name="sla_${escapeHtml(stage.id)}" type="number" min="1" step="1" value="${escapeHtml(stage.slaHours)}" ${disabled}></td>
                  <td><input name="reminder_${escapeHtml(stage.id)}" value="${escapeHtml(stage.reminder)}" ${disabled}></td>
                  <td><select name="active_${escapeHtml(stage.id)}" ${disabled}>${option("true", "так", stage.active !== false)}${option("false", "ні", stage.active === false)}</select></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
        <button class="primary" type="submit" ${disabled}>Зберегти воронку</button>
        <p class="notice ${canManage ? "" : "warn"} small">${canManage ? "Ці правила керують панеллю статусів, менеджерською дошкою, SLA, нагадуваннями і підказками переходів у Продажах." : "Поточна роль не має права змінювати налаштування воронки."}</p>
      </form>
    </article>
  `;
}

function renderCommunicatorSettings() {
  const settings = communicatorSettings();
  const canManage = role().canEditSettings || isAdmin();
  const disabled = canManage ? "" : "disabled";
  return `
    <article class="panel settings-wide">
      <div class="split">
        <h2>6.3 Комунікатори та зв'язок</h2>
        <span class="pill ${settings.viber.enabled ? "good" : "warn"}">Viber ${settings.viber.mode === "live" ? "live" : "test"}</span>
      </div>
      <form class="form-grid" data-action="update-communicators">
        <label class="field"><span>Viber</span><select name="viberEnabled" ${disabled}>${option("true", "увімкнено", settings.viber.enabled !== false)}${option("false", "вимкнено", settings.viber.enabled === false)}</select></label>
        <label class="field"><span>Режим Viber</span><select name="viberMode" ${disabled}>${option("test", "тест CRM", settings.viber.mode !== "live")}${option("live", "бойовий API", settings.viber.mode === "live")}</select></label>
        <label class="field"><span>Назва відправника</span><input name="viberSenderName" value="${escapeHtml(settings.viber.senderName || "")}" ${disabled}></label>
        <label class="field"><span>Viber auth token</span><input name="viberAuthToken" type="password" value="${escapeHtml(settings.viber.authToken || "")}" placeholder="X-Viber-Auth-Token" ${disabled}></label>
        <label class="field full"><span>Webhook URL</span><input name="viberWebhookUrl" value="${escapeHtml(settings.viber.webhookUrl || "")}" ${disabled}></label>
        <label class="field full"><span>Шаблон повідомлення</span><textarea name="viberDefaultTemplate" ${disabled}>${escapeHtml(settings.viber.defaultTemplate || "")}</textarea></label>
        <label class="field"><span>Запис розмов</span><select name="recordingEnabled" ${disabled}>${option("true", "увімкнено", settings.callRecording.enabled !== false)}${option("false", "вимкнено", settings.callRecording.enabled === false)}</select></label>
        <label class="field"><span>Згода на запис</span><select name="recordingConsentRequired" ${disabled}>${option("true", "обов'язкова", settings.callRecording.consentRequired !== false)}${option("false", "не вимагати", settings.callRecording.consentRequired === false)}</select></label>
        <label class="field"><span>Зберігати, днів</span><input name="recordingRetentionDays" type="number" min="1" value="${escapeHtml(settings.callRecording.retentionDays || 180)}" ${disabled}></label>
        <label class="field"><span>Джерело запису</span><select name="recordingSource" ${disabled}>${option("browser_microphone", "мікрофон браузера", settings.callRecording.source !== "telephony")}${option("telephony", "телефонія/API", settings.callRecording.source === "telephony")}</select></label>
        <button class="primary" type="submit" ${disabled}>Зберегти комунікатори</button>
        <p class="notice small full">Бойовий Viber вимагає token, webhook і receiver підписаного користувача. Запис через браузер працює для мікрофона; для запису телефонної лінії потрібна інтеграція з IP-телефонією або провайдером дзвінків.</p>
      </form>
    </article>
  `;
}

function renderMarketplaceSettings() {
  return `
    <section class="grid two section-band">
      ${renderDataExchangePanel()}

      <article class="panel">
        <h2>6.2 Логістика</h2>
        <div class="chips">${variantEntries("delivery", true).map((entry) => `<span class="pill info">${escapeHtml(entry.name)}</span>`).join("")}</div>
        <div class="chips">${variantEntries("deliveryPayers", true).map((entry) => `<span class="pill">${escapeHtml(entry.name)}</span>`).join("")}</div>
      </article>

      ${renderCommunicatorSettings()}

      ${renderFunnelSettings()}

      <article class="panel settings-wide">
        <h2>6.5 Команда</h2>
        <div class="team-management">
          ${renderRoles()}
        </div>
      </article>
    </section>
  `;
}

function defaultSaleLine(productId = "") {
  const product = byId(state.products, productId) || state.products[0];
  const priceType = saleDraft.priceType || activeSalePriceTypes()[0]?.id || "";
  const salePrice = product ? productSalePrice(product, priceType) : { amount: 0, currency: "UAH" };
  return {
    productId: product?.id || "",
    barcode: product?.barcode || product?.qrCode || "",
    qty: 1,
    price: salePrice.amount,
    currency: salePrice.currency,
    discount: 0,
    serialIds: [],
    permitNumber: "",
    permitDate: ""
  };
}

function saleDraftLines() {
  const migratedLine = saleDraft.productId
    ? {
        productId: saleDraft.productId,
        barcode: saleDraft.barcode || "",
        qty: saleDraft.qty || 1,
        price: saleDraft.price,
        currency: saleDraft.currency,
        discount: saleDraft.discount || 0,
        serialIds: saleDraft.serialIds || [],
        permitNumber: saleDraft.permitNumber || "",
        permitDate: saleDraft.permitDate || ""
      }
    : null;
  const lines = Array.isArray(saleDraft.lines) && saleDraft.lines.length ? saleDraft.lines : [migratedLine || defaultSaleLine()];
  return lines.map((line) => ({ ...defaultSaleLine(line.productId), ...line, serialIds: line.serialIds || [] }));
}

function saleLinePrice(line, priceType) {
  const product = byId(state.products, line.productId) || state.products[0];
  const selectedPrice = product ? productSalePrice(product, priceType) : { amount: 0, currency: "UAH" };
  return {
    amount: line.price === undefined || line.price === "" ? selectedPrice.amount : line.price,
    currency: line.currency || selectedPrice.currency
  };
}

function renderSaleInvoiceLine(line, index, priceType, context = {}) {
  const product = byId(state.products, line.productId) || state.products[0];
  const price = saleLinePrice(line, priceType);
  const modelSerials = product?.type === "weapon" ? serialsForProduct(product) : [];
  const selectableSerials = modelSerials.filter((serial) => serialIsSelectable(serial) && serialMatchesStockContext(serial, context));
  const selectedSerialIds = line.serialIds || [];
  const serialOptions = product?.type !== "weapon"
    ? ""
    : modelSerials.length
      ? modelSerials.map((serial) => serialOption(serial, selectedSerialIds, context)).join("")
      : '<option disabled>Немає серій для цієї моделі.</option>';
  const serialHint = product?.type === "weapon"
    ? `<span class="small muted">доступно ${selectableSerials.length} з ${modelSerials.length}</span>`
    : '<span class="small muted">без серій</span>';
  return `
    <tr data-sale-line="${index}">
      <td>
        <input name="barcode" data-sale-line-index="${index}" data-sale-barcode value="${escapeHtml(line.barcode || product?.barcode || "")}" placeholder="QR / штрихкод">
      </td>
      <td class="line-product">
        <select name="productId" data-sale-line-index="${index}" data-sale-product>
          ${state.products.map((item) => option(item.id, `${item.type === "weapon" ? "Зброя" : "Товар"} · ${item.brand} ${item.model}`, item.id === product?.id)).join("")}
        </select>
        <span class="small muted">${product ? productCodes(product) : ""}</span>
      </td>
      <td><input name="qty" data-sale-line-index="${index}" inputmode="decimal" value="${escapeHtml(line.qty || 1)}"></td>
      <td><input name="price" data-sale-line-index="${index}" inputmode="decimal" data-field-lock="price" value="${escapeHtml(price.amount)}"></td>
      <td><select name="currency" data-sale-line-index="${index}" data-field-lock="price">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === price.currency)).join("")}</select></td>
      <td><input name="discount" data-sale-line-index="${index}" inputmode="decimal" data-field-lock="discount" value="${escapeHtml(line.discount || 0)}"></td>
      <td class="line-serials">
        <select class="serial-select" name="serialIds" data-sale-line-index="${index}" multiple ${product?.type === "weapon" ? "" : "disabled"}>${serialOptions}</select>
        ${serialHint}
      </td>
      <td>
        <input name="permitNumber" data-sale-line-index="${index}" value="${escapeHtml(line.permitNumber || "")}" ${product?.type === "weapon" ? "required" : "disabled"} placeholder="номер">
        <input name="permitDate" data-sale-line-index="${index}" type="date" value="${escapeHtml(line.permitDate || "")}" ${product?.type === "weapon" ? "required" : "disabled"}>
      </td>
      <td class="row-actions no-print">
        <button class="danger" type="button" data-remove-sale-line="${index}" ${saleDraftLines().length <= 1 ? "disabled" : ""}>Прибрати</button>
      </td>
    </tr>
  `;
}

function collectSaleLinesFromForm(form) {
  return Array.from(form.querySelectorAll("[data-sale-line]")).map((row) => ({
    productId: row.querySelector('[name="productId"]')?.value || "",
    barcode: row.querySelector('[name="barcode"]')?.value || "",
    qty: row.querySelector('[name="qty"]')?.value || 1,
    price: row.querySelector('[name="price"]')?.value || 0,
    currency: row.querySelector('[name="currency"]')?.value || "UAH",
    discount: row.querySelector('[name="discount"]')?.value || 0,
    serialIds: selectedValues(row.querySelector('[name="serialIds"]')),
    permitNumber: row.querySelector('[name="permitNumber"]')?.value || "",
    permitDate: row.querySelector('[name="permitDate"]')?.value || ""
  })).filter((line) => line.productId);
}

function updateSaleDraftFromForm(form) {
  const data = formData(form);
  saleDraft = {
    ...saleDraft,
    documentType: data.documentType,
    date: data.date,
    contract: data.contract,
    warehouseId: data.warehouseId,
    firmId: data.firmId,
    channel: data.channel,
    clientId: data.clientId,
    priceType: data.priceType,
    delivery: data.delivery,
    ttn: data.ttn,
    deliveryPayer: data.deliveryPayer,
    cashArticle: data.cashArticle,
    paymentMode: data.paymentMode,
    paid: data.paid,
    dueDays: data.dueDays,
    manager: data.manager,
    accounting: data.accounting,
    comment: data.comment,
    lines: collectSaleLinesFromForm(form)
  };
}

function renderSales() {
  const draftPeriod = periodFilter("salesDrafts");
  const docsPeriod = periodFilter("salesDocs");
  const draftInvoices = state.invoices.filter((invoice) => invoice.posted === false && invoice.status === "draft" && dateInPeriod(invoice.date, draftPeriod));
  const journalInvoices = state.invoices.filter((invoice) => !(invoice.posted === false && invoice.status === "draft") && dateInPeriod(invoice.date, docsPeriod));
  const selectedClient = byId(state.clients, saleDraft.clientId) || state.clients[0];
  const defaultPriceType = priceTypeById(saleDraft.priceType)?.id || priceTypeById(selectedClient?.priceType)?.id || activeSalePriceTypes()[0]?.id || "";
  const lines = saleDraftLines();
  const canSellWeapon = !lines.some((line) => byId(state.products, line.productId)?.type === "weapon") || role().canSellWeapon;
  return `
    <section class="section-band">
      <div class="panel invoice-panel">
        <div class="split">
          <h2>Нова накладна</h2>
          <span class="pill ${canSellWeapon ? "good" : "danger"}">${canSellWeapon ? "роль дозволяє продаж" : "роль блокує зброю"}</span>
        </div>
        <form class="stack" data-action="create-invoice">
          <div class="document-header-grid">
            <label class="field"><span>Тип документа</span><select name="documentType">${variantOptions("documentTypes", saleDraft.documentType || "Видаткова накладна")}</select></label>
            <label class="field"><span>Дата</span><input name="date" type="date" value="${escapeHtml(saleDraft.date || today)}"></label>
            <label class="field"><span>Договір</span><input name="contract" value="${escapeHtml(saleDraft.contract || "")}" placeholder="договір, рахунок, заявка"></label>
            <label class="field"><span>Склад</span><select name="warehouseId" data-sale-stock-context>${state.warehouses.map((warehouse) => option(warehouse.id, warehouse.name, warehouse.id === (saleDraft.warehouseId || "wh-store"))).join("")}</select></label>
            <label class="field"><span>Фірма</span><select name="firmId" data-sale-stock-context>${state.settings.firms.map((firm) => option(firm.id, firm.name, firm.id === (saleDraft.firmId || state.settings.firms[0]?.id || "vat"))).join("")}</select></label>
            <label class="field"><span>Канал</span><select name="channel">${variantOptions("salesChannels", saleDraft.channel || "Магазин")}</select></label>
            <label class="field"><span>Клієнт</span><select name="clientId" data-sale-client>${state.clients.map((client) => option(client.id, client.name, client.id === selectedClient?.id)).join("")}</select></label>
            <label class="field"><span>Прайс</span><select name="priceType" data-sale-price-type>${priceTypeOptions(defaultPriceType)}</select></label>
          </div>

          <div class="table-wrap invoice-lines">
            <table>
              <thead><tr><th>QR / штрихкод</th><th>Товар</th><th>К-сть</th><th>Ціна</th><th>Валюта</th><th>Знижка %</th><th>Серійні номери</th><th>Дозвіл</th><th>Дії</th></tr></thead>
              <tbody>${lines.map((line, index) => renderSaleInvoiceLine(line, index, defaultPriceType, { warehouseId: saleDraft.warehouseId || "wh-store", firmId: saleDraft.firmId || state.settings.firms[0]?.id || "vat", clientId: "" })).join("")}</tbody>
            </table>
          </div>

          <div class="inline-actions no-print">
            <button class="secondary" type="button" data-add-sale-line>Додати ще товар</button>
            <button class="ghost" type="button" data-view="purchases">Провести прихід серій</button>
          </div>

          <div class="document-footer-grid">
            <label class="field"><span>Доставка</span><select name="delivery">${variantOptions("delivery", saleDraft.delivery || "")}</select></label>
            <label class="field"><span>ТТН</span><input name="ttn" value="${escapeHtml(saleDraft.ttn || "")}" placeholder="номер накладної"></label>
            <label class="field"><span>Платник доставки</span><select name="deliveryPayer">${variantOptions("deliveryPayers", saleDraft.deliveryPayer || "Клієнт")}</select></label>
            <label class="field"><span>Стаття коштів</span><select name="cashArticle">${variantOptions("cashArticles", saleDraft.cashArticle || "")}</select></label>
            <label class="field"><span>Оплата</span><select name="paymentMode">${variantOptions("paymentModes", saleDraft.paymentMode || "Відтермінування")}</select></label>
            <label class="field"><span>Оплачено</span><input name="paid" inputmode="decimal" value="${escapeHtml(saleDraft.paid || 0)}"></label>
            <label class="field"><span>Відтермінування, днів</span><input name="dueDays" type="number" min="0" value="${escapeHtml(saleDraft.dueDays || state.settings.defaultDueDays)}"></label>
            <label class="field"><span>Відповідальний</span><select name="manager">${employeeOptions(saleDraft.manager || state.currentManager)}</select></label>
            <label class="field"><span>Бухоблік</span><select name="accounting">${option("true", "Позначити для BAS/BAF", saleDraft.accounting !== "false")}${option("false", "Не передавати", saleDraft.accounting === "false")}</select></label>
            <label class="field wide"><span>Коментар</span><textarea name="comment" placeholder="умови, резерв, примітки до документа">${escapeHtml(saleDraft.comment || "")}</textarea></label>
          </div>

          <button class="primary" type="submit">Створити накладну</button>
        </form>
        <p class="notice warn small">Для типу “Зброя” кількість у кожному рядку має дорівнювати кількості вибраних серій. Серії перевіряються по моделі, складу, актуальності, ЄРЗ і повторному продажу.</p>
      </div>
    </section>

    <section class="panel" data-print-area="salesDrafts" data-print-title="Чернетки накладних">
      <div class="split">
        <h2>Чернетки</h2>
        <span class="pill ${draftInvoices.length ? "warn" : "good"}">${draftInvoices.length} чернеток</span>
      </div>
      <p class="notice small">Чернетки не списують склад і не продають серійні номери. Після кнопки “Провести” документ переходить у журнал накладних.</p>
      ${renderPeriodPrintControls("salesDrafts", "Чернетки", draftPeriod, draftInvoices.length)}
      ${invoiceTable(draftInvoices, { emptyText: "Відкритих чернеток за вибраний період немає." })}
    </section>

    <section class="panel" data-print-area="salesDocs" data-print-title="Журнал накладних">
      <div class="split">
        <h2>Журнал накладних</h2>
      </div>
      ${renderPeriodPrintControls("salesDocs", "Журнал накладних", docsPeriod, journalInvoices.length)}
      ${invoiceTable(journalInvoices, { emptyText: "Проведених або скасованих накладних за вибраний період немає." })}
    </section>
  `;
}

function invoiceTable(invoices, options = {}) {
  const emptyText = options.emptyText || "Накладних за вибраний період немає.";
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Номер</th><th>Фірма</th><th>Клієнт</th><th>Менеджер</th><th>Канал</th><th>Сума / оплата</th><th>Доставка</th><th>Дії</th></tr></thead>
        <tbody>
          ${invoices.map((invoice) => `
            <tr>
              <td><strong>${invoice.id}</strong><br><span class="small muted">${invoice.date} · ${invoice.dueDate}</span></td>
              <td>${firmName(invoice.firmId)}<br>${invoice.accounting ? '<span class="pill info">BAS/BAF</span>' : '<span class="pill">упр. облік</span>'}</td>
              <td>${clientName(invoice.clientId)}</td>
              <td>${invoice.manager}</td>
              <td>${invoice.channel}</td>
              <td>${formatMoney(invoice.total, invoice.currency)}<br><span class="small muted">оплачено ${formatMoney(invoice.paid, invoice.currency)}</span><br>${statusPill(invoice.status)}${invoice.posted === false ? '<br><span class="pill info">не проведено</span>' : ""}</td>
              <td>${invoice.delivery}<br><span class="small muted">${invoice.ttn || "без ТТН"}</span></td>
              <td class="row-actions">
                <button class="primary" data-post-invoice-draft="${invoice.id}" ${invoice.posted === false && invoice.status === "draft" ? "" : "disabled"}>Провести</button>
                <button class="ghost" data-open-invoice="${invoice.id}">Деталі</button>
                <button class="secondary" data-edit-invoice="${invoice.id}" ${invoice.posted === false || canEditPostedDocument(invoicePostedPermissionKey(invoice)) ? "" : "disabled"}>Змінити</button>
                <button class="ghost" data-pay-invoice="${invoice.id}" ${invoice.storageShipment || invoice.posted === false || invoice.total <= invoice.paid ? "disabled" : ""}>Оплата</button>
                <button class="danger" data-lock-invoice="${invoice.id}" ${invoice.posted === false || isLocked(invoice.date, invoice.locked) ? "disabled" : ""}>Закрити</button>
                <button class="danger" data-cancel-invoice="${invoice.id}" ${invoice.status === "cancelled" ? "disabled" : ""}>Скасувати</button>
              </td>
            </tr>
          `).join("") || `<tr><td colspan="8" class="muted">${escapeHtml(emptyText)}</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

function renderProducts() {
  return `
    <section class="grid two section-band">
      <div class="panel">
        <h2>Додати товар</h2>
        <form class="form-grid" data-action="create-product">
          <label class="field"><span>Тип</span><select name="type"><option value="regular">Звичайний товар</option><option value="weapon">Зброя</option></select></label>
          ${dictionaryField("categories", "Категорія", "categoryValue", "newCategory", { placeholder: "нова категорія / група" })}
          ${dictionaryField("units", "Одиниця", "unitValue", "newUnit", { placeholder: "нова одиниця виміру" })}
          ${dictionaryField("brands", "Бренд", "brandValue", "newBrand", { placeholder: "новий бренд" })}
          ${dictionaryField("models", "Модель", "modelValue", "newModel", { wide: true, placeholder: "нова модель" })}
          ${dictionaryField("calibers", "Калібр", "caliberValue", "newCaliber", { required: false, selected: "без калібру", placeholder: "новий калібр для зброї" })}
          <label class="field"><span>ЄРЗ</span><select name="erzRequired"><option value="false">ні</option><option value="true">так</option></select></label>
          <div class="field wide">
            <span>Штрих / QR</span>
            <div class="input-action">
              <input name="barcode" data-product-barcode required placeholder="скануйте або створіть код">
              <button class="ghost" type="button" data-generate-product-barcode>Створити</button>
            </div>
          </div>
          ${dictionaryField("supplierSkus", "Артикул постач.", "supplierSkuValue", "newSupplierSku", { placeholder: "новий артикул постачальника" })}
          ${dictionaryField("internalCodes", "Внутр. код", "internalCodeValue", "newInternalCode", { placeholder: "новий внутрішній код" })}
          ${dictionaryField("uktzed", "УКТЗЕД", "uktzedValue", "newUktzed", { placeholder: "новий код УКТЗЕД" })}
          <label class="field"><span>Прихідна</span><input name="cost" data-field-lock="cost" value="0"></label>
          <label class="field"><span>Валюта приходу</span><select name="costCurrency" data-field-lock="cost">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === "USD")).join("")}</select></label>
          ${productPriceInputs({ price: 0, currency: "UAH", prices: {} })}
          <label class="field"><span>Мін. залишок</span><input name="minStock" type="number" min="0" value="0"></label>
          <label class="field"><span>Поставка, днів</span><input name="leadTimeDays" type="number" min="0" value="14"></label>
          <label class="field wide"><span>SKU маркетплейсу</span><input name="marketplaceSku" placeholder="Rozetka/Prom/Epicentr/Allo"></label>
          <label class="field"><span>Каталог / акція</span><select name="catalogTag">${catalogTagOptions("")}</select></label>
          <label class="field full"><span>Опис / характеристики</span><textarea name="description" placeholder="опис та характеристики для сайту і маркетплейсів"></textarea></label>
          <div class="field full">
            <span>Фото товару</span>
            <input type="file" name="photos" data-product-photos accept="${MARKETPLACE_IMAGE_EXTENSIONS}" multiple>
            <p class="notice small">До 6 фото з комп'ютера. Дозволені формати: JPG/JPEG або PNG. Для синхронізації фото оптимізуються у JPG з білим фоном.</p>
          </div>
          <div id="product-photo-preview" class="photo-preview full" data-product-photo-preview>
            <div class="photo-empty">Фото ще не додані. Дозволено до 6 файлів JPG/JPEG або PNG.</div>
          </div>
          <button class="primary" type="submit">Додати товар</button>
        </form>
      </div>
      <div class="panel">
        <h2>Правила структури</h2>
        <div class="stack">
          <p class="notice">Зброя: модель, калібр, бренд, ЄРЗ так/ні, QR/штрихкод, артикул постачальника, внутрішній код моделі, УКТЗЕД і обов'язковий серійний номер кожної одиниці.</p>
          <p class="notice">Звичайні товари: модель, бренд, QR/штрихкод, артикул постачальника, внутрішній код моделі, УКТЗЕД. Облік кількісний без серій.</p>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="split">
        <h2>Каталог</h2>
        <div class="segmented" data-filter-products>
          <button class="active" data-type="all">Усі</button>
          <button data-type="weapon">Зброя</button>
          <button data-type="regular">Звичайні</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Тип</th><th>Фото</th><th>Бренд / модель</th><th>Категорія</th><th>Калібр</th><th>Коди</th><th>Ціна</th><th>Собівартість</th><th>Залишок</th></tr></thead>
          <tbody id="products-body">${productRows(state.products)}</tbody>
        </table>
      </div>
    </section>
  `;
}

function productCreateForm() {
  return `
    <form class="form-grid" data-action="create-product">
      <label class="field"><span>Тип</span><select name="type"><option value="regular">Звичайний товар</option><option value="weapon">Зброя</option></select></label>
      ${dictionaryField("categories", "Категорія", "categoryValue", "newCategory", { placeholder: "нова категорія / група" })}
      ${dictionaryField("units", "Одиниця", "unitValue", "newUnit", { placeholder: "нова одиниця виміру" })}
      ${dictionaryField("brands", "Бренд", "brandValue", "newBrand", { placeholder: "новий бренд" })}
      ${dictionaryField("models", "Модель", "modelValue", "newModel", { wide: true, placeholder: "нова модель" })}
      ${dictionaryField("calibers", "Калібр", "caliberValue", "newCaliber", { required: false, selected: "без калібру", placeholder: "новий калібр для зброї" })}
      <label class="field"><span>ЄРЗ</span><select name="erzRequired"><option value="false">ні</option><option value="true">так</option></select></label>
      <div class="field wide">
        <span>Штрих / QR</span>
        <div class="input-action">
          <input name="barcode" data-product-barcode required placeholder="скануйте або створіть код">
          <button class="ghost" type="button" data-generate-product-barcode>Створити</button>
        </div>
      </div>
      ${dictionaryField("supplierSkus", "Артикул постач.", "supplierSkuValue", "newSupplierSku", { placeholder: "новий артикул постачальника" })}
      ${dictionaryField("internalCodes", "Внутр. код", "internalCodeValue", "newInternalCode", { placeholder: "новий внутрішній код" })}
      ${dictionaryField("uktzed", "УКТЗЕД", "uktzedValue", "newUktzed", { placeholder: "новий код УКТЗЕД" })}
      <label class="field"><span>Прихідна</span><input name="cost" data-field-lock="cost" value="0"></label>
      <label class="field"><span>Валюта приходу</span><select name="costCurrency" data-field-lock="cost">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === "USD")).join("")}</select></label>
      ${productPriceInputs({ price: 0, currency: "UAH", prices: {} })}
      <label class="field"><span>Мін. залишок</span><input name="minStock" type="number" min="0" value="0"></label>
      <label class="field"><span>Поставка, днів</span><input name="leadTimeDays" type="number" min="0" value="14"></label>
      <label class="field wide"><span>SKU маркетплейсу</span><input name="marketplaceSku" placeholder="Rozetka/Prom/Epicentr/Allo"></label>
      <label class="field"><span>Каталог / акція</span><select name="catalogTag">${catalogTagOptions("")}</select></label>
      <label class="field full"><span>Опис / характеристики</span><textarea name="description" placeholder="опис та характеристики для сайту і маркетплейсів"></textarea></label>
      <div class="field full">
        <span>Фото товару</span>
        <input type="file" name="photos" data-product-photos accept="${MARKETPLACE_IMAGE_EXTENSIONS}" multiple>
        <p class="notice small">До 6 фото з комп'ютера. Дозволені формати: JPG/JPEG або PNG. Для синхронізації фото оптимізуються у JPG з білим фоном.</p>
      </div>
      <div class="photo-preview full" data-product-photo-preview>
        <div class="photo-empty">Фото ще не додані. Дозволено до 6 файлів JPG/JPEG або PNG.</div>
      </div>
      <button class="primary" type="submit">Створити товар</button>
    </form>
  `;
}

function openCreateProductForm() {
  productImagesDraft = [];
  const modal = openModal("Створити товар", productCreateForm());
  renderProductPhotoPreview(modal);
}

function productRows(products) {
  return products.map((product) => {
    const qty = product.type === "weapon"
      ? state.serials.filter((serial) => serial.productId === product.id && serial.status !== "sold").length
      : state.stock.filter((row) => row.productId === product.id).reduce((sum, row) => sum + row.qty, 0);
    return `
      <tr class="clickable-row" data-product-type="${product.type}" data-open-product="${escapeHtml(product.id)}" title="Відкрити картку товару">
        <td>${product.type === "weapon" ? '<span class="pill danger">зброя</span>' : '<span class="pill good">звичайний</span>'}<br>${product.erzRequired ? '<span class="pill info">ЄРЗ</span>' : ""}</td>
        <td>${productPhotoThumbs(product)}</td>
        <td><strong>${product.brand}</strong><br>${product.model}<br><span class="small muted">${product.description || ""}</span></td>
        <td>${product.category || "-"}<br><span class="small muted">мін: ${product.minStock || 0} · ${product.leadTimeDays || 0} дн.</span></td>
        <td>${product.caliber || "-"}</td>
        <td><span class="small muted">QR/штрих:</span> ${product.barcode}<br><span class="small muted">арт:</span> ${product.supplierSku}<br><span class="small muted">внутр:</span> ${product.internalCode}<br><span class="small muted">УКТЗЕД:</span> ${product.uktzed}</td>
        <td>${productPriceSummary(product)}</td>
        <td>${formatMoney(product.cost, product.costCurrency)}<br><span class="small muted">${formatMoney(uah(product.cost, product.costCurrency))}</span></td>
        <td><strong>${qty}</strong></td>
      </tr>
    `;
  }).join("");
}

function defaultPurchaseLine(productId = "") {
  const product = byId(state.products, productId) || state.products[0];
  return {
    productId: product?.id || "",
    barcode: product?.barcode || product?.qrCode || "",
    qty: 1,
    cost: product?.cost || 0,
    currency: product?.costCurrency || "UAH",
    erzStatus: "pending",
    actual: "true",
    serials: ""
  };
}

function purchaseDraftLines() {
  const lines = Array.isArray(purchaseDraft.lines) && purchaseDraft.lines.length
    ? purchaseDraft.lines
    : [defaultPurchaseLine()];
  return lines.map((line) => ({ ...defaultPurchaseLine(line.productId), ...line }));
}

function renderPurchaseLine(line, index) {
  const product = byId(state.products, line.productId) || state.products[0];
  return `
    <tr data-purchase-line="${index}">
      <td>
        <input name="barcode" data-purchase-line-index="${index}" data-purchase-barcode value="${escapeHtml(line.barcode || product?.barcode || "")}" placeholder="QR / штрихкод" required>
      </td>
      <td class="line-product">
        <select name="productId" data-purchase-line-index="${index}" data-purchase-product>
          ${state.products.map((item) => option(item.id, `${item.type === "weapon" ? "Зброя" : "Товар"} · ${item.brand} ${item.model}`, item.id === product?.id)).join("")}
        </select>
        <span class="small muted">${product ? productCodes(product) : ""}</span>
      </td>
      <td><input name="qty" data-purchase-line-index="${index}" type="number" min="1" value="${escapeHtml(line.qty || 1)}" required></td>
      <td><input name="cost" data-purchase-line-index="${index}" inputmode="decimal" value="${escapeHtml(line.cost ?? product?.cost ?? 0)}"></td>
      <td><select name="currency" data-purchase-line-index="${index}">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === (line.currency || product?.costCurrency || "UAH"))).join("")}</select></td>
      <td>
        <select name="erzStatus" data-purchase-line-index="${index}" ${product?.type === "weapon" ? "" : "disabled"}>
          ${option("pending", "Очікує", (line.erzStatus || "pending") === "pending")}
          ${option("verified", "Перевірено", line.erzStatus === "verified")}
        </select>
      </td>
      <td>
        <select name="actual" data-purchase-line-index="${index}" ${product?.type === "weapon" ? "" : "disabled"}>
          ${option("true", "актуальні", line.actual !== "false")}
          ${option("false", "неактуальні", line.actual === "false")}
        </select>
      </td>
      <td class="line-serials">
        <textarea name="serials" data-purchase-line-index="${index}" ${product?.type === "weapon" ? "required" : "disabled"} placeholder="для зброї: серії через Enter, кому або ;">${escapeHtml(line.serials || "")}</textarea>
        <span class="small muted">${product?.type === "weapon" ? "серій має бути рівно як кількість" : "без серій"}</span>
      </td>
      <td class="row-actions no-print">
        <button class="danger" type="button" data-remove-purchase-line="${index}" ${purchaseDraftLines().length <= 1 ? "disabled" : ""}>Прибрати</button>
      </td>
    </tr>
  `;
}

function collectPurchaseLinesFromForm(form) {
  return Array.from(form.querySelectorAll("[data-purchase-line]")).map((row) => ({
    productId: row.querySelector('[name="productId"]')?.value || "",
    barcode: row.querySelector('[name="barcode"]')?.value || "",
    qty: row.querySelector('[name="qty"]')?.value || 1,
    cost: normalizeDecimalText(row.querySelector('[name="cost"]')?.value || 0),
    currency: row.querySelector('[name="currency"]')?.value || "UAH",
    erzStatus: row.querySelector('[name="erzStatus"]')?.value || "pending",
    actual: row.querySelector('[name="actual"]')?.value || "true",
    serials: row.querySelector('[name="serials"]')?.value || ""
  })).filter((line) => line.productId);
}

function updatePurchaseDraftFromForm(form) {
  const data = formData(form);
  purchaseDraft = {
    ...purchaseDraft,
    documentType: data.documentType,
    date: data.date,
    firmId: data.firmId,
    warehouseId: data.warehouseId,
    supplierId: data.supplierId,
    newSupplier: data.newSupplier,
    supplierDoc: data.supplierDoc,
    accounting: data.accounting,
    comment: data.comment,
    lines: collectPurchaseLinesFromForm(form)
  };
}

function renderPurchases() {
  const docsPeriod = periodFilter("purchaseDocs");
  const filteredPurchases = state.purchases.filter((purchase) => dateInPeriod(purchase.date, docsPeriod));
  const weapons = state.products.filter((product) => product.type === "weapon");
  const pendingBas = state.purchases.filter((purchase) => purchase.accounting && purchase.basStatus !== "exported").length;
  const lines = purchaseDraftLines();
  return `
    <section class="grid two section-band">
      <div class="panel">
        <div class="split">
          <h2>Прихід товару</h2>
          <span class="pill danger">серії зброї = кількість</span>
        </div>
        <form class="stack" data-action="create-purchase">
          <div class="document-header-grid">
            <label class="field"><span>Тип документа</span><select name="documentType">${variantOptions("purchaseDocumentTypes", purchaseDraft.documentType || "Прибуткова накладна")}</select></label>
            <label class="field"><span>Дата</span><input name="date" type="date" value="${escapeHtml(purchaseDraft.date || today)}" required></label>
            <label class="field"><span>Фірма</span><select name="firmId">${state.settings.firms.map((firm) => option(firm.id, firm.name, firm.id === (purchaseDraft.firmId || state.settings.firms[0]?.id || "vat"))).join("")}</select></label>
            <label class="field"><span>Склад</span><select name="warehouseId">${state.warehouses.map((warehouse) => option(warehouse.id, warehouse.name, warehouse.id === (purchaseDraft.warehouseId || "wh-main"))).join("")}</select></label>
            <label class="field wide"><span>Постачальник</span><select name="supplierId">${supplierOptions(purchaseDraft.supplierId || "")}</select></label>
            <label class="field wide"><span>Новий постачальник</span><input name="newSupplier" value="${escapeHtml(purchaseDraft.newSupplier || "")}" placeholder="заповнити, якщо обрано + Новий постачальник"></label>
            <label class="field"><span>Документ постач.</span><input name="supplierDoc" required value="${escapeHtml(purchaseDraft.supplierDoc || "")}" placeholder="номер документа"></label>
            <label class="field"><span>Бухоблік</span><select name="accounting">${option("true", "Позначити для BAS/BAF", purchaseDraft.accounting !== "false")}${option("false", "Не передавати", purchaseDraft.accounting === "false")}</select></label>
          </div>

          <div class="table-wrap invoice-lines">
            <table>
              <thead><tr><th>QR / штрихкод</th><th>Позиція</th><th>К-сть</th><th>Ціна приходу</th><th>Валюта</th><th>ЄРЗ</th><th>Актуальність</th><th>Серійні номери</th><th>Дії</th></tr></thead>
              <tbody>${lines.map((line, index) => renderPurchaseLine(line, index)).join("")}</tbody>
            </table>
          </div>

          <div class="inline-actions no-print">
            <button class="secondary" type="button" data-add-purchase-line>Додати ще товар</button>
            <button class="ghost" type="button" data-view="products">Створити нову позицію</button>
          </div>

          <div class="document-footer-grid">
            <label class="field wide"><span>Коментар</span><textarea name="comment" placeholder="митна декларація, умови поставки, примітки">${escapeHtml(purchaseDraft.comment || "")}</textarea></label>
          </div>

          <button class="primary" type="submit">Провести прихід</button>
        </form>
        <p class="notice warn small">Якщо позиція має тип “Зброя”, документ не проведеться без серій. Система перевіряє, що кількість серій дорівнює кількості, серії не дублюються в документі та не існують у CRM.</p>
      </div>

      <div class="panel">
        <h2>BAS/BAF імпорт та експорт</h2>
        <div class="grid two section-band">
          <article class="card metric info"><span>До експорту BAS</span><strong>${pendingBas}</strong><small>Приходи, позначені для бухобліку.</small></article>
          <article class="card metric good"><span>Зброя в приходах</span><strong>${state.purchases.filter((purchase) => purchase.productType === "weapon").reduce((sum, purchase) => sum + purchase.qty, 0)}</strong><small>Кожна одиниця має серію.</small></article>
        </div>
        <div class="inline-actions section-band">
          <button class="secondary" data-export-bas-purchases>Експорт BAS/BAF JSON</button>
          <button class="ghost" data-bas-import-demo>Імпорт demo BAS</button>
        </div>
        <form class="form-grid" data-action="import-bas-purchases">
          <label class="field full"><span>Імпорт із BAS/BAF JSON</span><textarea name="basPayload" placeholder='{"purchases":[{"date":"2026-05-23","supplier":"BAS supplier","supplierDoc":"BAS-1","firmId":"vat","warehouseId":"wh-main","productId":"p-100","qty":1,"cost":1500,"currency":"USD","serials":["BAS-SERIAL-001"]}]}'></textarea></label>
          <button class="primary" type="submit">Імпортувати прихід</button>
        </form>
        <p class="notice small">Production-обмін із BAS/BAF має йти через API/обробку, але тут уже закладена структура: документи, позиції, серії, склад, фірма, валюта, ознака бухобліку.</p>
      </div>
    </section>

    <section class="panel section-band" data-print-area="purchaseDocs" data-print-title="Проведені приходи">
      <h2>Проведені приходи</h2>
      ${renderPeriodPrintControls("purchaseDocs", "Проведені приходи", docsPeriod, filteredPurchases.length)}
      <div class="table-wrap">
        <table>
          <thead><tr><th>Документ</th><th>Постачальник</th><th>Позиція</th><th>Склад</th><th>Кількість</th><th>Серії</th><th>Собівартість</th><th>BAS/BAF</th><th>Дії</th></tr></thead>
          <tbody>
            ${filteredPurchases.map((purchase) => `
              <tr>
                <td><strong>${purchase.id}</strong><br><span class="small muted">${purchase.date} · ${purchase.supplierDoc || "-"}</span></td>
                <td>${purchase.supplier}<br><span class="small muted">${firmName(purchase.firmId)}</span></td>
                <td>${productName(purchase.productId)}<br><span class="small muted">${purchase.productType === "weapon" ? "серійний облік" : "кількісний облік"}</span></td>
                <td>${warehouseName(purchase.warehouseId)}</td>
                <td>${purchase.qty}</td>
                <td>${purchase.serials?.length ? purchase.serials.map((serial) => `<span class="pill info">${serial}</span>`).join(" ") : "-"}</td>
                <td>${formatMoney(purchase.cost, purchase.currency)}<br><span class="small muted">${formatMoney(uah(purchase.cost, purchase.currency))} / од.</span></td>
                <td>${purchase.accounting ? statusPill(purchase.basStatus || "pending_export") : '<span class="pill">упр. облік</span>'}</td>
                <td class="row-actions">
                  <button class="ghost" data-edit-purchase="${purchase.id}" ${canEditPostedDocument("purchase") ? "" : "disabled"}>Змінити</button>
                  <button class="ghost" data-export-one-purchase="${purchase.id}">JSON</button>
                  <button class="secondary" data-mark-purchase-exported="${purchase.id}" ${purchase.basStatus === "exported" ? "disabled" : ""}>BAS ok</button>
                </td>
              </tr>
            `).join("") || '<tr><td colspan="9" class="muted">Немає приходів за вибраний період.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel">
      <h2>Актуальні серії зброї з приходів</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Серія</th><th>Модель</th><th>Прихід</th><th>Склад</th><th>Актуальність</th><th>BAS</th><th>ЄРЗ</th></tr></thead>
          <tbody>
            ${state.serials.filter((serial) => weapons.some((product) => product.id === serial.productId)).map((serial) => `
              <tr>
                <td><strong>${serial.serial}</strong></td>
                <td>${productName(serial.productId)}</td>
                <td>${serial.purchaseId || "-"}</td>
                <td>${warehouseName(serial.warehouseId)}</td>
                <td>${serial.actual ? '<span class="pill good">актуальна</span>' : '<span class="pill danger">неактуальна</span>'}</td>
                <td>${serial.basSynced ? '<span class="pill good">BAS ok</span>' : '<span class="pill warn">BAS очікує</span>'}</td>
                <td>${statusPill(serial.erzStatus)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderSerials() {
  const docsPeriod = periodFilter("serialDocs");
  const weapons = state.products.filter((product) => product.type === "weapon");
  const filteredSerials = state.serials.filter((serial) => {
    const purchase = byId(state.purchases, serial.purchaseId);
    return dateInPeriod(purchase?.date || today, docsPeriod);
  });
  return `
    <section class="grid two section-band">
      <div class="panel">
        <h2>Ручне коригування серії</h2>
        <form class="form-grid" data-action="create-serial">
          <label class="field wide"><span>Модель зброї</span><select name="productId">${weapons.map((product) => option(product.id, `${product.brand} ${product.model}`)).join("")}</select></label>
          <label class="field"><span>Серійний номер</span><input name="serial" required></label>
          <label class="field"><span>Склад</span><select name="warehouseId">${state.warehouses.map((warehouse) => option(warehouse.id, warehouse.name)).join("")}</select></label>
          <label class="field"><span>Стан ЄРЗ</span><select name="erzStatus"><option value="pending">Очікує</option><option value="verified">Перевірено</option></select></label>
          <label class="field"><span>Статус</span><select name="status"><option value="available">В наявності</option><option value="responsible_storage">Відповідальне зберігання</option></select></label>
          <label class="field wide"><span>B2B клієнт зберігання</span><select name="clientId"><option value="">Немає</option>${state.clients.filter((client) => client.type === "B2B").map((client) => option(client.id, client.name)).join("")}</select></label>
          <button class="primary" type="submit">Додати серію</button>
        </form>
        <p class="notice warn small">Основний шлях для внесення серій зброї — розділ “Прихід”. Тут залишено ручне коригування для адміністративних виправлень.</p>
      </div>
      <div class="panel">
        <h2>Контроль серій</h2>
        <div class="grid two">
          <article class="card metric good"><span>ЄРЗ перевірено</span><strong>${state.serials.filter((serial) => serial.erzStatus === "verified").length}</strong><small>Дозволено до продажу за наявності дозволу покупця.</small></article>
          <article class="card metric warn"><span>Очікують ЄРЗ</span><strong>${state.serials.filter((serial) => serial.erzStatus === "pending").length}</strong><small>Продаж блокується до перевірки.</small></article>
        </div>
      </div>
    </section>

    <section class="panel" data-print-area="serialDocs" data-print-title="Серійний облік зброї">
      <h2>Серійний облік зброї</h2>
      ${renderPeriodPrintControls("serialDocs", "Серійний облік зброї", docsPeriod, filteredSerials.length)}
      <div class="table-wrap">
        <table>
          <thead><tr><th>Серія</th><th>Модель</th><th>Склад</th><th>Статус</th><th>ЄРЗ</th><th>Клієнт</th><th>Дозвіл</th><th>Дії</th></tr></thead>
          <tbody>
            ${filteredSerials.map((serial) => `
              <tr>
                <td><strong>${serial.serial}</strong></td>
                <td>${productName(serial.productId)}</td>
                <td>${warehouseName(serial.warehouseId)}</td>
                <td>${statusPill(serial.status)}</td>
                <td>${statusPill(serial.erzStatus)}</td>
                <td>${serial.clientId ? clientName(serial.clientId) : "-"}</td>
                <td>${serial.permitNumber ? `${serial.permitNumber}<br><span class="small muted">${serial.permitDate}</span>` : "-"}</td>
                <td class="row-actions">
                  <button class="ghost" data-verify-serial="${serial.id}" ${serial.erzStatus === "verified" ? "disabled" : ""}>ЄРЗ ok</button>
                  <button class="ghost" data-edit-serial="${serial.id}" ${canEditPostedDocument("serialCorrection") ? "" : "disabled"}>Змінити</button>
                </td>
              </tr>
            `).join("") || '<tr><td colspan="8" class="muted">Немає серій за вибраний період.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function inventoryRows() {
  const rows = [];
  state.products.forEach((product) => {
    if (product.type === "weapon") {
      const grouped = state.serials
        .filter((serial) => serial.productId === product.id && serial.status !== "sold")
        .reduce((acc, serial) => {
          const key = `${serial.warehouseId}:${serial.clientId || ""}:${serial.firmId || "vat"}`;
          acc[key] = acc[key] || { product, warehouseId: serial.warehouseId, clientId: serial.clientId || "", firmId: serial.firmId || "vat", qty: 0 };
          acc[key].qty += 1;
          return acc;
        }, {});
      Object.values(grouped).forEach((row) => rows.push({ ...row, valueUAH: row.qty * uah(product.cost, product.costCurrency) }));
    } else {
      state.stock.filter((row) => row.productId === product.id).forEach((stockRow) => {
        rows.push({ product, ...stockRow, valueUAH: stockRow.qty * uah(product.cost, product.costCurrency) });
      });
    }
  });
  return rows;
}

function clientResponsibleWarehouse(clientId) {
  let warehouse = state.warehouses.find((item) => item.kind === "client_responsible" && item.clientId === clientId);
  if (!warehouse) {
    const client = byId(state.clients, clientId);
    warehouse = {
      id: uniqueId(`wh-client-${clientId}`),
      name: `Склад клієнта · ${client?.name || clientId}`,
      kind: "client_responsible",
      clientId
    };
    state.warehouses.push(warehouse);
  }
  return warehouse;
}

function isOwnStockRow(row) {
  const warehouse = byId(state.warehouses, row.warehouseId);
  return !row.clientId && !["client_responsible", "responsible"].includes(warehouse?.kind);
}

function inferFirmIdForStockRow(row, purchases = []) {
  if (row.firmId) return row.firmId;
  const matches = purchases.filter((purchase) => purchase.productId === row.productId && purchase.warehouseId === row.warehouseId);
  const firmIds = uniqueList(matches.map((purchase) => purchase.firmId).filter(Boolean));
  return firmIds.length === 1 ? firmIds[0] : "vat";
}

function normalizeStockRows(rows = [], next = { purchases: [] }) {
  const purchases = next.purchases || [];
  return rows.map((row) => ({
    ...row,
    firmId: inferFirmIdForStockRow(row, purchases)
  }));
}

function stockRowMatches(row, { warehouseId = "", firmId = "", clientId = "" } = {}) {
  if (warehouseId && row.warehouseId !== warehouseId) return false;
  if (firmId && (row.firmId || "vat") !== firmId) return false;
  return (row.clientId || "") === (clientId || "");
}

function ownStockPredicate({ warehouseId = "", firmId = "" } = {}) {
  return (row) => isOwnStockRow(row) && stockRowMatches(row, { warehouseId, firmId, clientId: "" });
}

function stockContextMessage(productId, qty, warehouseId = "", firmId = "") {
  const parts = [`Недостатньо залишку: ${productName(productId)}`, `потрібно ${qty} од.`];
  if (warehouseId) parts.push(`склад ${warehouseName(warehouseId)}`);
  if (firmId) parts.push(`фірма ${firmName(firmId)}`);
  return `${parts.join(" · ")}.`;
}

function stockQtyWhere(productId, predicate) {
  return state.stock
    .filter((row) => row.productId === productId && Number(row.qty || 0) > 0 && predicate(row))
    .reduce((sum, row) => sum + Number(row.qty || 0), 0);
}

function decrementStockWhere(productId, qty, predicate, errorMessage) {
  const amount = Number(qty || 0);
  if (stockQtyWhere(productId, predicate) < amount) {
    throw new Error(errorMessage || "Недостатньо залишку для списання.");
  }
  let remaining = amount;
  const rows = state.stock.filter((row) => row.productId === productId && Number(row.qty || 0) > 0 && predicate(row));
  for (const row of rows) {
    const take = Math.min(Number(row.qty || 0), remaining);
    row.qty -= take;
    remaining -= take;
    if (remaining <= 0) break;
  }
}

function ownAvailableSerialsForProduct(product) {
  return state.serials
    .filter((serial) => serialMatchesProduct(serial, product) && serial.status === "available" && !serial.clientId)
    .filter((serial) => !serialIsSold(serial) && serial.actual !== false)
    .sort((first, second) => first.serial.localeCompare(second.serial, "uk"));
}

function clientStorageSerials(clientId, productId = "", includeSold = false) {
  return state.serials
    .filter((serial) => serial.clientId === clientId)
    .filter((serial) => !productId || serial.productId === productId)
    .filter((serial) => includeSold || serial.status === "responsible_storage")
    .sort((first, second) => Number(first.status === "sold") - Number(second.status === "sold") || first.serial.localeCompare(second.serial, "uk"));
}

function b2bSerialOption(serial, selectedIds = [], mode = "sale") {
  const product = byId(state.products, serial.productId);
  const canSelect = mode === "shipment"
    ? serial.status === "available" && !serial.clientId && !serialIsSold(serial) && serial.actual !== false
    : serial.status === "responsible_storage" && serialIsSelectable(serial);
  const className = canSelect ? "serial-available" : serialIsSold(serial) ? "serial-sold" : "serial-blocked";
  const label = `${serial.serial} · ${product?.model || "модель"} · ${warehouseName(serial.warehouseId)} · ${firmName(serial.firmId || "vat")} · ${serialStatusText(serial)}`;
  return `<option value="${escapeHtml(serial.id)}" ${selectedIds.includes(serial.id) ? "selected" : ""} ${canSelect ? "" : "disabled"} class="${className}">${escapeHtml(label)}</option>`;
}

function responsibleDocSoldQty(doc) {
  if (doc.soldQty !== undefined) return Number(doc.soldQty || 0);
  return (doc.serialIds || []).filter((serialId) => {
    const serial = byId(state.serials, serialId);
    return serial ? serialIsSold(serial) : false;
  }).length;
}

function responsibleDocRemainingQty(doc) {
  return Math.max(Number(doc.qty || 0) - responsibleDocSoldQty(doc), 0);
}

function responsibleDocStatus(doc) {
  const sold = responsibleDocSoldQty(doc);
  if (responsibleDocRemainingQty(doc) <= 0 && Number(doc.qty || 0) > 0) return "ownership_transferred";
  if (sold > 0) return "reported_sale";
  return doc.status || "in_storage";
}

function ownershipLabel(doc) {
  return responsibleDocStatus(doc) === "ownership_transferred"
    ? "перейшла клієнту після продажу"
    : "наша до продажу клієнтом";
}

function responsibleStorageRows(clientId = "") {
  return state.responsibleStorageDocs
    .filter((doc) => !clientId || doc.clientId === clientId)
    .map((doc) => ({
      ...doc,
      client: byId(state.clients, doc.clientId),
      product: byId(state.products, doc.productId),
      warehouse: byId(state.warehouses, doc.warehouseId),
      soldQty: responsibleDocSoldQty(doc),
      remainingQty: responsibleDocRemainingQty(doc),
      derivedStatus: responsibleDocStatus(doc)
    }));
}

function b2bResponsibleStorageFilter() {
  const filter = state.b2bResponsibleStorageFilters || {};
  const sortBy = ["document", "date", "client", "product", "qty", "sold", "remaining", "serials", "paymentDays", "status"].includes(filter.sortBy)
    ? filter.sortBy
    : "date";
  return {
    from: filter.from || "",
    to: filter.to || "",
    clientId: filter.clientId || "",
    productId: filter.productId || "",
    search: filter.search || "",
    sortBy,
    sortDir: filter.sortDir === "asc" ? "asc" : "desc",
    expanded: Boolean(filter.expanded)
  };
}

function responsibleStorageStatusLabel(row) {
  return plainTextFromHtml(statusPill(row.derivedStatus || row.status)) || row.derivedStatus || row.status || "";
}

function responsibleStorageSerialText(row) {
  return (row.serialIds || []).map((serialId) => byId(state.serials, serialId)?.serial || serialId).join(" ");
}

function responsibleStorageSearchText(row) {
  return normalizeSearchText([
    row.id,
    row.date,
    row.manager,
    row.client?.name || clientName(row.clientId),
    row.warehouse?.name || warehouseName(row.warehouseId),
    productName(row.productId),
    productCodes(row.product),
    row.qty,
    row.soldQty,
    row.remainingQty,
    responsibleStorageSerialText(row),
    row.paymentDays || state.settings.defaultDueDays,
    responsibleStorageStatusLabel(row),
    ownershipLabel(row),
    row.comment
  ].filter(Boolean).join(" "));
}

function responsibleStorageMatchesSearch(row, filter) {
  const words = Array.isArray(filter) ? filter : searchWords(filter.search || filter);
  if (!words.length) return true;
  const haystack = responsibleStorageSearchText(row);
  return words.every((word) => haystack.includes(word));
}

function responsibleStorageSortValue(row, key) {
  const values = {
    document: `${row.id || ""} ${row.manager || ""}`,
    date: row.date || "",
    client: `${row.client?.name || clientName(row.clientId)} ${row.warehouse?.name || warehouseName(row.warehouseId)}`,
    product: `${productName(row.productId)} ${productCodes(row.product)}`,
    qty: Number(row.qty || 0),
    sold: Number(row.soldQty || 0),
    remaining: Number(row.remainingQty || 0),
    serials: responsibleStorageSerialText(row),
    paymentDays: Number(row.paymentDays || state.settings.defaultDueDays || 0),
    status: `${responsibleStorageStatusLabel(row)} ${ownershipLabel(row)}`
  };
  return values[key] ?? "";
}

function sortResponsibleStorageRows(rows, filter) {
  const direction = filter.sortDir === "asc" ? 1 : -1;
  return [...rows].sort((first, second) => {
    const result = compareSortValues(
      responsibleStorageSortValue(first, filter.sortBy),
      responsibleStorageSortValue(second, filter.sortBy)
    );
    if (result) return result * direction;
    return String(second.date || "").localeCompare(String(first.date || ""), "uk", { numeric: true, sensitivity: "base" });
  });
}

function b2bShipmentRequestRows(clientId = "") {
  return (state.b2bShipmentRequests || [])
    .filter((request) => (
      (!clientId || request.clientId === clientId)
      && (clientId || !["request_draft", "request_cancelled"].includes(request.status))
    ))
    .map((request) => ({
      ...request,
      client: byId(state.clients, request.clientId),
      product: byId(state.products, request.productId),
      issues: ["request_draft", "request_approved", "request_rejected", "request_cancelled"].includes(request.status) ? [] : b2bShipmentRequestIssues(request, { requireManagerFields: true })
    }));
}

function b2bShipmentRequestFilter() {
  const filter = state.b2bShipmentRequestFilters || {};
  const sortBy = ["date", "client", "product", "qty", "desiredDate", "status", "issues"].includes(filter.sortBy)
    ? filter.sortBy
    : "date";
  return {
    from: filter.from || "",
    to: filter.to || "",
    status: filter.status || "",
    search: filter.search || "",
    sortBy,
    sortDir: filter.sortDir === "asc" ? "asc" : "desc",
    expanded: Boolean(filter.expanded)
  };
}

function plainTextFromHtml(value) {
  return String(value ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function b2bShipmentRequestStatusLabel(status) {
  return B2B_SHIPMENT_REQUEST_STATUS_MAP[status]?.label || plainTextFromHtml(statusPill(status)) || status || "";
}

function b2bShipmentRequestIssueText(row) {
  return plainTextFromHtml(b2bShipmentRequestIssueHtml(row.issues || [], true));
}

function b2bShipmentRequestSearchText(row) {
  return normalizeSearchText([
    row.id,
    row.date,
    row.client?.name || clientName(row.clientId),
    row.manager,
    productName(row.productId),
    productCodes(row.product),
    row.qty,
    row.desiredDate,
    row.status,
    b2bShipmentRequestStatusLabel(row.status),
    row.responsibleDocId,
    b2bShipmentRequestIssueText(row),
    row.comment,
    row.delivery,
    row.ttn,
    row.firmId,
    row.warehouseId,
    row.currency,
    row.price
  ].filter(Boolean).join(" "));
}

function b2bShipmentRequestMatchesSearch(row, filter) {
  const words = Array.isArray(filter) ? filter : searchWords(filter.search || filter);
  if (!words.length) return true;
  const haystack = b2bShipmentRequestSearchText(row);
  return words.every((word) => haystack.includes(word));
}

function b2bShipmentRequestSortValue(row, key) {
  const values = {
    date: `${row.date || ""} ${row.id || ""}`,
    client: `${row.client?.name || clientName(row.clientId)} ${row.manager || ""}`,
    product: `${productName(row.productId)} ${productCodes(row.product)}`,
    qty: Number(row.qty || 0),
    desiredDate: row.desiredDate || "",
    status: b2bShipmentRequestStatusLabel(row.status),
    issues: b2bShipmentRequestIssueText(row)
  };
  return values[key] ?? "";
}

function sortB2BShipmentRequestRows(rows, filter) {
  const direction = filter.sortDir === "asc" ? 1 : -1;
  return [...rows].sort((first, second) => {
    const result = compareSortValues(
      b2bShipmentRequestSortValue(first, filter.sortBy),
      b2bShipmentRequestSortValue(second, filter.sortBy)
    );
    if (result) return result * direction;
    return String(second.date || "").localeCompare(String(first.date || ""), "uk", { numeric: true, sensitivity: "base" });
  });
}

function findOpenB2BShipmentRequest(clientId, productId, desiredDate = "", statuses = ["request_new", "request_review", "request_draft"]) {
  const normalizedDate = desiredDate || "";
  return (state.b2bShipmentRequests || []).find((request) => (
    request.clientId === clientId
    && request.productId === productId
    && (request.desiredDate || "") === normalizedDate
    && statuses.includes(request.status)
  ));
}

function b2bShipmentRequestIssues(request = {}, options = {}) {
  const issues = [];
  const client = byId(state.clients, request.clientId);
  const product = byId(state.products, request.productId);
  const qty = Number(request.qty || 0);
  const firmId = request.firmId || "";
  const warehouseId = request.warehouseId || "";
  const serialIds = Array.isArray(request.serialIds) ? request.serialIds : [];

  if (!client || client.type !== "B2B") issues.push("Оберіть чинного B2B клієнта для заявки.");
  if (!product) issues.push("Оберіть товар із каталогу CRM. Заявка не може перейти в накладну без картки товару.");
  if (qty <= 0) issues.push("Кількість у заявці має бути більшою за нуль.");
  if (!product || qty <= 0) return issues;

  if (options.requireManagerFields) {
    if (!firmId) issues.push("Менеджеру потрібно обрати фірму-власника, з якої буде відвантаження.");
    if (!warehouseId) issues.push("Менеджеру потрібно обрати склад, з якого буде відвантаження.");
    if (request.price === "" || request.price === undefined) issues.push("Менеджеру потрібно вказати ціну відвантаження.");
    if (!request.currency) issues.push("Менеджеру потрібно обрати валюту документа.");
    if (request.paymentDays === "" || request.paymentDays === undefined) issues.push("Менеджеру потрібно вказати термін оплати після продажу.");
  }

  if (!firmId || !warehouseId) return issues;

  if (product.type !== "weapon") {
    const available = stockQtyWhere(product.id, ownStockPredicate({ warehouseId, firmId }));
    if (available < qty) {
      issues.push(`${stockContextMessage(product.id, qty, warehouseId, firmId)} Доступно зараз: ${available} од.`);
    }
    return issues;
  }

  const availableSerials = ownAvailableSerialsForProduct(product)
    .filter((serial) => serialMatchesStockContext(serial, { warehouseId, firmId, clientId: "" }));
  const availableIds = new Set(availableSerials.map((serial) => serial.id));
  if (availableSerials.length < qty) {
    issues.push(`Недостатньо вільних серій для ${productName(product.id)} по фірмі ${firmName(firmId)} і складу ${warehouseName(warehouseId)}: доступно ${availableSerials.length}, потрібно ${qty}.`);
  }
  if (serialIds.length !== qty) {
    issues.push(`Для зброї кількість (${qty}) має дорівнювати кількості вибраних серій (${serialIds.length}).`);
  }
  const duplicates = duplicateValues(serialIds);
  if (duplicates.length) issues.push(`Серійний номер вибрано повторно: ${duplicates.join(", ")}.`);

  serialIds.forEach((serialId) => {
    const serial = byId(state.serials, serialId);
    if (!serial) {
      issues.push(`Серійний номер ${serialId} не знайдено в CRM.`);
      return;
    }
    if (!serialMatchesProduct(serial, product)) issues.push(`Серія ${serial.serial} належить іншій моделі, а не ${productName(product.id)}.`);
    if ((serial.firmId || "vat") !== firmId) issues.push(`Серія ${serial.serial} належить фірмі ${firmName(serial.firmId || "vat")}, а в заявці вибрано ${firmName(firmId)}.`);
    if (serial.warehouseId !== warehouseId) issues.push(`Серія ${serial.serial} лежить на складі ${warehouseName(serial.warehouseId)}, а в заявці вибрано ${warehouseName(warehouseId)}.`);
    if (serial.clientId) issues.push(`Серія ${serial.serial} вже закріплена за клієнтом ${clientName(serial.clientId)}.`);
    if (serial.status !== "available") issues.push(`Серія ${serial.serial} має статус "${serial.status}" і не є вільною для відвантаження.`);
    if (serialIsSold(serial)) issues.push(`Серія ${serial.serial} вже продана. Повторний вибір заблоковано.`);
    if (serial.actual === false) issues.push(`Серія ${serial.serial} неактуальна.`);
    if (!availableIds.has(serial.id)) issues.push(`Серія ${serial.serial} не проходить перевірку доступності для вибраної фірми та товару.`);
  });

  return uniqueList(issues);
}

function stockQtyText(qty) {
  return new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3
  }).format(Number(qty || 0));
}

function b2bRequestAvailabilityRows(product, requestedQty = 0) {
  if (!product) return [];
  const requested = Number(requestedQty || 0);
  const groups = new Map();
  const groupFor = (firmId = "vat", warehouseId = "") => {
    const normalizedFirmId = firmId || "vat";
    const key = `${normalizedFirmId}::${warehouseId}`;
    if (!groups.has(key)) {
      groups.set(key, {
        firmId: normalizedFirmId,
        warehouseId,
        qty: 0,
        serialIds: []
      });
    }
    return groups.get(key);
  };

  if (product.type === "weapon") {
    ownAvailableSerialsForProduct(product).forEach((serial) => {
      const warehouse = byId(state.warehouses, serial.warehouseId);
      if (!warehouse || ["client_responsible", "responsible"].includes(warehouse.kind)) return;
      const group = groupFor(serial.firmId || "vat", serial.warehouseId);
      group.qty += 1;
      group.serialIds.push(serial.id);
    });
  } else {
    state.stock.forEach((row) => {
      const qty = Number(row.qty || 0);
      if (row.productId !== product.id || qty <= 0 || !isOwnStockRow(row)) return;
      groupFor(row.firmId || "vat", row.warehouseId).qty += qty;
    });
  }

  return [...groups.values()]
    .map((row) => ({
      ...row,
      enough: requested > 0 ? row.qty >= requested : row.qty > 0
    }))
    .sort((first, second) => (
      Number(second.enough) - Number(first.enough)
      || second.qty - first.qty
      || firmName(first.firmId).localeCompare(firmName(second.firmId), "uk")
      || warehouseName(first.warehouseId).localeCompare(warehouseName(second.warehouseId), "uk")
    ));
}

function renderB2BRequestAvailability(product, qty, selectedFirmId = "", selectedWarehouseId = "") {
  const rows = b2bRequestAvailabilityRows(product, qty);
  const requested = Number(qty || 0);
  const productTitle = product ? productName(product.id) : "товар";
  const emptyText = product
    ? "Немає вільного залишку цього товару на наших складах. Менеджер має змінити товар, кількість або перевірити прихід."
    : "Оберіть товар, щоб побачити залишки по фірмах і складах.";

  if (!rows.length) {
    return `
      <section class="b2b-stock-advisor full">
        <div class="split">
          <div>
            <h3>Довідково: наявність по фірмах і складах</h3>
            <p class="small muted">Товар: ${escapeHtml(productTitle)}. Потрібно: ${stockQtyText(requested)} од.</p>
          </div>
        </div>
        <p class="notice warn small">${escapeHtml(emptyText)}</p>
      </section>
    `;
  }

  return `
    <section class="b2b-stock-advisor full">
      <div class="split">
        <div>
          <h3>Довідково: наявність по фірмах і складах</h3>
          <p class="small muted">Товар: ${escapeHtml(productTitle)}. Це тільки підказка для менеджера, клієнт ці залишки не бачить.</p>
        </div>
        <span class="pill info">потрібно ${stockQtyText(requested)} од.</span>
      </div>
      <div class="table-wrap compact-table">
        <table>
          <thead>
            <tr><th>Фірма</th><th>Склад</th><th>Доступно</th><th>Покриття</th><th>Серії / примітка</th><th>Дія</th></tr>
          </thead>
          <tbody>
            ${rows.map((row) => {
              const isCurrent = row.firmId === selectedFirmId && row.warehouseId === selectedWarehouseId;
              const details = product?.type === "weapon"
                ? `${serialBadges(row.serialIds.slice(0, 12))}${row.serialIds.length > 12 ? ` <span class="small muted">+${row.serialIds.length - 12}</span>` : ""}`
                : '<span class="small muted">Звичайний товар. Серійні номери не потрібні.</span>';
              const action = isCurrent
                ? '<span class="pill info">обрано</span>'
                : `<button class="secondary" type="button" data-fill-b2b-request-stock data-firm-id="${escapeHtml(row.firmId)}" data-warehouse-id="${escapeHtml(row.warehouseId)}">Вибрати</button>`;
              return `
                <tr class="${isCurrent ? "selected-context" : ""}">
                  <td>${escapeHtml(firmName(row.firmId))}</td>
                  <td>${escapeHtml(warehouseName(row.warehouseId))}</td>
                  <td><strong>${stockQtyText(row.qty)} од.</strong></td>
                  <td><span class="${row.enough ? "stock-enough" : "stock-short"}">${row.enough ? "вистачає" : "не вистачає"}</span></td>
                  <td>${details}</td>
                  <td>${action}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function b2bShipmentRequestIssueHtml(issues = [], compact = false) {
  if (!issues.length) return '<p class="notice good small">Перевірка пройдена. Заявку можна перетворити на накладну відвантаження.</p>';
  const list = (compact ? issues.slice(0, 2) : issues).map((issue) => `<li>${escapeHtml(issue)}</li>`).join("");
  const more = compact && issues.length > 2 ? `<li>Ще ${issues.length - 2} помилок відкрийте в підготовці заявки.</li>` : "";
  return `<div class="notice danger small request-errors"><strong>Потрібно виправити менеджеру:</strong><ul>${list}${more}</ul></div>`;
}

function clientStorageRows(clientId) {
  return inventoryRows().filter((row) => row.clientId === clientId);
}

function inventoryRowMatchesFilter(row, filter = state.inventoryFilters || {}) {
  if (filter.warehouseId && row.warehouseId !== filter.warehouseId) return false;
  if (filter.firmId && (row.firmId || "vat") !== filter.firmId) return false;
  return true;
}

function filteredInventoryRows() {
  return inventoryRows().filter((row) => inventoryRowMatchesFilter(row));
}

function renderInventoryFilters(filter, totalRows, filteredRows) {
  return `
    <form class="period-toolbar no-print" data-inventory-filter>
      <label>
        <span>Склад</span>
        <select name="warehouseId">
          <option value="">Всі склади</option>
          ${state.warehouses.map((warehouse) => option(warehouse.id, warehouse.name, warehouse.id === filter.warehouseId)).join("")}
        </select>
      </label>
      <label>
        <span>Фірма</span>
        <select name="firmId">
          <option value="">Всі фірми</option>
          ${state.settings.firms.map((firm) => option(firm.id, firm.name, firm.id === filter.firmId)).join("")}
        </select>
      </label>
      <span class="pill info">Показано ${filteredRows} з ${totalRows}</span>
    </form>
  `;
}

function serialBadges(serialIds = []) {
  if (!serialIds.length) return "-";
  return serialIds.map((serialId) => {
    const serial = byId(state.serials, serialId);
    if (!serial) return "";
    const kind = serial.status === "sold" ? "danger" : serial.status === "responsible_storage" ? "info" : "good";
    return `<span class="pill ${kind}">${escapeHtml(serial.serial)}</span>`;
  }).filter(Boolean).join(" ");
}

function productCodes(product) {
  return [product?.barcode, product?.qrCode].filter(Boolean).join(" / ") || "-";
}

function safeFilePart(value) {
  return String(value || "report").replace(/[^a-zA-Z0-9А-Яа-яІіЇїЄєҐґ_-]+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

function renderWarehouse() {
  const docsPeriod = periodFilter("warehouseDocs");
  const inventoryFilter = state.inventoryFilters || {};
  const allRows = inventoryRows();
  const rows = allRows.filter((row) => inventoryRowMatchesFilter(row, inventoryFilter));
  const visibleWarehouses = inventoryFilter.warehouseId
    ? state.warehouses.filter((warehouse) => warehouse.id === inventoryFilter.warehouseId)
    : state.warehouses;
  return `
    <section class="grid three section-band">
      ${visibleWarehouses.map((warehouse) => {
        const whRows = rows.filter((row) => row.warehouseId === warehouse.id);
        const qty = whRows.reduce((sum, row) => sum + row.qty, 0);
        const value = whRows.reduce((sum, row) => sum + row.valueUAH, 0);
        return `<article class="card metric ${warehouse.kind === "responsible" ? "info" : "good"}"><span>${warehouse.name}</span><strong>${qty} од.</strong><small>${formatMoney(value)} в обліковій валюті</small></article>`;
      }).join("")}
    </section>

    <section class="panel section-band" data-print-area="warehouseDocs" data-print-title="Інвентаризація та залишки">
      <div class="split">
        <h2>Інвентаризація та залишки</h2>
        <button class="secondary" data-create-inventory-report>Сформувати звіт</button>
      </div>
      ${renderPeriodPrintControls("warehouseDocs", "Інвентаризація та залишки", docsPeriod, rows.length)}
      ${renderInventoryFilters(inventoryFilter, allRows.length, rows.length)}
      <div class="table-wrap">
        <table>
          <thead><tr><th>Товар</th><th>Тип</th><th>Фірма</th><th>Склад</th><th>B2B власник</th><th>Кількість</th><th>Валюта приходу</th><th>Собівартість UAH</th></tr></thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td><strong>${row.product.brand}</strong><br>${row.product.model}</td>
                <td>${row.product.type === "weapon" ? "серійний" : "кількісний"}</td>
                <td>${firmName(row.firmId || "vat")}</td>
                <td>${warehouseName(row.warehouseId)}</td>
                <td>${row.clientId ? clientName(row.clientId) : "-"}</td>
                <td>${row.qty}</td>
                <td>${formatMoney(row.product.cost, row.product.costCurrency)}</td>
                <td>${formatMoney(row.valueUAH)}</td>
              </tr>
            `).join("") || '<tr><td colspan="8" class="muted">Немає залишків за вибраним складом або фірмою.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderB2BLegacy() {
  return `
    <section class="grid three section-band">
      ${state.clients.filter((client) => client.type === "B2B").map((client) => {
        const receivable = state.invoices.filter((invoice) => invoice.clientId === client.id && isDebtInvoice(invoice)).reduce((sum, invoice) => sum + invoice.total - invoice.paid, 0);
        const storageQty = inventoryRows().filter((row) => row.clientId === client.id).reduce((sum, row) => sum + row.qty, 0);
        return `
          <article class="card stack">
            <div class="split">
              <div>
                <strong>${client.name}</strong>
                <p class="small muted">${client.manager} · ${client.paymentTerms}</p>
              </div>
              ${client.cabinetEnabled ? '<span class="pill good">кабінет</span>' : '<span class="pill">немає</span>'}
            </div>
            <div class="grid two">
              <div><span class="small muted">Дебіторка</span><br><strong>${formatMoney(receivable)}</strong></div>
              <div><span class="small muted">Відп. зберігання</span><br><strong>${storageQty} од.</strong></div>
            </div>
            <button class="secondary" data-open-cabinet="${client.id}">Відкрити кабінет</button>
          </article>
        `;
      }).join("")}
    </section>

    <section class="panel">
      <h2>Кабінет B2B клієнта</h2>
      <p class="notice">Клієнт може бачити власний залишок на відповідальному зберіганні, вести роздрібні продажі через наш інтерфейс, отримувати інвентаризаційний звіт та звіт проплат. Для зброї в кабінеті можна лише резервувати одиницю, продаж підтверджує менеджер із правом продажу зброї.</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Клієнт</th><th>Ліміт</th><th>Умови</th><th>Накладні</th><th>Проплати</th><th>Менеджер</th></tr></thead>
          <tbody>
            ${state.clients.filter((client) => client.type === "B2B").map((client) => {
              const invoices = state.invoices.filter((invoice) => invoice.clientId === client.id && isDebtInvoice(invoice));
              const paid = invoices.reduce((sum, invoice) => sum + invoice.paid, 0);
              return `
                <tr>
                  <td><strong>${client.name}</strong></td>
                  <td>${formatMoney(client.creditLimitUAH)}</td>
                  <td>${client.paymentTerms}</td>
                  <td>${invoices.length}</td>
                  <td>${formatMoney(paid)}</td>
                  <td>${client.manager}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderB2BShipmentRequestFilters(filter, resultCount, totalCount) {
  return `
    <form class="period-toolbar marketplace-filter no-print" data-action="filter-b2b-shipment-requests" data-b2b-shipment-request-filter>
      <label class="field compact"><span>Дата створення від</span><input name="from" type="date" value="${escapeHtml(filter.from)}"></label>
      <label class="field compact"><span>Дата створення до</span><input name="to" type="date" value="${escapeHtml(filter.to)}"></label>
      <label class="field compact"><span>Статус виконання</span><select name="status">
        <option value="">Всі статуси</option>
        ${B2B_SHIPMENT_REQUEST_STATUSES.map((item) => option(item.id, item.label, item.id === filter.status)).join("")}
      </select></label>
      <label class="field wide"><span>Пошук у списку</span><input name="search" data-b2b-shipment-request-search value="${escapeHtml(filter.search)}" placeholder="клієнт, товар, код, заявка, статус, менеджер"></label>
      <span class="pill info" data-b2b-shipment-request-result-count>${resultCount} із ${totalCount} заявок</span>
      <button class="ghost" type="button" data-reset-b2b-shipment-request-filter>Скинути</button>
    </form>
  `;
}

function renderB2BShipmentRequestSortHeader(key, label, filter) {
  const active = filter.sortBy === key;
  const direction = active && filter.sortDir === "asc" ? "ascending" : active ? "descending" : "none";
  const indicator = active ? (filter.sortDir === "asc" ? "↑" : "↓") : "↕";
  return `
    <th aria-sort="${direction}">
      <button class="table-sort ${active ? "active" : ""}" type="button" data-b2b-shipment-request-sort="${escapeHtml(key)}">
        <span>${escapeHtml(label)}</span><span class="sort-indicator" aria-hidden="true">${indicator}</span>
      </button>
    </th>
  `;
}

function renderB2BShipmentRequestRow(row, visible = true) {
  return `
    <tr data-b2b-shipment-request-row data-b2b-request-search-text="${escapeHtml(b2bShipmentRequestSearchText(row))}" ${visible ? "" : 'style="display: none;"'}>
      <td><strong>${escapeHtml(row.id)}</strong><br><span class="small muted">${escapeHtml(row.date)}</span></td>
      <td>${escapeHtml(row.client?.name || clientName(row.clientId))}<br><span class="small muted">${escapeHtml(row.manager || "-")}</span></td>
      <td>${escapeHtml(productName(row.productId))}<br><span class="small muted">${escapeHtml(productCodes(row.product))}</span></td>
      <td>${escapeHtml(row.qty)}</td>
      <td>${escapeHtml(row.desiredDate || "-")}</td>
      <td>${statusPill(row.status)}${row.responsibleDocId ? `<br><span class="small muted">${escapeHtml(row.responsibleDocId)}</span>` : ""}</td>
      <td>${b2bShipmentRequestIssueHtml(row.issues, true)}</td>
      <td class="row-actions">
        <button class="secondary" data-open-b2b-shipment-request="${escapeHtml(row.id)}" ${["request_approved", "request_rejected", "request_cancelled"].includes(row.status) ? "disabled" : ""}>Підготувати</button>
        <button class="ghost danger" data-reject-b2b-shipment-request="${escapeHtml(row.id)}" ${["request_approved", "request_rejected", "request_cancelled"].includes(row.status) ? "disabled" : ""}>Відхилити</button>
      </td>
    </tr>
  `;
}

function applyB2BShipmentRequestSearch(root = document) {
  const input = root.querySelector("[data-b2b-shipment-request-search]");
  const details = root.querySelector("[data-b2b-shipment-requests-dropdown]");
  if (!input || !details) return;
  const words = searchWords(input.value);
  const rows = Array.from(details.querySelectorAll("[data-b2b-shipment-request-row]"));
  let visibleCount = 0;
  rows.forEach((row) => {
    const haystack = row.dataset.b2bRequestSearchText || "";
    const visible = words.every((word) => haystack.includes(word));
    row.style.display = visible ? "" : "none";
    if (visible) visibleCount += 1;
  });
  const emptyRow = details.querySelector("[data-b2b-shipment-request-empty]");
  if (emptyRow) emptyRow.style.display = visibleCount ? "none" : "";
  const resultCount = root.querySelector("[data-b2b-shipment-request-result-count]");
  if (resultCount) resultCount.textContent = `${visibleCount} із ${rows.length} заявок`;
  const summaryCount = details.querySelector("[data-b2b-shipment-request-summary-count]");
  if (summaryCount) summaryCount.textContent = `${visibleCount} рядків`;
  if (words.length) details.open = true;
  updateDropdownHint(details);
}

function renderResponsibleStorageFilters(filter, resultCount, totalCount, rows) {
  const clientIds = uniqueList(rows.map((row) => row.clientId).filter(Boolean));
  const productIds = uniqueList(rows.map((row) => row.productId).filter(Boolean));
  return `
    <form class="period-toolbar marketplace-filter no-print" data-action="filter-b2b-responsible-storage" data-b2b-responsible-storage-filter>
      <label class="field compact"><span>Дата створення від</span><input name="from" type="date" value="${escapeHtml(filter.from)}"></label>
      <label class="field compact"><span>Дата створення до</span><input name="to" type="date" value="${escapeHtml(filter.to)}"></label>
      <label class="field compact"><span>Клієнт</span><select name="clientId">
        <option value="">Всі клієнти</option>
        ${clientIds.map((clientId) => option(clientId, clientName(clientId), clientId === filter.clientId)).join("")}
      </select></label>
      <label class="field wide"><span>Товар</span><select name="productId">
        <option value="">Всі товари</option>
        ${productIds.map((productId) => option(productId, productName(productId), productId === filter.productId)).join("")}
      </select></label>
      <label class="field wide"><span>Пошук у списку</span><input name="search" data-b2b-responsible-storage-search value="${escapeHtml(filter.search)}" placeholder="документ, клієнт, товар, серія, склад, статус"></label>
      <span class="pill info" data-b2b-responsible-storage-result-count>${resultCount} із ${totalCount} рядків</span>
      <button class="secondary" type="button" data-print-scope="b2bDocs" ${canPrintDocuments() ? "" : "disabled"}>Друк</button>
      <button class="ghost" type="button" data-reset-b2b-responsible-storage-filter>Скинути</button>
    </form>
  `;
}

function renderResponsibleStorageSortHeader(key, label, filter) {
  const active = filter.sortBy === key;
  const direction = active && filter.sortDir === "asc" ? "ascending" : active ? "descending" : "none";
  const indicator = active ? (filter.sortDir === "asc" ? "↑" : "↓") : "↕";
  return `
    <th aria-sort="${direction}">
      <button class="table-sort ${active ? "active" : ""}" type="button" data-b2b-responsible-storage-sort="${escapeHtml(key)}">
        <span>${escapeHtml(label)}</span><span class="sort-indicator" aria-hidden="true">${indicator}</span>
      </button>
    </th>
  `;
}

function renderResponsibleStorageRow(row, visible = true) {
  return `
    <tr data-b2b-responsible-storage-row data-b2b-storage-search-text="${escapeHtml(responsibleStorageSearchText(row))}" ${visible ? "" : 'style="display: none;"'}>
      <td><strong>${escapeHtml(row.id)}</strong><br><span class="small muted">${escapeHtml(row.manager || "-")}</span></td>
      <td>${escapeHtml(row.date)}</td>
      <td><strong>${escapeHtml(row.client?.name || clientName(row.clientId))}</strong><br><span class="small muted">${escapeHtml(row.warehouse?.name || warehouseName(row.warehouseId))}</span></td>
      <td>${escapeHtml(productName(row.productId))}<br><span class="small muted">${escapeHtml(productCodes(row.product))}</span></td>
      <td>${escapeHtml(row.qty)}</td>
      <td>${escapeHtml(row.soldQty)}</td>
      <td><strong>${escapeHtml(row.remainingQty)}</strong></td>
      <td>${serialBadges(row.serialIds)}</td>
      <td>${escapeHtml(row.paymentDays || state.settings.defaultDueDays)} днів</td>
      <td>${statusPill(row.derivedStatus)}<br><span class="small muted">${escapeHtml(ownershipLabel(row))}</span></td>
      <td class="row-actions no-print"><button class="ghost" data-edit-responsible-doc="${escapeHtml(row.id)}" ${canEditPostedDocument("responsibleShipment") ? "" : "disabled"}>Змінити</button></td>
    </tr>
  `;
}

function applyResponsibleStorageSearch(root = document) {
  const input = root.querySelector("[data-b2b-responsible-storage-search]");
  const details = root.querySelector("[data-b2b-responsible-storage-dropdown]");
  if (!input || !details) return;
  const words = searchWords(input.value);
  const rows = Array.from(details.querySelectorAll("[data-b2b-responsible-storage-row]"));
  let visibleCount = 0;
  rows.forEach((row) => {
    const haystack = row.dataset.b2bStorageSearchText || "";
    const visible = words.every((word) => haystack.includes(word));
    row.style.display = visible ? "" : "none";
    if (visible) visibleCount += 1;
  });
  const emptyRow = details.querySelector("[data-b2b-responsible-storage-empty]");
  if (emptyRow) emptyRow.style.display = visibleCount ? "none" : "";
  const resultCount = root.querySelector("[data-b2b-responsible-storage-result-count]");
  if (resultCount) resultCount.textContent = `${visibleCount} із ${rows.length} рядків`;
  const summaryCount = details.querySelector("[data-b2b-responsible-storage-summary-count]");
  if (summaryCount) summaryCount.textContent = `${visibleCount} рядків`;
  if (words.length) details.open = true;
  updateDropdownHint(details);
}

function renderB2B() {
  const docsPeriod = periodFilter("b2bDocs");
  const shipmentRequestFilter = b2bShipmentRequestFilter();
  const responsibleStorageFilter = b2bResponsibleStorageFilter();
  const b2bClients = state.clients.filter((client) => client.type === "B2B");
  const shipmentProduct = byId(state.products, b2bDraft.shipmentProductId) || state.products[0];
  const saleClient = byId(state.clients, b2bDraft.saleClientId) || b2bClients[0];
  const saleProduct = byId(state.products, b2bDraft.saleProductId) || shipmentProduct || state.products[0];
  const shipmentFirmId = b2bDraft.shipmentFirmId || state.settings.firms[0]?.id || "vat";
  const saleFirmId = b2bDraft.saleFirmId || shipmentFirmId;
  const shipmentSerials = shipmentProduct?.type === "weapon" ? ownAvailableSerialsForProduct(shipmentProduct).filter((serial) => serialMatchesStockContext(serial, { firmId: shipmentFirmId, clientId: "" })) : [];
  const saleSerials = saleProduct?.type === "weapon" && saleClient ? clientStorageSerials(saleClient.id, saleProduct.id, true).filter((serial) => !saleFirmId || (serial.firmId || "vat") === saleFirmId) : [];
  const responsibleRows = responsibleStorageRows();
  const responsibleDateEntityRows = sortResponsibleStorageRows(
    responsibleRows.filter((row) => (
      dateInOptionalPeriod(row.date, responsibleStorageFilter)
      && (!responsibleStorageFilter.clientId || row.clientId === responsibleStorageFilter.clientId)
      && (!responsibleStorageFilter.productId || row.productId === responsibleStorageFilter.productId)
    )),
    responsibleStorageFilter
  );
  const responsibleStorageWords = searchWords(responsibleStorageFilter.search);
  const filteredResponsibleRows = responsibleDateEntityRows.filter((row) => responsibleStorageMatchesSearch(row, responsibleStorageWords));
  const responsibleStorageEmptyText = responsibleDateEntityRows.length ? "Документів за введеними словами немає." : "Документів відповідального зберігання за вибраними відборами немає.";
  const shipmentRequestRows = b2bShipmentRequestRows();
  const shipmentRequestDateStatusRows = sortB2BShipmentRequestRows(
    shipmentRequestRows.filter((row) => dateInOptionalPeriod(row.date, shipmentRequestFilter) && (!shipmentRequestFilter.status || row.status === shipmentRequestFilter.status)),
    shipmentRequestFilter
  );
  const shipmentRequestWords = searchWords(shipmentRequestFilter.search);
  const filteredShipmentRequestRows = shipmentRequestDateStatusRows.filter((row) => b2bShipmentRequestMatchesSearch(row, shipmentRequestWords));
  const shipmentRequestEmptyText = shipmentRequestDateStatusRows.length ? "Заявок B2B за введеними словами немає." : "Заявок B2B на відвантаження за вибраними відборами немає.";
  const pendingShipmentRequests = shipmentRequestRows.filter((row) => ["request_new", "request_review"].includes(row.status)).length;
  const openStorageQty = responsibleRows.reduce((sum, row) => sum + row.remainingQty, 0);
  const b2bDebt = state.invoices
    .filter((invoice) => b2bClients.some((client) => client.id === invoice.clientId))
    .reduce((sum, invoice) => sum + invoice.total - invoice.paid, 0);
  const clientSaleStockQty = saleClient && saleProduct
    ? saleProduct.type === "weapon"
      ? clientStorageSerials(saleClient.id, saleProduct.id).filter((serial) => serialIsSelectable(serial) && (serial.firmId || "vat") === saleFirmId).length
      : stockQtyWhere(saleProduct.id, (row) => row.clientId === saleClient.id && (row.firmId || "vat") === saleFirmId)
    : 0;
  const shipmentAvailableQty = shipmentProduct
    ? shipmentProduct.type === "weapon"
      ? shipmentSerials.length
      : stockQtyWhere(shipmentProduct.id, ownStockPredicate({ firmId: shipmentFirmId }))
    : 0;
  const b2bSalePrice = productSalePrice(saleProduct, saleClient?.priceType || "b2b");

  return `
    <section class="grid four section-band">
      <article class="card metric info"><span>B2B клієнти</span><strong>${b2bClients.length}</strong><small>Кабінети, прайси, умови оплати.</small></article>
      <article class="card metric warn"><span>На відповідальному зберіганні</span><strong>${openStorageQty} од.</strong><small>Товар ще наш, але лежить на складах клієнтів.</small></article>
      <article class="card metric good"><span>Документи зберігання</span><strong>${state.responsibleStorageDocs.length}</strong><small>Передачі на склади клієнтів із датами та менеджерами.</small></article>
      <article class="card metric danger"><span>Дебіторка B2B</span><strong>${formatMoney(b2bDebt)}</strong><small>Виникає тільки після продажу клієнтом.</small></article>
    </section>

    <section class="panel section-band">
      <div class="split">
        <h2>Заявки B2B клієнтів на відвантаження</h2>
        <span class="pill ${pendingShipmentRequests ? "warn" : "good"}">${pendingShipmentRequests} потребують рішення</span>
      </div>
      <p class="notice small">Клієнт бачить тільки форму попередньої заявки. Наявність, склад, фірму, серійні номери, ціну, валюту та умови відвантаження виправляє і підтверджує менеджер.</p>
      ${renderB2BShipmentRequestFilters(shipmentRequestFilter, filteredShipmentRequestRows.length, shipmentRequestDateStatusRows.length)}
      <details class="order-dropdown" data-b2b-shipment-requests-dropdown ${shipmentRequestFilter.expanded ? "open" : ""}>
        <summary>
          <span>
            <strong>Список замовлень</strong>
            <small>${shipmentRequestFilter.expanded ? "Натисніть, щоб згорнути список." : "Натисніть, щоб розгорнути список."}</small>
          </span>
          <span class="pill info" data-b2b-shipment-request-summary-count>${filteredShipmentRequestRows.length} рядків</span>
        </summary>
        <div class="table-wrap">
          <table>
            <thead><tr>
              ${renderB2BShipmentRequestSortHeader("date", "Дата", shipmentRequestFilter)}
              ${renderB2BShipmentRequestSortHeader("client", "Клієнт", shipmentRequestFilter)}
              ${renderB2BShipmentRequestSortHeader("product", "Товар", shipmentRequestFilter)}
              ${renderB2BShipmentRequestSortHeader("qty", "К-сть", shipmentRequestFilter)}
              ${renderB2BShipmentRequestSortHeader("desiredDate", "Бажана дата", shipmentRequestFilter)}
              ${renderB2BShipmentRequestSortHeader("status", "Статус", shipmentRequestFilter)}
              ${renderB2BShipmentRequestSortHeader("issues", "Перевірка", shipmentRequestFilter)}
              <th>Дії</th>
            </tr></thead>
            <tbody>
              ${shipmentRequestDateStatusRows.map((row) => renderB2BShipmentRequestRow(row, b2bShipmentRequestMatchesSearch(row, shipmentRequestWords))).join("")}
              <tr data-b2b-shipment-request-empty ${filteredShipmentRequestRows.length ? 'style="display: none;"' : ""}><td colspan="8" class="muted">${shipmentRequestEmptyText}</td></tr>
            </tbody>
          </table>
        </div>
      </details>
    </section>

    <section class="grid two section-band">
      <div class="panel">
        <h2>Відвантаження на відповідальне зберігання</h2>
        <form class="form-grid" data-action="create-responsible-shipment">
          <label class="field"><span>Дата передачі</span><input name="date" type="date" value="${today}"></label>
          <label class="field"><span>B2B клієнт</span><select name="clientId">${b2bClients.map((client) => option(client.id, client.name, client.id === saleClient?.id)).join("")}</select></label>
          <label class="field"><span>Фірма-власник</span><select name="firmId" data-b2b-shipment-firm>${state.settings.firms.map((firm) => option(firm.id, firm.name, firm.id === shipmentFirmId)).join("")}</select></label>
          <label class="field"><span>QR / штрихкод</span><input name="barcode" data-b2b-shipment-barcode required value="${escapeHtml(b2bDraft.shipmentBarcode || shipmentProduct?.barcode || shipmentProduct?.qrCode || "")}" placeholder="скан товару"></label>
          <label class="field wide"><span>Товар</span><select name="productId" data-b2b-shipment-product>${state.products.map((product) => option(product.id, `${product.type === "weapon" ? "Зброя" : "Товар"} · ${product.brand} ${product.model}`, product.id === shipmentProduct?.id)).join("")}</select></label>
          <label class="field"><span>Кількість</span><input name="qty" type="number" min="1" value="${shipmentProduct?.type === "weapon" ? Math.min(1, shipmentSerials.length || 1) : 1}"></label>
          <label class="field"><span>Термін оплати після продажу, днів</span><input name="paymentDays" type="number" min="0" value="${state.settings.defaultDueDays}"></label>
          <label class="field full"><span>Серійні номери для передачі</span><select class="serial-select" name="serialIds" multiple ${shipmentProduct?.type === "weapon" ? "" : "disabled"}>
            ${shipmentProduct?.type === "weapon"
              ? shipmentSerials.length
                ? shipmentSerials.map((serial) => b2bSerialOption(serial, [], "shipment")).join("")
                : '<option disabled>Немає вільних серій цієї моделі на наших складах.</option>'
              : ""}
          </select></label>
          <label class="field"><span>Відповідальний менеджер</span><select name="manager">${employeeOptions()}</select></label>
          <label class="field full"><span>Коментар</span><textarea name="comment" placeholder="договір, умови зберігання, примітки"></textarea></label>
          <button class="primary" type="submit">Передати на склад клієнта</button>
        </form>
        <p class="notice small">Доступно для передачі по вибраному товару: <strong>${shipmentAvailableQty}</strong>. Для зброї кількість має дорівнювати кількості вибраних серій.</p>
      </div>

      <div class="panel">
        <h2>Звіт продажу клієнтом</h2>
        <form class="form-grid" data-action="create-b2b-client-sale">
          <label class="field"><span>Дата продажу</span><input name="date" type="date" value="${today}"></label>
          <label class="field"><span>B2B клієнт</span><select name="clientId" data-b2b-sale-client>${b2bClients.map((client) => option(client.id, client.name, client.id === saleClient?.id)).join("")}</select></label>
          <label class="field"><span>Фірма-власник</span><select name="firmId" data-b2b-sale-firm>${state.settings.firms.map((firm) => option(firm.id, firm.name, firm.id === saleFirmId)).join("")}</select></label>
          <label class="field"><span>QR / штрихкод</span><input name="barcode" data-b2b-sale-barcode required value="${escapeHtml(b2bDraft.saleBarcode || saleProduct?.barcode || saleProduct?.qrCode || "")}" placeholder="скан товару"></label>
          <label class="field wide"><span>Товар зі складу клієнта</span><select name="productId" data-b2b-sale-product>${state.products.map((product) => option(product.id, `${product.type === "weapon" ? "Зброя" : "Товар"} · ${product.brand} ${product.model}`, product.id === saleProduct?.id)).join("")}</select></label>
          <label class="field"><span>Кількість продано</span><input name="qty" type="number" min="1" value="${saleProduct?.type === "weapon" ? Math.min(1, clientSaleStockQty || 1) : 1}"></label>
          <label class="field"><span>Ціна продажу</span><input name="price" inputmode="decimal" data-field-lock="price" value="${b2bSalePrice.amount}"></label>
          <label class="field"><span>Валюта</span><select name="currency" data-field-lock="price">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === b2bSalePrice.currency)).join("")}</select></label>
          <label class="field"><span>Термін оплати, днів</span><input name="paymentDays" type="number" min="0" value="${state.settings.defaultDueDays}"></label>
          <label class="field"><span>Джерело звіту</span><select name="reportSource">${variantOptions("b2bReportSources", "Кабінет клієнта")}</select></label>
          <label class="field full"><span>Серійні номери, продані клієнтом</span><select class="serial-select" name="serialIds" multiple ${saleProduct?.type === "weapon" ? "" : "disabled"}>
            ${saleProduct?.type === "weapon"
              ? saleSerials.length
                ? saleSerials.map((serial) => b2bSerialOption(serial, [], "sale")).join("")
                : '<option disabled>Немає серій цієї моделі на відповідальному зберіганні цього клієнта.</option>'
              : ""}
          </select></label>
          <label class="field"><span>Номер дозволу покупця</span><input name="permitNumber" ${saleProduct?.type === "weapon" ? "required" : "disabled"} placeholder="для зброї"></label>
          <label class="field"><span>Дата видачі дозволу</span><input name="permitDate" type="date" ${saleProduct?.type === "weapon" ? "required" : "disabled"}></label>
          <label class="field"><span>Менеджер</span><select name="manager">${employeeOptions()}</select></label>
          <label class="field full"><span>Коментар</span><textarea name="comment" placeholder="номер звіту клієнта, кінцевий покупець, примітки"></textarea></label>
          <button class="primary" type="submit">Списати продаж клієнта</button>
        </form>
        <p class="notice small">Доступно на складі вибраного клієнта: <strong>${clientSaleStockQty}</strong>. Після проведення створюється накладна і дебіторка з датою оплати.</p>
      </div>
    </section>

    <section class="panel section-band" data-print-area="b2bDocs" data-print-title="B2B відповідальне зберігання">
      <div class="split">
        <h2>Звіт по відповідальному зберіганню</h2>
        <span class="pill info">власність наша до продажу клієнтом</span>
      </div>
      ${renderResponsibleStorageFilters(responsibleStorageFilter, filteredResponsibleRows.length, responsibleDateEntityRows.length, responsibleRows)}
      <details class="order-dropdown" data-b2b-responsible-storage-dropdown ${responsibleStorageFilter.expanded ? "open" : ""}>
        <summary>
          <span>
            <strong>Список замовлень</strong>
            <small>${responsibleStorageFilter.expanded ? "Натисніть, щоб згорнути список." : "Натисніть, щоб розгорнути список."}</small>
          </span>
          <span class="pill info" data-b2b-responsible-storage-summary-count>${filteredResponsibleRows.length} рядків</span>
        </summary>
        <div class="table-wrap">
          <table>
            <thead><tr>
              ${renderResponsibleStorageSortHeader("document", "Документ", responsibleStorageFilter)}
              ${renderResponsibleStorageSortHeader("date", "Дата", responsibleStorageFilter)}
              ${renderResponsibleStorageSortHeader("client", "Клієнт / склад", responsibleStorageFilter)}
              ${renderResponsibleStorageSortHeader("product", "Товар", responsibleStorageFilter)}
              ${renderResponsibleStorageSortHeader("qty", "Передано", responsibleStorageFilter)}
              ${renderResponsibleStorageSortHeader("sold", "Продано", responsibleStorageFilter)}
              ${renderResponsibleStorageSortHeader("remaining", "Залишок", responsibleStorageFilter)}
              ${renderResponsibleStorageSortHeader("serials", "Серії", responsibleStorageFilter)}
              ${renderResponsibleStorageSortHeader("paymentDays", "Оплата після продажу", responsibleStorageFilter)}
              ${renderResponsibleStorageSortHeader("status", "Статус", responsibleStorageFilter)}
              <th>Дії</th>
            </tr></thead>
            <tbody>
              ${responsibleDateEntityRows.map((row) => renderResponsibleStorageRow(row, responsibleStorageMatchesSearch(row, responsibleStorageWords))).join("")}
              <tr data-b2b-responsible-storage-empty ${filteredResponsibleRows.length ? 'style="display: none;"' : ""}><td colspan="11" class="muted">${responsibleStorageEmptyText}</td></tr>
            </tbody>
          </table>
        </div>
      </details>
    </section>

    <section class="panel">
      <h2>Кабінети клієнтів</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Клієнт</th><th>Ліміт</th><th>Умови</th><th>На зберіганні</th><th>Дебіторка</th><th>Менеджер</th><th>Дії</th></tr></thead>
          <tbody>
            ${b2bClients.map((client) => {
              const invoices = state.invoices.filter((invoice) => invoice.clientId === client.id && isDebtInvoice(invoice));
              const debt = invoices.reduce((sum, invoice) => sum + invoice.total - invoice.paid, 0);
              const storageQty = clientStorageRows(client.id).reduce((sum, row) => sum + row.qty, 0);
              return `
                <tr>
                  <td><strong>${client.name}</strong><br><span class="small muted">${client.edrpou || "без ЄДРПОУ"} · ${client.address || "адреса не внесена"}</span></td>
                  <td>${formatMoney(client.creditLimitUAH)}</td>
                  <td>${client.paymentTerms}</td>
                  <td>${storageQty} од.</td>
                  <td>${formatMoney(debt)}</td>
                  <td>${client.manager}</td>
                  <td><button class="secondary" data-open-cabinet="${client.id}">Відкрити кабінет</button></td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderClientPortal(client) {
  const docsPeriod = periodFilter("clientPortal");
  const rows = clientStorageRows(client.id);
  const docs = responsibleStorageRows(client.id).filter((doc) => dateInPeriod(doc.date, docsPeriod));
  const invoices = state.invoices.filter((invoice) => invoice.clientId === client.id && isDebtInvoice(invoice) && dateInPeriod(invoice.date, docsPeriod));
  const paymentDebt = invoices.reduce((sum, invoice) => sum + invoice.total - invoice.paid, 0);
  const serialRows = clientStorageSerials(client.id, "", true);
  const products = uniqueList(rows.map((row) => row.product?.id || row.productId))
    .map((productId) => byId(state.products, productId))
    .filter(Boolean);
  const saleProduct = products.find((product) => product.id === clientPortalDraft.productId) || products[0];
  const saleFirmOptions = uniqueList(rows
    .filter((row) => (row.product?.id || row.productId) === saleProduct?.id)
    .map((row) => row.firmId || "vat"))
    .filter(Boolean);
  const portalFirmId = saleFirmOptions.includes(clientPortalDraft.firmId)
    ? clientPortalDraft.firmId
    : (saleFirmOptions[0] || state.settings.firms[0]?.id || "vat");
  const salePrice = saleProduct ? productSalePrice(saleProduct, client.priceType) : { amount: 0, currency: client.currency || "UAH" };
  const availableQty = saleProduct
    ? saleProduct.type === "weapon"
      ? clientStorageSerials(client.id, saleProduct.id).filter((serial) => serialIsSelectable(serial) && (serial.firmId || "vat") === portalFirmId).length
      : stockQtyWhere(saleProduct.id, (row) => row.clientId === client.id && (row.firmId || "vat") === portalFirmId)
    : 0;
  const saleSerials = saleProduct?.type === "weapon" ? clientStorageSerials(client.id, saleProduct.id, true).filter((serial) => (serial.firmId || "vat") === portalFirmId) : [];
  const qtyValue = clientPortalDraft.qty || (saleProduct?.type === "weapon" ? Math.min(1, availableQty || 1) : 1);
  const saleDisabled = saleProduct ? "" : "disabled";

  return `
    <section class="panel no-print">
      <h2>Період і друк кабінету</h2>
      ${renderPeriodPrintControls("clientPortal", "B2B кабінет клієнта", docsPeriod, rows.length + docs.length + invoices.length)}
      <p class="small muted">${canPrintDocuments() ? "Друк дозволено роллю B2B клієнта." : "Друк B2B кабінету зараз заборонено роллю B2B клієнта."}</p>
    </section>
    <div data-print-area="clientPortal" data-print-title="B2B кабінет · ${escapeHtml(client.name)}">
    <section class="grid three section-band">
      <article class="card metric warn"><span>На зберіганні</span><strong>${rows.reduce((sum, row) => sum + row.qty, 0)} од.</strong><small>Товар залишається власністю нашої компанії до вашого продажу.</small></article>
      <article class="card metric danger"><span>До оплати</span><strong>${formatMoney(paymentDebt)}</strong><small>Борг після поданих звітів продажу.</small></article>
      <article class="card metric info"><span>Документи</span><strong>${docs.length}</strong><small>Передачі на ваш склад відповідального зберігання.</small></article>
    </section>

    <section class="grid two section-band">
      <div class="panel">
        <h2>Подати продаж зі свого складу</h2>
        <form class="form-grid" data-action="create-client-portal-sale">
          <input type="hidden" name="clientId" value="${escapeHtml(client.id)}">
          <input type="hidden" name="manager" value="${escapeHtml(client.manager || "")}">
          <input type="hidden" name="reportSource" value="Кабінет клієнта">
          <label class="field"><span>Дата продажу</span><input name="date" type="date" value="${today}" ${saleDisabled}></label>
          <label class="field"><span>Фірма-власник</span><select name="firmId" data-client-portal-firm ${saleDisabled}>
            ${saleFirmOptions.map((firmId) => option(firmId, firmName(firmId), firmId === portalFirmId)).join("")}
          </select></label>
          <label class="field"><span>QR / штрихкод</span><input name="barcode" data-client-portal-barcode required value="${escapeHtml(clientPortalDraft.barcode || saleProduct?.barcode || saleProduct?.qrCode || "")}" ${saleDisabled}></label>
          <label class="field wide"><span>Товар зі складу</span><select name="productId" data-client-portal-product ${saleDisabled}>
            ${products.map((product) => option(product.id, `${product.type === "weapon" ? "Зброя" : "Товар"} · ${product.brand} ${product.model}`, product.id === saleProduct?.id)).join("")}
          </select></label>
          <label class="field"><span>Кількість продано</span><input name="qty" type="number" min="1" value="${qtyValue}" ${saleDisabled}></label>
          <label class="field"><span>Ціна вашого прайсу</span><input name="price" inputmode="decimal" value="${salePrice.amount}" readonly></label>
          <label class="field"><span>Валюта</span><select name="currency" disabled>${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === salePrice.currency)).join("")}</select><input type="hidden" name="currency" value="${escapeHtml(salePrice.currency)}"></label>
          <label class="field"><span>Термін оплати, днів</span><input name="paymentDays" type="number" min="0" value="${state.settings.defaultDueDays}" readonly></label>
          <label class="field full"><span>Серійні номери, продані клієнтом</span><select class="serial-select" name="serialIds" multiple ${saleProduct?.type === "weapon" ? "" : "disabled"}>
            ${saleProduct?.type === "weapon"
              ? saleSerials.length
                ? saleSerials.map((serial) => b2bSerialOption(serial, clientPortalDraft.serialIds || [], "sale")).join("")
                : '<option disabled>Немає серій цієї моделі на вашому складі.</option>'
              : ""}
          </select></label>
          <label class="field"><span>Номер дозволу покупця</span><input name="permitNumber" value="${escapeHtml(clientPortalDraft.permitNumber || "")}" ${saleProduct?.type === "weapon" ? "required" : "disabled"}></label>
          <label class="field"><span>Дата видачі дозволу</span><input name="permitDate" type="date" value="${escapeHtml(clientPortalDraft.permitDate || "")}" ${saleProduct?.type === "weapon" ? "required" : "disabled"}></label>
          <label class="field full"><span>Коментар</span><textarea name="comment" placeholder="кінцевий покупець, номер вашого звіту, примітки" ${saleDisabled}></textarea></label>
          <button class="primary" type="submit" ${saleDisabled}>Подати звіт продажу</button>
        </form>
        <p class="notice small">Доступно для продажу по вибраному товару: <strong>${availableQty}</strong>. Серійні номери іншої моделі, продані або без перевірки ЄРЗ заблоковані.</p>
      </div>

      <div class="panel">
        <div class="split">
          <h2>Звіти кабінету</h2>
          <span class="pill info">${priceTypeName(client.priceType)}</span>
        </div>
        <div class="inline-actions">
          <button class="secondary" data-export-b2b-report="stock" data-client-id="${client.id}">Залишки JSON</button>
          <button class="secondary" data-export-b2b-report="payments" data-client-id="${client.id}">Оплати JSON</button>
          <button class="secondary" data-export-b2b-report="inventory" data-client-id="${client.id}">Інвентаризація JSON</button>
        </div>
        <p class="notice small">У звітах доступні тільки ваші залишки, серійні номери, документи відповідального зберігання та оплати.</p>
      </div>
    </section>

    <section class="panel section-band">
      <h2>Що відвантажено на відповідальне зберігання</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Документ</th><th>Дата</th><th>Товар</th><th>Передано</th><th>Продано</th><th>Залишок</th><th>Серії</th><th>Оплата</th><th>Статус</th></tr></thead>
          <tbody>
            ${docs.map((row) => `
              <tr>
                <td><strong>${row.id}</strong><br><span class="small muted">${escapeHtml(row.manager || "-")}</span></td>
                <td>${row.date}</td>
                <td>${productName(row.productId)}<br><span class="small muted">${productCodes(row.product)}</span></td>
                <td>${row.qty}</td>
                <td>${row.soldQty}</td>
                <td><strong>${row.remainingQty}</strong></td>
                <td>${serialBadges(row.serialIds)}</td>
                <td>${row.paymentDays || state.settings.defaultDueDays} днів після продажу</td>
                <td>${statusPill(row.derivedStatus)}<br><span class="small muted">${ownershipLabel(row)}</span></td>
              </tr>
            `).join("") || '<tr><td colspan="9" class="muted">Передач на відповідальне зберігання ще немає.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>

    <section class="grid two section-band">
      <div class="panel">
        <h2>Залишки та інвентаризація</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Товар</th><th>QR / штрихкод</th><th>Склад</th><th>Кількість</th><th>Серійні номери зброї</th></tr></thead>
            <tbody>
              ${rows.map((row) => {
                const serials = row.product.type === "weapon"
                  ? clientStorageSerials(client.id, row.product.id).map((serial) => serial.id)
                  : [];
                return `
                  <tr>
                    <td><strong>${row.product.brand}</strong><br>${row.product.model}</td>
                    <td>${productCodes(row.product)}</td>
                    <td>${warehouseName(row.warehouseId)}</td>
                    <td>${row.qty}</td>
                    <td>${serialBadges(serials)}</td>
                  </tr>
                `;
              }).join("") || '<tr><td colspan="5" class="muted">Немає залишків на вашому складі.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel">
        <h2>Оплати та дебіторка</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Накладна</th><th>Дата</th><th>Сума</th><th>Оплачено</th><th>Борг</th><th>Оплатити до</th><th>Стан</th></tr></thead>
            <tbody>
              ${invoices.map((invoice) => `
                <tr>
                  <td><strong>${invoice.id}</strong><br><span class="small muted">${invoice.channel}</span></td>
                  <td>${invoice.date}</td>
                  <td>${formatMoney(invoice.total, invoice.currency)}</td>
                  <td>${formatMoney(invoice.paid, invoice.currency)}</td>
                  <td>${formatMoney(invoice.total - invoice.paid, invoice.currency)}</td>
                  <td>${invoice.dueDate || "-"}</td>
                  <td>${statusPill(invoice.status)}</td>
                </tr>
              `).join("") || '<tr><td colspan="7" class="muted">Накладних і оплат ще немає.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="panel">
      <h2>Серійні номери в кабінеті</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Серія</th><th>Товар</th><th>Склад</th><th>Стан</th><th>ЄРЗ</th><th>Дозвіл</th></tr></thead>
          <tbody>
            ${serialRows.map((serial) => `
              <tr>
                <td><strong>${serial.serial}</strong></td>
                <td>${productName(serial.productId)}</td>
                <td>${warehouseName(serial.warehouseId)}</td>
                <td>${statusPill(serial.status)}</td>
                <td>${statusPill(serial.erzStatus)}</td>
                <td>${serial.permitNumber ? `${escapeHtml(serial.permitNumber)}<br><span class="small muted">${serial.permitDate || "-"}</span>` : "-"}</td>
              </tr>
            `).join("") || '<tr><td colspan="6" class="muted">Серійних товарів у кабінеті немає.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>
    </div>
  `;
}

function renderClientCatalogPage(client) {
  const historyPeriod = periodFilter("clientCatalogHistory");
  const requestRows = b2bShipmentRequestRows(client.id);
  const draftRequests = requestRows.filter((request) => request.status === "request_draft");
  const historyRequests = requestRows.filter((request) => !["request_draft", "request_cancelled"].includes(request.status) && dateInPeriod(request.date, historyPeriod));
  return `
    <section class="panel no-print">
      <div class="split">
        <div>
          <h2>Каталоги, прайси, акції</h2>
          <p class="small muted">Окремий розділ для вибору товарів і попередніх заявок на відвантаження. Залишки, склади та серійні номери тут не відкриваються клієнту.</p>
        </div>
        <span class="pill info">${escapeHtml(priceTypeName(client.priceType))}</span>
      </div>
    </section>
    <div data-print-area="clientCatalog" data-print-title="Каталоги, прайси, акції · ${escapeHtml(client.name)}">
      ${renderB2BRequestCatalog(client, draftRequests, historyRequests, historyPeriod)}
    </div>
  `;
}

function renderClients() {
  return `
    <section class="grid two section-band">
      <div class="panel">
        <h2>Новий клієнт</h2>
        <form class="form-grid" data-action="create-client">
          <label class="field wide"><span>Назва</span><input name="name" required placeholder="юридична або торгова назва"></label>
          <label class="field"><span>Тип</span><select name="type">${variantOptions("clientTypes", "B2B")}</select></label>
          <label class="field"><span>ЄДРПОУ / ІПН</span><input name="edrpou"></label>
          <label class="field"><span>Телефон</span><input name="phone"></label>
          <label class="field"><span>Email</span><input name="email" type="email"></label>
          <label class="field"><span>Менеджер</span><select name="manager">${employeeOptions()}</select></label>
          <label class="field"><span>Умови оплат</span><select name="paymentTerms">${variantOptions("paymentTerms", "Відтермінування 14 днів")}</select></label>
          <label class="field"><span>Кредитний ліміт</span><input name="creditLimitUAH" inputmode="decimal" value="0"></label>
          <label class="field"><span>Валюта</span><select name="currency">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === "UAH")).join("")}</select></label>
          <label class="field"><span>Прайс</span><select name="priceType">${priceTypeOptions("retail")}</select></label>
          <label class="field"><span>Податки</span><select name="taxMode">${variantOptions("taxModes", "без ПДВ")}</select></label>
          <label class="field"><span>Кабінет</span><select name="cabinetEnabled"><option value="true">увімкнути</option><option value="false">не створювати</option></select></label>
          <label class="field"><span>Логін кабінету</span><input name="portalLogin" placeholder="для B2B входу"></label>
          <label class="field"><span>Пароль кабінету</span><input name="portalPassword" type="text" placeholder="для B2B входу"></label>
          <label class="field"><span>Відп. зберігання</span><select name="responsibleStorage"><option value="true">так</option><option value="false">ні</option></select></label>
          <label class="field full"><span>Адреса / доставка</span><textarea name="address" placeholder="адреса, контакт складу, правила відвантаження"></textarea></label>
          <button class="primary" type="submit">Створити клієнта</button>
        </form>
      </div>
      <div class="panel">
        <h2>Контроль клієнтів</h2>
        <div class="grid two">
          <article class="card metric info"><span>B2B клієнти</span><strong>${state.clients.filter((client) => client.type === "B2B").length}</strong><small>Із кабінетами, прайсами та умовами оплат.</small></article>
          <article class="card metric warn"><span>Кредитний ліміт</span><strong>${formatMoney(state.clients.reduce((sum, client) => sum + Number(client.creditLimitUAH || 0), 0))}</strong><small>Контроль відтермінування й дебіторки.</small></article>
        </div>
        <p class="notice small">Клієнтські картки вже містять менеджера, прайс, податковий режим, валюту, кредитний ліміт, кабінет і ознаку відповідального зберігання.</p>
      </div>
    </section>

    <section class="panel">
      <h2>Клієнти</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Клієнт</th><th>Тип</th><th>Контакти</th><th>Менеджер</th><th>Умови</th><th>Прайс / податки</th><th>Кабінет</th></tr></thead>
          <tbody>
            ${state.clients.map((client) => `
              <tr class="clickable-row" data-open-client="${escapeHtml(client.id)}" title="Відкрити картку клієнта">
                <td><strong>${client.name}</strong><br><span class="small muted">${client.edrpou || "без ЄДРПОУ"} · ${client.address || "адреса не внесена"}</span></td>
                <td>${client.type}</td>
                <td>${client.phone || "-"}<br><span class="small muted">${client.email || "-"}</span></td>
                <td>${client.manager}</td>
                <td>${client.paymentTerms}<br><span class="small muted">ліміт ${formatMoney(client.creditLimitUAH, client.currency || "UAH")}</span></td>
                <td>${priceTypeName(client.priceType)}<br><span class="small muted">${client.taxMode || "-"}</span></td>
                <td>${client.cabinetEnabled ? '<span class="pill good">кабінет</span>' : '<span class="pill">немає</span>'} ${client.responsibleStorage ? '<span class="pill info">зберігання</span>' : ""}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderDeliveryApiSettingsPanel(disabled = "") {
  const settings = deliveryApiSettings();
  const providerRows = Object.entries(settings).map(([key, provider]) => `
    <article class="card stack">
      <div class="split">
        <strong>${escapeHtml(provider.provider)}</strong>
        ${deliveryApiProviderPill(provider)}
      </div>
      <label class="field"><span>API</span><select name="${key}_enabled" ${disabled}>${option("false", "вимкнено", !provider.enabled)}${option("true", "увімкнено", Boolean(provider.enabled))}</select></label>
      <label class="field"><span>Режим</span><select name="${key}_mode" ${disabled}>${option("test", "тест", provider.mode !== "production")}${option("production", "бойовий", provider.mode === "production")}</select></label>
      <label class="field"><span>API ключ</span><input name="${key}_apiKey" type="password" value="${escapeHtml(provider.apiKey || "")}" placeholder="ключ для відстеження ТТН" ${disabled}></label>
      <label class="field wide"><span>Endpoint</span><input name="${key}_endpoint" value="${escapeHtml(provider.endpoint || "")}" ${disabled}></label>
      <p class="small muted">Остання перевірка: ${escapeHtml(provider.lastCheck || "ще не перевіряли")}</p>
    </article>
  `).join("");
  return `
    <section class="panel section-band">
      <div class="split">
        <div>
          <h2>API доставок</h2>
          <p class="muted small">Підключення Нової пошти та Укрпошти для читання статусу ТТН. CRM у цьому прототипі не створює відправлення назад у служби доставки.</p>
        </div>
        <span class="pill info">read-only tracking</span>
      </div>
      <form class="form-grid" data-action="update-delivery-api-settings">
        <div class="grid two full">${providerRows}</div>
        <button class="primary" type="submit" ${disabled}>Зберегти API доставок</button>
      </form>
    </section>
  `;
}

function renderSettings() {
  const canEdit = role().canEditSettings || isAdmin();
  const disabled = canEdit ? "" : "disabled";
  return `
    <section class="grid three section-band">
      <article class="card metric info"><span>Фірми</span><strong>${state.settings.firms.length}</strong><small>ПДВ / без ПДВ, окремий бухоблік.</small></article>
      <article class="card metric good"><span>Склади</span><strong>${state.warehouses.length}</strong><small>Магазин, основний, відповідальне зберігання.</small></article>
      <article class="card metric warn"><span>Статті руху коштів</span><strong>${state.settings.cashArticles.length + state.settings.expenseArticles.length}</strong><small>Для фінансових звітів та витрат.</small></article>
      <article class="card metric info"><span>Термінали</span><strong>${state.settings.paymentTerminals.length}</strong><small>Для оплат карткою з прив'язкою до фірми.</small></article>
      <article class="card metric good"><span>Прайси</span><strong>${activeSalePriceTypes().length}</strong><small>Активні типи цін у картці товару.</small></article>
      <article class="card metric info"><span>Довідники документів</span><strong>${Object.values(state.settings.variantDictionaries || {}).flat().length}</strong><small>Ієрархічні списки для вибору в документах.</small></article>
      <article class="card metric warn"><span>Параметри каталогу</span><strong>${Object.values(state.settings.catalogParameters || {}).flat().length}</strong><small>Фільтри B2B прайсів: тип, бренд, категорія, калібр, акції.</small></article>
    </section>

    <section class="grid two section-band">
      <div class="panel">
        <h2>Додати склад</h2>
        <form class="form-grid" data-action="create-warehouse">
          <label class="field wide"><span>Назва</span><input name="name" required></label>
          <label class="field"><span>Тип</span><select name="kind">${variantOptions("warehouseKinds", "own")}</select></label>
          <button class="primary" type="submit" ${disabled}>Додати</button>
        </form>
        <p class="notice ${canEdit ? "" : "warn"} small">${canEdit ? "Поточна роль може змінювати налаштування." : "Налаштування змінює лише адміністратор."}</p>
      </div>
      <div class="panel">
        <h2>Курси та параметри</h2>
        <form class="form-grid" data-action="update-rates">
          ${Object.entries(state.settings.rates).map(([currency, rate]) => `
            <label class="field"><span>${currency}</span><input name="${currency}" type="text" inputmode="decimal" value="${rate}" ${disabled}></label>
          `).join("")}
          <button class="primary" type="submit" ${disabled}>Оновити</button>
        </form>
      </div>
    </section>

    ${renderDeliveryApiSettingsPanel(disabled)}

    <section class="panel section-band">
      <h2>Довідники документів</h2>
      <form class="form-grid" data-action="create-variant-dictionary-item">
        <label class="field"><span>Довідник</span><select name="dictionaryKey" ${disabled}>${VARIANT_DICTIONARY_DEFINITIONS.map((item) => option(item.key, item.label)).join("")}</select></label>
        <label class="field"><span>Батьківський пункт</span><input name="parentName" placeholder="необов'язково, для ієрархії" ${disabled}></label>
        <label class="field"><span>Новий пункт</span><input name="name" required ${disabled}></label>
        <label class="field"><span>Системне значення</span><input name="value" placeholder="можна залишити порожнім" ${disabled}></label>
        <button class="primary" type="submit" ${disabled}>Додати у довідник</button>
      </form>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Довідник</th><th>Пункти</th></tr></thead>
          <tbody>
            ${VARIANT_DICTIONARY_DEFINITIONS.map((definition) => {
              const entries = variantEntries(definition.key, true);
              return `
                <tr>
                  <td><strong>${escapeHtml(definition.label)}</strong></td>
                  <td>${entries.map((entry) => `<span class="pill ${entry.parentId ? "info" : "good"}">${escapeHtml(variantPathLabel(entry, entries))}</span>`).join(" ")}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
      <p class="notice small">Якщо вказати батьківський пункт, новий варіант стане дочірнім: наприклад "Доставка / Нова пошта / Кур'єр". Документи беруть варіанти саме з цих довідників.</p>
    </section>

    <section class="panel section-band">
      <h2>Параметри каталогу B2B</h2>
      <form class="form-grid" data-action="create-catalog-parameter">
        <label class="field"><span>Каталог</span><select name="parameterKey" ${disabled}>${CATALOG_PARAMETER_DEFINITIONS.map((item) => option(item.key, item.label)).join("")}</select></label>
        <label class="field"><span>Назва</span><input name="name" required placeholder="назва для списку" ${disabled}></label>
        <label class="field"><span>Значення</span><input name="value" placeholder="для типів: weapon або regular" ${disabled}></label>
        <button class="primary" type="submit" ${disabled}>Додати параметр</button>
      </form>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Параметр</th><th>Значення для відбору</th></tr></thead>
          <tbody>
            ${CATALOG_PARAMETER_DEFINITIONS.map((definition) => `
              <tr>
                <td><strong>${escapeHtml(definition.label)}</strong><br><span class="small muted">${escapeHtml(definition.valueHint || "значення = назва")}</span></td>
                <td>${catalogParameterEntries(definition.key, true).map((entry) => `<span class="pill ${entry.active === false ? "warn" : "info"}">${escapeHtml(entry.name)}${entry.value !== entry.name ? ` · ${escapeHtml(entry.value)}` : ""}</span>`).join(" ")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      <p class="notice small">Ці довідники використовуються у верхньому відборі B2B каталогу. Бренди, категорії та калібри також синхронізуються з картками товарів.</p>
    </section>

    <section class="panel section-band">
      <h2>Типи прайсів</h2>
      <form class="form-grid" data-action="create-price-type">
        <label class="field wide"><span>Новий прайс</span><input name="name" required placeholder="Опт / VIP / маркетплейс" ${disabled}></label>
        <button class="primary" type="submit" ${disabled}>Додати прайс</button>
      </form>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Прайс</th><th>Тип</th><th>Статус</th><th>Дії</th></tr></thead>
          <tbody>
            ${state.settings.priceTypes.map((item) => `
              <tr>
                <td><strong>${escapeHtml(item.name)}</strong><br><span class="small muted">${escapeHtml(item.id)}</span></td>
                <td>${item.kind === "cost" ? "прихідна / собівартість" : "ціна продажу"}</td>
                <td>${item.active === false ? '<span class="pill warn">вимкнено</span>' : '<span class="pill good">активний</span>'}</td>
                <td><button class="secondary" type="button" data-toggle-price-type="${escapeHtml(item.id)}" ${disabled || item.kind === "cost" ? "disabled" : ""}>${item.active === false ? "Увімкнути" : "Вимкнути"}</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      <p class="notice small">“Прихідна” ціна ведеться як собівартість. Активні прайси продажу автоматично з'являються в картці товару і в договорах/картках клієнтів. Доступ до зміни цін керується роллю через право “Ціна”, до прихідної ціни - через право “Собівартість”.</p>
    </section>

    <section class="grid two section-band">
      <div class="panel">
        <h2>Платіжні термінали</h2>
        <form class="form-grid" data-action="create-payment-terminal">
          <label class="field wide"><span>Назва термінала</span><input name="name" required placeholder="POS Monobank · магазин" ${disabled}></label>
          <label class="field"><span>Провайдер</span><input name="provider" placeholder="Mono / ПриватБанк / LiqPay" ${disabled}></label>
          <label class="field"><span>Фірма</span><select name="firmId" ${disabled}>${state.settings.firms.map((firm) => option(firm.id, firm.name)).join("")}</select></label>
          <button class="primary" type="submit" ${disabled}>Додати термінал</button>
        </form>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Термінал</th><th>Фірма</th><th>Провайдер</th></tr></thead>
            <tbody>
              ${state.settings.paymentTerminals.map((terminal) => `
                <tr>
                  <td>${escapeHtml(terminal.name)}</td>
                  <td>${firmName(terminal.firmId)}</td>
                  <td>${escapeHtml(terminal.provider || "-")}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
      <div class="panel">
        <h2>Правила оплат</h2>
        <p class="notice small">Оплата карткою вимагає термінал і фірму зарахування. Готівка має ознаку ПРРО. Аванс можна внести без накладної, але з обов'язковим клієнтом, валютою і фірмою.</p>
      </div>
    </section>

    <section class="grid two">
      <div class="panel">
        <h2>Статті руху коштів</h2>
        <form class="form-grid" data-action="create-cash-article">
          <label class="field wide"><span>Нова стаття</span><input name="article" required ${disabled}></label>
          <button class="primary" type="submit" ${disabled}>Додати</button>
        </form>
        <div class="inline-actions">${state.settings.cashArticles.map((item) => `<span class="pill info">${item}</span>`).join("")}</div>
      </div>
      <div class="panel">
        <h2>Статті витрат</h2>
        <form class="form-grid" data-action="create-expense-article">
          <label class="field wide"><span>Нова стаття</span><input name="article" required ${disabled}></label>
          <button class="primary" type="submit" ${disabled}>Додати</button>
        </form>
        <div class="inline-actions">${state.settings.expenseArticles.map((item) => `<span class="pill warn">${item}</span>`).join("")}</div>
      </div>
    </section>
  `;
}

function cashMovementRows() {
  const inflow = state.payments.map((payment) => {
    const invoice = state.invoices.find((item) => item.id === payment.invoiceId);
    const client = byId(state.clients, payment.clientId || invoice?.clientId);
    return {
      date: payment.date,
      article: payment.advance ? "Аванс клієнта" : (invoice?.cashArticle || "Продаж товарів"),
      method: paymentSourceLabel(payment.source || "cash"),
      currency: payment.currency,
      inflow: payment.amount,
      outflow: 0,
      manager: invoice?.manager || client?.manager || "-"
    };
  });
  const outflow = state.expenses.map((expense) => ({
    date: expense.date,
    article: expense.article,
    method: expense.method,
    currency: expense.currency,
    inflow: 0,
    outflow: expense.amount,
    manager: expense.manager
  }));
  return [...inflow, ...outflow].sort((a, b) => b.date.localeCompare(a.date));
}

function salesReportRows() {
  const grouped = {};
  state.invoices.forEach((invoice) => {
    invoice.lines.forEach((line) => {
      const product = byId(state.products, line.productId);
      const key = `${line.productId}:${invoice.clientId}:${invoice.manager}`;
      grouped[key] = grouped[key] || { invoiceId: invoice.id, date: invoice.date, product, client: clientName(invoice.clientId), manager: invoice.manager, qty: 0, revenue: 0, cost: 0 };
      grouped[key].qty += Number(line.qty || 0);
      grouped[key].revenue += Number(line.qty || 0) * Number(line.price || 0);
      grouped[key].cost += Number(line.qty || 0) * uah(product?.cost || 0, product?.costCurrency || "UAH");
    });
  });
  return Object.values(grouped);
}

function stockAnalysisRows() {
  return state.products.map((product) => {
    const ending = inventoryRows().filter((row) => row.product.id === product.id).reduce((sum, row) => sum + row.qty, 0);
    const sold = state.invoices.flatMap((invoice) => invoice.lines).filter((line) => line.productId === product.id).reduce((sum, line) => sum + Number(line.qty || 0), 0);
    const receipt = Math.max(Number(product.minStock || 0) + sold - ending, 0);
    const beginning = ending + sold - receipt;
    const monthlySales = Math.max(sold, product.type === "weapon" ? 1 : 4);
    const months = monthlySales ? ending / monthlySales : 0;
    const rop = Math.ceil(monthlySales / 30 * Number(product.leadTimeDays || 14));
    const recommended = Math.max(rop + Number(product.minStock || 0) - ending, 0);
    const status = ending <= rop ? "Замовити" : ending <= Number(product.minStock || 0) ? "Низький" : "ОК";
    return { product, beginning, receipt, sold, ending, monthlySales, months, status, rop, recommended };
  });
}

function reportDefinitions() {
  const arRows = state.invoices.filter((invoice) => invoice.total > invoice.paid).map((invoice) => ({
    date: invoice.dueDate,
    client: clientName(invoice.clientId),
    manager: invoice.manager,
    currency: invoice.currency,
    debt: invoice.total - invoice.paid,
    invoice: invoice.id
  }));
  const stockRows = inventoryRows().map((row) => ({
    date: today,
    product: `${row.product.brand} ${row.product.model}`,
    warehouse: warehouseName(row.warehouseId),
    qty: row.qty,
    value: row.valueUAH,
    owner: row.clientId ? clientName(row.clientId) : "-"
  }));
  const marketplaceRows = state.marketplaceStats.map((row) => {
    const revenue = row.price * row.sold;
    const cost = uah(row.cost, row.costCurrency) * row.sold;
    const profit = revenue - cost - row.commission - row.logistics - row.otherCosts;
    return {
      date: today,
      marketplace: row.marketplace,
      sku: row.sku,
      price: row.price,
      sold: row.sold,
      revenue,
      commission: row.commission,
      logistics: row.logistics,
      otherCosts: row.otherCosts,
      cost,
      profit,
      profitUnit: row.sold ? profit / row.sold : 0,
      margin: revenue ? Math.round(profit / revenue * 1000) / 10 : 0
    };
  });
  return {
    cash: {
      title: "Рух коштів",
      rows: cashMovementRows(),
      columns: [
        ["date", "Дата"],
        ["article", "Стаття"],
        ["method", "Метод"],
        ["currency", "Валюта"],
        ["inflow", "Надходження", (value, row) => value ? formatMoney(value, row.currency) : "-"],
        ["outflow", "Витрати", (value, row) => value ? formatMoney(value, row.currency) : "-"],
        ["manager", "Менеджер"]
      ]
    },
    expenses: {
      title: "Розшифровка витрат",
      rows: state.expenses,
      columns: [
        ["date", "Дата"],
        ["article", "Стаття"],
        ["supplier", "Постачальник"],
        ["amount", "Сума", (value, row) => formatMoney(value, row.currency)],
        ["currency", "Валюта"],
        ["method", "Метод"],
        ["manager", "Менеджер"],
        ["comment", "Коментар"]
      ]
    },
    ar: {
      title: "Дебіторська заборгованість",
      rows: arRows,
      columns: [
        ["date", "Дата оплати"],
        ["client", "Клієнт"],
        ["manager", "Менеджер"],
        ["currency", "Валюта"],
        ["debt", "Борг", (value, row) => formatMoney(value, row.currency)],
        ["invoice", "Накладна"]
      ]
    },
    warehouse: {
      title: "Відомість по товарах на складах",
      rows: stockRows,
      columns: [
        ["product", "Товар"],
        ["warehouse", "Склад"],
        ["qty", "Кількість"],
        ["value", "Вартість", (value) => formatMoney(value)],
        ["owner", "Власник"]
      ]
    },
    sales: {
      title: "Звіт з продажу",
      rows: salesReportRows().map((row) => ({
        date: row.date || today,
        product: `${row.product?.brand || ""} ${row.product?.model || ""}`.trim(),
        client: row.client,
        manager: row.manager,
        qty: row.qty,
        revenue: row.revenue,
        cost: row.cost,
        markup: row.revenue - row.cost
      })),
      columns: [
        ["date", "Дата"],
        ["product", "Товар"],
        ["client", "Клієнт"],
        ["manager", "Менеджер"],
        ["qty", "Кількість"],
        ["revenue", "Вартість", (value) => formatMoney(value)],
        ["cost", "Собівартість", (value) => formatMoney(value)],
        ["markup", "Націнка", (value) => formatMoney(value)]
      ]
    },
    stock: {
      title: "Аналіз товарних запасів",
      rows: stockAnalysisRows().map((row) => ({ date: today, product: `${row.product.brand} ${row.product.model}`, ...row })),
      columns: [
        ["product", "Товар"],
        ["beginning", "Залишок на початок"],
        ["receipt", "Прихід"],
        ["sold", "Продаж"],
        ["ending", "Залишок кінцевий"],
        ["monthlySales", "Продаж/міс"],
        ["months", "Запас, міс", (value) => Number(value || 0).toFixed(1)],
        ["status", "Статус"],
        ["rop", "ROP"],
        ["recommended", "Рекоменд. замовлення"]
      ]
    },
    marketplaces: {
      title: "Аналітика маркетплейсів",
      rows: marketplaceRows,
      columns: [
        ["marketplace", "Маркетплейс"],
        ["sku", "SKU"],
        ["price", "Ціна", (value) => formatMoney(value)],
        ["sold", "Продано"],
        ["revenue", "Сума", (value) => formatMoney(value)],
        ["commission", "Комісія", (value) => formatMoney(value)],
        ["logistics", "Логістика", (value) => formatMoney(value)],
        ["otherCosts", "Інші витрати", (value) => formatMoney(value)],
        ["cost", "Собівартість", (value) => formatMoney(value)],
        ["profit", "Прибуток", (value) => formatMoney(value)],
        ["profitUnit", "Прибуток/шт", (value) => formatMoney(value)],
        ["margin", "Маржа %", (value) => `${value}%`]
      ]
    }
  };
}

function renderReportBuilder() {
  const reports = reportDefinitions();
  const config = state.reportBuilder;
  const report = reports[config.reportId] || reports.sales;
  const selectedColumns = config.columns?.length ? config.columns.filter((key) => report.columns.some(([columnKey]) => columnKey === key)) : report.columns.map(([key]) => key);
  const visibleColumns = selectedColumns.length ? selectedColumns : report.columns.map(([key]) => key);
  const columns = report.columns.filter(([key]) => visibleColumns.includes(key));
  const from = config.from || "2026-05-01";
  const to = config.to || today;
  const filtered = report.rows.filter((row) => !row.date || (row.date >= from && row.date <= to));
  const sortColumn = config.sortBy || columns[0]?.[0] || "date";
  const sorted = [...filtered].sort((a, b) => {
    const first = a[sortColumn] ?? "";
    const second = b[sortColumn] ?? "";
    const result = typeof first === "number" && typeof second === "number"
      ? first - second
      : String(first).localeCompare(String(second), "uk", { numeric: true });
    return config.sortDir === "asc" ? result : -result;
  });
  const groupColumn = config.groupBy;
  const bodyRows = [];
  let currentGroup = "";
  sorted.forEach((row) => {
    const groupValue = groupColumn ? String(row[groupColumn] ?? "-") : "";
    if (groupColumn && groupValue !== currentGroup) {
      currentGroup = groupValue;
      bodyRows.push(`<tr class="group-row"><td colspan="${columns.length}">${escapeHtml(report.columns.find(([key]) => key === groupColumn)?.[1] || groupColumn)}: ${escapeHtml(groupValue)}</td></tr>`);
    }
    bodyRows.push(`<tr>${columns.map(([key, , renderValue]) => `<td>${renderValue ? renderValue(row[key], row) : escapeHtml(row[key] ?? "-")}</td>`).join("")}</tr>`);
  });

  return `
    <section class="panel section-band">
      <div class="split">
        <h2>Конструктор звітів</h2>
        <span class="pill info">${filtered.length} рядків</span>
      </div>
      <form class="form-grid report-builder" data-report-builder>
        <label class="field"><span>Звіт</span><select name="reportId">${Object.entries(reports).map(([id, item]) => option(id, item.title, id === config.reportId)).join("")}</select></label>
        <label class="field"><span>Дата з</span><input name="from" type="date" value="${from}"></label>
        <label class="field"><span>Дата по</span><input name="to" type="date" value="${to}"></label>
        <label class="field"><span>Сортувати по</span><select name="sortBy">${report.columns.map(([key, label]) => option(key, label, key === sortColumn)).join("")}</select></label>
        <label class="field"><span>Напрям</span><select name="sortDir">${option("asc", "від меншого / А-Я", config.sortDir === "asc")}${option("desc", "від більшого / Я-А", config.sortDir !== "asc")}</select></label>
        <label class="field"><span>Групування</span><select name="groupBy">${option("", "без групування", !groupColumn)}${report.columns.map(([key, label]) => option(key, label, key === groupColumn)).join("")}</select></label>
        <label class="field full"><span>Стовпці</span><select name="columns" multiple>${report.columns.map(([key, label]) => option(key, label, visibleColumns.includes(key))).join("")}</select></label>
      </form>
      <div class="table-wrap">
        <table>
          <thead><tr>${columns.map(([, label]) => `<th>${escapeHtml(label)}</th>`).join("")}</tr></thead>
          <tbody>${bodyRows.join("") || `<tr><td colspan="${columns.length || 1}">Немає даних за вибраний період.</td></tr>`}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderReports() {
  if (!(role().canViewReports || isAdmin())) {
    return `<section class="panel"><h2>Звіти</h2><p class="notice warn">Поточна роль не має доступу до блоку звітів. Доступ відкриває адміністратор у ролях працівників.</p></section>`;
  }
  const reportsPeriod = { from: state.reportBuilder.from || "2026-05-01", to: state.reportBuilder.to || today };
  const cashRows = cashMovementRows().filter((row) => dateInPeriod(row.date, reportsPeriod));
  const salesRows = salesReportRows().filter((row) => dateInPeriod(row.date, reportsPeriod));
  const stockRows = inventoryRows();
  const arRows = state.invoices.filter((invoice) => invoice.total > invoice.paid && dateInPeriod(invoice.dueDate || invoice.date, reportsPeriod));
  const expenseRows = state.expenses.filter((expense) => dateInPeriod(expense.date, reportsPeriod));
  const payableRows = state.payables.filter((item) => dateInPeriod(item.dueDate || item.date, reportsPeriod));
  const balanceAssets = stockRows.reduce((sum, row) => sum + row.valueUAH, 0) + arRows.reduce((sum, invoice) => sum + uah(invoice.total - invoice.paid, invoice.currency), 0);
  const balanceLiabilities = payableRows.reduce((sum, item) => sum + uah(item.amount, item.currency), 0);

  return `
    <section class="panel no-print">
      <div class="split">
        <h2>Період і друк звітів</h2>
        <button class="secondary" type="button" data-print-scope="reports" ${canPrintDocuments() ? "" : "disabled"}>Друк всіх звітів</button>
      </div>
      <p class="small muted">Звіти нижче формуються за періодом конструктора: ${periodLabel(reportsPeriod)}. Право друку задається у ролях.</p>
    </section>

    <div data-print-area="reports" data-print-title="Звіти CRM · ${periodLabel(reportsPeriod)}">
      ${renderReportBuilder()}

    <section class="grid four section-band">
      <article class="card metric info"><span>Активи</span><strong>${formatMoney(balanceAssets)}</strong><small>Залишки + дебіторка.</small></article>
      <article class="card metric warn"><span>Зобов'язання</span><strong>${formatMoney(balanceLiabilities)}</strong><small>Кредиторка у валюті обліку.</small></article>
      <article class="card metric good"><span>Продажі</span><strong>${formatMoney(salesRows.reduce((sum, row) => sum + row.revenue, 0))}</strong><small>Кількість, вартість, націнка.</small></article>
      <article class="card metric danger"><span>Товарні ризики</span><strong>${stockAnalysisRows().filter((row) => row.status !== "ОК").length}</strong><small>Позиції нижче ROP або мін. залишку.</small></article>
    </section>

    <section class="panel section-band">
      <h2>Рух коштів</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>Дата</th><th>Стаття</th><th>Метод</th><th>Валюта</th><th>Надходження</th><th>Витрати</th><th>Менеджер</th></tr></thead>
        <tbody>${cashRows.map((row) => `<tr><td>${row.date}</td><td>${row.article}</td><td>${row.method}</td><td>${row.currency}</td><td>${row.inflow ? formatMoney(row.inflow, row.currency) : "-"}</td><td>${row.outflow ? formatMoney(row.outflow, row.currency) : "-"}</td><td>${row.manager}</td></tr>`).join("")}</tbody>
      </table></div>
    </section>

    <section class="grid two section-band">
      <div class="panel">
        <h2>Розшифровка витрат</h2>
        <div class="table-wrap"><table>
          <thead><tr><th>Дата</th><th>Стаття</th><th>Постачальник</th><th>Сума</th><th>Метод</th><th>Коментар</th></tr></thead>
          <tbody>${expenseRows.map((expense) => `<tr><td>${expense.date}</td><td>${expense.article}</td><td>${expense.supplier}</td><td>${formatMoney(expense.amount, expense.currency)}</td><td>${expense.method}</td><td>${expense.comment}</td></tr>`).join("")}</tbody>
        </table></div>
      </div>
      <div class="panel">
        <h2>Графік оплат</h2>
        <div class="table-wrap"><table>
          <thead><tr><th>Дата</th><th>Клієнт</th><th>Накладна</th><th>Борг</th><th>Менеджер</th></tr></thead>
          <tbody>${arRows.map((invoice) => `<tr><td>${invoice.dueDate}</td><td>${clientName(invoice.clientId)}</td><td>${invoice.id}</td><td>${formatMoney(invoice.total - invoice.paid, invoice.currency)}</td><td>${invoice.manager}</td></tr>`).join("")}</tbody>
        </table></div>
      </div>
    </section>

    <section class="grid two section-band">
      <div class="panel">
        <h2>Баланс</h2>
        <div class="table-wrap"><table>
          <thead><tr><th>Показник</th><th>Сума</th></tr></thead>
          <tbody>
            <tr><td>Товарні залишки</td><td>${formatMoney(stockRows.reduce((sum, row) => sum + row.valueUAH, 0))}</td></tr>
            <tr><td>Дебіторська заборгованість</td><td>${formatMoney(arRows.reduce((sum, invoice) => sum + uah(invoice.total - invoice.paid, invoice.currency), 0))}</td></tr>
            <tr><td>Кредиторська заборгованість</td><td>${formatMoney(balanceLiabilities)}</td></tr>
            <tr><td><strong>Чистий баланс</strong></td><td><strong>${formatMoney(balanceAssets - balanceLiabilities)}</strong></td></tr>
          </tbody>
        </table></div>
      </div>
      <div class="panel">
        <h2>Дебіторка клієнтів та менеджерів</h2>
        <div class="table-wrap"><table>
          <thead><tr><th>Клієнт</th><th>Менеджер</th><th>Валюта</th><th>Борг</th><th>Накладна</th></tr></thead>
          <tbody>${arRows.map((invoice) => `<tr><td>${clientName(invoice.clientId)}</td><td>${invoice.manager}</td><td>${invoice.currency}</td><td>${formatMoney(invoice.total - invoice.paid, invoice.currency)}</td><td>${invoice.id}</td></tr>`).join("")}</tbody>
        </table></div>
      </div>
    </section>

    <section class="grid two section-band">
      <div class="panel">
        <h2>Кредиторська заборгованість</h2>
        <div class="table-wrap"><table>
          <thead><tr><th>Постачальник</th><th>Стаття</th><th>Менеджер</th><th>Сума</th><th>Дата</th><th>Статус</th></tr></thead>
          <tbody>${payableRows.map((item) => `<tr><td>${item.supplier}</td><td>${item.article}</td><td>${item.manager}</td><td>${formatMoney(item.amount, item.currency)}</td><td>${item.dueDate}</td><td>${statusPill(item.status)}</td></tr>`).join("")}</tbody>
        </table></div>
      </div>
      <div class="panel">
        <h2>Відомість по складах</h2>
        <div class="table-wrap"><table>
          <thead><tr><th>Товар</th><th>Склад</th><th>Кількість</th><th>Вартість</th><th>Власник</th></tr></thead>
          <tbody>${stockRows.map((row) => `<tr><td>${row.product.brand} ${row.product.model}</td><td>${warehouseName(row.warehouseId)}</td><td>${row.qty}</td><td>${formatMoney(row.valueUAH)}</td><td>${row.clientId ? clientName(row.clientId) : "-"}</td></tr>`).join("")}</tbody>
        </table></div>
      </div>
    </section>

    <section class="panel section-band">
      <h2>Звіт з продажу</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>Товар</th><th>Клієнт</th><th>Менеджер</th><th>Кількість</th><th>Вартість</th><th>Собівартість</th><th>Націнка</th><th>План-факт</th></tr></thead>
        <tbody>${salesRows.map((row) => {
          const plan = state.salesPlans.find((item) => item.manager === row.manager)?.plan || 0;
          const fact = plan ? Math.round(row.revenue / plan * 100) : 0;
          return `<tr><td>${row.product?.brand || ""} ${row.product?.model || ""}</td><td>${row.client}</td><td>${row.manager}</td><td>${row.qty}</td><td>${formatMoney(row.revenue)}</td><td>${formatMoney(row.cost)}</td><td>${formatMoney(row.revenue - row.cost)}</td><td>${fact}%</td></tr>`;
        }).join("")}</tbody>
      </table></div>
    </section>

    <section class="panel section-band">
      <h2>Аналіз товарних запасів</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>Товар</th><th>Залишок на початок</th><th>Прихід</th><th>Продаж</th><th>Залишок кінцевий</th><th>Продаж/міс</th><th>Запас, міс</th><th>Статус</th><th>ROP</th><th>Рекоменд. замовлення</th></tr></thead>
        <tbody>${stockAnalysisRows().map((row) => `<tr><td>${row.product.brand} ${row.product.model}</td><td>${row.beginning}</td><td>${row.receipt}</td><td>${row.sold}</td><td>${row.ending}</td><td>${row.monthlySales}</td><td>${row.months.toFixed(1)}</td><td>${row.status === "ОК" ? '<span class="pill good">ОК</span>' : '<span class="pill warn">' + row.status + '</span>'}</td><td>${row.rop}</td><td>${row.recommended}</td></tr>`).join("")}</tbody>
      </table></div>
    </section>

    <section class="panel">
      <h2>Аналітика маркетплейсів</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>Маркетплейс</th><th>SKU</th><th>Ціна</th><th>Продано</th><th>Сума</th><th>Комісія</th><th>Логістика</th><th>Інші витрати</th><th>Собівартість</th><th>Прибуток</th><th>Прибуток/шт</th><th>Маржа %</th></tr></thead>
        <tbody>${state.marketplaceStats.map((row) => {
          const revenue = row.price * row.sold;
          const cost = uah(row.cost, row.costCurrency) * row.sold;
          const profit = revenue - cost - row.commission - row.logistics - row.otherCosts;
          const margin = revenue ? Math.round(profit / revenue * 1000) / 10 : 0;
          return `<tr><td>${row.marketplace}</td><td>${row.sku}</td><td>${formatMoney(row.price, row.currency)}</td><td>${row.sold}</td><td>${formatMoney(revenue, row.currency)}</td><td>${formatMoney(row.commission, row.currency)}</td><td>${formatMoney(row.logistics, row.currency)}</td><td>${formatMoney(row.otherCosts, row.currency)}</td><td>${formatMoney(cost)}</td><td>${formatMoney(profit)}</td><td>${formatMoney(profit / row.sold)}</td><td>${margin}%</td></tr>`;
        }).join("")}</tbody>
      </table></div>
    </section>
    </div>
  `;
}

function renderFinance() {
  const docsPeriod = periodFilter("financeDocs");
  paymentDraft = resolvePaymentDraft();
  const debtorClients = paymentClients(paymentDraft.kind);
  const clientInvoices = openPaymentInvoices().filter((invoice) => !paymentDraft.clientId || invoice.clientId === paymentDraft.clientId);
  const selectedInvoice = byId(state.invoices, paymentDraft.invoiceId);
  const selectedCurrency = selectedInvoice?.currency || byId(state.clients, paymentDraft.clientId)?.currency || "UAH";
  const paymentCanSubmit = paymentDraft.kind === "advance" ? Boolean(paymentDraft.clientId) : Boolean(selectedInvoice);
  const firmOptions = state.settings.firms.map((firm) => option(firm.id, firm.name, firm.id === paymentDraft.firmId)).join("");
  const terminalOptions = paymentTerminalsForFirm(paymentDraft.firmId).map((terminal) => option(terminal.id, `${terminal.name} · ${firmName(terminal.firmId)}`, terminal.id === paymentDraft.terminalId)).join("");
  const receivableByManager = state.managers.map((manager) => ({
    manager,
    amount: state.invoices
      .filter((invoice) => invoice.manager === manager)
      .reduce((sum, invoice) => sum + Math.max(invoice.total - invoice.paid, 0), 0)
  }));
  const filteredPayments = state.payments.filter((payment) => dateInPeriod(payment.date, docsPeriod));
  const filteredCashShifts = state.cashShifts.filter((shift) => dateInPeriod(shift.date, docsPeriod));
  const filteredExpenses = state.expenses.filter((expense) => dateInPeriod(expense.date, docsPeriod));
  const filteredPayables = state.payables.filter((item) => dateInPeriod(item.dueDate || item.date || today, docsPeriod));
  return `
    <section class="grid two section-band">
      <div class="panel">
        <h2>Внести оплату</h2>
        <form class="form-grid" data-action="create-payment">
          <label class="field"><span>Джерело оплати</span><select name="paymentSource" data-payment-source>${variantOptions("paymentSources", paymentDraft.source)}</select></label>
          <label class="field"><span>Тип внесення</span><select name="paymentKind" data-payment-kind>${option("invoice", "До накладної", paymentDraft.kind === "invoice")}${option("advance", "Аванс клієнта", paymentDraft.kind === "advance")}</select></label>
          <label class="field wide"><span>Клієнт</span><select name="clientId" data-payment-client ${debtorClients.length ? "" : "disabled"}>${debtorClients.length ? debtorClients.map((client) => {
            const debt = openPaymentInvoices().filter((invoice) => invoice.clientId === client.id).reduce((sum, invoice) => sum + uah(invoiceDebt(invoice), invoice.currency), 0);
            const debtLabel = debt > 0 ? ` · борг ${formatMoney(debt)}` : " · аванс";
            return option(client.id, `${client.name}${debtLabel}`, client.id === paymentDraft.clientId);
          }).join("") : '<option value="">Немає клієнтів</option>'}</select></label>
          <label class="field full"><span>Накладна клієнта</span><select name="invoiceId" data-payment-invoice ${paymentDraft.kind === "invoice" && clientInvoices.length ? "" : "disabled"}>${paymentDraft.kind === "advance" ? '<option value="">Аванс без прив’язки до накладної</option>' : paymentInvoiceOptions(clientInvoices, paymentDraft.invoiceId)}</select></label>
          <label class="field wide"><span>Фірма зарахування</span><select name="firmId" data-payment-firm>${firmOptions}</select></label>
          ${paymentDraft.source === "card" ? `<label class="field wide"><span>Термінал</span><select name="terminalId" data-payment-terminal ${terminalOptions ? "" : "disabled"}>${terminalOptions || '<option value="">Немає термінала для фірми</option>'}</select></label>` : '<input type="hidden" name="terminalId" value="">'}
          ${paymentDraft.source === "cash" ? `<label class="field"><span>ПРРО</span><select name="prro" data-payment-prro>${option("true", "Проводити ПРРО", paymentDraft.prro === "true")}${option("false", "Не проводити ПРРО", paymentDraft.prro === "false")}</select></label>` : '<input type="hidden" name="prro" value="false">'}
          <label class="field"><span>Дата</span><input name="date" type="date" value="${today}"></label>
          <label class="field"><span>Сума</span><input name="amount" inputmode="decimal" value="0"></label>
          <label class="field"><span>Валюта</span><select name="currency">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === selectedCurrency)).join("")}</select></label>
          <label class="field"><span>Курс до UAH</span><input name="rate" type="text" inputmode="decimal" placeholder="автоматично"></label>
          <label class="field wide"><span>Референс</span><input name="bankRef" placeholder="${paymentDraft.source === "bank" ? "банк / IBAN / виписка" : paymentDraft.source === "card" ? "RRN / чек термінала / еквайринг" : "номер касового ордера / зміна"}"></label>
          <div class="table-wrap full">
            <table>
              <thead><tr><th>Накладна</th><th>Дата</th><th>Сума</th><th>Оплачено</th><th>Борг</th><th>До оплати</th></tr></thead>
              <tbody>
                ${clientInvoices.length ? clientInvoices.map((invoice) => `
                  <tr>
                    <td><strong>${invoice.id}</strong><br><span class="small muted">${invoice.channel} · ${invoice.manager}</span></td>
                    <td>${invoice.date}</td>
                    <td>${formatMoney(invoice.total, invoice.currency)}</td>
                    <td>${formatMoney(invoice.paid, invoice.currency)}</td>
                    <td><strong>${formatMoney(invoiceDebt(invoice), invoice.currency)}</strong></td>
                    <td>${invoice.dueDate || "-"}</td>
                  </tr>
                `).join("") : '<tr><td colspan="6">У вибраного клієнта немає накладних з боргом.</td></tr>'}
              </tbody>
            </table>
          </div>
          <button class="primary" type="submit" ${paymentCanSubmit ? "" : "disabled"}>${paymentDraft.kind === "advance" ? "Внести аванс" : "Прив'язати оплату"}</button>
        </form>
      </div>
      <div class="panel">
        <h2>Дебіторка менеджерів</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Менеджер</th><th>Дебіторка</th><th>Клієнти</th></tr></thead>
            <tbody>
              ${receivableByManager.map((row) => `
                <tr>
                  <td>${row.manager}</td>
                  <td>${formatMoney(row.amount)}</td>
                  <td>${state.clients.filter((client) => client.manager === row.manager).length}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="grid two section-band">
      <div class="panel">
        <h2>Внести витрату</h2>
        <form class="form-grid" data-action="create-expense">
          <label class="field"><span>Дата</span><input name="date" type="date" value="${today}"></label>
          <label class="field"><span>Стаття</span><select name="article">${variantOptions("expenseArticles")}</select></label>
          <label class="field"><span>Сума</span><input name="amount" inputmode="decimal" value="0"></label>
          <label class="field"><span>Валюта</span><select name="currency">${Object.keys(state.settings.rates).map((currency) => option(currency, currency)).join("")}</select></label>
          <label class="field"><span>Метод</span><select name="method">${variantOptions("financeMethods")}</select></label>
          <label class="field"><span>Постачальник</span><input name="supplier" placeholder="контрагент"></label>
          <label class="field"><span>Менеджер</span><select name="manager">${employeeOptions()}</select></label>
          <label class="field wide"><span>Коментар</span><input name="comment" placeholder="призначення витрати"></label>
          <button class="primary" type="submit">Додати витрату</button>
        </form>
      </div>
      <div class="panel">
        <h2>Створити кредиторку</h2>
        <form class="form-grid" data-action="create-payable">
          <label class="field wide"><span>Постачальник</span><input name="supplier" required></label>
          <label class="field"><span>Стаття</span><select name="article">${variantOptions("expenseArticles")}</select></label>
          <label class="field"><span>Сума</span><input name="amount" inputmode="decimal" value="0"></label>
          <label class="field"><span>Валюта</span><select name="currency">${Object.keys(state.settings.rates).map((currency) => option(currency, currency)).join("")}</select></label>
          <label class="field"><span>Дата оплати</span><input name="dueDate" type="date" value="${today}"></label>
          <label class="field"><span>Менеджер</span><select name="manager">${employeeOptions()}</select></label>
          <button class="primary" type="submit">Додати борг</button>
        </form>
      </div>
    </section>

    <section class="panel section-band no-print">
      <h2>Період фінансових документів</h2>
      ${renderPeriodPrintControls("financeDocs", "Оплати та звірка каси", docsPeriod, filteredPayments.length + filteredCashShifts.length)}
    </section>

    <section class="grid two" data-print-area="financeDocs" data-print-title="Фінансові документи">
      <div class="panel">
        <h2>Оплати</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Дата</th><th>Клієнт</th><th>Накладна</th><th>Сума</th><th>UAH екв.</th><th>Джерело</th><th>Фірма / термінал</th><th>Референс</th><th>Дії</th></tr></thead>
            <tbody>
              ${filteredPayments.map((payment) => `
                <tr>
                  <td>${payment.date}</td>
                  <td>${clientName(payment.clientId || byId(state.invoices, payment.invoiceId)?.clientId)}</td>
                  <td>${payment.advance ? '<span class="pill info">аванс</span>' : payment.invoiceId}</td>
                  <td>${formatMoney(payment.amount, payment.currency)}</td>
                  <td>${formatMoney(payment.amount * payment.rate)}</td>
                  <td>${paymentSourceLabel(payment.source || (payment.method === "Банк" ? "bank" : "cash"))}<br><span class="small muted">${payment.prro ? "ПРРО" : payment.source === "cash" ? "без ПРРО" : payment.method}</span></td>
                  <td>${payment.firmId ? firmName(payment.firmId) : "-"}<br><span class="small muted">${payment.terminalId ? terminalName(payment.terminalId) : "-"}</span></td>
                  <td>${payment.bankRef || "-"}</td>
                  <td class="row-actions no-print"><button class="ghost" data-edit-payment="${payment.id}" ${canEditPostedDocument("payment") ? "" : "disabled"}>Змінити</button></td>
                </tr>
              `).join("") || '<tr><td colspan="9" class="muted">Немає оплат за вибраний період.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
      <div class="panel">
        <h2>Звірка каси</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Зміна</th><th>Менеджер</th><th>Очікувано</th><th>Факт</th><th>Різниця</th><th>Стан</th></tr></thead>
            <tbody>
              ${filteredCashShifts.map((shift) => `
                <tr>
                  <td>${shift.date}</td>
                  <td>${shift.manager}</td>
                  <td>${formatMoney(shift.expected)}</td>
                  <td>${formatMoney(shift.actual)}</td>
                  <td>${formatMoney(shift.actual - shift.expected)}</td>
                  <td>${shift.closed ? '<span class="pill good">закрито</span>' : '<span class="pill warn">відкрита</span>'}</td>
                </tr>
              `).join("") || '<tr><td colspan="6" class="muted">Немає касових змін за вибраний період.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
      <div class="panel">
        <h2>Витрати</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Дата</th><th>Стаття</th><th>Сума</th><th>Метод</th><th>Постачальник</th><th>Менеджер</th><th>Дії</th></tr></thead>
            <tbody>
              ${filteredExpenses.map((expense) => `
                <tr>
                  <td>${expense.date}</td>
                  <td>${expense.article}</td>
                  <td>${formatMoney(expense.amount, expense.currency)}</td>
                  <td>${expense.method}</td>
                  <td>${expense.supplier || "-"}</td>
                  <td>${expense.manager || "-"}</td>
                  <td class="row-actions no-print"><button class="ghost" data-edit-expense="${expense.id}" ${canEditPostedDocument("expense") ? "" : "disabled"}>Змінити</button></td>
                </tr>
              `).join("") || '<tr><td colspan="7" class="muted">Немає витрат за вибраний період.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
      <div class="panel">
        <h2>Кредиторка</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Дата оплати</th><th>Постачальник</th><th>Стаття</th><th>Сума</th><th>Менеджер</th><th>Стан</th><th>Дії</th></tr></thead>
            <tbody>
              ${filteredPayables.map((payable) => `
                <tr>
                  <td>${payable.dueDate || "-"}</td>
                  <td>${payable.supplier}</td>
                  <td>${payable.article}</td>
                  <td>${formatMoney(payable.amount, payable.currency)}</td>
                  <td>${payable.manager || "-"}</td>
                  <td>${statusPill(payable.status || "open")}</td>
                  <td class="row-actions no-print"><button class="ghost" data-edit-payable="${payable.id}" ${canEditPostedDocument("payable") ? "" : "disabled"}>Змінити</button></td>
                </tr>
              `).join("") || '<tr><td colspan="7" class="muted">Немає кредиторки за вибраний період.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

function marketplaceNames() {
  return state.integrations
    .filter((integration) => ["rozetka", "prom", "epicentr", "allo"].includes(integration.id))
    .map((integration) => integration.name);
}

function productAvailableQty(productId, warehouseId = "", firmId = "") {
  const product = byId(state.products, productId);
  if (!product) return 0;
  if (product.type === "weapon") {
    return serialsForProduct(product)
      .filter(serialIsSelectable)
      .filter((serial) => (!warehouseId || serial.warehouseId === warehouseId) && (!firmId || (serial.firmId || "vat") === firmId))
      .length;
  }
  return stockQtyWhere(productId, ownStockPredicate({ warehouseId, firmId }));
}

function publicationPayload(publication) {
  const product = byId(state.products, publication.productId);
  return {
    marketplace: publication.marketplace,
    sku: publication.sku,
    externalId: publication.externalId,
    title: publication.title,
    product: product ? {
      id: product.id,
      type: product.type,
      brand: product.brand,
      model: product.model,
      category: product.category,
      barcode: product.barcode,
      supplierSku: product.supplierSku,
      internalCode: product.internalCode,
      uktzed: product.uktzed,
      description: product.description,
      photos: (product.photos || []).map((photo) => ({ name: photo.name, type: photo.type, width: photo.width, height: photo.height, dataUrl: photo.dataUrl }))
    } : null,
    price: publication.price,
    currency: publication.currency,
    stockQty: publication.stockQty,
    status: publication.status
  };
}

function marketplaceOrderMatchesFilter(order, filter) {
  return dateInOptionalPeriod(order.date, filter)
    && (!filter.status || order.status === filter.status)
    && (!filter.marketplace || order.marketplace === filter.marketplace);
}

function marketplacePublicationFilter() {
  const filter = state.marketplacePublicationFilters || {};
  return {
    search: filter.search || "",
    expanded: Boolean(filter.expanded)
  };
}

function productTableFilters() {
  const filter = state.productTableFilters || {};
  return {
    catalog: filter.catalog || "",
    stock: filter.stock || "",
    publications: filter.publications || ""
  };
}

function normalizeSearchText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\s+/g, " ")
    .trim();
}

function searchWords(value) {
  return normalizeSearchText(value).split(" ").filter(Boolean);
}

function normalizeClientSources(client) {
  const rows = Array.isArray(client.sources) ? client.sources : [];
  const normalized = rows
    .map((source) => typeof source === "string" ? { label: source } : (source || {}))
    .map((source) => ({
      type: source.type || client.sourceType || client.createdFrom || "crm",
      label: source.label || source.sourceName || source.source || client.sourceText || client.sourceName || client.source || "",
      detail: source.detail || source.orderId || source.file || client.sourceOrderId || client.counterpartyCode || client.externalId || client.oneCRef || "",
      orderId: source.orderId || client.sourceOrderId || "",
      file: source.file || client.sourceFile || "",
      date: source.date || client.importedAt || client.createdAt || client.updatedAt || today
    }))
    .filter((source) => source.label || source.detail || source.file || source.orderId);
  const fallbackLabel = client.sourceText || client.sourceName || client.source || (client.createdFrom === "sql_1c" ? "SQL / 1C" : client.createdFrom === "marketplace_order" ? "Маркетплейс / замовлення" : "CRM");
  if (!normalized.length && fallbackLabel) {
    normalized.push({
      type: client.sourceType || client.createdFrom || "crm",
      label: fallbackLabel,
      detail: client.sourceOrderId || client.counterpartyCode || client.externalId || client.oneCRef || "",
      orderId: client.sourceOrderId || "",
      file: client.sourceFile || "",
      date: client.importedAt || client.createdAt || client.updatedAt || today
    });
  }
  const seen = new Set();
  return normalized.filter((source) => {
    const key = [source.type, source.label, source.detail, source.orderId, source.file].join("|").toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function clientSourceLabel(client) {
  const sources = Array.isArray(client.sources) ? client.sources : [];
  const labels = sources.map((source) => source?.label || source?.source || source?.type).filter(Boolean);
  if (labels.length) return [...new Set(labels)].join(", ");
  return client.sourceText || client.sourceName || client.source || (client.createdFrom === "sql_1c" ? "SQL / 1C" : client.createdFrom === "marketplace_order" ? "Маркетплейс / замовлення" : "CRM");
}

function addClientSource(client, source) {
  client.sources = normalizeClientSources(client);
  const normalized = normalizeClientSources({ ...client, sources: [source] })[0];
  if (!normalized) return;
  const key = [normalized.type, normalized.label, normalized.detail, normalized.orderId, normalized.file].join("|").toLowerCase();
  if (!client.sources.some((item) => [item.type, item.label, item.detail, item.orderId, item.file].join("|").toLowerCase() === key)) {
    client.sources.push(normalized);
  }
  client.sourceType = client.sourceType || normalized.type;
  client.sourceName = client.sourceName || normalized.label;
  client.sourceText = clientSourceLabel(client);
}

function clientDateForFilter(client) {
  return String(client.updatedAt || client.importedAt || client.createdAt || today).slice(0, 10);
}

function clientSearchText(client) {
  return normalizeSearchText([
    client.name,
    client.fullName,
    client.type,
    client.edrpou,
    client.counterpartyCode,
    client.externalId,
    client.oneCRef,
    client.phone,
    client.email,
    client.address,
    client.manager,
    client.paymentTerms,
    client.currency,
    priceTypeName(client.priceType),
    client.taxMode,
    clientSourceLabel(client),
    client.sourceOrderId,
    client.sourceFile
  ].filter(Boolean).join(" "));
}

function salesClientMatchesBaseFilter(client, filter) {
  return dateInSingleAwarePeriod(clientDateForFilter(client), filter)
    && (!filter.source || clientSourceLabel(client) === filter.source);
}

function salesClientMatchesSearch(client, words) {
  if (!words.length) return true;
  const haystack = clientSearchText(client);
  return words.every((word) => haystack.includes(word));
}

function salesClientSourceOptions(selectedSource = "") {
  const sources = [...new Set(state.clients.map(clientSourceLabel).filter(Boolean))].sort((first, second) => first.localeCompare(second));
  return option("", "усі джерела", !selectedSource) + sources.map((source) => option(source, source, source === selectedSource)).join("");
}

function renderSalesClientFilters(filter, visibleCount, totalCount) {
  const hasFilter = filter.search || filter.source || filter.from || filter.to;
  return `
    <form class="period-toolbar no-print" data-sales-client-filter>
      <label class="field wide"><span>Пошук по назві</span><input name="search" data-sales-client-search value="${escapeHtml(filter.search)}" placeholder="назва, телефон, ЄДРПОУ, код, замовлення"></label>
      <label class="field"><span>Джерело</span><select name="source" data-sales-client-filter-input>${salesClientSourceOptions(filter.source)}</select></label>
      <label class="field"><span>Дата від</span><input name="from" type="date" value="${escapeHtml(filter.from)}" data-sales-client-filter-input></label>
      <label class="field"><span>Дата до</span><input name="to" type="date" value="${escapeHtml(filter.to)}" data-sales-client-filter-input></label>
      <button class="ghost" type="button" data-reset-sales-client-filter ${hasFilter ? "" : "disabled"}>Скинути</button>
      <span class="pill info" data-sales-client-result-count>${visibleCount}/${totalCount}</span>
    </form>
  `;
}

function renderSalesClientRow(client, visible = true) {
  const source = clientSourceLabel(client);
  const details = [client.counterpartyCode, client.externalId, client.oneCRef, client.sourceOrderId].filter(Boolean).join(" · ");
  return `
    <tr class="clickable-row" data-sales-client-row data-client-search-text="${escapeHtml(clientSearchText(client))}" data-open-client="${escapeHtml(client.id)}" style="${visible ? "" : "display:none"}" title="Відкрити картку клієнта">
      <td><strong>${escapeHtml(source)}</strong><br><span class="small muted">${escapeHtml(details || client.sourceFile || "-")}</span></td>
      <td><strong>${escapeHtml(client.name || "-")}</strong><br><span class="small muted">${escapeHtml(client.type || "-")} · ${escapeHtml(clientDateForFilter(client))}</span></td>
      <td>${escapeHtml(client.edrpou || "-")}<br><span class="small muted">${escapeHtml(client.counterpartyCode || client.externalId || client.oneCRef || "-")}</span></td>
      <td>${escapeHtml(client.phone || "-")}<br><span class="small muted">${escapeHtml(client.email || "-")}</span></td>
      <td>${escapeHtml(client.address || "-")}</td>
      <td>${escapeHtml(client.manager || "-")}</td>
      <td>${escapeHtml(client.paymentTerms || "-")}<br><span class="small muted">ліміт ${formatMoney(client.creditLimitUAH || 0, client.currency || "UAH")}</span></td>
      <td>${escapeHtml(priceTypeName(client.priceType) || client.priceType || "-")}<br><span class="small muted">${escapeHtml(client.taxMode || "-")}</span></td>
    </tr>
  `;
}

function applySalesClientSearch(root = document) {
  const input = root.querySelector("[data-sales-client-search]");
  const value = input?.value || "";
  const words = searchWords(value);
  let visible = 0;
  let total = 0;
  root.querySelectorAll("[data-sales-client-row]").forEach((row) => {
    total += 1;
    const haystack = row.dataset.clientSearchText || "";
    const show = words.every((word) => haystack.includes(word));
    row.style.display = show ? "" : "none";
    if (show) visible += 1;
  });
  const count = root.querySelector("[data-sales-client-result-count]");
  if (count) count.textContent = `${visible}/${total}`;
  const reset = root.querySelector("[data-reset-sales-client-filter]");
  if (reset) reset.disabled = !(value.trim() || salesClientFilter().source || salesClientFilter().from || salesClientFilter().to);
  const empty = root.querySelector("[data-sales-client-empty]");
  if (empty) empty.style.display = visible || !total ? "none" : "";
}

function renderSalesClientsPanel() {
  const filter = salesClientFilter();
  const baseClients = state.clients.filter((client) => salesClientMatchesBaseFilter(client, filter));
  const words = searchWords(filter.search);
  const visibleClients = baseClients.filter((client) => salesClientMatchesSearch(client, words));
  const emptyText = baseClients.length ? "Немає клієнтів за пошуком." : "Немає клієнтів за вибраними фільтрами.";
  return `
    <section class="panel section-band" data-print-area="salesClients" data-print-title="Продажі · клієнти">
      <div class="split">
        <div>
          <h2>2.4 Клієнти</h2>
          <p class="small muted">Контрагенти з SQL/1C і покупці, створені із замовлень маркетплейсів. Колонка «Джерело» показує, звідки додано запис.</p>
        </div>
        <span class="pill info">${visibleClients.length} клієнтів</span>
      </div>
      ${renderSalesClientFilters(filter, visibleClients.length, baseClients.length)}
      <details class="order-dropdown" data-sales-clients-dropdown ${filter.expanded ? "open" : ""}>
        <summary>
          <span>
            <strong>Клієнти / контрагенти</strong>
            <small>${filter.expanded ? "Натисніть, щоб згорнути список." : "Натисніть, щоб розгорнути список."}</small>
          </span>
          <span class="pill info" data-sales-client-summary-count>${visibleClients.length} рядків</span>
        </summary>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Джерело</th>
                <th>Клієнт / контрагент</th>
                <th>ЄДРПОУ / ІПН</th>
                <th>Контакти</th>
                <th>Адреса</th>
                <th>Менеджер</th>
                <th>Умови</th>
                <th>Прайс / податки</th>
              </tr>
            </thead>
            <tbody>
              ${baseClients.map((client) => renderSalesClientRow(client, salesClientMatchesSearch(client, words))).join("")}
              <tr data-sales-client-empty style="${visibleClients.length || !baseClients.length ? "display:none" : ""}">
                <td colspan="8" class="muted">${emptyText}</td>
              </tr>
              ${!baseClients.length ? `<tr><td colspan="8" class="muted">${emptyText}</td></tr>` : ""}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  `;
}

function productTableSearchText(source) {
  const product = source?.product || byId(state.products, source?.productId || source?.id);
  return normalizeSearchText([
    productLabel(product),
    product?.category,
    product?.supplierSku,
    product?.internalCode,
    product?.barcode,
    source?.title,
    source?.sku,
    source?.externalId,
    source?.marketplace
  ].filter(Boolean).join(" "));
}

function productTableMatchesName(source, search) {
  const words = searchWords(search);
  if (!words.length) return true;
  const haystack = productTableSearchText(source);
  return words.every((word) => haystack.includes(word));
}

function renderProductTableSearch(tableKey, label, visibleCount, totalCount) {
  const filters = productTableFilters();
  const value = filters[tableKey] || "";
  return `
    <div class="product-table-toolbar no-print">
      <label class="field compact">
        <span>Пошук по назві</span>
        <input name="productTableSearch-${escapeHtml(tableKey)}" data-product-table-search="${escapeHtml(tableKey)}" value="${escapeHtml(value)}" placeholder="${escapeHtml(label)}">
      </label>
      <span class="pill info" data-product-table-count="${escapeHtml(tableKey)}">${visibleCount}/${totalCount}</span>
      <button class="ghost" type="button" data-reset-product-table-search="${escapeHtml(tableKey)}" ${value ? "" : "disabled"}>Скинути</button>
    </div>
  `;
}

function applyProductTableSearch(tableKey) {
  const input = document.querySelector(`[data-product-table-search="${CSS.escape(tableKey)}"]`);
  const value = input?.value || "";
  const words = searchWords(value);
  let visible = 0;
  let total = 0;
  $$(`[data-product-table-row="${CSS.escape(tableKey)}"]`).forEach((row) => {
    total += 1;
    const haystack = row.dataset.productSearchText || "";
    const show = words.every((word) => haystack.includes(word));
    row.style.display = show ? "" : "none";
    if (show) visible += 1;
  });
  const count = document.querySelector(`[data-product-table-count="${CSS.escape(tableKey)}"]`);
  if (count) count.textContent = `${visible}/${total}`;
  const reset = document.querySelector(`[data-reset-product-table-search="${CSS.escape(tableKey)}"]`);
  if (reset) reset.disabled = !value.trim();
  const empty = document.querySelector(`[data-product-table-empty="${CSS.escape(tableKey)}"]`);
  if (empty) empty.style.display = visible || !total ? "none" : "";
}

function marketplacePublicationSearchText(publication) {
  const product = byId(state.products, publication.productId);
  const crmQty = productAvailableQty(publication.productId);
  return normalizeSearchText([
    publication.marketplace,
    publication.sku,
    publication.externalId,
    publication.title,
    publication.price,
    publication.currency,
    publication.stockQty,
    crmQty,
    publication.manager,
    publication.status,
    statusPill(publication.status).replace(/<[^>]+>/g, " "),
    publication.lastSync,
    product?.brand,
    product?.model,
    product?.category,
    product?.supplierSku,
    product?.internalCode,
    product?.barcode,
    product?.marketplaceSku
  ].filter(Boolean).join(" "));
}

function marketplacePublicationMatchesSearch(publication, filter) {
  const words = Array.isArray(filter) ? filter : searchWords(filter.search || filter);
  if (!words.length) return true;
  const haystack = marketplacePublicationSearchText(publication);
  return words.every((word) => haystack.includes(word));
}

function rozetkaImportedOrderFilter() {
  const filter = state.rozetkaImportedOrderFilters || {};
  const sortBy = ["date", "externalOrderId", "buyer", "product", "total", "delivery", "payment", "status"].includes(filter.sortBy)
    ? filter.sortBy
    : "date";
  return {
    from: filter.from || "",
    to: filter.to || "",
    status: filter.status || "",
    sortBy,
    sortDir: filter.sortDir === "asc" ? "asc" : "desc",
    expanded: Boolean(filter.expanded)
  };
}

function rozetkaImportedOrderTotal(order) {
  return Number(order.payment?.amount || (Number(order.qty || 1) * Number(order.price || 0)));
}

function rozetkaImportedOrderProductLabel(order) {
  const product = byId(state.products, order.productId);
  return product ? `${product.brand} ${product.model}` : order.sku || "Товар Rozetka";
}

function rozetkaImportedOrderSortValue(order, key) {
  const buyer = marketplaceOrderBuyer(order);
  const delivery = order.delivery || {};
  const payment = order.payment || {};
  const status = MARKETPLACE_ORDER_STATUS_MAP[order.status]?.label || order.status || "";
  const values = {
    date: order.date || "",
    externalOrderId: order.externalOrderId || "",
    buyer: buyer.name || "",
    product: rozetkaImportedOrderProductLabel(order),
    total: rozetkaImportedOrderTotal(order),
    delivery: `${delivery.status || ""} ${delivery.ttn || ""} ${delivery.service || ""}`,
    payment: `${payment.status || ""} ${payment.apiStatus || ""} ${payment.source || payment.method || ""}`,
    status
  };
  return values[key] ?? "";
}

function compareSortValues(first, second) {
  if (typeof first === "number" && typeof second === "number") return first - second;
  return String(first ?? "").localeCompare(String(second ?? ""), "uk", { numeric: true, sensitivity: "base" });
}

function sortRozetkaImportedOrders(orders, filter) {
  const direction = filter.sortDir === "asc" ? 1 : -1;
  return [...orders].sort((first, second) => {
    const result = compareSortValues(
      rozetkaImportedOrderSortValue(first, filter.sortBy),
      rozetkaImportedOrderSortValue(second, filter.sortBy)
    );
    if (result) return result * direction;
    return String(second.rozetka?.importedAt || second.date || "").localeCompare(
      String(first.rozetka?.importedAt || first.date || ""),
      "uk",
      { numeric: true, sensitivity: "base" }
    );
  });
}

function marketplaceOrderOptions(selectedId = "") {
  return state.marketplaceOrders.map((order) => option(
    order.id,
    `${order.date} · ${order.marketplace} · ${order.externalOrderId} · ${MARKETPLACE_ORDER_STATUS_MAP[order.status]?.label || order.status}`,
    order.id === selectedId
  )).join("");
}

function renderMarketplaceOrderFilters(names, filter, resultCount) {
  return `
    <form class="period-toolbar marketplace-filter no-print" data-marketplace-order-filter>
      <label class="field compact"><span>Дата від</span><input name="from" type="date" value="${escapeHtml(filter.from)}"></label>
      <label class="field compact"><span>Дата до</span><input name="to" type="date" value="${escapeHtml(filter.to)}"></label>
      <label class="field compact"><span>Статус</span><select name="status">
        <option value="">Всі статуси</option>
        ${marketplaceOrderStatusOptions(filter.status)}
      </select></label>
      <label class="field compact"><span>Маркетплейс</span><select name="marketplace">
        <option value="">Всі маркетплейси</option>
        ${names.map((name) => option(name, name, name === filter.marketplace)).join("")}
      </select></label>
      <span class="pill info">${resultCount} замовлень</span>
      <button class="secondary" type="button" data-print-scope="marketplaceDocs" ${canPrintDocuments() ? "" : "disabled"}>Друк</button>
      <button class="ghost" type="button" data-reset-marketplace-order-filter>Скинути</button>
    </form>
  `;
}

function defaultMarketplacePublicationLine(productId = "") {
  const product = byId(state.products, productId) || state.products[0];
  const price = product ? productSalePrice(product, marketplacePriceTypeId()) : { amount: 0, currency: "UAH" };
  const productCategory = product?.category || "";
  return {
    marketplace: marketplaceNames()[0] || "",
    productId: product?.id || "",
    sku: product?.supplierSku || product?.internalCode || "",
    externalId: "",
    title: product ? `${product.brand} ${product.model}` : "",
    categoryName: productCategory,
    categoryId: "",
    groupParam: product?.caliber || product?.unit || productCategory,
    filter1Name: "Бренд",
    filter1Value: product?.brand || "",
    filter2Name: product?.caliber ? "Калібр" : "Категорія",
    filter2Value: product?.caliber || productCategory,
    filter3Name: "Модель",
    filter3Value: product?.model || "",
    weightKg: "",
    lengthCm: "",
    widthCm: "",
    heightCm: "",
    cargoPlaces: 1,
    price: price.amount || product?.price || 0,
    currency: price.currency || product?.currency || "UAH",
    manager: state.currentManager
  };
}

function marketplacePublicationDraftLines() {
  const lines = Array.isArray(marketplacePublicationDraft.lines) && marketplacePublicationDraft.lines.length
    ? marketplacePublicationDraft.lines
    : [defaultMarketplacePublicationLine()];
  return lines.map((line) => ({ ...defaultMarketplacePublicationLine(line.productId), ...line }));
}

function renderMarketplacePublicationLine(line, index, names) {
  const product = byId(state.products, line.productId) || state.products[0];
  return `
    <tr data-marketplace-publication-line="${index}">
      <td>
        <select name="marketplace" data-marketplace-publication-line-index="${index}">
          ${names.map((name) => option(name, name, name === (line.marketplace || names[0]))).join("")}
        </select>
      </td>
      <td class="line-product">
        <select name="productId" data-marketplace-publication-line-index="${index}" data-marketplace-publication-product>
          ${state.products.map((item) => option(item.id, `${item.brand} ${item.model}`, item.id === product?.id)).join("")}
        </select>
        <span class="small muted">${product ? productCodes(product) : ""}</span>
      </td>
      <td><input name="sku" data-marketplace-publication-line-index="${index}" value="${escapeHtml(line.sku || "")}" required placeholder="SKU"></td>
      <td><input name="externalId" data-marketplace-publication-line-index="${index}" value="${escapeHtml(line.externalId || "")}" placeholder="id каналу"></td>
      <td class="line-product"><input name="title" data-marketplace-publication-line-index="${index}" value="${escapeHtml(line.title || "")}" required placeholder="назва публікації"></td>
      <td class="line-product marketplace-requirements-cell">
        <input name="categoryName" data-marketplace-publication-line-index="${index}" value="${escapeHtml(line.categoryName || "")}" required placeholder="категорія маркетплейсу">
        <input name="categoryId" data-marketplace-publication-line-index="${index}" value="${escapeHtml(line.categoryId || "")}" placeholder="ID категорії / rz_id">
        <input name="groupParam" data-marketplace-publication-line-index="${index}" value="${escapeHtml(line.groupParam || "")}" placeholder="параметр групування">
        <div class="requirements-grid">
          <input name="filter1Name" data-marketplace-publication-line-index="${index}" value="${escapeHtml(line.filter1Name || "")}" placeholder="фільтр 1">
          <input name="filter1Value" data-marketplace-publication-line-index="${index}" value="${escapeHtml(line.filter1Value || "")}" placeholder="значення 1">
          <input name="filter2Name" data-marketplace-publication-line-index="${index}" value="${escapeHtml(line.filter2Name || "")}" placeholder="фільтр 2">
          <input name="filter2Value" data-marketplace-publication-line-index="${index}" value="${escapeHtml(line.filter2Value || "")}" placeholder="значення 2">
          <input name="filter3Name" data-marketplace-publication-line-index="${index}" value="${escapeHtml(line.filter3Name || "")}" placeholder="фільтр 3">
          <input name="filter3Value" data-marketplace-publication-line-index="${index}" value="${escapeHtml(line.filter3Value || "")}" placeholder="значення 3">
        </div>
      </td>
      <td class="line-product marketplace-logistics-cell">
        <div class="requirements-grid">
          <input name="weightKg" data-marketplace-publication-line-index="${index}" inputmode="decimal" value="${escapeHtml(line.weightKg || "")}" placeholder="кг">
          <input name="lengthCm" data-marketplace-publication-line-index="${index}" inputmode="decimal" value="${escapeHtml(line.lengthCm || "")}" placeholder="довжина см">
          <input name="widthCm" data-marketplace-publication-line-index="${index}" inputmode="decimal" value="${escapeHtml(line.widthCm || "")}" placeholder="ширина см">
          <input name="heightCm" data-marketplace-publication-line-index="${index}" inputmode="decimal" value="${escapeHtml(line.heightCm || "")}" placeholder="висота см">
          <input name="cargoPlaces" data-marketplace-publication-line-index="${index}" type="number" min="1" value="${escapeHtml(line.cargoPlaces || 1)}" placeholder="місць">
        </div>
      </td>
      <td><input name="price" data-marketplace-publication-line-index="${index}" inputmode="decimal" value="${escapeHtml(line.price ?? 0)}"></td>
      <td><select name="currency" data-marketplace-publication-line-index="${index}">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === (line.currency || "UAH"))).join("")}</select></td>
      <td><select name="manager" data-marketplace-publication-line-index="${index}">${employeeOptions(line.manager || state.currentManager)}</select></td>
      <td class="row-actions no-print">
        <button class="danger" type="button" data-remove-marketplace-publication-line="${index}" ${marketplacePublicationDraftLines().length <= 1 ? "disabled" : ""}>Прибрати</button>
      </td>
    </tr>
  `;
}

function collectMarketplacePublicationLinesFromForm(form) {
  return Array.from(form.querySelectorAll("[data-marketplace-publication-line]")).map((row) => ({
    marketplace: row.querySelector('[name="marketplace"]')?.value || "",
    productId: row.querySelector('[name="productId"]')?.value || "",
    sku: row.querySelector('[name="sku"]')?.value || "",
    externalId: row.querySelector('[name="externalId"]')?.value || "",
    title: row.querySelector('[name="title"]')?.value || "",
    categoryName: row.querySelector('[name="categoryName"]')?.value || "",
    categoryId: row.querySelector('[name="categoryId"]')?.value || "",
    groupParam: row.querySelector('[name="groupParam"]')?.value || "",
    filter1Name: row.querySelector('[name="filter1Name"]')?.value || "",
    filter1Value: row.querySelector('[name="filter1Value"]')?.value || "",
    filter2Name: row.querySelector('[name="filter2Name"]')?.value || "",
    filter2Value: row.querySelector('[name="filter2Value"]')?.value || "",
    filter3Name: row.querySelector('[name="filter3Name"]')?.value || "",
    filter3Value: row.querySelector('[name="filter3Value"]')?.value || "",
    weightKg: row.querySelector('[name="weightKg"]')?.value || "",
    lengthCm: row.querySelector('[name="lengthCm"]')?.value || "",
    widthCm: row.querySelector('[name="widthCm"]')?.value || "",
    heightCm: row.querySelector('[name="heightCm"]')?.value || "",
    cargoPlaces: row.querySelector('[name="cargoPlaces"]')?.value || "1",
    price: normalizeDecimalText(row.querySelector('[name="price"]')?.value || 0),
    currency: row.querySelector('[name="currency"]')?.value || "UAH",
    manager: row.querySelector('[name="manager"]')?.value || state.currentManager
  })).filter((line) => line.productId || line.sku || line.title);
}

function publicationFiltersFromLine(line) {
  return [1, 2, 3].map((index) => ({
    name: String(line[`filter${index}Name`] || "").trim(),
    value: String(line[`filter${index}Value`] || "").trim()
  })).filter((item) => item.name && item.value);
}

function publicationLogisticsFromLine(line) {
  return {
    weightKg: parseDecimal(line.weightKg, 0),
    lengthCm: parseDecimal(line.lengthCm, 0),
    widthCm: parseDecimal(line.widthCm, 0),
    heightCm: parseDecimal(line.heightCm, 0),
    cargoPlaces: Math.max(1, Number(line.cargoPlaces || 1))
  };
}

function validateMarketplacePublicationRequirements(line, rowNumber) {
  if (!String(line.categoryName || line.categoryId || "").trim()) {
    throw new Error(`Рядок ${rowNumber}: вкажіть категорію маркетплейсу або ID категорії.`);
  }
  const filters = publicationFiltersFromLine(line);
  if (filters.length < 3) {
    throw new Error(`Рядок ${rowNumber}: потрібно мінімум 3 характеристики/фільтри категорії.`);
  }
  const overLimit = filters.find((item) => item.value.length > 500);
  if (overLimit) {
    throw new Error(`Рядок ${rowNumber}: значення характеристики "${overLimit.name}" довше 500 символів.`);
  }
  return filters;
}

function publicationMarketplaceRequirementsSummary(publication) {
  const category = publication.category?.name || publication.categoryName || publication.category?.id || publication.categoryId || "-";
  const filters = Array.isArray(publication.filters) ? publication.filters : [];
  const filterText = filters.length
    ? filters.slice(0, 3).map((item) => `${escapeHtml(item.name)}: ${escapeHtml(item.value)}`).join("<br>")
    : '<span class="muted">фільтри не внесені</span>';
  return `<strong>${escapeHtml(category)}</strong><br><span class="small muted">${filterText}</span>`;
}

function publicationLinkedProduct(publication) {
  return byId(state.products, publication.productId);
}

function addPublicationIssue(list, key, label, level = "warn") {
  if (!list.some((item) => item.key === key)) list.push({ key, label, level });
}

function marketplacePublicationMissingFields(publication) {
  const product = publicationLinkedProduct(publication);
  const category = publication.category || {};
  const filters = Array.isArray(publication.filters) ? publication.filters : [];
  const logistics = publication.logistics || {};
  const issues = [];
  if (!String(publication.marketplace || "").trim()) addPublicationIssue(issues, "marketplace", "маркетплейс", "danger");
  if (!publication.productId || !product) addPublicationIssue(issues, "productId", "товар CRM", "danger");
  if (!String(publication.sku || "").trim()) addPublicationIssue(issues, "sku", "SKU каналу", "danger");
  if (!String(publication.title || "").trim()) addPublicationIssue(issues, "title", "назва публікації", "danger");
  if (!String(category.name || category.id || publication.categoryName || publication.categoryId || "").trim()) addPublicationIssue(issues, "category", "категорія маркетплейсу", "danger");
  if (filters.length < 3) addPublicationIssue(issues, "filters", "мінімум 3 фільтри / характеристики", "danger");
  filters.forEach((item, index) => {
    if (!String(item.name || "").trim() || !String(item.value || "").trim()) addPublicationIssue(issues, `filter:${index}`, `фільтр ${index + 1}`, "danger");
    if (String(item.value || "").length > 500) addPublicationIssue(issues, `filter:${index}:limit`, `фільтр ${index + 1} довший 500 символів`, "danger");
  });
  if (!Number(publication.price || 0)) addPublicationIssue(issues, "price", "ціна", "danger");
  if (!String(publication.currency || "").trim()) addPublicationIssue(issues, "currency", "валюта", "warn");
  if ((publication.photosStatus || (product?.photos?.length ? "ok" : "missing")) !== "ok") addPublicationIssue(issues, "photos", "фото товару", "danger");
  if (!String(publication.externalId || "").trim()) addPublicationIssue(issues, "externalId", "зовнішній ID / ID джерела", "warn");
  if (!String(publication.manager || "").trim()) addPublicationIssue(issues, "manager", "відповідальний", "warn");
  if (product && !String(product.description || "").trim()) addPublicationIssue(issues, "description", "опис товару", "warn");
  if (product && !String(product.brand || "").trim()) addPublicationIssue(issues, "brand", "бренд", "warn");
  if (product && !String(product.model || "").trim()) addPublicationIssue(issues, "model", "модель", "warn");
  if (Number(publication.stockQty ?? productAvailableQty(publication.productId)) <= 0) addPublicationIssue(issues, "stockQty", "залишок для продажу", "warn");
  if (!Number(logistics.weightKg || 0)) addPublicationIssue(issues, "weightKg", "вага", "warn");
  if (!Number(logistics.lengthCm || 0) || !Number(logistics.widthCm || 0) || !Number(logistics.heightCm || 0)) addPublicationIssue(issues, "dimensions", "габарити пакування", "warn");
  return issues;
}

function marketplacePublicationReadiness(publication) {
  const issues = marketplacePublicationMissingFields(publication);
  const danger = issues.filter((issue) => issue.level === "danger");
  const warn = issues.filter((issue) => issue.level !== "danger");
  if (danger.length) return { issues, danger, warn, label: "не готова", className: "danger" };
  if (warn.length) return { issues, danger, warn, label: "перевірити", className: "warn" };
  if (publication.status === "published") return { issues, danger, warn, label: "опубліковано", className: "good" };
  return { issues, danger, warn, label: "готова до обміну", className: "good" };
}

function syncPublicationReadinessFields(publication) {
  const readiness = marketplacePublicationReadiness(publication);
  publication.validation = readiness.issues.map(({ key, label, level }) => ({ key, label, level }));
  publication.readiness = readiness.label;
  return publication;
}

function renderPublicationIssueCompact(publication) {
  const readiness = marketplacePublicationReadiness(publication);
  if (!readiness.issues.length) return `<span class="pill ${readiness.className}">${escapeHtml(readiness.label)}</span>`;
  return `<span class="pill ${readiness.className}">${readiness.issues.length} не виконано</span>`;
}

function renderPublicationIssueSummary(publication) {
  const readiness = marketplacePublicationReadiness(publication);
  if (!readiness.issues.length) return '<p class="notice good small full">Публікація готова: критичні поля маркетплейсу заповнені.</p>';
  return `
    <div class="order-issues notice ${readiness.danger.length ? "danger" : "warn"} full">
      <strong>Потрібно доповнити перед виставленням</strong>
      <div class="issue-pill-list">
        ${readiness.danger.map((issue) => `<span class="pill danger">${escapeHtml(issue.label)}</span>`).join("")}
        ${readiness.warn.map((issue) => `<span class="pill warn">${escapeHtml(issue.label)}</span>`).join("")}
      </div>
    </div>
  `;
}

function publicationFieldClass(issues, keys, base = "field") {
  const level = missingIssueLevel(issues, keys);
  return level ? `${base} field-missing ${level}` : base;
}

function renderMarketplacePublicationControl() {
  const rows = state.marketplacePublications.map((publication) => {
    const readiness = marketplacePublicationReadiness(publication);
    return { publication, readiness };
  });
  const needsAttention = rows.filter(({ publication, readiness }) => readiness.issues.length || publication.status !== "published");
  const blockers = rows.filter(({ readiness }) => readiness.danger.length).length;
  const warnings = rows.filter(({ readiness }) => !readiness.danger.length && readiness.warn.length).length;
  const ready = rows.filter(({ publication, readiness }) => !readiness.issues.length && publication.status !== "published").length;
  const published = rows.filter(({ publication, readiness }) => !readiness.issues.length && publication.status === "published").length;
  return `
    <section class="panel section-band">
      <div class="split">
        <h2>Контроль виставлення товарів</h2>
        <span class="pill ${blockers ? "danger" : warnings ? "warn" : "good"}">${needsAttention.length} потребують уваги</span>
      </div>
      <div class="grid four">
        <article class="card metric danger"><span>Блокери</span><strong>${blockers}</strong><small>Без цих полів публікацію не відправляємо.</small></article>
        <article class="card metric warn"><span>Попередження</span><strong>${warnings}</strong><small>Можна готувати, але треба перевірити.</small></article>
        <article class="card metric good"><span>Готові</span><strong>${ready}</strong><small>Чекають синхронізації.</small></article>
        <article class="card metric info"><span>Опубліковані</span><strong>${published}</strong><small>Останній стан у CRM.</small></article>
      </div>
      <div class="table-wrap compact-table">
        <table>
          <thead><tr><th>Публікація</th><th>Товар</th><th>Готовність</th><th>Обмін</th><th>Що виправити</th></tr></thead>
          <tbody>
            ${needsAttention.slice(0, 12).map(({ publication, readiness }) => `
              <tr class="clickable-row ${readiness.issues.length ? "row-has-issues" : ""}" data-edit-publication="${escapeHtml(publication.id)}" title="Відкрити публікацію">
                <td><strong>${escapeHtml(publication.marketplace || "-")} · ${escapeHtml(publication.sku || "-")}</strong><br><span class="small muted">${escapeHtml(publication.externalId || "-")}</span></td>
                <td>${escapeHtml(productName(publication.productId))}</td>
                <td><span class="pill ${readiness.className}">${escapeHtml(readiness.label)}</span></td>
                <td>${statusPill(publication.status)}<br><span class="small muted">${escapeHtml(publication.lastSync || "ще не синхронізовано")}</span></td>
                <td><div class="issue-pill-list">${readiness.issues.slice(0, 5).map((issue) => `<span class="pill ${issue.level === "danger" ? "danger" : "warn"}">${escapeHtml(issue.label)}</span>`).join("") || '<span class="pill good">можна синхронізувати</span>'}</div></td>
              </tr>
            `).join("") || '<tr><td colspan="5" class="muted">Критичних проблем у публікаціях немає.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderMarketplacePublicationCreateForm() {
  const names = marketplaceNames();
  const lines = marketplacePublicationDraftLines();
  return `
    <form class="stack" data-action="create-marketplace-publication">
      <div class="split">
        <h3>Створити публікацію</h3>
        <button class="secondary" type="button" data-add-marketplace-publication-line>Додати ще</button>
      </div>
      <p class="notice small">Для модерації маркетплейсів заповнюйте категорію, ID категорії за наявності, мінімум 3 фільтри/характеристики, параметр групування та габарити упаковки. CRM збере ці поля в картку публікації перед синхронізацією.</p>
      <div class="table-wrap invoice-lines">
        <table>
          <thead><tr><th>Маркетплейс</th><th>Товар</th><th>SKU каналу</th><th>Зовн. ID</th><th>Назва публікації</th><th>Категорія / фільтри</th><th>Логістика</th><th>Ціна</th><th>Валюта</th><th>Менеджер</th><th>Дії</th></tr></thead>
          <tbody>${lines.map((line, index) => renderMarketplacePublicationLine(line, index, names)).join("")}</tbody>
        </table>
      </div>
      <button class="primary" type="submit">Створити публікацію</button>
    </form>
  `;
}

function refreshMarketplacePublicationModal(form) {
  const modal = form?.closest(".modal-backdrop");
  if (!modal) return false;
  const body = $(".modal-body", modal);
  if (!body) return false;
  body.innerHTML = renderMarketplacePublicationCreateForm();
  prepareDecimalInputs(modal);
  applyRoleFieldLocks(modal);
  return true;
}

function openCreateMarketplacePublicationForm() {
  openModal("Створити публікацію", renderMarketplacePublicationCreateForm());
}

function updateMarketplacePublicationDraftFromForm(form) {
  marketplacePublicationDraft = {
    ...marketplacePublicationDraft,
    lines: collectMarketplacePublicationLinesFromForm(form)
  };
}

function rozetkaInboundState() {
  if (!state.rozetkaInbound) state.rozetkaInbound = clone(seedState.rozetkaInbound);
  state.rozetkaInbound.progress = {
    ...clone(seedState.rozetkaInbound.progress),
    ...(state.rozetkaInbound.progress || {})
  };
  return state.rozetkaInbound;
}

function rozetkaProgressState() {
  return rozetkaInboundState().progress;
}

function rozetkaErrorCode(error) {
  if (error?.code) return String(error.code);
  const message = String(error?.message || "");
  const match = message.match(/\bHTTP\s*(\d{3})\b|\bstatus\s*(\d{3})\b|\bcode[:\s]+([A-Z0-9_-]+)\b/i);
  return match ? (match[1] || match[2] || match[3]) : "CRM_IMPORT_ERROR";
}

function setRozetkaProgress(status, percent, stage, message = "", code = "") {
  const progress = rozetkaProgressState();
  progress.status = status;
  progress.percent = Math.max(0, Math.min(100, Number(percent || 0)));
  progress.stage = stage;
  progress.message = message;
  progress.code = code || "";
  progress.updatedAt = currentTimestamp();
  paintRozetkaProgress();
}

function paintRozetkaProgress(root = document) {
  const progress = rozetkaProgressState();
  const frame = root.querySelector?.("[data-rozetka-progress]");
  if (!frame) return;
  frame.dataset.progressStatus = progress.status || "idle";
  const bar = frame.querySelector("[data-rozetka-progress-bar]");
  if (bar) bar.style.width = `${progress.percent || 0}%`;
  const percent = frame.querySelector("[data-rozetka-progress-percent]");
  if (percent) percent.textContent = `${progress.percent || 0}%`;
  const status = frame.querySelector("[data-rozetka-progress-status]");
  if (status) {
    status.textContent = progress.status === "success" ? "OK" : progress.status === "error" ? `Помилка ${progress.code || ""}`.trim() : progress.status === "running" ? "В процесі" : "Очікує";
    status.className = `pill ${progress.status === "success" ? "good" : progress.status === "error" ? "danger" : progress.status === "running" ? "warn" : "info"}`;
  }
  const stage = frame.querySelector("[data-rozetka-progress-stage]");
  if (stage) stage.textContent = progress.stage || "";
  const message = frame.querySelector("[data-rozetka-progress-message]");
  if (message) message.textContent = progress.message || "";
  const updated = frame.querySelector("[data-rozetka-progress-updated]");
  if (updated) updated.textContent = progress.updatedAt || "";
}

function queryFromForm(form, keys) {
  const data = formData(form);
  const params = new URLSearchParams();
  keys.forEach((key) => {
    const value = data[key];
    if (value !== undefined && String(value).trim() !== "") {
      params.set(key, value);
    }
  });
  return params;
}

async function fetchRozetkaInbound(form, path, keys) {
  const params = queryFromForm(form, keys);
  return fetchRozetkaInboundParams(path, params);
}

async function fetchRozetkaInboundParams(path, params = new URLSearchParams()) {
  const response = await fetch(`${path}${params.toString() ? `?${params.toString()}` : ""}`, {
    headers: { Accept: "application/json" }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false || payload.ok === false) {
    const error = new Error(payload.error || payload?.errors?.message || `HTTP ${response.status}`);
    error.code = payload.code || payload?.errors?.code || response.status;
    error.details = payload;
    throw error;
  }
  return payload;
}

function rozetkaItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content?.items)) return payload.content.items;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function rozetkaOrders(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content?.orders)) return payload.content.orders;
  if (Array.isArray(payload?.orders)) return payload.orders;
  return [];
}

function rozetkaChats(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content?.chats)) return payload.content.chats;
  if (Array.isArray(payload?.content?.items)) return payload.content.items;
  if (Array.isArray(payload?.content?.messages)) return payload.content.messages;
  if (Array.isArray(payload?.chats)) return payload.chats;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function rozetkaCalls(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content?.calls)) return payload.content.calls;
  if (Array.isArray(payload?.content?.items)) return payload.content.items;
  if (Array.isArray(payload?.requests)) return payload.requests;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function textFromHtml(value) {
  const html = String(value || "").trim();
  if (!html) return "";
  const element = document.createElement("div");
  element.innerHTML = html;
  return (element.textContent || element.innerText || "").replace(/\s+/g, " ").trim();
}

function uniqueCode(prefix, value, field, existingId = "") {
  const raw = String(value || Date.now()).trim().replace(/\s+/g, "-");
  const base = `${prefix}-${raw}`.replace(/[^a-zA-Z0-9а-яА-ЯіїєґІЇЄҐ_-]/g, "-").replace(/-+/g, "-");
  let candidate = base;
  let index = 2;
  while (state.products.some((product) => product.id !== existingId && String(product[field] || "").toLowerCase() === candidate.toLowerCase())) {
    candidate = `${base}-${index}`;
    index += 1;
  }
  return candidate;
}

function rozetkaCategoryName(item) {
  return item?.price_category?.title_ua || item?.price_category?.title || item?.rz_category?.title_ua || item?.rz_category?.title || item?.catalog_category?.name_ua || item?.catalog_category?.name || "Rozetka";
}

function cleanImportedSourceBrand(value) {
  const brand = String(value || "").trim();
  const normalized = brand.toLowerCase();
  return ["1c", "1с", "1с", "onec", "rozetka", "розетка", "prom", "пром"].includes(normalized) ? "" : brand;
}

function cleanImportedProductName(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const cleaned = text
    .replace(/^(1c|1с|onec|rozetka|розетка|prom|пром)\s*[·:—\-–|/]*\s*/i, "")
    .trim();
  return cleaned || text;
}

function rozetkaBrandName(item) {
  return cleanImportedSourceBrand(item?.price_producer_name || item?.rz_producer?.title || item?.sync_source_producer?.title || "");
}

function compactRozetkaObject(source, fields) {
  const compact = {};
  fields.forEach((field) => {
    const value = source?.[field];
    if (value !== undefined && value !== null && value !== "") compact[field] = value;
  });
  return compact;
}

function compactRozetkaProductRaw(item) {
  return {
    ...compactRozetkaObject(item, [
      "id", "rz_item_id", "item_id", "price_offer_id", "market_id", "sync_source_id", "article",
      "name", "name_ua", "name_ru", "price", "price_old", "price_promo", "stock_quantity",
      "available", "available_title", "upload_status", "upload_status_title", "item_active",
      "rz_sell_status", "catalog_id", "duplicate_mark", "created_at", "updated_at", "url"
    ]),
    category: rozetkaCategoryName(item),
    producer: rozetkaBrandName(item),
    photos: [...new Set([...(Array.isArray(item?.photo) ? item.photo : []), ...(Array.isArray(item?.photo_preview) ? item.photo_preview : [item?.photo_preview])].filter(Boolean))].slice(0, 12)
  };
}

function compactRozetkaOrderRaw(order) {
  const purchases = Array.isArray(order?.purchases) ? order.purchases : Array.isArray(order?.items) ? order.items : [];
  return {
    ...compactRozetkaObject(order, [
      "id", "external_id", "created", "created_at", "updated_at", "status", "status_group",
      "amount", "amount_with_discount", "cost", "cost_with_discount", "user_title",
      "user_phone", "recipient_phone", "comment", "ttn", "delivery_service"
    ]),
    status_title: order?.status_data?.title || order?.status_title || "",
    user: order?.user ? compactRozetkaObject(order.user, ["id", "name", "title", "contact_fio", "phone", "email"]) : undefined,
    delivery: order?.delivery ? compactRozetkaObject(order.delivery, ["type", "name", "city", "warehouse", "recipient_name", "recipient_phone", "ttn", "email"]) : undefined,
    payment: order?.payment ? compactRozetkaObject(order.payment, ["type", "name", "status", "amount"]) : undefined,
    purchases: purchases.slice(0, 30).map((purchase) => compactRozetkaObject(purchase, [
      "id", "item_id", "name", "name_ua", "article", "price", "quantity", "count", "amount", "cost"
    ]))
  };
}

function findProductForRozetkaGoods(item) {
  const keys = [item?.rz_item_id, item?.item_id, item?.id, item?.price_offer_id, item?.article]
    .filter((value) => value !== undefined && value !== null && String(value).trim() !== "")
    .map((value) => String(value).trim().toLowerCase());
  return state.products.find((product) => {
    const rozetka = product.rozetka || {};
    const productKeys = [rozetka.rz_item_id, rozetka.item_id, rozetka.price_offer_id, rozetka.article, product.marketplaceSku, product.supplierSku, product.internalCode, product.barcode]
      .filter((value) => value !== undefined && value !== null && String(value).trim() !== "")
      .map((value) => String(value).trim().toLowerCase());
    return productKeys.some((key) => keys.includes(key));
  }) || null;
}

function upsertRozetkaProduct(item) {
  const existing = findProductForRozetkaGoods(item);
  const name = String(item.name_ua || item.name || item.name_ru || item.price_offer_id || item.article || "Rozetka товар").trim();
  const brand = rozetkaBrandName(item);
  const category = rozetkaCategoryName(item);
  const sku = String(item.article || item.price_offer_id || item.item_id || "").trim();
  const marketplaceSku = String(item.price_offer_id || item.article || item.item_id || "").trim();
  const itemId = item.item_id ?? item.id ?? null;
  const internalCode = existing?.internalCode || uniqueCode("RZ", itemId || item.price_offer_id || sku, "internalCode", existing?.id);
  const barcode = existing?.barcode || uniqueCode("RZB", item.article || item.price_offer_id || itemId, "barcode", existing?.id);
  const description = textFromHtml(item.description_ua || item.description || item.docket_ua || item.docket || "");
  const price = parseDecimal(item.price ?? item.price_promo ?? item.price_old ?? existing?.price, existing?.price || 0);
  const photoUrls = [...new Set([...(Array.isArray(item.photo) ? item.photo : []), ...(Array.isArray(item.photo_preview) ? item.photo_preview : [item.photo_preview])]
    .filter(Boolean)
    .map((url) => String(url).trim())
    .filter((url) => /^https?:\/\//i.test(url) && !url.includes("no-image")))];
  const photos = photoUrls.slice(0, MAX_PRODUCT_PHOTOS).map((url, index) => ({
    id: `rz-photo-${itemId || item.price_offer_id || item.article || Date.now()}-${index + 1}`,
    name: `${name} ${index + 1}`,
    type: "remote",
    url,
    dataUrl: rozetkaImageUrl(url)
  }));
  const rozetka = {
    ...(existing?.rozetka || {}),
    importedAt: currentTimestamp(),
    source: "goods/new",
    rz_item_id: item.rz_item_id ?? null,
      item_id: itemId,
      price_offer_id: item.price_offer_id ?? null,
      market_id: item.market_id ?? null,
      sync_source_id: item.sync_source_id ?? null,
      article: item.article ?? null,
    available: item.available ?? null,
    available_title: item.available_title ?? null,
    upload_status: item.upload_status ?? null,
    upload_status_title: item.upload_status_title ?? null,
    item_active: item.item_active ?? null,
    rz_sell_status: item.rz_sell_status ?? null,
      stock_quantity: item.stock_quantity ?? null,
      catalog_id: item.catalog_id ?? null,
      duplicate_mark: item.duplicate_mark ?? null,
    category,
    producer: brand,
    raw: compactRozetkaProductRaw(item)
  };

  if (existing) {
    existing.marketplaceSku = marketplaceSku || existing.marketplaceSku;
    existing.supplierSku = sku || existing.supplierSku;
    existing.currency = "UAH";
    applyImportedProductPrice(existing, price, "UAH");
    existing.category = existing.rozetka ? category : existing.category || category;
    existing.brand = existing.rozetka ? brand : cleanImportedSourceBrand(existing.brand || brand);
      existing.model = existing.rozetka ? name : existing.model || name;
      existing.description = description || existing.description || "";
      if (photos.length) existing.photos = photos;
      existing.rozetka = rozetka;
    return { product: existing, mode: "updated" };
  }

  const product = {
    id: uniqueId("p"),
    type: "regular",
    model: name,
    caliber: "",
    brand,
    erzRequired: false,
    barcode,
    supplierSku: sku || marketplaceSku || internalCode,
    internalCode,
    uktzed: "",
    price,
    currency: "UAH",
    cost: 0,
    costCurrency: "UAH",
    category,
    unit: "шт",
    minStock: 0,
    leadTimeDays: 14,
    catalogTag: "Rozetka",
    marketplaceSku,
    description,
    photos,
    rozetka
  };
  applyImportedProductPrice(product, price, "UAH");
  state.products.unshift(product);
  return { product, mode: "created" };
}

function upsertRozetkaPublication(item, product) {
  const sku = String(item.price_offer_id || item.article || item.item_id || item.id || product.marketplaceSku || product.supplierSku || "").trim();
  const externalId = String(item.rz_item_id || item.item_id || item.id || sku).trim();
  const existing = state.marketplacePublications.find((publication) => publication.marketplace === "Rozetka" && (
    (externalId && publication.externalId === externalId) || (sku && publication.sku === sku)
  ));
  const payload = {
    marketplace: "Rozetka",
    productId: product.id,
    sku,
    externalId,
    title: item.name_ua || item.name || product.model,
    price: parseDecimal(item.price ?? item.price_promo ?? item.price_old, product.price || 0),
    currency: "UAH",
    stockQty: Number(item.stock_quantity || 0),
    status: item.upload_status === 0 ? "needs_sync" : "published",
    photosStatus: Array.isArray(item.photo) && item.photo.length ? "ok" : "missing",
    lastSync: currentTimestamp(),
    manager: existing?.manager || state.currentManager,
    rozetka: product.rozetka
  };
  if (existing) {
    Object.assign(existing, payload, { id: existing.id });
    return "updated";
  }
  state.marketplacePublications.unshift({ id: uniqueId("pub"), ...payload });
  return "created";
}

function findProductForRozetkaPurchase(purchase) {
  const itemId = purchase?.item_id;
  const sku = purchase?.item?.price_offer_id || purchase?.price_offer_id || purchase?.article;
  return state.products.find((product) => {
    const rozetka = product.rozetka || {};
    return [rozetka.item_id, rozetka.price_offer_id, rozetka.article, product.marketplaceSku, product.supplierSku]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase())
      .some((value) => value === String(itemId || "").toLowerCase() || value === String(sku || "").toLowerCase());
  }) || null;
}

function productFromRozetkaPurchase(purchase) {
  const pseudoItem = {
    item_id: purchase?.item_id,
    price_offer_id: purchase?.item?.price_offer_id || purchase?.price_offer_id || purchase?.item_id,
    article: purchase?.item?.article || purchase?.article || purchase?.item_id,
    name: purchase?.item_name || purchase?.item?.name,
    name_ua: purchase?.item_name || purchase?.item?.name_ua,
    price: purchase?.price_with_discount || purchase?.price,
    stock_quantity: 0,
    available: 1,
    upload_status: null,
    rz_producer: purchase?.item?.rz_producer,
    price_producer_name: purchase?.item?.producer || purchase?.item?.price_producer_name,
    price_category: purchase?.item?.price_category,
    rz_category: purchase?.item?.rz_category,
    raw_purchase: purchase
  };
  return upsertRozetkaProduct(pseudoItem).product;
}

function rozetkaOrderBuyer(order) {
  const delivery = order.delivery || {};
  const nameFromValue = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
    return String(value.full_name || value.name || [value.last_name, value.first_name, value.second_name].filter(Boolean).join(" ") || "").replace(/\s+/g, " ").trim();
  };
  const name = nameFromValue(delivery.recipient_title)
    || [delivery.recipient_last_name, delivery.recipient_first_name, delivery.recipient_second_name].filter(Boolean).join(" ").replace(/\s+/g, " ").trim()
    || nameFromValue(order.recipient_title)
    || nameFromValue(order.user_title)
    || nameFromValue(order.user?.title)
    || nameFromValue(order.user?.contact_fio)
    || nameFromValue(order.user?.name)
    || "Покупець Rozetka";
  const city = delivery.city?.title || delivery.city_name || delivery.place || "";
  const address = [
    city,
    delivery.delivery_service_name || delivery.warehouse?.title || delivery.warehouse_name || "",
    delivery.place_street,
    delivery.place_house,
    delivery.place_flat ? `кв. ${delivery.place_flat}` : "",
    delivery.place_number
  ].filter(Boolean).join(", ");
  return {
    name,
    phone: delivery.recipient_phone || order.user_phone || order.recipient_phone || order.user?.phone || "",
    email: delivery.email || order.user?.email || "",
    edrpou: "",
    address
  };
}

function isRozetkaBuyerPlaceholder(name) {
  const normalized = String(name || "").trim().toLowerCase();
  return !normalized || normalized === "rozetka" || normalized === "розетка" || normalized === "покупець rozetka" || normalized === "покупець розетка";
}

function marketplaceOrderBuyer(order) {
  const current = order.buyer || {};
  if (order.marketplace !== "Rozetka" || !order.rozetka?.raw) return current;
  const fromRaw = rozetkaOrderBuyer(order.rozetka.raw);
  const buyer = {
    ...current,
    name: isRozetkaBuyerPlaceholder(current.name) ? fromRaw.name : current.name,
    phone: current.phone || fromRaw.phone,
    email: current.email || fromRaw.email,
    edrpou: current.edrpou || fromRaw.edrpou,
    address: current.address || fromRaw.address
  };
  order.buyer = buyer;
  return buyer;
}

function rozetkaOrderCrmStatus(order) {
  const statusText = String([
    order.status,
    order.status_name,
    order.status_title,
    order.status_data?.name,
    order.status_data?.title,
    order.last_update_status
  ].filter(Boolean).join(" ")).toLowerCase();
  if (/cancel|скас|отмен|declin|reject/.test(statusText)) return "cancelled";
  if (Number(order.status_group) === 2) return "delivered";
  if (order.ttn || order.delivery?.ttn || order.carrier?.carrier_track_num) return "shipped";
  if (rozetkaOrderPaymentStatus(order) === "paid") return "paid";
  if (/confirm|підтвер|подтверж|approved/.test(statusText)) return "confirmed_by_client";
  return "new_order";
}

function rozetkaOrderPaymentStatus(order) {
  const statusName = String(order.status_payment?.name || order.payment_status || "").toLowerCase();
  if (order.is_payed || ["paid", "payed", "success", "completed"].includes(statusName)) return "paid";
  if (["cancelled", "failed", "error"].includes(statusName)) return "failed";
  return statusName ? "pending" : "expected";
}

function upsertRozetkaOrder(order) {
  const purchases = Array.isArray(order.purchases) ? order.purchases : [];
  const firstPurchase = purchases[0] || {};
  const product = findProductForRozetkaPurchase(firstPurchase) || productFromRozetkaPurchase(firstPurchase);
  const qty = Number(order.total_quantity || firstPurchase.quantity || purchases.reduce((sum, purchase) => sum + Number(purchase.quantity || 0), 0) || 1);
  const price = parseDecimal(firstPurchase.price_with_discount ?? firstPurchase.price ?? (Number(order.amount || 0) / Math.max(qty, 1)), 0);
  const externalOrderId = `RZ-${order.id}`;
  const existing = state.marketplaceOrders.find((item) => item.marketplace === "Rozetka" && item.externalOrderId === externalOrderId);
  const paymentStatus = rozetkaOrderPaymentStatus(order);
  const deliveryTtn = order.ttn || order.delivery?.ttn || order.carrier?.carrier_track_num || "";
  const payload = normalizeMarketplaceOrder({
    id: existing?.id || uniqueId("mpo"),
    marketplace: "Rozetka",
    externalOrderId,
    date: String(order.created || today).slice(0, 10),
    status: rozetkaOrderCrmStatus(order),
    dates: {
      created: String(order.created || today).slice(0, 10),
      agreed: "",
      warehouse: "",
      delivery: deliveryTtn ? today : "",
      delivered: Number(order.status_group) === 2 ? today : "",
      paid: paymentStatus === "paid" ? today : ""
    },
    warehouseStatus: "new",
    manager: existing?.manager || state.currentManager,
    productId: product?.id || "",
    sku: String(firstPurchase.item_id || product?.marketplaceSku || product?.supplierSku || ""),
    qty,
    price,
    currency: "UAH",
    buyer: rozetkaOrderBuyer(order),
    delivery: {
      service: order.delivery_service?.title || order.delivery?.delivery_service?.title || order.delivery?.type?.title || "Rozetka Delivery",
      city: order.delivery?.city?.title || order.delivery?.city_name || "",
      warehouse: order.delivery?.warehouse?.title || order.delivery?.warehouse_name || order.delivery?.address || "",
      ttn: deliveryTtn,
      status: Number(order.status_group) === 2 ? "delivered" : deliveryTtn ? "sent_to_delivery" : "new",
      apiStatus: order.status_data?.title || order.last_update_status || "Отримано з Rozetka API",
      lastCheck: currentTimestamp()
    },
    payment: {
      method: order.payment_type_name || order.payment_type_title || order.payment?.type_name || "RozetkaPay",
      status: paymentStatus,
      amount: parseDecimal(order.cost_with_discount ?? order.amount_with_discount ?? order.cost ?? order.amount, price * qty),
      source: "Rozetka",
      apiStatus: order.status_payment?.title || order.payment_status || "Отримано з Rozetka API",
      lastCheck: currentTimestamp(),
      paidAt: paymentStatus === "paid" ? today : ""
    },
    clientId: existing?.clientId || "",
    invoiceId: existing?.invoiceId || "",
    rozetka: {
      importedAt: currentTimestamp(),
      id: order.id,
      status: order.status,
      status_group: order.status_group,
      status_title: order.status_data?.title || "",
      purchases,
      raw: compactRozetkaOrderRaw(order)
    }
  });

  if (existing) {
    Object.assign(existing, payload, { id: existing.id, clientId: existing.clientId || payload.clientId, invoiceId: existing.invoiceId || payload.invoiceId });
    runMarketplaceOrderAutomation(existing, { audit: false });
    return "updated";
  }
  state.marketplaceOrders.unshift(payload);
  runMarketplaceOrderAutomation(payload, { audit: true });
  return "created";
}

function findRozetkaMarketplaceOrder(apiOrderId = "") {
  const value = String(apiOrderId || "").trim();
  if (!value) return null;
  return state.marketplaceOrders.find((order) => (
    order.marketplace === "Rozetka"
    && (String(order.rozetka?.id || "") === value || order.externalOrderId === `RZ-${value}` || order.externalOrderId === value)
  )) || null;
}

function rozetkaChatMessageText(chat) {
  const messages = Array.isArray(chat.messages) ? chat.messages : Array.isArray(chat.chat_messages) ? chat.chat_messages : [];
  const lastMessage = messages[messages.length - 1] || chat.last_message || {};
  return textFromHtml(lastMessage.body || lastMessage.message || chat.message || chat.subject || "");
}

function mapRozetkaChatToCustomerQuestion(chat, source = "orders") {
  const orderApiId = chat.order_id || chat.order?.id || chat.order?.order_id || "";
  const order = findRozetkaMarketplaceOrder(orderApiId);
  const user = chat.user || {};
  const sourceType = source === "items" || (!orderApiId && Number(chat.type) !== 0) ? "seller_question" : "order_question";
  const externalId = `chat-${chat.id || chat.chat_id || chat.thread_id || orderApiId || Date.now()}`;
  return {
    id: externalId,
    marketplace: "Rozetka",
    sourceType,
    externalId,
    chatId: String(chat.id || chat.chat_id || ""),
    receiverId: String(chat.user_id || user.id || chat.receiver_id || ""),
    orderId: order?.id || "",
    externalOrderId: order?.externalOrderId || (orderApiId ? `RZ-${orderApiId}` : ""),
    buyerName: chat.user_fio || user.contact_fio || user.login || chat.user_login || "Покупець Rozetka",
    buyerContact: user.phone || user.email || chat.user_phone || chat.user_email || "",
    subject: chat.subject || marketplaceCustomerQuestionTypeLabel(sourceType),
    message: rozetkaChatMessageText(chat),
    status: chat.read_market ? "waiting_customer" : "new",
    priority: chat.star_market ? "high" : "normal",
    createdAt: chat.created || today,
    updatedAt: chat.updated || chat.created || currentTimestamp(),
    manager: order?.manager || state.currentManager,
    answer: "",
    answeredAt: "",
    apiStatus: "отримано з /messages/search",
    raw: chat
  };
}

function rozetkaCallStatus(statusId) {
  const map = {
    1: "new",
    2: "open",
    3: "waiting_marketplace",
    4: "answered",
    5: "closed"
  };
  return map[Number(statusId)] || "open";
}

function rozetkaCallTypeLabel(typeId) {
  const map = {
    1: "Звернення в Call Center",
    2: "Уточнення доставки",
    3: "Скасування замовлення",
    4: "Скарга",
    5: "Заявка на повернення",
    6: "Корекція інформації на сайті",
    7: "Питання оплати"
  };
  return map[Number(typeId)] || "Звернення в Call Center";
}

function mapRozetkaCallToCustomerQuestion(call) {
  const order = findRozetkaMarketplaceOrder(call.order_id);
  const sourceType = Number(call.request_type) === 5 ? "return_request" : "call_center";
  const externalId = `call-${call.id || call.request_id || Date.now()}`;
  return {
    id: externalId,
    marketplace: "Rozetka",
    sourceType,
    externalId,
    requestId: String(call.id || call.request_id || ""),
    orderId: order?.id || "",
    externalOrderId: order?.externalOrderId || (call.order_id ? `RZ-${call.order_id}` : ""),
    buyerName: call.user_login || "Покупець Rozetka",
    buyerContact: call.user_phone || "",
    subject: call.request_type_name || rozetkaCallTypeLabel(call.request_type),
    message: call.message || call.comment || "",
    status: rozetkaCallStatus(call.status_id),
    priority: Number(call.request_type) === 4 || Number(call.request_type) === 5 ? "high" : "normal",
    createdAt: call.date_call || call.created || today,
    updatedAt: call.updated || call.date_call || currentTimestamp(),
    manager: order?.manager || state.currentManager,
    answer: "",
    answeredAt: "",
    apiStatus: "отримано з /calls/search",
    raw: call
  };
}

function mapRozetkaCallToServiceThread(call) {
  const externalId = `support-${call.id || call.request_id || Date.now()}`;
  return {
    id: externalId,
    marketplace: "Rozetka",
    sourceType: "marketplace_thread",
    externalId,
    requestId: String(call.id || call.request_id || ""),
    subject: call.request_type_name || rozetkaCallTypeLabel(call.request_type),
    message: call.message || call.comment || "",
    status: rozetkaCallStatus(call.status_id),
    createdAt: call.date_call || call.created || today,
    updatedAt: call.updated || call.date_call || currentTimestamp(),
    manager: state.currentManager,
    answer: "",
    answeredAt: "",
    apiStatus: "отримано з /calls/search",
    raw: call
  };
}

function upsertMarketplaceCustomerQuestion(question) {
  state.marketplaceCustomerQuestions = Array.isArray(state.marketplaceCustomerQuestions) ? state.marketplaceCustomerQuestions : [];
  const existing = state.marketplaceCustomerQuestions.find((item) => (
    item.marketplace === question.marketplace
    && (item.externalId === question.externalId || (question.chatId && item.chatId === question.chatId) || (question.requestId && item.requestId === question.requestId))
  ));
  if (existing) {
    Object.assign(existing, question, {
      id: existing.id,
      answer: existing.answer || question.answer || "",
      answeredAt: existing.answeredAt || question.answeredAt || "",
      status: existing.answer ? existing.status : question.status
    });
    return "updated";
  }
  state.marketplaceCustomerQuestions.unshift(question);
  return "created";
}

function upsertMarketplaceServiceThread(thread) {
  state.marketplaceServiceThreads = Array.isArray(state.marketplaceServiceThreads) ? state.marketplaceServiceThreads : [];
  const existing = state.marketplaceServiceThreads.find((item) => (
    item.marketplace === thread.marketplace
    && (item.externalId === thread.externalId || (thread.requestId && item.requestId === thread.requestId))
  ));
  if (existing) {
    Object.assign(existing, thread, {
      id: existing.id,
      answer: existing.answer || thread.answer || "",
      answeredAt: existing.answeredAt || thread.answeredAt || "",
      status: existing.answer ? existing.status : thread.status
    });
    return "updated";
  }
  state.marketplaceServiceThreads.unshift(thread);
  return "created";
}

function markRozetkaIntegration(status = "ok") {
  const integration = state.integrations.find((item) => item.id === "rozetka");
  if (!integration) return;
  integration.status = status;
  integration.lastSync = currentTimestamp();
}

function finalizeRozetkaImport() {
  seedProductDictionaries(state);
  syncCatalogParametersFromProducts(state);
  markRozetkaIntegration("ok");
}

function renderRozetkaProgress() {
  const progress = rozetkaProgressState();
  const statusText = progress.status === "success" ? "OK" : progress.status === "error" ? `Помилка ${progress.code || ""}`.trim() : progress.status === "running" ? "В процесі" : "Очікує";
  const statusClass = progress.status === "success" ? "good" : progress.status === "error" ? "danger" : progress.status === "running" ? "warn" : "info";
  return `
    <div class="exchange-progress" data-rozetka-progress data-progress-status="${escapeHtml(progress.status || "idle")}">
      <div class="split">
        <h3>Шкала процесу Rozetka</h3>
        <span class="pill ${statusClass}" data-rozetka-progress-status>${escapeHtml(statusText)}</span>
      </div>
      <div class="progress-track" aria-label="Прогрес обміну Rozetka">
        <div class="progress-bar" data-rozetka-progress-bar style="width:${Number(progress.percent || 0)}%"></div>
      </div>
      <div class="row-main small muted">
        <span><strong data-rozetka-progress-percent>${Number(progress.percent || 0)}%</strong> · <span data-rozetka-progress-stage>${escapeHtml(progress.stage || "")}</span></span>
        <span data-rozetka-progress-updated>${escapeHtml(progress.updatedAt || "")}</span>
      </div>
      <p class="small ${progress.status === "error" ? "notice danger" : "muted"}" data-rozetka-progress-message>${escapeHtml(progress.message || "")}</p>
    </div>
  `;
}

function renderRozetkaInboundPanel({ embedded = false } = {}) {
  const settings = rozetkaInboundState();
  const tag = embedded ? "div" : "section";
  const title = embedded ? "<h3>Rozetka API → CRM</h3>" : "<h2>6.1 Обмін даними · Rozetka API → CRM</h2>";
  return `
    <${tag} class="${embedded ? "rozetka-embedded" : "panel section-band"} no-print" data-rozetka-inbound-panel>
      ${title}
      <div class="grid three">
        <article class="card metric info"><span>Режим</span><strong>GET + reply</strong><small>Обмін завантажує дані; відповідь покупцю відправляється тільки вручну з форми питання.</small></article>
        <article class="card metric good"><span>Товари / публікації</span><strong>${settings.lastGoodsCount || 0}</strong><small>${escapeHtml(settings.lastGoodsSync || "ще не запускали")}</small></article>
        <article class="card metric warn"><span>Замовлення</span><strong>${settings.lastOrdersCount || 0}</strong><small>${escapeHtml(settings.lastOrdersSync || "ще не запускали")}</small></article>
        <article class="card metric info"><span>Питання покупців</span><strong>${(state.marketplaceCustomerQuestions || []).length}</strong><small>${escapeHtml(settings.lastQuestionsSync || "ще не запускали")}</small></article>
        <article class="card metric warn"><span>Переписка ROZETKA</span><strong>${(state.marketplaceServiceThreads || []).length}</strong><small>${escapeHtml(settings.lastThreadsSync || "ще не запускали")}</small></article>
      </div>
      ${renderRozetkaProgress()}
      ${settings.lastError ? `<p class="notice danger small">${escapeHtml(settings.lastError)}</p>` : ""}
      <p class="notice small">Для реальних даних заповніть <code>ROZETKA_API_TOKEN</code> або <code>ROZETKA_USERNAME</code> + <code>ROZETKA_PASSWORD</code> у файлі <code>.env</code>. GET-завантаження йде в CRM; відповіді покупцю через Rozetka API доступні з форми питання, якщо увімкнути відправку API.</p>
      <div class="grid two">
          <form class="api-box" data-action="rozetka-import-goods">
            <h3>Товари та публікації Rozetka → CRM</h3>
            <div class="inline-actions api-actions-top">
              <button class="primary" type="submit">Отримати товари</button>
              <button class="secondary" type="button" data-rozetka-import-all-goods>Завантажити всі товари</button>
            </div>
            <div class="form-grid">
              <label class="field"><span>Джерело</span><select name="source">${option("items", "усі активні товари", true)}${option("goods_new", "нові товари / goods_new")}</select></label>
              <label class="field"><span>Активність</span><select name="item_active">${option("1", "активні", true)}${option("0", "неактивні")}</select></label>
              <label class="field"><span>ID джерела goods_new</span><input name="sync_source_id" inputmode="numeric" placeholder="28581"></label>
              <label class="field"><span>Пошук</span><input name="find_by_text" placeholder="назва або ID"></label>
              <label class="field"><span>Артикул</span><input name="article" placeholder="09497"></label>
              <label class="field"><span>Наявність</span><select name="available"><option value="">0 і 1</option>${option("1", "є в наявності")}${option("0", "немає")}</select></label>
              <label class="field"><span>Сторінка</span><input name="page" inputmode="numeric" value="1"></label>
              <label class="field"><span>Рядків goods_new</span><input name="pageSize" inputmode="numeric" value="100"></label>
              <label class="field"><span>Макс. сторінок</span><input name="maxPages" value="5" placeholder="5 або all"></label>
              <label class="field"><span>Сортування</span><select name="sort"><option value="">за замовчуванням</option>${ROZETKA_GOODS_SORT_OPTIONS.map((value) => option(value, value)).join("")}</select></label>
          </div>
          ${settings.lastGoodsSync ? `<p class="notice good small">Останнє завантаження товарів: ${escapeHtml(settings.lastGoodsSync)}, отримано ${settings.lastGoodsCount || 0} позицій.</p>` : ""}
          <p class="small muted">CRM створює або оновлює картку товару та публікацію Rozetka. Для стабільного тесту в браузері зберігається компактний Rozetka JSON.</p>
        </form>
        <form class="api-box" data-action="rozetka-import-orders">
          <h3>Замовлення Rozetka → CRM</h3>
          <div class="inline-actions api-actions-top">
            <button class="primary" type="submit">Отримати замовлення</button>
            <button class="secondary" type="button" data-rozetka-import-all-orders>Завантажити всі замовлення</button>
          </div>
          <div class="form-grid">
            <label class="field"><span>Дата від</span><input name="created_from" type="date"></label>
            <label class="field"><span>Дата до</span><input name="created_to" type="date"></label>
            <label class="field"><span>Тип</span><select name="types"><option value="1">всі</option>${option("2", "в обробці")}${option("4", "нові")}${option("5", "доставляються")}${option("3", "успішні")}${option("6", "неуспішні")}</select></label>
            <label class="field"><span>Статус</span><input name="status" inputmode="numeric" placeholder="ID статусу"></label>
            <label class="field"><span>Сторінка</span><input name="page" inputmode="numeric" value="1"></label>
            <label class="field"><span>Макс. сторінок</span><input name="maxPages" value="1" placeholder="1 або all"></label>
            <label class="field"><span>Деталей</span><input name="maxDetails" value="20" placeholder="20 або all"></label>
            <label class="field"><span>Сортування</span><select name="sort">${ROZETKA_ORDER_SORT_OPTIONS.map((value) => option(value, value, value === "-id")).join("")}</select></label>
          </div>
          ${settings.lastOrdersSync ? `<p class="notice good small">Останнє завантаження замовлень: ${escapeHtml(settings.lastOrdersSync)}, отримано ${settings.lastOrdersCount || 0} замовлень.</p>` : ""}
          <p class="small muted">Після /orders/search CRM підтягує /orders/{id}; для стабільного тесту в браузері зберігається компактний Rozetka JSON.</p>
        </form>
        <form class="api-box" data-action="rozetka-import-customer-questions">
          <h3>Переписка з клієнтами Rozetka → CRM</h3>
          <div class="inline-actions api-actions-top">
            <button class="primary" type="submit">Отримати питання</button>
          </div>
          <div class="form-grid">
            <label class="field"><span>Блок</span><select name="source">${option("orders", "Питання про замовлення", true)}${option("items", "Запитання продавцю")}${option("calls", "Call Center / повернення")}${option("all", "orders + items")}</select></label>
            <label class="field"><span>Прочитано</span><select name="read"><option value="">усі</option>${option("0", "непрочитані")}${option("1", "прочитані")}</select></label>
            <label class="field"><span>Пошук</span><input name="search" placeholder="номер, клієнт, товар"></label>
            <label class="field"><span>Сторінка</span><input name="page" inputmode="numeric" value="1"></label>
            <label class="field"><span>Макс. сторінок</span><input name="maxPages" value="3" placeholder="3 або all"></label>
            <label class="field"><span>Сортування</span><select name="sort">${option("-updated", "оновлені ↓", true)}${option("updated", "оновлені ↑")}${option("-created", "створені ↓")}${option("created", "створені ↑")}</select></label>
          </div>
          ${settings.lastQuestionsSync ? `<p class="notice good small">Останнє завантаження питань: ${escapeHtml(settings.lastQuestionsSync)}, отримано ${settings.lastQuestionsCount || 0} рядків.</p>` : ""}
          <p class="small muted">Питання про замовлення і запитання продавцю беруться з /messages/search; звернення Call Center і повернення — з /calls/search.</p>
        </form>
        <form class="api-box" data-action="rozetka-import-marketplace-threads">
          <h3>Переписка з ROZETKA → CRM</h3>
          <div class="inline-actions api-actions-top">
            <button class="primary" type="submit">Отримати звернення</button>
          </div>
          <div class="form-grid">
            <label class="field"><span>Одержувач</span><select name="sending_type"><option value="">усі</option>${option("2", "Support department")}${option("3", "Rozetka")}${option("4", "Quality Control")}</select></label>
            <label class="field"><span>Тип звернення</span><select name="request_type"><option value="">усі</option>${option("1", "Contact request")}${option("2", "Delivery clarification")}${option("3", "Order cancellation")}${option("4", "Complaint")}${option("5", "Return")}${option("6", "Site information correction")}${option("7", "Payment question")}</select></label>
            <label class="field"><span>Статус</span><select name="status_id"><option value="">усі</option>${option("1", "New")}${option("2", "Processing")}${option("3", "Unsolved")}${option("4", "Solved")}${option("5", "Closed")}</select></label>
            <label class="field"><span>Сторінка</span><input name="page" inputmode="numeric" value="1"></label>
            <label class="field"><span>Макс. сторінок</span><input name="maxPages" value="3" placeholder="3 або all"></label>
          </div>
          ${settings.lastThreadsSync ? `<p class="notice good small">Останнє завантаження переписки з ROZETKA: ${escapeHtml(settings.lastThreadsSync)}, отримано ${settings.lastThreadsCount || 0} рядків.</p>` : ""}
          <p class="small muted">Цей блок не змішується з питаннями покупців: тут контроль звернень до ROZETKA, Support та Quality Control.</p>
        </form>
      </div>
    </${tag}>
  `;
}

function renderRozetkaImportedOrderFilters(filter, resultCount, totalCount) {
  return `
    <form class="period-toolbar marketplace-filter no-print" data-rozetka-imported-order-filter>
      <label class="field compact"><span>Дата від</span><input name="from" type="date" value="${escapeHtml(filter.from)}"></label>
      <label class="field compact"><span>Дата до</span><input name="to" type="date" value="${escapeHtml(filter.to)}"></label>
      <label class="field compact"><span>Статус виконання</span><select name="status">
        <option value="">Всі статуси</option>
        ${marketplaceOrderStatusOptions(filter.status)}
      </select></label>
      <span class="pill info">${resultCount} із ${totalCount} замовлень</span>
      <button class="ghost" type="button" data-reset-rozetka-imported-order-filter>Скинути</button>
    </form>
  `;
}

function rozetkaImportedOrderSortHeader(key, label, filter) {
  const active = filter.sortBy === key;
  const direction = active && filter.sortDir === "asc" ? "ascending" : active ? "descending" : "none";
  const indicator = active ? (filter.sortDir === "asc" ? "↑" : "↓") : "↕";
  return `
    <th aria-sort="${direction}">
      <button class="table-sort ${active ? "active" : ""}" type="button" data-rozetka-order-sort="${escapeHtml(key)}">
        <span>${escapeHtml(label)}</span><span class="sort-indicator" aria-hidden="true">${indicator}</span>
      </button>
    </th>
  `;
}

function renderRozetkaImportedOrderRow(order) {
  const buyer = marketplaceOrderBuyer(order);
  const productLabel = rozetkaImportedOrderProductLabel(order);
  const orderTotal = rozetkaImportedOrderTotal(order);
  const canOrder = canManageMarketplaceOrder();
  return `
    <tr class="clickable-row" data-edit-marketplace-order="${escapeHtml(order.id)}" title="Клікніть, щоб змінити замовлення">
      <td><strong>${escapeHtml(order.date || "")}</strong><br><span class="small muted">${escapeHtml(order.rozetka?.importedAt || order.dates?.created || "")}</span></td>
      <td><strong>${escapeHtml(order.externalOrderId || "")}</strong><br><span class="small muted">${escapeHtml(String(order.rozetka?.id || ""))}</span></td>
      <td>${escapeHtml(buyer.name || "Покупець Rozetka")}<br><span class="small muted">${escapeHtml(buyer.phone || "-")}</span></td>
      <td>${escapeHtml(productLabel)}<br><span class="small muted">${escapeHtml(String(order.qty || 1))} од. · ${escapeHtml(order.sku || "")}</span></td>
      <td>${formatMoney(orderTotal, order.currency || "UAH")}</td>
      <td>${marketplaceDeliveryStatusPill(order.delivery?.status || "new")}<br><span class="small muted">${escapeHtml(order.delivery?.ttn || "ТТН немає")}</span></td>
      <td>${marketplacePaymentStatusPill(order.payment?.status || "expected")}<br><span class="small muted">${escapeHtml(order.payment?.apiStatus || "")}</span></td>
      <td>${marketplaceOrderStatusPill(order.status)}</td>
      <td class="row-actions no-print">
        ${renderOrderCommunicationButtons(order)}
        <button class="ghost" data-edit-marketplace-order="${escapeHtml(order.id)}" ${canEditMarketplaceOrder() ? "" : "disabled"}>Відкрити</button>
        <button class="ghost" data-create-client-from-order="${escapeHtml(order.id)}" ${canOrder ? "" : "disabled"}>Клієнт</button>
        <button class="secondary" data-invoice-marketplace-order="${escapeHtml(order.id)}" ${canOrder && order.status !== "new_order" && !order.invoiceId ? "" : "disabled"}>Накладна</button>
      </td>
    </tr>
  `;
}

function renderRozetkaImportedOrdersPanel() {
  const filter = rozetkaImportedOrderFilter();
  const orders = state.marketplaceOrders.filter((order) => order.marketplace === "Rozetka");
  const filteredOrders = sortRozetkaImportedOrders(
    orders.filter((order) => dateInOptionalPeriod(order.date, filter) && (!filter.status || order.status === filter.status)),
    filter
  );
  const emptyText = orders.length
    ? "Немає замовлень Rozetka за вибраними відборами."
    : "Натисніть “Отримати замовлення”, щоб імпортувати замовлення Rozetka.";
  return `
    <section class="panel section-band" id="rozetka-orders" data-rozetka-orders-list>
      <div class="split">
        <h2>Імпортовані замовлення Rozetka</h2>
        <span class="pill good">${orders.length} у CRM</span>
      </div>
      ${renderRozetkaImportedOrderFilters(filter, filteredOrders.length, orders.length)}
      <details class="order-dropdown" data-rozetka-imported-orders-dropdown ${filter.expanded ? "open" : ""}>
        <summary>
          <span>
            <strong>Список імпортованих замовлень</strong>
            <small>${filter.expanded ? "Натисніть, щоб згорнути список." : "Натисніть, щоб розгорнути список."}</small>
          </span>
          <span class="pill info">${filteredOrders.length} рядків</span>
        </summary>
        <div class="table-wrap">
          <table>
            <thead><tr>
              ${rozetkaImportedOrderSortHeader("date", "Дата", filter)}
              ${rozetkaImportedOrderSortHeader("externalOrderId", "ID Rozetka", filter)}
              ${rozetkaImportedOrderSortHeader("buyer", "Покупець", filter)}
              ${rozetkaImportedOrderSortHeader("product", "Товар", filter)}
              ${rozetkaImportedOrderSortHeader("total", "Сума", filter)}
              ${rozetkaImportedOrderSortHeader("delivery", "Доставка", filter)}
              ${rozetkaImportedOrderSortHeader("payment", "Оплата", filter)}
              ${rozetkaImportedOrderSortHeader("status", "Статус CRM", filter)}
              <th>Дії</th>
            </tr></thead>
            <tbody>
              ${filteredOrders.map(renderRozetkaImportedOrderRow).join("") || `<tr><td colspan="9" class="muted">${emptyText}</td></tr>`}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  `;
}

async function importRozetkaGoodsToCatalog(form) {
  const settings = rozetkaInboundState();
  const button = form.querySelector('button[type="submit"]');
  const previousText = button?.textContent || "";
  if (button) {
    button.disabled = true;
    button.textContent = "Отримання...";
  }
  try {
    setRozetkaProgress("running", 8, "Підготовка запиту товарів", "Формуємо параметри й фільтри для Rozetka.");
    const source = formData(form).source || "items";
    const endpoint = source === "goods_new" ? "/api/rozetka/goods/new/all" : "/api/rozetka/items/search/all";
    const fields = source === "goods_new"
      ? ["sync_source_id", "find_by_text", "article", "available", "page", "pageSize", "maxPages", "sort"]
      : ["item_active", "find_by_text", "article", "page", "maxPages", "sort"];
    setRozetkaProgress("running", 22, "Запит до Rozetka API", "Очікуємо відповідь від сервера.");
    const payload = await fetchRozetkaInbound(form, endpoint, fields);
    setRozetkaProgress("running", 52, "Отримано відповідь", "Розбираємо товари та публікації.");
    const items = rozetkaItems(payload);
    const totals = { created: 0, updated: 0, publicationsCreated: 0, publicationsUpdated: 0 };
    items.forEach((item) => {
      const result = upsertRozetkaProduct(item);
      totals[result.mode] += 1;
      const publicationMode = upsertRozetkaPublication(item, result.product);
      if (publicationMode === "created") totals.publicationsCreated += 1;
      if (publicationMode === "updated") totals.publicationsUpdated += 1;
    });
    setRozetkaProgress("running", 82, "Запис у CRM", `Оброблено ${items.length} позицій.`);
    finalizeRozetkaImport();
    settings.lastGoodsSync = currentTimestamp();
    settings.lastGoodsCount = items.length;
    settings.lastError = "";
    setRozetkaProgress("success", 100, "OK", `Успішно: створено ${totals.created}, оновлено ${totals.updated}, публікацій створено ${totals.publicationsCreated}, оновлено ${totals.publicationsUpdated}.`);
    addAudit(`Rozetka API: товари в каталог — створено ${totals.created}, оновлено ${totals.updated}, публікацій створено ${totals.publicationsCreated}, оновлено ${totals.publicationsUpdated}`, "system");
    render();
  } catch (error) {
    const code = rozetkaErrorCode(error);
    settings.lastError = `Товари: [${code}] ${error.message}`;
    setRozetkaProgress("error", 100, "Імпорт товарів провалився", error.message, code);
    markRozetkaIntegration("token_needed");
    addAudit(`Rozetka API: помилка імпорту товарів — ${error.message}`, "system");
    alert(`Rozetka товари: [${code}] ${error.message}`);
    render();
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = previousText;
    }
  }
}

async function importRozetkaOrdersToCrm(form) {
  const settings = rozetkaInboundState();
  const button = form.querySelector('button[type="submit"]');
  const previousText = button?.textContent || "";
  if (button) {
    button.disabled = true;
    button.textContent = "Отримання...";
  }
  try {
    setRozetkaProgress("running", 8, "Підготовка запиту замовлень", "Формуємо період, статуси та ліміти.");
    setRozetkaProgress("running", 24, "Запит до Rozetka API", "Отримуємо список замовлень і деталі.");
    const payload = await fetchRozetkaInbound(form, "/api/rozetka/orders/import", ["created_from", "created_to", "types", "status", "page", "maxPages", "maxDetails", "sort"]);
    setRozetkaProgress("running", 58, "Отримано відповідь", "Розбираємо замовлення та покупців.");
    const orders = rozetkaOrders(payload);
    const totals = orders.reduce((acc, order) => {
      const result = upsertRozetkaOrder(order);
      acc[result] = (acc[result] || 0) + 1;
      return acc;
    }, { created: 0, updated: 0 });
    setRozetkaProgress("running", 84, "Запис у CRM", `Оброблено ${orders.length} замовлень.`);
    finalizeRozetkaImport();
    settings.lastOrdersSync = currentTimestamp();
    settings.lastOrdersCount = orders.length;
    settings.lastError = "";
    state.rozetkaImportedOrderFilters = {
      ...rozetkaImportedOrderFilter(),
      expanded: true
    };
    setRozetkaProgress("success", 100, "OK", `Успішно: створено ${totals.created || 0}, оновлено ${totals.updated || 0} замовлень.`);
    addAudit(`Rozetka API: замовлення — створено ${totals.created || 0}, оновлено ${totals.updated || 0}`, "system");
    render();
    setTimeout(() => document.querySelector("[data-rozetka-orders-list]")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  } catch (error) {
    const code = rozetkaErrorCode(error);
    settings.lastError = `Замовлення: [${code}] ${error.message}`;
    setRozetkaProgress("error", 100, "Імпорт замовлень провалився", error.message, code);
    markRozetkaIntegration("token_needed");
    addAudit(`Rozetka API: помилка імпорту замовлень — ${error.message}`, "system");
    alert(`Rozetka замовлення: [${code}] ${error.message}`);
    render();
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = previousText;
    }
  }
}

async function importRozetkaCustomerQuestionsToCrm(form) {
  const settings = rozetkaInboundState();
  const data = formData(form);
  const source = data.source || "orders";
  const button = form.querySelector('button[type="submit"]');
  const previousText = button?.textContent || "";
  if (button) {
    button.disabled = true;
    button.textContent = "Отримання...";
  }
  try {
    setRozetkaProgress("running", 10, "Підготовка запиту переписки", "Формуємо блок клієнтських питань Rozetka.");
    let rows = [];
    if (source === "calls") {
      const params = queryFromForm(form, ["page", "maxPages"]);
      setRozetkaProgress("running", 35, "Запит /calls/search", "Отримуємо звернення Call Center та заявки на повернення.");
      const payload = await fetchRozetkaInboundParams("/api/rozetka/calls/import", params);
      rows = rozetkaCalls(payload).map(mapRozetkaCallToCustomerQuestion);
    } else {
      const params = queryFromForm(form, ["read", "search", "page", "maxPages", "sort"]);
      params.set("msgType", source === "all" ? "all" : source);
      setRozetkaProgress("running", 35, "Запит /messages/search", "Отримуємо питання про замовлення та запитання продавцю.");
      const payload = await fetchRozetkaInboundParams("/api/rozetka/messages/import", params);
      rows = rozetkaChats(payload).map((chat) => mapRozetkaChatToCustomerQuestion(chat, source === "all" ? "" : source));
    }
    setRozetkaProgress("running", 75, "Запис у CRM", `Оброблено ${rows.length} рядків переписки з клієнтами.`);
    const totals = rows.reduce((acc, row) => {
      const result = upsertMarketplaceCustomerQuestion(row);
      acc[result] = (acc[result] || 0) + 1;
      return acc;
    }, { created: 0, updated: 0 });
    finalizeRozetkaImport();
    settings.lastQuestionsSync = currentTimestamp();
    settings.lastQuestionsCount = rows.length;
    settings.lastError = "";
    setRozetkaProgress("success", 100, "OK", `Питання покупців: створено ${totals.created || 0}, оновлено ${totals.updated || 0}.`);
    addAudit(`Rozetka API: питання покупців — створено ${totals.created || 0}, оновлено ${totals.updated || 0}`, "system");
    state.currentView = "sales";
    state.currentSubViews = { ...(state.currentSubViews || {}), sales: "communication" };
    render();
  } catch (error) {
    const code = rozetkaErrorCode(error);
    settings.lastError = `Питання покупців: [${code}] ${error.message}`;
    setRozetkaProgress("error", 100, "Імпорт питань провалився", error.message, code);
    markRozetkaIntegration("token_needed");
    addAudit(`Rozetka API: помилка імпорту питань покупців — ${error.message}`, "system");
    alert(`Rozetka питання покупців: [${code}] ${error.message}`);
    render();
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = previousText;
    }
  }
}

async function importRozetkaMarketplaceThreadsToCrm(form) {
  const settings = rozetkaInboundState();
  const button = form.querySelector('button[type="submit"]');
  const previousText = button?.textContent || "";
  if (button) {
    button.disabled = true;
    button.textContent = "Отримання...";
  }
  try {
    setRozetkaProgress("running", 10, "Підготовка запиту ROZETKA", "Формуємо фільтри звернень до маркетплейсу.");
    setRozetkaProgress("running", 35, "Запит /calls/search", "Отримуємо звернення Support / ROZETKA / Quality Control.");
    const payload = await fetchRozetkaInbound(form, "/api/rozetka/calls/import", ["sending_type", "request_type", "status_id", "page", "maxPages"]);
    const rows = rozetkaCalls(payload).map(mapRozetkaCallToServiceThread);
    setRozetkaProgress("running", 75, "Запис у CRM", `Оброблено ${rows.length} звернень до маркетплейсу.`);
    const totals = rows.reduce((acc, row) => {
      const result = upsertMarketplaceServiceThread(row);
      acc[result] = (acc[result] || 0) + 1;
      return acc;
    }, { created: 0, updated: 0 });
    finalizeRozetkaImport();
    settings.lastThreadsSync = currentTimestamp();
    settings.lastThreadsCount = rows.length;
    settings.lastError = "";
    setRozetkaProgress("success", 100, "OK", `Переписка з ROZETKA: створено ${totals.created || 0}, оновлено ${totals.updated || 0}.`);
    addAudit(`Rozetka API: переписка з ROZETKA — створено ${totals.created || 0}, оновлено ${totals.updated || 0}`, "system");
    state.currentView = "sales";
    state.currentSubViews = { ...(state.currentSubViews || {}), sales: "communication" };
    render();
  } catch (error) {
    const code = rozetkaErrorCode(error);
    settings.lastError = `Переписка з ROZETKA: [${code}] ${error.message}`;
    setRozetkaProgress("error", 100, "Імпорт переписки з ROZETKA провалився", error.message, code);
    markRozetkaIntegration("token_needed");
    addAudit(`Rozetka API: помилка імпорту переписки з ROZETKA — ${error.message}`, "system");
    alert(`Rozetka переписка з ROZETKA: [${code}] ${error.message}`);
    render();
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = previousText;
    }
  }
}

function renderMarketplaceExchangePanel(names, firstOrderId) {
  return `
    <section class="panel section-band">
      <h2>Обмін даними</h2>
      <div class="stack">
        <div class="row-actions">
          ${names.map((name) => `<button class="secondary" data-export-marketplace="${escapeHtml(name)}">Експорт ${escapeHtml(name)}</button>`).join("")}
        </div>
        <div class="row-actions">
          <button class="ghost" data-sync-marketplace-stocks>Оновити залишки</button>
          <button class="ghost" data-sync-marketplace-prices>Оновити ціни по курсу</button>
          <button class="ghost" data-import-marketplace-orders>Імпорт demo замовлення</button>
        </div>
        <div class="api-box" data-marketplace-api-panel>
          <h3>API замовлень</h3>
          <label class="field full"><span>Замовлення для перевірки ТТН / оплати</span><select name="orderId">${marketplaceOrderOptions(firstOrderId)}</select></label>
          <div class="row-actions">
            <button class="ghost" data-track-selected-marketplace-delivery ${canTrackMarketplaceDelivery() && state.marketplaceOrders.length ? "" : "disabled"}>Перевірити ТТН через API</button>
            <button class="ghost" data-track-selected-marketplace-payment ${canTrackMarketplacePayment() && state.marketplaceOrders.length ? "" : "disabled"}>Підтягнути оплату через API</button>
          </div>
          <p class="small muted">API-дії працюють по вибраному замовленню: доставка перевіряється за ТТН, оплата підтверджується з маркетплейсу або поштового сервісу.</p>
        </div>
        <form class="form-grid" data-action="import-marketplace-catalog">
          <label class="field full"><span>Імпорт JSON з маркетплейсу</span><textarea name="payload" placeholder='{"publications":[{"marketplace":"Prom","sku":"...","productId":"p-200","price":5400}]}'></textarea></label>
          <button class="primary" type="submit">Імпортувати публікації</button>
        </form>
      </div>
    </section>
  `;
}

function renderMarketplacePublicationSearch(filter, resultCount, totalCount) {
  return `
    <div class="period-toolbar marketplace-filter no-print" data-marketplace-publication-filter>
      <label class="field wide"><span>Пошук у списку</span><input name="search" data-marketplace-publication-search value="${escapeHtml(filter.search)}" placeholder="слова з товару, SKU, ID, маркетплейсу, менеджера"></label>
      <span class="pill info" data-marketplace-publication-result-count>${resultCount} із ${totalCount} публікацій</span>
      <button class="ghost" type="button" data-reset-marketplace-publication-search ${filter.search ? "" : "disabled"}>Скинути</button>
    </div>
  `;
}

function renderMarketplacePublicationRow(publication, visible = true) {
  const product = byId(state.products, publication.productId);
  const crmQty = productAvailableQty(publication.productId);
  return `
    <tr class="clickable-row" data-marketplace-publication-row data-edit-publication="${escapeHtml(publication.id)}" data-publication-search-text="${escapeHtml(marketplacePublicationSearchText(publication))}" title="Клікніть, щоб змінити публікацію" ${visible ? "" : 'style="display: none;"'}>
      <td>${escapeHtml(publication.marketplace)}<br><span class="small muted">${escapeHtml(publication.lastSync || "не синхронізовано")}</span></td>
      <td><strong>${escapeHtml(publication.sku)}</strong><br><span class="small muted">${escapeHtml(publication.externalId || "без зовн. ID")}</span></td>
      <td>${escapeHtml(product ? `${product.brand} ${product.model}` : "Товар не знайдено")}<br><span class="small muted">${escapeHtml(publication.title)}</span></td>
      <td>${product?.photos?.length ? `<span class="pill good">${product.photos.length} фото</span>` : '<span class="pill warn">немає фото</span>'}</td>
      <td>${formatMoney(publication.price, publication.currency)}</td>
      <td>${crmQty} / ${escapeHtml(publication.stockQty)}</td>
      <td>${escapeHtml(publication.manager)}</td>
      <td>${statusPill(publication.status)}</td>
      <td class="row-actions no-print">
        <button class="ghost" data-edit-publication="${escapeHtml(publication.id)}" ${canEditMarketplacePublication() ? "" : "disabled"}>Редагувати</button>
        <button class="secondary" data-sync-publication="${escapeHtml(publication.id)}">Синхр.</button>
      </td>
    </tr>
  `;
}

function updateDropdownHint(details) {
  const hint = details?.querySelector("summary small");
  if (hint) hint.textContent = details.open ? "Натисніть, щоб згорнути список." : "Натисніть, щоб розгорнути список.";
}

function applyMarketplacePublicationSearch(root = document) {
  const input = root.querySelector("[data-marketplace-publication-search]");
  const details = root.querySelector("[data-marketplace-publications-dropdown]");
  if (!input || !details) return;
  const words = searchWords(input.value);
  const rows = Array.from(details.querySelectorAll("[data-marketplace-publication-row]"));
  let visibleCount = 0;
  rows.forEach((row) => {
    const haystack = row.dataset.publicationSearchText || "";
    const visible = words.every((word) => haystack.includes(word));
    row.style.display = visible ? "" : "none";
    if (visible) visibleCount += 1;
  });
  const emptyRow = details.querySelector("[data-marketplace-publication-empty]");
  if (emptyRow) emptyRow.style.display = visibleCount ? "none" : "";
  const resultCount = root.querySelector("[data-marketplace-publication-result-count]");
  if (resultCount) resultCount.textContent = `${visibleCount} із ${rows.length} публікацій`;
  const summaryCount = details.querySelector("[data-marketplace-publication-summary-count]");
  if (summaryCount) summaryCount.textContent = `${visibleCount} рядків`;
  const resetButton = root.querySelector("[data-reset-marketplace-publication-search]");
  if (resetButton) resetButton.disabled = !input.value.trim();
  if (words.length) details.open = true;
  updateDropdownHint(details);
}

function renderMarketplaces() {
  const docsPeriod = periodFilter("marketplaceDocs");
  const orderFilter = marketplaceOrderFilter();
  const publicationFilter = marketplacePublicationFilter();
  const names = marketplaceNames();
  const newOrders = state.marketplaceOrders.filter((order) => order.status === "new_order").length;
  const needsSync = state.marketplacePublications.filter((publication) => publication.status !== "published").length;
  const periodPublications = state.marketplacePublications.filter((publication) => dateInPeriod(String(publication.lastSync || today).slice(0, 10), docsPeriod));
  const publicationWords = searchWords(publicationFilter.search);
  const filteredPublications = periodPublications.filter((publication) => marketplacePublicationMatchesSearch(publication, publicationWords));
  const publicationEmptyText = periodPublications.length ? "Немає публікацій за введеними словами." : "Немає публікацій за вибраний період.";
  const filteredOrders = state.marketplaceOrders.filter((order) => marketplaceOrderMatchesFilter(order, orderFilter));
  const firstOrderId = state.marketplaceOrders[0]?.id || "";
  return `
    <section class="grid four section-band">
      <article class="card metric info"><span>Публікації</span><strong>${state.marketplacePublications.length}</strong><small>Окремі SKU, ціни, фото та статуси для кожного маркетплейсу.</small></article>
      <article class="card metric warn"><span>Потребують обміну</span><strong>${needsSync}</strong><small>Товари, ціни або залишки не синхронізовані.</small></article>
      <article class="card metric danger"><span>Нові замовлення</span><strong>${newOrders}</strong><small>Після імпорту менеджер отримує подію у журналі.</small></article>
      <article class="card metric good"><span>Канали</span><strong>${names.length}</strong><small>Rozetka, Prom, Epicentr, Allo.</small></article>
    </section>

    ${renderRozetkaImportedOrdersPanel()}

    <section class="panel section-band">
        <h2>Створити публікацію</h2>
        ${renderMarketplacePublicationCreateForm()}
    </section>

    <section class="panel section-band no-print">
      <h2>Період публікацій маркетплейсів</h2>
      ${renderPeriodPrintControls("marketplaceDocs", "Публікації маркетплейсів", docsPeriod, filteredPublications.length)}
    </section>

    <section class="panel section-band" data-print-area="marketplaceDocs" data-print-title="Маркетплейси · список публікацій">
      <h2>Список публікацій</h2>
      ${renderMarketplacePublicationSearch(publicationFilter, filteredPublications.length, periodPublications.length)}
      <details class="order-dropdown publication-dropdown" data-marketplace-publications-dropdown ${publicationFilter.expanded ? "open" : ""}>
        <summary>
          <span>
            <strong>Список публікацій маркетплейсів</strong>
            <small>${publicationFilter.expanded ? "Натисніть, щоб згорнути список." : "Натисніть, щоб розгорнути список."}</small>
          </span>
          <span class="pill info" data-marketplace-publication-summary-count>${filteredPublications.length} рядків</span>
        </summary>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Маркетплейс</th><th>SKU / зовн. ID</th><th>Товар</th><th>Фото</th><th>Ціна</th><th>Залишок CRM / канал</th><th>Менеджер</th><th>Статус</th><th>Дії</th></tr></thead>
            <tbody>
              ${periodPublications.map((publication) => renderMarketplacePublicationRow(publication, marketplacePublicationMatchesSearch(publication, publicationWords))).join("")}
              <tr data-marketplace-publication-empty ${filteredPublications.length ? 'style="display: none;"' : ""}><td colspan="9" class="muted">${publicationEmptyText}</td></tr>
            </tbody>
          </table>
        </div>
      </details>
    </section>

    <section class="panel section-band" data-print-area="marketplaceOrders" data-print-title="Маркетплейси · замовлення">
      <h2>Замовлення маркетплейсів</h2>
      <div class="status-legend no-print">
        ${salesFunnelRules().map((item) => `<span class="pill ${item.className}">${escapeHtml(item.label)}</span>`).join("")}
      </div>
      ${renderMarketplaceOrderFilters(names, orderFilter, filteredOrders.length)}
      <details class="order-dropdown" data-marketplace-orders-dropdown ${orderFilter.expanded ? "open" : ""}>
        <summary>
          <span>
            <strong>Список замовлень маркетплейсів</strong>
            <small>${orderFilter.expanded ? "Натисніть, щоб згорнути список." : "Натисніть, щоб розгорнути список."}</small>
          </span>
          <span class="pill info">${filteredOrders.length} рядків</span>
        </summary>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Дата</th><th>Маркетплейс</th><th>Замовлення</th><th>Покупець</th><th>Товар</th><th>Доставка / ТТН</th><th>Оплата</th><th>Менеджер</th><th>Статус</th><th>Дії</th></tr></thead>
            <tbody>
            ${filteredOrders.map((order) => {
              const product = byId(state.products, order.productId);
              const buyer = marketplaceOrderBuyer(order);
              const orderTotal = Number(order.qty || 1) * Number(order.price || 0);
              const canOrder = canManageMarketplaceOrder();
              const canStatus = canChangeMarketplaceOrderStatus();
              const canDelivery = canTrackMarketplaceDelivery();
              const canPayment = canTrackMarketplacePayment();
              const canSendWarehouse = canSendMarketplaceOrderToWarehouse();
              const canPicking = canConfirmMarketplacePicking();
              const canWarehouseHandover = canHandoverMarketplaceOrderToLogistics();
              const canLogisticsAccept = canAcceptMarketplaceOrderLogistics();
              const issues = marketplaceOrderMissingFields(order);
              const deliveryAction = marketplaceOrderDeliveryActionState(order);
              return `
                <tr class="clickable-row ${issues.length ? "row-has-issues" : ""}" data-edit-marketplace-order="${escapeHtml(order.id)}" title="Клікніть, щоб змінити замовлення">
                  <td${orderCellClass(issues, ["date", "date:created", "date:agreed", "date:delivery"])}>
                    <strong>${order.date}</strong>
                    <br><span class="small muted">створено: ${order.dates?.created || order.date}</span>
                    ${order.dates?.agreed ? `<br><span class="small muted">погоджено: ${order.dates.agreed}</span>` : ""}
                    ${order.dates?.delivery ? `<br><span class="small muted">доставка: ${order.dates.delivery}</span>` : ""}
                  </td>
                  <td${orderCellClass(issues, ["marketplace", "sku"])}><strong>${order.marketplace}</strong><br><span class="small muted">${order.sku || "SKU не внесено"}</span></td>
                  <td><strong>${order.externalOrderId}</strong><br><span class="small muted">${order.invoiceId ? `накладна ${order.invoiceId}` : "накладну ще не створено"}</span></td>
                  <td${orderCellClass(issues, ["buyerName", "buyerContact", "clientId"])}>${buyer.name || "покупець не внесений"}<br><span class="small muted">${buyer.phone || buyer.email || "контакт не внесено"} · ${order.clientId ? clientName(order.clientId) : "клієнт ще не створений"}</span></td>
                  <td${orderCellClass(issues, ["productId", "qty", "price", "currency"])}>${product ? `${product.brand} ${product.model}` : order.sku || "товар не знайдено"}<br><span class="small muted">${order.qty || "?"} од. × ${formatMoney(order.price, order.currency)}</span></td>
                  <td${orderCellClass(issues, ["deliveryService", "deliveryCity", "deliveryAddress", "deliveryTtn"])}>
                    ${marketplaceDeliveryStatusPill(order.delivery.status)}
                    <br><strong>${order.delivery.ttn || "ТТН не внесено"}</strong>
                    <br><span class="small muted">${order.delivery.service || "-"} · ${order.delivery.city || ""} ${order.delivery.warehouse || ""}</span>
                    <br><span class="small muted">${order.delivery.apiStatus || "API не перевірявся"}</span>
                  </td>
                  <td${orderCellClass(issues, ["paymentStatus", "paymentAmount", "paymentMethod", "paymentSource", "date:paid"])}>
                    ${marketplacePaymentStatusPill(order.payment.status)}
                    <br>${formatMoney(order.payment.amount || orderTotal, order.currency)}
                    <br><span class="small muted">${order.payment.source || order.payment.method || "-"}</span>
                    <br><span class="small muted">${order.payment.apiStatus || "API не перевірявся"}</span>
                  </td>
                  <td${orderCellClass(issues, ["manager"])}>${order.manager || "менеджер не призначений"}</td>
                  <td${orderCellClass(issues, ["workflowSla", "pendingAction"])}>${marketplaceOrderStatusPill(order.status)}${renderOrderIssueCompact(order)}${renderOrderProcessStrip(order)}</td>
                  <td class="row-actions no-print">
                    ${renderOrderCommunicationButtons(order)}
                    <button class="ghost" data-edit-marketplace-order="${order.id}" ${canEditMarketplaceOrder() ? "" : "disabled"}>Змінити</button>
                    <button class="ghost" data-notify-marketplace-order="${order.id}" ${canOrder ? "" : "disabled"}>Повідомити</button>
                    <button class="ghost" data-create-client-from-order="${order.id}" ${canOrder ? "" : "disabled"}>Клієнт</button>
                    <button class="${orderActionClass(order, "waitClient")}" data-marketplace-wait-client="${order.id}" ${canStatus && ["new_order", "in_progress", "waiting_client"].includes(order.status) ? "" : "disabled"}>Очікує клієнта</button>
                    <button class="${orderActionClass(order, "confirm")}" data-agree-marketplace-order="${order.id}" ${canStatus && ["new_order", "in_progress", "waiting_client"].includes(order.status) ? "" : "disabled"}>Підтверджено</button>
                    <button class="${orderActionClass(order, "waitPayment")}" data-marketplace-wait-payment="${order.id}" ${canStatus && order.payment?.status !== "paid" && ["confirmed_by_client", "upsell", "waiting_payment"].includes(order.status) ? "" : "disabled"}>Очікує оплату</button>
                    <button class="${orderActionClass(order, "warehouse")}" data-marketplace-to-warehouse="${order.id}" ${canSendWarehouse && deliveryAction.canWarehouse ? "" : "disabled"}>На відбірку</button>
                    <button class="secondary" data-invoice-marketplace-order="${order.id}" ${canOrder && order.status !== "new_order" && order.status !== "cancelled" && !order.invoiceId ? "" : "disabled"}>Накладна</button>
                    <button class="${orderActionClass(order, "picked")}" data-marketplace-picked="${order.id}" ${canPicking && deliveryAction.canPicked ? "" : "disabled"}>Відбірка ОК</button>
                    <button class="${orderActionClass(order, "handoverDelivery", "secondary")}" data-marketplace-handover-delivery="${order.id}" ${canWarehouseHandover && deliveryAction.canHandover ? "" : "disabled"}>Передати логісту</button>
                    <button class="${orderActionClass(order, "logisticsAccept", "secondary")}" data-marketplace-to-delivery="${order.id}" ${canLogisticsAccept && deliveryAction.canLogisticsAccept ? "" : "disabled"}>Логіст прийняв</button>
                    <button class="${orderActionClass(order, "trackDelivery", "secondary")}" data-track-marketplace-delivery="${order.id}" ${canDelivery && deliveryAction.canTrack ? "" : "disabled"}>Статус доставки</button>
                    <button class="secondary" data-marketplace-upsell="${order.id}" ${canOrder && ["confirmed_by_client", "upsell", "waiting_payment", "paid"].includes(order.status) ? "" : "disabled"}>Апсел</button>
                    <button class="${orderActionClass(order, "complete")}" data-marketplace-complete="${order.id}" ${canOrder && ["delivered", "completed"].includes(order.status) ? "" : "disabled"}>Завершено</button>
                    <button class="${orderActionClass(order, "followUp")}" data-marketplace-aftersale="${order.id}" ${canOrder && ["completed", "follow_up"].includes(order.status) ? "" : "disabled"}>Follow-up</button>
                    <button class="${orderActionClass(order, "repeat")}" data-marketplace-repeat-sale="${order.id}" ${canOrder && ["follow_up", "repeat_sale"].includes(order.status) ? "" : "disabled"}>Повтор</button>
                    <button class="danger" data-marketplace-cancel="${order.id}" ${canOrder && !MARKETPLACE_FINAL_STATUSES.includes(order.status) ? "" : "disabled"}>Скасовано</button>
                  </td>
                </tr>
              `;
            }).join("") || '<tr><td colspan="10" class="muted">Немає замовлень за вибраними відборами.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>
    ${renderMarketplaceExchangePanel(names, firstOrderId)}
  `;
}

function renderIntegrations() {
  const docsPeriod = periodFilter("integrationDocs");
  const accountingDocs = state.invoices.filter((invoice) => invoice.accounting && dateInPeriod(invoice.date, docsPeriod));
  return `
    <section class="grid three section-band">
      ${state.integrations.map((integration) => `
        <article class="card stack">
          <div class="split">
            <strong>${integration.name}</strong>
            ${statusPill(integration.status)}
          </div>
          <p class="small muted">${integration.scope}</p>
          <span class="small">Останній обмін: ${integration.lastSync}</span>
          <button class="secondary" data-sync="${integration.id}">Запустити обмін</button>
        </article>
      `).join("")}
    </section>

    <section class="panel section-band no-print">
      <h2>Період документів інтеграцій</h2>
      ${renderPeriodPrintControls("integrationDocs", "BAS/BAF документи", docsPeriod, accountingDocs.length)}
    </section>

    <section class="grid two">
      <div class="panel">
        <h2>Двосторонній API обмін</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Об'єкт</th><th>CRM → канал</th><th>Канал → CRM</th><th>Ключ синхронізації</th></tr></thead>
            <tbody>
              <tr><td>Товари</td><td>назва, опис, фото, характеристики, УКТЗЕД</td><td>помилки модерації, зовнішні ID</td><td>internalCode + marketplaceSku</td></tr>
              <tr><td>Замовлення</td><td>статус, ТТН, відміни</td><td>нові замовлення, клієнт, доставка</td><td>externalOrderId</td></tr>
              <tr><td>Залишки</td><td>доступна кількість без резервів</td><td>резерви каналів</td><td>productId + warehouseId</td></tr>
              <tr><td>Ціни</td><td>прайс, акції, валюта</td><td>помилки прийому</td><td>priceListId + productId</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="panel" data-print-area="integrationDocs" data-print-title="BAS/BAF документи">
        <h2>BAS/BAF документи</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Документ</th><th>Фірма</th><th>Сума</th><th>Статус</th></tr></thead>
            <tbody>
              ${accountingDocs.map((invoice) => `
                <tr>
                  <td>${invoice.id}</td>
                  <td>${firmName(invoice.firmId)}</td>
                  <td>${formatMoney(invoice.total, invoice.currency)}</td>
                  <td><span class="pill info">готовий до обміну</span></td>
                </tr>
              `).join("") || '<tr><td colspan="4" class="muted">Немає документів BAS/BAF за вибраний період.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

function renderRolesLegacy() {
  const canManage = isAdmin();
  const disabled = canManage ? "" : "disabled";
  return `
    <section class="grid two section-band">
      <div class="panel">
        <h2>Працівники та доступи</h2>
        <form class="form-grid" data-action="create-employee">
          <label class="field wide"><span>ПІБ</span><input name="name" required ${disabled}></label>
          <label class="field"><span>Роль</span><select name="roleName" ${disabled}>${state.roles.map((item) => option(item.name, item.name)).join("")}</select></label>
          <label class="field"><span>Відділ</span><input name="department" value="Продажі" ${disabled}></label>
          <label class="field"><span>Телефон</span><input name="phone" ${disabled}></label>
          <label class="field"><span>Email</span><input name="email" type="email" ${disabled}></label>
          <button class="primary" type="submit" ${disabled}>Додати працівника</button>
        </form>
        <p class="notice ${canManage ? "" : "warn"} small">${canManage ? "Поточний користувач має права адміністратора." : "Зміна ролей і внесення працівників доступні тільки адміністратору."}</p>
      </div>
      <div class="panel">
        <h2>Закриття дня</h2>
        <form class="form-grid" data-action="update-closed-day">
          <label class="field"><span>Дата блокування</span><input name="closedDay" type="date" value="${state.settings.closedDay}"></label>
          <button class="primary" type="submit" ${role().canEditClosedDay ? "" : "disabled"}>Оновити</button>
        </form>
        <p class="notice ${role().canEditClosedDay ? "" : "warn"} small">Поточна роль: ${state.currentRole}. ${role().canEditClosedDay ? "Може змінювати закриті дні." : "Не може змінювати документи до закритої дати."}</p>
      </div>
    </section>

    <section class="panel section-band">
      <h2>Працівники</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Працівник</th><th>Відділ</th><th>Контакти</th><th>Роль</th><th>Стан</th></tr></thead>
          <tbody>
            ${state.employees.map((employee) => `
              <tr>
                <td><strong>${employee.name}</strong>${employee.id === state.currentEmployeeId ? '<br><span class="pill info">активний користувач</span>' : ""}</td>
                <td>${employee.department || "-"}</td>
                <td>${employee.phone || "-"}<br><span class="small muted">${employee.email || "-"}</span></td>
                <td><select data-employee-role="${employee.id}" ${disabled}>${state.roles.map((item) => option(item.name, item.name, item.name === employee.roleName)).join("")}</select></td>
                <td>${employee.active ? '<span class="pill good">активний</span>' : '<span class="pill danger">вимкнено</span>'}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>

    <section class="grid two">
      <div class="panel">
        <h2>Матриця ролей</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Роль</th><th>Закритий день</th><th>Зброя</th><th>Ціни</th><th>BAS/BAF</th><th>Кредит</th><th>Працівники</th><th>Звіти</th><th>Налаштування</th></tr></thead>
            <tbody>
              ${state.roles.map((item) => `
                <tr>
                  <td><strong>${item.name}</strong></td>
                  <td>${boolPill(item.canEditClosedDay)}</td>
                  <td>${boolPill(item.canSellWeapon)}</td>
                  <td>${boolPill(item.canChangePrices)}</td>
                  <td>${boolPill(item.canExportAccounting)}</td>
                  <td>${boolPill(item.canApproveCredit)}</td>
                  <td>${boolPill(item.canManageUsers)}</td>
                  <td>${boolPill(item.canViewReports)}</td>
                  <td>${boolPill(item.canEditSettings)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
      <div class="panel">
        <h2>Заборони продажу зброї</h2>
        <p class="notice danger">Система не дозволяє продаж типу “Зброя” без серійного номера, дублювання серій, продаж неперевіреної ЄРЗ одиниці, або проведення без номера дозволу на покупку та дати видачі.</p>
        <p class="notice warn">Редагування ролей та створення працівників заблоковані для всіх ролей, крім адміністратора.</p>
      </div>
    </section>
  `;
}

function permissionCheckbox(roleItem, group, key, checked, disabled) {
  return `<input type="checkbox" data-role-permission="${escapeHtml(key)}" data-role-group="${escapeHtml(group)}" data-role-name="${escapeHtml(roleItem.name)}" ${checked ? "checked" : ""} ${disabled}>`;
}

function renderPermissionMatrix(title, group, definitions, disabled) {
  return `
    <div class="panel">
      <h2>${title}</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Роль</th>${definitions.map(([, label]) => `<th>${escapeHtml(label)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${state.roles.map((roleItem) => `
              <tr>
                <td><strong>${escapeHtml(roleItem.name)}</strong></td>
                ${definitions.map(([key]) => {
                  const checked = group === "basic" ? roleItem[key] === true : roleItem.access?.[group]?.[key] !== false;
                  return `<td>${permissionCheckbox(roleItem, group, key, checked, disabled)}</td>`;
                }).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderRoles() {
  const canManage = isAdmin();
  const disabled = canManage ? "" : "disabled";
  return `
    <section class="grid two section-band">
      <div class="panel">
        <h2>Додати працівника</h2>
        <form class="form-grid" data-action="create-employee">
          <label class="field wide"><span>ПІБ</span><input name="name" required ${disabled}></label>
          <label class="field"><span>Роль</span><select name="roleName" ${disabled}>${state.roles.map((item) => option(item.name, item.name)).join("")}</select></label>
          <label class="field"><span>Відділ</span><input name="department" value="Продажі" ${disabled}></label>
          <label class="field"><span>Телефон</span><input name="phone" ${disabled}></label>
          <label class="field"><span>Email</span><input name="email" type="email" ${disabled}></label>
          <label class="field"><span>Логін</span><input name="login" required ${disabled}></label>
          <label class="field"><span>Пароль</span><input name="password" type="text" required ${disabled}></label>
          <button class="primary" type="submit" ${disabled}>Додати працівника</button>
        </form>
        <p class="notice ${canManage ? "" : "warn"} small">${canManage ? "Адміністратор може створювати працівників, змінювати логіни, паролі та ролі." : "Працівників і ролі змінює тільки адміністратор."}</p>
      </div>
      <div class="panel">
        <h2>Закриття дня</h2>
        <form class="form-grid" data-action="update-closed-day">
          <label class="field"><span>Дата блокування</span><input name="closedDay" type="date" value="${state.settings.closedDay}"></label>
          <button class="primary" type="submit" ${role().canEditClosedDay ? "" : "disabled"}>Оновити</button>
        </form>
        <p class="notice ${role().canEditClosedDay ? "" : "warn"} small">Поточна роль: ${escapeHtml(state.currentRole)}.</p>
      </div>
    </section>

    <section class="panel section-band">
      <h2>Працівники</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ПІБ</th><th>Відділ</th><th>Контакти</th><th>Логін / пароль</th><th>Роль</th><th>Стан</th><th>Дії</th></tr></thead>
          <tbody>
            ${state.employees.map((employee) => `
              <tr data-employee-row="${escapeHtml(employee.id)}">
                <td><input name="name" value="${escapeHtml(employee.name)}" ${disabled}>${employee.id === state.currentEmployeeId ? '<br><span class="pill info">активний користувач</span>' : ""}</td>
                <td><input name="department" value="${escapeHtml(employee.department || "")}" ${disabled}></td>
                <td>
                  <input name="phone" value="${escapeHtml(employee.phone || "")}" placeholder="телефон" ${disabled}>
                  <input name="email" type="email" value="${escapeHtml(employee.email || "")}" placeholder="email" ${disabled}>
                </td>
                <td>
                  <input name="login" value="${escapeHtml(employee.login || "")}" ${disabled}>
                  <input name="password" type="text" value="${escapeHtml(employee.password || "")}" ${disabled}>
                </td>
                <td><select name="roleName" ${disabled}>${state.roles.map((item) => option(item.name, item.name, item.name === employee.roleName)).join("")}</select></td>
                <td><select name="active" ${disabled}>${option("true", "Активний", employee.active !== false)}${option("false", "Вимкнено", employee.active === false)}</select></td>
                <td><button class="secondary" type="button" data-save-employee="${escapeHtml(employee.id)}" ${disabled}>Зберегти</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>

    <section class="section-band">
      ${renderPermissionMatrix("Базові права ролей", "basic", ROLE_BASIC_PERMISSIONS, disabled)}
    </section>

    <section class="section-band">
      ${renderPermissionMatrix("Доступ до модулів", "views", NAV.map(([id, label]) => [id, label]), disabled)}
    </section>

    <section class="section-band">
      ${renderPermissionMatrix("Доступ до підменю", "subviews", ROLE_SUBVIEW_PERMISSIONS, disabled)}
    </section>

    <section class="section-band">
      ${renderPermissionMatrix("Дозволи на створення документів", "documents", ROLE_DOCUMENT_PERMISSIONS, disabled)}
    </section>

    <section class="section-band">
      ${renderPermissionMatrix("Дозволи на зміну проведених документів", "posted", ROLE_POSTED_DOCUMENT_PERMISSIONS, disabled)}
    </section>

    <section>
      ${renderPermissionMatrix("Дозволи на поля документів", "fields", ROLE_FIELD_PERMISSIONS, disabled)}
    </section>
  `;
}

function boolPill(value) {
  return value ? '<span class="pill good">так</span>' : '<span class="pill danger">ні</span>';
}

function formData(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  Object.keys(data).forEach((key) => {
    if (isDecimalFieldName(key)) data[key] = normalizeDecimalText(data[key]);
  });
  return data;
}

function loginUser(form) {
  const data = formData(form);
  const login = String(data.login || "").trim().toLowerCase();
  const password = String(data.password || "");
  const employee = state.employees.find((item) => item.active !== false && String(item.login || "").trim().toLowerCase() === login && String(item.password || "") === password);
  if (!employee) {
    alert("Невірний логін або пароль.");
    return;
  }
  activateEmployeeSession(employee);
  addAudit(`Вхід користувача ${employee.name}`, "system");
  render();
}

function loginClient(form) {
  const data = formData(form);
  const login = String(data.login || "").trim().toLowerCase();
  const password = String(data.password || "");
  const client = state.clients.find((item) => (
    item.type === "B2B"
    && item.cabinetEnabled !== false
    && String(item.portalLogin || "").trim().toLowerCase() === login
    && String(item.portalPassword || "") === password
  ));
  if (!client) {
    alert("Невірний логін або пароль B2B кабінету.");
    return;
  }
  activateClientSession(client);
  clientPortalDraft = { productId: "", firmId: "", barcode: "", qty: 1, serialIds: [], permitNumber: "", permitDate: "" };
  addAudit(`Вхід B2B клієнта ${client.name}`, "B2B кабінет");
  render();
}

function logoutUser() {
  const employee = currentEmployee();
  const client = authenticatedClient();
  appSessionStorage.removeItem("arms-crm-auth-employee-id");
  appSessionStorage.removeItem("arms-crm-auth-client-id");
  appSessionStorage.removeItem("arms-crm-auth-mode");
  authEmployeeId = "";
  authClientId = "";
  authMode = "";
  addAudit(`Вихід користувача ${client?.name || employee?.name || "-"}`, "system");
  render();
}

function addAudit(action, actor = state.currentManager) {
  state.audit.unshift({
    at: `${today} ${new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}`,
    actor,
    action
  });
}

function validateInvoice(data, product, serialIds = []) {
  const codeError = validateScannedCode(data.barcode, product);
  if (codeError) return codeError;
  const qty = Math.max(parseDecimal(data.qty || 1, 1), 1);
  if (product.type !== "weapon") {
    const available = stockQtyWhere(product.id, ownStockPredicate({ warehouseId: data.warehouseId, firmId: data.firmId }));
    if (available < qty) return stockContextMessage(product.id, qty, data.warehouseId, data.firmId);
    return "";
  }
  if (!role().canSellWeapon) return "Поточна роль не має права продавати зброю.";
  if (!serialIds.length) return "Для зброї потрібно вибрати серійні номери.";
  if (serialIds.length !== qty) return `Кількість (${qty}) має дорівнювати кількості вибраних серій (${serialIds.length}).`;
  const duplicates = duplicateValues(serialIds);
  if (duplicates.length) return "Одна й та сама серія вибрана більше одного разу.";
  if (!data.permitNumber || !data.permitDate) return "Потрібно внести номер дозволу на покупку та дату його видачі.";
  for (const serialId of serialIds) {
    const serial = byId(state.serials, serialId);
    if (!serial) return "Серійний номер не знайдено.";
    if (!serialMatchesProduct(serial, product)) return `Серія ${serial.serial} не належить вибраній моделі.`;
    if (serialIsSold(serial)) return `Серія ${serial.serial} вже продана. Повторний продаж заблоковано.`;
    if (!serialMatchesStockContext(serial, { warehouseId: data.warehouseId, firmId: data.firmId, clientId: "" })) return `Серія ${serial.serial} не належить вибраній фірмі/складу документа.`;
    if (serial.status !== "available" || !serialIsOnStock(serial)) return `Серія ${serial.serial} не є доступною на нашому складі.`;
    if (serial.actual === false) return `Серія ${serial.serial} неактуальна.`;
    if (serial.erzStatus !== "verified") return `ЄРЗ для серії ${serial.serial} не перевірено.`;
  }
  return "";
}

function roundMoney(amount) {
  return Math.round(Number(amount || 0) * 100) / 100;
}

function invoiceLineAmount(line, targetCurrency = line.currency || "UAH") {
  const amount = Number(line.qty || 0) * Number(line.price || 0) * (1 - Number(line.discount || 0) / 100);
  return convertMoneyWithRates(roundMoney(amount), line.currency || targetCurrency, targetCurrency, state.settings.rates);
}

function invoiceTotalsFromLines(lines = []) {
  const currencies = uniqueList(lines.map((line) => line.currency || "UAH"));
  const currency = currencies.length === 1 ? currencies[0] : state.settings.baseCurrency || "UAH";
  const total = roundMoney(lines.reduce((sum, line) => sum + invoiceLineAmount(line, currency), 0));
  return { currency, total };
}

function invoicePostStatus(invoice) {
  if (invoice.storageShipment && invoice.posted !== false) return "in_storage";
  if (Number(invoice.paid || 0) >= Number(invoice.total || 0)) return "paid";
  if (Number(invoice.paid || 0) > 0) return "partial";
  return invoice.posted === false ? "draft" : "payment_expected";
}

function isDebtInvoice(invoice = {}) {
  return invoice.status !== "cancelled" && invoice.storageShipment !== true;
}

function recalculateInvoiceTotals(invoice) {
  const totals = invoiceTotalsFromLines(invoice.lines || []);
  invoice.currency = totals.currency;
  invoice.total = totals.total;
  invoice.paid = Math.min(Number(invoice.paid || 0), invoice.total);
  invoice.pendingPaid = Math.min(Number(invoice.pendingPaid || 0), invoice.total);
  invoice.status = invoicePostStatus(invoice);
  return invoice;
}

function invoiceDraftKey(data = {}) {
  return [
    data.draftKind || (data.responsibleStorage ? "responsibleShipment" : "sales"),
    data.manager || "",
    data.clientId || "",
    data.date || today,
    data.firmId || "",
    data.warehouseId || data.sourceWarehouseId || ""
  ].join("|");
}

function findOpenInvoiceDraft(data = {}) {
  const key = invoiceDraftKey(data);
  return (state.invoices || []).find((invoice) => (
    invoice.status === "draft"
    && invoice.posted === false
    && (invoice.draftKey || invoiceDraftKey(invoice)) === key
  ));
}

function invoiceLineMergeKey(line) {
  if (line.serialId) return `serial|${line.serialId}`;
  return [
    "regular",
    line.productId || "",
    Number(line.price || 0),
    line.currency || "",
    Number(line.discount || 0),
    line.permitNumber || "",
    line.permitDate || ""
  ].join("|");
}

function appendLinesToInvoiceDraft(invoice, lines = []) {
  lines.forEach((line) => {
    const key = invoiceLineMergeKey(line);
    const existing = (invoice.lines || []).find((item) => invoiceLineMergeKey(item) === key);
    if (existing && !line.serialId) {
      existing.qty = roundMoney(Number(existing.qty || 0) + Number(line.qty || 0));
      return;
    }
    if (existing && line.serialId) return;
    invoice.lines.push(line);
  });
  invoice.updatedAt = currentTimestamp();
  return recalculateInvoiceTotals(invoice);
}

function invoiceLinesFromPrepared(preparedLines = []) {
  return preparedLines.flatMap((line) => {
    const product = line.product || byId(state.products, line.productId);
    if (!product) return [];
    if (product.type === "weapon") {
      return (line.serialIds || []).map((serialId) => {
        const serial = byId(state.serials, serialId);
        return {
          productId: product.id,
          qty: 1,
          price: Number(line.price || 0),
          currency: line.currency || product.currency || "UAH",
          discount: Number(line.discount || 0),
          serialId,
          previousSerialStatus: serial?.status || "available",
          permitNumber: line.permitNumber || "",
          permitDate: line.permitDate || "",
          sourceRequestId: line.requestId || ""
        };
      });
    }
    return [{
      productId: product.id,
      qty: Number(line.qty || 0),
      price: Number(line.price || 0),
      currency: line.currency || product.currency || "UAH",
      discount: Number(line.discount || 0),
      serialId: "",
      permitNumber: line.permitNumber || "",
      permitDate: line.permitDate || "",
      sourceRequestId: line.requestId || ""
    }];
  });
}

function invoiceDueDateFromData(data = {}) {
  const date = data.date || today;
  const paymentMode = String(data.paymentMode || "").toLowerCase();
  const days = data.paymentDays === "" || data.paymentDays === undefined
    ? data.dueDays
    : data.paymentDays;
  const isDeferred = paymentMode.includes("відтер") || (!paymentMode && Number(days || 0) > 0);
  return isDeferred ? addDays(date, days || state.settings.defaultDueDays) : date;
}

function createOrAppendInvoiceDraft(data = {}, preparedLines = [], options = {}) {
  const lines = invoiceLinesFromPrepared(preparedLines);
  if (!lines.length) throw new Error("У чернетці немає товарних рядків.");
  const base = {
    ...data,
    date: data.date || today,
    firmId: data.firmId || state.settings.firms[0]?.id || "vat",
    warehouseId: data.warehouseId || data.sourceWarehouseId || "wh-store",
    manager: data.manager || state.currentManager,
    draftKind: options.draftKind || data.draftKind || (data.responsibleStorage ? "responsibleShipment" : "sales"),
    responsibleStorage: options.responsibleStorage === true || data.responsibleStorage === true
  };
  const requestIds = uniqueList([...(options.requestIds || []), ...(data.requestIds || []), ...lines.map((line) => line.sourceRequestId).filter(Boolean)]);
  const existing = findOpenInvoiceDraft(base);
  if (existing) {
    appendLinesToInvoiceDraft(existing, lines);
    existing.requestIds = uniqueList([...(existing.requestIds || []), ...requestIds]);
    existing.delivery = data.delivery || existing.delivery;
    existing.deliveryPayer = data.deliveryPayer || existing.deliveryPayer;
    existing.ttn = data.ttn || existing.ttn;
    existing.comment = uniqueList([existing.comment || "", data.comment || ""].filter(Boolean)).join(" · ");
    existing.pendingPaid = Math.min(Number(existing.pendingPaid || 0) + Number(data.pendingPaid || data.paid || 0), existing.total);
    existing.dueDate = invoiceDueDateFromData({ ...data, date: existing.date });
    return { invoice: existing, created: false };
  }

  const totals = invoiceTotalsFromLines(lines);
  const invoice = {
    id: uniqueId("inv"),
    date: base.date,
    documentType: data.documentType || (base.responsibleStorage ? "Накладна відвантаження B2B" : "Видаткова накладна"),
    contract: data.contract || (base.responsibleStorage ? "B2B відповідальне зберігання" : ""),
    warehouseId: base.warehouseId,
    sourceWarehouseId: base.warehouseId,
    firmId: base.firmId,
    channel: data.channel || (base.responsibleStorage ? "B2B відповідальне зберігання" : ""),
    clientId: data.clientId || "",
    manager: base.manager,
    priceType: data.priceType || "",
    currency: totals.currency,
    total: totals.total,
    paid: 0,
    pendingPaid: Math.min(Number(data.pendingPaid || data.paid || 0), totals.total),
    discount: 0,
    dueDate: invoiceDueDateFromData(data),
    cashArticle: data.cashArticle || "",
    accounting: data.accounting === true || data.accounting === "true",
    locked: false,
    status: "draft",
    posted: false,
    draftKey: invoiceDraftKey(base),
    draftKind: base.draftKind,
    responsibleStorage: base.responsibleStorage,
    storageShipment: base.draftKind === "responsibleShipment",
    paymentDays: data.paymentDays === "" || data.paymentDays === undefined ? data.dueDays : data.paymentDays,
    requestIds,
    lines,
    delivery: data.delivery || "",
    deliveryPayer: data.deliveryPayer || "",
    ttn: data.ttn || "",
    comment: data.comment || "",
    createdAt: currentTimestamp()
  };
  state.invoices.unshift(invoice);
  return { invoice, created: true };
}

function validateInvoiceDraftPosting(invoice) {
  if (!invoice || invoice.posted !== false || invoice.status !== "draft") return "Це не відкрита чернетка.";
  const warehouseId = invoice.warehouseId || invoice.sourceWarehouseId || "";
  const firmId = invoice.firmId || "vat";
  const client = byId(state.clients, invoice.clientId);
  const groupedRegular = {};
  for (const line of invoice.lines || []) {
    const product = byId(state.products, line.productId);
    if (!product) return `Товар ${line.productId} не знайдено.`;
    if (product.type !== "weapon") {
      groupedRegular[product.id] = (groupedRegular[product.id] || 0) + Number(line.qty || 0);
      continue;
    }
    const serial = byId(state.serials, line.serialId);
    if (!serial) return `Серійний номер ${line.serialId} не знайдено.`;
    if (!serialMatchesProduct(serial, product)) return `Серія ${serial.serial} належить іншій моделі.`;
    if (invoiceUsesSerial(serial.id, { excludeInvoiceId: invoice.id })) return `Серія ${serial.serial} вже використана в проведеній накладній.`;
    if (!serialMatchesStockContext(serial, { warehouseId, firmId, clientId: "" })) return `Серія ${serial.serial} не належить вибраній фірмі/складу чернетки.`;
    if (serial.status !== "available") return `Серія ${serial.serial} не є вільною для відвантаження.`;
    if (serial.actual === false) return `Серія ${serial.serial} неактуальна.`;
    if (!invoice.responsibleStorage && (!line.permitNumber || !line.permitDate)) return `Для серії ${serial.serial} потрібні номер дозволу і дата видачі.`;
    if (!invoice.responsibleStorage && serial.erzStatus !== "verified") return `ЄРЗ для серії ${serial.serial} не перевірено.`;
  }
  for (const [productId, qty] of Object.entries(groupedRegular)) {
    const available = stockQtyWhere(productId, ownStockPredicate({ warehouseId, firmId }));
    if (available < qty) return `${stockContextMessage(productId, qty, warehouseId, firmId)} Доступно зараз: ${available} од.`;
  }
  if (invoice.responsibleStorage && (!client || client.type !== "B2B")) return "Для відвантаження на відповідальне зберігання потрібен B2B клієнт.";
  return "";
}

function postSalesInvoiceDraft(invoice) {
  (invoice.lines || []).forEach((line) => {
    const product = byId(state.products, line.productId);
    if (line.serialId) {
      const serial = byId(state.serials, line.serialId);
      serial.status = "sold";
      serial.clientId = invoice.clientId;
      serial.permitNumber = line.permitNumber;
      serial.permitDate = line.permitDate;
    } else if (product?.type !== "weapon") {
      decrementStock(line.productId, line.qty, invoice.warehouseId || invoice.sourceWarehouseId || "", invoice.firmId || "vat");
    }
  });
  const paid = Math.min(Number(invoice.pendingPaid || 0), Number(invoice.total || 0));
  if (paid > 0) {
    invoice.paid = paid;
    state.payments.unshift({
      id: uniqueId("pay"),
      invoiceId: invoice.id,
      date: today,
      amount: paid,
      currency: invoice.currency,
      rate: uahRate(invoice.currency),
      rateMode: "settings",
      paymentKind: "invoice",
      advance: false,
      clientId: invoice.clientId,
      firmId: invoice.firmId,
      source: "bank",
      terminalId: "",
      prro: false,
      method: "Оплата з чернетки",
      bankRef: "invoice-draft"
    });
  }
}

function postResponsibleInvoiceDraft(invoice) {
  const client = byId(state.clients, invoice.clientId);
  const groups = {};
  (invoice.lines || []).forEach((line) => {
    if (!groups[line.productId]) groups[line.productId] = [];
    groups[line.productId].push(line);
  });
  const docIds = [];
  Object.entries(groups).forEach(([productId, lines]) => {
    const product = byId(state.products, productId);
    if (!product) return;
    const qty = lines.reduce((sum, line) => sum + Number(line.qty || 0), 0);
    const serialIds = lines.map((line) => line.serialId).filter(Boolean);
    const firstLine = lines[0] || {};
    const doc = applyResponsibleShipmentDoc({
      date: invoice.date,
      firmId: invoice.firmId,
      sourceWarehouseId: invoice.warehouseId || invoice.sourceWarehouseId || "",
      qty,
      price: firstLine.price,
      currency: firstLine.currency || invoice.currency,
      paymentDays: invoice.paymentDays || state.settings.defaultDueDays,
      delivery: invoice.delivery,
      ttn: invoice.ttn,
      manager: invoice.manager,
      comment: invoice.comment,
      requestId: uniqueList(lines.map((line) => line.sourceRequestId).filter(Boolean)).join(", "),
      barcode: product.barcode || product.qrCode || ""
    }, product, client, serialIds);
    doc.sourceWarehouseId = invoice.warehouseId || invoice.sourceWarehouseId || "";
    doc.invoiceDraftId = invoice.id;
    docIds.push(doc.id);
  });
  invoice.responsibleDocIds = uniqueList([...(invoice.responsibleDocIds || []), ...docIds]);
}

function postInvoiceDraft(id) {
  const invoice = byId(state.invoices, id);
  if (!invoice) return alert("Чернетку накладної не знайдено.");
  if (invoice.posted !== false || invoice.status !== "draft") return alert("Цю накладну вже проведено або скасовано.");
  const documentKey = invoice.responsibleStorage ? "responsibleShipment" : "salesInvoice";
  if (!canCreateDocument(documentKey)) return alert("Поточна роль не має права проводити цей вид документа.");
  const validation = validateInvoiceDraftPosting(invoice);
  if (validation) return alert(validation);
  if (!confirm(`Провести чернетку ${invoice.id} на ${formatMoney(invoice.total, invoice.currency)}? Після проведення буде списано залишки/серійні номери.`)) return;
  try {
    if (invoice.responsibleStorage) postResponsibleInvoiceDraft(invoice);
    else postSalesInvoiceDraft(invoice);
    invoice.posted = true;
    invoice.postedAt = currentTimestamp();
    invoice.status = invoicePostStatus(invoice);
    invoice.draftKey = "";
    addAudit(`Проведено чернетку накладної ${invoice.id} на ${formatMoney(invoice.total, invoice.currency)}`);
    render();
  } catch (error) {
    alert(error.message);
  }
}

function createInvoice(form) {
  if (!canCreateDocument("salesInvoice")) return alert("Поточна роль не має права створювати накладні продажу.");
  const data = formData(form);
  data.firmId = data.firmId || state.settings.firms[0]?.id || "vat";
  data.warehouseId = data.warehouseId || "wh-store";
  const draftLines = collectSaleLinesFromForm(form);
  if (!draftLines.length) return alert("Додайте хоча б один товар у накладну.");
  const allSerialIds = draftLines.flatMap((line) => line.serialIds || []);
  const duplicatedSerials = duplicateValues(allSerialIds);
  if (duplicatedSerials.length) return alert("Одна й та сама серія вибрана більше одного разу в накладній.");

  const preparedLines = [];
  for (const [index, rawLine] of draftLines.entries()) {
    const product = byId(state.products, rawLine.productId);
    if (!product) return alert(`Рядок ${index + 1}: товар не знайдено.`);
    const serialIds = product.type === "weapon" ? rawLine.serialIds : [];
    const validation = validateInvoice({ ...rawLine, warehouseId: data.warehouseId, firmId: data.firmId }, product, serialIds);
    if (validation) {
      alert(`Рядок ${index + 1}: ${validation}`);
      return;
    }
    const qty = Math.max(parseDecimal(rawLine.qty || 1, 1), 1);
    const price = parseDecimal(rawLine.price || productSalePrice(product, data.priceType).amount, product.price || 0);
    const discount = Math.min(Math.max(parseDecimal(rawLine.discount || 0), 0), 100);
    const currency = rawLine.currency || productSalePrice(product, data.priceType).currency || product.currency || "UAH";
    const lineTotal = Math.round(qty * price * (1 - discount / 100) * 100) / 100;
    preparedLines.push({ ...rawLine, product, serialIds, qty, price, discount, currency, lineTotal });
  }

  const regularDemand = preparedLines
    .filter((line) => line.product.type !== "weapon")
    .reduce((acc, line) => {
      acc[line.product.id] = (acc[line.product.id] || 0) + Number(line.qty || 0);
      return acc;
    }, {});
  for (const [productId, qty] of Object.entries(regularDemand)) {
    const available = stockQtyWhere(productId, ownStockPredicate({ warehouseId: data.warehouseId, firmId: data.firmId }));
    if (available < qty) return alert(stockContextMessage(productId, qty, data.warehouseId, data.firmId));
  }

  const draft = createOrAppendInvoiceDraft({
    ...data,
    pendingPaid: parseDecimal(data.paid || 0),
    draftKind: "sales",
    responsibleStorage: false
  }, preparedLines, { draftKind: "sales" });
  addAudit(`${draft.created ? "Створено чернетку накладної" : "Додано рядки до чернетки накладної"} ${draft.invoice.id}: ${formatMoney(draft.invoice.total, draft.invoice.currency)} · ${firmName(draft.invoice.firmId)} · ${warehouseName(draft.invoice.warehouseId)}`);
  saleDraft = { clientId: data.clientId, priceType: data.priceType, lines: [defaultSaleLine(preparedLines[0]?.product.id)] };
  render();
  return;

  const uniqueCurrencies = uniqueList(preparedLines.map((line) => line.currency));
  const invoiceCurrency = uniqueCurrencies.length === 1 ? uniqueCurrencies[0] : state.settings.baseCurrency || "UAH";
  const total = Math.round(preparedLines.reduce((sum, line) => sum + convertMoneyWithRates(line.lineTotal, line.currency, invoiceCurrency, state.settings.rates), 0) * 100) / 100;
  const paid = Math.min(parseDecimal(data.paid || 0), total);
  const paymentMode = String(data.paymentMode || "");
  const isDeferred = paymentMode.toLowerCase().includes("відтер");
  const isCashPaid = paymentMode.toLowerCase().includes("оплачено");
  const invoice = {
    id: `inv-${String(Date.now()).slice(-8)}`,
    date: data.date || today,
    documentType: data.documentType,
    contract: data.contract,
    warehouseId: data.warehouseId,
    firmId: data.firmId,
    channel: data.channel,
    clientId: data.clientId,
    manager: data.manager || state.currentManager,
    priceType: data.priceType,
    currency: invoiceCurrency,
    total,
    paid,
    discount: 0,
    dueDate: isDeferred ? addDays(data.date || today, data.dueDays || state.settings.defaultDueDays) : (data.date || today),
    cashArticle: data.cashArticle,
    accounting: data.accounting === "true",
    locked: false,
    status: paid >= total ? "paid" : paid > 0 ? "partial" : "draft",
    lines: preparedLines.flatMap((line) => line.product.type === "weapon"
      ? line.serialIds.map((serialId) => {
          const serial = byId(state.serials, serialId);
          return { productId: line.product.id, qty: 1, price: line.price, currency: line.currency, discount: line.discount, serialId, previousSerialStatus: serial?.status || "available", permitNumber: line.permitNumber || "", permitDate: line.permitDate || "" };
        })
      : [{ productId: line.product.id, qty: line.qty, price: line.price, currency: line.currency, discount: line.discount, serialId: "", permitNumber: "", permitDate: "" }]),
    delivery: data.delivery,
    deliveryPayer: data.deliveryPayer,
    ttn: data.ttn,
    comment: data.comment
  };

  preparedLines.forEach((line) => {
    if (line.product.type === "weapon") {
      line.serialIds.forEach((serialId) => {
        const serial = byId(state.serials, serialId);
        serial.status = "sold";
        serial.clientId = data.clientId;
        serial.permitNumber = line.permitNumber;
        serial.permitDate = line.permitDate;
      });
    } else {
      decrementStock(line.product.id, line.qty, data.warehouseId, data.firmId);
    }
  });

  if (paid > 0) {
    state.payments.unshift({
      id: `pay-${String(Date.now()).slice(-6)}`,
      invoiceId: invoice.id,
      date: today,
      amount: paid,
      currency: invoiceCurrency,
      rate: uahRate(invoiceCurrency),
      rateMode: "settings",
      paymentKind: "invoice",
      advance: false,
      clientId: invoice.clientId,
      firmId: invoice.firmId,
      source: isCashPaid ? "cash" : "bank",
      terminalId: "",
      prro: isCashPaid,
      method: isCashPaid ? "Каса" : "Безготівка",
      bankRef: "sale-form"
    });
  }

  state.invoices.unshift(invoice);
  addAudit(`Створено накладну ${invoice.id} на ${formatMoney(total, invoiceCurrency)}`);
  saleDraft = { clientId: data.clientId, priceType: data.priceType, lines: [defaultSaleLine(preparedLines[0]?.product.id)] };
  render();
}

function validateResponsibleShipment(data, product, client, serialIds) {
  if (!client || client.type !== "B2B") return "Оберіть B2B клієнта.";
  const codeError = validateScannedCode(data.barcode, product);
  if (codeError) return codeError;
  const qty = Number(data.qty || 0);
  const sourceWarehouseId = data.sourceWarehouseId || data.warehouseId || "";
  if (qty <= 0) return "Кількість передачі має бути більшою за нуль.";
  if (product.type !== "weapon") {
    if (stockQtyWhere(product.id, ownStockPredicate({ warehouseId: sourceWarehouseId, firmId: data.firmId })) < qty) return stockContextMessage(product.id, qty, sourceWarehouseId, data.firmId);
    return "";
  }
  if (serialIds.length !== qty) return `Для зброї кількість (${qty}) має дорівнювати кількості вибраних серій (${serialIds.length}).`;
  const duplicates = duplicateValues(serialIds);
  if (duplicates.length) return "Одна й та сама серія вибрана більше одного разу.";
  for (const serialId of serialIds) {
    const serial = byId(state.serials, serialId);
    if (!serial) return "Серійний номер не знайдено.";
    if (!serialMatchesProduct(serial, product)) return `Серія ${serial.serial} не належить вибраному товару.`;
    if (!serialMatchesStockContext(serial, { warehouseId: sourceWarehouseId, firmId: data.firmId, clientId: "" })) return `Серія ${serial.serial} не належить вибраній фірмі/складу для передачі.`;
    if (serial.clientId) return `Серія ${serial.serial} уже прив'язана до клієнта ${clientName(serial.clientId)}.`;
    if (serial.status !== "available") return `Серія ${serial.serial} не є вільною для передачі.`;
    if (serialIsSold(serial)) return `Серія ${serial.serial} уже продана.`;
    if (serial.actual === false) return `Серія ${serial.serial} неактуальна.`;
  }
  return "";
}

function applyResponsibleShipmentDoc(data, product, client, serialIds) {
  const qty = Number(data.qty || 0);
  const sourceWarehouseId = data.sourceWarehouseId || data.warehouseId || "";
  const warehouse = clientResponsibleWarehouse(client.id);
  const doc = {
    id: uniqueId("rs"),
    date: data.date || today,
    clientId: client.id,
    warehouseId: warehouse.id,
    sourceWarehouseId,
    firmId: data.firmId || "vat",
    productId: product.id,
    qty,
    serialIds,
    manager: data.manager || state.currentManager,
    paymentDays: Number(data.paymentDays || state.settings.defaultDueDays),
    price: data.price === "" || data.price === undefined ? "" : parseDecimal(data.price, 0),
    currency: data.currency || client.currency || product.currency || "UAH",
    delivery: data.delivery || "",
    ttn: data.ttn || "",
    requestId: data.requestId || "",
    status: "in_storage",
    ownership: "ours_until_client_sale",
    barcode: data.barcode || product.barcode || product.qrCode || "",
    soldQty: 0,
    invoiceIds: [],
    comment: data.comment || ""
  };

  if (product.type === "weapon") {
    serialIds.forEach((serialId) => {
      const serial = byId(state.serials, serialId);
      serial.status = "responsible_storage";
      serial.clientId = client.id;
      serial.warehouseId = warehouse.id;
      serial.responsibleStorageDocId = doc.id;
    });
  } else {
    decrementStockWhere(product.id, qty, ownStockPredicate({ warehouseId: sourceWarehouseId, firmId: data.firmId }), stockContextMessage(product.id, qty, sourceWarehouseId, data.firmId));
    incrementStock(product.id, warehouse.id, qty, client.id, data.firmId || "vat");
  }

  state.responsibleStorageDocs.unshift(doc);
  return doc;
}

function createResponsibleShipment(form) {
  if (!canCreateDocument("responsibleShipment")) return alert("Поточна роль не має права створювати передачу на відповідальне зберігання.");
  try {
    const data = formData(form);
    data.firmId = data.firmId || state.settings.firms[0]?.id || "vat";
    const client = byId(state.clients, data.clientId);
    const product = byId(state.products, data.productId);
    if (!product) throw new Error("Товар не знайдено.");
    const qty = Number(data.qty || 0);
    const serialIds = product.type === "weapon" ? selectedValues(form.elements.serialIds) : [];
    const validation = validateResponsibleShipment(data, product, client, serialIds);
    if (validation) throw new Error(validation);

    const doc = applyResponsibleShipmentDoc(data, product, client, serialIds);
    b2bDraft = { ...b2bDraft, saleClientId: client.id, saleProductId: product.id, shipmentProductId: product.id, shipmentFirmId: data.firmId || "vat", saleFirmId: data.firmId || b2bDraft.saleFirmId || "vat", shipmentBarcode: product.barcode || "", saleBarcode: product.barcode || "" };
    addAudit(`Передано на відповідальне зберігання ${doc.id}: ${productName(product.id)} · ${qty} од. · ${client.name}`);
    render();
  } catch (error) {
    alert(error.message);
  }
}

function createB2BShipmentRequest(form) {
  try {
    const data = formData(form);
    const portalClient = isClientAuthenticated() ? authenticatedClient() : null;
    if (!portalClient && !canCreateDocument("b2bShipmentRequest")) {
      return alert("Поточна роль не має права створювати заявки B2B на відвантаження.");
    }
    if (portalClient && data.clientId !== portalClient.id) {
      throw new Error("B2B клієнт може створювати заявку тільки від свого кабінету.");
    }
    const client = portalClient || byId(state.clients, data.clientId);
    const product = byId(state.products, data.productId);
    const qty = Number(data.qty || 0);
    if (!client || client.type !== "B2B") throw new Error("Оберіть B2B клієнта для заявки.");
    if (!product) throw new Error("Оберіть товар із каталогу CRM.");
    if (qty <= 0) throw new Error("Кількість у заявці має бути більшою за нуль.");

    const desiredDate = data.desiredDate || "";
    const draftStatus = portalClient ? "request_draft" : "request_new";
    const mergeStatuses = portalClient ? ["request_draft"] : ["request_new", "request_review"];
    const existingRequest = findOpenB2BShipmentRequest(client.id, product.id, desiredDate, mergeStatuses);
    if (existingRequest) {
      existingRequest.qty = Number(existingRequest.qty || 0) + qty;
      existingRequest.date = data.date || existingRequest.date || today;
      existingRequest.desiredDate = desiredDate;
      existingRequest.manager = data.manager || existingRequest.manager || client.manager || state.currentManager;
      existingRequest.validation = [];
      if (data.comment) {
        existingRequest.comment = existingRequest.comment
          ? uniqueList([existingRequest.comment, data.comment]).join(" · ")
          : data.comment;
      }
      addAudit(`B2B клієнт додав кількість до заявки ${existingRequest.id}: ${client.name} · ${productName(product.id)} · +${qty} од., разом ${existingRequest.qty} од.`, portalClient ? "B2B кабінет" : state.currentManager);
      render();
      return;
    }

    const request = {
      id: uniqueId("req"),
      date: data.date || today,
      desiredDate,
      clientId: client.id,
      productId: product.id,
      qty,
      status: draftStatus,
      manager: data.manager || client.manager || state.currentManager,
      comment: data.comment || "",
      firmId: "",
      warehouseId: "",
      serialIds: [],
      price: "",
      currency: "",
      paymentDays: "",
      delivery: "",
      ttn: "",
      responsibleDocId: "",
      validation: []
    };
    state.b2bShipmentRequests.unshift(request);
    addAudit(`${portalClient ? "B2B клієнт додав позицію в чернетку заявки" : "Створено заявку B2B на відвантаження"} ${request.id}: ${client.name} · ${productName(product.id)} · ${qty} од.`, portalClient ? "B2B кабінет" : state.currentManager);
    render();
  } catch (error) {
    alert(error.message);
  }
}

function collectB2BShipmentRequestForm(form) {
  const data = formData(form);
  const product = byId(state.products, data.productId);
  return {
    requestId: data.requestId || "",
    date: data.date || today,
    desiredDate: data.desiredDate || "",
    clientId: data.clientId || "",
    productId: data.productId || "",
    qty: Number(data.qty || 0),
    firmId: data.firmId || "",
    warehouseId: data.warehouseId || "",
    price: data.price === "" || data.price === undefined ? "" : parseDecimal(data.price, 0),
    currency: data.currency || "",
    paymentDays: data.paymentDays === "" || data.paymentDays === undefined ? "" : Number(data.paymentDays),
    delivery: data.delivery || "",
    ttn: data.ttn || "",
    manager: data.manager || state.currentManager,
    comment: data.comment || "",
    serialIds: product?.type === "weapon" ? selectedValues(form.elements.serialIds) : []
  };
}

function updateB2BShipmentRequestDraftFromForm(form) {
  const data = collectB2BShipmentRequestForm(form);
  const request = byId(state.b2bShipmentRequests, data.requestId);
  if (!request) return null;
  Object.assign(request, data, {
    id: request.id,
    status: request.status === "request_approved" ? "request_approved" : "request_review",
    validation: b2bShipmentRequestIssues(data, { requireManagerFields: true })
  });
  return request;
}

function openB2BShipmentRequest(id) {
  if (!canCreateDocument("b2bShipmentRequest") && !canCreateDocument("responsibleShipment")) {
    return alert("Поточна роль не має права готувати заявки B2B на відвантаження.");
  }
  const request = byId(state.b2bShipmentRequests || [], id);
  if (!request) return alert("Заявку B2B на відвантаження не знайдено.");
  const b2bClients = state.clients.filter((client) => client.type === "B2B");
  const client = byId(state.clients, request.clientId) || b2bClients[0];
  const product = byId(state.products, request.productId) || state.products[0];
  const firmId = request.firmId || state.settings.firms[0]?.id || "vat";
  const warehouseId = request.warehouseId || b2bDraft.shipmentWarehouseId || "wh-main";
  const priceInfo = product ? productSalePrice(product, client?.priceType || "b2b") : { amount: 0, currency: client?.currency || "UAH" };
  const price = request.price === "" || request.price === undefined ? priceInfo.amount : request.price;
  const currency = request.currency || priceInfo.currency || client?.currency || "UAH";
  const paymentDays = request.paymentDays === "" || request.paymentDays === undefined ? state.settings.defaultDueDays : request.paymentDays;
  const qty = Number(request.qty || 1);
  const selectedSerialIds = Array.isArray(request.serialIds) ? request.serialIds : [];
  const availableSerials = product?.type === "weapon"
    ? ownAvailableSerialsForProduct(product).filter((serial) => serialMatchesStockContext(serial, { warehouseId, firmId, clientId: "" }))
    : [];
  const selectedSerials = selectedSerialIds.map((serialId) => byId(state.serials, serialId)).filter(Boolean);
  const serialOptionsSource = [
    ...availableSerials,
    ...selectedSerials.filter((serial) => !availableSerials.some((item) => item.id === serial.id))
  ];
  const formSnapshot = {
    ...request,
    clientId: client?.id || "",
    productId: product?.id || "",
    firmId,
    warehouseId,
    qty,
    price,
    currency,
    paymentDays,
    serialIds: selectedSerialIds
  };
  const issues = b2bShipmentRequestIssues(formSnapshot, { requireManagerFields: true });
  document.querySelector(".modal-backdrop")?.remove();
  openModal(`Підготовка заявки ${request.id}`, `
    <form class="form-grid" data-action="approve-b2b-shipment-request">
      <input type="hidden" name="requestId" value="${escapeHtml(request.id)}">
      <label class="field"><span>Дата заявки</span><input name="date" type="date" value="${escapeHtml(request.date || today)}"></label>
      <label class="field"><span>Бажана дата відвантаження</span><input name="desiredDate" type="date" value="${escapeHtml(request.desiredDate || "")}"></label>
      <label class="field wide"><span>B2B клієнт</span><select name="clientId" data-b2b-request-rebuild>${b2bClients.map((item) => option(item.id, item.name, item.id === client?.id)).join("")}</select></label>
      <label class="field wide"><span>Товар</span><select name="productId" data-b2b-request-rebuild>${state.products.map((item) => option(item.id, `${item.type === "weapon" ? "Зброя" : "Товар"} · ${item.brand} ${item.model}`, item.id === product?.id)).join("")}</select></label>
      <label class="field"><span>Кількість</span><input name="qty" type="number" min="1" value="${qty}" data-b2b-request-rebuild></label>
      <label class="field"><span>Фірма-власник</span><select name="firmId" data-b2b-request-rebuild>${state.settings.firms.map((firm) => option(firm.id, firm.name, firm.id === firmId)).join("")}</select></label>
      <label class="field"><span>Склад відвантаження</span><select name="warehouseId" data-b2b-request-rebuild>${state.warehouses.filter((warehouse) => warehouse.kind !== "client_responsible").map((warehouse) => option(warehouse.id, warehouse.name, warehouse.id === warehouseId)).join("")}</select></label>
      ${renderB2BRequestAvailability(product, qty, firmId, warehouseId)}
      <label class="field"><span>Ціна відвантаження</span><input name="price" inputmode="decimal" value="${escapeHtml(price)}"></label>
      <label class="field"><span>Валюта</span><select name="currency">${Object.keys(state.settings.rates).map((code) => option(code, code, code === currency)).join("")}</select></label>
      <label class="field"><span>Термін оплати після продажу, днів</span><input name="paymentDays" type="number" min="0" value="${escapeHtml(paymentDays)}"></label>
      <label class="field"><span>Доставка</span><select name="delivery">${variantOptions("delivery", request.delivery || state.settings.delivery[0] || "")}</select></label>
      <label class="field"><span>ТТН</span><input name="ttn" value="${escapeHtml(request.ttn || "")}" placeholder="можна заповнити пізніше"></label>
      ${product?.type === "weapon" ? `
        <label class="field full"><span>Серійні номери для відвантаження</span><select class="serial-select" name="serialIds" multiple>
          ${serialOptionsSource.length
            ? serialOptionsSource.map((serial) => b2bSerialOption(serial, selectedSerialIds, "shipment")).join("")
            : '<option disabled>Немає вільних серій цієї моделі по вибраній фірмі.</option>'}
        </select></label>
      ` : '<p class="notice info small full">Для звичайного товару менеджер перевіряє залишок по вибраній фірмі. Серійні номери не потрібні.</p>'}
      <label class="field"><span>Менеджер</span><select name="manager">${employeeOptions(request.manager || client?.manager || state.currentManager)}</select></label>
      <label class="field full"><span>Коментар</span><textarea name="comment">${escapeHtml(request.comment || "")}</textarea></label>
      <div class="full">${b2bShipmentRequestIssueHtml(issues)}</div>
      <button class="primary" type="submit">Створити накладну відвантаження</button>
    </form>
  `);
}

function approveB2BShipmentRequest(form) {
  if (!canCreateDocument("b2bShipmentRequest") || !canCreateDocument("responsibleShipment")) {
    return alert("Поточна роль не має права підтверджувати B2B заявки та створювати відвантаження.");
  }
  try {
    const request = updateB2BShipmentRequestDraftFromForm(form);
    if (!request) throw new Error("Заявку B2B на відвантаження не знайдено.");
    const client = byId(state.clients, request.clientId);
    const product = byId(state.products, request.productId);
    const issues = b2bShipmentRequestIssues(request, { requireManagerFields: true });
    if (issues.length) {
      request.status = "request_review";
      request.validation = issues;
      openB2BShipmentRequest(request.id);
      return;
    }
    const qty = Number(request.qty || 0);
    const price = parseDecimal(request.price, productSalePrice(product, client.priceType || "b2b").amount);
    const currency = request.currency || productSalePrice(product, client.priceType || "b2b").currency || client.currency || product.currency || "UAH";
    const draft = createOrAppendInvoiceDraft({
      date: today,
      documentType: "Накладна відвантаження B2B",
      contract: "B2B відповідальне зберігання",
      warehouseId: request.warehouseId || "wh-main",
      firmId: request.firmId || state.settings.firms[0]?.id || "vat",
      channel: "B2B відповідальне зберігання",
      clientId: client.id,
      manager: request.manager || client.manager || state.currentManager,
      priceType: client.priceType || "b2b",
      paymentMode: "Відтермінування",
      paymentDays: request.paymentDays || state.settings.defaultDueDays,
      cashArticle: "Продаж товарів",
      accounting: true,
      responsibleStorage: true,
      draftKind: "responsibleShipment",
      delivery: request.delivery || "Склад клієнта",
      deliveryPayer: "Клієнт",
      ttn: request.ttn || "",
      comment: request.comment || "",
      requestIds: [request.id]
    }, [{
      product,
      productId: product.id,
      qty,
      price,
      discount: 0,
      currency,
      serialIds: product.type === "weapon" ? request.serialIds || [] : [],
      requestId: request.id
    }], { draftKind: "responsibleShipment", responsibleStorage: true, requestIds: [request.id] });
    request.status = "request_approved";
    request.responsibleDocId = draft.invoice.id;
    request.invoiceDraftId = draft.invoice.id;
    request.validation = [];
    b2bDraft = { ...b2bDraft, saleClientId: client.id, saleProductId: product.id, shipmentProductId: product.id, shipmentFirmId: request.firmId || "vat", shipmentWarehouseId: request.warehouseId || "wh-main", saleFirmId: request.firmId || b2bDraft.saleFirmId || "vat", shipmentBarcode: product.barcode || "", saleBarcode: product.barcode || "" };
    addAudit(`${draft.created ? "Створено чернетку відвантаження" : "Додано заявку до чернетки відвантаження"} ${draft.invoice.id} з B2B заявки ${request.id}: ${client.name} · ${productName(product.id)} · ${request.qty} од. · ${firmName(draft.invoice.firmId)} · ${warehouseName(draft.invoice.warehouseId)}`);
    document.querySelector(".modal-backdrop")?.remove();
    render();
  } catch (error) {
    alert(error.message);
  }
}

function rejectB2BShipmentRequest(id) {
  if (!canCreateDocument("b2bShipmentRequest")) return alert("Поточна роль не має права змінювати заявки B2B.");
  const request = byId(state.b2bShipmentRequests || [], id);
  if (!request) return;
  request.status = "request_rejected";
  request.validation = [];
  addAudit(`Заявку B2B ${request.id} відхилено`, state.currentManager);
  render();
}

function syncClientB2BCartUi(clientId) {
  const client = byId(state.clients, clientId);
  if (!client) return;
  const drafts = (state.b2bShipmentRequests || []).filter((request) => (
    request.clientId === client.id
    && request.status === "request_draft"
    && Number(request.qty || 0) > 0
  ));
  drafts.forEach((request) => {
    const lineTotal = b2bShipmentRequestLineTotal(request, client);
    const lineNode = $(`[data-client-request-line-total="${CSS.escape(request.id)}"]`);
    if (lineNode) lineNode.textContent = formatMoney(lineTotal.amount, lineTotal.currency);
  });
  const totals = b2bShipmentRequestTotals(drafts, client);
  const totalText = formatCurrencyTotals(totals, client.currency || "UAH");
  const qty = drafts.reduce((sum, request) => sum + Number(request.qty || 0), 0);
  $$(`[data-client-request-total="${CSS.escape(client.id)}"]`).forEach((node) => {
    node.textContent = totalText;
  });
  $$(`[data-floating-cart-total="${CSS.escape(client.id)}"]`).forEach((node) => {
    node.textContent = totalText;
  });
  $$(`[data-floating-cart-qty="${CSS.escape(client.id)}"]`).forEach((node) => {
    node.textContent = `${qty} од.`;
  });
}

function updateClientB2BShipmentRequestQty(id, rawQty, options = {}) {
  const request = byId(state.b2bShipmentRequests || [], id);
  if (!request) return alert("Заявку B2B не знайдено.");
  if (!canManageB2BClientRequest(request)) return alert("Цю заявку вже не можна змінювати.");
  const normalized = normalizeDecimalText(rawQty);
  if (!normalized) return alert("Вкажіть кількість.");
  const qty = parseDecimal(normalized, 0);
  if (qty <= 0) {
    cancelClientB2BShipmentRequest(id, true, { zeroQty: true });
    return;
  }
  request.qty = qty;
  request.status = request.status === "request_draft" ? "request_draft" : request.status === "request_review" ? "request_review" : "request_new";
  request.validation = [];
  syncClientB2BCartUi(request.clientId);
  if (options.silent) return true;
  addAudit(`Змінено кількість у заявці B2B ${request.id}: ${productName(request.productId)} · ${qty} од.`, isClientAuthenticated() ? "B2B кабінет" : state.currentManager);
  render();
  return true;
}

function cancelClientB2BShipmentRequest(id, ask = true, options = {}) {
  const request = byId(state.b2bShipmentRequests || [], id);
  if (!request) return false;
  if (!canManageB2BClientRequest(request)) {
    alert("Цю заявку вже не можна відмінити.");
    return false;
  }
  const message = options.zeroQty
    ? "Кількість 0 означає видалення позиції із заявки. Ви впевнені?"
    : "Відмінити цю позицію заявки?";
  if (ask && !confirm(message)) return false;
  request.qty = 0;
  request.status = "request_cancelled";
  request.validation = [];
  addAudit(`Позицію заявки B2B ${request.id} скасовано: ${productName(request.productId)}`, isClientAuthenticated() ? "B2B кабінет" : state.currentManager);
  render();
  return true;
}

function confirmClientB2BShipmentRequests(clientId) {
  const client = byId(state.clients, clientId);
  if (!client || client.type !== "B2B") return alert("B2B клієнта не знайдено.");
  if (isClientAuthenticated() && client.id !== authClientId) return alert("Можна підтвердити тільки заявку свого кабінету.");
  const drafts = (state.b2bShipmentRequests || []).filter((request) => (
    request.clientId === client.id
    && request.status === "request_draft"
    && Number(request.qty || 0) > 0
  ));
  if (!drafts.length) return alert("У чернетці немає позицій для підтвердження.");
  const totals = b2bShipmentRequestTotals(drafts, client);
  const linesText = drafts
    .map((request) => {
      const total = b2bShipmentRequestLineTotal(request, client);
      return `${productName(request.productId)} · ${request.qty} од. · ${formatMoney(total.amount, total.currency)}`;
    })
    .join("\n");
  const totalText = formatCurrencyTotals(totals, client.currency || "UAH");
  if (!confirm(`Підтвердити заявку на відвантаження?\n\n${linesText}\n\nРазом: ${totalText}\n\nПісля підтвердження заявка потрапить менеджеру B2B для опрацювання.`)) return;
  const batchId = uniqueId("b2b-request");
  const submittedAt = `${today} ${new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}`;
  drafts.forEach((request) => {
    request.status = "request_new";
    request.date = today;
    request.batchId = batchId;
    request.submittedAt = submittedAt;
    request.validation = [];
  });
  addAudit(`B2B клієнт підтвердив заявку ${batchId}: ${client.name} · ${drafts.length} позицій · ${totalText}`, isClientAuthenticated() ? "B2B кабінет" : state.currentManager);
  render();
}

function openClientRequestBatch(batchId, clientId = "") {
  const client = byId(state.clients, clientId) || authenticatedClient();
  if (!client) return alert("Клієнта для заявки не знайдено.");
  if (isClientAuthenticated() && client.id !== authClientId) return alert("B2B кабінет може переглядати тільки власні заявки.");
  const requests = b2bShipmentRequestRows(client.id)
    .filter((request) => b2bRequestGroupId(request) === batchId && request.status !== "request_draft");
  if (!requests.length) return alert("Заявку не знайдено або вона ще не підтверджена.");
  const totals = b2bShipmentRequestTotals(requests, client);
  const qty = requests.reduce((sum, request) => sum + Number(request.qty || 0), 0);
  const submittedAt = requests.find((request) => request.submittedAt)?.submittedAt || "";
  openModal(`Заявка ${batchId}`, `
    <section class="grid three compact-metrics">
      <article class="card metric info"><span>Дата</span><strong>${escapeHtml(requests[0]?.date || "-")}</strong><small>${escapeHtml(submittedAt || "час не зафіксовано")}</small></article>
      <article class="card metric good"><span>Кількість</span><strong>${qty}</strong><small>${requests.length} позицій</small></article>
      <article class="card metric warn"><span>Сума</span><strong>${formatCurrencyTotals(totals, client.currency || "UAH")}</strong><small>${escapeHtml(client.name)}</small></article>
    </section>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Товар</th><th>К-сть</th><th>Ціна од.</th><th>Сума</th><th>Бажана дата</th><th>Статус</th><th>Коментар</th></tr></thead>
        <tbody>
          ${requests.map((request) => {
            const price = b2bShipmentRequestPrice(request, client);
            const total = b2bShipmentRequestLineTotal(request, client);
            return `
              <tr>
                <td>${productName(request.productId)}</td>
                <td>${escapeHtml(request.qty)}</td>
                <td>${formatMoney(price.amount, price.currency)}</td>
                <td><strong>${formatMoney(total.amount, total.currency)}</strong></td>
                <td>${escapeHtml(request.desiredDate || "-")}</td>
                <td>${statusPill(request.status)}</td>
                <td>${escapeHtml(request.comment || "-")}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `);
}

function editResponsibleStorageDoc(id) {
  const doc = byId(state.responsibleStorageDocs, id);
  if (!doc) return;
  if (!canEditPostedDocument("responsibleShipment")) return alert("Поточна роль не має права змінювати проведене відповідальне зберігання.");
  openModal(`Зміна відповідального зберігання ${doc.id}`, `
    <form class="form-grid" data-action="update-responsible-doc">
      <input type="hidden" name="id" value="${escapeHtml(doc.id)}">
      <label class="field"><span>Дата</span><input name="date" type="date" value="${escapeHtml(doc.date || today)}"></label>
      <label class="field"><span>Менеджер</span><select name="manager">${employeeOptions(doc.manager)}</select></label>
      <label class="field"><span>Оплата після продажу, днів</span><input name="paymentDays" type="number" min="0" value="${doc.paymentDays || state.settings.defaultDueDays}"></label>
      <label class="field"><span>QR / штрихкод</span><input name="barcode" value="${escapeHtml(doc.barcode || "")}"></label>
      <label class="field full"><span>Коментар</span><textarea name="comment">${escapeHtml(doc.comment || "")}</textarea></label>
      <p class="notice warn small full">Клієнт, товар, кількість і серії в проведеній передачі змінюються тільки коригуючим документом, щоб залишки клієнта та серії не роз'їхались.</p>
      <button class="primary" type="submit">Зберегти зміни зберігання</button>
    </form>
  `);
}

function updateResponsibleStorageDoc(form) {
  const data = formData(form);
  const doc = byId(state.responsibleStorageDocs, data.id);
  if (!doc) return alert("Документ відповідального зберігання не знайдено.");
  if (!canEditPostedDocument("responsibleShipment")) return alert("Поточна роль не має права змінювати проведене відповідальне зберігання.");
  doc.date = data.date || doc.date;
  doc.manager = data.manager || doc.manager;
  doc.paymentDays = Number(data.paymentDays || state.settings.defaultDueDays);
  doc.barcode = data.barcode || doc.barcode || "";
  doc.comment = data.comment || "";
  doc.status = responsibleDocStatus(doc);
  addAudit(`Змінено проведене відповідальне зберігання ${doc.id}`);
  document.querySelector(".modal-backdrop")?.remove();
  render();
}

function validateB2BClientSale(data, product, client, serialIds, options = {}) {
  if (!client || client.type !== "B2B") return "Оберіть B2B клієнта.";
  const codeError = validateScannedCode(data.barcode, product);
  if (codeError) return codeError;
  const qty = Number(data.qty || 0);
  if (qty <= 0) return "Кількість продажу має бути більшою за нуль.";
  if (product.type !== "weapon") {
    if (stockQtyWhere(product.id, (row) => row.clientId === client.id && (row.firmId || "vat") === (data.firmId || "vat")) < qty) return "Недостатньо залишку на відповідальному зберіганні цього клієнта для вибраної фірми.";
    return "";
  }
  if (!options.clientPortal && !role().canSellWeapon) return "Поточна роль не має права підтверджувати продаж зброї.";
  if (!data.permitNumber || !data.permitDate) return "Для зброї потрібно внести номер дозволу покупця та дату його видачі.";
  if (serialIds.length !== qty) return `Кількість (${qty}) має дорівнювати кількості вибраних серій (${serialIds.length}).`;
  const duplicates = duplicateValues(serialIds);
  if (duplicates.length) return "Одна й та сама серія вибрана більше одного разу.";
  for (const serialId of serialIds) {
    const serial = byId(state.serials, serialId);
    if (!serial) return "Серійний номер не знайдено.";
    if (!serialMatchesProduct(serial, product)) return `Серія ${serial.serial} не належить вибраній моделі.`;
    if (!serialMatchesStockContext(serial, { firmId: data.firmId || "vat", clientId: client.id })) return `Серія ${serial.serial} не належить вибраній фірмі/клієнту.`;
    if (serial.clientId !== client.id) return `Серія ${serial.serial} належить іншому клієнту.`;
    if (serial.status !== "responsible_storage") return `Серія ${serial.serial} не перебуває на відповідальному зберіганні цього клієнта.`;
    if (serialIsSold(serial)) return `Серія ${serial.serial} уже продана. Повторний продаж заблоковано.`;
    if (serial.actual === false) return `Серія ${serial.serial} неактуальна.`;
    if (serial.erzStatus !== "verified") return `ЄРЗ для серії ${serial.serial} не перевірено.`;
  }
  return "";
}

function applyResponsibleStorageSale(clientId, productId, qty, serialIds, invoiceId, firmId = "") {
  let remaining = Number(qty || 0);
  const docs = state.responsibleStorageDocs
    .filter((doc) => doc.clientId === clientId && doc.productId === productId)
    .filter((doc) => !firmId || (doc.firmId || "vat") === firmId)
    .sort((first, second) => String(first.date).localeCompare(String(second.date)));

  if (serialIds.length) {
    docs.forEach((doc) => {
      const soldFromDoc = (doc.serialIds || []).filter((serialId) => serialIds.includes(serialId)).length;
      if (!soldFromDoc) return;
      doc.soldQty = Math.min(Number(doc.qty || 0), Number(doc.soldQty || 0) + soldFromDoc);
      doc.invoiceIds = uniqueList([...(doc.invoiceIds || []), invoiceId]);
      doc.status = responsibleDocStatus(doc);
      doc.ownership = doc.status === "ownership_transferred" ? "transferred_to_client" : "ours_until_client_sale";
    });
    return;
  }

  for (const doc of docs) {
    const available = responsibleDocRemainingQty(doc);
    if (available <= 0) continue;
    const take = Math.min(available, remaining);
    doc.soldQty = Number(doc.soldQty || 0) + take;
    doc.invoiceIds = uniqueList([...(doc.invoiceIds || []), invoiceId]);
    doc.status = responsibleDocStatus(doc);
    doc.ownership = doc.status === "ownership_transferred" ? "transferred_to_client" : "ours_until_client_sale";
    remaining -= take;
    if (remaining <= 0) break;
  }
}

function createB2BClientSale(form, options = {}) {
  if (!options.clientPortal && !canCreateDocument("b2bSaleReport")) return alert("Поточна роль не має права створювати звіт продажу B2B.");
  try {
    const data = formData(form);
    data.firmId = data.firmId || state.settings.firms[0]?.id || "vat";
    const portalClient = options.clientPortal ? authenticatedClient() : null;
    if (options.clientPortal && (!portalClient || data.clientId !== portalClient.id)) {
      throw new Error("B2B кабінет може подавати продаж тільки по своєму клієнту.");
    }
    const client = byId(state.clients, data.clientId);
    const product = byId(state.products, data.productId);
    if (!product) throw new Error("Товар не знайдено.");
    const qty = Number(data.qty || 0);
    const serialIds = product.type === "weapon" ? selectedValues(form.elements.serialIds) : [];
    const validation = validateB2BClientSale(data, product, client, serialIds, options);
    if (validation) throw new Error(validation);

    const price = parseDecimal(data.price || productSalePrice(product, client.priceType).amount, product.price || 0);
    const total = Math.round(qty * price * 100) / 100;
    const warehouse = clientResponsibleWarehouse(client.id);
    const invoice = {
      id: `inv-${String(Date.now()).slice(-8)}`,
      date: data.date || today,
      documentType: "Звіт реалізації B2B / перехід власності",
      contract: data.reportSource || "B2B відповідальне зберігання",
      warehouseId: warehouse.id,
      firmId: data.firmId || "vat",
      channel: "B2B відповідальне зберігання",
      clientId: client.id,
      manager: data.manager || state.currentManager,
      priceType: priceTypeById(client.priceType)?.id || "b2b",
      currency: data.currency || product.currency || "UAH",
      total,
      paid: 0,
      discount: 0,
      dueDate: addDays(data.date || today, data.paymentDays || state.settings.defaultDueDays),
      cashArticle: "Продаж товарів",
      accounting: true,
      locked: false,
      status: "draft",
      responsibleStorage: true,
      paymentDays: Number(data.paymentDays || state.settings.defaultDueDays),
      lines: product.type === "weapon"
        ? serialIds.map((serialId) => ({ productId: product.id, qty: 1, price, serialId, previousSerialStatus: "responsible_storage", permitNumber: data.permitNumber || "", permitDate: data.permitDate || "" }))
        : [{ productId: product.id, qty, price, serialId: "", permitNumber: "", permitDate: "" }],
      delivery: "Склад клієнта",
      deliveryPayer: "Клієнт",
      ttn: "",
      comment: data.comment || ""
    };

    if (product.type === "weapon") {
      serialIds.forEach((serialId) => {
        const serial = byId(state.serials, serialId);
        serial.status = "sold";
        serial.permitNumber = data.permitNumber;
        serial.permitDate = data.permitDate;
        serial.ownershipTransferredAt = data.date || today;
      });
    } else {
      decrementStockWhere(product.id, qty, (row) => row.clientId === client.id && (row.firmId || "vat") === (data.firmId || "vat"), "Недостатньо залишку на складі цього B2B клієнта для вибраної фірми.");
    }

    state.invoices.unshift(invoice);
    applyResponsibleStorageSale(client.id, product.id, qty, serialIds, invoice.id, invoice.firmId);
    b2bDraft = { ...b2bDraft, saleClientId: client.id, saleProductId: product.id, saleFirmId: data.firmId || "vat", saleBarcode: product.barcode || "" };
    addAudit(`${options.clientPortal ? "B2B клієнт подав продаж" : "Проведено продаж клієнта зі зберігання"}: ${invoice.id} · ${client.name} · ${formatMoney(total, invoice.currency)}`, options.clientPortal ? "B2B кабінет" : state.currentManager);
    if (options.clientPortal) {
      clientPortalDraft = { productId: product.id, firmId: data.firmId || "", barcode: product.barcode || "", qty: 1, serialIds: [], permitNumber: "", permitDate: "" };
    }
    render();
  } catch (error) {
    alert(error.message);
  }
}

function rollbackResponsibleStorageSale(invoice) {
  if (!invoice?.responsibleStorage) return;
  const grouped = invoice.lines.reduce((acc, line) => {
    acc[line.productId] = (acc[line.productId] || 0) + Number(line.qty || 1);
    return acc;
  }, {});

  Object.entries(grouped).forEach(([productId, qty]) => {
    let remaining = qty;
    const docs = state.responsibleStorageDocs
      .filter((doc) => doc.clientId === invoice.clientId && doc.productId === productId && (doc.invoiceIds || []).includes(invoice.id))
      .filter((doc) => (doc.firmId || "vat") === (invoice.firmId || "vat"))
      .sort((first, second) => String(second.date).localeCompare(String(first.date)));
    for (const doc of docs) {
      const take = Math.min(Number(doc.soldQty || 0), remaining);
      doc.soldQty = Math.max(Number(doc.soldQty || 0) - take, 0);
      doc.invoiceIds = (doc.invoiceIds || []).filter((docInvoiceId) => docInvoiceId !== invoice.id);
      doc.status = responsibleDocStatus(doc);
      doc.ownership = doc.status === "ownership_transferred" ? "transferred_to_client" : "ours_until_client_sale";
      remaining -= take;
      if (remaining <= 0) break;
    }
  });
}

function rollbackStorageShipmentInvoice(invoice) {
  const docs = state.responsibleStorageDocs.filter((doc) => doc.invoiceDraftId === invoice.id);
  if (docs.some((doc) => Number(doc.soldQty || 0) > 0)) {
    throw new Error("Не можна скасувати відвантаження на відповідальне зберігання, бо клієнт уже подав продаж по цьому товару.");
  }
  docs.forEach((doc) => {
    const sourceWarehouseId = doc.sourceWarehouseId || invoice.warehouseId || invoice.sourceWarehouseId || "";
    const product = byId(state.products, doc.productId);
    if (product?.type === "weapon") {
      (doc.serialIds || []).forEach((serialId) => {
        const serial = byId(state.serials, serialId);
        if (!serial) return;
        serial.status = "available";
        serial.clientId = "";
        serial.warehouseId = sourceWarehouseId || serial.warehouseId;
        serial.responsibleStorageDocId = "";
      });
    } else {
      decrementStockWhere(doc.productId, doc.qty, (row) => (
        row.warehouseId === doc.warehouseId
        && (row.clientId || "") === doc.clientId
        && (row.firmId || "vat") === (doc.firmId || "vat")
      ), "Недостатньо залишку на складі клієнта для скасування відвантаження.");
      incrementStock(doc.productId, sourceWarehouseId, doc.qty, "", doc.firmId || "vat");
    }
  });
  state.responsibleStorageDocs = state.responsibleStorageDocs.filter((doc) => doc.invoiceDraftId !== invoice.id);
}

function cancelInvoice(id) {
  const invoice = byId(state.invoices, id);
  if (!invoice || invoice.status === "cancelled") return;
  if (invoice.posted === false) {
    if (!confirm(`Скасувати чернетку накладної ${invoice.id}? Рух складу не змінюватиметься, бо документ ще не проведений.`)) return;
    invoice.status = "cancelled";
    invoice.locked = true;
    addAudit(`Скасовано чернетку накладної ${invoice.id}`);
    render();
    return;
  }
  if (invoice.storageShipment) {
    if (documentEditLocked("responsibleShipment", invoice)) return alert("Відвантаження заблоковане. Для скасування потрібне право зміни проведеного документа.");
    if (!confirm(`Скасувати відвантаження на відповідальне зберігання ${invoice.id} і повернути товар на наш склад?`)) return;
    try {
      rollbackStorageShipmentInvoice(invoice);
      invoice.status = "cancelled";
      invoice.locked = true;
      invoice.paid = 0;
      addAudit(`Скасовано відвантаження на відповідальне зберігання ${invoice.id}, товар повернено на наш склад`);
      render();
    } catch (error) {
      alert(error.message);
    }
    return;
  }
  if (documentEditLocked(invoicePostedPermissionKey(invoice), invoice)) return alert("Накладна заблокована. Для скасування потрібне право зміни цього виду проведеного документа.");
  if (!confirm(`Скасувати накладну ${invoice.id} і повернути її серійні номери/залишки на склад?`)) return;

  rollbackResponsibleStorageSale(invoice);
  invoice.lines.forEach((line) => {
    const product = byId(state.products, line.productId);
    if (line.serialId) {
      const serial = byId(state.serials, line.serialId);
      if (serial) {
        if (invoice.responsibleStorage) {
          serial.status = "responsible_storage";
          serial.clientId = invoice.clientId;
          serial.warehouseId = invoice.warehouseId || serial.warehouseId;
        } else {
          serial.status = line.previousSerialStatus || "available";
          if (serial.clientId === invoice.clientId) serial.clientId = "";
        }
        if (serial.permitNumber === line.permitNumber) serial.permitNumber = "";
        if (serial.permitDate === line.permitDate) serial.permitDate = "";
      }
    } else if (product?.type !== "weapon") {
      if (invoice.responsibleStorage) {
        incrementStock(line.productId, invoice.warehouseId || clientResponsibleWarehouse(invoice.clientId).id, line.qty || 0, invoice.clientId, invoice.firmId || "vat");
      } else {
        incrementStock(line.productId, invoice.warehouseId || "wh-main", line.qty || 0, "", invoice.firmId || "vat");
      }
    }
  });

  invoice.status = "cancelled";
  invoice.locked = true;
  invoice.paid = 0;
  addAudit(`Скасовано накладну ${invoice.id}, серії/залишки повернено`);
  render();
}

function decrementStock(productId, qty, warehouseId = "", firmId = "", clientId = "") {
  decrementStockWhere(
    productId,
    qty,
    (row) => stockRowMatches(row, { warehouseId, firmId, clientId }),
    stockContextMessage(productId, qty, warehouseId, firmId)
  );
}

function incrementStock(productId, warehouseId, qty, clientId = "", firmId = "vat") {
  let row = state.stock.find((item) => item.productId === productId && item.warehouseId === warehouseId && (item.clientId || "") === clientId && (item.firmId || "vat") === firmId);
  if (!row) {
    row = { productId, warehouseId, qty: 0, firmId };
    if (clientId) row.clientId = clientId;
    state.stock.push(row);
  }
  row.qty += Number(qty || 0);
}

function parseSerialLines(text) {
  return String(text || "")
    .split(/[\n,;]+/)
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();
  values.forEach((value) => {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  });
  return [...duplicates];
}

function validateWeaponRequisites(product) {
  const missing = [];
  if (!product.model) missing.push("модель");
  if (!product.caliber) missing.push("калібр");
  if (!product.brand) missing.push("бренд");
  if (!product.barcode) missing.push("QR/штрихкод");
  if (!product.supplierSku) missing.push("артикул постачальника");
  if (!product.internalCode) missing.push("внутрішній код");
  if (!product.uktzed) missing.push("УКТЗЕД");
  return missing;
}

function buildPurchase(raw, source = "manual") {
  const product = byId(state.products, raw.productId);
  if (!product) throw new Error("Позиція приходу не знайдена.");
  const qty = Number(raw.qty || 0);
  if (qty <= 0) throw new Error("Кількість приходу має бути більшою за нуль.");
  const supplier = resolveSupplier(raw);
  if (!raw.supplierDoc) throw new Error("Вкажіть документ постачальника.");
  if (!raw.warehouseId) throw new Error("Вкажіть склад приходу.");
  const scannedCode = String(raw.barcode || raw.qrCode || "").trim();
  if (!scannedCode && !product.barcode && !product.qrCode) throw new Error("QR або штрихкод обов'язковий у приході або картці товару.");
  if (scannedCode && state.products.some((item) => item.id !== product.id && item.barcode && String(item.barcode).trim().toLowerCase() === scannedCode.toLowerCase())) {
    throw new Error("Такий QR/штрихкод уже прив'язаний до іншого товару.");
  }
  if (scannedCode && product.barcode && scannedCode.toLowerCase() !== String(product.barcode).trim().toLowerCase()) {
    throw new Error(`QR/штрихкод приходу не відповідає вибраній позиції ${product.brand} ${product.model}.`);
  }

  const serials = Array.isArray(raw.serials) ? raw.serials.map((item) => String(item).trim().toUpperCase()).filter(Boolean) : parseSerialLines(raw.serials);
  if (product.type === "weapon") {
    const missing = validateWeaponRequisites(product);
    if (missing.length) throw new Error(`У картці зброї не заповнено: ${missing.join(", ")}.`);
    if (serials.length !== qty) throw new Error(`Для зброї кількість серій (${serials.length}) має дорівнювати кількості приходу (${qty}).`);
    const duplicates = duplicateValues(serials);
    if (duplicates.length) throw new Error(`Дублювання серій у документі: ${duplicates.join(", ")}.`);
    const existing = serials.filter((serial) => state.serials.some((item) => item.serial.toUpperCase() === serial));
    if (existing.length) throw new Error(`Такі серії вже існують у CRM: ${existing.join(", ")}.`);
  }

  return {
    id: raw.id || uniqueId("pin"),
    date: raw.date || today,
    documentType: raw.documentType || (source === "bas" ? "Імпорт BAS/BAF" : "Прибуткова накладна"),
    supplier,
    supplierDoc: raw.supplierDoc,
    firmId: raw.firmId || "vat",
    warehouseId: raw.warehouseId,
    productId: product.id,
    productType: product.type,
    qty,
    cost: Number(raw.cost || product.cost || 0),
    currency: raw.currency || product.costCurrency || "UAH",
    barcode: scannedCode || product.barcode || product.qrCode,
    serials: product.type === "weapon" ? serials : [],
    accounting: raw.accounting !== false && raw.accounting !== "false",
    basStatus: source === "bas" ? "imported" : (raw.accounting === false || raw.accounting === "false" ? "management" : "pending_export"),
    comment: raw.comment || ""
  };
}

function applyPurchase(purchase, options = {}) {
  const product = byId(state.products, purchase.productId);
  product.cost = purchase.cost;
  product.costCurrency = purchase.currency;
  if (!product.barcode && purchase.barcode) {
    product.barcode = purchase.barcode;
  }

  if (product.type === "weapon") {
    purchase.serials.forEach((serial, index) => {
      state.serials.unshift({
        id: uniqueId(`s-${index}`),
        productId: product.id,
        serial,
        warehouseId: purchase.warehouseId,
        firmId: purchase.firmId || "vat",
        status: "available",
        erzStatus: options.erzStatus || "pending",
        actual: options.actual !== false,
        basSynced: purchase.basStatus === "imported" || purchase.basStatus === "exported",
        purchaseId: purchase.id,
        clientId: "",
        permitNumber: "",
        permitDate: ""
      });
    });
  } else {
    incrementStock(product.id, purchase.warehouseId, purchase.qty, "", purchase.firmId || "vat");
  }

  state.purchases.unshift(purchase);
}

function createPurchase(form) {
  if (!canCreateDocument("purchase")) return alert("Поточна роль не має права створювати прихід.");
  try {
    const data = formData(form);
    const draftLines = collectPurchaseLinesFromForm(form);
    if (!draftLines.length) throw new Error("Додайте хоча б один товар у прихід.");
    const allSerials = draftLines.flatMap((line) => parseSerialLines(line.serials));
    const duplicatedSerials = duplicateValues(allSerials);
    if (duplicatedSerials.length) throw new Error(`Дублювання серій у документі приходу: ${duplicatedSerials.join(", ")}.`);
    const purchases = draftLines.map((line, index) => {
      try {
        return {
          purchase: buildPurchase({ ...data, ...line }, "manual"),
          options: {
            erzStatus: line.erzStatus,
            actual: line.actual === "true"
          }
        };
      } catch (error) {
        throw new Error(`Рядок ${index + 1}: ${error.message}`);
      }
    });
    purchases.forEach(({ purchase, options }) => applyPurchase(purchase, options));
    const totalQty = purchases.reduce((sum, item) => sum + Number(item.purchase.qty || 0), 0);
    addAudit(`Проведено прихід ${data.supplierDoc || purchases[0]?.purchase.id}: ${purchases.length} позицій · ${totalQty} од.`);
    purchaseDraft = { ...purchaseDraft, lines: [defaultPurchaseLine()] };
    render();
  } catch (error) {
    alert(error.message);
  }
}

function editPurchaseDocument(id) {
  const purchase = byId(state.purchases, id);
  if (!purchase) return;
  if (!canEditPostedDocument("purchase")) return alert("Поточна роль не має права змінювати проведені приходи.");
  openModal(`Зміна приходу ${purchase.id}`, `
    <form class="form-grid" data-action="update-purchase">
      <input type="hidden" name="id" value="${escapeHtml(purchase.id)}">
      <label class="field"><span>Дата</span><input name="date" type="date" value="${escapeHtml(purchase.date)}"></label>
      <label class="field"><span>Тип документа</span><select name="documentType">${variantOptions("purchaseDocumentTypes", purchase.documentType)}</select></label>
      <label class="field"><span>Фірма</span><select name="firmId">${state.settings.firms.map((firm) => option(firm.id, firm.name, firm.id === purchase.firmId)).join("")}</select></label>
      <label class="field"><span>Склад</span><select name="warehouseId">${state.warehouses.map((warehouse) => option(warehouse.id, warehouse.name, warehouse.id === purchase.warehouseId)).join("")}</select></label>
      <label class="field wide"><span>Постачальник</span><input name="supplier" value="${escapeHtml(purchase.supplier || "")}"></label>
      <label class="field"><span>Документ постач.</span><input name="supplierDoc" value="${escapeHtml(purchase.supplierDoc || "")}"></label>
      <label class="field"><span>Ціна приходу</span><input name="cost" inputmode="decimal" value="${escapeHtml(purchase.cost)}"></label>
      <label class="field"><span>Валюта</span><select name="currency">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === purchase.currency)).join("")}</select></label>
      <label class="field"><span>BAS/BAF</span><select name="accounting">${option("true", "Позначити для BAS/BAF", purchase.accounting === true)}${option("false", "Не передавати", purchase.accounting !== true)}</select></label>
      <label class="field"><span>Статус BAS</span><select name="basStatus">${["pending_export", "exported", "imported", "management"].map((status) => option(status, MARKETPLACE_ORDER_STATUS_MAP[status]?.label || status, status === purchase.basStatus)).join("")}</select></label>
      <label class="field full"><span>Коментар</span><textarea name="comment">${escapeHtml(purchase.comment || "")}</textarea></label>
      <p class="notice warn small full">Позиція, кількість і серії змінюються тільки коригуванням, щоб зберегти унікальність серій та складський рух.</p>
      <button class="primary" type="submit">Зберегти зміни приходу</button>
    </form>
  `);
}

function updatePurchaseDocument(form) {
  const data = formData(form);
  const purchase = byId(state.purchases, data.id);
  if (!purchase) return alert("Прихід не знайдено.");
  if (!canEditPostedDocument("purchase")) return alert("Поточна роль не має права змінювати проведені приходи.");
  const product = byId(state.products, purchase.productId);
  const oldWarehouseId = purchase.warehouseId;
  const newWarehouseId = data.warehouseId || oldWarehouseId;
  const oldFirmId = purchase.firmId || "vat";
  const newFirmId = data.firmId || oldFirmId;
  if (oldWarehouseId !== newWarehouseId || oldFirmId !== newFirmId) {
    if (product?.type === "weapon") {
      state.serials.filter((serial) => serial.purchaseId === purchase.id).forEach((serial) => {
        serial.warehouseId = newWarehouseId;
        serial.firmId = newFirmId;
      });
    } else {
      const oldRow = state.stock.find((row) => row.productId === purchase.productId && row.warehouseId === oldWarehouseId && !row.clientId && (row.firmId || "vat") === oldFirmId);
      if (!oldRow || Number(oldRow.qty || 0) < Number(purchase.qty || 0)) {
        return alert("Неможливо змінити фірму або склад приходу: частина товару вже списана або переміщена. Зробіть коригувальний документ.");
      }
      oldRow.qty -= Number(purchase.qty || 0);
      incrementStock(purchase.productId, newWarehouseId, purchase.qty, "", newFirmId);
    }
  }
  purchase.date = data.date || purchase.date;
  purchase.documentType = data.documentType;
  purchase.firmId = newFirmId;
  purchase.warehouseId = newWarehouseId;
  purchase.supplier = data.supplier;
  purchase.supplierDoc = data.supplierDoc;
  purchase.cost = parseDecimal(data.cost, purchase.cost);
  purchase.currency = data.currency;
  purchase.accounting = data.accounting === "true";
  purchase.basStatus = data.basStatus;
  purchase.comment = data.comment;
  if (product) {
    product.cost = purchase.cost;
    product.costCurrency = purchase.currency;
  }
  addAudit(`Змінено проведений прихід ${purchase.id}`);
  document.querySelector(".modal-backdrop")?.remove();
  render();
}

function createProduct(form) {
  if (!canCreateDocument("productCard")) return alert("Поточна роль не має права створювати картку товару.");
  try {
    const data = formData(form);
    const barcode = String(data.barcode || "").trim();
    if (!barcode) throw new Error("QR або штрихкод обов'язковий для створення товару.");
    if (state.products.some((product) => product.barcode && String(product.barcode).trim().toLowerCase() === barcode.toLowerCase())) {
      throw new Error("Такий QR/штрихкод уже використовується в іншому товарі.");
    }

    const type = data.type;
    let caliber = resolveDictionaryValue("calibers", data.caliberValue, data.newCaliber, "Калібр", { required: type === "weapon" });
    if (type === "weapon" && (!caliber || caliber === "без калібру")) {
      throw new Error("Для товару типу “Зброя” потрібно вказати калібр.");
    }
    if (type !== "weapon" && caliber === "без калібру") caliber = "";
    const internalCode = resolveDictionaryValue("internalCodes", data.internalCodeValue, data.newInternalCode, "Внутрішній код");
    if (state.products.some((product) => normalizedText(product.internalCode) === normalizedText(internalCode))) {
      throw new Error("Такий внутрішній код уже використовується в іншій картці товару. Для нової моделі створіть новий внутрішній код.");
    }

    const product = {
      id: `p-${String(Date.now()).slice(-6)}`,
      type,
      model: resolveDictionaryValue("models", data.modelValue, data.newModel, "Модель"),
      caliber,
      brand: resolveDictionaryValue("brands", data.brandValue, data.newBrand, "Бренд"),
      category: resolveDictionaryValue("categories", data.categoryValue, data.newCategory, "Категорія"),
      unit: resolveDictionaryValue("units", data.unitValue, data.newUnit, "Одиниця"),
      erzRequired: data.erzRequired === "true",
      barcode,
      supplierSku: resolveDictionaryValue("supplierSkus", data.supplierSkuValue, data.newSupplierSku, "Артикул постачальника"),
      internalCode,
      uktzed: resolveDictionaryValue("uktzed", data.uktzedValue, data.newUktzed, "УКТЗЕД"),
      price: Number(data.price || 0),
      currency: data.currency,
      cost: Number(data.cost || 0),
      costCurrency: data.costCurrency,
      minStock: Number(data.minStock || 0),
      leadTimeDays: Number(data.leadTimeDays || 0),
      marketplaceSku: data.marketplaceSku,
      description: data.description,
      photos: clone(productImagesDraft)
    };
    state.products.unshift(product);
    if (product.type === "regular") {
      state.stock.unshift({ productId: product.id, warehouseId: "wh-main", qty: 0 });
    }
    productImagesDraft = [];
    addAudit(`Додано товар ${product.brand} ${product.model}`);
    render();
  } catch (error) {
    alert(error.message);
  }
}

function createClient(form) {
  if (!canCreateDocument("clientCard")) return alert("Поточна роль не має права створювати клієнта.");
  const data = formData(form);
  state.clients.unshift({
    id: `c-${String(Date.now()).slice(-6)}`,
    name: data.name,
    type: data.type,
    edrpou: data.edrpou,
    phone: data.phone,
    email: data.email,
    manager: data.manager,
    paymentTerms: data.paymentTerms,
    creditLimitUAH: Number(data.creditLimitUAH || 0),
    currency: data.currency,
    priceType: data.priceType,
    taxMode: data.taxMode,
    cabinetEnabled: data.cabinetEnabled === "true",
    responsibleStorage: data.responsibleStorage === "true",
    address: data.address
  });
  addAudit(`Додано клієнта ${data.name}`);
  render();
}

function productPayloadFromForm(data, existingId = "") {
  const existingProduct = existingId ? byId(state.products, existingId) : {};
  const barcode = String(data.barcode || "").trim();
  if (!barcode) throw new Error("QR або штрихкод обов'язковий для картки товару.");
  if (state.products.some((product) => product.id !== existingId && product.barcode && String(product.barcode).trim().toLowerCase() === barcode.toLowerCase())) {
    throw new Error("Такий QR/штрихкод уже використовується в іншому товарі.");
  }

  const type = data.type;
  let caliber = resolveDictionaryValue("calibers", data.caliberValue, data.newCaliber, "Калібр", { required: type === "weapon" });
  if (type === "weapon" && (!caliber || caliber === "без калібру")) {
    throw new Error("Для товару типу “Зброя” потрібно вказати калібр.");
  }
  if (type !== "weapon" && caliber === "без калібру") caliber = "";

  const internalCode = resolveDictionaryValue("internalCodes", data.internalCodeValue, data.newInternalCode, "Внутрішній код");
  if (state.products.some((product) => product.id !== existingId && normalizedText(product.internalCode) === normalizedText(internalCode))) {
    throw new Error("Такий внутрішній код уже використовується в іншій картці товару.");
  }
  const prices = collectProductPrices(data, existingProduct);
  const retail = prices.retail || Object.values(prices)[0] || { amount: 0, currency: "UAH" };

  return {
    type,
    model: resolveDictionaryValue("models", data.modelValue, data.newModel, "Модель"),
    caliber,
    brand: resolveDictionaryValue("brands", data.brandValue, data.newBrand, "Бренд"),
    category: resolveDictionaryValue("categories", data.categoryValue, data.newCategory, "Категорія"),
    unit: resolveDictionaryValue("units", data.unitValue, data.newUnit, "Одиниця"),
    erzRequired: data.erzRequired === "true",
    barcode,
    supplierSku: resolveDictionaryValue("supplierSkus", data.supplierSkuValue, data.newSupplierSku, "Артикул постачальника"),
    internalCode,
    uktzed: resolveDictionaryValue("uktzed", data.uktzedValue, data.newUktzed, "УКТЗЕД"),
    price: parseDecimal(retail.amount, 0),
    currency: retail.currency || "UAH",
    prices,
    cost: data.cost === undefined ? parseDecimal(existingProduct.cost, 0) : parseDecimal(data.cost, 0),
    costCurrency: data.costCurrency || existingProduct.costCurrency || "UAH",
    minStock: Number(data.minStock || 0),
    leadTimeDays: Number(data.leadTimeDays || 0),
    marketplaceSku: data.marketplaceSku,
    catalogTag: data.catalogTag || "",
    description: data.description,
    photos: clone(productImagesDraft)
  };
}

function ensureRegularProductStock(product) {
  if (product.type !== "regular") return;
  if (!state.stock.some((row) => row.productId === product.id)) {
    state.stock.unshift({ productId: product.id, warehouseId: "wh-main", qty: 0 });
  }
}

function createProductCard(form) {
  if (!canCreateDocument("productCard")) return alert("Поточна роль не має права створювати картку товару.");
  if (!canEditField("productRequisites")) return alert("Поточна роль не має права заповнювати реквізити товару.");
  try {
    const product = {
      id: `p-${String(Date.now()).slice(-6)}`,
      ...productPayloadFromForm(formData(form))
    };
    state.products.unshift(product);
    ensureRegularProductStock(product);
    seedProductDictionaries(state);
    syncCatalogParametersFromProducts(state);
    productImagesDraft = [];
    addAudit(`Додано товар ${product.brand} ${product.model}`);
    form.closest(".modal-backdrop")?.remove();
    render();
  } catch (error) {
    alert(error.message);
  }
}

function productEditorForm(product) {
  return `
    <form class="form-grid" data-action="update-product">
      <input type="hidden" name="id" value="${escapeHtml(product.id)}">
      <label class="field"><span>Тип</span><select name="type">${option("regular", "Звичайний товар", product.type === "regular")}${option("weapon", "Зброя", product.type === "weapon")}</select></label>
      ${dictionaryField("categories", "Категорія", "categoryValue", "newCategory", { selected: product.category || "", placeholder: "нова категорія / група" })}
      ${dictionaryField("units", "Одиниця", "unitValue", "newUnit", { selected: product.unit || "", placeholder: "нова одиниця виміру" })}
      ${dictionaryField("brands", "Бренд", "brandValue", "newBrand", { selected: product.brand || "", placeholder: "новий бренд" })}
      ${dictionaryField("models", "Модель", "modelValue", "newModel", { selected: product.model || "", wide: true, placeholder: "нова модель" })}
      ${dictionaryField("calibers", "Калібр", "caliberValue", "newCaliber", { selected: product.caliber || "без калібру", required: false, placeholder: "новий калібр для зброї" })}
      <label class="field"><span>ЄРЗ</span><select name="erzRequired">${option("false", "ні", !product.erzRequired)}${option("true", "так", product.erzRequired)}</select></label>
      <div class="field wide">
        <span>Штрих / QR</span>
        <div class="input-action">
          <input name="barcode" data-product-barcode required value="${escapeHtml(product.barcode || "")}" placeholder="скануйте або створіть код">
          <button class="ghost" type="button" data-generate-product-barcode>Створити</button>
        </div>
      </div>
      ${dictionaryField("supplierSkus", "Артикул постач.", "supplierSkuValue", "newSupplierSku", { selected: product.supplierSku || "", placeholder: "новий артикул постачальника" })}
      ${dictionaryField("internalCodes", "Внутр. код", "internalCodeValue", "newInternalCode", { selected: product.internalCode || "", placeholder: "новий внутрішній код" })}
      ${dictionaryField("uktzed", "УКТЗЕД", "uktzedValue", "newUktzed", { selected: product.uktzed || "", placeholder: "новий код УКТЗЕД" })}
      <label class="field"><span>Прихідна</span><input name="cost" data-field-lock="cost" value="${escapeHtml(product.cost || 0)}"></label>
      <label class="field"><span>Валюта приходу</span><select name="costCurrency" data-field-lock="cost">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === product.costCurrency)).join("")}</select></label>
      ${productPriceInputs(product)}
      <label class="field"><span>Мін. залишок</span><input name="minStock" type="number" min="0" value="${escapeHtml(product.minStock || 0)}"></label>
      <label class="field"><span>Поставка, днів</span><input name="leadTimeDays" type="number" min="0" value="${escapeHtml(product.leadTimeDays || 0)}"></label>
      <label class="field wide"><span>SKU маркетплейсу</span><input name="marketplaceSku" value="${escapeHtml(product.marketplaceSku || "")}" placeholder="Rozetka/Prom/Epicentr/Allo"></label>
      <label class="field"><span>Каталог / акція</span><select name="catalogTag">${catalogTagOptions(product.catalogTag || "")}</select></label>
      <label class="field full"><span>Опис / характеристики</span><textarea name="description">${escapeHtml(product.description || "")}</textarea></label>
      <div class="field full">
        <span>Фото товару</span>
        <input type="file" name="photos" data-product-photos accept="${MARKETPLACE_IMAGE_EXTENSIONS}" multiple>
        <p class="notice small">До 6 фото з комп'ютера. Дозволені формати: JPG/JPEG або PNG.</p>
      </div>
      <div class="photo-preview full" data-product-photo-preview></div>
      <button class="primary" type="submit">Зберегти картку товару</button>
    </form>
  `;
}

function openProductCard(id) {
  const product = byId(state.products, id);
  if (!product) return;
  productImagesDraft = clone(product.photos || []);
  const qty = product.type === "weapon"
    ? state.serials.filter((serial) => serial.productId === product.id && serial.status !== "sold").length
    : state.stock.filter((row) => row.productId === product.id).reduce((sum, row) => sum + Number(row.qty || 0), 0);
  const modal = openModal(`Картка товару · ${product.brand} ${product.model}`, `
    <section class="grid three compact-metrics">
      <article class="card metric info"><span>ID</span><strong>${escapeHtml(product.internalCode || product.id)}</strong><small>${escapeHtml(product.supplierSku || "артикул не внесено")}</small></article>
      <article class="card metric good"><span>Залишок</span><strong>${qty}</strong><small>${product.type === "weapon" ? "серійні одиниці" : "кількісний облік"}</small></article>
      <article class="card metric warn"><span>Маркетплейси</span><strong>${state.marketplacePublications.filter((item) => item.productId === product.id).length}</strong><small>публікацій по SKU</small></article>
    </section>
    ${productEditorForm(product)}
  `);
  renderProductPhotoPreview(modal);
  if (!canCreateDocument("productEdit")) {
    setFormReadOnly(modal.querySelector('[data-action="update-product"]'), "Поточна роль може переглядати картку товару, але не може змінювати її реквізити.");
  } else if (!canEditField("productRequisites")) {
    setFormReadOnly(modal.querySelector('[data-action="update-product"]'), "Поточна роль не має права змінювати реквізити товару.");
  }
}

function updateProductCard(form) {
  if (!canCreateDocument("productEdit")) return alert("Поточна роль не має права змінювати картку товару.");
  if (!canEditField("productRequisites")) return alert("Поточна роль не має права змінювати реквізити товару.");
  try {
    const data = formData(form);
    const product = byId(state.products, data.id);
    if (!product) throw new Error("Товар не знайдено.");
    Object.assign(product, productPayloadFromForm(data, product.id));
    ensureRegularProductStock(product);
    seedProductDictionaries(state);
    syncCatalogParametersFromProducts(state);
    productImagesDraft = [];
    addAudit(`Оновлено картку товару ${product.brand} ${product.model}`);
    form.closest(".modal-backdrop")?.remove();
    render();
  } catch (error) {
    alert(error.message);
  }
}

function clientPayloadFromForm(data) {
  const name = String(data.name || "").trim();
  if (!name) throw new Error("Вкажіть назву клієнта.");
  return {
    name,
    type: data.type,
    edrpou: data.edrpou,
    phone: data.phone,
    email: data.email,
    manager: data.manager,
    paymentTerms: data.paymentTerms,
    creditLimitUAH: Number(data.creditLimitUAH || 0),
    currency: data.currency,
    priceType: data.priceType,
    taxMode: data.taxMode,
    cabinetEnabled: data.cabinetEnabled === "true",
    portalLogin: String(data.portalLogin || "").trim(),
    portalPassword: String(data.portalPassword || "").trim(),
    responsibleStorage: data.responsibleStorage === "true",
    address: data.address
  };
}

function ensureClientPortalLoginUnique(login, excludeClientId = "") {
  const normalized = String(login || "").trim().toLowerCase();
  if (!normalized) return;
  if (state.clients.some((client) => client.id !== excludeClientId && String(client.portalLogin || "").trim().toLowerCase() === normalized)) {
    throw new Error("Такий логін B2B кабінету вже використовується іншим клієнтом.");
  }
}

function createClientCard(form) {
  if (!canCreateDocument("clientCard")) return alert("Поточна роль не має права створювати клієнта.");
  if (!canEditField("clientRequisites")) return alert("Поточна роль не має права заповнювати реквізити клієнта.");
  try {
    const data = clientPayloadFromForm(formData(form));
    const id = `c-${String(Date.now()).slice(-6)}`;
    data.portalLogin = data.portalLogin || defaultClientLogin({ ...data, id }, state.clients.length);
    data.portalPassword = data.portalPassword || "1234";
    ensureClientPortalLoginUnique(data.portalLogin);
    const client = {
      id,
      ...data,
      createdFrom: "crm",
      sourceType: "crm",
      sourceName: "CRM",
      sourceText: "CRM / ручне створення",
      createdAt: currentTimestamp(),
      updatedAt: currentTimestamp(),
      sources: []
    };
    addClientSource(client, { type: "crm", label: "CRM / ручне створення", detail: state.currentManager, date: today });
    state.clients.unshift(client);
    addAudit(`Додано клієнта ${data.name}`);
    render();
  } catch (error) {
    alert(error.message);
  }
}

function clientEditorForm(client) {
  return `
    <form class="form-grid" data-action="update-client">
      <input type="hidden" name="id" value="${escapeHtml(client.id)}">
      <label class="field wide"><span>Назва</span><input name="name" required value="${escapeHtml(client.name || "")}"></label>
      <label class="field"><span>Тип</span><select name="type">${variantOptions("clientTypes", client.type)}</select></label>
      <label class="field"><span>ЄДРПОУ / ІПН</span><input name="edrpou" value="${escapeHtml(client.edrpou || "")}"></label>
      <label class="field"><span>Телефон</span><input name="phone" value="${escapeHtml(client.phone || "")}"></label>
      <label class="field"><span>Email</span><input name="email" type="email" value="${escapeHtml(client.email || "")}"></label>
      <label class="field"><span>Менеджер</span><select name="manager">${employeeOptions(client.manager)}</select></label>
      <label class="field"><span>Умови оплат</span><select name="paymentTerms">${variantOptions("paymentTerms", client.paymentTerms)}</select></label>
      <label class="field"><span>Кредитний ліміт</span><input name="creditLimitUAH" value="${escapeHtml(client.creditLimitUAH || 0)}"></label>
      <label class="field"><span>Валюта</span><select name="currency">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === (client.currency || "UAH"))).join("")}</select></label>
      <label class="field"><span>Прайс</span><select name="priceType">${priceTypeOptions(client.priceType)}</select></label>
      <label class="field"><span>Податки</span><select name="taxMode">${variantOptions("taxModes", client.taxMode)}</select></label>
      <label class="field"><span>Кабінет</span><select name="cabinetEnabled">${option("true", "увімкнути", client.cabinetEnabled === true)}${option("false", "не створювати", client.cabinetEnabled !== true)}</select></label>
      <label class="field"><span>Логін кабінету</span><input name="portalLogin" value="${escapeHtml(client.portalLogin || "")}"></label>
      <label class="field"><span>Пароль кабінету</span><input name="portalPassword" type="text" value="${escapeHtml(client.portalPassword || "")}"></label>
      <label class="field"><span>Відп. зберігання</span><select name="responsibleStorage">${option("true", "так", client.responsibleStorage === true)}${option("false", "ні", client.responsibleStorage !== true)}</select></label>
      <label class="field full"><span>Адреса / доставка</span><textarea name="address">${escapeHtml(client.address || "")}</textarea></label>
      <button class="primary" type="submit">Зберегти картку клієнта</button>
    </form>
  `;
}

function openClientCard(id) {
  const client = byId(state.clients, id);
  if (!client) return;
  const invoices = state.invoices.filter((invoice) => invoice.clientId === client.id && isDebtInvoice(invoice));
  const debt = invoices.reduce((sum, invoice) => sum + Math.max(invoice.total - invoice.paid, 0), 0);
  const storageQty = clientStorageRows(client.id).reduce((sum, row) => sum + row.qty, 0);
  const modal = openModal(`Картка клієнта · ${client.name}`, `
    <section class="grid three compact-metrics">
      <article class="card metric info"><span>Дебіторка</span><strong>${formatMoney(debt, client.currency || "UAH")}</strong><small>${invoices.length} накладних</small></article>
      <article class="card metric good"><span>Відп. зберігання</span><strong>${storageQty}</strong><small>одиниць на складах клієнта</small></article>
      <article class="card metric warn"><span>Кабінет</span><strong>${client.cabinetEnabled ? "так" : "ні"}</strong><small>${client.responsibleStorage ? "є відповідальне зберігання" : "без зберігання"}</small></article>
    </section>
    ${clientEditorForm(client)}
  `);
  if (!canCreateDocument("clientEdit")) {
    setFormReadOnly(modal.querySelector('[data-action="update-client"]'), "Поточна роль може переглядати картку клієнта, але не може змінювати її реквізити.");
  } else if (!canEditField("clientRequisites")) {
    setFormReadOnly(modal.querySelector('[data-action="update-client"]'), "Поточна роль не має права змінювати реквізити клієнта.");
  }
}

function updateClientCard(form) {
  if (!canCreateDocument("clientEdit")) return alert("Поточна роль не має права змінювати картку клієнта.");
  if (!canEditField("clientRequisites")) return alert("Поточна роль не має права змінювати реквізити клієнта.");
  try {
    const data = formData(form);
    const client = byId(state.clients, data.id);
    if (!client) throw new Error("Клієнта не знайдено.");
    const payload = clientPayloadFromForm(data);
    payload.portalLogin = payload.portalLogin || defaultClientLogin({ ...payload, id: client.id }, 0);
    payload.portalPassword = payload.portalPassword || "1234";
    ensureClientPortalLoginUnique(payload.portalLogin, client.id);
    Object.assign(client, payload);
    state.warehouses
      .filter((warehouse) => warehouse.kind === "client_responsible" && warehouse.clientId === client.id)
      .forEach((warehouse) => {
        warehouse.name = `Склад клієнта · ${client.name}`;
      });
    addAudit(`Оновлено картку клієнта ${client.name}`);
    form.closest(".modal-backdrop")?.remove();
    render();
  } catch (error) {
    alert(error.message);
  }
}

function createEmployee(form) {
  if (!isAdmin()) return alert("Працівників може додавати тільки адміністратор.");
  const data = formData(form);
  const login = String(data.login || "").trim();
  if (!login || !data.password) return alert("Вкажіть логін і пароль працівника.");
  if (state.employees.some((employee) => String(employee.login || "").trim().toLowerCase() === login.toLowerCase())) {
    return alert("Такий логін уже використовується іншим працівником.");
  }
  state.employees.unshift({
    id: `emp-${String(Date.now()).slice(-6)}`,
    name: data.name,
    roleName: data.roleName,
    department: data.department,
    phone: data.phone,
    email: data.email,
    login,
    password: data.password,
    active: true
  });
  state.managers = state.employees.filter((employee) => employee.active).map((employee) => employee.name);
  addAudit(`Додано працівника ${data.name} з роллю ${data.roleName}`);
  render();
}

function rowToForm(row) {
  const form = document.createElement("form");
  $$("input, select, textarea", row).forEach((element) => {
    if (!element.name) return;
    const input = document.createElement("input");
    input.name = element.name;
    input.value = element.value;
    form.appendChild(input);
  });
  return form;
}

function saveEmployee(id) {
  if (!isAdmin()) return alert("Дані працівників може змінювати тільки адміністратор.");
  const row = document.querySelector(`[data-employee-row="${CSS.escape(id)}"]`);
  const employee = byId(state.employees, id);
  if (!row || !employee) return;
  const data = Object.fromEntries(new FormData(rowToForm(row)).entries());
  const login = String(data.login || "").trim();
  if (!login || !data.password) return alert("Логін і пароль працівника обов'язкові.");
  if (state.employees.some((item) => item.id !== id && String(item.login || "").trim().toLowerCase() === login.toLowerCase())) {
    return alert("Такий логін уже використовується іншим працівником.");
  }
  employee.name = data.name;
  employee.department = data.department;
  employee.phone = data.phone;
  employee.email = data.email;
  employee.login = login;
  employee.password = data.password;
  employee.roleName = data.roleName;
  employee.active = data.active === "true";
  if (employee.id === state.currentEmployeeId) {
    state.currentManager = employee.name;
    state.currentRole = employee.roleName;
  }
  state.managers = state.employees.filter((item) => item.active).map((item) => item.name);
  addAudit(`Оновлено працівника ${employee.name}`);
  render();
}

function updateRolePermission(target) {
  if (!isAdmin()) {
    alert("Права ролей може змінювати тільки адміністратор.");
    render();
    return;
  }
  const roleItem = state.roles.find((item) => item.name === target.dataset.roleName);
  if (!roleItem) return;
  const group = target.dataset.roleGroup;
  const key = target.dataset.rolePermission;
  if (roleItem.name === state.currentRole && group === "basic" && key === "canManageUsers" && !target.checked) {
    alert("Не можна забрати права адміністратора у поточної активної ролі. Спочатку увійдіть під іншим адміністратором.");
    render();
    return;
  }
  if (group === "basic") {
    roleItem[key] = target.checked;
  } else {
    roleItem.access = roleItem.access || { views: {}, subviews: {}, documents: {}, posted: {}, fields: {} };
    roleItem.access[group] = roleItem.access[group] || {};
    roleItem.access[group][key] = target.checked;
  }
  if (roleItem.name === state.currentRole) {
    if (!canAccessView(state.currentView)) state.currentView = "dashboard";
    const selectedSubview = state.currentSubViews?.[state.currentView];
    if (selectedSubview && !canAccessSubview(state.currentView, selectedSubview)) {
      const firstSubview = subviewsFor(state.currentView)[0];
      if (firstSubview) state.currentSubViews[state.currentView] = firstSubview[0];
    }
  }
  addAudit(`Оновлено право ролі ${roleItem.name}: ${key} = ${target.checked ? "так" : "ні"}`);
  render();
}

function createWarehouse(form) {
  if (!(role().canEditSettings || isAdmin())) return alert("Склади може змінювати тільки адміністратор.");
  const data = formData(form);
  state.warehouses.push({
    id: `wh-${String(Date.now()).slice(-6)}`,
    name: data.name,
    kind: data.kind
  });
  addAudit(`Додано склад ${data.name}`);
  render();
}

function createCashArticle(form) {
  if (!(role().canEditSettings || isAdmin())) return alert("Статті може змінювати тільки адміністратор.");
  const data = formData(form);
  if (!state.settings.cashArticles.includes(data.article)) {
    state.settings.cashArticles.push(data.article);
  }
  addVariantDictionaryEntry("cashArticles", data.article);
  addAudit(`Додано статтю коштів ${data.article}`);
  render();
}

function createExpenseArticle(form) {
  if (!(role().canEditSettings || isAdmin())) return alert("Статті може змінювати тільки адміністратор.");
  const data = formData(form);
  if (!state.settings.expenseArticles.includes(data.article)) {
    state.settings.expenseArticles.push(data.article);
  }
  addVariantDictionaryEntry("expenseArticles", data.article);
  addAudit(`Додано статтю витрат ${data.article}`);
  render();
}

function addVariantDictionaryEntry(key, name, value = "", parentName = "") {
  state.settings.variantDictionaries = state.settings.variantDictionaries || normalizeVariantDictionaries(state.settings);
  state.settings.variantDictionaries[key] = state.settings.variantDictionaries[key] || [];
  const entries = state.settings.variantDictionaries[key];
  const normalizedName = String(name || "").trim();
  if (!normalizedName) return null;
  let parentId = "";
  const normalizedParent = String(parentName || "").trim();
  if (normalizedParent) {
    let parent = entries.find((entry) => !entry.parentId && entry.name.toLowerCase() === normalizedParent.toLowerCase());
    if (!parent) {
      parent = normalizeVariantEntry({ id: uniqueId(key), name: normalizedParent, value: normalizedParent, parentId: "" }, key);
      entries.push(parent);
    }
    parentId = parent.id;
  }
  const entryValue = String(value || normalizedName).trim();
  const duplicate = entries.find((entry) => (
    (entry.parentId || "") === parentId
    && String(entry.value || entry.name).trim().toLowerCase() === entryValue.toLowerCase()
  ));
  if (duplicate) {
    duplicate.active = true;
    return duplicate;
  }
  const entry = normalizeVariantEntry({ id: uniqueId(key), name: normalizedName, value: entryValue, parentId }, key);
  entries.push(entry);
  syncLegacyVariantDictionaries();
  return entry;
}

function createVariantDictionaryItem(form) {
  if (!(role().canEditSettings || isAdmin())) return alert("Довідники може змінювати тільки адміністратор.");
  const data = formData(form);
  const definition = VARIANT_DICTIONARY_DEFINITIONS.find((item) => item.key === data.dictionaryKey);
  if (!definition) return alert("Оберіть довідник.");
  const entry = addVariantDictionaryEntry(definition.key, data.name, data.value, data.parentName);
  if (!entry) return alert("Вкажіть назву пункту довідника.");
  addAudit(`Додано пункт довідника ${definition.label}: ${variantLabel(definition.key, entry.value)}`);
  render();
}

function createCatalogParameter(form) {
  if (!(role().canEditSettings || isAdmin())) return alert("Параметри каталогу може змінювати тільки адміністратор.");
  const data = formData(form);
  const definition = CATALOG_PARAMETER_DEFINITIONS.find((item) => item.key === data.parameterKey);
  if (!definition) return alert("Оберіть каталог параметрів.");
  const name = String(data.name || "").trim();
  const value = String(data.value || name).trim();
  if (!name) return alert("Вкажіть назву параметра.");
  if (!value) return alert("Вкажіть значення параметра.");
  const entry = addCatalogParameterEntry(definition.key, name, value);
  if (!entry) return alert("Не вдалося додати параметр.");
  addAudit(`Додано параметр каталогу ${definition.label}: ${entry.name}`);
  render();
}

function createPaymentTerminal(form) {
  if (!(role().canEditSettings || isAdmin())) return alert("Платіжні термінали може змінювати тільки адміністратор.");
  const data = formData(form);
  const name = String(data.name || "").trim();
  if (!name) return alert("Вкажіть назву термінала.");
  if (!byId(state.settings.firms, data.firmId)) return alert("Оберіть фірму для термінала.");
  const duplicate = (state.settings.paymentTerminals || []).some((terminal) => (
    terminal.name.trim().toLowerCase() === name.toLowerCase() && terminal.firmId === data.firmId
  ));
  if (duplicate) return alert("Такий термінал уже є для вибраної фірми.");
  state.settings.paymentTerminals.push({
    id: uniqueId("term"),
    name,
    firmId: data.firmId,
    provider: String(data.provider || "").trim()
  });
  addAudit(`Додано платіжний термінал ${name} для ${firmName(data.firmId)}`);
  render();
}

function createPriceType(form) {
  if (!(role().canEditSettings || isAdmin())) return alert("Прайси може змінювати тільки адміністратор.");
  const data = formData(form);
  const name = String(data.name || "").trim();
  if (!name) return alert("Вкажіть назву прайса.");
  if (state.settings.priceTypes.some((item) => item.name.trim().toLowerCase() === name.toLowerCase())) {
    return alert("Такий прайс уже існує.");
  }
  const priceType = { id: slugId(name, "price"), name, kind: "sale", active: true, system: false };
  state.settings.priceTypes.push(priceType);
  state.products.forEach((product) => {
    product.prices = normalizeProductPrices(product, state.settings.priceTypes);
  });
  addAudit(`Додано прайс ${name}`);
  render();
}

function togglePriceType(id) {
  if (!(role().canEditSettings || isAdmin())) return alert("Прайси може змінювати тільки адміністратор.");
  const priceType = state.settings.priceTypes.find((item) => item.id === id);
  if (!priceType || priceType.kind === "cost") return;
  priceType.active = priceType.active === false;
  const activeSaleCount = state.settings.priceTypes.filter((item) => item.kind !== "cost" && item.active !== false).length;
  if (!activeSaleCount) {
    priceType.active = true;
    return alert("Має залишитись хоча б один активний прайс продажу.");
  }
  addAudit(`${priceType.active ? "Увімкнено" : "Вимкнено"} прайс ${priceType.name}`);
  render();
}

function createSerial(form) {
  if (!canCreateDocument("serialCorrection")) return alert("Поточна роль не має права змінювати серійний облік.");
  const data = formData(form);
  const normalized = data.serial.trim().toUpperCase();
  if (!normalized) return alert("Вкажіть серійний номер.");
  if (state.serials.some((serial) => serial.serial.toUpperCase() === normalized)) {
    return alert("Дублювання серійного номера заборонено.");
  }
  state.serials.unshift({
    id: `s-${String(Date.now()).slice(-6)}`,
    productId: data.productId,
    serial: normalized,
    warehouseId: data.warehouseId,
    status: data.status,
    erzStatus: data.erzStatus,
    actual: true,
    basSynced: false,
    purchaseId: "manual",
    clientId: data.clientId,
    permitNumber: "",
    permitDate: ""
  });
  addAudit(`Додано серійну одиницю ${normalized}`);
  render();
}

function editSerialDocument(id) {
  const serial = byId(state.serials, id);
  if (!serial) return;
  if (!canEditPostedDocument("serialCorrection")) return alert("Поточна роль не має права змінювати проведені серійні документи.");
  const weaponOptions = state.products
    .filter((product) => product.type === "weapon")
    .map((product) => option(product.id, `${product.brand} ${product.model}`, product.id === serial.productId))
    .join("");
  openModal(`Зміна серії ${serial.serial}`, `
    <form class="form-grid" data-action="update-serial">
      <input type="hidden" name="id" value="${escapeHtml(serial.id)}">
      <label class="field wide"><span>Модель зброї</span><select name="productId">${weaponOptions}</select></label>
      <label class="field"><span>Серійний номер</span><input name="serial" value="${escapeHtml(serial.serial)}" required></label>
      <label class="field"><span>Склад</span><select name="warehouseId">${state.warehouses.map((warehouse) => option(warehouse.id, warehouse.name, warehouse.id === serial.warehouseId)).join("")}</select></label>
      <label class="field"><span>Статус</span><select name="status">${["available", "responsible_storage", "sold"].map((status) => option(status, statusPill(status).replace(/<[^>]+>/g, ""), status === serial.status)).join("")}</select></label>
      <label class="field"><span>ЄРЗ</span><select name="erzStatus">${["pending", "verified"].map((status) => option(status, statusPill(status).replace(/<[^>]+>/g, ""), status === serial.erzStatus)).join("")}</select></label>
      <label class="field"><span>Актуальність</span><select name="actual">${option("true", "актуальна", serial.actual !== false)}${option("false", "неактуальна", serial.actual === false)}</select></label>
      <label class="field wide"><span>B2B клієнт</span><select name="clientId"><option value="">Немає</option>${state.clients.filter((client) => client.type === "B2B").map((client) => option(client.id, client.name, client.id === serial.clientId)).join("")}</select></label>
      <label class="field"><span>Номер дозволу</span><input name="permitNumber" value="${escapeHtml(serial.permitNumber || "")}"></label>
      <label class="field"><span>Дата дозволу</span><input name="permitDate" type="date" value="${escapeHtml(serial.permitDate || "")}"></label>
      <p class="notice warn small full">Зміна серії перевіряє унікальність номера. Для зброї на відповідальному зберіганні має бути вказаний B2B клієнт.</p>
      <button class="primary" type="submit">Зберегти серійний документ</button>
    </form>
  `);
}

function updateSerialDocument(form) {
  const data = formData(form);
  const serial = byId(state.serials, data.id);
  if (!serial) return alert("Серію не знайдено.");
  if (!canEditPostedDocument("serialCorrection")) return alert("Поточна роль не має права змінювати проведені серійні документи.");
  const normalized = String(data.serial || "").trim().toUpperCase();
  if (!normalized) return alert("Вкажіть серійний номер.");
  if (state.serials.some((item) => item.id !== serial.id && item.serial.toUpperCase() === normalized)) return alert("Дублювання серійного номера заборонено.");
  if (data.status === "responsible_storage" && !data.clientId) return alert("Для статусу відповідального зберігання потрібно вибрати B2B клієнта.");
  serial.productId = data.productId;
  serial.serial = normalized;
  serial.warehouseId = data.warehouseId;
  serial.status = data.status;
  serial.erzStatus = data.erzStatus;
  serial.actual = data.actual === "true";
  serial.clientId = data.clientId || "";
  serial.permitNumber = data.permitNumber || "";
  serial.permitDate = data.permitDate || "";
  addAudit(`Змінено серійний документ ${serial.serial}`);
  document.querySelector(".modal-backdrop")?.remove();
  render();
}

function createPayment(form) {
  if (!canCreateDocument("payment")) return alert("Поточна роль не має права вносити оплати.");
  if (!canEditField("payment")) return alert("Поточна роль не має права змінювати поля оплати.");
  const data = formData(form);
  const isAdvance = data.paymentKind === "advance";
  const client = byId(state.clients, data.clientId);
  if (!client) return alert("Клієнта не знайдено.");
  const invoice = byId(state.invoices, data.invoiceId);
  if (!isAdvance && !invoice) return alert("Накладна не знайдена.");
  if (!isAdvance && invoice.clientId !== data.clientId) {
    return alert("Обрана накладна не належить вибраному клієнту.");
  }
  if (!isAdvance && isLocked(invoice.date, invoice.locked) && !role().canEditClosedDay && !canEditPostedDocument(invoicePostedPermissionKey(invoice)) && !canEditPostedDocument("payment")) {
    return alert("Документ заблоковано закритим днем.");
  }
  const debt = isAdvance ? 0 : invoiceDebt(invoice);
  if (!isAdvance && debt <= 0) return alert("По вибраній накладній немає боргу.");
  if (data.paymentSource === "card" && !data.terminalId) return alert("Для оплати карткою потрібно вибрати термінал.");
  const amount = Number(data.amount || 0);
  if (amount <= 0) return alert("Сума оплати має бути більшою за нуль.");
  const customRate = Number(data.rate || 0);
  const rate = customRate > 0 ? customRate : uahRate(data.currency);
  const paidInInvoiceCurrency = !isAdvance && customRate > 0
    ? convertMoney(amount * customRate, "UAH", invoice.currency)
    : (!isAdvance ? convertMoney(amount, data.currency, invoice.currency) : 0);
  state.payments.unshift({
    id: `pay-${String(Date.now()).slice(-6)}`,
    invoiceId: isAdvance ? "" : invoice.id,
    date: data.date,
    amount,
    currency: data.currency,
    rate,
    rateMode: customRate > 0 ? "uah-per-unit" : "settings",
    method: paymentMethodFromSource(data.paymentSource),
    source: data.paymentSource,
    paymentKind: data.paymentKind,
    advance: isAdvance,
    clientId: client.id,
    firmId: data.firmId,
    terminalId: data.paymentSource === "card" ? data.terminalId : "",
    prro: data.paymentSource === "cash" ? data.prro === "true" : false,
    bankRef: data.bankRef
  });
  if (!isAdvance) {
    invoice.paid = Math.min(invoice.total, invoice.paid + paidInInvoiceCurrency);
    invoice.status = invoice.paid >= invoice.total ? "paid" : "partial";
  }
  paymentDraft = {
    source: data.paymentSource || "cash",
    kind: data.paymentKind || "invoice",
    clientId: client.id,
    invoiceId: isAdvance ? "" : invoice.id,
    firmId: data.firmId,
    terminalId: data.terminalId || "",
    prro: data.prro || "true"
  };
  addAudit(`${isAdvance ? "Аванс" : "Оплату"} ${formatMoney(amount, data.currency)} ${isAdvance ? `внесено від ${client.name}` : `прив'язано до ${invoice.id}`}`);
  render();
}

function createExpense(form) {
  if (!canCreateDocument("expense")) return alert("Поточна роль не має права створювати витрати.");
  const data = formData(form);
  const amount = Number(data.amount || 0);
  if (amount <= 0) return alert("Сума витрати має бути більшою за нуль.");
  state.expenses.unshift({
    id: `exp-${String(Date.now()).slice(-6)}`,
    date: data.date,
    article: data.article,
    amount,
    currency: data.currency,
    method: data.method,
    manager: data.manager,
    supplier: data.supplier,
    comment: data.comment
  });
  addAudit(`Додано витрату ${formatMoney(amount, data.currency)} за статтею ${data.article}`);
  render();
}

function createPayable(form) {
  if (!canCreateDocument("payable")) return alert("Поточна роль не має права створювати кредиторку.");
  const data = formData(form);
  const amount = Number(data.amount || 0);
  if (amount <= 0) return alert("Сума кредиторки має бути більшою за нуль.");
  state.payables.unshift({
    id: `ap-${String(Date.now()).slice(-6)}`,
    supplier: data.supplier,
    manager: data.manager,
    article: data.article,
    amount,
    currency: data.currency,
    dueDate: data.dueDate,
    status: "open"
  });
  addAudit(`Додано кредиторку ${data.supplier} на ${formatMoney(amount, data.currency)}`);
  render();
}

function editPaymentDocument(id) {
  const payment = byId(state.payments, id);
  if (!payment) return;
  if (!canEditPostedDocument("payment")) return alert("Поточна роль не має права змінювати проведені оплати.");
  const firmOptions = state.settings.firms.map((firm) => option(firm.id, firm.name, firm.id === payment.firmId)).join("");
  const terminalOptions = state.settings.paymentTerminals.map((terminal) => option(terminal.id, `${terminal.name} · ${firmName(terminal.firmId)}`, terminal.id === payment.terminalId)).join("");
  openModal(`Зміна оплати ${payment.id}`, `
    <form class="form-grid" data-action="update-payment">
      <input type="hidden" name="id" value="${escapeHtml(payment.id)}">
      <label class="field"><span>Дата</span><input name="date" type="date" value="${escapeHtml(payment.date)}"></label>
      <label class="field"><span>Сума</span><input name="amount" inputmode="decimal" value="${escapeHtml(payment.amount)}"></label>
      <label class="field"><span>Валюта</span><select name="currency">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === payment.currency)).join("")}</select></label>
      <label class="field"><span>Курс до UAH</span><input name="rate" inputmode="decimal" value="${escapeHtml(payment.rate || "")}"></label>
      <label class="field"><span>Джерело</span><select name="source">${variantOptions("paymentSources", payment.source)}</select></label>
      <label class="field"><span>Фірма</span><select name="firmId">${firmOptions}</select></label>
      <label class="field wide"><span>Термінал</span><select name="terminalId"><option value="">Без термінала</option>${terminalOptions}</select></label>
      <label class="field"><span>ПРРО</span><select name="prro">${option("true", "Проводити ПРРО", payment.prro === true)}${option("false", "Без ПРРО", payment.prro !== true)}</select></label>
      <label class="field wide"><span>Референс</span><input name="bankRef" value="${escapeHtml(payment.bankRef || "")}"></label>
      <button class="primary" type="submit">Зберегти оплату</button>
    </form>
  `);
}

function updatePaymentDocument(form) {
  const data = formData(form);
  const payment = byId(state.payments, data.id);
  if (!payment) return alert("Оплату не знайдено.");
  if (!canEditPostedDocument("payment")) return alert("Поточна роль не має права змінювати проведені оплати.");
  payment.date = data.date || payment.date;
  payment.amount = parseDecimal(data.amount, payment.amount);
  payment.currency = data.currency;
  payment.rate = parseDecimal(data.rate, uahRate(data.currency));
  payment.rateMode = data.rate ? "uah-per-unit" : "settings";
  payment.source = data.source;
  payment.method = paymentMethodFromSource(data.source);
  payment.firmId = data.firmId;
  payment.terminalId = data.source === "card" ? data.terminalId : "";
  payment.prro = data.source === "cash" ? data.prro === "true" : false;
  payment.bankRef = data.bankRef;
  recalculateInvoicePayments(state);
  addAudit(`Змінено проведену оплату ${payment.id}`);
  document.querySelector(".modal-backdrop")?.remove();
  render();
}

function editExpenseDocument(id) {
  const expense = byId(state.expenses, id);
  if (!expense) return;
  if (!canEditPostedDocument("expense")) return alert("Поточна роль не має права змінювати проведені витрати.");
  openModal(`Зміна витрати ${expense.id}`, `
    <form class="form-grid" data-action="update-expense">
      <input type="hidden" name="id" value="${escapeHtml(expense.id)}">
      <label class="field"><span>Дата</span><input name="date" type="date" value="${escapeHtml(expense.date)}"></label>
      <label class="field"><span>Стаття</span><select name="article">${variantOptions("expenseArticles", expense.article)}</select></label>
      <label class="field"><span>Сума</span><input name="amount" inputmode="decimal" value="${escapeHtml(expense.amount)}"></label>
      <label class="field"><span>Валюта</span><select name="currency">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === expense.currency)).join("")}</select></label>
      <label class="field"><span>Метод</span><select name="method">${variantOptions("financeMethods", expense.method)}</select></label>
      <label class="field"><span>Постачальник</span><input name="supplier" value="${escapeHtml(expense.supplier || "")}"></label>
      <label class="field"><span>Менеджер</span><select name="manager">${employeeOptions(expense.manager)}</select></label>
      <label class="field wide"><span>Коментар</span><input name="comment" value="${escapeHtml(expense.comment || "")}"></label>
      <button class="primary" type="submit">Зберегти витрату</button>
    </form>
  `);
}

function updateExpenseDocument(form) {
  const data = formData(form);
  const expense = byId(state.expenses, data.id);
  if (!expense) return alert("Витрату не знайдено.");
  if (!canEditPostedDocument("expense")) return alert("Поточна роль не має права змінювати проведені витрати.");
  expense.date = data.date;
  expense.article = data.article;
  expense.amount = parseDecimal(data.amount, expense.amount);
  expense.currency = data.currency;
  expense.method = data.method;
  expense.supplier = data.supplier;
  expense.manager = data.manager;
  expense.comment = data.comment;
  addAudit(`Змінено проведену витрату ${expense.id}`);
  document.querySelector(".modal-backdrop")?.remove();
  render();
}

function editPayableDocument(id) {
  const payable = byId(state.payables, id);
  if (!payable) return;
  if (!canEditPostedDocument("payable")) return alert("Поточна роль не має права змінювати проведену кредиторку.");
  openModal(`Зміна кредиторки ${payable.id}`, `
    <form class="form-grid" data-action="update-payable">
      <input type="hidden" name="id" value="${escapeHtml(payable.id)}">
      <label class="field wide"><span>Постачальник</span><input name="supplier" value="${escapeHtml(payable.supplier || "")}"></label>
      <label class="field"><span>Стаття</span><select name="article">${variantOptions("expenseArticles", payable.article)}</select></label>
      <label class="field"><span>Сума</span><input name="amount" inputmode="decimal" value="${escapeHtml(payable.amount)}"></label>
      <label class="field"><span>Валюта</span><select name="currency">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === payable.currency)).join("")}</select></label>
      <label class="field"><span>Дата оплати</span><input name="dueDate" type="date" value="${escapeHtml(payable.dueDate || today)}"></label>
      <label class="field"><span>Менеджер</span><select name="manager">${employeeOptions(payable.manager)}</select></label>
      <label class="field"><span>Стан</span><select name="status">${option("open", "Відкрито", payable.status === "open")}${option("paid", "Оплачено", payable.status === "paid")}${option("cancelled", "Скасовано", payable.status === "cancelled")}</select></label>
      <button class="primary" type="submit">Зберегти кредиторку</button>
    </form>
  `);
}

function updatePayableDocument(form) {
  const data = formData(form);
  const payable = byId(state.payables, data.id);
  if (!payable) return alert("Кредиторку не знайдено.");
  if (!canEditPostedDocument("payable")) return alert("Поточна роль не має права змінювати проведену кредиторку.");
  payable.supplier = data.supplier;
  payable.article = data.article;
  payable.amount = parseDecimal(data.amount, payable.amount);
  payable.currency = data.currency;
  payable.dueDate = data.dueDate;
  payable.manager = data.manager;
  payable.status = data.status;
  addAudit(`Змінено проведену кредиторку ${payable.id}`);
  document.querySelector(".modal-backdrop")?.remove();
  render();
}

function createMarketplacePublication(form) {
  if (!canCreateDocument("marketplacePublication")) return alert("Поточна роль не має права створювати публікації маркетплейсу.");
  try {
    const lines = collectMarketplacePublicationLinesFromForm(form);
    if (!lines.length) throw new Error("Додайте хоча б одну публікацію.");
    const keys = lines.map((line) => `${line.marketplace}::${String(line.sku || "").trim().toLowerCase()}`);
    const duplicatedKeys = duplicateValues(keys).filter((key) => !key.endsWith("::"));
    if (duplicatedKeys.length) {
      throw new Error(`Дублювання SKU у формі: ${duplicatedKeys.map((key) => key.replace("::", " · ")).join(", ")}.`);
    }
    const publications = lines.map((line, index) => {
      const product = byId(state.products, line.productId);
      if (!product) throw new Error(`Рядок ${index + 1}: товар не знайдено.`);
      if (!line.marketplace) throw new Error(`Рядок ${index + 1}: оберіть маркетплейс.`);
      if (!String(line.sku || "").trim()) throw new Error(`Рядок ${index + 1}: вкажіть SKU.`);
      if (state.marketplacePublications.some((publication) => publication.marketplace === line.marketplace && publication.sku.toLowerCase() === line.sku.toLowerCase())) {
        throw new Error(`Рядок ${index + 1}: SKU ${line.sku} вже існує на ${line.marketplace}.`);
      }
      const filters = validateMarketplacePublicationRequirements(line, index + 1);
      const logistics = publicationLogisticsFromLine(line);
      const price = productSalePrice(product, marketplacePriceTypeId());
      const publication = {
        id: uniqueId("pub"),
        marketplace: line.marketplace,
        productId: line.productId,
        sku: line.sku,
        externalId: line.externalId,
        title: line.title || `${product.brand} ${product.model}`,
        category: {
          name: line.categoryName || product.category || "",
          id: line.categoryId || "",
          groupParam: line.groupParam || ""
        },
        filters,
        logistics,
        price: parseDecimal(line.price || price.amount, product.price || 0),
        currency: line.currency || price.currency || product.currency || "UAH",
        stockQty: productAvailableQty(product.id),
        status: "needs_sync",
        photosStatus: product.photos?.length ? "ok" : "missing",
        lastSync: "",
        manager: line.manager || state.currentManager
      };
      return syncPublicationReadinessFields(publication);
    });
    state.marketplacePublications.unshift(...publications);
    addAudit(`Створено публікацій маркетплейсів: ${publications.length}`);
    marketplacePublicationDraft = { lines: [defaultMarketplacePublicationLine()] };
    form.closest(".modal-backdrop")?.remove();
    render();
  } catch (error) {
    alert(error.message);
  }
}

function updateMarketplacePublication(form) {
  if (!canEditMarketplacePublication()) return alert("Поточна роль не має права змінювати публікації маркетплейсу.");
  const data = formData(form);
  const publication = byId(state.marketplacePublications, data.id);
  if (!publication) return alert("Публікацію не знайдено.");
  publication.marketplace = data.marketplace;
  publication.productId = data.productId;
  publication.sku = data.sku;
  publication.externalId = data.externalId;
  publication.title = data.title;
  publication.price = parseDecimal(data.price, 0);
  publication.currency = data.currency;
  publication.category = {
    name: data.categoryName || "",
    id: data.categoryId || "",
    groupParam: data.groupParam || ""
  };
  publication.filters = publicationFiltersFromLine(data);
  publication.logistics = publicationLogisticsFromLine(data);
  publication.stockQty = parseDecimal(data.stockQty, productAvailableQty(publication.productId));
  publication.photosStatus = data.photosStatus || (publicationLinkedProduct(publication)?.photos?.length ? "ok" : "missing");
  publication.manager = data.manager;
  publication.status = "needs_sync";
  syncPublicationReadinessFields(publication);
  addAudit(`Оновлено публікацію ${publication.marketplace} · ${publication.sku}`);
  document.querySelector(".modal-backdrop")?.remove();
  render();
}

function editPublication(id) {
  const publication = byId(state.marketplacePublications, id);
  if (!publication) return;
  if (!canEditMarketplacePublication()) return alert("Поточна роль не має права змінювати публікації маркетплейсу.");
  const issues = marketplacePublicationMissingFields(publication);
  const category = publication.category || {};
  const filters = Array.isArray(publication.filters) ? publication.filters : [];
  const logistics = publication.logistics || {};
  const filterLine = (index) => filters[index] || {};
  openModal(`Редагування публікації ${publication.sku}`, `
    <form class="form-grid" data-action="update-marketplace-publication">
      <input type="hidden" name="id" value="${escapeHtml(publication.id)}">
      ${renderPublicationIssueSummary(publication)}
      <label class="${publicationFieldClass(issues, ["marketplace"])}"><span>Маркетплейс</span><select name="marketplace">${marketplaceNames().map((name) => option(name, name, name === publication.marketplace)).join("")}</select></label>
      <label class="${publicationFieldClass(issues, ["productId"], "field wide")}"><span>Товар</span><select name="productId">${state.products.map((product) => option(product.id, `${product.brand} ${product.model}`, product.id === publication.productId)).join("")}</select></label>
      <label class="${publicationFieldClass(issues, ["sku"])}"><span>SKU</span><input name="sku" value="${escapeHtml(publication.sku || "")}" required></label>
      <label class="${publicationFieldClass(issues, ["externalId"])}"><span>Зовнішній ID</span><input name="externalId" value="${escapeHtml(publication.externalId || "")}"></label>
      <label class="${publicationFieldClass(issues, ["title"], "field wide")}"><span>Назва</span><input name="title" value="${escapeHtml(publication.title || "")}" required></label>
      <label class="${publicationFieldClass(issues, ["category"])}"><span>Категорія маркетплейсу</span><input name="categoryName" value="${escapeHtml(category.name || "")}" placeholder="назва категорії"></label>
      <label class="${publicationFieldClass(issues, ["category"])}"><span>ID категорії</span><input name="categoryId" value="${escapeHtml(category.id || "")}" placeholder="ID категорії"></label>
      <label class="field"><span>Параметр групування</span><input name="groupParam" value="${escapeHtml(category.groupParam || "")}" placeholder="колір / розмір / модель"></label>
      <label class="${publicationFieldClass(issues, ["filters"])}"><span>Фільтр 1 назва</span><input name="filter1Name" value="${escapeHtml(filterLine(0).name || "")}" placeholder="бренд"></label>
      <label class="${publicationFieldClass(issues, ["filters"])}"><span>Фільтр 1 значення</span><input name="filter1Value" value="${escapeHtml(filterLine(0).value || "")}" placeholder="CORE"></label>
      <label class="${publicationFieldClass(issues, ["filters"])}"><span>Фільтр 2 назва</span><input name="filter2Name" value="${escapeHtml(filterLine(1).name || "")}" placeholder="модель"></label>
      <label class="${publicationFieldClass(issues, ["filters"])}"><span>Фільтр 2 значення</span><input name="filter2Value" value="${escapeHtml(filterLine(1).value || "")}" placeholder="M16"></label>
      <label class="${publicationFieldClass(issues, ["filters"])}"><span>Фільтр 3 назва</span><input name="filter3Name" value="${escapeHtml(filterLine(2).name || "")}" placeholder="розмір"></label>
      <label class="${publicationFieldClass(issues, ["filters"])}"><span>Фільтр 3 значення</span><input name="filter3Value" value="${escapeHtml(filterLine(2).value || "")}" placeholder="5.5 мм"></label>
      <label class="${publicationFieldClass(issues, ["price"])}"><span>Ціна</span><input name="price" inputmode="decimal" value="${escapeHtml(publication.price || 0)}"></label>
      <label class="${publicationFieldClass(issues, ["currency"])}"><span>Валюта</span><select name="currency">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === publication.currency)).join("")}</select></label>
      <label class="${publicationFieldClass(issues, ["stockQty"])}"><span>Залишок каналу</span><input name="stockQty" inputmode="decimal" value="${escapeHtml(publication.stockQty ?? productAvailableQty(publication.productId))}"></label>
      <label class="${publicationFieldClass(issues, ["photos"])}"><span>Фото</span><select name="photosStatus">${option("ok", "є фото", (publication.photosStatus || "") === "ok")}${option("missing", "немає фото", (publication.photosStatus || "") !== "ok")}</select></label>
      <label class="${publicationFieldClass(issues, ["weightKg"])}"><span>Вага, кг</span><input name="weightKg" inputmode="decimal" value="${escapeHtml(logistics.weightKg || "")}"></label>
      <label class="${publicationFieldClass(issues, ["dimensions"])}"><span>Довжина, см</span><input name="lengthCm" inputmode="decimal" value="${escapeHtml(logistics.lengthCm || "")}"></label>
      <label class="${publicationFieldClass(issues, ["dimensions"])}"><span>Ширина, см</span><input name="widthCm" inputmode="decimal" value="${escapeHtml(logistics.widthCm || "")}"></label>
      <label class="${publicationFieldClass(issues, ["dimensions"])}"><span>Висота, см</span><input name="heightCm" inputmode="decimal" value="${escapeHtml(logistics.heightCm || "")}"></label>
      <label class="field"><span>Місць</span><input name="cargoPlaces" type="number" min="1" value="${escapeHtml(logistics.cargoPlaces || 1)}"></label>
      <label class="${publicationFieldClass(issues, ["manager"])}"><span>Менеджер</span><select name="manager">${employeeOptions(publication.manager)}</select></label>
      <button class="primary" type="submit">Зберегти</button>
    </form>
  `);
  attachFieldSuggestions();
}

function syncPublication(id) {
  const publication = byId(state.marketplacePublications, id);
  if (!publication) return;
  const product = byId(state.products, publication.productId);
  publication.stockQty = productAvailableQty(publication.productId);
  publication.photosStatus = product?.photos?.length ? "ok" : "missing";
  const readiness = marketplacePublicationReadiness(publication);
  if (readiness.danger.length) {
    publication.status = "needs_sync";
    syncPublicationReadinessFields(publication);
    alert(`Публікацію не можна синхронізувати: ${readiness.danger.map((issue) => issue.label).join(", ")}`);
    render();
    return;
  }
  publication.status = "published";
  publication.lastSync = `${today} ${new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}`;
  syncPublicationReadinessFields(publication);
  addAudit(`${publication.marketplace}: синхронізовано публікацію ${publication.sku}`, "system");
  render();
}

function syncMarketplaceStocks() {
  state.marketplacePublications.forEach((publication) => {
    publication.stockQty = productAvailableQty(publication.productId);
    publication.status = "needs_sync";
    syncPublicationReadinessFields(publication);
  });
  addAudit("Оновлено залишки для відправки на маркетплейси", "system");
  render();
}

function syncMarketplacePrices() {
  state.marketplacePublications.forEach((publication) => {
    const product = byId(state.products, publication.productId);
    if (!product) return;
    const price = productSalePrice(product, marketplacePriceTypeId());
    publication.price = Math.round(uah(price.amount, price.currency));
    publication.currency = "UAH";
    publication.status = "needs_sync";
    syncPublicationReadinessFields(publication);
  });
  addAudit("Оновлено ціни публікацій по поточному курсу CRM", state.currentManager);
  render();
}

function exportMarketplaceCatalog(marketplace) {
  const payload = {
    exportedAt: `${today} ${new Date().toLocaleTimeString("uk-UA")}`,
    marketplace,
    publications: state.marketplacePublications
      .filter((publication) => publication.marketplace === marketplace)
      .map(publicationPayload)
  };
  downloadJson(`marketplace-${marketplace}-${today}.json`, payload);
}

function importMarketplaceCatalog(form) {
  try {
    const data = formData(form);
    const payload = JSON.parse(data.payload || "{}");
    const rows = Array.isArray(payload) ? payload : payload.publications;
    if (!Array.isArray(rows)) throw new Error("JSON має містити масив publications.");
    rows.forEach((row) => {
      const existing = state.marketplacePublications.find((publication) => publication.marketplace === row.marketplace && publication.sku === row.sku);
      if (existing) {
        Object.assign(existing, { ...row, status: "needs_sync" });
        syncPublicationReadinessFields(existing);
      } else {
        state.marketplacePublications.unshift(syncPublicationReadinessFields({
          id: uniqueId("pub"),
          marketplace: row.marketplace,
          productId: row.productId,
          sku: row.sku,
          externalId: row.externalId || "",
          title: row.title || row.sku,
          category: row.category || { name: row.categoryName || "", id: row.categoryId || "", groupParam: row.groupParam || "" },
          filters: Array.isArray(row.filters) ? row.filters : [],
          logistics: row.logistics || {},
          price: Number(row.price || 0),
          currency: row.currency || "UAH",
          stockQty: Number(row.stockQty || 0),
          status: row.status || "needs_sync",
          photosStatus: row.photosStatus || "unknown",
          lastSync: "",
          manager: row.manager || state.currentManager
        }));
      }
    });
    addAudit(`Імпортовано публікацій маркетплейсів: ${rows.length}`, "system");
    render();
  } catch (error) {
    alert(`Помилка імпорту публікацій: ${error.message}`);
  }
}

function importDemoMarketplaceOrder() {
  const publication = state.marketplacePublications[0];
  if (!publication) return alert("Спочатку створіть публікацію.");
  const stamp = String(Date.now()).slice(-5);
  const order = normalizeMarketplaceOrder({
    id: uniqueId("mpo"),
    marketplace: publication.marketplace,
    externalOrderId: `${publication.marketplace.slice(0, 2).toUpperCase()}-${today.replaceAll("-", "")}-${stamp}`,
    date: today,
    status: "new_order",
    dates: { created: today, agreed: "", warehouse: "", delivery: "", delivered: "", paid: "" },
    warehouseStatus: "new",
    manager: publication.manager || state.currentManager,
    productId: publication.productId,
    sku: publication.sku,
    qty: 1,
    price: publication.price,
    currency: publication.currency,
    buyer: { name: `Покупець ${stamp}`, phone: `+38050${stamp}00`, email: `buyer${stamp}@example.com`, edrpou: "", address: "Нова пошта, відділення уточнюється" },
    delivery: { service: "Нова пошта", city: "Київ", warehouse: "відділення уточнюється", ttn: "", status: "new", apiStatus: "Очікує ТТН", lastCheck: "" },
    payment: { method: "Маркетплейс", status: "expected", amount: publication.price, source: `${publication.marketplace}Pay`, apiStatus: "Очікує оплату", lastCheck: "", paidAt: "" },
    clientId: "",
    invoiceId: ""
  });
  state.marketplaceOrders.unshift(order);
  runMarketplaceOrderAutomation(order, { audit: true });
  addAudit(`${publication.marketplace}: нове замовлення передано менеджеру ${publication.manager || state.currentManager}`, "system");
  render();
}

function ensureClientFromMarketplaceOrder(order) {
  const buyer = marketplaceOrderBuyer(order);
  const sourceOrderId = order.externalOrderId || order.id || "";
  const sourceLabel = `${order.marketplace || "Маркетплейс"} / замовлення`;
  let client = state.clients.find((item) => item.phone && item.phone === buyer.phone)
    || state.clients.find((item) => item.email && item.email === buyer.email)
    || state.clients.find((item) => buyer.edrpou && item.edrpou === buyer.edrpou)
    || state.clients.find((item) => buyer.name && item.name === buyer.name && item.manager === order.manager);
  if (!client) {
    client = {
      id: uniqueId("c"),
      name: buyer.name,
      type: "Retail",
      manager: order.manager,
      paymentTerms: "Оплата через маркетплейс",
      creditLimitUAH: 0,
      cabinetEnabled: false,
      edrpou: buyer.edrpou || "",
      phone: buyer.phone || "",
      email: buyer.email || "",
      priceType: "Маркетплейс",
      currency: order.currency,
      taxMode: "роздріб",
      responsibleStorage: false,
      address: buyer.address || "",
      createdFrom: "marketplace_order",
      sourceType: "marketplace_order",
      sourceName: sourceLabel,
      sourceOrderId,
      sourceText: `${sourceLabel}${sourceOrderId ? ` · ${sourceOrderId}` : ""}`,
      createdAt: currentTimestamp(),
      updatedAt: currentTimestamp(),
      sources: []
    };
    state.clients.unshift(client);
  } else {
    client.name = client.name || buyer.name;
    client.manager = client.manager || order.manager;
    client.edrpou = client.edrpou || buyer.edrpou || "";
    client.phone = client.phone || buyer.phone || "";
    client.email = client.email || buyer.email || "";
    client.address = client.address || buyer.address || "";
    client.currency = client.currency || order.currency || "UAH";
    client.updatedAt = currentTimestamp();
  }
  addClientSource(client, { type: "marketplace_order", label: sourceLabel, detail: sourceOrderId, orderId: sourceOrderId, date: order.date || today });
  order.clientId = client.id;
  return client;
}

function notifyMarketplaceOrder(id) {
  if (!canManageMarketplaceOrder()) return alert("Поточна роль не має права працювати із замовленнями маркетплейсу.");
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  order.notifiedAt = currentTimestamp();
  addAudit(`Менеджера ${order.manager} повідомлено про замовлення ${order.externalOrderId}`, "system");
  render();
}

function createClientFromOrder(id) {
  if (!canManageMarketplaceOrder()) return alert("Поточна роль не має права створювати клієнта із замовлення маркетплейсу.");
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  const client = ensureClientFromMarketplaceOrder(order);
  addAudit(`Створено/оновлено клієнта ${client.name} із замовлення ${order.externalOrderId}`);
  render();
}

function createMarketplaceOrder(form) {
  if (!canManageMarketplaceOrder()) return alert("Поточна роль не має права створювати замовлення маркетплейсу.");
  try {
    const data = formData(form);
    const product = byId(state.products, data.productId);
    if (!product) throw new Error("Оберіть товар для замовлення.");
    if (!String(data.buyerName || "").trim()) throw new Error("Вкажіть покупця.");
    if (!String(data.buyerPhone || "").trim()) throw new Error("Вкажіть телефон покупця.");

    const qty = Math.max(1, Number(data.qty || 1));
    const price = parseDecimal(data.price, product.price || 0);
    const marketplace = data.marketplace || marketplaceNames()[0] || "Marketplace";
    const externalOrderId = String(data.externalOrderId || "").trim() || `CRM-${today.replaceAll("-", "")}-${String(Date.now()).slice(-6)}`;
    if (state.marketplaceOrders.some((order) => order.marketplace === marketplace && order.externalOrderId === externalOrderId)) {
      throw new Error(`Замовлення ${externalOrderId} вже існує для ${marketplace}.`);
    }

    const paymentStatus = data.paymentStatus || "expected";
    const paymentAmount = data.paymentAmount === "" || data.paymentAmount === undefined
      ? qty * price
      : parseDecimal(data.paymentAmount, qty * price);
    const order = normalizeMarketplaceOrder({
      id: uniqueId("mpo"),
      marketplace,
      externalOrderId,
      date: data.date || today,
      status: data.status || "new_order",
      productId: product.id,
      sku: data.sku || product.marketplaceSku || product.supplierSku || product.internalCode || product.id,
      qty,
      price,
      currency: data.currency || product.currency || "UAH",
      buyer: {
        name: data.buyerName || "",
        phone: data.buyerPhone || "",
        email: data.buyerEmail || "",
        edrpou: data.buyerEdrpou || "",
        address: data.buyerAddress || ""
      },
      delivery: {
        service: data.deliveryService || "",
        city: data.deliveryCity || "",
        warehouse: data.deliveryWarehouse || "",
        ttn: data.deliveryTtn || "",
        status: data.deliveryStatus || "new",
        apiStatus: "Створено вручну в CRM"
      },
      payment: {
        status: paymentStatus,
        amount: paymentAmount,
        source: data.paymentSource || "Ручне замовлення CRM",
        method: data.paymentMethod || "Маркетплейс",
        paidAt: paymentStatus === "paid" ? (data.date || today) : ""
      },
      dates: { created: data.date || today },
      manager: data.manager || state.currentManager,
      manual: true,
      source: "CRM"
    });
    runMarketplaceOrderAutomation(order, { audit: true });
    state.marketplaceOrders.unshift(order);
    addAudit(`Вручну створено замовлення ${order.externalOrderId}`);
    form.closest(".modal-backdrop")?.remove();
    render();
  } catch (error) {
    alert(error.message);
  }
}

function editMarketplaceOrderDocument(id) {
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  if (!canEditMarketplaceOrder()) return alert("Поточна роль не має права змінювати замовлення маркетплейсів.");
  const delivery = order.delivery || {};
  const payment = order.payment || {};
  if (order.status === "new_order" && canEditMarketplaceOrder()) {
    setMarketplaceOrderWorkflowStage(order, "in_progress", { nextAction: salesFunnelStage("in_progress").reminder });
    addAudit(`Замовлення ${order.externalOrderId} взято в роботу менеджером ${state.currentManager}`);
    saveState();
  }
  const dates = {
    created: order.date || today,
    inProgress: "",
    waitingClient: "",
    agreed: "",
    paymentWaiting: "",
    warehouse: "",
    picked: "",
    delivery: "",
    delivered: "",
    completed: "",
    paid: "",
    upsell: "",
    aftersale: "",
    repeat: "",
    cancelled: "",
    ...(order.dates || {})
  };
  const issues = marketplaceOrderMissingFields(order);
  openModal(`Зміна замовлення ${order.externalOrderId}`, `
    ${renderMarketplaceOrderControlActions(order)}
    ${renderOrderStatusRuleCard(order)}
    ${renderOrderIssueSummary(order)}
    <form class="form-grid" data-action="update-marketplace-order">
      <input type="hidden" name="id" value="${escapeHtml(order.id)}">
      <label class="${orderFieldClass(issues, ["date"])}"><span>Дата замовлення</span><input name="date" type="date" value="${escapeHtml(order.date || today)}"></label>
      <label class="${orderFieldClass(issues, ["marketplace"])}"><span>Маркетплейс</span><select name="marketplace">${marketplaceNames().map((name) => option(name, name, name === order.marketplace)).join("")}</select></label>
      <label class="field"><span>Статус</span><select name="status">${marketplaceOrderStatusOptions(order.status)}</select></label>
      <label class="${orderFieldClass(issues, ["manager"])}"><span>Менеджер</span><select name="manager">${employeeOptions(order.manager)}</select></label>
      <label class="${orderFieldClass(issues, ["productId"], "field wide")}"><span>Товар</span><select name="productId">${state.products.map((product) => option(product.id, `${product.brand} ${product.model}`, product.id === order.productId)).join("")}</select></label>
      <label class="${orderFieldClass(issues, ["sku"])}"><span>SKU</span><input name="sku" value="${escapeHtml(order.sku || "")}"></label>
      <label class="${orderFieldClass(issues, ["qty"])}"><span>Кількість</span><input name="qty" type="number" min="1" value="${order.qty || 1}"></label>
      <label class="${orderFieldClass(issues, ["price"])}"><span>Ціна</span><input name="price" inputmode="decimal" value="${escapeHtml(order.price || 0)}"></label>
      <label class="${orderFieldClass(issues, ["currency"])}"><span>Валюта</span><select name="currency">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === order.currency)).join("")}</select></label>
      <label class="${orderFieldClass(issues, ["buyerName"])}"><span>Покупець</span><input name="buyerName" value="${escapeHtml(order.buyer?.name || "")}"></label>
      <label class="${orderFieldClass(issues, ["buyerContact"])}"><span>Телефон</span><input name="buyerPhone" value="${escapeHtml(order.buyer?.phone || "")}"></label>
      <label class="${orderFieldClass(issues, ["buyerContact"])}"><span>Email</span><input name="buyerEmail" value="${escapeHtml(order.buyer?.email || "")}"></label>
      <label class="field"><span>ЄДРПОУ / ІПН</span><input name="buyerEdrpou" value="${escapeHtml(order.buyer?.edrpou || "")}"></label>
      <label class="${orderFieldClass(issues, ["deliveryAddress"], "field full")}"><span>Адреса покупця</span><input name="buyerAddress" value="${escapeHtml(order.buyer?.address || "")}"></label>
      <label class="${orderFieldClass(issues, ["deliveryService"])}"><span>Служба доставки</span><select name="deliveryService">${variantOptions("delivery", delivery.service)}</select></label>
      <label class="${orderFieldClass(issues, ["deliveryCity"])}"><span>Місто</span><input name="deliveryCity" value="${escapeHtml(delivery.city || "")}"></label>
      <label class="${orderFieldClass(issues, ["deliveryAddress"])}"><span>Відділення</span><input name="deliveryWarehouse" value="${escapeHtml(delivery.warehouse || "")}"></label>
      <label class="${orderFieldClass(issues, ["deliveryTtn"])}"><span>ТТН</span><input name="deliveryTtn" value="${escapeHtml(delivery.ttn || "")}"></label>
      <label class="field"><span>Статус доставки</span><select name="deliveryStatus">${deliveryStatusOptions(delivery.status || "new")}</select></label>
      <label class="${orderFieldClass(issues, ["paymentStatus"])}"><span>Статус оплати</span><select name="paymentStatus">${["expected", "pending", "paid", "failed"].map((status) => option(status, marketplacePaymentStatusPill(status).replace(/<[^>]+>/g, ""), status === payment.status)).join("")}</select></label>
      <label class="${orderFieldClass(issues, ["paymentAmount"])}"><span>Сума оплати</span><input name="paymentAmount" inputmode="decimal" value="${escapeHtml(payment.amount || order.qty * order.price || 0)}"></label>
      <label class="${orderFieldClass(issues, ["paymentSource"])}"><span>Джерело оплати</span><input name="paymentSource" value="${escapeHtml(payment.source || "")}"></label>
      <label class="${orderFieldClass(issues, ["paymentMethod"])}"><span>Метод оплати</span><input name="paymentMethod" value="${escapeHtml(payment.method || "")}"></label>
      <label class="${orderFieldClass(issues, ["date:created"])}"><span>Створено</span><input name="createdDate" type="date" value="${escapeHtml(dates.created || "")}"></label>
      <label class="${orderFieldClass(issues, ["date:inProgress"])}"><span>В роботі</span><input name="inProgressDate" type="date" value="${escapeHtml(dates.inProgress || "")}"></label>
      <label class="${orderFieldClass(issues, ["date:waitingClient"])}"><span>Очікує клієнта</span><input name="waitingClientDate" type="date" value="${escapeHtml(dates.waitingClient || "")}"></label>
      <label class="${orderFieldClass(issues, ["date:agreed"])}"><span>Погоджено</span><input name="agreedDate" type="date" value="${escapeHtml(dates.agreed || "")}"></label>
      <label class="${orderFieldClass(issues, ["date:paymentWaiting"])}"><span>Очікує оплату</span><input name="paymentWaitingDate" type="date" value="${escapeHtml(dates.paymentWaiting || "")}"></label>
      <label class="${orderFieldClass(issues, ["date:warehouse"])}"><span>На склад</span><input name="warehouseDate" type="date" value="${escapeHtml(dates.warehouse || "")}"></label>
      <label class="${orderFieldClass(issues, ["date:picked"])}"><span>Зібрано</span><input name="pickedDate" type="date" value="${escapeHtml(dates.picked || "")}"></label>
      <label class="${orderFieldClass(issues, ["date:delivery"])}"><span>На доставку</span><input name="deliveryDate" type="date" value="${escapeHtml(dates.delivery || "")}"></label>
      <label class="${orderFieldClass(issues, ["date:delivered"])}"><span>Вручено</span><input name="deliveredDate" type="date" value="${escapeHtml(dates.delivered || "")}"></label>
      <label class="${orderFieldClass(issues, ["date:completed"])}"><span>Завершено</span><input name="completedDate" type="date" value="${escapeHtml(dates.completed || "")}"></label>
      <label class="${orderFieldClass(issues, ["date:paid"])}"><span>Оплачено</span><input name="paidDate" type="date" value="${escapeHtml(dates.paid || payment.paidAt || "")}"></label>
      <label class="${orderFieldClass(issues, ["date:upsell"])}"><span>Апсел</span><input name="upsellDate" type="date" value="${escapeHtml(dates.upsell || "")}"></label>
      <label class="${orderFieldClass(issues, ["date:aftersale"])}"><span>Follow-up</span><input name="aftersaleDate" type="date" value="${escapeHtml(dates.aftersale || "")}"></label>
      <label class="${orderFieldClass(issues, ["date:repeat"])}"><span>Повторний продаж</span><input name="repeatDate" type="date" value="${escapeHtml(dates.repeat || "")}"></label>
      <label class="${orderFieldClass(issues, ["date:cancelled"])}"><span>Скасовано</span><input name="cancelledDate" type="date" value="${escapeHtml(dates.cancelled || "")}"></label>
      <p class="notice warn small full">Якщо накладна вже створена, зміна товару, кількості або ціни у замовленні не змінює проведену накладну. Для цього використовуйте зміну накладної або коригування.</p>
      <button class="primary" type="submit">Зберегти замовлення</button>
    </form>
  `);
}

function refreshMarketplaceOrderAfterAction(id) {
  const form = document.querySelector('.modal-backdrop [data-action="update-marketplace-order"]');
  const shouldRefreshModal = form?.elements?.id?.value === id;
  if (shouldRefreshModal) {
    form.closest(".modal-backdrop")?.remove();
    render();
    editMarketplaceOrderDocument(id);
    return;
  }
  render();
}

function updateMarketplaceOrderDocument(form) {
  const data = formData(form);
  const order = byId(state.marketplaceOrders, data.id);
  if (!order) return alert("Замовлення маркетплейсу не знайдено.");
  if (!canEditMarketplaceOrder()) return alert("Поточна роль не має права змінювати замовлення маркетплейсів.");
  const previousStatus = order.status;
  order.date = data.date || order.date;
  order.marketplace = data.marketplace;
  order.status = normalizeMarketplaceOrderStatus(data.status);
  order.manager = data.manager;
  order.productId = data.productId;
  order.sku = data.sku;
  order.qty = Number(data.qty || 1);
  order.price = Number(data.price || 0);
  order.currency = data.currency;
  order.buyer = {
    name: data.buyerName || "",
    phone: data.buyerPhone || "",
    email: data.buyerEmail || "",
    edrpou: data.buyerEdrpou || "",
    address: data.buyerAddress || ""
  };
  order.delivery = {
    ...(order.delivery || {}),
    service: data.deliveryService,
    city: data.deliveryCity || "",
    warehouse: data.deliveryWarehouse || "",
    ttn: data.deliveryTtn || "",
    status: data.deliveryStatus,
    apiStatus: order.delivery?.apiStatus || "Змінено менеджером"
  };
  order.payment = {
    ...(order.payment || {}),
    status: data.paymentStatus,
    amount: Number(data.paymentAmount || 0),
    source: data.paymentSource || "",
    method: data.paymentMethod || "",
    paidAt: data.paidDate || order.payment?.paidAt || ""
  };
  order.dates = {
    created: data.createdDate || order.date,
    inProgress: data.inProgressDate || "",
    waitingClient: data.waitingClientDate || "",
    agreed: data.agreedDate || "",
    paymentWaiting: data.paymentWaitingDate || "",
    warehouse: data.warehouseDate || "",
    picked: data.pickedDate || "",
    delivery: data.deliveryDate || "",
    delivered: data.deliveredDate || "",
    completed: data.completedDate || "",
    paid: data.paidDate || "",
    upsell: data.upsellDate || "",
    aftersale: data.aftersaleDate || "",
    repeat: data.repeatDate || "",
    cancelled: data.cancelledDate || ""
  };
  const changedDateKey = funnelDateKey(order.status);
  if (previousStatus !== order.status && changedDateKey && !order.dates[changedDateKey]) order.dates[changedDateKey] = today;
  if (order.status === "waiting_payment" && order.payment.status === "expected") order.payment.status = "pending";
  if (statusAtLeast(order.status, "paid") && order.status !== "cancelled" && order.payment.status !== "paid") order.payment.status = "paid";
  if (order.payment.status === "paid" && !order.dates.paid) order.dates.paid = today;
  if (order.payment.status === "paid" && !statusAtLeast(order.status, "paid")) order.status = "paid";
  const stage = salesFunnelStage(order.status);
  const stageStartedAt = previousStatus !== order.status
    ? nowIso()
    : (order.workflow?.stageStartedAt || dateToIso(order.dates[funnelDateKey(order.status)] || order.date || today));
  order.workflow = {
    ...(order.workflow || {}),
    stage: order.status,
    stageStartedAt,
    reminderAt: addHoursIso(stageStartedAt, stage.slaHours),
    nextAction: stage.reminder
  };
  addAudit(`Змінено замовлення маркетплейсу ${order.externalOrderId}`);
  document.querySelector(".modal-backdrop")?.remove();
  render();
}

function waitMarketplaceClientConfirmation(id) {
  if (!canChangeMarketplaceOrderStatus()) return alert("Поточна роль не має права змінювати статус замовлення маркетплейсу.");
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  if (order.status === "cancelled") return alert("Скасоване замовлення не можна переводити в очікування клієнта.");
  setMarketplaceOrderWorkflowStage(order, "waiting_client");
  addAudit(`Замовлення ${order.externalOrderId} переведено в очікування підтвердження клієнта`);
  refreshMarketplaceOrderAfterAction(order.id);
}

function agreeMarketplaceOrder(id) {
  if (!canChangeMarketplaceOrderStatus()) return alert("Поточна роль не має права змінювати статус замовлення маркетплейсу.");
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  ensureClientFromMarketplaceOrder(order);
  setMarketplaceOrderWorkflowStage(order, "confirmed_by_client");
  addAudit(`Замовлення ${order.externalOrderId} узгоджено з покупцем`);
  refreshMarketplaceOrderAfterAction(order.id);
}

function waitMarketplacePayment(id) {
  if (!canChangeMarketplaceOrderStatus()) return alert("Поточна роль не має права змінювати статус замовлення маркетплейсу.");
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  if (!statusAtLeast(order.status, "confirmed_by_client") || order.status === "cancelled") return alert("Спочатку підтвердіть замовлення з клієнтом.");
  setMarketplaceOrderWorkflowStage(order, "waiting_payment");
  order.payment = {
    ...(order.payment || {}),
    status: order.payment?.status === "paid" ? "paid" : "pending",
    apiStatus: order.payment?.status === "paid" ? "Оплата вже підтверджена" : "Очікує оплату або перевірку"
  };
  addAudit(`Замовлення ${order.externalOrderId} очікує оплату`);
  refreshMarketplaceOrderAfterAction(order.id);
}

function sendMarketplaceOrderToWarehouse(id) {
  if (!canSendMarketplaceOrderToWarehouse()) return alert("Поточна роль не має права передавати замовлення на склад.");
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  if (!statusAtLeast(order.status, "confirmed_by_client") || order.status === "cancelled") return alert("Спочатку підтвердіть замовлення з клієнтом.");
  order.delivery = { ...(order.delivery || {}) };
  order.warehouseFlow = { ...(order.warehouseFlow || {}) };
  setMarketplaceOrderWorkflowStage(order, "picking");
  order.warehouseStatus = "reserved";
  order.delivery.status = order.delivery.status === "delivered" ? "delivered" : "sent_to_warehouse";
  order.delivery.apiStatus = "Замовлення передано на склад для комплектації";
  order.warehouseFlow.warehouseSentAt = currentTimestamp();
  order.warehouseFlow.warehouseSentBy = state.currentManager;
  addAudit(`Замовлення ${order.externalOrderId} передано на склад`);
  refreshMarketplaceOrderAfterAction(order.id);
}

function markMarketplacePicked(id) {
  if (!canConfirmMarketplacePicking()) return alert("Поточна роль не має права підтверджувати комплектацію замовлення.");
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  if (!statusAtLeast(order.status, "picking") || order.status === "cancelled") return alert("Спочатку передайте замовлення на комплектацію.");
  order.delivery = { ...(order.delivery || {}) };
  order.warehouseFlow = { ...(order.warehouseFlow || {}) };
  setMarketplaceOrderWorkflowStage(order, "picked");
  order.warehouseStatus = "picked";
  order.delivery.status = order.delivery.status === "delivered" ? "delivered" : "picked";
  order.delivery.apiStatus = "Завскладом підтвердив відбірку";
  order.warehouseFlow.pickingConfirmedAt = currentTimestamp();
  order.warehouseFlow.pickingConfirmedBy = state.currentManager;
  addAudit(`Завскладом підтвердив відбірку ${order.externalOrderId}`);
  refreshMarketplaceOrderAfterAction(order.id);
}

function marketplaceTtnPrefix(service = "") {
  if (service.includes("Нова")) return "NP";
  if (service.includes("Укр")) return "UP";
  if (service.includes("Міст")) return "ME";
  if (service.includes("Спец")) return "SZ";
  return "TTN";
}

function generateMarketplaceTtn(order) {
  return `${marketplaceTtnPrefix(order.delivery?.service)}-${today.replaceAll("-", "")}-${String(Date.now()).slice(-6)}`;
}

function handoverMarketplaceOrderToDelivery(id) {
  if (!canHandoverMarketplaceOrderToLogistics()) return alert("Поточна роль не має права передавати замовлення логісту.");
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  if (!statusAtLeast(order.status, "picked") || order.status === "cancelled") return alert("Спочатку завскладом має підтвердити відбірку.");
  order.delivery = { ...(order.delivery || {}) };
  order.warehouseFlow = { ...(order.warehouseFlow || {}) };
  order.delivery.status = "warehouse_handover";
  order.delivery.ttn = order.delivery.ttn || generateMarketplaceTtn(order);
  order.delivery.apiStatus = "Склад передав замовлення логісту, очікує підтвердження логіста";
  order.warehouseFlow.deliveryHandoverAt = currentTimestamp();
  order.warehouseFlow.deliveryHandoverBy = state.currentManager;
  addAudit(`Замовлення ${order.externalOrderId} передано логісту, ТТН ${order.delivery.ttn}`, "system");
  refreshMarketplaceOrderAfterAction(order.id);
}

function sendMarketplaceOrderToDelivery(id) {
  if (!canAcceptMarketplaceOrderLogistics()) return alert("Поточна роль не має права передавати замовлення в доставку.");
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  if (!statusAtLeast(order.status, "picked") || order.status === "cancelled") return alert("Спочатку завскладом має підтвердити відбірку.");
  order.delivery = { ...(order.delivery || {}) };
  order.warehouseFlow = { ...(order.warehouseFlow || {}) };
  if (order.delivery.status !== "warehouse_handover") return alert("Спочатку склад має передати замовлення логісту.");
  setMarketplaceOrderWorkflowStage(order, "shipped");
  order.delivery.status = "logistics_accepted";
  order.delivery.ttn = order.delivery.ttn || generateMarketplaceTtn(order);
  order.delivery.trackingProvider = deliveryProviderKey(order.delivery.service || "");
  order.delivery.apiStatus = "Логіст підтвердив передачу, готово до API-трекінгу";
  order.delivery.lastCheck = currentTimestamp();
  order.warehouseFlow.logisticsAcceptedAt = currentTimestamp();
  order.warehouseFlow.logisticsAcceptedBy = state.currentManager;
  addAudit(`Логіст підтвердив передачу замовлення ${order.externalOrderId} в доставку, ТТН ${order.delivery.ttn}`, "system");
  refreshMarketplaceOrderAfterAction(order.id);
}

function trackMarketplaceDelivery(id) {
  if (!canTrackMarketplaceDelivery()) return alert("Поточна роль не має права відстежувати доставку.");
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  order.delivery = { ...(order.delivery || {}) };
  if (!order.delivery.ttn) return alert("Для API-відстеження потрібно внести або створити ТТН.");
  if (["new", "sent_to_warehouse", "picked", "warehouse_handover"].includes(order.delivery.status || "new")) return alert("Спочатку логіст має підтвердити передачу в доставку.");
  if (order.status === "cancelled") return alert("Скасоване замовлення не можна переводити в доставлено.");
  const provider = deliveryProviderForOrder(order);
  order.delivery.lastCheck = currentTimestamp();
  order.delivery.trackingProvider = deliveryProviderKey(order.delivery.service || "");
  if (provider.enabled && !provider.apiKey) {
    order.delivery.status = "delivery_problem";
    order.delivery.apiStatus = `${provider.provider}: API_FAIL_NO_KEY - не заповнений ключ API`;
    addAudit(`API доставки не перевірив ${order.externalOrderId}: API_FAIL_NO_KEY`, "system");
    refreshMarketplaceOrderAfterAction(order.id);
    return;
  }
  const nextStatus = {
    logistics_accepted: "sent_to_delivery",
    sent_to_delivery: "in_transit",
    in_transit: "arrived_branch",
    arrived_branch: "delivered",
    delivered: "delivered",
    delivery_problem: "delivery_problem"
  };
  order.delivery.status = nextStatus[order.delivery.status] || "sent_to_delivery";
  order.delivery.apiStatus = provider.enabled
    ? `${provider.provider}: статус оновлено через API`
    : `${provider.provider}: тестове відстеження CRM, API не увімкнено`;
  if (order.delivery.status === "delivered" && !MARKETPLACE_FINAL_STATUSES.includes(order.status)) setMarketplaceOrderWorkflowStage(order, "delivered");
  addAudit(`API доставки оновив статус ${order.externalOrderId}: ${deliveryStatusLabel(order.delivery.status)} за ТТН ${order.delivery.ttn}`, "system");
  refreshMarketplaceOrderAfterAction(order.id);
}

function createInvoiceFromMarketplaceOrder(id) {
  if (!canManageMarketplaceOrder()) return alert("Поточна роль не має права створювати накладну із замовлення маркетплейсу.");
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  if (order.invoiceId) return alert("Накладна вже створена.");
  if (!statusAtLeast(order.status, "confirmed_by_client") || order.status === "cancelled") return alert("Спочатку підтвердіть замовлення з клієнтом.");
  const product = byId(state.products, order.productId);
  if (!product) return alert("Товар не знайдено.");
  if (product.type === "weapon") return alert("Для зброї автоматична накладна з маркетплейсу заблокована: потрібно вибрати серії та внести дозвіл покупця у продажі.");
  const invoiceWarehouseId = "wh-main";
  const invoiceFirmId = "fop";
  if (productAvailableQty(product.id, invoiceWarehouseId, invoiceFirmId) < Number(order.qty || 1)) return alert(`Недостатньо залишку для створення накладної: ${productName(product.id)} · ${warehouseName(invoiceWarehouseId)} · ${firmName(invoiceFirmId)}.`);
  const client = ensureClientFromMarketplaceOrder(order);
  const total = Number(order.qty || 1) * Number(order.price || 0);
  const invoice = {
    id: `inv-${String(Date.now()).slice(-8)}`,
    date: today,
    documentType: "Видаткова накладна",
    contract: order.externalOrderId,
    warehouseId: invoiceWarehouseId,
    firmId: invoiceFirmId,
    channel: order.marketplace,
    clientId: client.id,
    manager: order.manager,
    priceType: "Маркетплейс",
    currency: order.currency,
    total,
    paid: order.payment.status === "paid" ? total : 0,
    discount: 0,
    dueDate: today,
    cashArticle: "Продаж товарів",
    accounting: false,
    locked: false,
    status: order.payment.status === "paid" ? "paid" : "draft",
    lines: [{ productId: product.id, qty: Number(order.qty || 1), price: Number(order.price || 0), currency: order.currency, serialId: "", permitNumber: "", permitDate: "" }],
    delivery: order.delivery.service,
    deliveryPayer: "Маркетплейс",
    ttn: order.delivery.ttn,
    comment: `Маркетплейс ${order.marketplace}, замовлення ${order.externalOrderId}`
  };
  decrementStock(product.id, order.qty, invoiceWarehouseId, invoiceFirmId);
  state.invoices.unshift(invoice);
  order.invoiceId = invoice.id;
  if (!statusAtLeast(order.status, "picking")) setMarketplaceOrderWorkflowStage(order, "picking");
  order.warehouseStatus = "reserved";
  order.dates = {
    ...(order.dates || {}),
    created: order.date || today,
    inProgress: order.dates?.inProgress || "",
    waitingClient: order.dates?.waitingClient || "",
    agreed: order.dates?.agreed || today,
    paymentWaiting: order.dates?.paymentWaiting || "",
    warehouse: order.dates?.warehouse || today,
    picked: order.dates?.picked || "",
    delivery: order.dates?.delivery || "",
    delivered: order.dates?.delivered || "",
    completed: order.dates?.completed || "",
    paid: order.dates?.paid || "",
    upsell: order.dates?.upsell || "",
    aftersale: order.dates?.aftersale || "",
    repeat: order.dates?.repeat || "",
    cancelled: order.dates?.cancelled || ""
  };
  if (order.payment.status === "paid") addMarketplacePaymentIfMissing(order, invoice);
  addAudit(`Створено накладну ${invoice.id} з маркетплейс-замовлення ${order.externalOrderId}`);
  render();
}

function addMarketplacePaymentIfMissing(order, invoice) {
  if (state.payments.some((payment) => payment.invoiceId === invoice.id && payment.bankRef === order.payment.source)) return;
  state.payments.unshift({
    id: `pay-${String(Date.now()).slice(-6)}`,
    invoiceId: invoice.id,
    date: today,
    amount: invoice.total,
    currency: invoice.currency,
    rate: uahRate(invoice.currency),
    rateMode: "settings",
    paymentKind: "invoice",
    advance: false,
    clientId: invoice.clientId,
    firmId: invoice.firmId,
    source: "bank",
    terminalId: "",
    prro: false,
    method: "Маркетплейс / поштовий сервіс",
    bankRef: order.payment.source
  });
}

function marketplaceOrderPaymentRecords(order) {
  return state.payments.filter((payment) => (
    payment.marketplaceOrderId === order.id
    || (order.invoiceId && payment.invoiceId === order.invoiceId)
    || payment.bankRef === `${order.marketplace} ${order.externalOrderId}`
  ));
}

function marketplaceOrderPaidAmount(order) {
  return marketplaceOrderPaymentRecords(order).reduce((sum, payment) => {
    return sum + convertMoney(payment.amount, payment.currency, order.currency || "UAH");
  }, 0);
}

function marketplaceOrderPaymentDue(order) {
  if (order.payment?.status === "paid") return 0;
  const invoice = byId(state.invoices, order.invoiceId);
  if (invoice) return Math.max(0, invoiceDebt(invoice));
  return Math.max(0, Number(order.payment?.amount || marketplaceOrderTotal(order)) - marketplaceOrderPaidAmount(order));
}

function openMarketplaceOrderPaymentForm(id) {
  if (!canCreateDocument("payment")) return alert("Поточна роль не має права створювати оплати.");
  if (!canEditField("payment")) return alert("Поточна роль не має права змінювати поля оплати.");
  const order = byId(state.marketplaceOrders, id);
  if (!order) return alert("Замовлення маркетплейсу не знайдено.");
  if (order.status === "cancelled") return alert("Скасоване замовлення не можна оплатити.");
  const invoice = byId(state.invoices, order.invoiceId);
  const due = marketplaceOrderPaymentDue(order) || Number(order.payment?.amount || marketplaceOrderTotal(order));
  const firmId = invoice?.firmId || state.settings.firms[0]?.id || "";
  const defaultPaymentSource = ["cash", "bank", "card"].includes(order.payment?.source) ? order.payment.source : "bank";
  const terminalOptions = paymentTerminalsForFirm(firmId).map((terminal) => option(terminal.id, `${terminal.name} · ${firmName(terminal.firmId)}`, false)).join("");
  openModal(`Оплата замовлення ${order.externalOrderId}`, `
    <form class="form-grid" data-action="create-marketplace-order-payment">
      <input type="hidden" name="orderId" value="${escapeHtml(order.id)}">
      <div class="notice small full">
        <strong>${escapeHtml(order.marketplace)} · ${escapeHtml(order.externalOrderId)}</strong><br>
        Покупець: ${escapeHtml(marketplaceOrderBuyer(order).name || "-")} · до оплати ${formatMoney(due, order.currency || "UAH")}
        ${invoice ? `<br>Накладна: ${escapeHtml(invoice.id)}, борг ${formatMoney(invoiceDebt(invoice), invoice.currency)}` : "<br>Накладної ще немає: оплата буде прив'язана напряму до замовлення."}
      </div>
      <label class="field"><span>Дата оплати</span><input name="date" type="date" value="${today}"></label>
      <label class="field"><span>Сума</span><input name="amount" inputmode="decimal" value="${escapeHtml(due)}"></label>
      <label class="field"><span>Валюта</span><select name="currency">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === (order.currency || "UAH"))).join("")}</select></label>
      <label class="field"><span>Джерело</span><select name="paymentSource">${variantOptions("paymentSources", defaultPaymentSource)}</select></label>
      <label class="field wide"><span>Фірма зарахування</span><select name="firmId">${state.settings.firms.map((firm) => option(firm.id, firm.name, firm.id === firmId)).join("")}</select></label>
      <label class="field wide"><span>Термінал</span><select name="terminalId"><option value="">Без термінала</option>${terminalOptions}</select></label>
      <label class="field"><span>ПРРО</span><select name="prro">${option("true", "Проводити ПРРО", false)}${option("false", "Без ПРРО", true)}</select></label>
      <label class="field wide"><span>Референс</span><input name="bankRef" value="${escapeHtml(order.payment?.source || `${order.marketplace} ${order.externalOrderId}`)}"></label>
      <label class="field"><span>Статус замовлення</span><select name="paymentStatus">${option("paid", "Перевести в оплачено", true)}${option("pending", "Залишити на перевірці", false)}</select></label>
      <button class="primary" type="submit">Створити оплату</button>
    </form>
  `);
}

function createMarketplaceOrderPayment(form) {
  if (!canCreateDocument("payment")) return alert("Поточна роль не має права створювати оплати.");
  if (!canEditField("payment")) return alert("Поточна роль не має права змінювати поля оплати.");
  const data = formData(form);
  const order = byId(state.marketplaceOrders, data.orderId);
  if (!order) return alert("Замовлення маркетплейсу не знайдено.");
  if (order.status === "cancelled") return alert("Скасоване замовлення не можна оплатити.");
  const amount = parseDecimal(data.amount, 0);
  if (amount <= 0) return alert("Сума оплати має бути більшою за нуль.");
  if (data.paymentSource === "card" && !data.terminalId) return alert("Для оплати карткою потрібно вибрати термінал.");
  const client = ensureClientFromMarketplaceOrder(order);
  const invoice = byId(state.invoices, order.invoiceId);
  const customRate = uahRate(data.currency);
  const payment = {
    id: `pay-${String(Date.now()).slice(-6)}`,
    invoiceId: invoice?.id || "",
    marketplaceOrderId: order.id,
    externalOrderId: order.externalOrderId,
    marketplace: order.marketplace,
    date: data.date || today,
    amount,
    currency: data.currency || order.currency || "UAH",
    rate: customRate,
    rateMode: "settings",
    method: paymentMethodFromSource(data.paymentSource),
    source: data.paymentSource,
    paymentKind: invoice ? "invoice" : "marketplaceOrder",
    advance: false,
    clientId: client.id,
    firmId: data.firmId || invoice?.firmId || state.settings.firms[0]?.id || "",
    terminalId: data.paymentSource === "card" ? data.terminalId : "",
    prro: data.paymentSource === "cash" ? data.prro === "true" : false,
    bankRef: data.bankRef || `${order.marketplace} ${order.externalOrderId}`
  };
  state.payments.unshift(payment);
  if (invoice) {
    const paidInInvoiceCurrency = convertMoney(amount, payment.currency, invoice.currency);
    invoice.paid = Math.min(invoice.total, Number(invoice.paid || 0) + paidInInvoiceCurrency);
    invoice.status = invoice.paid >= invoice.total ? "paid" : "partial";
  }
  order.payment = {
    ...(order.payment || {}),
    status: data.paymentStatus === "pending" ? "pending" : "paid",
    amount: Number(order.payment?.amount || marketplaceOrderTotal(order)),
    source: payment.bankRef,
    method: payment.method,
    apiStatus: data.paymentStatus === "pending" ? "Оплату створено в CRM, очікує перевірку" : "Оплата створена вручну в CRM",
    lastCheck: currentTimestamp(),
    paidAt: data.paymentStatus === "pending" ? (order.payment?.paidAt || "") : (data.date || today)
  };
  if (order.payment.status === "paid" && !statusAtLeast(order.status, "paid")) {
    setMarketplaceOrderWorkflowStage(order, "paid");
  }
  addAudit(`Створено оплату ${payment.id} по маркетплейс-замовленню ${order.externalOrderId}: ${formatMoney(amount, payment.currency)}`);
  document.querySelector(".modal-backdrop")?.remove();
  render();
}

function pullMarketplacePayment(id) {
  if (!canTrackMarketplacePayment()) return alert("Поточна роль не має права підтягувати оплату маркетплейсу.");
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  if (order.status === "cancelled") return alert("Скасоване замовлення не можна переводити в оплачено.");
  order.payment.status = "paid";
  order.payment.apiStatus = "Оплата підтверджена API маркетплейсу або поштового сервісу";
  order.payment.lastCheck = currentTimestamp();
  order.payment.paidAt = today;
  if (!statusAtLeast(order.status, "paid")) setMarketplaceOrderWorkflowStage(order, "paid");
  if (order.invoiceId) {
    const invoice = byId(state.invoices, order.invoiceId);
    if (invoice && invoice.paid < invoice.total) {
      invoice.paid = invoice.total;
      invoice.status = "paid";
      addMarketplacePaymentIfMissing(order, invoice);
    }
  } else if (!state.payments.some((payment) => payment.marketplaceOrderId === order.id)) {
    const source = ["cash", "bank", "card"].includes(order.payment?.source) ? order.payment.source : "bank";
    const client = ensureClientFromMarketplaceOrder(order);
    state.payments.unshift({
      id: `pay-${String(Date.now()).slice(-6)}`,
      invoiceId: "",
      marketplaceOrderId: order.id,
      externalOrderId: order.externalOrderId,
      marketplace: order.marketplace,
      date: today,
      amount: Number(order.payment?.amount || marketplaceOrderTotal(order)),
      currency: order.currency || "UAH",
      rate: uahRate(order.currency || "UAH"),
      rateMode: "settings",
      method: order.payment?.method || paymentMethodFromSource(source),
      source,
      paymentKind: "marketplaceOrder",
      advance: false,
      clientId: client.id,
      firmId: state.settings.firms[0]?.id || "",
      terminalId: "",
      prro: false,
      bankRef: order.payment?.source || `${order.marketplace} ${order.externalOrderId}`
    });
  }
  addAudit(`Підтягнуто оплату по маркетплейс-замовленню ${order.externalOrderId}`, "system");
  refreshMarketplaceOrderAfterAction(order.id);
}

function trackMarketplacePayment(id) {
  pullMarketplacePayment(id);
}

function recordCommunicationEvent(event) {
  state.communicationEvents = Array.isArray(state.communicationEvents) ? state.communicationEvents : [];
  state.communicationEvents.unshift({
    id: uniqueId("comm"),
    at: currentTimestamp(),
    manager: state.currentManager,
    status: "зафіксовано в CRM",
    ...event
  });
}

async function postRozetkaMessageReply(question, text, sendEmailUser = false) {
  if (!question.chatId) throw new Error("У питання немає chat_id для відповіді через Rozetka API.");
  if (!question.receiverId) throw new Error("У питання немає receiver_id покупця для /messages/create.");
  const orderId = String(question.externalOrderId || "").replace(/^RZ-/i, "");
  const payload = {
    body: text,
    chat_id: Number(question.chatId),
    order_id: Number(orderId) || null,
    receiver_id: Number(question.receiverId),
    sendEmailUser: sendEmailUser ? 1 : 0
  };
  const response = await fetch("/api/rozetka/messages/create", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success === false || result.ok === false) {
    const error = new Error(result.error || result?.errors?.message || `HTTP ${response.status}`);
    error.code = result.code || result?.errors?.code || response.status;
    throw error;
  }
  return result;
}

async function replyMarketplaceQuestion(form) {
  if (!canContactMarketplaceBuyer() || !canCreateDocument("marketplaceCustomerQuestions")) return alert("Поточна роль не має права відповідати на питання маркетплейсу.");
  const data = formData(form);
  const question = byId(state.marketplaceCustomerQuestions || [], data.questionId);
  if (!question) return alert("Питання не знайдено.");
  const answer = String(data.answer || "").trim();
  if (!answer) return alert("Вкажіть відповідь менеджера.");
  let apiStatus = "відповідь зафіксована в CRM";
  if (data.sendApi === "true") {
    const result = await postRozetkaMessageReply(question, answer, data.sendEmailUser === "1");
    apiStatus = `відправлено через /messages/create${result?.content?.status !== undefined ? `, статус ${result.content.status}` : ""}`;
  }
  question.answer = answer;
  question.answeredAt = currentTimestamp();
  question.updatedAt = currentTimestamp();
  question.status = data.status || "answered";
  question.manager = state.currentManager;
  question.apiStatus = apiStatus;
  recordCommunicationEvent({
    type: "message",
    channel: "marketplace",
    orderId: question.orderId || marketplaceQuestionOrder(question)?.id || "",
    externalOrderId: question.externalOrderId || "",
    receiver: question.buyerName || "",
    text: answer,
    status: apiStatus,
    manager: state.currentManager
  });
  addAudit(`${question.marketplace}: відповідь на ${marketplaceCustomerQuestionTypeLabel(question.sourceType)} ${question.externalOrderId || question.externalId}`, state.currentManager);
  form.closest(".modal-backdrop")?.remove();
  render();
}

function replyMarketplaceThread(form) {
  if (!canContactMarketplaceBuyer() || !canCreateDocument("marketplaceServiceThreads")) return alert("Поточна роль не має права відповідати маркетплейсу.");
  const data = formData(form);
  const thread = byId(state.marketplaceServiceThreads || [], data.threadId);
  if (!thread) return alert("Звернення не знайдено.");
  const answer = String(data.answer || "").trim();
  if (!answer) return alert("Вкажіть відповідь або коментар.");
  thread.answer = answer;
  thread.answeredAt = currentTimestamp();
  thread.updatedAt = currentTimestamp();
  thread.status = data.status || "waiting_marketplace";
  thread.manager = state.currentManager;
  thread.apiStatus = "відповідь зафіксована в CRM; очікує синхронізації з маркетплейсом";
  addAudit(`${thread.marketplace}: відповідь у переписці з маркетплейсом ${thread.externalId || thread.requestId}`, state.currentManager);
  form.closest(".modal-backdrop")?.remove();
  render();
}

function externalCommunicationUrl(channel, receiver, text = "", order = {}) {
  const encodedText = encodeURIComponent(text || "");
  const phone = cleanPhone(receiver);
  const phoneNoPlus = messengerPhone(receiver);
  if (channel === "phone" || channel === "ip_telephony") return phone ? `tel:${phone}` : "";
  if (channel === "viber") return phone ? `viber://chat?number=${encodeURIComponent(phone)}` : "";
  if (channel === "sms") return phone ? `sms:${phone}?body=${encodedText}` : "";
  if (channel === "email") return receiver ? `mailto:${encodeURIComponent(receiver)}?subject=${encodeURIComponent(`Замовлення ${order.externalOrderId || ""}`)}&body=${encodedText}` : "";
  if (channel === "whatsapp") return phoneNoPlus ? `https://wa.me/${encodeURIComponent(phoneNoPlus)}?text=${encodedText}` : "";
  if (channel === "telegram") return `https://t.me/share/url?url=&text=${encodedText}`;
  return "";
}

function openExternalCommunication(channel, receiver, text = "", order = {}) {
  const url = externalCommunicationUrl(channel, receiver, text, order);
  if (!url) return;
  const opened = window.open(url, "_blank");
  if (!opened && !url.startsWith("http")) window.location.href = url;
}

function sendViberOrderMessage(id, customText = "") {
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  const settings = viberSettings();
  if (!settings.enabled) return alert("Viber вимкнено в налаштуваннях комунікаторів.");
  const receiver = viberReceiver(order);
  if (!receiver) return alert("Для Viber потрібен receiver: Viber user id або тестовий номер покупця.");
  if (settings.mode === "live" && !settings.authToken) {
    return alert("Для бойового Viber API потрібно заповнити X-Viber-Auth-Token у налаштуваннях.");
  }
  const text = customText || fillViberTemplate(settings.defaultTemplate, order);
  state.viberMessages.unshift({
    id: uniqueId("viber"),
    orderId: order.id,
    externalOrderId: order.externalOrderId,
    receiver,
    text,
    senderName: settings.senderName || "Marketplace CRM",
    mode: settings.mode || "test",
    status: settings.mode === "live" ? "queued API" : "test sent",
    at: currentTimestamp(),
    manager: order.manager || state.currentManager
  });
  recordCommunicationEvent({
    type: "message",
    channel: "viber",
    orderId: order.id,
    externalOrderId: order.externalOrderId,
    receiver,
    text,
    status: settings.mode === "live" ? "Viber API: поставлено в чергу" : "Viber test: записано в CRM",
    manager: order.manager || state.currentManager
  });
  order.workflow = order.workflow || normalizeMarketplaceWorkflow(order, order.status || "new_order", order.dates || {});
  order.workflow.lastReminderAt = currentTimestamp();
  addAudit(`Viber ${settings.mode === "live" ? "API" : "test"}: ${order.externalOrderId} → ${receiver}`, "system");
  render();
}

function sendOrderMessage(form) {
  if (!canContactMarketplaceBuyer()) return alert("Поточна роль не має права комунікувати з покупцем.");
  const data = formData(form);
  const order = byId(state.marketplaceOrders, data.orderId);
  if (!order) return alert("Замовлення не знайдено.");
  const channel = data.channel || "viber";
  const receiver = data.receiver || communicationReceiver(order, channel);
  const text = data.message || orderDefaultMessage(order);
  if (!receiver) return alert("Вкажіть одержувача для вибраного комунікатора.");
  if (channel === "viber") {
    form.closest(".modal-backdrop")?.remove();
    sendViberOrderMessage(order.id, text);
    if (data.openExternal === "true") openExternalCommunication(channel, receiver, text, order);
    return;
  }
  recordCommunicationEvent({
    type: "message",
    channel,
    orderId: order.id,
    externalOrderId: order.externalOrderId,
    receiver,
    text,
    status: data.openExternal === "true" ? "відкрито зовнішній додаток" : "записано в CRM",
    manager: order.manager || state.currentManager
  });
  order.workflow = order.workflow || normalizeMarketplaceWorkflow(order, order.status || "new_order", order.dates || {});
  order.workflow.lastReminderAt = currentTimestamp();
  addAudit(`Повідомлення ${communicatorLabel(channel)} по ${order.externalOrderId} → ${receiver}`);
  form.closest(".modal-backdrop")?.remove();
  if (data.openExternal === "true") openExternalCommunication(channel, receiver, text, order);
  render();
}

async function startOrderCallback(form) {
  if (!canContactMarketplaceBuyer()) return alert("Поточна роль не має права комунікувати з покупцем.");
  const data = formData(form);
  const order = byId(state.marketplaceOrders, data.orderId);
  if (!order) return alert("Замовлення не знайдено.");
  const channel = data.channel || "phone";
  const receiver = data.receiver || communicationReceiver(order, channel);
  if (!receiver) return alert("Вкажіть номер або receiver для дзвінка.");
  recordCommunicationEvent({
    type: "call",
    channel,
    orderId: order.id,
    externalOrderId: order.externalOrderId,
    receiver,
    text: data.note || "",
    status: data.openExternal === "true" ? "відкрито дзвінок" : "заплановано/зафіксовано",
    manager: order.manager || state.currentManager
  });
  order.workflow = order.workflow || normalizeMarketplaceWorkflow(order, order.status || "new_order", order.dates || {});
  order.workflow.lastReminderAt = currentTimestamp();
  addAudit(`Передзвонити ${communicatorLabel(channel)} по ${order.externalOrderId} → ${receiver}`);
  form.closest(".modal-backdrop")?.remove();
  if (data.openExternal === "true") openExternalCommunication(channel, receiver, data.note || "", order);
  if (data.recordCall === "true") {
    await startCallRecording(order.id);
  } else {
    render();
  }
}

function openViberChat(id) {
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  const buyer = marketplaceOrderBuyer(order);
  if (!buyer.phone) return alert("У покупця немає телефону для відкриття Viber.");
  const phone = String(buyer.phone).replace(/[^\d+]/g, "");
  window.location.href = `viber://chat?number=${encodeURIComponent(phone)}`;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Не вдалося прочитати аудіо."));
    reader.readAsDataURL(blob);
  });
}

async function startCallRecording(id) {
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  const settings = callRecordingSettings();
  if (!settings.enabled) return alert("Запис розмов вимкнено в налаштуваннях.");
  if (activeCallRecorder) return alert("Вже йде запис іншої розмови. Спочатку натисніть Стоп.");
  if (settings.consentRequired) {
    const confirmed = confirm("Підтвердіть, що покупець попереджений і дав згоду на запис розмови.");
    if (!confirmed) return;
    order.recordingConsent = true;
  }
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    return alert("Браузер не дав доступу до запису. Для LAN потрібен HTTPS або окреме підключення телефонії/API записів.");
  }
  try {
    activeCallStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    activeCallChunks = [];
    activeCallMeta = {
      orderId: order.id,
      externalOrderId: order.externalOrderId,
      buyer: marketplaceOrderBuyer(order).name || "",
      manager: order.manager || state.currentManager,
      startedAt: currentTimestamp(),
      startedIso: nowIso(),
      consent: settings.consentRequired ? order.recordingConsent === true : true
    };
    activeCallRecorder = new MediaRecorder(activeCallStream);
    activeCallRecorder.addEventListener("dataavailable", (event) => {
      if (event.data?.size) activeCallChunks.push(event.data);
    });
    activeCallRecorder.start();
    addAudit(`Почато запис розмови ${order.externalOrderId}`, state.currentManager);
    render();
  } catch (error) {
    activeCallStream?.getTracks?.().forEach((track) => track.stop());
    activeCallRecorder = null;
    activeCallStream = null;
    activeCallMeta = null;
    alert(`Не вдалося почати запис: ${error.message}`);
  }
}

async function stopCallRecording(id = "") {
  if (!activeCallRecorder || !activeCallMeta) return;
  if (id && activeCallMeta.orderId !== id) return alert("Зараз записується інше замовлення.");
  const recorder = activeCallRecorder;
  const stream = activeCallStream;
  const meta = activeCallMeta;
  await new Promise((resolve) => {
    recorder.addEventListener("stop", resolve, { once: true });
    recorder.stop();
  });
  stream?.getTracks?.().forEach((track) => track.stop());
  const blob = new Blob(activeCallChunks, { type: recorder.mimeType || "audio/webm" });
  const dataUrl = await blobToDataUrl(blob);
  const durationMs = Math.max(0, new Date().getTime() - new Date(meta.startedIso).getTime());
  state.callRecordings.unshift({
    id: uniqueId("rec"),
    orderId: meta.orderId,
    externalOrderId: meta.externalOrderId,
    buyer: meta.buyer,
    manager: meta.manager,
    startedAt: meta.startedAt,
    endedAt: currentTimestamp(),
    durationMs,
    mimeType: blob.type,
    size: blob.size,
    consent: meta.consent,
    dataUrl
  });
  activeCallRecorder = null;
  activeCallStream = null;
  activeCallChunks = [];
  activeCallMeta = null;
  addAudit(`Збережено запис розмови ${meta.externalOrderId}, ${Math.round(durationMs / 1000)} с`, "system");
  render();
}

function deleteCallRecording(id) {
  state.callRecordings = state.callRecordings.filter((recording) => recording.id !== id);
  addAudit(`Видалено запис розмови ${id}`, state.currentManager);
  render();
}

function runMarketplaceOrderAutomationById(id) {
  if (!canManageMarketplaceOrder()) return alert("Поточна роль не має права запускати автоматичну обробку замовлення.");
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  runMarketplaceOrderAutomation(order, { audit: true });
  render();
}

function remindMarketplaceOrder(id) {
  if (!canManageMarketplaceOrder()) return alert("Поточна роль не має права створювати нагадування по замовленню.");
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  order.workflow = order.workflow || normalizeMarketplaceWorkflow(order, order.status || "new_order", order.dates || {});
  order.workflow.lastReminderAt = currentTimestamp();
  addAudit(`Нагадування менеджеру ${order.manager}: ${order.externalOrderId} · ${order.workflow.nextAction || salesFunnelStage(order.status).reminder}`, "system");
  render();
}

function markMarketplaceUpsell(id) {
  if (!canManageMarketplaceOrder()) return alert("Поточна роль не має права переводити замовлення в апсел.");
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  if (!statusAtLeast(order.status, "confirmed_by_client") || order.status === "cancelled") return alert("Апсел доступний після підтвердження замовлення клієнтом.");
  ensureClientFromMarketplaceOrder(order);
  setMarketplaceOrderWorkflowStage(order, "upsell", { nextAction: "Запропонувати супутній товар, комплект або витратні матеріали." });
  order.workflow.upsellOfferedAt = currentTimestamp();
  addAudit(`Апсел запущено по ${order.externalOrderId} для клієнта ${clientName(order.clientId)}`);
  refreshMarketplaceOrderAfterAction(order.id);
}

function markMarketplaceAftersale(id) {
  if (!canManageMarketplaceOrder()) return alert("Поточна роль не має права переводити замовлення у післяпродажний контакт.");
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  if (!statusAtLeast(order.status, "completed") || order.status === "cancelled") return alert("Follow-up доступний після завершення продажу.");
  ensureClientFromMarketplaceOrder(order);
  setMarketplaceOrderWorkflowStage(order, "follow_up", { nextAction: "Зв'язатися з покупцем: відгук, гарантія, сервіс, додаткові потреби." });
  order.workflow.aftersaleContactedAt = currentTimestamp();
  addAudit(`Післяпродажний контакт заплановано по ${order.externalOrderId} для ${clientName(order.clientId)}`);
  refreshMarketplaceOrderAfterAction(order.id);
}

function markMarketplaceRepeatSale(id) {
  if (!canManageMarketplaceOrder()) return alert("Поточна роль не має права планувати повторний продаж.");
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  if (!statusAtLeast(order.status, "follow_up") || order.status === "cancelled") return alert("Повторний продаж доступний після Follow-up.");
  ensureClientFromMarketplaceOrder(order);
  setMarketplaceOrderWorkflowStage(order, "repeat_sale", { nextAction: "Поставити клієнта в повторну пропозицію та персональну добірку." });
  order.workflow.repeatSalePlannedAt = currentTimestamp();
  addAudit(`Повторний продаж заплановано по ${order.externalOrderId} для ${clientName(order.clientId)}`);
  refreshMarketplaceOrderAfterAction(order.id);
}

function completeMarketplaceOrder(id) {
  if (!canManageMarketplaceOrder()) return alert("Поточна роль не має права завершувати замовлення.");
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  if (order.status === "cancelled") return alert("Скасоване замовлення не можна завершити.");
  if (!statusAtLeast(order.status, "delivered")) return alert("Спочатку підтвердіть доставку замовлення.");
  setMarketplaceOrderWorkflowStage(order, "completed", { nextAction: "Закрити продаж і запланувати післяпродажний контакт." });
  addAudit(`Продаж ${order.externalOrderId} завершено`);
  refreshMarketplaceOrderAfterAction(order.id);
}

function cancelMarketplaceOrder(id) {
  if (!canManageMarketplaceOrder()) return alert("Поточна роль не має права скасовувати замовлення.");
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  if (order.status === "cancelled") return;
  if (!window.confirm(`Скасувати замовлення ${order.externalOrderId}?`)) return;
  setMarketplaceOrderWorkflowStage(order, "cancelled", { nextAction: "Зафіксувати причину скасування і, якщо потрібно, повернути резерв складу." });
  order.payment = { ...(order.payment || {}), status: order.payment?.status === "paid" ? "paid" : "failed", apiStatus: order.payment?.apiStatus || "Замовлення скасовано в CRM" };
  order.delivery = { ...(order.delivery || {}), apiStatus: "Замовлення скасовано в CRM" };
  addAudit(`Замовлення ${order.externalOrderId} скасовано`);
  refreshMarketplaceOrderAfterAction(order.id);
}

function checkedFormValues(form, name) {
  return $$(`input[name="${CSS.escape(name)}"]:checked`, form).map((input) => input.value);
}

function updateDataExchangeFormVisibility(form) {
  if (!form) return;
  const channel = form.elements.channel?.value || "marketplaces";
  const mode = form.elements.mode?.value || "all";
  const panel = form.closest("[data-data-exchange-panel]") || form;
  $$("[data-exchange-channel-panel]", form).forEach((panel) => {
    panel.hidden = panel.dataset.exchangeChannelPanel !== channel;
  });
  $$("[data-exchange-embedded-rozetka]", panel).forEach((element) => {
    element.hidden = channel === "bas";
  });
  $$("[data-onec-exchange-tools]", panel).forEach((element) => {
    element.hidden = channel !== "bas";
  });
  const summary = $(".exchange-summary span", form);
  const summaryTitle = $(".exchange-summary strong", form);
  if (summaryTitle) {
    summaryTitle.textContent = channel === "bas" ? "1C / BAS / BAF" : "Маркетплейси";
  }
  if (summary) {
    summary.textContent = mode === "selective"
      ? "CRM обмінює тільки вибрані блоки даних."
      : "CRM обмінює весь доступний набір даних цього каналу.";
  }
}

function updateDataExchange(form) {
  if (!canCreateDocument("dataExchange") || !canEditField("dataExchangeScope")) {
    return alert("Поточна роль не має права змінювати налаштування обміну даними.");
  }
  const data = formData(form);
  const current = dataExchangeState();
  state.settings.dataExchange = {
    channel: data.channel === "bas" ? "bas" : "marketplaces",
    mode: data.mode === "selective" ? "selective" : "all",
    marketplaceIds: checkedFormValues(form, "marketplaceIds"),
    marketplaceData: checkedFormValues(form, "marketplaceData"),
    basData: checkedFormValues(form, "basData"),
    oneCConnection: {
      ...(current.oneCConnection || {}),
      system: data.oneCSystem || current.oneCConnection.system || "1c_utp_ukraine_1_2",
      transport: data.oneCTransport || current.oneCConnection.transport || "file_json",
      server: String(data.oneCServer || "").trim() || "192.168.0.5",
      infobase: String(data.oneCInfobase || "").trim(),
      endpoint: String(data.oneCEndpoint || "").trim(),
      format: data.oneCFormat === "xml" ? "xml" : "json",
      login: String(data.oneCLogin || "").trim(),
      password: data.oneCPassword ? String(data.oneCPassword) : (current.oneCConnection.password || "")
    }
  };
  addAudit(`Оновлено обмін даними: ${state.settings.dataExchange.channel === "bas" ? "1C / BAS / BAF" : "маркетплейси"}, ${state.settings.dataExchange.mode === "selective" ? "вибірково" : "вся інформація"}`);
  render();
}

function updateSalesFunnel(form) {
  if (!(role().canEditSettings || isAdmin())) return alert("Поточна роль не має права змінювати воронки.");
  const data = formData(form);
  state.settings.salesFunnel = DEFAULT_SALES_FUNNEL.map((stage) => {
    const slaHours = Number(data[`sla_${stage.id}`] || stage.slaHours);
    const className = SALES_FUNNEL_CLASS_OPTIONS.some(([value]) => value === data[`class_${stage.id}`])
      ? data[`class_${stage.id}`]
      : stage.className;
    return {
      ...stage,
      label: String(data[`label_${stage.id}`] || stage.label).trim() || stage.label,
      description: String(data[`description_${stage.id}`] || SALES_FUNNEL_DESCRIPTIONS[stage.id] || "").trim(),
      menuLocation: String(data[`menu_${stage.id}`] || SALES_FUNNEL_WORKFLOW_RULES[stage.id]?.menuLocation || "").trim(),
      entryCondition: String(data[`entry_${stage.id}`] || SALES_FUNNEL_WORKFLOW_RULES[stage.id]?.entryCondition || "").trim(),
      completionCondition: String(data[`completion_${stage.id}`] || SALES_FUNNEL_WORKFLOW_RULES[stage.id]?.completionCondition || "").trim(),
      switchBy: String(data[`switch_${stage.id}`] || SALES_FUNNEL_WORKFLOW_RULES[stage.id]?.switchBy || "").trim(),
      className,
      slaHours: Number.isFinite(slaHours) && slaHours > 0 ? slaHours : stage.slaHours,
      reminder: String(data[`reminder_${stage.id}`] || stage.reminder).trim() || stage.reminder,
      active: data[`active_${stage.id}`] !== "false"
    };
  });
  state.marketplaceOrders.forEach((order) => {
    const stage = salesFunnelStage(order.status);
    const startedAt = order.workflow?.stageStartedAt || nowIso();
    order.workflow = {
      ...(order.workflow || {}),
      reminderAt: addHoursIso(startedAt, stage.slaHours),
      nextAction: stage.reminder
    };
  });
  addAudit("Оновлено умови, SLA та нагадування менеджерської воронки продажів");
  render();
}

function updateCommunicators(form) {
  if (!(role().canEditSettings || isAdmin())) return alert("Поточна роль не має права змінювати комунікатори.");
  const data = formData(form);
  const retentionDays = Number(data.recordingRetentionDays || 180);
  state.settings.communicators = {
    viber: {
      enabled: data.viberEnabled !== "false",
      mode: data.viberMode === "live" ? "live" : "test",
      senderName: data.viberSenderName || "Marketplace CRM",
      authToken: data.viberAuthToken || "",
      webhookUrl: data.viberWebhookUrl || "",
      defaultTemplate: data.viberDefaultTemplate || seedState.settings.communicators.viber.defaultTemplate
    },
    callRecording: {
      enabled: data.recordingEnabled !== "false",
      consentRequired: data.recordingConsentRequired !== "false",
      retentionDays: Number.isFinite(retentionDays) && retentionDays > 0 ? retentionDays : 180,
      source: data.recordingSource === "telephony" ? "telephony" : "browser_microphone"
    }
  };
  addAudit(`Оновлено комунікатори: Viber ${state.settings.communicators.viber.mode}, запис ${state.settings.communicators.callRecording.enabled ? "увімкнено" : "вимкнено"}`);
  render();
}

function updateRates(form) {
  if (!(role().canEditSettings || isAdmin())) return alert("Курси та налаштування може змінювати тільки адміністратор.");
  const data = formData(form);
  const rates = {};
  Object.keys(state.settings.rates).forEach((currency) => {
    rates[currency] = Number(data[currency] || state.settings.rates[currency]);
  });
  state.settings.rates = normalizeExchangeRates(rates);
  addAudit("Оновлено курси валют");
  render();
}

function updateDeliveryApiSettings(form) {
  if (!(role().canEditSettings || isAdmin())) return alert("Налаштування API доставок змінює тільки адміністратор.");
  const data = formData(form);
  const settings = deliveryApiSettings();
  ["nova_poshta", "ukrposhta"].forEach((key) => {
    const enabled = data[`${key}_enabled`] === "true";
    const apiKey = String(data[`${key}_apiKey`] || "").trim();
    settings[key] = {
      ...settings[key],
      enabled,
      mode: data[`${key}_mode`] === "production" ? "production" : "test",
      apiKey,
      endpoint: String(data[`${key}_endpoint`] || "").trim(),
      status: enabled && apiKey ? "ok" : "not_configured",
      lastCheck: currentTimestamp()
    };
  });
  addAudit("Оновлено API доставок Нова пошта / Укрпошта", "system");
  saveState();
  render();
}

function updateClosedDay(form) {
  if (!role().canEditClosedDay) return alert("Поточна роль не може змінювати закритий день.");
  const data = formData(form);
  state.settings.closedDay = data.closedDay;
  addAudit(`Закритий день змінено на ${data.closedDay}`);
  render();
}

function openInvoice(id) {
  const invoice = byId(state.invoices, id);
  if (!invoice) return;
  const lines = invoice.lines.map((line) => {
    const serial = line.serialId ? byId(state.serials, line.serialId) : null;
    return `
      <tr>
        <td>${productName(line.productId)}</td>
        <td>${line.qty}</td>
        <td>${formatMoney(line.price, line.currency || invoice.currency)}${line.discount ? `<br><span class="small muted">знижка ${line.discount}%</span>` : ""}</td>
        <td>${serial ? serial.serial : "-"}</td>
        <td>${line.permitNumber || "-"} ${line.permitDate ? `<br><span class="small muted">${line.permitDate}</span>` : ""}</td>
      </tr>
    `;
  }).join("");
  openModal(`Накладна ${invoice.id}`, `
    <div class="stack" data-print-area="invoice-${escapeHtml(invoice.id)}" data-print-title="Накладна ${escapeHtml(invoice.id)}">
      <div class="inline-actions no-print">
        <button class="secondary" type="button" data-print-scope="invoice-${escapeHtml(invoice.id)}" ${canPrintDocuments() ? "" : "disabled"}>Друк накладної</button>
      </div>
      <p><strong>${clientName(invoice.clientId)}</strong><br><span class="muted">${firmName(invoice.firmId)} · ${invoice.channel} · ${invoice.manager}</span></p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Товар</th><th>К-сть</th><th>Ціна</th><th>Серія</th><th>Дозвіл</th></tr></thead>
          <tbody>${lines}</tbody>
        </table>
      </div>
      <p class="notice">Сума: <strong>${formatMoney(invoice.total, invoice.currency)}</strong>. Оплачено: <strong>${formatMoney(invoice.paid, invoice.currency)}</strong>. Доставка: ${invoice.delivery}, ${invoice.ttn || "ТТН не внесено"}.</p>
    </div>
  `);
}

function editInvoiceDocument(id) {
  const invoice = byId(state.invoices, id);
  if (!invoice) return;
  const documentKey = invoicePostedPermissionKey(invoice);
  if (invoice.posted !== false && !canEditPostedDocument(documentKey)) return alert("Поточна роль не має права змінювати цей вид проведеного документа.");
  openModal(`Зміна накладної ${invoice.id}`, `
    <form class="form-grid" data-action="update-invoice">
      <input type="hidden" name="id" value="${escapeHtml(invoice.id)}">
      <label class="field"><span>Дата</span><input name="date" type="date" value="${escapeHtml(invoice.date)}"></label>
      <label class="field"><span>Тип документа</span><select name="documentType">${variantOptions("documentTypes", invoice.documentType)}</select></label>
      <label class="field"><span>Договір / підстава</span><input name="contract" value="${escapeHtml(invoice.contract || "")}"></label>
      <label class="field"><span>Фірма</span><select name="firmId">${state.settings.firms.map((firm) => option(firm.id, firm.name, firm.id === invoice.firmId)).join("")}</select></label>
      <label class="field"><span>Канал</span><select name="channel">${variantOptions("salesChannels", invoice.channel)}</select></label>
      <label class="field wide"><span>Клієнт</span><select name="clientId">${state.clients.map((client) => option(client.id, client.name, client.id === invoice.clientId)).join("")}</select></label>
      <label class="field"><span>Менеджер</span><select name="manager">${employeeOptions(invoice.manager)}</select></label>
      <label class="field"><span>Дата оплати до</span><input name="dueDate" type="date" value="${escapeHtml(invoice.dueDate || invoice.date)}"></label>
      <label class="field"><span>Доставка</span><select name="delivery">${variantOptions("delivery", invoice.delivery)}</select></label>
      <label class="field"><span>ТТН</span><input name="ttn" value="${escapeHtml(invoice.ttn || "")}"></label>
      <label class="field"><span>Платник доставки</span><select name="deliveryPayer">${variantOptions("deliveryPayers", invoice.deliveryPayer)}</select></label>
      <label class="field"><span>Бухоблік</span><select name="accounting">${option("true", "Позначити для BAS/BAF", invoice.accounting === true)}${option("false", "Не передавати", invoice.accounting !== true)}</select></label>
      <label class="field"><span>Блокування</span><select name="locked">${option("true", "Заблоковано", invoice.locked === true)}${option("false", "Відкрито для змін", invoice.locked !== true)}</select></label>
      <label class="field full"><span>Коментар</span><textarea name="comment">${escapeHtml(invoice.comment || "")}</textarea></label>
      <p class="notice warn small full">Товарні рядки, серії та кількість змінюються коригуючим документом, щоб не зламати складський облік.</p>
      <button class="primary" type="submit">Зберегти зміни накладної</button>
    </form>
  `);
}

function updateInvoiceDocument(form) {
  const data = formData(form);
  const invoice = byId(state.invoices, data.id);
  if (!invoice) return alert("Накладну не знайдено.");
  const documentKey = invoicePostedPermissionKey(invoice);
  if (invoice.posted !== false && !canEditPostedDocument(documentKey)) return alert("Поточна роль не має права змінювати цей вид проведеного документа.");
  if (invoice.posted !== false && data.firmId !== invoice.firmId) return alert("Фірму проведеної накладної не можна змінити без коригувального документа, бо вона вже прив'язана до списання залишків.");
  const previousClientId = invoice.clientId;
  invoice.date = data.date || invoice.date;
  invoice.documentType = data.documentType;
  invoice.contract = data.contract;
  invoice.firmId = data.firmId;
  invoice.channel = data.channel;
  invoice.clientId = data.clientId;
  invoice.manager = data.manager;
  invoice.dueDate = data.dueDate || invoice.dueDate;
  invoice.delivery = data.delivery;
  invoice.ttn = data.ttn;
  invoice.deliveryPayer = data.deliveryPayer;
  invoice.accounting = data.accounting === "true";
  invoice.locked = data.locked === "true";
  invoice.comment = data.comment;
  if (previousClientId !== invoice.clientId) {
    state.payments.filter((payment) => payment.invoiceId === invoice.id).forEach((payment) => {
      payment.clientId = invoice.clientId;
    });
  }
  addAudit(`Змінено проведену накладну ${invoice.id}`);
  document.querySelector(".modal-backdrop")?.remove();
  render();
}

function openCabinetLegacy(id) {
  const client = byId(state.clients, id);
  const rows = inventoryRows().filter((row) => row.clientId === id);
  const invoices = state.invoices.filter((invoice) => invoice.clientId === id && isDebtInvoice(invoice));
  openModal(`B2B кабінет · ${client.name}`, `
    <div class="grid two">
      <div class="card">
        <h3>Відповідальне зберігання</h3>
        ${rows.length ? rows.map((row) => `<p><strong>${row.product.brand} ${row.product.model}</strong><br><span class="muted">${row.qty} од. · ${warehouseName(row.warehouseId)}</span></p>`).join("") : '<p class="muted">Немає залишків.</p>'}
      </div>
      <div class="card">
        <h3>Проплати</h3>
        ${invoices.map((invoice) => `<p><strong>${invoice.id}</strong><br><span class="muted">${formatMoney(invoice.paid, invoice.currency)} з ${formatMoney(invoice.total, invoice.currency)}</span></p>`).join("") || '<p class="muted">Немає накладних.</p>'}
      </div>
    </div>
    <p class="notice">У production-версії цей кабінет матиме окремий вхід клієнта, обмеження видимості даних, роздрібний інтерфейс продажу та підтвердження менеджером.</p>
  `);
}

function openCabinet(id) {
  const client = byId(state.clients, id);
  if (!client) return;
  const rows = clientStorageRows(id);
  const docs = responsibleStorageRows(id);
  const invoices = state.invoices.filter((invoice) => invoice.clientId === id && isDebtInvoice(invoice));
  const paymentDebt = invoices.reduce((sum, invoice) => sum + invoice.total - invoice.paid, 0);
  const serialRows = clientStorageSerials(id, "", true);
  openModal(`B2B кабінет · ${client.name}`, `
    <div class="stack" data-print-area="b2b-cabinet-${escapeHtml(client.id)}" data-print-title="B2B кабінет · ${escapeHtml(client.name)}">
      <div class="inline-actions no-print">
        <button class="secondary" type="button" data-print-scope="b2b-cabinet-${escapeHtml(client.id)}" ${canPrintDocuments() ? "" : "disabled"}>Друк кабінету</button>
        <button class="secondary" data-export-b2b-report="stock" data-client-id="${client.id}">Звіт залишків JSON</button>
        <button class="secondary" data-export-b2b-report="payments" data-client-id="${client.id}">Звіт оплат JSON</button>
        <button class="secondary" data-export-b2b-report="inventory" data-client-id="${client.id}">Інвентаризація JSON</button>
      </div>
      <div class="grid three">
        <article class="card metric warn"><span>На зберіганні</span><strong>${rows.reduce((sum, row) => sum + row.qty, 0)} од.</strong><small>Товар залишається нашим до продажу клієнтом.</small></article>
        <article class="card metric danger"><span>До оплати</span><strong>${formatMoney(paymentDebt)}</strong><small>Борг після звітів продажу клієнтом.</small></article>
        <article class="card metric info"><span>Документи</span><strong>${docs.length}</strong><small>Передачі на склад клієнта.</small></article>
      </div>

      <section class="panel">
        <h3>Що відвантажено на відповідальне зберігання</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Документ</th><th>Дата</th><th>Товар</th><th>Передано</th><th>Продано</th><th>Залишок</th><th>Серії</th><th>Оплата</th><th>Статус</th></tr></thead>
            <tbody>
              ${docs.map((row) => `
                <tr>
                  <td><strong>${row.id}</strong><br><span class="small muted">${escapeHtml(row.manager || "-")}</span></td>
                  <td>${row.date}</td>
                  <td>${productName(row.productId)}<br><span class="small muted">${productCodes(row.product)}</span></td>
                  <td>${row.qty}</td>
                  <td>${row.soldQty}</td>
                  <td><strong>${row.remainingQty}</strong></td>
                  <td>${serialBadges(row.serialIds)}</td>
                  <td>${row.paymentDays || state.settings.defaultDueDays} днів після продажу</td>
                  <td>${statusPill(row.derivedStatus)}<br><span class="small muted">${ownershipLabel(row)}</span></td>
                </tr>
              `).join("") || '<tr><td colspan="9" class="muted">Передач на відповідальне зберігання ще немає.</td></tr>'}
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <h3>Залишки клієнта та інвентаризація</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Товар</th><th>QR / штрихкод</th><th>Склад</th><th>Кількість</th><th>Собівартість</th><th>Серійні номери зброї</th></tr></thead>
            <tbody>
              ${rows.map((row) => {
                const serials = row.product.type === "weapon"
                  ? clientStorageSerials(id, row.product.id).map((serial) => serial.id)
                  : [];
                return `
                  <tr>
                    <td><strong>${row.product.brand}</strong><br>${row.product.model}</td>
                    <td>${productCodes(row.product)}</td>
                    <td>${warehouseName(row.warehouseId)}</td>
                    <td>${row.qty}</td>
                    <td>${formatMoney(row.valueUAH)}</td>
                    <td>${serialBadges(serials)}</td>
                  </tr>
                `;
              }).join("") || '<tr><td colspan="6" class="muted">Немає залишків на складі клієнта.</td></tr>'}
            </tbody>
          </table>
        </div>
        <p class="notice small">Для інвентаризації зброя перевіряється за серійними номерами, звичайні товари — по QR або штрихкодах.</p>
      </section>

      <section class="panel">
        <h3>Оплати та дебіторка</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Накладна</th><th>Дата</th><th>Сума</th><th>Оплачено</th><th>Борг</th><th>Оплатити до</th><th>Стан</th></tr></thead>
            <tbody>
              ${invoices.map((invoice) => `
                <tr>
                  <td><strong>${invoice.id}</strong><br><span class="small muted">${invoice.channel}</span></td>
                  <td>${invoice.date}</td>
                  <td>${formatMoney(invoice.total, invoice.currency)}</td>
                  <td>${formatMoney(invoice.paid, invoice.currency)}</td>
                  <td>${formatMoney(invoice.total - invoice.paid, invoice.currency)}</td>
                  <td>${invoice.dueDate || "-"}</td>
                  <td>${statusPill(invoice.status)}</td>
                </tr>
              `).join("") || '<tr><td colspan="7" class="muted">Накладних і оплат ще немає.</td></tr>'}
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <h3>Серійні номери в кабінеті</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Серія</th><th>Товар</th><th>Склад</th><th>Стан</th><th>ЄРЗ</th><th>Дозвіл</th></tr></thead>
            <tbody>
              ${serialRows.map((serial) => `
                <tr>
                  <td><strong>${serial.serial}</strong></td>
                  <td>${productName(serial.productId)}</td>
                  <td>${warehouseName(serial.warehouseId)}</td>
                  <td>${statusPill(serial.status)}</td>
                  <td>${statusPill(serial.erzStatus)}</td>
                  <td>${serial.permitNumber ? `${escapeHtml(serial.permitNumber)}<br><span class="small muted">${serial.permitDate || "-"}</span>` : "-"}</td>
                </tr>
              `).join("") || '<tr><td colspan="6" class="muted">Серійних товарів у кабінеті немає.</td></tr>'}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `);
}

function openPayment(id) {
  const invoice = byId(state.invoices, id);
  paymentDraft = {
    ...paymentDraft,
    kind: "invoice",
    clientId: invoice?.clientId || "",
    invoiceId: id,
    firmId: invoice?.firmId || paymentDraft.firmId || ""
  };
  state.currentView = "finance";
  render();
}

function openModal(title, body) {
  const template = $("#modal-template").content.cloneNode(true);
  $(".modal-head h2", template).textContent = title;
  $(".modal-body", template).innerHTML = body;
  document.body.appendChild(template);
  const modal = document.body.lastElementChild;
  prepareDecimalInputs(modal);
  applyRoleFieldLocks(modal);
  attachFieldSuggestions();
  return modal;
}

function setFormReadOnly(form, message) {
  if (!form) return;
  $$("input, select, textarea, button", form).forEach((element) => {
    element.disabled = true;
  });
  if (message) {
    form.insertAdjacentHTML("afterbegin", `<p class="notice warn full">${escapeHtml(message)}</p>`);
  }
}

function exportB2BReport(clientId, type) {
  const portalClient = authenticatedClient();
  if (isClientAuthenticated() && portalClient?.id !== clientId) {
    alert("Кабінет клієнта може експортувати тільки власні звіти.");
    return;
  }
  const client = byId(state.clients, clientId);
  if (!client) return;
  let payload;
  if (type === "payments") {
    payload = state.invoices
      .filter((invoice) => invoice.clientId === clientId)
      .map((invoice) => ({
        invoiceId: invoice.id,
        date: invoice.date,
        dueDate: invoice.dueDate,
        channel: invoice.channel,
        total: invoice.total,
        paid: invoice.paid,
        debt: invoice.total - invoice.paid,
        currency: invoice.currency,
        status: invoice.status
      }));
  } else if (type === "inventory") {
    payload = clientStorageRows(clientId).map((row) => ({
      productId: row.product.id,
      product: `${row.product.brand} ${row.product.model}`,
      type: row.product.type,
      warehouse: warehouseName(row.warehouseId),
      qty: row.qty,
      barcode: row.product.barcode || "",
      qrCode: row.product.qrCode || "",
      serials: row.product.type === "weapon" ? clientStorageSerials(clientId, row.product.id).map((serial) => serial.serial) : [],
      valueUAH: row.valueUAH
    }));
  } else {
    payload = responsibleStorageRows(clientId).map((row) => ({
      documentId: row.id,
      date: row.date,
      productId: row.productId,
      product: productName(row.productId),
      barcode: row.product?.barcode || "",
      qty: row.qty,
      soldQty: row.soldQty,
      remainingQty: row.remainingQty,
      serials: (row.serialIds || []).map((serialId) => byId(state.serials, serialId)?.serial).filter(Boolean),
      paymentDays: row.paymentDays,
      status: row.derivedStatus,
      ownership: ownershipLabel(row)
    }));
  }
  downloadJson(`b2b-${type}-${safeFilePart(client.name)}-${today}.json`, {
    client: { id: client.id, name: client.name, edrpou: client.edrpou || "" },
    reportType: type,
    generatedAt: `${today} ${new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}`,
    rows: payload
  });
}

function exportJson() {
  if (isClientAuthenticated()) {
    alert("B2B кабінет не має доступу до повного експорту CRM.");
    return;
  }
  downloadJson(`arms-crm-export-${today}.json`, state);
}

function printScope(key) {
  if (!canPrintDocuments()) return alert("Поточна роль не має права друку документів та звітів.");
  const scope = document.querySelector(`[data-print-area="${key}"]`);
  if (!scope) return alert("Не знайдено область для друку.");
  const title = scope.dataset.printTitle || "Marketplace CRM";
  const styleHref = document.querySelector('link[rel="stylesheet"]')?.href || "";
  const printWindow = window.open("", "_blank", "width=1200,height=800");
  if (!printWindow) {
    alert("Браузер заблокував вікно друку. Дозвольте спливаючі вікна або повторіть друк.");
    return;
  }
  printWindow.document.write(`
    <!doctype html>
    <html lang="uk">
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(title)}</title>
        ${styleHref ? `<link rel="stylesheet" href="${styleHref}">` : ""}
      </head>
      <body class="print-document">
        <main class="content">
          <section class="panel">
            <h1>${escapeHtml(title)}</h1>
            ${scope.innerHTML}
          </section>
        </main>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 250);
}

function downloadJson(filename, value) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function basPurchasePayload(purchases) {
  return {
    exportedAt: `${today}T00:00:00+03:00`,
    source: "Marketplace CRM",
    target: "BAS/BAF",
    purchases: purchases.map((purchase) => {
      const product = byId(state.products, purchase.productId);
      return {
        id: purchase.id,
        date: purchase.date,
        documentType: purchase.documentType,
        supplier: purchase.supplier,
        supplierDoc: purchase.supplierDoc,
        firmId: purchase.firmId,
        warehouseId: purchase.warehouseId,
        productId: purchase.productId,
        internalCode: product?.internalCode,
        barcode: purchase.barcode || product?.barcode,
        productType: purchase.productType,
        qty: purchase.qty,
        cost: purchase.cost,
        currency: purchase.currency,
        serials: purchase.serials || [],
        uktzed: product?.uktzed,
        accounting: purchase.accounting
      };
    })
  };
}

function exportBasPurchases(purchaseIds = null) {
  const purchases = state.purchases.filter((purchase) => {
    if (purchaseIds) return purchaseIds.includes(purchase.id);
    return purchase.accounting;
  });
  if (!purchases.length) return alert("Немає приходів для BAS/BAF експорту.");
  downloadJson(`bas-baf-purchases-${today}.json`, basPurchasePayload(purchases));
  addAudit(`Сформовано BAS/BAF експорт приходів: ${purchases.length}`);
}

function markPurchaseExported(id) {
  const purchase = byId(state.purchases, id);
  if (!purchase) return;
  purchase.basStatus = "exported";
  state.serials
    .filter((serial) => serial.purchaseId === purchase.id)
    .forEach((serial) => {
      serial.basSynced = true;
    });
  addAudit(`Прихід ${purchase.id} підтверджено як експортований у BAS/BAF`);
  render();
}

function importBasPurchases(form) {
  try {
    const data = formData(form);
    const payload = JSON.parse(data.basPayload || "{}");
    const rows = Array.isArray(payload) ? payload : payload.purchases;
    if (!Array.isArray(rows) || !rows.length) throw new Error("JSON має містити масив purchases.");
    rows.forEach((row) => {
      const internalCodeMatches = row.productId ? [] : state.products.filter((product) => product.internalCode === row.internalCode);
      if (!row.productId && internalCodeMatches.length > 1) {
        throw new Error(`BAS/BAF не може однозначно знайти товар за внутрішнім кодом ${row.internalCode}: знайдено ${internalCodeMatches.length} карток.`);
      }
      const purchase = buildPurchase({
        ...row,
        accounting: true,
        productId: row.productId || internalCodeMatches[0]?.id
      }, "bas");
      applyPurchase(purchase, {
        erzStatus: row.erzStatus || "pending",
        actual: row.actual !== false
      });
    });
    addAudit(`Імпортовано BAS/BAF приходів: ${rows.length}`, "system");
    render();
  } catch (error) {
    alert(`Помилка імпорту BAS/BAF: ${error.message}`);
  }
}

function oneCSelectedDataKeys(settings = dataExchangeState()) {
  const allKeys = DATA_EXCHANGE_BAS_DATA.map(([key]) => key);
  if (settings.mode !== "selective") return allKeys;
  const selected = new Set(settings.basData || []);
  return allKeys.filter((key) => selected.has(key));
}

function oneCConnectionPayload(settings = dataExchangeState()) {
  const connection = settings.oneCConnection || {};
  return {
    system: connection.system || "1c_utp_ukraine_1_2",
    transport: connection.transport || "file_json",
    server: connection.server || "192.168.0.5",
    infobase: connection.infobase || "",
    endpoint: connection.endpoint || "",
    format: connection.format || "json",
    login: connection.login || "",
    auth: connection.password ? "password_configured_locally" : "not_configured"
  };
}

function oneCProductRows() {
  return state.products.map((product) => ({
    crmId: product.id,
    name: `${product.brand || ""} ${product.model || ""}`.trim() || product.model || product.id,
    type: product.type || "goods",
    brand: product.brand || "",
    model: product.model || "",
    caliber: product.caliber || "",
    category: product.category || "",
    unit: product.unit || "шт",
    internalCode: product.internalCode || "",
    barcode: product.barcode || product.qrCode || "",
    supplierSku: product.supplierSku || "",
    uktzed: product.uktzed || "",
    price: Number(product.price || 0),
    currency: product.currency || "UAH",
    cost: Number(product.cost || 0),
    costCurrency: product.costCurrency || product.currency || "UAH",
    minStock: Number(product.minStock || 0),
    leadTimeDays: Number(product.leadTimeDays || 0)
  }));
}

function oneCClientRows() {
  return state.clients.map((client) => ({
    crmId: client.id,
    name: client.name,
    type: client.type || "",
    edrpou: client.edrpou || "",
    phone: client.phone || "",
    email: client.email || "",
    address: client.address || "",
    manager: client.manager || "",
    priceType: client.priceType || "",
    currency: client.currency || "UAH",
    taxMode: client.taxMode || "",
    paymentTerms: Number(client.paymentTerms || 0),
    creditLimitUAH: Number(client.creditLimitUAH || 0)
  }));
}

function oneCOrderRows() {
  return state.marketplaceOrders.map((order) => {
    const buyer = marketplaceOrderBuyer(order);
    const status = normalizeMarketplaceOrderStatus(order.status);
    return {
      crmId: order.id,
      externalOrderId: order.externalOrderId || order.id,
      date: order.date || today,
      marketplace: order.marketplace || "",
      status,
      statusLabel: salesFunnelStage(status).label,
      manager: order.manager || "",
      clientCrmId: order.clientId || "",
      buyer: {
        name: buyer.name || "",
        phone: buyer.phone || "",
        email: buyer.email || ""
      },
      productCrmId: order.productId || "",
      product: productName(order.productId),
      sku: order.sku || "",
      qty: Number(order.qty || 1),
      price: Number(order.price || 0),
      currency: order.currency || "UAH",
      total: marketplaceOrderTotal(order),
      payment: order.payment || {},
      delivery: order.delivery || {},
      workflow: order.workflow || {}
    };
  });
}

function oneCSalesDocRows() {
  return state.invoices.map((invoice) => ({
    crmId: invoice.id,
    date: invoice.date,
    firmId: invoice.firmId,
    firm: firmName(invoice.firmId),
    channel: invoice.channel || "",
    clientCrmId: invoice.clientId,
    client: clientName(invoice.clientId),
    manager: invoice.manager || "",
    currency: invoice.currency || "UAH",
    total: Number(invoice.total || 0),
    paid: Number(invoice.paid || 0),
    debt: invoiceDebt(invoice),
    dueDate: invoice.dueDate || "",
    status: invoice.status || "",
    delivery: invoice.delivery || "",
    ttn: invoice.ttn || "",
    lines: (invoice.lines || []).map((line) => ({
      productCrmId: line.productId,
      product: productName(line.productId),
      qty: Number(line.qty || 0),
      price: Number(line.price || 0),
      currency: line.currency || invoice.currency || "UAH",
      serialIds: line.serialIds || []
    }))
  }));
}

function oneCShipmentRows() {
  const orderShipments = state.marketplaceOrders
    .filter((order) => order.delivery?.ttn || ["shipped", "delivered", "completed", "follow_up", "repeat_sale"].includes(normalizeMarketplaceOrderStatus(order.status)))
    .map((order) => ({
      source: "marketplace_order",
      crmOrderId: order.id,
      externalOrderId: order.externalOrderId || order.id,
      marketplace: order.marketplace || "",
      date: order.dates?.delivery || order.date || today,
      status: normalizeMarketplaceOrderStatus(order.status),
      ttn: order.delivery?.ttn || "",
      deliveryService: order.delivery?.service || order.delivery?.method || "",
      recipient: marketplaceOrderBuyer(order).name || "",
      phone: marketplaceOrderBuyer(order).phone || "",
      amount: marketplaceOrderTotal(order),
      currency: order.currency || "UAH"
    }));
  const invoiceShipments = state.invoices
    .filter((invoice) => invoice.ttn || invoice.delivery)
    .map((invoice) => ({
      source: "invoice",
      invoiceId: invoice.id,
      date: invoice.date,
      status: invoice.status || "",
      ttn: invoice.ttn || "",
      deliveryService: invoice.delivery || "",
      clientCrmId: invoice.clientId,
      client: clientName(invoice.clientId),
      amount: Number(invoice.total || 0),
      currency: invoice.currency || "UAH"
    }));
  return [...orderShipments, ...invoiceShipments];
}

function oneCPaymentRows() {
  return state.payments.map((payment) => ({
    crmId: payment.id,
    invoiceId: payment.invoiceId || "",
    marketplaceOrderId: payment.marketplaceOrderId || "",
    externalOrderId: payment.externalOrderId || "",
    marketplace: payment.marketplace || "",
    date: payment.date || today,
    amount: Number(payment.amount || 0),
    currency: payment.currency || "UAH",
    rate: Number(payment.rate || 1),
    method: payment.method || payment.source || "",
    bankRef: payment.bankRef || "",
    comment: payment.comment || "",
    status: payment.status || "paid"
  }));
}

function oneCReceivableRows() {
  return state.invoices
    .filter((invoice) => invoiceDebt(invoice) > 0)
    .map((invoice) => ({
      invoiceId: invoice.id,
      date: invoice.date,
      dueDate: invoice.dueDate || "",
      clientCrmId: invoice.clientId,
      client: clientName(invoice.clientId),
      manager: invoice.manager || "",
      total: Number(invoice.total || 0),
      paid: Number(invoice.paid || 0),
      debt: invoiceDebt(invoice),
      currency: invoice.currency || "UAH",
      overdue: invoice.dueDate ? invoice.dueDate < today : false
    }));
}

function oneCPayableRows() {
  return (state.payables || []).map((payable) => ({
    crmId: payable.id,
    supplier: payable.supplier || "",
    manager: payable.manager || "",
    article: payable.article || "",
    amount: Number(payable.amount || 0),
    currency: payable.currency || "UAH",
    dueDate: payable.dueDate || "",
    status: payable.status || "open",
    comment: payable.comment || ""
  }));
}

function oneCStockRows() {
  return inventoryRows().map((row) => ({
    productCrmId: row.product.id,
    product: `${row.product.brand || ""} ${row.product.model || ""}`.trim(),
    internalCode: row.product.internalCode || "",
    barcode: row.product.barcode || row.product.qrCode || "",
    warehouseId: row.warehouseId,
    warehouse: warehouseName(row.warehouseId),
    firmId: row.firmId || "vat",
    firm: firmName(row.firmId || "vat"),
    clientCrmId: row.clientId || "",
    qty: Number(row.qty || 0),
    unit: row.product.unit || "шт",
    valueUAH: Number(row.valueUAH || 0)
  }));
}

function oneCStockMoveRows() {
  const receiptRows = state.purchases.map((purchase) => ({
    source: "purchase",
    documentId: purchase.id,
    date: purchase.date,
    direction: "in",
    productCrmId: purchase.productId,
    product: productName(purchase.productId),
    warehouseId: purchase.warehouseId,
    firmId: purchase.firmId,
    qty: Number(purchase.qty || 0),
    cost: Number(purchase.cost || 0),
    currency: purchase.currency || "UAH"
  }));
  const saleRows = state.invoices.flatMap((invoice) => (invoice.lines || []).map((line) => ({
    source: "invoice",
    documentId: invoice.id,
    date: invoice.date,
    direction: "out",
    productCrmId: line.productId,
    product: productName(line.productId),
    warehouseId: line.warehouseId || "wh-main",
    firmId: invoice.firmId,
    qty: Number(line.qty || 0),
    price: Number(line.price || 0),
    currency: line.currency || invoice.currency || "UAH"
  })));
  return [...receiptRows, ...saleRows];
}

function oneCExpenseRows() {
  return (state.expenses || []).map((expense) => ({
    crmId: expense.id,
    date: expense.date,
    article: expense.article || "",
    amount: Number(expense.amount || 0),
    currency: expense.currency || "UAH",
    method: expense.method || "",
    manager: expense.manager || "",
    supplier: expense.supplier || "",
    comment: expense.comment || ""
  }));
}

function oneCPurchaseRows() {
  return basPurchasePayload(state.purchases).purchases;
}

function oneCExportPayload() {
  const settings = dataExchangeState();
  const selectedData = oneCSelectedDataKeys(settings);
  const payload = {
    schema: "marketplace-crm.onec.exchange.v1",
    generatedAt: currentTimestamp(),
    source: "Marketplace CRM",
    target: settings.oneCConnection?.system === "bas_baf" ? "BAS/BAF" : "1C УТП Україна 1.2",
    direction: "CRM_TO_1C",
    selectedData,
    connection: oneCConnectionPayload(settings),
    meta: {
      version: APP_VERSION,
      build: APP_BUILD,
      counts: {}
    }
  };
  const blocks = {
    products: oneCProductRows,
    clients: oneCClientRows,
    orders: oneCOrderRows,
    salesDocs: oneCSalesDocRows,
    shipments: oneCShipmentRows,
    payments: oneCPaymentRows,
    receivables: oneCReceivableRows,
    payables: oneCPayableRows,
    purchaseDocs: oneCPurchaseRows,
    stock: oneCStockRows,
    stockMoves: oneCStockMoveRows,
    expenses: oneCExpenseRows
  };
  selectedData.forEach((key) => {
    if (!blocks[key]) return;
    payload[key] = blocks[key]();
    payload.meta.counts[key] = payload[key].length;
  });
  return payload;
}

function updateOneCConnectionStatus(updates) {
  const settings = dataExchangeState();
  state.settings.dataExchange = {
    ...settings,
    oneCConnection: {
      ...(settings.oneCConnection || {}),
      ...updates
    }
  };
}

function exportOneCPackage() {
  if (!canCreateDocument("dataExchange") || !canEditField("dataExchangeScope")) {
    return alert("Поточна роль не має права експортувати пакет 1C.");
  }
  const payload = oneCExportPayload();
  downloadJson(`onec-utp-exchange-${today}.json`, payload);
  updateOneCConnectionStatus({
    lastExport: currentTimestamp(),
    lastStatus: "exported",
    lastMessage: `OK: сформовано JSON-пакет для 1C, блоків: ${payload.selectedData.length}.`
  });
  addAudit(`Сформовано пакет обміну з 1C: ${payload.selectedData.join(", ")}`, "system");
  render();
}

function oneCBridgeSpecPayload() {
  return {
    schema: "marketplace-crm.onec.bridge-spec.v1",
    generatedAt: currentTimestamp(),
    purpose: "Шлюз для майбутнього HTTP-обміну Marketplace CRM з 1C УТП / BAS / BAF у внутрішній мережі через VPN.",
    recommendedStart: "file_json",
    endpointBase: dataExchangeState().oneCConnection?.endpoint || "http://192.168.0.5/arms-crm/exchange",
    endpoints: [
      { method: "GET", path: "/export", direction: "CRM_TO_1C", description: "CRM віддає пакет onec.exchange.v1" },
      { method: "POST", path: "/import", direction: "1C_TO_CRM", description: "1C повертає товари, клієнтів, оплати, залишки, відвантаження, дебіторку, кредиторку" },
      { method: "GET", path: "/health", direction: "CHECK", description: "Перевірка доступності шлюзу у VPN" }
    ],
    keys: DATA_EXCHANGE_BAS_DATA.map(([key, label]) => ({ key, label })),
    identifiers: ["crmId", "externalOrderId", "invoiceId", "internalCode", "barcode", "edrpou", "phone"],
    importContract: {
      products: "оновлення/створення товарів за crmId, internalCode або barcode",
      clients: "оновлення/створення клієнтів за crmId, edrpou, phone, email або name",
      payments: "створення оплат без дублювання за crmId/id або bankRef",
      receivables: "оновлення paid/debt по invoiceId",
      payables: "оновлення/створення кредиторки",
      shipments: "оновлення ТТН і статусів замовлень за crmOrderId або externalOrderId",
      stock: "оновлення залишків за товаром, складом і фірмою"
    },
    sampleExport: oneCExportPayload()
  };
}

function downloadOneCBridgeSpec() {
  downloadJson(`onec-bridge-spec-${today}.json`, oneCBridgeSpecPayload());
  addAudit("Завантажено схему HTTP-шлюзу для 1C / BAS / BAF", "system");
}

function oneCImportRows(payload, key) {
  const value = payload?.[key] || payload?.data?.[key] || payload?.reply?.[key] || payload?.payload?.[key];
  if (Array.isArray(value)) return value;
  return value && typeof value === "object" ? [value] : [];
}

function oneCCombinedRows(payload, keys) {
  const rows = [];
  keys.forEach((key) => rows.push(...oneCImportRows(payload, key)));
  return rows;
}

function oneCRowText(row, keys, fallback = "") {
  const keyList = Array.isArray(keys) ? keys : [keys];
  for (const key of keyList) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return String(value).trim();
  }
  return fallback;
}

function oneCRowNumber(row, keys, fallback = 0) {
  const keyList = Array.isArray(keys) ? keys : [keys];
  for (const key of keyList) {
    const value = row?.[key];
    if (value !== undefined && value !== null && value !== "") {
      const normalized = typeof value === "string" ? value.replace(/\s/g, "").replace(",", ".") : value;
      const number = Number(normalized);
      if (Number.isFinite(number)) return number;
    }
  }
  return fallback;
}

function findProductForOneC(row) {
  const id = oneCRowText(row, ["crmId", "productCrmId", "productId", "id", "oneCRef", "one_c_ref", "externalId"]);
  const internalCode = oneCRowText(row, ["internalCode", "internal_code", "sku", "productCode", "product_code", "code", "article"]);
  const barcode = oneCRowText(row, ["barcode", "barCode", "ean"]);
  return byId(state.products, id)
    || state.products.find((product) => internalCode && product.internalCode === internalCode)
    || state.products.find((product) => barcode && [product.barcode, product.qrCode].includes(barcode));
}

function upsertOneCProduct(row) {
  let product = findProductForOneC(row);
  const importedBrand = cleanImportedSourceBrand(oneCRowText(row, ["brand", "producer", "manufacturer"], ""));
  const importedName = cleanImportedProductName(oneCRowText(row, ["model", "name", "title", "productName", "product_name"], "Товар 1C"));
  const importedCategory = oneCRowText(row, ["productGroupName", "product_group_name", "category", "group", "categoryName", "category_name"], "1C імпорт");
  if (!product) {
    product = {
      id: oneCRowText(row, ["crmId", "productCrmId", "productId", "id", "oneCRef", "one_c_ref", "externalId"], uniqueId("p")),
      type: oneCRowText(row, ["type", "productType", "product_type"], "goods"),
      model: importedName,
      brand: importedBrand,
      barcode: oneCRowText(row, ["barcode", "barCode", "ean"]),
      supplierSku: oneCRowText(row, ["supplierSku", "supplier_sku", "article", "sku"]),
      internalCode: oneCRowText(row, ["internalCode", "internal_code", "sku", "productCode", "product_code", "code", "article"]),
      category: importedCategory,
      productGroupCode: oneCRowText(row, ["productGroupCode", "product_group_code", "categoryId", "category_id"]),
      productGroupRef: oneCRowText(row, ["productGroupRef", "product_group_ref"]),
      unit: oneCRowText(row, ["unit", "unitName", "unit_name"], "шт"),
      price: 0,
      currency: "UAH",
      cost: 0,
      costCurrency: "UAH",
      minStock: 0,
      leadTimeDays: 0,
      description: oneCRowText(row, ["description", "comment"], ""),
      photos: []
    };
    state.products.push(product);
  }
  product.model = cleanImportedProductName(oneCRowText(row, ["model", "name", "title", "productName", "product_name"], product.model));
  product.brand = importedBrand || cleanImportedSourceBrand(product.brand);
  product.type = oneCRowText(row, ["type", "productType", "product_type"], product.type);
  product.category = oneCRowText(row, ["productGroupName", "product_group_name", "category", "group", "categoryName", "category_name"], product.category);
  product.productGroupCode = oneCRowText(row, ["productGroupCode", "product_group_code", "categoryId", "category_id"], product.productGroupCode || "");
  product.productGroupRef = oneCRowText(row, ["productGroupRef", "product_group_ref"], product.productGroupRef || "");
  product.unit = oneCRowText(row, ["unit", "unitName", "unit_name"], product.unit);
  product.barcode = oneCRowText(row, ["barcode", "barCode", "ean"], product.barcode);
  product.supplierSku = oneCRowText(row, ["supplierSku", "supplier_sku", "article", "sku"], product.supplierSku);
  product.internalCode = oneCRowText(row, ["internalCode", "internal_code", "sku", "productCode", "product_code", "code", "article"], product.internalCode);
  product.uktzed = oneCRowText(row, ["uktzed", "uktzedCode", "uktzed_code"], product.uktzed || "");
  product.description = oneCRowText(row, ["description", "comment"], product.description || "");
  product.currency = oneCRowText(row, ["currency", "latestPriceCurrency", "latest_price_currency"], product.currency || "UAH");
  applyImportedProductPrice(product, oneCRowNumber(row, ["price", "salePrice", "sale_price", "latestPrice", "latest_price"], product.price || 0), product.currency);
  product.cost = oneCRowNumber(row, ["cost", "purchasePrice", "purchase_price"], product.cost || 0);
  product.costCurrency = oneCRowText(row, ["costCurrency", "cost_currency"], product.costCurrency || product.currency || "UAH");
  product.minStock = oneCRowNumber(row, ["minStock", "min_stock"], product.minStock || 0);
  product.leadTimeDays = oneCRowNumber(row, ["leadTimeDays", "lead_time_days"], product.leadTimeDays || 0);
  return product;
}

function findClientForOneC(row) {
  const id = oneCRowText(row, ["crmId", "clientCrmId", "clientId", "customerId", "counterpartyCode", "counterparty_code", "id", "externalId"]);
  const taxId = oneCRowText(row, ["edrpou", "taxId", "tax_id", "code"]);
  const name = oneCRowText(row, ["name", "fullName", "full_name"]);
  return byId(state.clients, id)
    || state.clients.find((client) => taxId && client.edrpou === taxId)
    || state.clients.find((client) => oneCRowText(row, "phone") && client.phone === oneCRowText(row, "phone"))
    || state.clients.find((client) => oneCRowText(row, "email") && client.email === oneCRowText(row, "email"))
    || state.clients.find((client) => name && client.name.toLowerCase() === name.toLowerCase());
}

function upsertOneCClient(row) {
  const counterpartyCode = oneCRowText(row, ["counterpartyCode", "counterparty_code", "code"], "");
  const externalId = oneCRowText(row, ["externalId", "external_id", "id"], "");
  const oneCRef = oneCRowText(row, ["oneCRef", "one_c_ref", "ref"], "");
  const sourceFile = oneCRowText(row, ["sourceFile", "source_file"], "");
  const importedAt = oneCRowText(row, ["importedAt", "imported_at"], currentTimestamp());
  let client = findClientForOneC(row);
  if (!client) {
    client = {
      id: oneCRowText(row, ["crmId", "clientCrmId", "clientId", "customerId", "counterpartyCode", "counterparty_code", "id", "externalId"], uniqueId("c")),
      name: oneCRowText(row, ["name", "fullName", "full_name"], "Клієнт 1C"),
      type: oneCRowText(row, ["type", "sourceModule", "source_module"], "B2C"),
      manager: oneCRowText(row, "manager", state.currentManager),
      paymentTerms: 0,
      creditLimitUAH: 0,
      cabinetEnabled: false,
      portalLogin: "",
      password: "",
      edrpou: "",
      phone: "",
      email: "",
      priceType: "",
      currency: "UAH",
      taxMode: "",
      responsibleStorage: false,
      address: "",
      counterpartyCode,
      externalId,
      oneCRef,
      sourceType: "sql_1c",
      sourceName: "SQL / 1C",
      sourceText: "SQL / 1C",
      createdFrom: "sql_1c",
      sourceFile,
      importedAt,
      createdAt: currentTimestamp(),
      updatedAt: currentTimestamp(),
      sources: []
    };
    state.clients.push(client);
  }
  client.name = oneCRowText(row, ["name", "fullName", "full_name"], client.name);
  client.type = oneCRowText(row, ["type", "sourceModule", "source_module"], client.type);
  client.manager = oneCRowText(row, "manager", client.manager || state.currentManager);
  client.edrpou = oneCRowText(row, ["edrpou", "taxId", "tax_id", "code"], client.edrpou || "");
  client.phone = oneCRowText(row, "phone", client.phone || "");
  client.email = oneCRowText(row, "email", client.email || "");
  client.address = oneCRowText(row, "address", client.address || "");
  client.priceType = oneCRowText(row, ["priceType", "price_type"], client.priceType || "");
  client.currency = oneCRowText(row, "currency", client.currency || "UAH");
  client.taxMode = oneCRowText(row, ["taxMode", "tax_mode"], client.taxMode || "");
  client.paymentTerms = oneCRowNumber(row, ["paymentTerms", "payment_terms"], client.paymentTerms || 0);
  client.creditLimitUAH = oneCRowNumber(row, ["creditLimitUAH", "credit_limit_uah", "creditLimit"], client.creditLimitUAH || 0);
  client.counterpartyCode = oneCRowText(row, ["counterpartyCode", "counterparty_code", "code"], client.counterpartyCode || "");
  client.externalId = oneCRowText(row, ["externalId", "external_id", "id"], client.externalId || "");
  client.oneCRef = oneCRowText(row, ["oneCRef", "one_c_ref", "ref"], client.oneCRef || "");
  client.sourceFile = oneCRowText(row, ["sourceFile", "source_file"], client.sourceFile || "");
  client.importedAt = oneCRowText(row, ["importedAt", "imported_at"], client.importedAt || importedAt || currentTimestamp());
  client.createdFrom = client.createdFrom || "sql_1c";
  client.sourceType = "sql_1c";
  client.sourceName = "SQL / 1C";
  client.updatedAt = currentTimestamp();
  addClientSource(client, {
    type: "sql_1c",
    label: "SQL / 1C",
    detail: client.counterpartyCode || client.externalId || client.oneCRef || client.sourceFile || "",
    file: client.sourceFile || "",
    date: String(client.importedAt || today).slice(0, 10)
  });
  return client;
}

function upsertOneCPayment(row) {
  const id = oneCRowText(row, ["crmId", "paymentId", "id"], uniqueId("pay"));
  const bankRef = oneCRowText(row, "bankRef");
  let payment = byId(state.payments, id) || state.payments.find((item) => bankRef && item.bankRef === bankRef);
  const isNew = !payment;
  if (!payment) {
    payment = { id };
    state.payments.push(payment);
  }
  payment.invoiceId = oneCRowText(row, "invoiceId", payment.invoiceId || "");
  payment.marketplaceOrderId = oneCRowText(row, "marketplaceOrderId", payment.marketplaceOrderId || "");
  payment.externalOrderId = oneCRowText(row, "externalOrderId", payment.externalOrderId || "");
  payment.marketplace = oneCRowText(row, "marketplace", payment.marketplace || "");
  payment.date = oneCRowText(row, "date", payment.date || today);
  payment.amount = oneCRowNumber(row, "amount", payment.amount || 0);
  payment.currency = oneCRowText(row, "currency", payment.currency || "UAH");
  payment.rate = oneCRowNumber(row, "rate", payment.rate || 1);
  payment.method = oneCRowText(row, ["method", "source"], payment.method || "1C");
  payment.bankRef = bankRef || payment.bankRef || "";
  payment.comment = oneCRowText(row, "comment", payment.comment || "Імпортовано з 1C");
  payment.status = oneCRowText(row, "status", payment.status || "paid");
  const invoice = byId(state.invoices, payment.invoiceId);
  if (isNew && invoice && payment.amount) {
    invoice.paid = Math.min(Number(invoice.total || 0), Number(invoice.paid || 0) + convertMoney(payment.amount, payment.currency, invoice.currency || "UAH"));
    invoice.status = invoiceDebt(invoice) <= 0 ? "paid" : "partial";
  }
  const order = byId(state.marketplaceOrders, payment.marketplaceOrderId)
    || state.marketplaceOrders.find((item) => payment.externalOrderId && item.externalOrderId === payment.externalOrderId);
  if (order) {
    order.payment = {
      ...(order.payment || {}),
      status: payment.status === "paid" ? "paid" : (order.payment?.status || "expected"),
      amount: payment.amount,
      method: payment.method,
      apiStatus: "Оплата отримана з 1C"
    };
    if (payment.status === "paid" && ["waiting_payment", "confirmed_by_client", "upsell"].includes(normalizeMarketplaceOrderStatus(order.status))) {
      setMarketplaceOrderWorkflowStage(order, "paid", { nextAction: "Передати замовлення на комплектацію." });
    }
  }
  return payment;
}

function upsertOneCPayable(row) {
  const id = oneCRowText(row, ["crmId", "payableId", "id"], uniqueId("ap"));
  let payable = byId(state.payables || [], id);
  if (!payable) {
    payable = { id };
    state.payables = state.payables || [];
    state.payables.push(payable);
  }
  payable.supplier = oneCRowText(row, "supplier", payable.supplier || "");
  payable.manager = oneCRowText(row, "manager", payable.manager || state.currentManager);
  payable.article = oneCRowText(row, "article", payable.article || "Закупівля товару");
  payable.amount = oneCRowNumber(row, "amount", payable.amount || 0);
  payable.currency = oneCRowText(row, "currency", payable.currency || "UAH");
  payable.dueDate = oneCRowText(row, "dueDate", payable.dueDate || today);
  payable.status = oneCRowText(row, "status", payable.status || "open");
  payable.comment = oneCRowText(row, "comment", payable.comment || "Імпортовано з 1C");
  return payable;
}

function upsertOneCWarehouse(row) {
  const id = oneCRowText(row, ["warehouseId", "warehouseCode", "warehouse_code", "code", "id"], "sql-total");
  const name = oneCRowText(row, ["warehouse", "warehouseName", "warehouse_name", "name", "title"], id === "sql-total" ? "SQL загальний залишок" : `Склад ${id}`);
  let warehouse = byId(state.warehouses, id);
  if (!warehouse) {
    warehouse = {
      id,
      name,
      kind: oneCRowText(row, ["kind", "type"], "own"),
      clientId: ""
    };
    state.warehouses.push(warehouse);
  }
  warehouse.name = name || warehouse.name;
  warehouse.kind = oneCRowText(row, ["kind", "type"], warehouse.kind || "own");
  warehouse.clientId = oneCRowText(row, ["clientId", "client_id"], warehouse.clientId || "");
  return warehouse;
}

function upsertOneCFirm(row) {
  state.settings = state.settings || {};
  state.settings.firms = state.settings.firms || [];
  const id = oneCRowText(row, ["firmId", "firmCode", "firm_code", "organizationId", "organization_id", "organizationCode", "organization_code", "code", "id"], "sql-main");
  const name = oneCRowText(row, ["firm", "firmName", "firm_name", "organization", "organizationName", "organization_name", "name", "title"], id === "sql-main" ? "SQL основна фірма" : `Фірма ${id}`);
  let firm = byId(state.settings.firms, id);
  if (!firm) {
    firm = {
      id,
      name,
      taxMode: oneCRowText(row, ["taxMode", "tax_mode"], ""),
      iban: oneCRowText(row, "iban", ""),
      bank: oneCRowText(row, "bank", "")
    };
    state.settings.firms.push(firm);
  }
  firm.name = name || firm.name;
  firm.taxMode = oneCRowText(row, ["taxMode", "tax_mode"], firm.taxMode || "");
  firm.iban = oneCRowText(row, "iban", firm.iban || "");
  firm.bank = oneCRowText(row, "bank", firm.bank || "");
  return firm;
}

function upsertOneCStock(row) {
  const product = findProductForOneC(row);
  if (!product) return null;
  const warehouse = upsertOneCWarehouse(row);
  const warehouseId = warehouse?.id || oneCRowText(row, ["warehouseId", "warehouseCode", "warehouse_code"], state.warehouses[0]?.id || "wh-main");
  const warehouseLabel = warehouse?.name || oneCRowText(row, ["warehouse", "warehouseName", "warehouse_name"], warehouseId);
  if (warehouseId && !byId(state.warehouses, warehouseId)) {
    state.warehouses.push({
      id: warehouseId,
      name: warehouseLabel || `1C склад ${warehouseId}`,
      kind: "own",
      clientId: ""
    });
  }
  const firmId = oneCRowText(row, ["firmId", "organizationCode", "organization_code", "firmCode", "firm_code"], state.settings.firms[0]?.id || "sql-main");
  const clientId = oneCRowText(row, ["clientCrmId", "clientId", "customerId", "counterpartyCode", "counterparty_code"]);
  let stock = state.stock.find((item) => (
    item.productId === product.id
    && item.warehouseId === warehouseId
    && (item.firmId || "vat") === firmId
    && (item.clientId || "") === clientId
  ));
  if (!stock) {
    stock = { productId: product.id, warehouseId, firmId, clientId, qty: 0 };
    state.stock.push(stock);
  }
  stock.qty = oneCRowNumber(row, ["qty", "quantity", "availableQuantity", "available_quantity", "totalQuantity", "total_quantity", "balance"], stock.qty || 0);
  stock.available = oneCRowNumber(row, ["available", "availableQuantity", "available_quantity"], stock.available || stock.qty || 0);
  stock.reserved = oneCRowNumber(row, ["reserved", "reservedQuantity", "reserved_quantity"], stock.reserved || 0);
  return stock;
}

function updateOneCReceivable(row) {
  const invoice = byId(state.invoices, oneCRowText(row, ["invoiceId", "crmId", "id"]));
  if (!invoice) return null;
  if (row.paid !== undefined) invoice.paid = oneCRowNumber(row, "paid", invoice.paid || 0);
  if (row.debt !== undefined) invoice.paid = Math.max(0, Number(invoice.total || 0) - oneCRowNumber(row, "debt", invoiceDebt(invoice)));
  invoice.status = invoiceDebt(invoice) <= 0 ? "paid" : "partial";
  return invoice;
}

function upsertOneCReceivableMirror(row) {
  const existing = updateOneCReceivable(row);
  if (existing) return existing;
  const client = upsertOneCClient(row);
  const id = oneCRowText(row, ["invoiceId", "crmId", "id", "settlementId", "settlement_id", "counterpartyCode", "counterparty_code"], uniqueId("inv"));
  let invoice = byId(state.invoices, id);
  if (!invoice) {
    invoice = {
      id,
      orderId: "",
      clientId: client?.id || "",
      manager: oneCRowText(row, "manager", state.currentManager),
      firmId: oneCRowText(row, ["firmId", "firmCode", "firm_code", "organizationCode", "organization_code"], state.settings.firms[0]?.id || "sql-main"),
      date: oneCRowText(row, ["date", "documentDate", "document_date"], today),
      dueDate: oneCRowText(row, ["dueDate", "due_date"], ""),
      total: 0,
      paid: 0,
      currency: oneCRowText(row, "currency", "UAH"),
      status: "partial",
      method: "1C / SQL",
      comment: "CRM SQL receivable"
    };
    state.invoices.push(invoice);
  }
  const debt = oneCRowNumber(row, ["debt", "balance", "amountDebt", "amount_debt"], invoiceDebt(invoice));
  const paid = oneCRowNumber(row, "paid", invoice.paid || 0);
  const total = oneCRowNumber(row, ["total", "amount", "turnover", "balanceTotal", "balance_total"], debt + paid);
  invoice.clientId = client?.id || invoice.clientId || "";
  invoice.manager = oneCRowText(row, "manager", invoice.manager || state.currentManager);
  invoice.firmId = oneCRowText(row, ["firmId", "firmCode", "firm_code", "organizationCode", "organization_code"], invoice.firmId || state.settings.firms[0]?.id || "sql-main");
  invoice.date = oneCRowText(row, ["date", "documentDate", "document_date"], invoice.date || today);
  invoice.dueDate = oneCRowText(row, ["dueDate", "due_date"], invoice.dueDate || "");
  invoice.currency = oneCRowText(row, "currency", invoice.currency || "UAH");
  invoice.total = total;
  invoice.paid = paid || Math.max(0, total - debt);
  invoice.status = invoiceDebt(invoice) <= 0 ? "paid" : "partial";
  invoice.comment = oneCRowText(row, "comment", invoice.comment || "CRM SQL receivable");
  return invoice;
}

function updateOneCShipment(row) {
  const orderId = oneCRowText(row, ["crmOrderId", "marketplaceOrderId", "orderId", "crmId"]);
  const externalOrderId = oneCRowText(row, "externalOrderId");
  const order = byId(state.marketplaceOrders, orderId)
    || state.marketplaceOrders.find((item) => externalOrderId && item.externalOrderId === externalOrderId);
  const ttn = oneCRowText(row, "ttn");
  const service = oneCRowText(row, ["deliveryService", "service"]);
  const statusText = oneCRowText(row, ["status", "deliveryStatus"]).toLowerCase();
  if (order) {
    order.delivery = {
      ...(order.delivery || {}),
      ttn: ttn || order.delivery?.ttn || "",
      service: service || order.delivery?.service || "",
      apiStatus: "Відвантаження отримано з 1C"
    };
    if (statusText.includes("достав") || statusText.includes("delivered")) {
      setMarketplaceOrderWorkflowStage(order, "delivered", { nextAction: "Завершити продаж і запланувати follow-up." });
    } else if (ttn || statusText.includes("відправ") || statusText.includes("ship")) {
      setMarketplaceOrderWorkflowStage(order, "shipped", { nextAction: "Контролювати доставку по ТТН." });
    }
  }
  const invoice = byId(state.invoices, oneCRowText(row, "invoiceId"));
  if (invoice) {
    invoice.ttn = ttn || invoice.ttn || "";
    invoice.delivery = service || invoice.delivery || "";
  }
  return order || invoice || null;
}

function applyOneCImportPayload(payload) {
  const summary = {
    products: 0,
    clients: 0,
    warehouses: 0,
    firms: 0,
    payments: 0,
    receivables: 0,
    payables: 0,
    stock: 0,
    shipments: 0
  };
  oneCCombinedRows(payload, ["products", "nomenclature"]).forEach((row) => {
    upsertOneCProduct(row);
    summary.products += 1;
  });
  oneCCombinedRows(payload, ["clients", "customers", "counterparties"]).forEach((row) => {
    upsertOneCClient(row);
    summary.clients += 1;
  });
  oneCCombinedRows(payload, ["warehouses"]).forEach((row) => {
    upsertOneCWarehouse(row);
    summary.warehouses += 1;
  });
  oneCCombinedRows(payload, ["firms", "organizations"]).forEach((row) => {
    upsertOneCFirm(row);
    summary.firms += 1;
  });
  oneCImportRows(payload, "payments").forEach((row) => {
    upsertOneCPayment(row);
    summary.payments += 1;
  });
  oneCCombinedRows(payload, ["receivables", "counterpartyBalances", "counterparty_balances"]).forEach((row) => {
    if (upsertOneCReceivableMirror(row)) summary.receivables += 1;
  });
  oneCImportRows(payload, "payables").forEach((row) => {
    upsertOneCPayable(row);
    summary.payables += 1;
  });
  oneCCombinedRows(payload, ["stock", "stockBalances", "stock_balances"]).forEach((row) => {
    if (upsertOneCStock(row)) summary.stock += 1;
  });
  oneCImportRows(payload, "shipments").forEach((row) => {
    if (updateOneCShipment(row)) summary.shipments += 1;
  });
  syncCatalogParametersFromProducts(state);
  return summary;
}

function oneCImportSummaryText(summary) {
  return Object.entries(summary)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ") || "даних для оновлення не знайдено";
}

function importOneCPackage(form) {
  if (!canCreateDocument("dataExchange") || !canEditField("dataExchangeScope")) {
    return alert("Поточна роль не має права імпортувати відповідь 1C.");
  }
  try {
    const data = formData(form);
    const payload = JSON.parse(data.oneCPayload || "{}");
    const summary = applyOneCImportPayload(payload);
    updateOneCConnectionStatus({
      lastImport: currentTimestamp(),
      lastStatus: "imported",
      lastMessage: `OK: імпортовано відповідь 1C (${oneCImportSummaryText(summary)}).`
    });
    addAudit(`Імпортовано відповідь 1C: ${oneCImportSummaryText(summary)}`, "system");
    render();
  } catch (error) {
    updateOneCConnectionStatus({
      lastImport: currentTimestamp(),
      lastStatus: "error",
      lastMessage: `Помилка імпорту 1C: ${error.message}`
    });
    render();
    alert(`Помилка імпорту 1C: ${error.message}`);
  }
}

async function importOneCLatestFromServer({ silent = false } = {}) {
  if (!canCreateDocument("dataExchange") || !canEditField("dataExchangeScope")) {
    if (!silent) alert("Поточна роль не має права імпортувати відповідь 1C.");
    return;
  }
  try {
    const response = await fetch("/api/onec/latest?scope=products_stock", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    const connection = dataExchangeState().oneCConnection || {};
    if (silent && connection.lastSourceFile === data.fullName && connection.lastSourceModifiedAt === data.modifiedAt) {
      return;
    }
    const summary = applyOneCImportPayload(data.payload || {});
    updateOneCConnectionStatus({
      lastImport: currentTimestamp(),
      lastStatus: "imported",
      lastSourceFile: data.fullName || data.fileName || "",
      lastSourceModifiedAt: data.modifiedAt || "",
      lastMessage: `OK: імпортовано з ToCRM ${data.fileName || ""} (${oneCImportSummaryText(summary)}).`
    });
    addAudit(`Імпортовано 1C -> CRM з папки ToCRM: ${data.fileName || "-"} (${oneCImportSummaryText(summary)})`, "system");
    render();
    if (!silent) alert(`Імпортовано: ${oneCImportSummaryText(summary)}`);
  } catch (error) {
    updateOneCConnectionStatus({
      lastImport: currentTimestamp(),
      lastStatus: "error",
      lastMessage: `Помилка імпорту з ToCRM: ${error.message}`
    });
    if (!silent) {
      render();
      alert(`Помилка імпорту з ToCRM: ${error.message}`);
    }
  }
}

async function importOneCSqlLatestFromServer({ silent = false } = {}) {
  if (!canCreateDocument("dataExchange") || !canEditField("dataExchangeScope")) {
    if (!silent) alert("Поточна роль не має права імпортувати дані з CRM SQL.");
    return;
  }
  try {
    const response = await fetch("/api/crm-sql/latest?limit=1000", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    const payload = data.payload || data.data || {};
    const summary = applyOneCImportPayload(payload);
    const warnings = Array.isArray(data.warnings) && data.warnings.length
      ? ` Попередження: ${data.warnings.length}.`
      : "";
    updateOneCConnectionStatus({
      lastImport: currentTimestamp(),
      lastStatus: "imported",
      lastSourceFile: "CRM SQL API",
      lastSourceModifiedAt: data.generatedAt || "",
      lastMessage: `OK: імпортовано з CRM SQL (${oneCImportSummaryText(summary)}).${warnings}`
    });
    addAudit(`Імпортовано CRM SQL -> CRM: ${oneCImportSummaryText(summary)}${warnings}`, "system");
    render();
    if (!silent) alert(`Імпортовано з CRM SQL: ${oneCImportSummaryText(summary)}${warnings}`);
  } catch (error) {
    updateOneCConnectionStatus({
      lastImport: currentTimestamp(),
      lastStatus: "error",
      lastMessage: `Помилка імпорту CRM SQL: ${error.message}`
    });
    if (!silent) {
      render();
      alert(`Помилка імпорту CRM SQL: ${error.message}`);
    }
  }
}

function setOneCAutoImport(enabled) {
  oneCAutoImportEnabled = Boolean(enabled);
  appLocalStorage.setItem("arms-crm-onec-auto-import", oneCAutoImportEnabled ? "true" : "false");
  syncOneCAutoImportTimer();
  updateOneCConnectionStatus({
    lastStatus: oneCAutoImportEnabled ? "draft" : (dataExchangeState().oneCConnection?.lastStatus || "draft"),
    lastMessage: oneCAutoImportEnabled
      ? "Автоімпорт ToCRM увімкнено: CRM перевіряє останній JSON кожні 60 секунд."
      : "Автоімпорт ToCRM вимкнено."
  });
  render();
}

function syncOneCAutoImportTimer() {
  if (oneCAutoImportTimer) {
    clearInterval(oneCAutoImportTimer);
    oneCAutoImportTimer = null;
  }
  if (!oneCAutoImportEnabled) return;
  oneCAutoImportTimer = setInterval(() => {
    if (dataExchangeState().channel === "bas") {
      importOneCLatestFromServer({ silent: true });
    }
  }, 60000);
}

function handleOneCPayloadFile(input) {
  const file = input.files?.[0];
  const form = input.closest('[data-action="import-onec-package"]');
  const textarea = form?.querySelector('[name="oneCPayload"]');
  if (!file || !textarea) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    textarea.value = String(reader.result || "");
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  });
  reader.addEventListener("error", () => {
    alert(`Не вдалося прочитати файл ${file.name}.`);
  });
  reader.readAsText(file, "utf-8");
}

function oneCDemoPayload() {
  const product = state.products[0] || {};
  const client = state.clients[0] || {};
  const order = state.marketplaceOrders[0] || {};
  const invoice = state.invoices.find((item) => invoiceDebt(item) > 0) || state.invoices[0] || {};
  return {
    schema: "marketplace-crm.onec.exchange.v1",
    generatedAt: currentTimestamp(),
    direction: "1C_TO_CRM",
    products: [{
      crmId: product.id || "p-demo-1c",
      name: product.id ? `${product.brand || ""} ${product.model || ""}`.trim() : "Demo товар 1C",
      brand: product.brand || "Demo",
      model: product.model || "Товар 1C",
      internalCode: product.internalCode || "1C-DEMO-001",
      barcode: product.barcode || "4820000000011",
      price: product.price || 100,
      currency: "UAH"
    }],
    clients: [{
      crmId: client.id || "c-demo-1c",
      name: client.name || "Demo клієнт 1C",
      phone: client.phone || "+380000000000",
      email: client.email || "demo@example.local",
      type: client.type || "B2C"
    }],
    payments: invoice.id ? [{
      id: `1c-pay-${String(Date.now()).slice(-6)}`,
      invoiceId: invoice.id,
      date: today,
      amount: Math.min(invoiceDebt(invoice), 100),
      currency: invoice.currency || "UAH",
      method: "1C банк",
      bankRef: `1C-DEMO-${String(Date.now()).slice(-6)}`,
      status: "paid"
    }] : [],
    receivables: invoice.id ? [{
      invoiceId: invoice.id,
      paid: invoice.paid || 0,
      debt: invoiceDebt(invoice)
    }] : [],
    stock: product.id ? [{
      productCrmId: product.id,
      warehouseId: "wh-main",
      firmId: "vat",
      qty: 12
    }] : [],
    shipments: order.id ? [{
      crmOrderId: order.id,
      externalOrderId: order.externalOrderId || order.id,
      ttn: `TTN-1C-${String(Date.now()).slice(-5)}`,
      deliveryService: "Нова пошта",
      status: "shipped"
    }] : [],
    payables: [{
      id: `1c-ap-${String(Date.now()).slice(-6)}`,
      supplier: "Demo постачальник 1C",
      article: "Закупівля товару",
      amount: 1500,
      currency: "UAH",
      dueDate: today,
      status: "open"
    }]
  };
}

function importOneCDemo() {
  if (!canCreateDocument("dataExchange") || !canEditField("dataExchangeScope")) {
    return alert("Поточна роль не має права імпортувати demo-відповідь 1C.");
  }
  const summary = applyOneCImportPayload(oneCDemoPayload());
  updateOneCConnectionStatus({
    lastImport: currentTimestamp(),
    lastStatus: "imported",
    lastMessage: `OK: demo-відповідь 1C застосовано (${oneCImportSummaryText(summary)}).`
  });
  addAudit(`Застосовано demo-відповідь 1C: ${oneCImportSummaryText(summary)}`, "system");
  render();
}

function positionFunnelHoverMenu(card) {
  const menu = card?.querySelector?.(".funnel-hover-menu");
  if (!menu) return;
  const rect = card.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 720;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1280;
  const margin = 12;
  const spaceBelow = Math.max(0, viewportHeight - rect.bottom - margin);
  const spaceAbove = Math.max(0, rect.top - margin);
  const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
  const availableHeight = Math.max(120, Math.min(320, (openUp ? spaceAbove : spaceBelow) - 4));
  const estimatedWidth = Math.min(340, viewportWidth * 0.86);
  card.classList.toggle("menu-up", openUp);
  card.classList.toggle("menu-down", !openUp);
  card.classList.toggle("menu-align-right", rect.left + estimatedWidth > viewportWidth - margin && rect.right - estimatedWidth > margin);
  menu.style.setProperty("--funnel-menu-max-height", `${availableHeight}px`);
}

function positionFunnelHoverMenuFromEvent(event) {
  const card = event.target.closest?.(".funnel-card");
  if (card) positionFunnelHoverMenu(card);
}

document.addEventListener("pointerover", handleSidebarSubnavHover);
document.addEventListener("pointermove", handleSidebarSubnavHover);
document.addEventListener("pointerout", handleSidebarSubnavLeave);
document.addEventListener("mouseover", handleSidebarSubnavHover);
document.addEventListener("mouseout", handleSidebarSubnavLeave);
document.addEventListener("pointerover", positionFunnelHoverMenuFromEvent);
document.addEventListener("focusin", positionFunnelHoverMenuFromEvent);
window.addEventListener("resize", () => {
  document.querySelectorAll(".funnel-card:hover, .funnel-card:focus-within").forEach(positionFunnelHoverMenu);
});
window.addEventListener("scroll", () => {
  document.querySelectorAll(".funnel-card:hover, .funnel-card:focus-within").forEach(positionFunnelHoverMenu);
}, true);

document.addEventListener("click", (event) => {
  const productRow = event.target.closest("[data-open-product]");
  if (productRow && !event.target.closest("button, a, input, select, textarea, label")) {
    openProductCard(productRow.dataset.openProduct);
    return;
  }
  const marketplaceOrderRow = event.target.closest("[data-edit-marketplace-order]");
  if (marketplaceOrderRow && !event.target.closest("button, a, input, select, textarea, label")) {
    editMarketplaceOrderDocument(marketplaceOrderRow.dataset.editMarketplaceOrder);
    return;
  }
  const funnelCard = event.target.closest("[data-open-funnel-order]");
  if (funnelCard && !event.target.closest(".funnel-hover-menu, button, a, input, select, textarea, label")) {
    editMarketplaceOrderDocument(funnelCard.dataset.openFunnelOrder);
    return;
  }
  const marketplaceQuestionRow = event.target.closest("[data-open-marketplace-question]");
  if (marketplaceQuestionRow && !event.target.closest("button, a, input, select, textarea, label")) {
    openMarketplaceQuestionReply(marketplaceQuestionRow.dataset.openMarketplaceQuestion);
    return;
  }
  const marketplaceThreadRow = event.target.closest("[data-open-marketplace-thread]");
  if (marketplaceThreadRow && !event.target.closest("button, a, input, select, textarea, label")) {
    openMarketplaceThreadReply(marketplaceThreadRow.dataset.openMarketplaceThread);
    return;
  }
  const publicationRow = event.target.closest("[data-edit-publication]");
  if (publicationRow && !event.target.closest("button, a, input, select, textarea, label")) {
    editPublication(publicationRow.dataset.editPublication);
    return;
  }
  const clientRow = event.target.closest("[data-open-client]");
  if (clientRow && !event.target.closest("button, a, input, select, textarea, label")) {
    openClientCard(clientRow.dataset.openClient);
    return;
  }
  const requestBatchRow = event.target.closest("[data-open-client-request-batch]");
  if (requestBatchRow && !event.target.closest("button, a, input, select, textarea, label")) {
    openClientRequestBatch(requestBatchRow.dataset.openClientRequestBatch, requestBatchRow.dataset.clientId);
    return;
  }

  const target = event.target.closest("button");
  if (!target) return;

  if (target.dataset.openCreateProduct !== undefined) {
    openCreateProductForm();
    return;
  }
  if (target.dataset.openCreatePublication !== undefined) {
    openCreateMarketplacePublicationForm();
    return;
  }
  if (target.dataset.openCreateMarketplaceOrder !== undefined) {
    openCreateMarketplaceOrderForm();
    return;
  }
  if (target.dataset.marketplaceQuestionType) {
    state.marketplaceCommunicationFilters = {
      ...marketplaceCommunicationFilter(),
      questionType: target.dataset.marketplaceQuestionType
    };
    render();
    requestAnimationFrame(() => {
      document.querySelector("[data-marketplace-question-list]")?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
    return;
  }

  if (target.dataset.smartListToggle !== undefined || target.dataset.smartListClear !== undefined) {
    const frame = target.closest("[data-smart-list-key]");
    if (!frame) return;
    const preferences = smartListPreferences(frame.dataset.smartListKey);
    if (target.dataset.smartListClear !== undefined) {
      preferences.from = "";
      preferences.to = "";
    } else {
      preferences.collapsed = !preferences.collapsed;
    }
    applySmartListState(frame);
    saveState();
    return;
  }

  if (target.dataset.tableSortIndex !== undefined) {
    const table = target.closest("table");
    if (table) sortDomTable(table, Number(target.dataset.tableSortIndex));
    return;
  }
  if (target.dataset.subviewButton !== undefined) {
    const viewId = target.closest("#subnav-flyout")?.dataset.subnavView || state.currentView;
    if (!canAccessView(viewId)) return alert("Поточна роль не має доступу до цього розділу.");
    state.currentSubViews = state.currentSubViews || {};
    state.currentView = viewId;
    state.currentSubViews[viewId] = target.dataset.subviewButton;
    hideSidebarSubnav();
    render();
    return;
  }

  if (target.dataset.demoLogin !== undefined) {
    const form = document.querySelector('form[data-action="login"]');
    if (form?.elements.login) form.elements.login.value = target.dataset.demoLogin || "";
    if (form?.elements.password) form.elements.password.value = target.dataset.demoPassword || "";
    if (form) loginUser(form);
    return;
  }

  if (target.id === "sidebar-toggle") {
    sidebarCollapsed = !sidebarCollapsed;
    appLocalStorage.setItem("arms-crm-sidebar-collapsed", sidebarCollapsed ? "true" : "false");
    document.body.classList.toggle("sidebar-collapsed", sidebarCollapsed);
    syncSidebarToggleButton();
    return;
  }
  if (target.id === "logout-button") {
    logoutUser();
    return;
  }
  if (target.dataset.clientView) {
    clientPortalView = target.dataset.clientView === "catalog" ? "catalog" : "cabinet";
    appSessionStorage.setItem("arms-crm-client-view", clientPortalView);
    render();
    return;
  }
  if (target.dataset.resetClientCatalogFilters !== undefined) {
    clientCatalogFilters = defaultClientCatalogFilters();
    saveClientCatalogFilters();
    render();
    return;
  }
  if (target.dataset.updateClientRequest) {
    const input = document.querySelector(`[data-client-request-qty="${CSS.escape(target.dataset.updateClientRequest)}"]`);
    updateClientB2BShipmentRequestQty(target.dataset.updateClientRequest, input?.value);
    return;
  }
  if (target.dataset.cancelClientRequest) {
    cancelClientB2BShipmentRequest(target.dataset.cancelClientRequest, true);
    return;
  }
  if (target.dataset.confirmClientRequests) {
    confirmClientB2BShipmentRequests(target.dataset.confirmClientRequests);
    return;
  }
  if (target.dataset.scrollToClientCart !== undefined) {
    const cart = $("#client-request-cart");
    cart?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (target.dataset.saveEmployee) {
    saveEmployee(target.dataset.saveEmployee);
    return;
  }
  if (target.dataset.togglePriceType) {
    togglePriceType(target.dataset.togglePriceType);
    return;
  }
  if (target.dataset.view) {
    if (!canAccessView(target.dataset.view)) return alert("Поточна роль не має доступу до цього розділу.");
    state.currentView = target.dataset.view;
    render();
  }
  if (target.dataset.quickProduct) {
    saleDraft.lines = [defaultSaleLine(target.dataset.quickProduct)];
    state.currentView = "sales";
    render();
  }
  if (target.dataset.addSaleLine !== undefined) {
    const form = target.closest('[data-action="create-invoice"]');
    if (form) updateSaleDraftFromForm(form);
    saleDraft.lines = [...saleDraftLines(), defaultSaleLine()];
    render();
    return;
  }
  if (target.dataset.removeSaleLine !== undefined) {
    const form = target.closest('[data-action="create-invoice"]');
    if (form) updateSaleDraftFromForm(form);
    const index = Number(target.dataset.removeSaleLine);
    const lines = saleDraftLines().filter((_, lineIndex) => lineIndex !== index);
    saleDraft.lines = lines.length ? lines : [defaultSaleLine()];
    render();
    return;
  }
  if (target.dataset.addPurchaseLine !== undefined) {
    const form = target.closest('[data-action="create-purchase"]');
    if (form) updatePurchaseDraftFromForm(form);
    purchaseDraft.lines = [...purchaseDraftLines(), defaultPurchaseLine()];
    render();
    return;
  }
  if (target.dataset.removePurchaseLine !== undefined) {
    const form = target.closest('[data-action="create-purchase"]');
    if (form) updatePurchaseDraftFromForm(form);
    const index = Number(target.dataset.removePurchaseLine);
    const lines = purchaseDraftLines().filter((_, lineIndex) => lineIndex !== index);
    purchaseDraft.lines = lines.length ? lines : [defaultPurchaseLine()];
    render();
    return;
  }
  if (target.dataset.addMarketplacePublicationLine !== undefined) {
    const form = target.closest('[data-action="create-marketplace-publication"]');
    if (form) updateMarketplacePublicationDraftFromForm(form);
    marketplacePublicationDraft.lines = [...marketplacePublicationDraftLines(), defaultMarketplacePublicationLine()];
    if (refreshMarketplacePublicationModal(form)) return;
    render();
    return;
  }
  if (target.dataset.removeMarketplacePublicationLine !== undefined) {
    const form = target.closest('[data-action="create-marketplace-publication"]');
    if (form) updateMarketplacePublicationDraftFromForm(form);
    const index = Number(target.dataset.removeMarketplacePublicationLine);
    const lines = marketplacePublicationDraftLines().filter((_, lineIndex) => lineIndex !== index);
    marketplacePublicationDraft.lines = lines.length ? lines : [defaultMarketplacePublicationLine()];
    if (refreshMarketplacePublicationModal(form)) return;
    render();
    return;
  }
  if (target.dataset.generateProductBarcode !== undefined) {
    const form = target.closest('[data-action="create-product"], [data-action="update-product"]');
    const barcodeInput = form?.elements.barcode;
    if (barcodeInput) barcodeInput.value = generateEan13();
  }
  if (target.dataset.removeProductPhoto) {
    productImagesDraft = productImagesDraft.filter((photo) => photo.id !== target.dataset.removeProductPhoto);
    renderProductPhotoPreview(target.closest("form") || document);
  }
  if (target.dataset.exportMarketplace) exportMarketplaceCatalog(target.dataset.exportMarketplace);
  if (target.dataset.syncMarketplaceStocks !== undefined) syncMarketplaceStocks();
  if (target.dataset.syncMarketplacePrices !== undefined) syncMarketplacePrices();
  if (target.dataset.importMarketplaceOrders !== undefined) importDemoMarketplaceOrder();
  if (target.dataset.editPublication) editPublication(target.dataset.editPublication);
  if (target.dataset.syncPublication) syncPublication(target.dataset.syncPublication);
  if (target.dataset.editMarketplaceOrder) editMarketplaceOrderDocument(target.dataset.editMarketplaceOrder);
  if (target.dataset.openOrderCallback) openOrderCallbackForm(target.dataset.openOrderCallback);
  if (target.dataset.openOrderMessage) openOrderMessageForm(target.dataset.openOrderMessage);
  if (target.dataset.replyMarketplaceQuestion) openMarketplaceQuestionReply(target.dataset.replyMarketplaceQuestion);
  if (target.dataset.replyMarketplaceThread) openMarketplaceThreadReply(target.dataset.replyMarketplaceThread);
  if (target.dataset.sendViberOrder) sendViberOrderMessage(target.dataset.sendViberOrder);
  if (target.dataset.openViberChat) openViberChat(target.dataset.openViberChat);
  if (target.dataset.startCallRecording) startCallRecording(target.dataset.startCallRecording);
  if (target.dataset.stopCallRecording) stopCallRecording(target.dataset.stopCallRecording).catch((error) => alert(`Не вдалося зупинити запис: ${error.message}`));
  if (target.dataset.deleteCallRecording) deleteCallRecording(target.dataset.deleteCallRecording);
  if (target.dataset.runOrderAutomation) runMarketplaceOrderAutomationById(target.dataset.runOrderAutomation);
  if (target.dataset.remindMarketplaceOrder) remindMarketplaceOrder(target.dataset.remindMarketplaceOrder);
  if (target.dataset.notifyMarketplaceOrder) notifyMarketplaceOrder(target.dataset.notifyMarketplaceOrder);
  if (target.dataset.createClientFromOrder) createClientFromOrder(target.dataset.createClientFromOrder);
  if (target.dataset.marketplaceWaitClient) waitMarketplaceClientConfirmation(target.dataset.marketplaceWaitClient);
  if (target.dataset.agreeMarketplaceOrder) agreeMarketplaceOrder(target.dataset.agreeMarketplaceOrder);
  if (target.dataset.marketplaceWaitPayment) waitMarketplacePayment(target.dataset.marketplaceWaitPayment);
  if (target.dataset.openMarketplacePayment) openMarketplaceOrderPaymentForm(target.dataset.openMarketplacePayment);
  if (target.dataset.marketplaceToWarehouse) sendMarketplaceOrderToWarehouse(target.dataset.marketplaceToWarehouse);
  if (target.dataset.invoiceMarketplaceOrder) createInvoiceFromMarketplaceOrder(target.dataset.invoiceMarketplaceOrder);
  if (target.dataset.marketplacePicked) markMarketplacePicked(target.dataset.marketplacePicked);
  if (target.dataset.marketplaceHandoverDelivery) handoverMarketplaceOrderToDelivery(target.dataset.marketplaceHandoverDelivery);
  if (target.dataset.marketplaceToDelivery) sendMarketplaceOrderToDelivery(target.dataset.marketplaceToDelivery);
  if (target.dataset.marketplaceUpsell) markMarketplaceUpsell(target.dataset.marketplaceUpsell);
  if (target.dataset.marketplaceComplete) completeMarketplaceOrder(target.dataset.marketplaceComplete);
  if (target.dataset.marketplaceAftersale) markMarketplaceAftersale(target.dataset.marketplaceAftersale);
  if (target.dataset.marketplaceRepeatSale) markMarketplaceRepeatSale(target.dataset.marketplaceRepeatSale);
  if (target.dataset.marketplaceCancel) cancelMarketplaceOrder(target.dataset.marketplaceCancel);
  if (target.dataset.trackSelectedMarketplaceDelivery !== undefined) {
    const orderId = target.closest("[data-marketplace-api-panel]")?.querySelector('[name="orderId"]')?.value;
    if (!orderId) return alert("Оберіть замовлення для API-перевірки доставки.");
    trackMarketplaceDelivery(orderId);
    return;
  }
  if (target.dataset.trackSelectedMarketplacePayment !== undefined) {
    const orderId = target.closest("[data-marketplace-api-panel]")?.querySelector('[name="orderId"]')?.value;
    if (!orderId) return alert("Оберіть замовлення для API-перевірки оплати.");
    trackMarketplacePayment(orderId);
    return;
  }
  if (target.dataset.trackMarketplaceDelivery) trackMarketplaceDelivery(target.dataset.trackMarketplaceDelivery);
  if (target.dataset.trackMarketplacePayment) trackMarketplacePayment(target.dataset.trackMarketplacePayment);
  if (target.dataset.pullMarketplacePayment) pullMarketplacePayment(target.dataset.pullMarketplacePayment);
  if (target.dataset.resetMarketplaceOrderFilter !== undefined) {
    state.marketplaceOrderFilters = { from: "", to: "", status: "", marketplace: "", expanded: true };
    render();
    return;
  }
  if (target.dataset.resetMarketplacePublicationSearch !== undefined) {
    state.marketplacePublicationFilters = { search: "", expanded: true };
    render();
    return;
  }
  if (target.dataset.resetSalesClientFilter !== undefined) {
    state.salesClientFilters = { search: "", source: "", from: "", to: "", expanded: true };
    render();
    return;
  }
  if (target.dataset.resetProductTableSearch !== undefined) {
    const tableKey = target.dataset.resetProductTableSearch;
    state.productTableFilters = {
      ...productTableFilters(),
      [tableKey]: ""
    };
    const input = document.querySelector(`[data-product-table-search="${CSS.escape(tableKey)}"]`);
    if (input) input.value = "";
    applyProductTableSearch(tableKey);
    saveState();
    return;
  }
  if (target.dataset.resetB2bShipmentRequestFilter !== undefined) {
    state.b2bShipmentRequestFilters = { from: "", to: "", status: "", search: "", sortBy: "date", sortDir: "desc", expanded: true };
    render();
    return;
  }
  if (target.dataset.b2bShipmentRequestSort) {
    const current = b2bShipmentRequestFilter();
    const sortBy = target.dataset.b2bShipmentRequestSort;
    state.b2bShipmentRequestFilters = {
      ...current,
      sortBy,
      sortDir: current.sortBy === sortBy && current.sortDir === "asc" ? "desc" : "asc",
      expanded: true
    };
    render();
    return;
  }
  if (target.dataset.resetB2bResponsibleStorageFilter !== undefined) {
    state.b2bResponsibleStorageFilters = { from: "", to: "", clientId: "", productId: "", search: "", sortBy: "date", sortDir: "desc", expanded: true };
    render();
    return;
  }
  if (target.dataset.b2bResponsibleStorageSort) {
    const current = b2bResponsibleStorageFilter();
    const sortBy = target.dataset.b2bResponsibleStorageSort;
    state.b2bResponsibleStorageFilters = {
      ...current,
      sortBy,
      sortDir: current.sortBy === sortBy && current.sortDir === "asc" ? "desc" : "asc",
      expanded: true
    };
    render();
    return;
  }
  if (target.dataset.resetRozetkaImportedOrderFilter !== undefined) {
    state.rozetkaImportedOrderFilters = { ...clone(seedState.rozetkaImportedOrderFilters), expanded: true };
    render();
    return;
  }
  if (target.dataset.rozetkaImportAllGoods !== undefined) {
    const form = target.closest('[data-action="rozetka-import-goods"]');
    if (form?.elements.maxPages) form.elements.maxPages.value = "all";
    if (form?.requestSubmit) form.requestSubmit();
    else form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    return;
  }
  if (target.dataset.rozetkaImportAllOrders !== undefined) {
    const form = target.closest('[data-action="rozetka-import-orders"]');
    if (form?.elements.maxPages) form.elements.maxPages.value = "all";
    if (form?.elements.maxDetails) form.elements.maxDetails.value = "all";
    if (form?.requestSubmit) form.requestSubmit();
    else form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    return;
  }
  if (target.dataset.rozetkaOrderSort) {
    const current = rozetkaImportedOrderFilter();
    const sortBy = target.dataset.rozetkaOrderSort;
    state.rozetkaImportedOrderFilters = {
      ...current,
      sortBy,
      sortDir: current.sortBy === sortBy && current.sortDir === "asc" ? "desc" : "asc",
      expanded: true
    };
    render();
    return;
  }
  if (target.dataset.postInvoiceDraft) postInvoiceDraft(target.dataset.postInvoiceDraft);
  if (target.dataset.openInvoice) openInvoice(target.dataset.openInvoice);
  if (target.dataset.editInvoice) editInvoiceDocument(target.dataset.editInvoice);
  if (target.dataset.editPurchase) editPurchaseDocument(target.dataset.editPurchase);
  if (target.dataset.editPayment) editPaymentDocument(target.dataset.editPayment);
  if (target.dataset.editExpense) editExpenseDocument(target.dataset.editExpense);
  if (target.dataset.editPayable) editPayableDocument(target.dataset.editPayable);
  if (target.dataset.editResponsibleDoc) editResponsibleStorageDoc(target.dataset.editResponsibleDoc);
  if (target.dataset.openB2bShipmentRequest) openB2BShipmentRequest(target.dataset.openB2bShipmentRequest);
  if (target.dataset.fillB2bRequestStock !== undefined) {
    const form = target.closest('[data-action="approve-b2b-shipment-request"]');
    if (!form) return;
    if (form.elements.firmId) form.elements.firmId.value = target.dataset.firmId || "";
    if (form.elements.warehouseId) form.elements.warehouseId.value = target.dataset.warehouseId || "";
    const request = updateB2BShipmentRequestDraftFromForm(form);
    if (request) openB2BShipmentRequest(request.id);
    return;
  }
  if (target.dataset.rejectB2bShipmentRequest) rejectB2BShipmentRequest(target.dataset.rejectB2bShipmentRequest);
  if (target.dataset.editSerial) editSerialDocument(target.dataset.editSerial);
  if (target.dataset.openCabinet) openCabinet(target.dataset.openCabinet);
  if (target.dataset.exportB2bReport) exportB2BReport(target.dataset.clientId, target.dataset.exportB2bReport);
  if (target.dataset.payInvoice) openPayment(target.dataset.payInvoice);
  if (target.dataset.cancelInvoice) cancelInvoice(target.dataset.cancelInvoice);
  if (target.dataset.lockInvoice) {
    const invoice = byId(state.invoices, target.dataset.lockInvoice);
    invoice.locked = true;
    addAudit(`Накладну ${invoice.id} закрито від редагування`);
    render();
  }
  if (target.dataset.verifySerial) {
    const serial = byId(state.serials, target.dataset.verifySerial);
    serial.erzStatus = "verified";
    addAudit(`ЄРЗ підтверджено для серії ${serial.serial}`);
    render();
  }
  if (target.dataset.sync) {
    const integration = byId(state.integrations, target.dataset.sync);
    integration.status = "ok";
    integration.lastSync = `${today} ${new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}`;
    addAudit(`${integration.name}: виконано ручний двосторонній обмін`, "system");
    render();
  }
  if (target.dataset.exportBasPurchases !== undefined) {
    exportBasPurchases();
  }
  if (target.dataset.exportOnecPackage !== undefined) {
    exportOneCPackage();
  }
  if (target.dataset.importOnecLatest !== undefined) {
    importOneCLatestFromServer();
  }
  if (target.dataset.importOnecSql !== undefined) {
    importOneCSqlLatestFromServer();
  }
  if (target.dataset.toggleOnecAutoImport !== undefined) {
    setOneCAutoImport(!oneCAutoImportEnabled);
  }
  if (target.dataset.downloadOnecBridgeSpec !== undefined) {
    downloadOneCBridgeSpec();
  }
  if (target.dataset.importOnecDemo !== undefined) {
    importOneCDemo();
  }
  if (target.dataset.exportOnePurchase) {
    exportBasPurchases([target.dataset.exportOnePurchase]);
  }
  if (target.dataset.markPurchaseExported) {
    markPurchaseExported(target.dataset.markPurchaseExported);
  }
  if (target.dataset.basImportDemo !== undefined) {
    const demo = {
      purchases: [
        {
          date: today,
          supplier: "BAS demo supplier",
          supplierDoc: `BAS-${String(Date.now()).slice(-5)}`,
          firmId: "vat",
          warehouseId: "wh-main",
          productId: "p-100",
          qty: 1,
          cost: 1500,
          currency: "USD",
          serials: [`BAS-DEMO-${String(Date.now()).slice(-5)}`],
          erzStatus: "pending",
          actual: true
        }
      ]
    };
    const form = $('[data-action="import-bas-purchases"]');
    const textarea = form?.querySelector('[name="basPayload"]');
    if (textarea) textarea.value = JSON.stringify(demo, null, 2);
  }
  if (target.dataset.type) {
    $$(".segmented button").forEach((button) => button.classList.toggle("active", button === target));
    const type = target.dataset.type;
    $("#products-body").innerHTML = productRows(type === "all" ? state.products : state.products.filter((product) => product.type === type));
  }
  if (target.dataset.createInventoryReport !== undefined) {
    const rows = filteredInventoryRows();
    const filter = state.inventoryFilters || {};
    const value = formatMoney(rows.reduce((sum, row) => sum + row.valueUAH, 0));
    const filterText = [
      filter.warehouseId ? `склад: ${warehouseName(filter.warehouseId)}` : "всі склади",
      filter.firmId ? `фірма: ${firmName(filter.firmId)}` : "всі фірми"
    ].join(" · ");
    openModal("Інвентаризаційний звіт", `<p class="notice">Сформовано на ${today}. Відбір: ${escapeHtml(filterText)}. Загальна вартість залишків: <strong>${value}</strong>. Рядків у звіті: ${rows.length}.</p>`);
  }
  if (target.dataset.printScope) {
    printScope(target.dataset.printScope);
    return;
  }
  if (target.id === "export-json") exportJson();
  if (target.id === "reset-demo") {
    if (isClientAuthenticated()) return alert("B2B кабінет не може скидати demo-дані CRM.");
    if (confirm("Скинути локальні demo-дані?")) {
      state = normalizeState(clone(seedState));
      saleDraft = { clientId: "", priceType: "", lines: [defaultSaleLine("p-200")] };
      purchaseDraft = { lines: [defaultPurchaseLine()] };
      marketplacePublicationDraft = { lines: [defaultMarketplacePublicationLine()] };
      b2bDraft = { shipmentProductId: "p-100", saleProductId: "p-100", saleClientId: "c-001", shipmentFirmId: "vat", saleFirmId: "vat" };
      clientPortalDraft = { productId: "", firmId: "", barcode: "", qty: 1, serialIds: [], permitNumber: "", permitDate: "" };
      paymentDraft = { source: "cash", kind: "invoice", clientId: "", invoiceId: "", firmId: "", terminalId: "", prro: "true" };
      productImagesDraft = [];
      render();
    }
  }
  if (target.dataset.closeModal !== undefined) {
    const backdrop = target.closest(".modal-backdrop");
    if (backdrop?.querySelector('[data-action="update-product"]')) productImagesDraft = [];
    backdrop?.remove();
  }
});

document.addEventListener("toggle", (event) => {
  if (event.target.matches?.("[data-rozetka-imported-orders-dropdown]")) {
    state.rozetkaImportedOrderFilters = {
      ...rozetkaImportedOrderFilter(),
      expanded: event.target.open
    };
    updateDropdownHint(event.target);
    saveState();
    return;
  }
  if (event.target.matches?.("[data-marketplace-publications-dropdown]")) {
    state.marketplacePublicationFilters = {
      ...marketplacePublicationFilter(),
      expanded: event.target.open
    };
    updateDropdownHint(event.target);
    saveState();
    return;
  }
  if (event.target.matches?.("[data-marketplace-orders-dropdown]")) {
    state.marketplaceOrderFilters = {
      ...marketplaceOrderFilter(),
      expanded: event.target.open
    };
    updateDropdownHint(event.target);
    saveState();
    return;
  }
  if (event.target.matches?.("[data-sales-clients-dropdown]")) {
    state.salesClientFilters = {
      ...salesClientFilter(),
      expanded: event.target.open
    };
    updateDropdownHint(event.target);
    saveState();
    return;
  }
  if (event.target.matches?.("[data-b2b-shipment-requests-dropdown]")) {
    state.b2bShipmentRequestFilters = {
      ...b2bShipmentRequestFilter(),
      expanded: event.target.open
    };
    updateDropdownHint(event.target);
    saveState();
    return;
  }
  if (event.target.matches?.("[data-b2b-responsible-storage-dropdown]")) {
    state.b2bResponsibleStorageFilters = {
      ...b2bResponsibleStorageFilter(),
      expanded: event.target.open
    };
    updateDropdownHint(event.target);
    saveState();
  }
}, true);

document.addEventListener("change", (event) => {
  if (event.target.matches("[data-product-photos]")) {
    handleProductPhotos(event.target);
  }
  if (event.target.matches("[data-onec-payload-file]")) {
    handleOneCPayloadFile(event.target);
    return;
  }
  const dataExchangeForm = event.target.closest("[data-data-exchange-form]");
  if (dataExchangeForm && event.target.matches("[data-data-exchange-channel], [data-data-exchange-mode]")) {
    updateDataExchangeFormVisibility(dataExchangeForm);
    return;
  }
  if (event.target.matches("[data-smart-list-date]")) {
    const frame = event.target.closest("[data-smart-list-key]");
    if (!frame) return;
    const preferences = smartListPreferences(frame.dataset.smartListKey);
    preferences.from = frame.querySelector('[name="smartListFrom"]')?.value || "";
    preferences.to = frame.querySelector('[name="smartListTo"]')?.value || "";
    applySmartListState(frame);
    saveState();
    return;
  }
  const periodForm = event.target.closest("[data-period-filter]");
  if (periodForm) {
    const data = formData(periodForm);
    const key = data.key || periodForm.dataset.periodFilter;
    state.periodFilters[key] = {
      from: data.from || "2026-05-01",
      to: data.to || today
    };
    render();
    return;
  }
  const managerFunnelForm = event.target.closest("[data-manager-funnel-filter]");
  if (managerFunnelForm) {
    const data = formData(managerFunnelForm);
    state.marketplaceFunnelManager = data.manager || "__all";
    render();
    return;
  }
  const marketplaceOrderFilterForm = event.target.closest("[data-marketplace-order-filter]");
  if (marketplaceOrderFilterForm) {
    const data = formData(marketplaceOrderFilterForm);
    const current = marketplaceOrderFilter();
    state.marketplaceOrderFilters = {
      ...current,
      from: data.from || "",
      to: data.to || "",
      status: data.status || "",
      marketplace: data.marketplace || "",
      expanded: true
    };
    render();
    return;
  }
  const salesClientFilterForm = event.target.closest("[data-sales-client-filter]");
  if (salesClientFilterForm && !event.target.matches("[data-sales-client-search]")) {
    const data = formData(salesClientFilterForm);
    state.salesClientFilters = {
      ...salesClientFilter(),
      from: data.from || "",
      to: data.to || "",
      source: data.source || "",
      expanded: true
    };
    render();
    return;
  }
  const b2bShipmentRequestFilterForm = event.target.closest("[data-b2b-shipment-request-filter]");
  if (b2bShipmentRequestFilterForm && !event.target.matches("[data-b2b-shipment-request-search]")) {
    const data = formData(b2bShipmentRequestFilterForm);
    const current = b2bShipmentRequestFilter();
    state.b2bShipmentRequestFilters = {
      ...current,
      from: data.from || "",
      to: data.to || "",
      status: data.status || "",
      expanded: true
    };
    render();
    return;
  }
  const responsibleStorageFilterForm = event.target.closest("[data-b2b-responsible-storage-filter]");
  if (responsibleStorageFilterForm && !event.target.matches("[data-b2b-responsible-storage-search]")) {
    const data = formData(responsibleStorageFilterForm);
    const current = b2bResponsibleStorageFilter();
    state.b2bResponsibleStorageFilters = {
      ...current,
      from: data.from || "",
      to: data.to || "",
      clientId: data.clientId || "",
      productId: data.productId || "",
      expanded: true
    };
    render();
    return;
  }
  const rozetkaImportedOrderFilterForm = event.target.closest("[data-rozetka-imported-order-filter]");
  if (rozetkaImportedOrderFilterForm) {
    const data = formData(rozetkaImportedOrderFilterForm);
    const current = rozetkaImportedOrderFilter();
    state.rozetkaImportedOrderFilters = {
      ...current,
      from: data.from || "",
      to: data.to || "",
      status: data.status || "",
      expanded: true
    };
    render();
    return;
  }
  const inventoryFilterForm = event.target.closest("[data-inventory-filter]");
  if (inventoryFilterForm) {
    const data = formData(inventoryFilterForm);
    state.inventoryFilters = {
      warehouseId: data.warehouseId || "",
      firmId: data.firmId || ""
    };
    render();
    return;
  }
  const clientCatalogFilterForm = event.target.closest("[data-client-catalog-filters]");
  if (clientCatalogFilterForm) {
    const data = formData(clientCatalogFilterForm);
    clientCatalogFilters = {
      type: data.type || "",
      brand: data.brand || "",
      category: data.category || "",
      caliber: data.caliber || "",
      catalogTag: data.catalogTag || "",
      sort: data.sort || "name"
    };
    saveClientCatalogFilters();
    render();
    return;
  }
  if (event.target.matches("[data-client-request-qty]")) {
    const normalized = normalizeDecimalText(event.target.value);
    const id = event.target.dataset.clientRequestQty;
    if (normalized && parseDecimal(normalized, 0) <= 0) {
      const request = byId(state.b2bShipmentRequests || [], id);
      const cancelled = cancelClientB2BShipmentRequest(id, true, { zeroQty: true });
      if (!cancelled && request) event.target.value = request.qty;
      return;
    }
    updateClientB2BShipmentRequestQty(id, event.target.value);
    return;
  }
  if (event.target.matches("[data-payment-source], [data-payment-kind], [data-payment-client], [data-payment-invoice], [data-payment-firm], [data-payment-terminal], [data-payment-prro]")) {
    const form = event.target.closest('[data-action="create-payment"]');
    const data = form ? formData(form) : {};
    paymentDraft = {
      source: data.paymentSource || paymentDraft.source || "cash",
      kind: data.paymentKind || paymentDraft.kind || "invoice",
      clientId: data.clientId || "",
      invoiceId: data.invoiceId || "",
      firmId: data.firmId || "",
      terminalId: data.terminalId || "",
      prro: data.prro || "true"
    };
    render();
    return;
  }
  const reportBuilder = event.target.closest("[data-report-builder]");
  if (reportBuilder) {
    const data = formData(reportBuilder);
    state.reportBuilder = {
      reportId: data.reportId || state.reportBuilder.reportId,
      from: data.from || "2026-05-01",
      to: data.to || today,
      columns: selectedValues(reportBuilder.elements.columns),
      sortBy: data.sortBy || "date",
      sortDir: data.sortDir || "desc",
      groupBy: data.groupBy || ""
    };
    render();
    return;
  }
  if (event.target.id === "role-select") {
    render();
  }
  if (event.target.id === "manager-select") {
    render();
  }
  if (event.target.id === "subview-select") {
    state.currentSubViews = state.currentSubViews || {};
    state.currentSubViews[state.currentView] = event.target.value;
    render();
    return;
  }
  if (event.target.matches("[data-communication-channel]")) {
    syncCommunicationReceiver(event.target.closest("[data-order-communication-form]"));
    return;
  }
  if (event.target.dataset.rolePermission) {
    updateRolePermission(event.target);
    return;
  }
  if (event.target.dataset.employeeRole) {
    if (!isAdmin()) {
      alert("Ролі працівників змінює тільки адміністратор.");
      render();
      return;
    }
    const employee = byId(state.employees, event.target.dataset.employeeRole);
    if (employee) {
      employee.roleName = event.target.value;
      if (employee.id === state.currentEmployeeId) {
        state.currentRole = employee.roleName;
      }
      addAudit(`Роль працівника ${employee.name} змінено на ${employee.roleName}`);
      render();
    }
  }
  if (event.target.matches("[data-sale-product]")) {
    const form = event.target.closest('[data-action="create-invoice"]');
    if (form) updateSaleDraftFromForm(form);
    const index = Number(event.target.dataset.saleLineIndex || 0);
    const product = byId(state.products, event.target.value);
    const price = product ? productSalePrice(product, saleDraft.priceType) : { amount: 0, currency: "UAH" };
    saleDraft.lines[index] = {
      ...(saleDraft.lines[index] || defaultSaleLine()),
      productId: event.target.value,
      barcode: product?.barcode || product?.qrCode || "",
      price: price.amount,
      currency: price.currency,
      serialIds: [],
      permitNumber: "",
      permitDate: ""
    };
    render();
  }
  if (event.target.matches("[data-sale-stock-context]")) {
    const form = event.target.closest('[data-action="create-invoice"]');
    if (form) updateSaleDraftFromForm(form);
    saleDraft.lines = saleDraftLines().map((line) => ({ ...line, serialIds: [] }));
    render();
    return;
  }
  if (event.target.matches("[data-sale-client]")) {
    const form = event.target.closest('[data-action="create-invoice"]');
    if (form) updateSaleDraftFromForm(form);
    const client = byId(state.clients, event.target.value);
    saleDraft.clientId = event.target.value;
    saleDraft.priceType = priceTypeById(client?.priceType)?.id || saleDraft.priceType || activeSalePriceTypes()[0]?.id || "";
    render();
  }
  if (event.target.matches("[data-sale-price-type]")) {
    const form = event.target.closest('[data-action="create-invoice"]');
    if (form) updateSaleDraftFromForm(form);
    saleDraft.priceType = event.target.value;
    saleDraft.lines = saleDraftLines().map((line) => {
      const product = byId(state.products, line.productId);
      const price = product ? productSalePrice(product, saleDraft.priceType) : { amount: line.price || 0, currency: line.currency || "UAH" };
      return { ...line, price: price.amount, currency: price.currency };
    });
    render();
  }
  if (event.target.matches("[data-sale-barcode]")) {
    const form = event.target.closest('[data-action="create-invoice"]');
    if (form) updateSaleDraftFromForm(form);
    const product = findProductByCode(event.target.value);
    const index = Number(event.target.dataset.saleLineIndex || 0);
    saleDraft.lines[index] = { ...(saleDraft.lines[index] || defaultSaleLine()), barcode: event.target.value };
    if (product) {
      const price = productSalePrice(product, saleDraft.priceType);
      saleDraft.lines[index] = { ...saleDraft.lines[index], productId: product.id, price: price.amount, currency: price.currency, serialIds: [] };
      render();
    }
  }
  if (event.target.matches("[data-purchase-product]")) {
    const form = event.target.closest('[data-action="create-purchase"]');
    if (form) updatePurchaseDraftFromForm(form);
    const index = Number(event.target.dataset.purchaseLineIndex || 0);
    const product = byId(state.products, event.target.value);
    const lines = purchaseDraftLines();
    lines[index] = {
      ...(lines[index] || defaultPurchaseLine()),
      productId: event.target.value,
      barcode: product?.barcode || product?.qrCode || "",
      cost: product?.cost || 0,
      currency: product?.costCurrency || "UAH",
      erzStatus: "pending",
      actual: "true",
      serials: ""
    };
    purchaseDraft.lines = lines;
    render();
    return;
  }
  if (event.target.matches("[data-purchase-barcode]")) {
    const form = event.target.closest('[data-action="create-purchase"]');
    if (form) updatePurchaseDraftFromForm(form);
    const product = findProductByCode(event.target.value);
    const index = Number(event.target.dataset.purchaseLineIndex || 0);
    const lines = purchaseDraftLines();
    lines[index] = {
      ...(lines[index] || defaultPurchaseLine()),
      barcode: event.target.value
    };
    if (product) {
      lines[index] = {
        ...lines[index],
        productId: product.id,
        cost: product.cost || 0,
        currency: product.costCurrency || "UAH",
        erzStatus: "pending",
        actual: "true",
        serials: ""
      };
      purchaseDraft.lines = lines;
      render();
      return;
    }
    purchaseDraft.lines = lines;
    return;
  }
  if (event.target.matches("[data-marketplace-publication-product]")) {
    const form = event.target.closest('[data-action="create-marketplace-publication"]');
    if (form) updateMarketplacePublicationDraftFromForm(form);
    const index = Number(event.target.dataset.marketplacePublicationLineIndex || 0);
    const product = byId(state.products, event.target.value);
    const price = product ? productSalePrice(product, marketplacePriceTypeId()) : { amount: 0, currency: "UAH" };
    const lines = marketplacePublicationDraftLines();
    lines[index] = {
      ...(lines[index] || defaultMarketplacePublicationLine()),
      productId: event.target.value,
      sku: product?.supplierSku || product?.internalCode || "",
      title: product ? `${product.brand} ${product.model}` : "",
      price: price.amount || product?.price || 0,
      currency: price.currency || product?.currency || "UAH"
    };
    marketplacePublicationDraft.lines = lines;
    render();
    return;
  }
  if (event.target.matches("[data-b2b-shipment-product]")) {
    const product = byId(state.products, event.target.value);
    b2bDraft = { ...b2bDraft, shipmentProductId: event.target.value, shipmentBarcode: product?.barcode || product?.qrCode || "" };
    render();
  }
  if (event.target.matches("[data-b2b-shipment-firm]")) {
    b2bDraft = { ...b2bDraft, shipmentFirmId: event.target.value };
    render();
  }
  if (event.target.matches("[data-b2b-shipment-barcode]")) {
    const product = findProductByCode(event.target.value);
    b2bDraft = { ...b2bDraft, shipmentBarcode: event.target.value };
    if (product) {
      b2bDraft.shipmentProductId = product.id;
      render();
    }
  }
  if (event.target.matches("[data-b2b-sale-client]")) {
    b2bDraft = { ...b2bDraft, saleClientId: event.target.value };
    render();
  }
  if (event.target.matches("[data-b2b-sale-product]")) {
    const product = byId(state.products, event.target.value);
    b2bDraft = { ...b2bDraft, saleProductId: event.target.value, saleBarcode: product?.barcode || product?.qrCode || "" };
    render();
  }
  if (event.target.matches("[data-b2b-sale-firm]")) {
    b2bDraft = { ...b2bDraft, saleFirmId: event.target.value };
    render();
  }
  if (event.target.matches("[data-b2b-sale-barcode]")) {
    const product = findProductByCode(event.target.value);
    b2bDraft = { ...b2bDraft, saleBarcode: event.target.value };
    if (product) {
      b2bDraft.saleProductId = product.id;
      render();
    }
  }
  if (event.target.matches("[data-b2b-request-rebuild]")) {
    const form = event.target.closest('[data-action="approve-b2b-shipment-request"]');
    const request = form ? updateB2BShipmentRequestDraftFromForm(form) : null;
    if (request) openB2BShipmentRequest(request.id);
    return;
  }
  if (event.target.matches("[data-client-portal-product]")) {
    const product = byId(state.products, event.target.value);
    clientPortalDraft = { ...clientPortalDraft, productId: event.target.value, barcode: product?.barcode || product?.qrCode || "", serialIds: [], firmId: "" };
    render();
  }
  if (event.target.matches("[data-client-portal-firm]")) {
    clientPortalDraft = { ...clientPortalDraft, firmId: event.target.value, serialIds: [] };
    render();
  }
  if (event.target.matches("[data-client-portal-barcode]")) {
    const product = findProductByCode(event.target.value);
    clientPortalDraft = { ...clientPortalDraft, barcode: event.target.value };
    if (product && clientStorageRows(authenticatedClient()?.id || "").some((row) => (row.product?.id || row.productId) === product.id)) {
      clientPortalDraft.productId = product.id;
      clientPortalDraft.serialIds = [];
      render();
    }
  }
  const saleForm = event.target.closest('[data-action="create-invoice"]');
  if (saleForm && !event.target.matches("[data-sale-product]")) {
    updateSaleDraftFromForm(saleForm);
  }
  const purchaseForm = event.target.closest('[data-action="create-purchase"]');
  if (purchaseForm && !event.target.matches("[data-purchase-product], [data-purchase-barcode]")) {
    updatePurchaseDraftFromForm(purchaseForm);
  }
  const marketplacePublicationForm = event.target.closest('[data-action="create-marketplace-publication"]');
  if (marketplacePublicationForm && !event.target.matches("[data-marketplace-publication-product]")) {
    updateMarketplacePublicationDraftFromForm(marketplacePublicationForm);
  }
  const portalForm = event.target.closest('[data-action="create-client-portal-sale"]');
  if (portalForm && !event.target.matches("[data-client-portal-product]")) {
    const data = formData(portalForm);
    clientPortalDraft = {
      productId: data.productId,
      firmId: data.firmId,
      barcode: data.barcode,
      qty: data.qty,
      serialIds: selectedValues(portalForm.elements.serialIds),
      permitNumber: data.permitNumber,
      permitDate: data.permitDate
    };
  }
});

document.addEventListener("input", (event) => {
  if (event.target.matches("[data-smart-list-date]")) {
    const frame = event.target.closest("[data-smart-list-key]");
    if (!frame) return;
    const preferences = smartListPreferences(frame.dataset.smartListKey);
    preferences.from = frame.querySelector('[name="smartListFrom"]')?.value || "";
    preferences.to = frame.querySelector('[name="smartListTo"]')?.value || "";
    applySmartListState(frame);
    saveState();
    return;
  }
  if (event.target.matches("[data-b2b-responsible-storage-search]")) {
    const details = document.querySelector("[data-b2b-responsible-storage-dropdown]");
    state.b2bResponsibleStorageFilters = {
      ...b2bResponsibleStorageFilter(),
      search: event.target.value,
      expanded: details?.open || Boolean(event.target.value.trim())
    };
    applyResponsibleStorageSearch();
    saveState();
    return;
  }
  if (event.target.matches("[data-b2b-shipment-request-search]")) {
    const details = document.querySelector("[data-b2b-shipment-requests-dropdown]");
    state.b2bShipmentRequestFilters = {
      ...b2bShipmentRequestFilter(),
      search: event.target.value,
      expanded: details?.open || Boolean(event.target.value.trim())
    };
    applyB2BShipmentRequestSearch();
    saveState();
    return;
  }
  if (event.target.matches("[data-marketplace-publication-search]")) {
    const details = document.querySelector("[data-marketplace-publications-dropdown]");
    state.marketplacePublicationFilters = {
      ...marketplacePublicationFilter(),
      search: event.target.value,
      expanded: details?.open || Boolean(event.target.value.trim())
    };
    applyMarketplacePublicationSearch();
    saveState();
    return;
  }
  if (event.target.matches("[data-sales-client-search]")) {
    const details = document.querySelector("[data-sales-clients-dropdown]");
    state.salesClientFilters = {
      ...salesClientFilter(),
      search: event.target.value,
      expanded: details?.open || Boolean(event.target.value.trim())
    };
    if (details && event.target.value.trim()) details.open = true;
    applySalesClientSearch();
    saveState();
    return;
  }
  if (event.target.matches("[data-product-table-search]")) {
    const tableKey = event.target.dataset.productTableSearch;
    state.productTableFilters = {
      ...productTableFilters(),
      [tableKey]: event.target.value
    };
    applyProductTableSearch(tableKey);
    saveState();
    return;
  }
  if (event.target.matches("[data-client-request-qty]")) {
    const normalized = normalizeDecimalText(event.target.value);
    if (normalized && parseDecimal(normalized, 0) > 0) {
      updateClientB2BShipmentRequestQty(event.target.dataset.clientRequestQty, event.target.value, { silent: true });
    }
    return;
  }
  const form = event.target.closest('[data-action="create-invoice"]');
  if (form) {
    updateSaleDraftFromForm(form);
    return;
  }
  const purchaseForm = event.target.closest('[data-action="create-purchase"]');
  if (purchaseForm) {
    updatePurchaseDraftFromForm(purchaseForm);
    return;
  }
  const marketplacePublicationForm = event.target.closest('[data-action="create-marketplace-publication"]');
  if (marketplacePublicationForm) {
    updateMarketplacePublicationDraftFromForm(marketplacePublicationForm);
    return;
  }
  const portalForm = event.target.closest('[data-action="create-client-portal-sale"]');
  if (!portalForm) return;
  const data = formData(portalForm);
  clientPortalDraft = {
    productId: data.productId,
    firmId: data.firmId,
    barcode: data.barcode,
    qty: data.qty,
    serialIds: selectedValues(portalForm.elements.serialIds),
    permitNumber: data.permitNumber,
    permitDate: data.permitDate
  };
});

document.addEventListener("keydown", (event) => {
  if (!event.target.matches("[data-client-request-qty]") || event.key !== "Enter") return;
  event.preventDefault();
  updateClientB2BShipmentRequestQty(event.target.dataset.clientRequestQty, event.target.value);
});

document.addEventListener("submit", (event) => {
  const form = event.target.closest("form[data-action]");
  if (!form) return;
  event.preventDefault();
  const action = form.dataset.action;
  if (action === "login") {
    loginUser(form);
    return;
  }
  if (action === "client-login") {
    loginClient(form);
    return;
  }
  if (action === "create-invoice") createInvoice(form);
  if (action === "update-invoice") updateInvoiceDocument(form);
  if (action === "create-responsible-shipment") createResponsibleShipment(form);
  if (action === "create-b2b-shipment-request") createB2BShipmentRequest(form);
  if (action === "approve-b2b-shipment-request") approveB2BShipmentRequest(form);
  if (action === "update-responsible-doc") updateResponsibleStorageDoc(form);
  if (action === "create-b2b-client-sale") createB2BClientSale(form);
  if (action === "create-client-portal-sale") createB2BClientSale(form, { clientPortal: true });
  if (action === "create-purchase") createPurchase(form);
  if (action === "update-purchase") updatePurchaseDocument(form);
  if (action === "create-product") createProductCard(form);
  if (action === "update-product") updateProductCard(form);
  if (action === "create-client") createClientCard(form);
  if (action === "update-client") updateClientCard(form);
  if (action === "create-employee") createEmployee(form);
  if (action === "create-warehouse") createWarehouse(form);
  if (action === "create-variant-dictionary-item") createVariantDictionaryItem(form);
  if (action === "create-catalog-parameter") createCatalogParameter(form);
  if (action === "create-cash-article") createCashArticle(form);
  if (action === "create-expense-article") createExpenseArticle(form);
  if (action === "create-payment-terminal") createPaymentTerminal(form);
  if (action === "create-price-type") createPriceType(form);
  if (action === "create-serial") createSerial(form);
  if (action === "update-serial") updateSerialDocument(form);
  if (action === "create-payment") createPayment(form);
  if (action === "update-payment") updatePaymentDocument(form);
  if (action === "create-expense") createExpense(form);
  if (action === "update-expense") updateExpenseDocument(form);
  if (action === "create-payable") createPayable(form);
  if (action === "update-payable") updatePayableDocument(form);
  if (action === "create-marketplace-publication") createMarketplacePublication(form);
  if (action === "update-marketplace-publication") updateMarketplacePublication(form);
  if (action === "create-marketplace-order") createMarketplaceOrder(form);
  if (action === "update-marketplace-order") updateMarketplaceOrderDocument(form);
  if (action === "create-marketplace-order-payment") createMarketplaceOrderPayment(form);
  if (action === "order-message") sendOrderMessage(form);
  if (action === "order-callback") startOrderCallback(form).catch((error) => alert(`Не вдалося запустити дзвінок: ${error.message}`));
  if (action === "reply-marketplace-question") replyMarketplaceQuestion(form).catch((error) => alert(`Не вдалося відповісти через маркетплейс: ${error.message}`));
  if (action === "reply-marketplace-thread") replyMarketplaceThread(form);
  if (action === "update-data-exchange") updateDataExchange(form);
  if (action === "update-sales-funnel") updateSalesFunnel(form);
  if (action === "update-communicators") updateCommunicators(form);
  if (action === "rozetka-import-goods") importRozetkaGoodsToCatalog(form);
  if (action === "rozetka-import-orders") importRozetkaOrdersToCrm(form);
  if (action === "rozetka-import-customer-questions") importRozetkaCustomerQuestionsToCrm(form);
  if (action === "rozetka-import-marketplace-threads") importRozetkaMarketplaceThreadsToCrm(form);
  if (action === "import-marketplace-catalog") importMarketplaceCatalog(form);
  if (action === "import-bas-purchases") importBasPurchases(form);
  if (action === "import-onec-package") importOneCPackage(form);
  if (action === "update-rates") updateRates(form);
  if (action === "update-delivery-api-settings") updateDeliveryApiSettings(form);
  if (action === "update-closed-day") updateClosedDay(form);
});

syncOneCAutoImportTimer();
render();
