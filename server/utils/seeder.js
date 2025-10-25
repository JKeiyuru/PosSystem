// server/utils/seeder.js - Update products array

const products = [
  {
    name: 'Tele Dairy Meal 70kg',
    category: 'Cattle Feed',
    description: 'Complete feed for dairy cattle',
    baseUnit: 'bag',
    buyingPrice: 2000,
    sellingPrice: 2600,
    quantity: 50,
    reorderLevel: 10,
    supplier: 'Unga Feeds',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 70, // 70 kg in 1 bag
        pricePerUnit: 50,
        profitMargin: 0
      },
      {
        name: 'kasuku',
        conversionRate: 25, // Approximately 25 kasukus in 1 bag
        pricePerUnit: 70,
        profitMargin: 60 // Extra 60 if full bag sold in kasukus
      },
      {
        name: 'bucket',
        conversionRate: 5, // 5 buckets in 1 bag
        pricePerUnit: 500,
        profitMargin: 100 // Extra 100 if full bag sold in buckets
      }
    ]
  },
  {
    name: 'Layer Mash 70kg',
    category: 'Poultry Feed',
    description: 'Complete feed for layers',
    baseUnit: 'bag',
    buyingPrice: 2500,
    sellingPrice: 2800,
    quantity: 40,
    reorderLevel: 10,
    supplier: 'Pembe Flour Mills',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 70,
        pricePerUnit: 55,
        profitMargin: 0
      },
      {
        name: 'kasuku',
        conversionRate: 25,
        pricePerUnit: 75,
        profitMargin: 60
      },
      {
        name: 'bucket',
        conversionRate: 5,
        pricePerUnit: 540,
        profitMargin: 100
      }
    ]
  },
  {
    name: 'Broiler Starter 70kg',
    category: 'Poultry Feed',
    description: 'Starter feed for broilers',
    baseUnit: 'bag',
    buyingPrice: 2700,
    sellingPrice: 3000,
    quantity: 35,
    reorderLevel: 10,
    supplier: 'Pembe Flour Mills',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 70,
        pricePerUnit: 60,
        profitMargin: 0
      },
      {
        name: 'kasuku',
        conversionRate: 25,
        pricePerUnit: 80,
        profitMargin: 60
      },
      {
        name: 'bucket',
        conversionRate: 5,
        pricePerUnit: 580,
        profitMargin: 100
      }
    ]
  },
  {
    name: 'Pig Grower 70kg',
    category: 'Pig Feed',
    description: 'Grower feed for pigs',
    baseUnit: 'bag',
    buyingPrice: 2400,
    sellingPrice: 2700,
    quantity: 30,
    reorderLevel: 10,
    supplier: 'Unga Feeds',
    hasMultipleUnits: true,
    subUnits: [
      {
        name: 'kg',
        conversionRate: 70,
        pricePerUnit: 52,
        profitMargin: 0
      },
      {
        name: 'kasuku',
        conversionRate: 25,
        pricePerUnit: 72,
        profitMargin: 60
      },
      {
        name: 'bucket',
        conversionRate: 5,
        pricePerUnit: 520,
        profitMargin: 100
      }
    ]
  },
  // Simple products without sub-units
  {
    name: 'Dog Food Premium 20kg',
    category: 'Pet Food',
    description: 'Premium dog food',
    baseUnit: 'bag',
    buyingPrice: 3500,
    sellingPrice: 4000,
    quantity: 10,
    reorderLevel: 5,
    supplier: 'Pet Care Ltd',
    hasMultipleUnits: false,
    subUnits: []
  },
  {
    name: 'Mineral Lick Block 2kg',
    category: 'Supplements',
    description: 'Mineral supplement block',
    baseUnit: 'piece',
    buyingPrice: 150,
    sellingPrice: 200,
    quantity: 100,
    reorderLevel: 20,
    supplier: 'Animal Health Co',
    hasMultipleUnits: false,
    subUnits: []
  }
];