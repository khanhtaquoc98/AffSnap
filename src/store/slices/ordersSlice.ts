import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OrderRecord {
  id: string;
  orderSn: string;
  linkId: string;
  userId: string;
  productName: string;
  productPrice: number;
  totalCommission: number;
  userCommission: number;
  adminCommission: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  purchaseDate: string;
  reconciled: boolean;
}

interface OrdersState {
  orders: OrderRecord[];
  filterStatus: 'ALL' | 'PENDING' | 'COMPLETED' | 'CANCELLED';
  isLoading: boolean;
}

const initialState: OrdersState = {
  orders: [],
  filterStatus: 'ALL',
  isLoading: false,
};

export const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setOrders: (state, action: PayloadAction<OrderRecord[]>) => {
      state.orders = action.payload;
    },
    setFilterStatus: (state, action: PayloadAction<'ALL' | 'PENDING' | 'COMPLETED' | 'CANCELLED'>) => {
      state.filterStatus = action.payload;
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setOrders, setFilterStatus, setIsLoading } = ordersSlice.actions;
export default ordersSlice.reducer;
