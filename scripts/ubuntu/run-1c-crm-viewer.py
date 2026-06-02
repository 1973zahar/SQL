#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Small read-only web viewer for one_c_mirror.crm_* PostgreSQL views."""

from __future__ import annotations

import argparse
import base64
import csv
import io
import json
import os
import shlex
import socket
import subprocess
import sys
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from urllib.parse import urlparse


VIEW_DEFINITIONS: dict[str, dict[str, Any]] = {
    "products": {
        "label": "Товари",
        "description": "Довідник товарів для CRM",
        "columns": [
            ["product_code", "Код"],
            ["product_name", "Товар"],
            ["product_group_name", "Папка"],
            ["product_group_code", "Код папки"],
            ["is_deleted", "Видалено"],
            ["price_count", "Цін"],
            ["min_price", "Мін. ціна"],
            ["max_price", "Макс. ціна"],
            ["price_currencies", "Валюти"],
            ["price_types", "Типи цін"],
            ["source_file", "Джерело"],
        ],
        "sql": """
            SELECT
              product_code,
              product_name,
              product_group_name,
              product_group_code,
              is_deleted::text AS is_deleted,
              price_count::text AS price_count,
              min_price::text AS min_price,
              max_price::text AS max_price,
              price_currencies,
              price_types,
              source_file
            FROM one_c_mirror.crm_products
            ORDER BY product_name NULLS LAST, product_code
        """,
    },
    "prices": {
        "label": "Ціни",
        "description": "Ціни товарів по типах цін з 1C",
        "columns": [
            ["product_code", "Код товару"],
            ["product_name", "Товар"],
            ["price_type_code", "Код типу"],
            ["price_type_name", "Тип ціни"],
            ["currency", "Валюта"],
            ["price", "Ціна"],
            ["snapshot_at", "Дата зрізу"],
        ],
        "sql": """
            SELECT
              product_code,
              product_name,
              price_type_code,
              price_type_name,
              currency,
              price::text AS price,
              snapshot_at::text AS snapshot_at
            FROM one_c_mirror.crm_product_prices
            ORDER BY product_name NULLS LAST, price_type_name NULLS LAST, product_code
        """,
    },
    "warehouses": {
        "label": "Склади",
        "description": "Склади, доступні CRM",
        "columns": [
            ["warehouse_code", "Код"],
            ["warehouse_name", "Склад"],
            ["is_deleted", "Видалено"],
            ["source_file", "Джерело"],
        ],
        "sql": """
            SELECT
              warehouse_code,
              warehouse_name,
              is_deleted::text AS is_deleted,
              source_file
            FROM one_c_mirror.crm_warehouses
            ORDER BY warehouse_name NULLS LAST, warehouse_code
        """,
    },
    "stock": {
        "label": "Залишки",
        "description": "Залишки товарів по складах",
        "columns": [
            ["product_code", "Код товару"],
            ["product_name", "Товар"],
            ["warehouse_name", "Склад"],
            ["quantity", "Кількість"],
            ["reserved_quantity", "Резерв"],
            ["snapshot_at", "Дата зрізу"],
        ],
        "sql": """
            SELECT
              product_code,
              product_name,
              warehouse_name,
              quantity::text AS quantity,
              reserved_quantity::text AS reserved_quantity,
              snapshot_at::text AS snapshot_at
            FROM one_c_mirror.crm_stock_balances
            ORDER BY product_name NULLS LAST, warehouse_name NULLS LAST, product_code
        """,
    },
    "counterparties": {
        "label": "Контрагенти",
        "description": "Контрагенти з 1C та операційних даних",
        "columns": [
            ["counterparty_code", "Код"],
            ["counterparty_name", "Контрагент"],
            ["is_deleted", "Видалено"],
            ["source_file", "Джерело"],
        ],
        "sql": """
            SELECT
              counterparty_code,
              counterparty_name,
              is_deleted::text AS is_deleted,
              source_file
            FROM one_c_mirror.crm_counterparties
            ORDER BY counterparty_name NULLS LAST, counterparty_code
        """,
    },
    "contracts": {
        "label": "Договори",
        "description": "Договори контрагентів",
        "columns": [
            ["counterparty_code", "Код контрагента"],
            ["counterparty_name", "Контрагент"],
            ["contract_code", "Код договору"],
            ["contract_name", "Договір"],
            ["is_deleted", "Видалено"],
        ],
        "sql": """
            SELECT
              counterparty_code,
              counterparty_name,
              contract_code,
              contract_name,
              is_deleted::text AS is_deleted
            FROM one_c_mirror.crm_counterparty_contracts
            ORDER BY counterparty_name NULLS LAST, contract_name NULLS LAST, contract_code
        """,
    },
    "settlements": {
        "label": "Взаєморозрахунки",
        "description": "Рядки взаєморозрахунків з 1C",
        "columns": [
            ["counterparty_code", "Код"],
            ["counterparty_name", "Контрагент"],
            ["contract_name", "Договір"],
            ["organization_name", "Організація"],
            ["currency", "Валюта"],
            ["amount", "Сума"],
            ["balance_sign", "Знак"],
            ["snapshot_at", "Дата зрізу"],
        ],
        "sql": """
            SELECT
              counterparty_code,
              counterparty_name,
              contract_name,
              organization_name,
              currency,
              amount::text AS amount,
              balance_sign,
              snapshot_at::text AS snapshot_at
            FROM one_c_mirror.crm_counterparty_settlements
            ORDER BY abs(amount) DESC NULLS LAST, counterparty_name NULLS LAST
        """,
    },
    "balance": {
        "label": "Баланс",
        "description": "Агрегований баланс по контрагентах і договорах",
        "columns": [
            ["counterparty_code", "Код"],
            ["counterparty_name", "Контрагент"],
            ["contract_name", "Договір"],
            ["organization_name", "Організація"],
            ["currency", "Валюта"],
            ["amount", "Сума"],
            ["amount_abs", "Модуль"],
            ["balance_sign", "Знак"],
        ],
        "sql": """
            SELECT
              counterparty_code,
              counterparty_name,
              contract_name,
              organization_name,
              currency,
              amount::text AS amount,
              amount_abs::text AS amount_abs,
              balance_sign
            FROM one_c_mirror.crm_counterparty_balance_summary
            ORDER BY amount_abs DESC NULLS LAST, counterparty_name NULLS LAST
        """,
    },
    "reference_summary": {
        "label": "Підсумок довідників",
        "description": "Кількість рядків у CRM-ready довідниках 1C",
        "columns": [
            ["reference_type", "Тип"],
            ["catalog_name", "Довідник"],
            ["source_file", "Файл"],
            ["rows", "Рядків"],
            ["deleted_rows", "Видалено"],
            ["imported_at", "Імпортовано"],
        ],
        "sql": """
            SELECT
              reference_type,
              catalog_name,
              source_file,
              rows::text AS rows,
              deleted_rows::text AS deleted_rows,
              imported_at::text AS imported_at
            FROM one_c_mirror.crm_reference_catalog_summary
            ORDER BY catalog_name, reference_type
        """,
    },
    "units": {
        "label": "Одиниці",
        "description": "Одиниці вимірювання з 1C",
        "columns": [
            ["unit_code", "Код"],
            ["unit_name", "Одиниця"],
            ["is_deleted", "Видалено"],
            ["source_file", "Файл"],
        ],
        "sql": """
            SELECT
              unit_code,
              unit_name,
              is_deleted::text AS is_deleted,
              source_file
            FROM one_c_mirror.crm_units
            ORDER BY unit_name NULLS LAST, unit_code
        """,
    },
    "price_types": {
        "label": "Типи цін",
        "description": "Типи цін номенклатури з 1C",
        "columns": [
            ["price_type_code", "Код"],
            ["price_type_name", "Тип ціни"],
            ["is_deleted", "Видалено"],
            ["source_file", "Файл"],
        ],
        "sql": """
            SELECT
              price_type_code,
              price_type_name,
              is_deleted::text AS is_deleted,
              source_file
            FROM one_c_mirror.crm_price_types
            ORDER BY price_type_name NULLS LAST, price_type_code
        """,
    },
    "currencies": {
        "label": "Валюти",
        "description": "Валюти з 1C",
        "columns": [
            ["currency_code", "Код"],
            ["currency_name", "Валюта"],
            ["is_deleted", "Видалено"],
            ["source_file", "Файл"],
        ],
        "sql": """
            SELECT
              currency_code,
              currency_name,
              is_deleted::text AS is_deleted,
              source_file
            FROM one_c_mirror.crm_currencies
            ORDER BY currency_name NULLS LAST, currency_code
        """,
    },
    "product_groups": {
        "label": "Групи товарів",
        "description": "Номенклатурні групи з 1C",
        "columns": [
            ["product_group_code", "Код"],
            ["product_group_name", "Група"],
            ["is_deleted", "Видалено"],
            ["source_file", "Файл"],
        ],
        "sql": """
            SELECT
              product_group_code,
              product_group_name,
              is_deleted::text AS is_deleted,
              source_file
            FROM one_c_mirror.crm_product_groups
            ORDER BY product_group_name NULLS LAST, product_group_code
        """,
    },
    "product_folders": {
        "label": "Папки товарів",
        "description": "Папка/група, прив'язана до кожного товару з 1C",
        "columns": [
            ["product_group_code", "Код папки"],
            ["product_group_name", "Папка"],
            ["product_group_ref", "Посилання"],
        ],
        "sql": """
            SELECT
              product_group_code,
              product_group_name,
              product_group_ref
            FROM one_c_mirror.crm_product_folders
            ORDER BY product_group_name NULLS LAST, product_group_code NULLS LAST
        """,
    },
    "organizations": {
        "label": "Організації",
        "description": "Організації з 1C",
        "columns": [
            ["organization_code", "Код"],
            ["organization_name", "Організація"],
            ["is_deleted", "Видалено"],
            ["source_file", "Файл"],
        ],
        "sql": """
            SELECT
              organization_code,
              organization_name,
              is_deleted::text AS is_deleted,
              source_file
            FROM one_c_mirror.crm_organizations
            ORDER BY organization_name NULLS LAST, organization_code
        """,
    },
    "persons": {
        "label": "Фізособи",
        "description": "Фізичні особи з 1C",
        "columns": [
            ["person_code", "Код"],
            ["person_name", "Фізособа"],
            ["is_deleted", "Видалено"],
            ["source_file", "Файл"],
        ],
        "sql": """
            SELECT
              person_code,
              person_name,
              is_deleted::text AS is_deleted,
              source_file
            FROM one_c_mirror.crm_persons
            ORDER BY person_name NULLS LAST, person_code
        """,
    },
    "bank_accounts": {
        "label": "Банківські рахунки",
        "description": "Банківські рахунки з 1C",
        "columns": [
            ["bank_account_code", "Код"],
            ["bank_account_name", "Рахунок"],
            ["is_deleted", "Видалено"],
            ["source_file", "Файл"],
        ],
        "sql": """
            SELECT
              bank_account_code,
              bank_account_name,
              is_deleted::text AS is_deleted,
              source_file
            FROM one_c_mirror.crm_bank_accounts
            ORDER BY bank_account_name NULLS LAST, bank_account_code
        """,
    },
    "catalog_latest": {
        "label": "Довідники latest",
        "description": "Останній зріз імпортованих довідників 1C",
        "columns": [
            ["object_type", "Тип"],
            ["catalog_name", "Довідник"],
            ["code", "Код"],
            ["name", "Назва"],
            ["deletion_mark", "Видалено"],
            ["source_file", "Файл"],
            ["imported_at", "Імпортовано"],
        ],
        "sql": """
            SELECT
              object_type,
              catalog_name,
              code,
              name,
              deletion_mark::text AS deletion_mark,
              source_file,
              imported_at::text AS imported_at
            FROM one_c_mirror.latest_rows
            ORDER BY catalog_name, name NULLS LAST, code
        """,
    },
    "catalog_raw": {
        "label": "Довідники raw",
        "description": "Усі сирі рядки імпортованих довідників з історією batch",
        "columns": [
            ["id", "ID"],
            ["import_batch_id", "Batch"],
            ["object_type", "Тип"],
            ["catalog_name", "Довідник"],
            ["row_no", "Рядок"],
            ["code", "Код"],
            ["name", "Назва"],
            ["deletion_mark", "Видалено"],
            ["source_file", "Файл"],
            ["imported_at", "Імпортовано"],
        ],
        "sql": """
            SELECT
              id::text AS id,
              import_batch_id::text AS import_batch_id,
              object_type,
              catalog_name,
              row_no::text AS row_no,
              code,
              name,
              deletion_mark::text AS deletion_mark,
              source_file,
              imported_at::text AS imported_at
            FROM one_c_mirror.raw_rows
            ORDER BY imported_at DESC, id DESC
        """,
    },
    "catalog_batches": {
        "label": "Batches довідників",
        "description": "Історія імпорту довідників",
        "columns": [
            ["id", "Batch"],
            ["object_type", "Тип"],
            ["catalog_name", "Довідник"],
            ["source_file", "Файл"],
            ["row_count", "Рядків"],
            ["status", "Статус"],
            ["error_message", "Помилка"],
            ["started_at", "Старт"],
            ["completed_at", "Фініш"],
        ],
        "sql": """
            SELECT
              id::text AS id,
              object_type,
              catalog_name,
              source_file,
              row_count::text AS row_count,
              status::text AS status,
              error_message,
              started_at::text AS started_at,
              completed_at::text AS completed_at
            FROM one_c_mirror.import_batches
            ORDER BY started_at DESC, source_file
        """,
    },
    "operational_latest": {
        "label": "Операційні latest",
        "description": "Останній зріз операційних даних 1C",
        "columns": [
            ["dataset_name", "Набір"],
            ["row_no", "Рядок"],
            ["entity_code", "Код"],
            ["entity_name", "Назва"],
            ["warehouse_name", "Склад"],
            ["contract_name", "Договір"],
            ["organization_name", "Організація"],
            ["quantity", "Кількість"],
            ["reserved_quantity", "Резерв"],
            ["amount", "Сума"],
            ["imported_at", "Імпортовано"],
        ],
        "sql": """
            SELECT
              dataset_name,
              row_no::text AS row_no,
              entity_code,
              entity_name,
              warehouse_name,
              contract_name,
              organization_name,
              quantity::text AS quantity,
              reserved_quantity::text AS reserved_quantity,
              amount::text AS amount,
              imported_at::text AS imported_at
            FROM one_c_mirror.latest_operational_rows
            ORDER BY dataset_name, row_no
        """,
    },
    "operational_raw": {
        "label": "Операційні raw",
        "description": "Усі сирі рядки операційного імпорту з історією batch",
        "columns": [
            ["id", "ID"],
            ["import_batch_id", "Batch"],
            ["dataset_name", "Набір"],
            ["row_no", "Рядок"],
            ["entity_code", "Код"],
            ["entity_name", "Назва"],
            ["warehouse_name", "Склад"],
            ["contract_name", "Договір"],
            ["quantity", "Кількість"],
            ["reserved_quantity", "Резерв"],
            ["amount", "Сума"],
            ["source_file", "Файл"],
            ["imported_at", "Імпортовано"],
        ],
        "sql": """
            SELECT
              id::text AS id,
              import_batch_id::text AS import_batch_id,
              dataset_name,
              row_no::text AS row_no,
              entity_code,
              entity_name,
              warehouse_name,
              contract_name,
              quantity::text AS quantity,
              reserved_quantity::text AS reserved_quantity,
              amount::text AS amount,
              source_file,
              imported_at::text AS imported_at
            FROM one_c_mirror.operational_rows
            ORDER BY imported_at DESC, id DESC
        """,
    },
    "operational_batches": {
        "label": "Batches операційні",
        "description": "Історія імпорту залишків і взаєморозрахунків",
        "columns": [
            ["id", "Batch"],
            ["dataset_name", "Набір"],
            ["object_type", "Тип"],
            ["source_file", "Файл"],
            ["row_count", "Рядків"],
            ["status", "Статус"],
            ["error_message", "Помилка"],
            ["started_at", "Старт"],
            ["completed_at", "Фініш"],
        ],
        "sql": """
            SELECT
              id::text AS id,
              dataset_name,
              object_type,
              source_file,
              row_count::text AS row_count,
              status::text AS status,
              error_message,
              started_at::text AS started_at,
              completed_at::text AS completed_at
            FROM one_c_mirror.operational_batches
            ORDER BY started_at DESC, source_file
        """,
    },
}


INDEX_HTML = r"""<!doctype html>
<html lang="uk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>1C CRM Mirror Viewer</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f9;
      --surface: #ffffff;
      --line: #d9dee7;
      --line-strong: #b8c0cf;
      --text: #172033;
      --muted: #687387;
      --accent: #1d6f8f;
      --accent-dark: #155a74;
      --bad: #a93535;
      --good: #1d7448;
      --warn: #87620f;
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      min-height: 56px;
      padding: 10px 18px;
      background: var(--surface);
      border-bottom: 1px solid var(--line);
    }

    h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 650;
      letter-spacing: 0;
    }

    .meta {
      display: flex;
      align-items: center;
      gap: 14px;
      color: var(--muted);
      white-space: nowrap;
    }

    .layout {
      display: grid;
      grid-template-columns: 230px minmax(0, 1fr);
      min-height: calc(100vh - 57px);
    }

    nav {
      background: #eef1f5;
      border-right: 1px solid var(--line);
      padding: 12px;
    }

    .tab {
      width: 100%;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
      align-items: center;
      height: 38px;
      margin-bottom: 4px;
      padding: 0 10px;
      border: 1px solid transparent;
      border-radius: 6px;
      background: transparent;
      color: var(--text);
      text-align: left;
      cursor: pointer;
      font: inherit;
    }

    .tab:hover { background: #e5eaf0; }
    .tab.active {
      background: var(--surface);
      border-color: var(--line-strong);
      color: var(--accent-dark);
      font-weight: 650;
    }

    .badge {
      min-width: 32px;
      padding: 2px 6px;
      border-radius: 999px;
      background: #dce5ec;
      color: #2b4150;
      text-align: center;
      font-size: 12px;
      font-variant-numeric: tabular-nums;
    }

    main {
      min-width: 0;
      padding: 14px 16px 18px;
    }

    .toolbar {
      display: grid;
      grid-template-columns: minmax(220px, 420px) auto auto auto minmax(0, 1fr);
      gap: 10px;
      align-items: center;
      margin-bottom: 12px;
    }

    input, select, button {
      height: 36px;
      border: 1px solid var(--line-strong);
      border-radius: 6px;
      background: var(--surface);
      color: var(--text);
      font: inherit;
    }

    input {
      width: 100%;
      padding: 0 10px;
    }

    select { padding: 0 8px; }

    .summary {
      justify-self: end;
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 8px;
      color: var(--muted);
    }

    .metric {
      padding: 6px 8px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--surface);
      font-variant-numeric: tabular-nums;
    }

    .table-wrap {
      overflow: auto;
      height: calc(100vh - 147px);
      border: 1px solid var(--line);
      background: var(--surface);
    }

    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      min-width: 900px;
    }

    th, td {
      padding: 7px 9px;
      border-bottom: 1px solid var(--line);
      border-right: 1px solid #edf0f4;
      vertical-align: top;
      white-space: nowrap;
    }

    th {
      position: sticky;
      top: 0;
      z-index: 2;
      background: #f0f3f7;
      color: #2b3748;
      text-align: left;
      font-weight: 650;
      cursor: pointer;
      user-select: none;
    }

    td {
      max-width: 520px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    td.numeric, th.numeric {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    .positive { color: var(--good); }
    .negative { color: var(--bad); }
    .zero { color: var(--muted); }

    .pager {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: 10px;
      color: var(--muted);
    }

    .pager-actions {
      display: flex;
      gap: 8px;
    }

    .pager button {
      min-width: 36px;
      padding: 0 10px;
      cursor: pointer;
    }

    .pager button:disabled {
      opacity: 0.45;
      cursor: default;
    }

    .empty, .error {
      padding: 28px;
      color: var(--muted);
      text-align: center;
    }

    .error { color: var(--bad); }

    @media (max-width: 860px) {
      .layout { grid-template-columns: 1fr; }
      nav {
        display: flex;
        overflow-x: auto;
        border-right: 0;
        border-bottom: 1px solid var(--line);
      }
      .tab {
        width: auto;
        min-width: 150px;
        margin: 0 6px 0 0;
      }
      .toolbar {
        grid-template-columns: 1fr 1fr;
      }
      #search { grid-column: 1 / -1; }
      .summary {
        grid-column: 1 / -1;
        justify-self: start;
      }
      .table-wrap { height: calc(100vh - 245px); }
    }
  </style>
</head>
<body>
  <header>
    <h1>1C CRM Mirror Viewer</h1>
    <div class="meta">
      <span id="loadedAt">Завантаження...</span>
      <span id="reloadStatus"></span>
      <span>read-only</span>
    </div>
  </header>

  <div class="layout">
    <nav id="tabs"></nav>
    <main>
      <div class="toolbar">
        <input id="search" type="search" placeholder="Пошук">
        <select id="pageSize" aria-label="Рядків на сторінці">
          <option value="25">25</option>
          <option value="50" selected>50</option>
          <option value="100">100</option>
          <option value="250">250</option>
        </select>
        <button id="clearSearch" type="button">Очистити</button>
        <button id="reloadData" type="button">Оновити з SQL</button>
        <button id="runImportNow" type="button" disabled>Імпорт зараз</button>
        <div class="summary" id="summary"></div>
      </div>
      <div class="table-wrap" id="tableWrap">
        <div class="empty">Завантаження даних...</div>
      </div>
      <div class="pager">
        <div id="pageInfo"></div>
        <div class="pager-actions">
          <button id="prevPage" type="button">Назад</button>
          <button id="nextPage" type="button">Далі</button>
        </div>
      </div>
    </main>
  </div>

  <script>
    const state = {
      active: "stock",
      query: "",
      page: 1,
      pageSize: 50,
      sortKey: "",
      sortDir: "asc",
      payload: null,
      config: { importEnabled: false }
    };

    const numericKeys = new Set(["quantity", "reserved_quantity", "amount", "amount_abs", "price_count", "min_price", "max_price", "price"]);

    function text(value) {
      return value === null || value === undefined ? "" : String(value);
    }

    function numberValue(value) {
      const parsed = Number(String(value || "").replace(",", "."));
      return Number.isFinite(parsed) ? parsed : 0;
    }

    function formatNumber(value) {
      return new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 3 }).format(numberValue(value));
    }

    function filteredRows() {
      const view = state.payload.views[state.active];
      const query = state.query.trim().toLowerCase();
      let rows = view.rows;

      if (query) {
        rows = rows.filter(row => Object.values(row).some(value => text(value).toLowerCase().includes(query)));
      }

      if (state.sortKey) {
        const key = state.sortKey;
        const dir = state.sortDir === "desc" ? -1 : 1;
        rows = [...rows].sort((a, b) => {
          if (numericKeys.has(key)) {
            return (numberValue(a[key]) - numberValue(b[key])) * dir;
          }
          return text(a[key]).localeCompare(text(b[key]), "uk", { numeric: true, sensitivity: "base" }) * dir;
        });
      }

      return rows;
    }

    function renderTabs() {
      const tabs = document.getElementById("tabs");
      tabs.innerHTML = "";
      for (const [key, view] of Object.entries(state.payload.views)) {
        const button = document.createElement("button");
        button.className = `tab${key === state.active ? " active" : ""}`;
        button.type = "button";
        button.innerHTML = `<span>${view.label}</span><span class="badge">${view.rows.length}</span>`;
        button.addEventListener("click", () => {
          state.active = key;
          state.page = 1;
          state.sortKey = "";
          render();
        });
        tabs.appendChild(button);
      }
    }

    function renderSummary(rows) {
      const summary = document.getElementById("summary");
      const metrics = [`<span class="metric">Рядків: ${rows.length}</span>`];

      const hasQuantity = rows.some(row => text(row.quantity) !== "");
      const hasReserved = rows.some(row => text(row.reserved_quantity) !== "");
      const hasAmount = rows.some(row => text(row.amount) !== "");

      if (hasQuantity) {
        metrics.push(`<span class="metric">Кількість: ${formatNumber(rows.reduce((sum, row) => sum + numberValue(row.quantity), 0))}</span>`);
      }
      if (hasReserved) {
        metrics.push(`<span class="metric">Резерв: ${formatNumber(rows.reduce((sum, row) => sum + numberValue(row.reserved_quantity), 0))}</span>`);
      }
      if (hasAmount) {
        metrics.push(`<span class="metric">Сума: ${formatNumber(rows.reduce((sum, row) => sum + numberValue(row.amount), 0))}</span>`);
      }

      summary.innerHTML = metrics.join("");
    }

    function renderTable(rows) {
      const wrap = document.getElementById("tableWrap");
      const view = state.payload.views[state.active];
      const pageCount = Math.max(1, Math.ceil(rows.length / state.pageSize));
      state.page = Math.min(state.page, pageCount);
      const start = (state.page - 1) * state.pageSize;
      const pageRows = rows.slice(start, start + state.pageSize);

      if (!pageRows.length) {
        wrap.innerHTML = '<div class="empty">Немає рядків</div>';
        return;
      }

      const header = view.columns.map(([key, label]) => {
        const sortMark = state.sortKey === key ? (state.sortDir === "asc" ? " ▲" : " ▼") : "";
        const numericClass = numericKeys.has(key) ? " numeric" : "";
        return `<th class="${numericClass}" data-key="${key}">${label}${sortMark}</th>`;
      }).join("");

      const body = pageRows.map(row => {
        return `<tr>${view.columns.map(([key]) => {
          const value = text(row[key]);
          const numericClass = numericKeys.has(key) ? " numeric" : "";
          const signClass = key === "balance_sign" ? ` ${value}` : "";
          const rendered = numericKeys.has(key) ? formatNumber(value) : value;
          return `<td class="${numericClass}${signClass}" title="${value.replace(/"/g, "&quot;")}">${rendered}</td>`;
        }).join("")}</tr>`;
      }).join("");

      wrap.innerHTML = `<table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
      wrap.querySelectorAll("th").forEach(th => {
        th.addEventListener("click", () => {
          const key = th.dataset.key;
          if (state.sortKey === key) {
            state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
          } else {
            state.sortKey = key;
            state.sortDir = numericKeys.has(key) ? "desc" : "asc";
          }
          render();
        });
      });
    }

    function renderPager(rows) {
      const pageCount = Math.max(1, Math.ceil(rows.length / state.pageSize));
      document.getElementById("pageInfo").textContent = `Сторінка ${state.page} з ${pageCount}`;
      document.getElementById("prevPage").disabled = state.page <= 1;
      document.getElementById("nextPage").disabled = state.page >= pageCount;
    }

    function render() {
      renderTabs();
      const rows = filteredRows();
      renderSummary(rows);
      renderTable(rows);
      renderPager(rows);
    }

    async function boot() {
      try {
        const [configResponse, response] = await Promise.all([
          fetch("/api/config"),
          fetch("/api/data")
        ]);
        if (configResponse.ok) {
          state.config = await configResponse.json();
        }
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        state.payload = await response.json();
        document.getElementById("loadedAt").textContent = `Зріз: ${state.payload.loadedAt}`;
        updateImportButton();
        render();
      } catch (error) {
        document.getElementById("tableWrap").innerHTML = `<div class="error">${error.message}</div>`;
        document.getElementById("loadedAt").textContent = "Помилка";
      }
    }

    function updateImportButton() {
      const button = document.getElementById("runImportNow");
      button.disabled = !state.config.importEnabled;
      button.title = state.config.importEnabled
        ? "Запустити імпорт CSV у PostgreSQL зараз"
        : "Імпорт з кнопки вимкнений. Потрібна CRM_VIEWER_IMPORT_COMMAND на Ubuntu.";
    }

    async function reloadFromSql() {
      const button = document.getElementById("reloadData");
      const status = document.getElementById("reloadStatus");
      button.disabled = true;
      status.textContent = "Оновлення...";
      try {
        const response = await fetch("/api/reload", { method: "POST" });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        state.payload = await response.json();
        state.page = 1;
        document.getElementById("loadedAt").textContent = `Зріз: ${state.payload.loadedAt}`;
        status.textContent = "Оновлено";
        render();
      } catch (error) {
        status.textContent = `Помилка: ${error.message}`;
      } finally {
        button.disabled = false;
      }
    }

    async function runImportNow() {
      const button = document.getElementById("runImportNow");
      const status = document.getElementById("reloadStatus");
      if (!state.config.importEnabled) {
        status.textContent = "Імпорт з кнопки вимкнений";
        return;
      }
      button.disabled = true;
      document.getElementById("reloadData").disabled = true;
      status.textContent = "Імпорт триває...";
      try {
        const response = await fetch("/api/import-now", { method: "POST" });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || `HTTP ${response.status}`);
        }
        state.payload = result.payload;
        state.page = 1;
        document.getElementById("loadedAt").textContent = `Зріз: ${state.payload.loadedAt}`;
        status.textContent = "Імпорт завершено";
        render();
      } catch (error) {
        status.textContent = `Помилка імпорту: ${error.message}`;
      } finally {
        document.getElementById("reloadData").disabled = false;
        updateImportButton();
      }
    }

    document.getElementById("search").addEventListener("input", event => {
      state.query = event.target.value;
      state.page = 1;
      render();
    });
    document.getElementById("pageSize").addEventListener("change", event => {
      state.pageSize = Number(event.target.value);
      state.page = 1;
      render();
    });
    document.getElementById("clearSearch").addEventListener("click", () => {
      state.query = "";
      document.getElementById("search").value = "";
      state.page = 1;
      render();
    });
    document.getElementById("reloadData").addEventListener("click", reloadFromSql);
    document.getElementById("runImportNow").addEventListener("click", runImportNow);
    document.getElementById("prevPage").addEventListener("click", () => {
      state.page = Math.max(1, state.page - 1);
      render();
    });
    document.getElementById("nextPage").addEventListener("click", () => {
      state.page += 1;
      render();
    });

    boot();
  </script>
</body>
</html>
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Read-only web viewer for 1C CRM mirror views.")
    parser.add_argument("--host", default=os.environ.get("CRM_VIEWER_HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, default=int(os.environ.get("CRM_VIEWER_PORT", "8091")))
    parser.add_argument("--db-name", default=os.environ.get("DB_NAME", "crm_hub"))
    parser.add_argument("--db-host", default=os.environ.get("DB_HOST", ""))
    parser.add_argument("--db-port", default=os.environ.get("DB_PORT", "5432"))
    parser.add_argument("--db-user", default=os.environ.get("DB_USER", ""))
    parser.add_argument("--use-postgres-sudo", action="store_true", default=os.environ.get("USE_POSTGRES_SUDO") == "1")
    parser.add_argument("--auth-user", default=os.environ.get("CRM_VIEWER_USER", ""))
    parser.add_argument("--auth-password", default=os.environ.get("CRM_VIEWER_PASSWORD", ""))
    parser.add_argument("--import-command", default=os.environ.get("CRM_VIEWER_IMPORT_COMMAND", ""))
    parser.add_argument("--import-timeout", type=int, default=int(os.environ.get("CRM_VIEWER_IMPORT_TIMEOUT", "900")))
    return parser.parse_args()


def local_ip() -> str:
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(("8.8.8.8", 80))
        return sock.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        sock.close()


def psql_base_command(args: argparse.Namespace) -> list[str]:
    command: list[str] = []
    if args.use_postgres_sudo:
        command.extend(["sudo", "-n", "-u", "postgres"])

    command.extend(["psql", "-X", "-q", "-d", args.db_name, "-v", "ON_ERROR_STOP=1"])

    if args.db_host:
        command.extend(["-h", args.db_host, "-p", args.db_port])
    if args.db_user:
        command.extend(["-U", args.db_user])

    return command


def prime_sudo(args: argparse.Namespace) -> None:
    if not args.use_postgres_sudo:
        return
    print("Checking sudo access for postgres psql...")
    subprocess.run(["sudo", "-v"], check=True)


def run_copy_query(args: argparse.Namespace, sql: str) -> list[dict[str, str]]:
    copy_sql = f"COPY ({sql}) TO STDOUT WITH CSV HEADER"
    command = psql_base_command(args) + ["-c", copy_sql]
    env = os.environ.copy()
    env["PGCLIENTENCODING"] = "UTF8"

    result = subprocess.run(
        command,
        check=False,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
    )

    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or f"psql exited with {result.returncode}")

    return list(csv.DictReader(io.StringIO(result.stdout)))


def load_payload(args: argparse.Namespace) -> dict[str, Any]:
    views: dict[str, Any] = {}

    for key, definition in VIEW_DEFINITIONS.items():
        rows = run_copy_query(args, definition["sql"])
        views[key] = {
            "label": definition["label"],
            "description": definition["description"],
            "columns": definition["columns"],
            "rows": rows,
        }
        print(f"Loaded {definition['label']}: {len(rows)} rows")

    return {
        "loadedAt": datetime.now(timezone.utc).astimezone().strftime("%Y-%m-%d %H:%M:%S %Z"),
        "views": views,
    }


def tail_text(value: str, limit: int = 4000) -> str:
    if len(value) <= limit:
        return value
    return value[-limit:]


def run_import_command(args: argparse.Namespace) -> dict[str, str]:
    if not args.import_command:
        raise RuntimeError("CRM_VIEWER_IMPORT_COMMAND is not configured")

    command = shlex.split(args.import_command)
    if not command:
        raise RuntimeError("CRM_VIEWER_IMPORT_COMMAND is empty")

    print(f"Running import command: {args.import_command}")
    result = subprocess.run(
        command,
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=args.import_timeout,
    )

    stdout_tail = tail_text(result.stdout)
    stderr_tail = tail_text(result.stderr)
    if result.returncode != 0:
        raise RuntimeError(
            f"Import command failed with exit code {result.returncode}. "
            f"stdout: {stdout_tail} stderr: {stderr_tail}"
        )

    return {"stdout": stdout_tail, "stderr": stderr_tail}


class ViewerHandler(BaseHTTPRequestHandler):
    payload: dict[str, Any] = {}
    app_args: argparse.Namespace | None = None

    def log_message(self, fmt: str, *args: Any) -> None:
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def send_bytes(self, body: bytes, content_type: str, status: HTTPStatus = HTTPStatus.OK) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def is_authorized(self) -> bool:
        args = self.app_args
        if args is None or not args.auth_user or not args.auth_password:
            return True

        header = self.headers.get("Authorization", "")
        prefix = "Basic "
        if not header.startswith(prefix):
            return False

        try:
            decoded = base64.b64decode(header[len(prefix):]).decode("utf-8")
        except Exception:
            return False

        expected = f"{args.auth_user}:{args.auth_password}"
        return decoded == expected

    def require_auth(self) -> bool:
        if self.is_authorized():
            return True
        self.send_response(HTTPStatus.UNAUTHORIZED)
        self.send_header("WWW-Authenticate", 'Basic realm="1C CRM Mirror Viewer"')
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.end_headers()
        self.wfile.write("authentication required\n".encode("utf-8"))
        return False

    def do_GET(self) -> None:
        if not self.require_auth():
            return

        path = urlparse(self.path).path

        if path in ("", "/"):
            self.send_bytes(INDEX_HTML.encode("utf-8"), "text/html; charset=utf-8")
            return

        if path == "/api/data":
            body = json.dumps(self.payload, ensure_ascii=False).encode("utf-8")
            self.send_bytes(body, "application/json; charset=utf-8")
            return

        if path == "/api/config":
            args = self.app_args
            body = json.dumps(
                {"importEnabled": bool(args and args.import_command)},
                ensure_ascii=False,
            ).encode("utf-8")
            self.send_bytes(body, "application/json; charset=utf-8")
            return

        if path == "/health":
            self.send_bytes(b"ok\n", "text/plain; charset=utf-8")
            return

        self.send_bytes(b"not found\n", "text/plain; charset=utf-8", HTTPStatus.NOT_FOUND)

    def do_POST(self) -> None:
        if not self.require_auth():
            return

        path = urlparse(self.path).path
        if path not in ("/api/reload", "/api/import-now"):
            self.send_bytes(b"not found\n", "text/plain; charset=utf-8", HTTPStatus.NOT_FOUND)
            return

        try:
            args = self.app_args
            if args is None:
                raise RuntimeError("viewer args are not available")

            import_result: dict[str, str] | None = None
            if path == "/api/import-now":
                import_result = run_import_command(args)

            self.__class__.payload = load_payload(args)
            if path == "/api/import-now":
                body_data: dict[str, Any] = {"payload": self.__class__.payload, "import": import_result}
            else:
                body_data = self.__class__.payload
            body = json.dumps(body_data, ensure_ascii=False).encode("utf-8")
            self.send_bytes(body, "application/json; charset=utf-8")
        except Exception as exc:
            body = json.dumps({"error": str(exc)}, ensure_ascii=False).encode("utf-8")
            self.send_bytes(body, "application/json; charset=utf-8", HTTPStatus.INTERNAL_SERVER_ERROR)


def main() -> int:
    args = parse_args()
    prime_sudo(args)
    payload = load_payload(args)
    ViewerHandler.payload = payload
    ViewerHandler.app_args = args

    server = ThreadingHTTPServer((args.host, args.port), ViewerHandler)
    visible_host = local_ip() if args.host == "0.0.0.0" else args.host

    print("")
    print("1C CRM Mirror Viewer is running.")
    print(f"Open: http://{visible_host}:{args.port}/")
    if args.auth_user and args.auth_password:
        print(f"Authentication: enabled for user '{args.auth_user}'.")
    else:
        print("WARNING: authentication is disabled. Use only inside trusted VPN/local network.")
    if args.import_command:
        print("Import button: enabled.")
    else:
        print("Import button: disabled. Set CRM_VIEWER_IMPORT_COMMAND to enable it.")
    print("Press Ctrl+C to stop.")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping viewer.")
    finally:
        server.server_close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
