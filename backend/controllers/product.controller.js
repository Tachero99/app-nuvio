// controllers/product.controller.js
import prisma from "../prismaClient.js";
import { Prisma } from "@prisma/client";
import xlsx from "xlsx";
import { validateExcelSafety } from "../middlewares/excelValidator.js";


async function assertCanAccessBusiness(req, businessId) {
  const role = req.user?.role;
  if (role === "SUPERADMIN") return;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { ownerId: true },
  });

  if (!business) {
    const err = new Error("BUSINESS_NOT_FOUND");
    err.status = 404;
    throw err;
  }

  if (business.ownerId !== req.user?.id) {
    const err = new Error("FORBIDDEN");
    err.status = 403;
    throw err;
  }
}

function toDecimal(val) {
  if (val === null || val === undefined || val === "") return null;
  // Prisma Decimal: aceptar string o Decimal.
  // Si viene number, lo convertimos a string para evitar problemas de precisión.
  if (typeof val === "number") return new Prisma.Decimal(String(val));
  if (typeof val === "string") return new Prisma.Decimal(val);
  return val; // por si ya viene Decimal
}

// POST /api/business/:businessId/products
export async function createProduct(req, res) {
  try {
    const businessId = Number(req.params.businessId);
    const {
      name,
      price,
      cost,
      description,
      stock,
      sortOrder,
      status,
      categoryId,
      sectionId,
      imageUrl,
    } = req.body;

    if (!businessId) return res.status(400).json({ message: "businessId inválido" });
    if (!name) return res.status(400).json({ message: "El nombre es obligatorio" });
    if (price === undefined || price === null || price === "") {
      return res.status(400).json({ message: "El precio es obligatorio" });
    }

    await assertCanAccessBusiness(req, businessId);

    const product = await prisma.product.create({
      data: {
        businessId,
        name,
        price: toDecimal(price),
        cost: toDecimal(cost),
        description: description ?? null,
        stock: typeof stock === "number" ? stock : stock === null ? null : 0,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
        status: status ?? "ACTIVE",
        categoryId: categoryId ? Number(categoryId) : null,
        sectionId: sectionId ? Number(sectionId) : null,
        imageUrl: imageUrl ?? null,
      },
    });

    return res.status(201).json({ product });
  } catch (e) {
    if (e?.status) {
      if (e.message === "BUSINESS_NOT_FOUND") return res.status(404).json({ message: "Negocio no encontrado" });
      if (e.message === "FORBIDDEN") return res.status(403).json({ message: "No tenés permisos sobre este negocio" });
    }
    console.error("createProduct:", e);
    return res.status(500).json({ message: "Error creando producto" });
  }
}

// GET /api/business/:businessId/products
export async function listProducts(req, res) {
  try {
    const businessId = Number(req.params.businessId);
    if (!businessId) return res.status(400).json({ message: "businessId inválido" });

    await assertCanAccessBusiness(req, businessId);

    const products = await prisma.product.findMany({
      where: { businessId },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    return res.json({ products });
  } catch (e) {
    if (e?.status) {
      if (e.message === "BUSINESS_NOT_FOUND") return res.status(404).json({ message: "Negocio no encontrado" });
      if (e.message === "FORBIDDEN") return res.status(403).json({ message: "No tenés permisos sobre este negocio" });
    }
    console.error("listProducts:", e);
    return res.status(500).json({ message: "Error listando productos" });
  }
}

// PATCH /api/products/:id
export async function updateProduct(req, res) {
  try {
    const id = Number(req.params.id);
    const {
      name,
      price,
      cost,
      description,
      stock,
      sortOrder,
      status,
      categoryId,
      sectionId,
      imageUrl,
    } = req.body;

    if (Number.isNaN(id)) return res.status(400).json({ message: "ID inválido" });

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { id: true, businessId: true },
    });
    if (!existing) return res.status(404).json({ message: "Producto no encontrado" });

    await assertCanAccessBusiness(req, existing.businessId);

    const parsedCategoryId =
      categoryId === undefined
        ? undefined
        : categoryId === null || categoryId === ""
          ? null
          : Number(categoryId);

    if (parsedCategoryId !== undefined && parsedCategoryId !== null && Number.isNaN(parsedCategoryId)) {
      return res.status(400).json({ message: "categoryId inválido" });
    }

    const parsedSectionId =
      sectionId === undefined
        ? undefined
        : sectionId === null || sectionId === ""
          ? null
          : Number(sectionId);

    if (parsedSectionId !== undefined && parsedSectionId !== null && Number.isNaN(parsedSectionId)) {
      return res.status(400).json({ message: "sectionId inválido" });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: name === undefined ? undefined : (typeof name === "string" ? name.trim() : name),

        price: price === undefined ? undefined : toDecimal(price),
        cost: cost === undefined ? undefined : toDecimal(cost),

        description: description === undefined ? undefined : (description ?? null),

        stock:
          stock === undefined
            ? undefined
            : (Number.isFinite(Number(stock)) ? Number(stock) : 0),

        sortOrder:
          sortOrder === undefined
            ? undefined
            : (Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0),

        status: status === undefined ? undefined : status,

        categoryId: parsedCategoryId,

        sectionId: parsedSectionId,

        imageUrl: imageUrl === undefined ? undefined : (String(imageUrl).trim() || null),
      },
    });

    return res.json({ product });
  } catch (e) {
    if (e?.status) {
      if (e.message === "BUSINESS_NOT_FOUND") return res.status(404).json({ message: "Negocio no encontrado" });
      if (e.message === "FORBIDDEN") return res.status(403).json({ message: "No tenés permisos sobre este negocio" });
    }
    console.error("updateProduct:", e);
    return res.status(500).json({ message: "Error actualizando producto" });
  }
}


// DELETE /api/products/:id  -> HARD DELETE seguro
export const deleteProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = Number(req.params.id);

    if (Number.isNaN(productId)) {
      return res.status(400).json({ message: "id inválido" });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { business: true },
    });

    if (!product || product.business.ownerId !== userId) {
      return res
        .status(404)
        .json({ message: "Producto no encontrado o no te pertenece" });
    }

    const tx = [];

    // ✅ si existe OrderItem en tu client, nullificamos referencias
    if (prisma.orderItem?.updateMany) {
      tx.push(
        prisma.orderItem.updateMany({
          where: { productId },
          data: { productId: null },
        })
      );
    }

    tx.push(prisma.product.delete({ where: { id: productId } }));

    await prisma.$transaction(tx);

    return res.status(204).send();
  } catch (error) {
    console.error("Error eliminando producto:", error);
    return res.status(500).json({ message: "Error eliminando producto" });
  }
};


// ✨ GET /api/business/:businessId/products/bulk
export async function listProductsBulk(req, res) {
  try {
    const businessId = Number(req.params.businessId);
    if (!businessId) return res.status(400).json({ message: "businessId inválido" });

    await assertCanAccessBusiness(req, businessId);

    const {
      categoryId,
      search,
      status,
      sortBy = "sortOrder",
      sortOrder = "asc",
    } = req.query;

    const where = { businessId };

    if (categoryId) {
      const catId = Number(categoryId);
      if (!Number.isNaN(catId)) where.categoryId = catId;
    }

    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (status && (status === "ACTIVE" || status === "INACTIVE")) {
      where.status = status;
    }

    const validSortFields = ["name", "price", "createdAt", "sortOrder", "stock"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "sortOrder";
    const order = sortOrder === "desc" ? "desc" : "asc";

    const products = await prisma.product.findMany({
      where,
      orderBy: { [sortField]: order },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    const total = products.length;
    const activeCount = products.filter((p) => p.status === "ACTIVE").length;
    const inactiveCount = total - activeCount;

    return res.json({
      products,
      meta: {
        total,
        active: activeCount,
        inactive: inactiveCount,
      },
    });
  } catch (e) {
    if (e?.status) {
      if (e.message === "BUSINESS_NOT_FOUND")
        return res.status(404).json({ message: "Negocio no encontrado" });
      if (e.message === "FORBIDDEN")
        return res.status(403).json({ message: "No tenés permisos sobre este negocio" });
    }
    console.error("listProductsBulk:", e);
    return res.status(500).json({ message: "Error listando productos" });
  }
}

// ✨ PATCH /api/products/bulk
export async function updateProductsBulk(req, res) {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: "updates debe ser un array no vacío" });
    }

    const productIds = updates.map((u) => u.id);

    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, businessId: true },
    });

    if (existingProducts.length !== productIds.length) {
      return res.status(404).json({ message: "Uno o más productos no existen" });
    }

    const businessIds = [...new Set(existingProducts.map((p) => p.businessId))];
    for (const businessId of businessIds) {
      await assertCanAccessBusiness(req, businessId);
    }

    const updatePromises = updates.map((update) => {
      const { id, ...data } = update;

      const processedData = {};
      for (const [key, value] of Object.entries(data)) {
        if (key === "price" || key === "cost") {
          processedData[key] = value !== undefined ? toDecimal(value) : undefined;
        } else if (key === "categoryId" && value === "") {
          processedData[key] = null;
        } else {
          processedData[key] = value;
        }
      }

      return prisma.product.update({
        where: { id },
        data: processedData,
      });
    });

    const updatedProducts = await prisma.$transaction(updatePromises);

    return res.json({
      message: `${updatedProducts.length} productos actualizados exitosamente`,
      products: updatedProducts,
    });
  } catch (e) {
    if (e?.status) {
      if (e.message === "BUSINESS_NOT_FOUND")
        return res.status(404).json({ message: "Negocio no encontrado" });
      if (e.message === "FORBIDDEN")
        return res.status(403).json({ message: "No tenés permisos sobre este negocio" });
    }
    console.error("updateProductsBulk:", e);
    return res.status(500).json({ message: "Error actualizando productos" });
  }
}

// ✨ POST /api/business/:businessId/products/import - CON SEGURIDAD
export async function importProductsFromExcel(req, res) {
  try {
    const businessId = Number(req.params.businessId);
    if (!businessId) return res.status(400).json({ message: "businessId inválido" });

    await assertCanAccessBusiness(req, businessId);

    // Verificar que se subió un archivo
    if (!req.file) {
      return res.status(400).json({ message: "No se subió ningún archivo" });
    }

    // ✅ VALIDAR SEGURIDAD DEL EXCEL
    const { workbook } = validateExcelSafety(req.file.buffer);

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convertir a JSON
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });

    if (rows.length === 0) {
      return res.status(400).json({ message: "El archivo está vacío" });
    }

    // ✅ LÍMITE DE FILAS EN PREVIEW
    const MAX_PREVIEW_ROWS = 1000;
    if (rows.length > MAX_PREVIEW_ROWS) {
      return res.status(400).json({ 
        message: `Demasiadas filas. Máximo ${MAX_PREVIEW_ROWS} productos por importación` 
      });
    }

    // Validar y procesar filas
    const validRows = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 porque Excel empieza en 1 y hay header

      // Validar campos obligatorios
      if (!row.categoria || String(row.categoria).trim() === "") {
        errors.push(`Fila ${rowNumber}: Categoría es obligatoria`);
        continue;
      }

      if (!row.producto || String(row.producto).trim() === "") {
        errors.push(`Fila ${rowNumber}: Nombre del producto es obligatorio`);
        continue;
      }

      // Validar precio (opcional pero si viene debe ser válido)
      let price = null;
      if (row.precio !== null && row.precio !== undefined && row.precio !== "") {
        const priceNum = Number(row.precio);
        if (isNaN(priceNum) || priceNum < 0) {
          errors.push(`Fila ${rowNumber}: Precio inválido`);
          continue;
        }
        price = priceNum;
      }

      validRows.push({
        categoryName: String(row.categoria).trim(),
        sectionName: row.seccion ? String(row.seccion).trim() : null,
        productName: String(row.producto).trim(),
        price: price,
        description: row.descripcion ? String(row.descripcion).trim() : null,
      });
    }

    // Si hay errores críticos, retornar
    if (errors.length > 0 && validRows.length === 0) {
      return res.status(400).json({
        message: "Errores en el archivo",
        errors,
      });
    }

    // Agrupar por categoría
    const categoriesMap = new Map();

    for (const row of validRows) {
      if (!categoriesMap.has(row.categoryName)) {
        categoriesMap.set(row.categoryName, []);
      }
      categoriesMap.get(row.categoryName).push(row);
    }

    // Obtener categorías existentes del negocio
    const existingCategories = await prisma.category.findMany({
      where: { businessId },
      select: { id: true, name: true },
    });

    const categoryNameToId = new Map(
      existingCategories.map((cat) => [cat.name.toLowerCase(), cat.id])
    );

    // Preparar resumen
    const summary = {
      totalRows: rows.length,
      validRows: validRows.length,
      errors: errors,
      categoriesToCreate: [],
      categoriesToUpdate: [],
      productsToCreate: [],
      productsToUpdate: [],
    };

    // Por cada categoría
    for (const [categoryName, products] of categoriesMap) {
      const categoryNameLower = categoryName.toLowerCase();
      let categoryId = categoryNameToId.get(categoryNameLower);

      if (!categoryId) {
        // Categoría nueva
        summary.categoriesToCreate.push(categoryName);
      } else {
        summary.categoriesToUpdate.push(categoryName);
      }

      // Por cada producto
      for (const prod of products) {
        summary.productsToCreate.push(prod.productName);
      }
    }

    // Retornar preview
    return res.json({
      message: "Archivo procesado exitosamente",
      summary,
      preview: validRows.slice(0, 10), // Primeros 10 para preview
    });
  } catch (e) {
    console.error("importProductsFromExcel:", e);
    return res.status(500).json({ 
      message: e.message || "Error procesando archivo Excel" 
    });
  }
}

// ✨ POST /api/business/:businessId/products/import/confirm - CON LÍMITE
export async function confirmImportProducts(req, res) {
  try {
    const businessId = Number(req.params.businessId);
    const { rows } = req.body; // Array de filas validadas

    if (!businessId) return res.status(400).json({ message: "businessId inválido" });
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: "No hay filas para importar" });
    }

    // ✅ VALIDAR CANTIDAD DE PRODUCTOS
    if (rows.length > 1000) {
      return res.status(400).json({ 
        message: "No se pueden importar más de 1000 productos a la vez" 
      });
    }

    await assertCanAccessBusiness(req, businessId);

    // Agrupar por categoría
    const categoriesMap = new Map();

    for (const row of rows) {
      if (!categoriesMap.has(row.categoryName)) {
        categoriesMap.set(row.categoryName, []);
      }
      categoriesMap.get(row.categoryName).push(row);
    }

    // Obtener categorías existentes
    const existingCategories = await prisma.category.findMany({
      where: { businessId },
      select: { id: true, name: true },
    });

    const categoryNameToId = new Map(
      existingCategories.map((cat) => [cat.name.toLowerCase(), cat.id])
    );

    const results = {
      categoriesCreated: 0,
      sectionsCreated: 0,
      productsCreated: 0,
      productsUpdated: 0,
    };

    // Procesar en transacción
    await prisma.$transaction(async (tx) => {
      // Por cada categoría
      for (const [categoryName, products] of categoriesMap) {
        const categoryNameLower = categoryName.toLowerCase();
        let categoryId = categoryNameToId.get(categoryNameLower);

        // Crear categoría si no existe
        if (!categoryId) {
          const newCategory = await tx.category.create({
            data: {
              businessId,
              name: categoryName,
              sortOrder: 0,
              isActive: true,
            },
          });
          categoryId = newCategory.id;
          categoryNameToId.set(categoryNameLower, categoryId);
          results.categoriesCreated++;
        }

        // Cache de secciones por categoría
        const sectionCache = new Map();

        // Por cada producto de esta categoría
        for (const prod of products) {
          // Buscar o crear sección si viene
          let sectionId = null;
          if (prod.sectionName && prod.sectionName.trim() !== "") {
            const sectionNameLower = prod.sectionName.toLowerCase();
            const cacheKey = `${categoryId}-${sectionNameLower}`;

            // Verificar cache
            if (sectionCache.has(cacheKey)) {
              sectionId = sectionCache.get(cacheKey);
            } else {
              // Buscar sección existente
              let section = await tx.section.findFirst({
                where: {
                  businessId,
                  categoryId,
                  name: {
                    equals: prod.sectionName,
                    mode: "insensitive",
                  },
                },
              });

              // Si no existe, crearla
              if (!section) {
                section = await tx.section.create({
                  data: {
                    businessId,
                    categoryId,
                    name: prod.sectionName,
                    sortOrder: 0,
                    isActive: true,
                  },
                });
                results.sectionsCreated++;
              }

              sectionId = section.id;
              sectionCache.set(cacheKey, sectionId);
            }
          }

          // Verificar si el producto ya existe (por nombre y categoría)
          const existing = await tx.product.findFirst({
            where: {
              businessId,
              categoryId,
              name: prod.productName,
            },
          });

          if (existing) {
            // Actualizar precio y sección si viene
            const updateData = {
              description: prod.description || existing.description,
            };
            
            if (prod.price !== null) {
              updateData.price = toDecimal(prod.price);
            }
            
            if (sectionId !== null) {
              updateData.sectionId = sectionId;
            }

            await tx.product.update({
              where: { id: existing.id },
              data: updateData,
            });
            results.productsUpdated++;
          } else {
            // Crear producto nuevo con sección
            await tx.product.create({
              data: {
                businessId,
                categoryId,
                sectionId,
                name: prod.productName,
                price: prod.price !== null ? toDecimal(prod.price) : toDecimal(0),
                description: prod.description,
                status: "ACTIVE",
                sortOrder: 0,
              },
            });
            results.productsCreated++;
          }
        }
      }
    });

    return res.json({
      message: "Importación completada exitosamente",
      results,
    });
  } catch (e) {
    console.error("confirmImportProducts:", e);
    return res.status(500).json({ 
      message: e.message || "Error confirmando importación" 
    });
  }
}