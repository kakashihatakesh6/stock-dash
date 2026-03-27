import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const getPortfolio = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/portfolio`);
    return response.data;
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    throw error;
  }
};

export const addStock = async (payload: { symbol: string; purchasePrice: number; quantity: number }) => {
  const response = await axios.post(`${API_BASE_URL}/portfolio`, payload);
  return response.data;
};

export const removeStock = async (symbol: string) => {
  const response = await axios.delete(`${API_BASE_URL}/portfolio/${symbol}`);
  return response.data;
};
