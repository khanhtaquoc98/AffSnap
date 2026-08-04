import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LinkRecord {
  id: string;
  originalUrl: string;
  affiliateUrl: string;
  shortCode: string;
  userId: string | null;
  clicks: number;
  createdAt: string;
  subId: string;
}

interface ConvertState {
  inputUrl: string;
  isConverting: boolean;
  convertedResult: LinkRecord | null;
  copied: boolean;
  errorMessage: string;
  historyLinks: LinkRecord[];
}

const initialState: ConvertState = {
  inputUrl: '',
  isConverting: false,
  convertedResult: null,
  copied: false,
  errorMessage: '',
  historyLinks: [],
};

export const convertSlice = createSlice({
  name: 'convert',
  initialState,
  reducers: {
    setInputUrl: (state, action: PayloadAction<string>) => {
      state.inputUrl = action.payload;
    },
    setIsConverting: (state, action: PayloadAction<boolean>) => {
      state.isConverting = action.payload;
    },
    setConvertedResult: (state, action: PayloadAction<LinkRecord | null>) => {
      state.convertedResult = action.payload;
    },
    setCopied: (state, action: PayloadAction<boolean>) => {
      state.copied = action.payload;
    },
    setErrorMessage: (state, action: PayloadAction<string>) => {
      state.errorMessage = action.payload;
    },
    setHistoryLinks: (state, action: PayloadAction<LinkRecord[]>) => {
      state.historyLinks = action.payload;
    },
    addHistoryLink: (state, action: PayloadAction<LinkRecord>) => {
      state.historyLinks.unshift(action.payload);
    },
  },
});

export const {
  setInputUrl,
  setIsConverting,
  setConvertedResult,
  setCopied,
  setErrorMessage,
  setHistoryLinks,
  addHistoryLink,
} = convertSlice.actions;
export default convertSlice.reducer;
