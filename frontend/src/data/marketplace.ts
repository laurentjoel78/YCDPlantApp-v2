export interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  image: string;
  category: string;
  description: string;
  stock: number;
  seller: {
    id: string;
    name: string;
    rating: number;
  };
}

export const categories = [
  { id: 'all', name: 'All' },
  { id: 'grains', name: 'Grains' },
  { id: 'livestock', name: 'Livestock' },
  { id: 'seeds', name: 'Seeds' },
  { id: 'plants', name: 'Plants' },
  { id: 'tools', name: 'Tools' },
  { id: 'fertilizers', name: 'Fertilizers' },
  { id: 'pesticides', name: 'Pesticides' },
  { id: 'other', name: 'Other' },
] as const;

export const sampleProducts: Product[] = [
  {
    id: '1',
    name: 'Rice Seed Premium',
    price: 50,
    unit: 'kg',
    image: 'https://picsum.photos/200/300?random=1',
    category: 'seeds',
    description: 'High-yield rice seeds suitable for all seasons',
    stock: 1000,
    seller: {
      id: 's1',
      name: 'AgroPro Seeds',
      rating: 4.8
    }
  },
  {
    id: '2',
    name: 'Lemon Tree Sapling',
    price: 150,
    unit: 'piece',
    image: 'https://picsum.photos/200/300?random=2',
    category: 'plants',
    description: 'Grafted lemon tree, 2 years old',
    stock: 50,
    seller: {
      id: 's2',
      name: 'Green Nursery',
      rating: 4.5
    }
  },
  {
    id: '3',
    name: 'Organic Fertilizer',
    price: 40,
    unit: 'kg',
    image: 'https://picsum.photos/200/300?random=3',
    category: 'fertilizers',
    description: 'Natural compost, rich in nutrients',
    stock: 500,
    seller: {
      id: 's3',
      name: 'Eco Farm Supplies',
      rating: 4.7
    }
  },
  {
    id: '4',
    name: 'Garden Tool Set',
    price: 299,
    unit: 'set',
    image: 'https://picsum.photos/200/300?random=4',
    category: 'tools',
    description: 'Complete set of essential gardening tools',
    stock: 20,
    seller: {
      id: 's4',
      name: 'Farm Tools Co.',
      rating: 4.9
    }
  },
  // Add more sample products as needed
];