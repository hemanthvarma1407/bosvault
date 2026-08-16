import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CompanyOption {
    id: number | string;
    companyName?: string;
    name?: string;
}

export interface CompanyState {
    selectedCompanyId: string;
    companies: CompanyOption[];
    selectedCompany: CompanyOption | null;
}

const getInitialCompanyId = (): string => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('selected_company_id') || '';
    }
    return '';
};

const initialState: CompanyState = {
    selectedCompanyId: getInitialCompanyId(),
    companies: [],
    selectedCompany: null,
};

export const companySlice = createSlice({
    name: 'company',
    initialState,
    reducers: {
        setCompanies: (state, action: PayloadAction<CompanyOption[]>) => {
            state.companies = action.payload;
            if (!state.selectedCompanyId && action.payload.length > 0) {
                const defaultId = String(action.payload[0].id);
                state.selectedCompanyId = defaultId;
                state.selectedCompany = action.payload[0];
                if (typeof window !== 'undefined') {
                    localStorage.setItem('selected_company_id', defaultId);
                }
            } else if (state.selectedCompanyId) {
                state.selectedCompany = action.payload.find(c => String(c.id) === state.selectedCompanyId) || null;
            }
        },
        setSelectedCompanyId: (state, action: PayloadAction<string>) => {
            state.selectedCompanyId = action.payload;
            state.selectedCompany = state.companies.find(c => String(c.id) === action.payload) || null;
            if (typeof window !== 'undefined') {
                localStorage.setItem('selected_company_id', action.payload);
            }
        },
    },
});

export const { setCompanies, setSelectedCompanyId } = companySlice.actions;
export default companySlice.reducer;
