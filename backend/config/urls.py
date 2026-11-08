from pathlib import Path
from django.contrib import admin
from django.urls import path, re_path
from django.conf import settings
from django.http import FileResponse, HttpResponseNotFound, JsonResponse
from django.views.static import serve as static_serve
from rest_framework_simplejwt.views import TokenRefreshView

from apps.website_content.views import (
    # Public endpoints
    PublicHomepageView,
    PublicProductsView,
    PublicProductDetailView,
    PublicFeaturedProductsView,
    PublicBestSellerProductsView,
    PublicCategoriesView,
    PublicAboutView,
    PublicPromotionsView,
    PublicLocationView,
    PublicContactView,
    PublicWebsiteSettingsView,
    PublicVerifyAccessCodeView,
    # Admin Auth, Account CRUD & Dashboard
    AdminLoginView,
    AdminMeView,
    AdminChangePasswordView,
    AdminAccessCodeView,
    AdminAccountListCreateView,
    AdminAccountDetailView,
    AdminAuditLogListView,
    AdminAuditLogDetailView,
    AdminDashboardSummaryView,
    # Admin Products & Categories
    AdminProductListCreateView,
    AdminProductDetailView,
    AdminProductImageCreateView,
    AdminProductImageDeleteView,
    AdminCategoryListCreateView,
    AdminCategoryDetailView,
    # Admin Website Content Management
    AdminHomepageView,
    AdminAboutView,
    AdminAboutImageCreateView,
    AdminAboutImageDeleteView,
    AdminPromotionListCreateView,
    AdminPromotionDetailView,
    AdminLocationView,
    AdminContactView,
    AdminWebsiteSettingsView,
    # SEO
    robots_txt_view,
    sitemap_xml_view,
)

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('robots.txt', robots_txt_view, name='robots-txt'),
    path('sitemap.xml', sitemap_xml_view, name='sitemap-xml'),

    # Public Read-Only API Endpoints
    path('api/public/homepage/', PublicHomepageView.as_view(), name='public-homepage'),
    path('api/public/products/', PublicProductsView.as_view(), name='public-products'),
    path('api/public/products/featured/', PublicFeaturedProductsView.as_view(), name='public-products-featured'),
    path('api/public/products/best-sellers/', PublicBestSellerProductsView.as_view(), name='public-products-best-sellers'),
    path('api/public/products/<str:slug_or_id>/', PublicProductDetailView.as_view(), name='public-product-detail'),
    path('api/public/categories/', PublicCategoriesView.as_view(), name='public-categories'),
    path('api/public/about/', PublicAboutView.as_view(), name='public-about'),
    path('api/public/promotions/', PublicPromotionsView.as_view(), name='public-promotions'),
    path('api/public/location/', PublicLocationView.as_view(), name='public-location'),
    path('api/public/contact/', PublicContactView.as_view(), name='public-contact'),
    path('api/public/website-settings/', PublicWebsiteSettingsView.as_view(), name='public-website-settings'),
    path('api/public/verify-access-code/', PublicVerifyAccessCodeView.as_view(), name='public-verify-access-code'),

    # Protected Owner Authentication, Account CRUD & Dashboard Endpoints
    path('api/admin/auth/login/', AdminLoginView.as_view(), name='admin-login'),
    path('api/admin/auth/refresh/', TokenRefreshView.as_view(), name='admin-token-refresh'),
    path('api/admin/auth/me/', AdminMeView.as_view(), name='admin-me'),
    path('api/admin/auth/change-password/', AdminChangePasswordView.as_view(), name='admin-change-password'),
    path('api/admin/auth/access-code/', AdminAccessCodeView.as_view(), name='admin-access-code'),
    path('api/admin/accounts/', AdminAccountListCreateView.as_view(), name='admin-accounts'),
    path('api/admin/accounts/<int:pk>/', AdminAccountDetailView.as_view(), name='admin-account-detail'),
    path('api/admin/audit-logs/', AdminAuditLogListView.as_view(), name='admin-audit-logs'),
    path('api/admin/audit-logs/<int:pk>/', AdminAuditLogDetailView.as_view(), name='admin-audit-log-detail'),
    path('api/admin/dashboard/', AdminDashboardSummaryView.as_view(), name='admin-dashboard'),

    # Protected Owner Product & Category Management Endpoints
    path('api/admin/products/', AdminProductListCreateView.as_view(), name='admin-products'),
    path('api/admin/products/<int:pk>/', AdminProductDetailView.as_view(), name='admin-product-detail'),
    path('api/admin/products/<int:pk>/images/', AdminProductImageCreateView.as_view(), name='admin-product-images'),
    path('api/admin/product-images/<int:pk>/', AdminProductImageDeleteView.as_view(), name='admin-product-image-delete'),
    path('api/admin/categories/', AdminCategoryListCreateView.as_view(), name='admin-categories'),
    path('api/admin/categories/<int:pk>/', AdminCategoryDetailView.as_view(), name='admin-category-detail'),

    # Protected Owner Website Content Management Endpoints
    path('api/admin/homepage/', AdminHomepageView.as_view(), name='admin-homepage'),
    path('api/admin/about/', AdminAboutView.as_view(), name='admin-about'),
    path('api/admin/about/images/', AdminAboutImageCreateView.as_view(), name='admin-about-images'),
    path('api/admin/about-images/<int:pk>/', AdminAboutImageDeleteView.as_view(), name='admin-about-image-delete'),
    path('api/admin/promotions/', AdminPromotionListCreateView.as_view(), name='admin-promotions'),
    path('api/admin/promotions/<int:pk>/', AdminPromotionDetailView.as_view(), name='admin-promotion-detail'),
    path('api/admin/location/', AdminLocationView.as_view(), name='admin-location'),
    path('api/admin/contact/', AdminContactView.as_view(), name='admin-contact'),
    path('api/admin/website-settings/', AdminWebsiteSettingsView.as_view(), name='admin-website-settings'),
]


def serve_react_spa(request, resource_path=''):
    """
    Serves the built React frontend (frontend/dist) in production (e.g. PythonAnywhere),
    including root public assets (manifest.json, sw.js, kamalig-logo.png, assets/*)
    and falls back to index.html for React Router client-side routes.
    """
    if resource_path.startswith('api/'):
        return JsonResponse({'detail': 'API endpoint not found.'}, status=404)

    dist_dir = Path(getattr(settings, 'FRONTEND_DIST_DIR', settings.BASE_DIR.parent / 'frontend' / 'dist'))
    if resource_path:
        candidate = (dist_dir / resource_path).resolve()
        if str(candidate).startswith(str(dist_dir.resolve())) and candidate.is_file():
            return static_serve(request, resource_path, document_root=str(dist_dir))

    index_file = dist_dir / 'index.html'
    if index_file.is_file():
        return FileResponse(open(index_file, 'rb'), content_type='text/html')

    return HttpResponseNotFound(
        'Frontend build not found. Run "npm run build" in the frontend directory.'
    )


urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', static_serve, {'document_root': settings.MEDIA_ROOT}),
    re_path(r'^static/(?P<path>.*)$', static_serve, {'document_root': settings.STATIC_ROOT}),
    path('', serve_react_spa, name='spa-root'),
    re_path(r'^(?P<resource_path>.*)$', serve_react_spa, name='spa-catchall'),
]
