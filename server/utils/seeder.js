// server/utils/seeder.js - Updated with actual products from Excel

const products = [
  // TELE PRODUCTS
  {
    name: 'TELE DAIRY MEAL HIGH',
    category: 'TELE PRODUCTS',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 70,
    buyingPrice: 2200,
    sellingPrice: 2800,
    quantity: 15,
    reorderLevel: 10,
    supplier: 'TELE PRODUCTS',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 70,
        pricePerUnit: 40,
        profitMargin: 0
      },
      {
        name: 'kasuku',
        conversionRate: 40,
        pricePerUnit: 70,
        profitMargin: 60
      },
      {
        name: 'bucket',
        conversionRate: 5.2,
        pricePerUnit: 540,
        profitMargin: 100
      }
    ]
  },
  {
    name: 'TELE DAIRY MEAL',
    category: 'TELE PRODUCTS',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 70,
    buyingPrice: 2000,
    sellingPrice: 2600,
    quantity: 18,
    reorderLevel: 10,
    supplier: 'TELE PRODUCTS',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 70,
        pricePerUnit: 37,
        profitMargin: 0
      },
      {
        name: 'kasuku',
        conversionRate: 38,
        pricePerUnit: 70,
        profitMargin: 60
      },
      {
        name: 'bucket',
        conversionRate: 5.4,
        pricePerUnit: 500,
        profitMargin: 100
      }
    ]
  },
  {
    name: 'TELE KIENYEJI',
    category: 'TELE PRODUCTS',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 70,
    buyingPrice: 1900,
    sellingPrice: 2600,
    quantity: 12,
    reorderLevel: 10,
    supplier: 'TELE PRODUCTS',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 70,
        pricePerUnit: 37,
        profitMargin: 0
      },
      {
        name: 'kasuku',
        conversionRate: 38.57,
        pricePerUnit: 70,
        profitMargin: 60
      },
      {
        name: 'bucket',
        conversionRate: 5.78,
        pricePerUnit: 450,
        profitMargin: 100
      }
    ]
  },
  {
    name: 'TELE HIGH PHOSPHOROUS SALT',
    category: 'TELE PRODUCTS',
    description: '',
    baseUnit: 'kg',
    baseUnitSize: 1,
    buyingPrice: 18,
    sellingPrice: 70,
    quantity: 20,
    reorderLevel: 10,
    supplier: 'TELE PRODUCTS',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'TELE MILK BOOSTER SALT',
    category: 'TELE PRODUCTS',
    description: '',
    baseUnit: 'kg',
    baseUnitSize: 1,
    buyingPrice: 29,
    sellingPrice: 100,
    quantity: 16,
    reorderLevel: 10,
    supplier: 'TELE PRODUCTS',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'TELE DOG FOOD',
    category: 'TELE PRODUCTS',
    description: '',
    baseUnit: 'kg',
    baseUnitSize: 1,
    buyingPrice: 43,
    sellingPrice: 100,
    quantity: 14,
    reorderLevel: 10,
    supplier: 'TELE PRODUCTS',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'TELE SOW & WEANER',
    category: 'TELE PRODUCTS',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 70,
    buyingPrice: 2250,
    sellingPrice: 2850,
    quantity: 15,
    reorderLevel: 10,
    supplier: 'TELE PRODUCTS',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 70,
        pricePerUnit: 41,
        profitMargin: 0
      },
      {
        name: 'kasuku',
        conversionRate: 38.57,
        pricePerUnit: 70,
        profitMargin: 60
      },
      {
        name: 'bucket',
        conversionRate: 5.38,
        pricePerUnit: 500,
        profitMargin: 100
      }
    ]
  },
  {
    name: 'TELE STOCKLICK SALT',
    category: 'TELE PRODUCTS',
    description: '',
    baseUnit: 'kg',
    baseUnitSize: 1,
    buyingPrice: 7.35,
    sellingPrice: 30,
    quantity: 25,
    reorderLevel: 10,
    supplier: 'TELE PRODUCTS',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'TELE HIGH PROTEIN SUPPLEMENT',
    category: 'TELE PRODUCTS',
    description: '',
    baseUnit: 'kg',
    baseUnitSize: 1,
    buyingPrice: 23,
    sellingPrice: 70,
    quantity: 18,
    reorderLevel: 10,
    supplier: 'TELE PRODUCTS',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'TELE CALF MEAL',
    category: 'TELE PRODUCTS',
    description: '',
    baseUnit: 'kg',
    baseUnitSize: 1,
    buyingPrice: 26,
    sellingPrice: 50,
    quantity: 22,
    reorderLevel: 10,
    supplier: 'TELE PRODUCTS',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 1,
        pricePerUnit: 50,
        profitMargin: 0
      },
      {
        name: 'kasuku',
        conversionRate: 0.77,
        pricePerUnit: 70,
        profitMargin: 60
      },
      {
        name: 'bucket',
        conversionRate: 0.077,
        pricePerUnit: 400,
        profitMargin: 100
      }
    ]
  },

  // CATTLE FEEDS
  {
    name: 'FUGO DAIRY MEAL',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 50,
    buyingPrice: 2200,
    sellingPrice: 2400,
    quantity: 16,
    reorderLevel: 10,
    supplier: 'Cattle Feeds',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'PEMBE DAIRY MEAL -STD',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 50,
    buyingPrice: 2300,
    sellingPrice: 2500,
    quantity: 14,
    reorderLevel: 10,
    supplier: 'Pembe Flour Mills',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 50,
        pricePerUnit: 50,
        profitMargin: 0
      },
      {
        name: 'kasuku',
        conversionRate: 35.71,
        pricePerUnit: 70,
        profitMargin: 60
      },
      {
        name: 'bucket',
        conversionRate: 4.81,
        pricePerUnit: 520,
        profitMargin: 100
      }
    ]
  },
  {
    name: 'PEMBE DAIRY MEAL',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 20,
    buyingPrice: 860,
    sellingPrice: 1000,
    quantity: 18,
    reorderLevel: 10,
    supplier: 'Pembe Flour Mills',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'PEMBE DAIRY MEAL SUPER YIELDER',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 50,
    buyingPrice: 2600,
    sellingPrice: 2800,
    quantity: 12,
    reorderLevel: 10,
    supplier: 'Pembe Flour Mills',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'FARM FEEDS MEGA PLUS',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 50,
    buyingPrice: 2900,
    sellingPrice: 3100,
    quantity: 10,
    reorderLevel: 10,
    supplier: 'Farm Feeds',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'TEMBOH DAIRY HIGH YIELD',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 70,
    buyingPrice: 2700,
    sellingPrice: 2900,
    quantity: 15,
    reorderLevel: 10,
    supplier: 'Temboh Feeds',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'TEMBOH DAIRY MEAL STD',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 70,
    buyingPrice: 2550,
    sellingPrice: 2700,
    quantity: 16,
    reorderLevel: 10,
    supplier: 'Temboh Feeds',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 70,
        pricePerUnit: 39,
        profitMargin: 0
      },
      {
        name: 'kasuku',
        conversionRate: 38.57,
        pricePerUnit: 70,
        profitMargin: 60
      },
      {
        name: 'bucket',
        conversionRate: 5.08,
        pricePerUnit: 550,
        profitMargin: 100
      }
    ]
  },
  {
    name: 'AFYA G DAIRY MEAL SUPER',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 70,
    buyingPrice: 2700,
    sellingPrice: 2900,
    quantity: 14,
    reorderLevel: 10,
    supplier: 'Afya G Feeds',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'EMPIRE DAIRYMEAL PREMIUM',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 70,
    buyingPrice: 2800,
    sellingPrice: 3000,
    quantity: 13,
    reorderLevel: 10,
    supplier: 'Empire Feeds',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'BETA DAIRY MEAL',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 70,
    buyingPrice: 2800,
    sellingPrice: 3000,
    quantity: 12,
    reorderLevel: 10,
    supplier: 'Beta Feeds',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'SPENZA DAIRY MEAL',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 70,
    buyingPrice: 3000,
    sellingPrice: 3200,
    quantity: 11,
    reorderLevel: 10,
    supplier: 'Spenza Feeds',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'VITAGEN DAIRY MEAL-HIGH YIELDER',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 70,
    buyingPrice: 2850,
    sellingPrice: 3100,
    quantity: 14,
    reorderLevel: 10,
    supplier: 'Vitagen Feeds',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'MACH DAIRY MEAL',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 70,
    buyingPrice: 2900,
    sellingPrice: 3100,
    quantity: 13,
    reorderLevel: 10,
    supplier: 'Mach Feeds',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'BIDCO DAIRY MEAL',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 70,
    buyingPrice: 3000,
    sellingPrice: 3200,
    quantity: 12,
    reorderLevel: 10,
    supplier: 'Bidco Feeds',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'PREMIUM DAIRY MEAL HIGH YIELD',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 70,
    buyingPrice: 2600,
    sellingPrice: 2900,
    quantity: 15,
    reorderLevel: 10,
    supplier: 'Premium Feeds',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'PREMIUM DAIRY MEAL-STD',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 70,
    buyingPrice: 2350,
    sellingPrice: 2600,
    quantity: 16,
    reorderLevel: 10,
    supplier: 'Premium Feeds',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'BIDCO MAIZEGERM',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 50,
    buyingPrice: 1950,
    sellingPrice: 2100,
    quantity: 18,
    reorderLevel: 10,
    supplier: 'Bidco Feeds',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'MAIZE GERM FERMENT-W',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 50,
    buyingPrice: 1700,
    sellingPrice: 1900,
    quantity: 20,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 50,
        pricePerUnit: 38,
        profitMargin: 0
      },
      {
        name: 'kasuku',
        conversionRate: 27.14,
        pricePerUnit: 70,
        profitMargin: 60
      },
      {
        name: 'bucket',
        conversionRate: 3.7,
        pricePerUnit: 500,
        profitMargin: 100
      }
    ]
  },
  {
    name: 'MAIZE GERM FERMENT-Y',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 50,
    buyingPrice: 1750,
    sellingPrice: 1950,
    quantity: 19,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 50,
        pricePerUnit: 39,
        profitMargin: 0
      },
      {
        name: 'kasuku',
        conversionRate: 27.86,
        pricePerUnit: 70,
        profitMargin: 60
      },
      {
        name: 'bucket',
        conversionRate: 3.78,
        pricePerUnit: 500,
        profitMargin: 100
      }
    ]
  },
  {
    name: 'AFYA G FERMENTED BROWN',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 50,
    buyingPrice: 1550,
    sellingPrice: 1700,
    quantity: 22,
    reorderLevel: 10,
    supplier: 'Afya G Feeds',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'GATCO M.G FERMENTED',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 50,
    buyingPrice: 1150,
    sellingPrice: 1400,
    quantity: 25,
    reorderLevel: 10,
    supplier: 'Gatco Feeds',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'PALEA MAIZE GERM PREMIUM',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 50,
    buyingPrice: 2100,
    sellingPrice: 2300,
    quantity: 16,
    reorderLevel: 10,
    supplier: 'Palea Feeds',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'CIL MAIZE GERM PREMIUM',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 50,
    buyingPrice: 1800,
    sellingPrice: 2100,
    quantity: 18,
    reorderLevel: 10,
    supplier: 'CIL Feeds',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'CIL MAIZE GERM',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 50,
    buyingPrice: 1750,
    sellingPrice: 2000,
    quantity: 20,
    reorderLevel: 10,
    supplier: 'CIL Feeds',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 50,
        pricePerUnit: 40,
        profitMargin: 0
      },
      {
        name: 'kasuku',
        conversionRate: 28.57,
        pricePerUnit: 70,
        profitMargin: 60
      },
      {
        name: 'bucket',
        conversionRate: 4,
        pricePerUnit: 500,
        profitMargin: 100
      }
    ]
  },
  {
    name: 'GATCO MAIZE GERM',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 50,
    buyingPrice: 1650,
    sellingPrice: 1950,
    quantity: 21,
    reorderLevel: 10,
    supplier: 'Gatco Feeds',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 50,
        pricePerUnit: 39,
        profitMargin: 0
      },
      {
        name: 'kasuku',
        conversionRate: 27.86,
        pricePerUnit: 70,
        profitMargin: 60
      }
    ]
  },
  {
    name: 'KENBLEST MAIZE GERM',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 50,
    buyingPrice: 1900,
    sellingPrice: 2050,
    quantity: 19,
    reorderLevel: 10,
    supplier: 'Kenblest Feeds',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 50,
        pricePerUnit: 41,
        profitMargin: 0
      },
      {
        name: 'kasuku',
        conversionRate: 29.29,
        pricePerUnit: 70,
        profitMargin: 60
      },
      {
        name: 'bucket',
        conversionRate: 4.1,
        pricePerUnit: 500,
        profitMargin: 100
      }
    ]
  },
  {
    name: 'FPL MAIZE GERM',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 50,
    buyingPrice: 1850,
    sellingPrice: 2000,
    quantity: 20,
    reorderLevel: 10,
    supplier: 'FPL Feeds',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'MAMA MAIZE GERM',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 50,
    buyingPrice: 1700,
    sellingPrice: 2050,
    quantity: 22,
    reorderLevel: 10,
    supplier: 'Mama Millers',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'KENBLEST POLLARD',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 50,
    buyingPrice: 1750,
    sellingPrice: 1900,
    quantity: 21,
    reorderLevel: 10,
    supplier: 'Kenblest Feeds',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 50,
        pricePerUnit: 38,
        profitMargin: 0
      },
      {
        name: 'kasuku',
        conversionRate: 27.14,
        pricePerUnit: 70,
        profitMargin: 60
      },
      {
        name: 'bucket',
        conversionRate: 3.8,
        pricePerUnit: 500,
        profitMargin: 100
      }
    ]
  },
  {
    name: 'CIL POLLARD',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 50,
    buyingPrice: 1850,
    sellingPrice: 2000,
    quantity: 19,
    reorderLevel: 10,
    supplier: 'CIL Feeds',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 50,
        pricePerUnit: 40,
        profitMargin: 0
      }
    ]
  },
  {
    name: 'MOMBASA MILLERS POLLARD',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 50,
    buyingPrice: 1600,
    sellingPrice: 1750,
    quantity: 23,
    reorderLevel: 10,
    supplier: 'Mombasa Millers',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 50,
        pricePerUnit: 35,
        profitMargin: 0
      }
    ]
  },
  {
    name: 'GATCO POLLARD',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 50,
    buyingPrice: 1850,
    sellingPrice: 2000,
    quantity: 20,
    reorderLevel: 10,
    supplier: 'Gatco Feeds',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'BAKEX POLLARD',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 50,
    buyingPrice: 1750,
    sellingPrice: 1900,
    quantity: 21,
    reorderLevel: 10,
    supplier: 'Bakex Feeds',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'BAKEX BRAN',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 35,
    buyingPrice: 820,
    sellingPrice: 1000,
    quantity: 25,
    reorderLevel: 10,
    supplier: 'Bakex Feeds',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'PEMBE BRAN',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 45,
    buyingPrice: 980,
    sellingPrice: 1150,
    quantity: 22,
    reorderLevel: 10,
    supplier: 'Pembe Flour Mills',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'GOLDEN BRAN',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 40,
    buyingPrice: 1040,
    sellingPrice: 1150,
    quantity: 24,
    reorderLevel: 10,
    supplier: 'Golden Feeds',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 40,
        pricePerUnit: 29,
        profitMargin: 0
      },
      {
        name: 'kasuku',
        conversionRate: 16.43,
        pricePerUnit: 70,
        profitMargin: 60
      },
      {
        name: 'bucket',
        conversionRate: 2.3,
        pricePerUnit: 500,
        profitMargin: 100
      }
    ]
  },
  {
    name: 'CIL WHEAT BRAN',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 40,
    buyingPrice: 1000,
    sellingPrice: 1200,
    quantity: 23,
    reorderLevel: 10,
    supplier: 'CIL Feeds',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 40,
        pricePerUnit: 30,
        profitMargin: 0
      },
      {
        name: 'kasuku',
        conversionRate: 17.14,
        pricePerUnit: 70,
        profitMargin: 60
      },
      {
        name: 'bucket',
        conversionRate: 2.4,
        pricePerUnit: 500,
        profitMargin: 100
      }
    ]
  },
  {
    name: 'KENBLEST BRAN',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 50,
    buyingPrice: 1250,
    sellingPrice: 1450,
    quantity: 20,
    reorderLevel: 10,
    supplier: 'Kenblest Feeds',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'MAMA MILLERS BRAN',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 40,
    buyingPrice: 980,
    sellingPrice: 1150,
    quantity: 25,
    reorderLevel: 10,
    supplier: 'Mama Millers',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'GOLDEN POLLARD',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 50,
    buyingPrice: 1760,
    sellingPrice: 1900,
    quantity: 21,
    reorderLevel: 10,
    supplier: 'Golden Feeds',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 50,
        pricePerUnit: 38,
        profitMargin: 0
      }
    ]
  },
  {
    name: 'CALF PELLETS',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 70,
    buyingPrice: 2600,
    sellingPrice: 3000,
    quantity: 15,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 70,
        pricePerUnit: 43,
        profitMargin: 0
      }
    ]
  },
  {
    name: 'CALF PELLETS',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 10,
    buyingPrice: 400,
    sellingPrice: 500,
    quantity: 30,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'CALF PELLETS',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 5,
    buyingPrice: 210,
    sellingPrice: 300,
    quantity: 35,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'MAIZE FLOUR',
    category: 'Cattle Feeds',
    description: '',
    baseUnit: 'kg',
    baseUnitSize: 1,
    buyingPrice: 35,
    sellingPrice: 60,
    quantity: 50,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: false,
    subUnits: []
  },

  // CONCENTRATES/PROTEINS
  {
    name: 'MACADAMIA',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'kg',
    baseUnitSize: 1,
    buyingPrice: 32,
    sellingPrice: 60,
    quantity: 25,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'FISH MEAL',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'kg',
    baseUnitSize: 1,
    buyingPrice: 32,
    sellingPrice: 60,
    quantity: 22,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'BONE MEAL',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'kg',
    baseUnitSize: 1,
    buyingPrice: 34,
    sellingPrice: 60,
    quantity: 20,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'SUNFLOWER CAKE MILLED',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'kg',
    baseUnitSize: 1,
    buyingPrice: 47,
    sellingPrice: 60,
    quantity: 18,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'COTTON MILLED',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'kg',
    baseUnitSize: 1,
    buyingPrice: 52,
    sellingPrice: 60,
    quantity: 16,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'GROUNDNUT',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'kg',
    baseUnitSize: 1,
    buyingPrice: 32,
    sellingPrice: 60,
    quantity: 24,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'COPRA/COCONUT',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'kg',
    baseUnitSize: 1,
    buyingPrice: 39,
    sellingPrice: 60,
    quantity: 21,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'CANOLA-GREEN',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'kg',
    baseUnitSize: 1,
    buyingPrice: 37,
    sellingPrice: 70,
    quantity: 19,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'PYMARC',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'kg',
    baseUnitSize: 1,
    buyingPrice: 38,
    sellingPrice: 60,
    quantity: 20,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'DCP POWDER',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'kg',
    baseUnitSize: 1,
    buyingPrice: 36,
    sellingPrice: 60,
    quantity: 22,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'DCP POWDER',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'piece',
    baseUnitSize: 1,
    buyingPrice: 80,
    sellingPrice: 150,
    quantity: 40,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'DCP POWDER',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'piece',
    baseUnitSize: 1,
    buyingPrice: 40,
    sellingPrice: 100,
    quantity: 45,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'DCP GRANULAR',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'kg',
    baseUnitSize: 1,
    buyingPrice: 108,
    sellingPrice: 150,
    quantity: 15,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'MAGADI(CATTLE SALT)',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 50,
    buyingPrice: 450,
    sellingPrice: 600,
    quantity: 30,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 50,
        pricePerUnit: 12,
        profitMargin: 0
      }
    ]
  },
  {
    name: 'BAKERS',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 50,
    buyingPrice: 500,
    sellingPrice: 700,
    quantity: 28,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 50,
        pricePerUnit: 14,
        profitMargin: 0
      }
    ]
  },
  {
    name: 'IGATA',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'kg',
    baseUnitSize: 1,
    buyingPrice: 40,
    sellingPrice: 50,
    quantity: 35,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'DAIRY PREMIX',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 25,
    buyingPrice: 3000,
    sellingPrice: 3500,
    quantity: 12,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 25,
        pricePerUnit: 140,
        profitMargin: 0
      }
    ]
  },
  {
    name: 'SOW & WEANER PREMIX',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 20,
    buyingPrice: 5250,
    sellingPrice: 5800,
    quantity: 8,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 20,
        pricePerUnit: 290,
        profitMargin: 0
      }
    ]
  },
  {
    name: 'OCHONGA',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'kg',
    baseUnitSize: 1,
    buyingPrice: 55,
    sellingPrice: 100,
    quantity: 25,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'BROWN LIME (COAST CALCIUM)',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 50,
    buyingPrice: 320,
    sellingPrice: 450,
    quantity: 20,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 50,
        pricePerUnit: 9,
        profitMargin: 0
      }
    ]
  },
  {
    name: 'WHITE LIME -ROUGH',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 50,
    buyingPrice: 250,
    sellingPrice: 350,
    quantity: 22,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 50,
        pricePerUnit: 7,
        profitMargin: 0
      }
    ]
  },
  {
    name: 'WHITE LIME-POWDER/FINE',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 50,
    buyingPrice: 250,
    sellingPrice: 350,
    quantity: 23,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 50,
        pricePerUnit: 7,
        profitMargin: 0
      }
    ]
  },
  {
    name: 'LIME GREY',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 50,
    buyingPrice: 200,
    sellingPrice: 350,
    quantity: 25,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 50,
        pricePerUnit: 7,
        profitMargin: 0
      }
    ]
  },
  {
    name: 'YEAST POWDER',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'kg',
    baseUnitSize: 1,
    buyingPrice: 80,
    sellingPrice: 120,
    quantity: 18,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'SOYA DRY (DOC)',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'kg',
    baseUnitSize: 1,
    buyingPrice: 78,
    sellingPrice: 120,
    quantity: 16,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'SOYA HALF-OIL CONTENT',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'kg',
    baseUnitSize: 1,
    buyingPrice: 70,
    sellingPrice: 120,
    quantity: 17,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'SOYA FULLFAT',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'kg',
    baseUnitSize: 1,
    buyingPrice: 90,
    sellingPrice: 130,
    quantity: 15,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'SOYA ORDINARY',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'kg',
    baseUnitSize: 1,
    buyingPrice: 32,
    sellingPrice: 60,
    quantity: 25,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'ROCK SALT',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'kg',
    baseUnitSize: 1,
    buyingPrice: 52,
    sellingPrice: 70,
    quantity: 20,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'EPSOM',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'kg',
    baseUnitSize: 1,
    buyingPrice: 78,
    sellingPrice: 100,
    quantity: 18,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'AGRICULTURAL LIME',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 50,
    buyingPrice: 250,
    sellingPrice: 350,
    quantity: 22,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 50,
        pricePerUnit: 7,
        profitMargin: 0
      }
    ]
  },
  {
    name: 'PROGRESS STOCKLICK',
    category: 'Concentrates/Proteins',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 5,
    buyingPrice: 80,
    sellingPrice: 100,
    quantity: 30,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: false,
    subUnits: []
  },

  // MILK REPLACERS
  {
    name: 'PATANISHO MILK REPLACER',
    category: 'Milk Replacers',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 1,
    buyingPrice: 450,
    sellingPrice: 550,
    quantity: 25,
    reorderLevel: 10,
    supplier: 'Patanisho',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'PATANISHO MILK REPLACER',
    category: 'Milk Replacers',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 2,
    buyingPrice: 850,
    sellingPrice: 1050,
    quantity: 20,
    reorderLevel: 10,
    supplier: 'Patanisho',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'VETPRO MILK REPLACER',
    category: 'Milk Replacers',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 1,
    buyingPrice: 475,
    sellingPrice: 600,
    quantity: 22,
    reorderLevel: 10,
    supplier: 'Vetpro',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'VETPRO MILK REPLACER',
    category: 'Milk Replacers',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 2,
    buyingPrice: 930,
    sellingPrice: 1150,
    quantity: 18,
    reorderLevel: 10,
    supplier: 'Vetpro',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'OSHO MILK REPLACER',
    category: 'Milk Replacers',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 1,
    buyingPrice: 585,
    sellingPrice: 700,
    quantity: 15,
    reorderLevel: 10,
    supplier: 'Osho',
    hasMultipleUnits: false,
    subUnits: []
  },

  // MOLLASSES
  {
    name: 'MOLLASSES(20KG)',
    category: 'Mollasses',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 20,
    buyingPrice: 900,
    sellingPrice: 1100,
    quantity: 20,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'MOLLASSES(10KG)',
    category: 'Mollasses',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 10,
    buyingPrice: 500,
    sellingPrice: 400,
    quantity: 25,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'MOLLASSES(5KG)',
    category: 'Mollasses',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: 5,
    buyingPrice: 250,
    sellingPrice: 300,
    quantity: 30,
    reorderLevel: 10,
    supplier: 'Various',
    hasMultipleUnits: false,
    subUnits: []
  },
  // FARM TOOLS AND EQUIPMENTS
{
  name: 'PANGAS CHINA',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 25,
  sellingPrice: 45,
  quantity: 30,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'MOPS L.3 PLASTIC',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 17.5,
  sellingPrice: 25,
  quantity: 40,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'BLACK POLYTHENE',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'roll',
  baseUnitSize: 1,
  buyingPrice: 3500,
  sellingPrice: 200,
  quantity: 15,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'AUTOMATIC DRINKERS',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 1100,
  sellingPrice: 1500,
  quantity: 20,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: '1.5L DRINKERS',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 110,
  sellingPrice: 250,
  quantity: 35,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: '3L DRINKERS',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 200,
  sellingPrice: 350,
  quantity: 30,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: '6L DRINKERS',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 330,
  sellingPrice: 450,
  quantity: 25,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: '10L DRINKERS',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 470,
  sellingPrice: 600,
  quantity: 22,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: '1.5KG FEEDER',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 120,
  sellingPrice: 250,
  quantity: 35,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: '3KG FEEDER',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 240,
  sellingPrice: 350,
  quantity: 30,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: '6KG FEEDER',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 320,
  sellingPrice: 450,
  quantity: 25,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: '9KG FEEDER',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 470,
  sellingPrice: 600,
  quantity: 22,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: '1L SPRAYER',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 120,
  sellingPrice: 250,
  quantity: 35,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: '2L SPRAYER',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 280,
  sellingPrice: 400,
  quantity: 28,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: '20L SPRAYER',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 1650,
  sellingPrice: 2200,
  quantity: 18,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'WATERING CANS',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 280,
  sellingPrice: 400,
  quantity: 30,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'FEEDING BOTTLES',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 650,
  sellingPrice: 900,
  quantity: 25,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'SHOVEL SPADES',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 550,
  sellingPrice: 750,
  quantity: 22,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'EMPTY SACKS',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 28,
  sellingPrice: 50,
  quantity: 50,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'ROPES',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 20,
  sellingPrice: 30,
  quantity: 60,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'KIFAGIO BIG',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 70,
  sellingPrice: 100,
  quantity: 40,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'KIFAGIO SMALL',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 35,
  sellingPrice: 50,
  quantity: 45,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'JUAKALI CHICKS FEEDER-LONG',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 120,
  sellingPrice: 250,
  quantity: 35,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'JUAKALI CHICKS FEEDER-SHORT',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 60,
  sellingPrice: 150,
  quantity: 40,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'FEEDING TRAY',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 360,
  sellingPrice: 550,
  quantity: 25,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'T BROOM',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 170,
  sellingPrice: 220,
  quantity: 30,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'D4 BROOM',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 170,
  sellingPrice: 250,
  quantity: 28,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'PLASTIC CHICKS FEEDER LONG',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 100,
  sellingPrice: 200,
  quantity: 35,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'PLASTIC CHICKS FEEDER SHORT',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 70,
  sellingPrice: 150,
  quantity: 38,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'EGG TRAY-KHAKI',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 18,
  sellingPrice: 30,
  quantity: 50,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'EGG TRAY-PLASTIC',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 80,
  sellingPrice: 120,
  quantity: 40,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'NYUNDO',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 250,
  sellingPrice: 350,
  quantity: 25,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'COW SHED PLASTIC SCRUBBER',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 150,
  sellingPrice: 200,
  quantity: 30,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'SHEAR',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 320,
  sellingPrice: 500,
  quantity: 22,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'SLASHER',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 180,
  sellingPrice: 300,
  quantity: 28,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'COW EARTAG',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 20,
  sellingPrice: 100,
  quantity: 45,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'WEIGHING BAND',
  category: 'Farm Tools/Equipments',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 800,
  sellingPrice: 1200,
  quantity: 20,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},

// FERTILIZERS AND SEEDS
{
  name: 'TERERE',
  category: 'Fertilizers And Seeds',
  description: '',
  baseUnit: 'packet',
  baseUnitSize: 1,
  buyingPrice: 45,
  sellingPrice: 100,
  quantity: 35,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'MANAGU',
  category: 'Fertilizers And Seeds',
  description: '',
  baseUnit: 'packet',
  baseUnitSize: 1,
  buyingPrice: 45,
  sellingPrice: 100,
  quantity: 35,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'DHANIA',
  category: 'Fertilizers And Seeds',
  description: '',
  baseUnit: 'packet',
  baseUnitSize: 1,
  buyingPrice: 45,
  sellingPrice: 100,
  quantity: 35,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'SPINACH',
  category: 'Fertilizers And Seeds',
  description: '',
  baseUnit: 'packet',
  baseUnitSize: 1,
  buyingPrice: 45,
  sellingPrice: 100,
  quantity: 35,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'COLLARDS (SUKUMA WIKI)',
  category: 'Fertilizers And Seeds',
  description: '',
  baseUnit: 'packet',
  baseUnitSize: 1,
  buyingPrice: 45,
  sellingPrice: 100,
  quantity: 35,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'CABBAGE',
  category: 'Fertilizers And Seeds',
  description: '',
  baseUnit: 'packet',
  baseUnitSize: 1,
  buyingPrice: 45,
  sellingPrice: 100,
  quantity: 35,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'H513',
  category: 'Fertilizers And Seeds',
  description: '',
  baseUnit: 'pack',
  baseUnitSize: 12,
  buyingPrice: 650,
  sellingPrice: 850,
  quantity: 25,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'DUMA 43',
  category: 'Fertilizers And Seeds',
  description: '',
  baseUnit: 'pack',
  baseUnitSize: 12,
  buyingPrice: 850,
  sellingPrice: 1000,
  quantity: 22,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'H6213',
  category: 'Fertilizers And Seeds',
  description: '',
  baseUnit: 'pack',
  baseUnitSize: 12,
  buyingPrice: 610,
  sellingPrice: 800,
  quantity: 26,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'DK8031',
  category: 'Fertilizers And Seeds',
  description: '',
  baseUnit: 'pack',
  baseUnitSize: 10,
  buyingPrice: 900,
  sellingPrice: 1000,
  quantity: 20,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'DK8033',
  category: 'Fertilizers And Seeds',
  description: '',
  baseUnit: 'pack',
  baseUnitSize: 10,
  buyingPrice: 800,
  sellingPrice: 900,
  quantity: 22,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'PIONEER 3253',
  category: 'Fertilizers And Seeds',
  description: '',
  baseUnit: 'packet',
  baseUnitSize: 1,
  buyingPrice: 1250,
  sellingPrice: 1500,
  quantity: 18,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'TSAVO WE4141',
  category: 'Fertilizers And Seeds',
  description: '',
  baseUnit: 'packet',
  baseUnitSize: 1,
  buyingPrice: 750,
  sellingPrice: 900,
  quantity: 24,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'DAP',
  category: 'Fertilizers And Seeds',
  description: '',
  baseUnit: 'bag',
  baseUnitSize: 50,
  buyingPrice: 6350,
  sellingPrice: 6700,
  quantity: 15,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: true,
  subUnits: [
    {
      name: 'kg',
      conversionRate: 50,
      pricePerUnit: 134,
      profitMargin: 0
    }
  ]
},
{
  name: 'DAP',
  category: 'Fertilizers And Seeds',
  description: '',
  baseUnit: 'bag',
  baseUnitSize: 10,
  buyingPrice: 1200,
  sellingPrice: 1300,
  quantity: 25,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'CAN',
  category: 'Fertilizers And Seeds',
  description: '',
  baseUnit: 'bag',
  baseUnitSize: 50,
  buyingPrice: 60,
  sellingPrice: 3300,
  quantity: 20,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: true,
  subUnits: [
    {
      name: 'kg',
      conversionRate: 50,
      pricePerUnit: 66,
      profitMargin: 0
    }
  ]
},
{
  name: '17:17:17',
  category: 'Fertilizers And Seeds',
  description: '',
  baseUnit: 'bag',
  baseUnitSize: 50,
  buyingPrice: 88,
  sellingPrice: 4700,
  quantity: 18,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: true,
  subUnits: [
    {
      name: 'kg',
      conversionRate: 50,
      pricePerUnit: 94,
      profitMargin: 0
    }
  ]
},
{
  name: '23:23 RUIRU',
  category: 'Fertilizers And Seeds',
  description: '',
  baseUnit: 'bag',
  baseUnitSize: 50,
  buyingPrice: 86,
  sellingPrice: 4700,
  quantity: 18,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: true,
  subUnits: [
    {
      name: 'kg',
      conversionRate: 50,
      pricePerUnit: 94,
      profitMargin: 0
    }
  ]
},
{
  name: 'UREA',
  category: 'Fertilizers And Seeds',
  description: '',
  baseUnit: 'bag',
  baseUnitSize: 50,
  buyingPrice: 4700,
  sellingPrice: 5000,
  quantity: 16,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: true,
  subUnits: [
    {
      name: 'kg',
      conversionRate: 50,
      pricePerUnit: 100,
      profitMargin: 0
    }
  ]
},

// STARTER CRUMBS
{
  name: 'EMPIRE FEEDS (STARTER CRUMBS)',
  category: 'Poultry Feeds',
  description: '',
  baseUnit: 'bag',
  baseUnitSize: 50,
  buyingPrice: 3230,
  sellingPrice: 4000,
  quantity: 14,
  reorderLevel: 10,
  supplier: 'Empire Feeds',
  hasMultipleUnits: true,
  subUnits: [
    {
      name: 'kg',
      conversionRate: 50,
      pricePerUnit: 80,
      profitMargin: 0
    }
  ]
},
{
  name: 'UNGA(STARTER CRUMBS)',
  category: 'Poultry Feeds',
  description: '',
  baseUnit: 'bag',
  baseUnitSize: 50,
  buyingPrice: 4100,
  sellingPrice: 4400,
  quantity: 12,
  reorderLevel: 10,
  supplier: 'Unga Feeds',
  hasMultipleUnits: true,
  subUnits: [
    {
      name: 'kg',
      conversionRate: 50,
      pricePerUnit: 88,
      profitMargin: 0
    }
  ]
},
{
  name: 'PEMBE(STARTER CRUMBS)',
  category: 'Poultry Feeds',
  description: '',
  baseUnit: 'bag',
  baseUnitSize: 50,
  buyingPrice: 4150,
  sellingPrice: 4350,
  quantity: 13,
  reorderLevel: 10,
  supplier: 'Pembe Flour Mills',
  hasMultipleUnits: true,
  subUnits: [
    {
      name: 'kg',
      conversionRate: 50,
      pricePerUnit: 87,
      profitMargin: 0
    }
  ]
},
{
  name: 'BREAD CRUMBS(STARTER CRUMBS)',
  category: 'Poultry Feeds',
  description: '',
  baseUnit: 'bag',
  baseUnitSize: 50,
  buyingPrice: 30,
  sellingPrice: 2000,
  quantity: 20,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: true,
  subUnits: [
    {
      name: 'kg',
      conversionRate: 50,
      pricePerUnit: 40,
      profitMargin: 0
    }
  ]
},
{
  name: 'ISINYA BROILER STARTER CRUMBS(STARTER CRUMBS)',
  category: 'Poultry Feeds',
  description: '',
  baseUnit: 'bag',
  baseUnitSize: 50,
  buyingPrice: 4105,
  sellingPrice: 4300,
  quantity: 12,
  reorderLevel: 10,
  supplier: 'Isinya Feeds',
  hasMultipleUnits: true,
  subUnits: [
    {
      name: 'kg',
      conversionRate: 50,
      pricePerUnit: 86,
      profitMargin: 0
    }
  ]
},
{
  name: 'SIGMA(STARTER CRUMBS)',
  category: 'Poultry Feeds',
  description: '',
  baseUnit: 'bag',
  baseUnitSize: 50,
  buyingPrice: 4150,
  sellingPrice: 4350,
  quantity: 13,
  reorderLevel: 10,
  supplier: 'Sigma Feeds',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'SUGUNA(STARTER CRUMBS)',
  category: 'Poultry Feeds',
  description: '',
  baseUnit: 'bag',
  baseUnitSize: 50,
  buyingPrice: 4150,
  sellingPrice: 4350,
  quantity: 13,
  reorderLevel: 10,
  supplier: 'Suguna Feeds',
  hasMultipleUnits: false,
  subUnits: []
},

// FINISHER PELLETS
{
  name: 'UNGA(FINISHER PELLETS)',
  category: 'Poultry Feeds',
  description: '',
  baseUnit: 'bag',
  baseUnitSize: 50,
  buyingPrice: 3750,
  sellingPrice: 3950,
  quantity: 14,
  reorderLevel: 10,
  supplier: 'Unga Feeds',
  hasMultipleUnits: true,
  subUnits: [
    {
      name: 'kg',
      conversionRate: 50,
      pricePerUnit: 79,
      profitMargin: 0
    }
  ]
},
{
  name: 'PEMBE(FINISHER PELLETS)',
  category: 'Poultry Feeds',
  description: '',
  baseUnit: 'bag',
  baseUnitSize: 50,
  buyingPrice: 3750,
  sellingPrice: 3950,
  quantity: 14,
  reorderLevel: 10,
  supplier: 'Pembe Flour Mills',
  hasMultipleUnits: true,
  subUnits: [
    {
      name: 'kg',
      conversionRate: 50,
      pricePerUnit: 79,
      profitMargin: 0
    }
  ]
},
{
  name: 'ISINYA BROILER (FINISHER PELLETS)',
  category: 'Poultry Feeds',
  description: '',
  baseUnit: 'bag',
  baseUnitSize: 50,
  buyingPrice: 3710,
  sellingPrice: 3900,
  quantity: 15,
  reorderLevel: 10,
  supplier: 'Isinya Feeds',
  hasMultipleUnits: true,
  subUnits: [
    {
      name: 'kg',
      conversionRate: 50,
      pricePerUnit: 78,
      profitMargin: 0
    }
  ]
},
{
  name: 'EMPIRE FEEDS (FINISHER PELLETS)',
  category: 'Poultry Feeds',
  description: '',
  baseUnit: 'bag',
  baseUnitSize: 50,
  buyingPrice: 3600,
  sellingPrice: 3800,
  quantity: 16,
  reorderLevel: 10,
  supplier: 'Empire Feeds',
  hasMultipleUnits: true,
  subUnits: [
    {
      name: 'kg',
      conversionRate: 50,
      pricePerUnit: 76,
      profitMargin: 0
    }
  ]
},
{
  name: 'SIGMA (FINISHER PELLETS)',
  category: 'Poultry Feeds',
  description: '',
  baseUnit: 'bag',
  baseUnitSize: 50,
  buyingPrice: 3850,
  sellingPrice: 4050,
  quantity: 13,
  reorderLevel: 10,
  supplier: 'Sigma Feeds',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'SUGUNA (FINISHER PELLETS)',
  category: 'Poultry Feeds',
  description: '',
  baseUnit: 'bag',
  baseUnitSize: 50,
  buyingPrice: 3850,
  sellingPrice: 4050,
  quantity: 13,
  reorderLevel: 10,
  supplier: 'Suguna Feeds',
  hasMultipleUnits: false,
  subUnits: []
},

// REUCLIMIX
{
  name: 'REUCLIMIX 1KG',
  category: 'REUCLIMIX',
  description: '',
  baseUnit: 'bag',
  baseUnitSize: 1,
  buyingPrice: 185,
  sellingPrice: 250,
  quantity: 25,
  reorderLevel: 10,
  supplier: 'Reuclimix',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'REUCLIMIX 2KG',
  category: 'REUCLIMIX',
  description: '',
  baseUnit: 'bag',
  baseUnitSize: 2,
  buyingPrice: 385,
  sellingPrice: 450,
  quantity: 22,
  reorderLevel: 10,
  supplier: 'Reuclimix',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'REUCLIMIX 5KG',
  category: 'REUCLIMIX',
  description: '',
  baseUnit: 'bag',
  baseUnitSize: 5,
  buyingPrice: 830,
  sellingPrice: 950,
  quantity: 18,
  reorderLevel: 10,
  supplier: 'Reuclimix',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'REUCLIMIX 10KG',
  category: 'REUCLIMIX',
  description: '',
  baseUnit: 'bag',
  baseUnitSize: 10,
  buyingPrice: 1450,
  sellingPrice: 1650,
  quantity: 15,
  reorderLevel: 10,
  supplier: 'Reuclimix',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'REUCLIMIX 20KG',
  category: 'REUCLIMIX',
  description: '',
  baseUnit: 'bag',
  baseUnitSize: 29,
  buyingPrice: 2850,
  sellingPrice: 3000,
  quantity: 12,
  reorderLevel: 10,
  supplier: 'Reuclimix',
  hasMultipleUnits: false,
  subUnits: []
},

// MACLICK PRODUCTS
{
  name: 'MACLICK MILKING SALVE 100G',
  category: 'MACLICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 110,
  sellingPrice: 130,
  quantity: 30,
  reorderLevel: 10,
  supplier: 'Maclick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'MACLICK MILKING SALVE 250G',
  category: 'MACLICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 245,
  sellingPrice: 300,
  quantity: 25,
  reorderLevel: 10,
  supplier: 'Maclick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'MACLICK MILKING SALVE 400G',
  category: 'MACLICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 360,
  sellingPrice: 450,
  quantity: 22,
  reorderLevel: 10,
  supplier: 'Maclick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'MACLICK MILKING SALVE 1KG',
  category: 'MACLICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 833,
  sellingPrice: 1000,
  quantity: 18,
  reorderLevel: 10,
  supplier: 'Maclick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'MACLICK MINERAL BRICKS 2KG',
  category: 'MACLICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 270,
  sellingPrice: 330,
  quantity: 25,
  reorderLevel: 10,
  supplier: 'Maclick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'MACLICK MINERAL BRICKS 5KG',
  category: 'MACLICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 636,
  sellingPrice: 750,
  quantity: 20,
  reorderLevel: 10,
  supplier: 'Maclick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'MACLICK SUPER 1KG',
  category: 'MACLICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 240,
  sellingPrice: 300,
  quantity: 28,
  reorderLevel: 10,
  supplier: 'Maclick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'MACLICK SUPER 2KG',
  category: 'MACLICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 469,
  sellingPrice: 550,
  quantity: 22,
  reorderLevel: 10,
  supplier: 'Maclick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'MACLICK SUPER 5KG',
  category: 'MACLICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 1151,
  sellingPrice: 1350,
  quantity: 16,
  reorderLevel: 10,
  supplier: 'Maclick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'MACLICK SUPER 10KG',
  category: 'MACLICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 2306,
  sellingPrice: 2650,
  quantity: 12,
  reorderLevel: 10,
  supplier: 'Maclick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'MACLICK SUPER 20KG',
  category: 'MACLICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 4475,
  sellingPrice: 5000,
  quantity: 10,
  reorderLevel: 10,
  supplier: 'Maclick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'MACLICK SUPER 25KG',
  category: 'MACLICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 5182,
  sellingPrice: 5765,
  quantity: 8,
  reorderLevel: 10,
  supplier: 'Maclick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'MACLICK DRY 1KG',
  category: 'MACLICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 240,
  sellingPrice: 300,
  quantity: 28,
  reorderLevel: 10,
  supplier: 'Maclick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'MACLICK DRY 2KG',
  category: 'MACLICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 474,
  sellingPrice: 570,
  quantity: 22,
  reorderLevel: 10,
  supplier: 'Maclick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'MACLICK DRY 6KG',
  category: 'MACLICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 1385,
  sellingPrice: 1600,
  quantity: 15,
  reorderLevel: 10,
  supplier: 'Maclick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'MACLICK PLUS 1KG',
  category: 'MACLICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 179,
  sellingPrice: 250,
  quantity: 30,
  reorderLevel: 10,
  supplier: 'Maclick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'MACLICK PLUS 2KG',
  category: 'MACLICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 357,
  sellingPrice: 420,
  quantity: 25,
  reorderLevel: 10,
  supplier: 'Maclick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'MACLICK PLUS 5KG',
  category: 'MACLICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 845,
  sellingPrice: 950,
  quantity: 18,
  reorderLevel: 10,
  supplier: 'Maclick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'MACLICK PLUS 10KG',
  category: 'MACLICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 1706,
  sellingPrice: 2000,
  quantity: 14,
  reorderLevel: 10,
  supplier: 'Maclick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'MACLICK PLUS 20KG',
  category: 'MACLICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 3096,
  sellingPrice: 3500,
  quantity: 10,
  reorderLevel: 10,
  supplier: 'Maclick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'MACLICK PLUS 50KG',
  category: 'MACLICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 7519,
  sellingPrice: 8250,
  quantity: 6,
  reorderLevel: 10,
  supplier: 'Maclick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'NILZAN PLUS 125ML',
  category: 'MACLICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 225,
  sellingPrice: 300,
  quantity: 25,
  reorderLevel: 10,
  supplier: 'Maclick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'NILZAN PLUS 150ML',
  category: 'MACLICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 245,
  sellingPrice: 350,
  quantity: 22,
  reorderLevel: 10,
  supplier: 'Maclick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'EXTRA CHAMPS 2KG',
  category: 'MACLICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 520,
  sellingPrice: 650,
  quantity: 18,
  reorderLevel: 10,
  supplier: 'Maclick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'EXTRA CHAMPS 5KG',
  category: 'MACLICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 1295,
  sellingPrice: 1500,
  quantity: 15,
  reorderLevel: 10,
  supplier: 'Maclick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'EXTRA LEGENDS 2KG',
  category: 'MACLICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 459,
  sellingPrice: 600,
  quantity: 20,
  reorderLevel: 10,
  supplier: 'Maclick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'EXTRA LEGENDS 5KG',
  category: 'MACLICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 1162,
  sellingPrice: 1400,
  quantity: 16,
  reorderLevel: 10,
  supplier: 'Maclick',
  hasMultipleUnits: false,
  subUnits: []
},

// VITAL PRODUCTS
{
  name: 'VITAL MAZIWA 1KG',
  category: 'VITAL',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 228,
  sellingPrice: 300,
  quantity: 25,
  reorderLevel: 10,
  supplier: 'Vital',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'VITAL MAZIWA 2KG',
  category: 'VITAL',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 450,
  sellingPrice: 540,
  quantity: 20,
  reorderLevel: 10,
  supplier: 'Vital',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'VITAL MAZIWA 5KG',
  category: 'VITAL',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 1089,
  sellingPrice: 1250,
  quantity: 16,
  reorderLevel: 10,
  supplier: 'Vital',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'VITAL MAZIWA 10KG',
  category: 'VITAL',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 2157,
  sellingPrice: 2450,
  quantity: 12,
  reorderLevel: 10,
  supplier: 'Vital',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'VITAL JOTO 1KG',
  category: 'VITAL',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 172,
  sellingPrice: 250,
  quantity: 28,
  reorderLevel: 10,
  supplier: 'Vital',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'VITAL JOTO 2KG',
  category: 'VITAL',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 339,
  sellingPrice: 400,
  quantity: 22,
  reorderLevel: 10,
  supplier: 'Vital',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'VITAL JOTO 5KG',
  category: 'VITAL',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 829,
  sellingPrice: 950,
  quantity: 18,
  reorderLevel: 10,
  supplier: 'Vital',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'VITAL NDAMA 1KG',
  category: 'VITAL',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 163,
  sellingPrice: 220,
  quantity: 30,
  reorderLevel: 10,
  supplier: 'Vital',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'VITAL NDAMA 2KG',
  category: 'VITAL',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 320,
  sellingPrice: 400,
  quantity: 24,
  reorderLevel: 10,
  supplier: 'Vital',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'VITAL NDAMA 20KG',
  category: 'VITAL',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 2957,
  sellingPrice: 3350,
  quantity: 10,
  reorderLevel: 10,
  supplier: 'Vital',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'VITAL DRY 1KG',
  category: 'VITAL',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 252,
  sellingPrice: 320,
  quantity: 26,
  reorderLevel: 10,
  supplier: 'Vital',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'VITAL DRY 2KG',
  category: 'VITAL',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 496,
  sellingPrice: 600,
  quantity: 20,
  reorderLevel: 10,
  supplier: 'Vital',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'VITAL KONDOO',
  category: 'VITAL',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 110,
  sellingPrice: 200,
  quantity: 32,
  reorderLevel: 10,
  supplier: 'Vital',
  hasMultipleUnits: false,
  subUnits: []
},

// VIPRO PRODUCTS
{
  name: 'VIPRO MAYAI PLUS',
  category: 'VIPRO',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 250,
  sellingPrice: 350,
  quantity: 25,
  reorderLevel: 10,
  supplier: 'Vipro',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'VIPRO MAZIWA PLUS',
  category: 'VIPRO',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 250,
  sellingPrice: 350,
  quantity: 25,
  reorderLevel: 10,
  supplier: 'Vipro',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'VIPRO NGURUWE PLUS',
  category: 'VIPRO',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 250,
  sellingPrice: 350,
  quantity: 25,
  reorderLevel: 10,
  supplier: 'Vipro',
  hasMultipleUnits: false,
  subUnits: []
},

// CHICK ADDITIVES
{
  name: 'EGOCIN SOLUBLE',
  category: 'CHICK ADDITIVES',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 50,
  sellingPrice: 70,
  quantity: 35,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'EGOCIN CHICK FORMULA',
  category: 'CHICK ADDITIVES',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 40,
  sellingPrice: 70,
  quantity: 38,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'POLTRICIN CHICK',
  category: 'CHICK ADDITIVES',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 44.2,
  sellingPrice: 70,
  quantity: 36,
  reorderLevel: 10,
  supplier: 'Various',
  hasMultipleUnits: false,
  subUnits: []
},

// TWIGALICK PRODUCTS
{
  name: 'TWIGALICK DRY COW 1KG',
  category: 'TWIGALICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 222,
  sellingPrice: 300,
  quantity: 26,
  reorderLevel: 10,
  supplier: 'Twigalick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'TWIGALICK DRY COW 2KG',
  category: 'TWIGALICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 408,
  sellingPrice: 500,
  quantity: 20,
  reorderLevel: 10,
  supplier: 'Twigalick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'TWIGALICK JOTO 1KG',
  category: 'TWIGALICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 177,
  sellingPrice: 250,
  quantity: 28,
  reorderLevel: 10,
  supplier: 'Twigalick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'TWIGALICK JOTO 2KG',
  category: 'TWIGALICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 308,
  sellingPrice: 400,
  quantity: 22,
  reorderLevel: 10,
  supplier: 'Twigalick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'TWIGALICK JOTO 5KG',
  category: 'TWIGALICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 728,
  sellingPrice: 850,
  quantity: 18,
  reorderLevel: 10,
  supplier: 'Twigalick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'TWIGALICK MAZIWA ZAIDI 1KG',
  category: 'TWIGALICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 183,
  sellingPrice: 250,
  quantity: 27,
  reorderLevel: 10,
  supplier: 'Twigalick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'TWIGALICK MAZIWA ZAIDI 2KG',
  category: 'TWIGALICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 330,
  sellingPrice: 450,
  quantity: 21,
  reorderLevel: 10,
  supplier: 'Twigalick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'TWIGALICK MAZIWA ZAIDI 5KG',
  category: 'TWIGALICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 762,
  sellingPrice: 900,
  quantity: 17,
  reorderLevel: 10,
  supplier: 'Twigalick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'TWIGALICK NDAMA 1KG',
  category: 'TWIGALICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 128,
  sellingPrice: 200,
  quantity: 32,
  reorderLevel: 10,
  supplier: 'Twigalick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'TWIGALICK NDAMA 2KG',
  category: 'TWIGALICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 222,
  sellingPrice: 350,
  quantity: 25,
  reorderLevel: 10,
  supplier: 'Twigalick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'TWIGALICK MINERAL BRICK 2KG',
  category: 'TWIGALICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 175,
  sellingPrice: 300,
  quantity: 28,
  reorderLevel: 10,
  supplier: 'Twigalick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'TWIGALICK MINERAL BRICK 10KG',
  category: 'TWIGALICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 1628,
  sellingPrice: 1850,
  quantity: 14,
  reorderLevel: 10,
  supplier: 'Twigalick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'TWIGALICK MAZIWA MAX 1KG',
  category: 'TWIGALICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 218.2,
  sellingPrice: 300,
  quantity: 26,
  reorderLevel: 10,
  supplier: 'Twigalick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'TWIGALICK MAZIWA MAX 2KG',
  category: 'TWIGALICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 402.8,
  sellingPrice: 500,
  quantity: 20,
  reorderLevel: 10,
  supplier: 'Twigalick',
  hasMultipleUnits: false,
  subUnits: []
},
{
  name: 'TWIGALICK MAZIWA MAX 5KG',
  category: 'TWIGALICK',
  description: '',
  baseUnit: 'piece',
  baseUnitSize: 1,
  buyingPrice: 1030.5,
  sellingPrice: 1200,
  quantity: 16,
  reorderLevel: 10,
  supplier: 'Twigalick',
  hasMultipleUnits: false,
  subUnits: []
}
];



// Add this to the bottom of your existing server/utils/seeder.js file:

// Seeding execution code (only runs when file is executed directly)
if (import.meta.url === `file://${process.argv[1]}`) {
  import('mongoose').then(async (mongooseModule) => {
    const mongoose = mongooseModule.default;
    import('../models/Product.model.js').then(async (ProductModule) => {
      const Product = ProductModule.default;
      import('dotenv').then(async (dotenvModule) => {
        const dotenv = dotenvModule.default;
        
        dotenv.config();
        
        try {
          console.log('🚀 Starting product seeder...');
          await mongoose.connect(process.env.MONGODB_URI);
          console.log('✅ Database connected');
          
          await Product.deleteMany({});
          console.log('✅ Cleared existing products');
          
          const result = await Product.insertMany(products);
          console.log(`✅ Successfully seeded ${result.length} products`);
          
          await mongoose.connection.close();
          console.log('✅ Seeding completed!');
          process.exit(0);
        } catch (error) {
          console.error('❌ Seeding failed:', error);
          process.exit(1);
        }
      });
    });
  });
}

export default products;