// app/m/[slug]/types.ts
export type Money = number | string;

export type MenuProduct = {
  id: number;
  name: string;
  price: Money | null;
  status: "ACTIVE" | "INACTIVE" | string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder?: number | null;
  categoryId?: number | null;
  sectionId?: number | null; // ✨ NUEVO
};

// ✨ NUEVO: Tipo Section
export type MenuSection = {
  id: number;
  name: string;
  sortOrder: number;
  products: MenuProduct[];
};

export type MenuCategory = {
  id: number;
  name: string;
  imageUrl?: string | null;
  sortOrder?: number | null;
  sections?: MenuSection[]; // ✨ NUEVO: secciones dentro de la categoría
  products: MenuProduct[]; // Productos sin sección
};

export type MenuBusiness = {
  id: number;
  name: string;
  address: string | null;
  whatsapp?: string | null;
  slug?: string | null;
};

export type MenuResponse = {
  business: {
    id: number;
    name: string;
    address: string | null;
    whatsapp?: string | null;
    slug?: string | null;
  };
  categories: MenuCategory[];
  ungroupedProducts: MenuProduct[];
};