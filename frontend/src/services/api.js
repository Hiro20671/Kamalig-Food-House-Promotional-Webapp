const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function getAuthHeaders(isFormData = false) {
  const token = localStorage.getItem('kamalig_admin_access_token');
  const headers = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;
  const config = {
    ...options,
    headers: {
      ...getAuthHeaders(isFormData),
      ...(options.headers || {}),
    },
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (response.status === 204) {
    return null;
  }

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage =
      (data && typeof data === 'object' && (data.detail || JSON.stringify(data))) ||
      'Request failed. Please check your inputs and try again.';
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function toFormData(payload) {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined) return;
    if (value === null) {
      formData.append(key, '');
    } else if (value instanceof File) {
      formData.append(key, value);
    } else if (typeof value === 'object' && !(value instanceof Blob)) {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  });
  return formData;
}

export const publicApi = {
  getHomepage: () => request('/api/public/homepage/'),
  getProducts: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        searchParams.set(k, v);
      }
    });
    const qs = searchParams.toString();
    return request(`/api/public/products/${qs ? `?${qs}` : ''}`);
  },
  getProductDetail: (slugOrId) => request(`/api/public/products/${encodeURIComponent(slugOrId)}/`),
  getFeaturedProducts: () => request('/api/public/products/featured/'),
  getBestSellers: () => request('/api/public/products/best-sellers/'),
  getCategories: () => request('/api/public/categories/'),
  getAbout: () => request('/api/public/about/'),
  getPromotions: () => request('/api/public/promotions/'),
  getLocation: () => request('/api/public/location/'),
  getContact: () => request('/api/public/contact/'),
  getWebsiteSettings: () => request('/api/public/website-settings/'),
  verifyAccessCode: (code) =>
    request('/api/public/verify-access-code/', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
};

export const adminApi = {
  // Auth, Profile, Change Password, Access Code & Account CRUD
  login: (credentials) =>
    request('/api/admin/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getMe: () => request('/api/admin/auth/me/'),
  updateMe: (payload) =>
    request('/api/admin/auth/me/', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  changePassword: (payload) =>
    request('/api/admin/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getAccessCode: () => request('/api/admin/auth/access-code/'),
  updateAccessCode: (owner_access_code) =>
    request('/api/admin/auth/access-code/', {
      method: 'PATCH',
      body: JSON.stringify({ owner_access_code }),
    }),
  getAccounts: () => request('/api/admin/accounts/'),
  createAccount: (payload) =>
    request('/api/admin/accounts/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateAccount: (id, payload) =>
    request(`/api/admin/accounts/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteAccount: (id) =>
    request(`/api/admin/accounts/${id}/`, {
      method: 'DELETE',
    }),
  getAuditLogs: () => request('/api/admin/audit-logs/'),
  clearAuditLogs: () =>
    request('/api/admin/audit-logs/', {
      method: 'DELETE',
    }),
  deleteAuditLogItem: (id) =>
    request(`/api/admin/audit-logs/${id}/`, {
      method: 'DELETE',
    }),

  // Dashboard
  getDashboard: () => request('/api/admin/dashboard/'),

  // Products
  getProducts: (archived = false) =>
    request(`/api/admin/products/?archived=${archived ? 'true' : 'false'}`),
  createProduct: (formData) =>
    request('/api/admin/products/', {
      method: 'POST',
      body: formData instanceof FormData ? formData : toFormData(formData),
    }),
  updateProduct: (id, formData) =>
    request(`/api/admin/products/${id}/`, {
      method: 'PATCH',
      body: formData instanceof FormData ? formData : toFormData(formData),
    }),
  deleteProduct: (id) =>
    request(`/api/admin/products/${id}/`, {
      method: 'DELETE',
    }),
  uploadProductImage: (productId, formData) =>
    request(`/api/admin/products/${productId}/images/`, {
      method: 'POST',
      body: formData instanceof FormData ? formData : toFormData(formData),
    }),
  updateProductImage: (imageId, payload) =>
    request(`/api/admin/product-images/${imageId}/`, {
      method: 'PATCH',
      body: payload instanceof FormData ? payload : JSON.stringify(payload),
    }),
  deleteProductImage: (imageId) =>
    request(`/api/admin/product-images/${imageId}/`, {
      method: 'DELETE',
    }),

  // Categories
  getCategories: () => request('/api/admin/categories/'),
  createCategory: (formData) =>
    request('/api/admin/categories/', {
      method: 'POST',
      body: formData instanceof FormData ? formData : toFormData(formData),
    }),
  updateCategory: (id, formData) =>
    request(`/api/admin/categories/${id}/`, {
      method: 'PATCH',
      body: formData instanceof FormData ? formData : toFormData(formData),
    }),
  deleteCategory: (id) =>
    request(`/api/admin/categories/${id}/`, {
      method: 'DELETE',
    }),

  // Homepage
  getHomepage: () => request('/api/admin/homepage/'),
  updateHomepage: (formData) =>
    request('/api/admin/homepage/', {
      method: 'PATCH',
      body: formData instanceof FormData ? formData : toFormData(formData),
    }),

  // About Us
  getAbout: () => request('/api/admin/about/'),
  updateAbout: (formData) =>
    request('/api/admin/about/', {
      method: 'PATCH',
      body: formData instanceof FormData ? formData : toFormData(formData),
    }),
  uploadAboutImage: (formData) =>
    request('/api/admin/about/images/', {
      method: 'POST',
      body: formData instanceof FormData ? formData : toFormData(formData),
    }),
  updateAboutImage: (imageId, payload) =>
    request(`/api/admin/about-images/${imageId}/`, {
      method: 'PATCH',
      body: payload instanceof FormData ? payload : JSON.stringify(payload),
    }),
  deleteAboutImage: (imageId) =>
    request(`/api/admin/about-images/${imageId}/`, {
      method: 'DELETE',
    }),

  // Promotions
  getPromotions: () => request('/api/admin/promotions/'),
  createPromotion: (formData) =>
    request('/api/admin/promotions/', {
      method: 'POST',
      body: formData instanceof FormData ? formData : toFormData(formData),
    }),
  updatePromotion: (id, formData) =>
    request(`/api/admin/promotions/${id}/`, {
      method: 'PATCH',
      body: formData instanceof FormData ? formData : toFormData(formData),
    }),
  deletePromotion: (id) =>
    request(`/api/admin/promotions/${id}/`, {
      method: 'DELETE',
    }),

  // Location
  getLocation: () => request('/api/admin/location/'),
  updateLocation: (payload) =>
    request('/api/admin/location/', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Contact
  getContact: () => request('/api/admin/contact/'),
  updateContact: (payload) =>
    request('/api/admin/contact/', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Website Settings
  getWebsiteSettings: () => request('/api/admin/website-settings/'),
  updateWebsiteSettings: (formData) =>
    request('/api/admin/website-settings/', {
      method: 'PATCH',
      body: formData instanceof FormData ? formData : toFormData(formData),
    }),
};
