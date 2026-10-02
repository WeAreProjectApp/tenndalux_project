/** Canonical tags for the real UI flow registry; tags alone do not prove coverage. */
export const FlowTags = {
  AUTH_LOGIN: ['@flow:auth-login', '@module:auth', '@priority:P1'],
  AUTH_REGISTER: ['@flow:auth-register', '@module:auth', '@priority:P2'],
  DASHBOARD_UNAUTHENTICATED_REDIRECT: ['@flow:dashboard-unauthenticated-redirect', '@module:auth', '@priority:P1'],
  DASHBOARD_PROFILE_DISPLAY: ['@flow:dashboard-profile-display', '@module:dashboard', '@priority:P2'],
  DASHBOARD_LOGOUT: ['@flow:dashboard-logout', '@module:dashboard', '@priority:P2'],
  PUBLIC_HOME: ['@flow:public-home', '@module:public', '@priority:P2'],
  PUBLIC_HEADER_NAVIGATION: ['@flow:public-header-navigation', '@module:public', '@priority:P2'],
  PUBLIC_CONTACT_SUBMIT: ['@flow:public-contact-submit', '@module:leads', '@priority:P1'],
  AUTH_SESSION_REFRESH_CONTACT: ['@flow:auth-session-refresh-contact', '@module:auth', '@priority:P1'],
  PUBLIC_FAQ_TOGGLE: ['@flow:public-faq-toggle', '@module:public', '@priority:P3'],
  PUBLIC_GALLERY_VIDEO: ['@flow:public-gallery-video', '@module:public', '@priority:P3'],
  PUBLIC_BRAND_VIDEO: ['@flow:public-brand-video', '@module:public', '@priority:P3'],
  PUBLIC_PRODUCTS_DISPLAY: ['@flow:public-products-display', '@module:products', '@priority:P3'],
  PUBLIC_PRODUCTS_FILTER: ['@flow:public-products-filter', '@module:products', '@priority:P3'],
  PUBLIC_PRODUCT_DETAILS: ['@flow:public-product-details', '@module:products', '@priority:P3'],
  PUBLIC_SERVICES_DISPLAY: ['@flow:public-services-display', '@module:services', '@priority:P2'],
  PUBLIC_SERVICES_TAB: ['@flow:public-services-tab', '@module:services', '@priority:P3'],
  PUBLIC_SERVICES_EXTERIOR_MOBILE_DETAIL: ['@flow:public-services-exterior-mobile-detail', '@module:services', '@priority:P3'],
  PUBLIC_BLOG_LIST: ['@flow:public-blog-list', '@module:blog', '@priority:P2'],
  PUBLIC_BLOG_FILTER: ['@flow:public-blog-filter', '@module:blog', '@priority:P3'],
  PUBLIC_BLOG_DETAIL: ['@flow:public-blog-detail', '@module:blog', '@priority:P2'],
  PUBLIC_BLOG_SHARE: ['@flow:public-blog-share', '@module:blog', '@priority:P4'],
  PUBLIC_PORTFOLIO_LIST: ['@flow:public-portfolio-list', '@module:portfolio', '@priority:P2'],
  PUBLIC_PORTFOLIO_FILTER: ['@flow:public-portfolio-filter', '@module:portfolio', '@priority:P3'],
  PUBLIC_PORTFOLIO_SHOWREEL: ['@flow:public-portfolio-showreel', '@module:portfolio', '@priority:P3'],
  PUBLIC_PORTFOLIO_DETAIL: ['@flow:public-portfolio-detail', '@module:portfolio', '@priority:P2'],
};

export const RoleTags = {
  GUEST: '@role:guest',
  USER: '@role:user', // Legacy alias; authenticated fixtures use the actual roles below.
  VIEWER: '@role:viewer',
  EDITOR: '@role:editor',
  ADMIN: '@role:admin',
};
