import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/database/prisma.service.js";

@Injectable()
export class OneCMirrorService {
  constructor(private readonly prisma: PrismaService) {}

  async listProducts(limit: number) {
    const data = await this.prisma.$queryRaw`
      SELECT
        product_code AS id,
        product_code AS "oneCRef",
        product_code AS sku,
        product_code AS code,
        product_name AS name,
        product_name AS "productName",
        NULL::text AS barcode,
        NULL::text AS description,
        NULL::text AS unit,
        product_group_name AS category,
        product_group_name AS "categoryName",
        product_group_name AS "group",
        product_group_code AS "categoryId",
        product_group_code AS "productGroupCode",
        product_group_name AS "productGroupName",
        product_group_ref AS "productGroupRef",
        COALESCE(min_price, max_price)::text AS "latestPrice",
        price_currencies AS "latestPriceCurrency",
        price_types AS "latestPriceType",
        price_count::text AS "priceCount",
        min_price::text AS "minPrice",
        max_price::text AS "maxPrice",
        source_file AS "sourceFile",
        imported_at AS "importedAt",
        is_deleted AS "isDeleted",
        is_group AS "isGroup"
      FROM one_c_mirror.crm_products
      ORDER BY product_name ASC NULLS LAST, product_code ASC
      LIMIT ${this.clampLimit(limit)}
    `;

    return { data, nextCursor: null };
  }

  async listProductFolders(limit: number) {
    const data = await this.prisma.$queryRaw`
      SELECT
        concat_ws(':', product_group_code, product_group_name, product_group_ref) AS id,
        product_group_code AS code,
        product_group_code AS "categoryId",
        product_group_code AS "productGroupCode",
        product_group_name AS name,
        product_group_name AS category,
        product_group_name AS "categoryName",
        product_group_name AS "productGroupName",
        product_group_ref AS "productGroupRef"
      FROM one_c_mirror.crm_product_folders
      ORDER BY product_group_name ASC NULLS LAST, product_group_code ASC NULLS LAST
      LIMIT ${this.clampLimit(limit)}
    `;

    return { data, nextCursor: null };
  }

  async listProductPrices(limit: number) {
    const data = await this.prisma.$queryRaw`
      SELECT
        concat_ws(':', product_code, price_type_code, currency) AS id,
        product_code AS "productCode",
        product_name AS "productName",
        price_type_code AS "priceTypeCode",
        price_type_name AS "priceTypeName",
        currency,
        price::text AS amount,
        price::text AS price,
        snapshot_at AS "snapshotAt",
        source_file AS "sourceFile",
        imported_at AS "importedAt"
      FROM one_c_mirror.crm_product_prices
      ORDER BY product_name ASC NULLS LAST, price_type_name ASC NULLS LAST, product_code ASC
      LIMIT ${this.clampLimit(limit)}
    `;

    return { data, nextCursor: null };
  }

  async listWarehouses(limit: number) {
    const data = await this.prisma.$queryRaw`
      SELECT
        warehouse_code AS id,
        warehouse_code AS code,
        warehouse_code AS "warehouseId",
        warehouse_code AS "warehouseCode",
        warehouse_name AS name,
        warehouse_name AS warehouse,
        warehouse_name AS "warehouseName",
        '1C'::text AS kind,
        source_file AS "sourceFile",
        imported_at AS "importedAt",
        is_deleted AS "isDeleted"
      FROM one_c_mirror.crm_warehouses
      ORDER BY warehouse_name ASC NULLS LAST, warehouse_code ASC
      LIMIT ${this.clampLimit(limit)}
    `;

    return { data, nextCursor: null };
  }

  async listStock(limit: number) {
    const data = await this.prisma.$queryRaw`
      SELECT
        concat_ws(':', product_code, warehouse_code) AS id,
        product_code AS "productId",
        product_code AS "productCode",
        product_code AS sku,
        product_name AS "productName",
        warehouse_code AS "warehouseId",
        warehouse_code AS "warehouseCode",
        warehouse_name AS warehouse,
        warehouse_name AS "warehouseName",
        quantity::text AS qty,
        quantity::text AS quantity,
        greatest(quantity - reserved_quantity, 0)::text AS "availableQty",
        reserved_quantity::text AS "reservedQty",
        snapshot_at AS "snapshotAt",
        imported_at AS "importedAt"
      FROM one_c_mirror.crm_stock_balances
      ORDER BY product_name ASC NULLS LAST, warehouse_name ASC NULLS LAST, product_code ASC
      LIMIT ${this.clampLimit(limit)}
    `;

    return { data, nextCursor: null };
  }

  async listCounterparties(limit: number) {
    const data = await this.prisma.$queryRaw`
      SELECT
        counterparty_code AS id,
        counterparty_code AS "externalId",
        counterparty_code AS "oneCRef",
        counterparty_code AS "counterpartyCode",
        counterparty_name AS name,
        counterparty_name AS "fullName",
        counterparty_name AS "counterpartyName",
        NULL::text AS phone,
        NULL::text AS email,
        NULL::text AS "taxId",
        '1C'::text AS "sourceModule",
        source_file AS "sourceFile",
        imported_at AS "importedAt",
        is_deleted AS "isDeleted"
      FROM one_c_mirror.crm_counterparties
      ORDER BY counterparty_name ASC NULLS LAST, counterparty_code ASC
      LIMIT ${this.clampLimit(limit)}
    `;

    return { data, nextCursor: null };
  }

  async listReferenceSummary(limit: number) {
    const data = await this.prisma.$queryRaw`
      SELECT
        concat_ws(':', reference_type, source_file) AS id,
        reference_type AS "referenceType",
        catalog_name AS "catalogName",
        source_file AS "sourceFile",
        rows::text AS rows,
        deleted_rows::text AS "deletedRows",
        imported_at AS "importedAt"
      FROM one_c_mirror.crm_reference_catalog_summary
      ORDER BY catalog_name ASC NULLS LAST, reference_type ASC
      LIMIT ${this.clampLimit(limit)}
    `;

    return { data, nextCursor: null };
  }

  async listReferences(limit: number) {
    const data = await this.prisma.$queryRaw`
      SELECT
        concat_ws(':', reference_type, code, name) AS id,
        reference_type AS "referenceType",
        catalog_name AS "catalogName",
        source_file AS "sourceFile",
        code,
        name,
        is_deleted AS "isDeleted",
        imported_at AS "importedAt"
      FROM one_c_mirror.crm_reference_items
      ORDER BY catalog_name ASC NULLS LAST, name ASC NULLS LAST, code ASC
      LIMIT ${this.clampLimit(limit)}
    `;

    return { data, nextCursor: null };
  }

  async listFirms(limit: number) {
    const data = await this.prisma.$queryRaw`
      WITH firm_sources AS (
        SELECT
          btrim(code) AS firm_code,
          NULLIF(btrim(name), '') AS firm_name,
          deletion_mark AS is_deleted,
          source_file,
          imported_at
        FROM one_c_mirror.latest_rows
        WHERE
          source_file = '1c_organizations.csv'
          OR object_type IN ('organization', 'organizations')

        UNION ALL

        SELECT
          btrim(organization_code) AS firm_code,
          NULLIF(btrim(organization_name), '') AS firm_name,
          false AS is_deleted,
          'crm_counterparty_balance_summary'::text AS source_file,
          imported_at
        FROM one_c_mirror.crm_counterparty_balance_summary
      ),
      latest_firms AS (
        SELECT DISTINCT ON (firm_code)
          firm_code,
          firm_name,
          is_deleted,
          source_file,
          imported_at
        FROM firm_sources
        WHERE firm_code IS NOT NULL AND firm_code <> ''
        ORDER BY firm_code, is_deleted ASC, imported_at DESC NULLS LAST
      )
      SELECT
        firm_code AS id,
        firm_code AS code,
        firm_code AS "firmId",
        firm_code AS "organizationId",
        firm_name AS name,
        firm_name AS firm,
        firm_name AS organization,
        firm_name AS "organizationName",
        NULL::text AS "taxId",
        source_file AS "sourceFile",
        imported_at AS "importedAt",
        is_deleted AS "isDeleted"
      FROM latest_firms
      ORDER BY firm_name ASC NULLS LAST, firm_code ASC
      LIMIT ${this.clampLimit(limit)}
    `;

    return { data, nextCursor: null };
  }

  async listReceivables(limit: number) {
    const data = await this.prisma.$queryRaw`
      SELECT
        concat_ws(':', counterparty_code, contract_code, organization_code, currency) AS id,
        counterparty_code AS "clientId",
        counterparty_code AS "counterpartyCode",
        counterparty_name AS "clientName",
        counterparty_name AS "counterpartyName",
        contract_code AS "contractId",
        contract_name AS "contractName",
        organization_code AS "firmId",
        organization_name AS "firmName",
        currency,
        amount::text AS debt,
        amount::text AS total,
        amount_abs::text AS "amountAbs",
        balance_sign AS "balanceSign",
        snapshot_at AS date,
        imported_at AS "importedAt"
      FROM one_c_mirror.crm_counterparty_balance_summary
      WHERE COALESCE(amount, 0) <> 0
      ORDER BY amount_abs DESC NULLS LAST, counterparty_name ASC NULLS LAST
      LIMIT ${this.clampLimit(limit)}
    `;

    return { data, nextCursor: null };
  }

  private clampLimit(limit: number) {
    return Math.max(1, Math.min(Number.isFinite(limit) ? limit : 1000, 5000));
  }
}
