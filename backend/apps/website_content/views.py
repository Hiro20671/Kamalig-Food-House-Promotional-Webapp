import json
from django.utils import timezone
from django.db.models import Q
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.http import HttpResponse
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import Account, AuditLog, log_audit
from apps.accounts.permissions import IsOwnerOrAdmin
from apps.accounts.serializers import (
    UserProfileSerializer,
    AdminUserCrudSerializer,
    AuditLogSerializer,
)
from apps.categories.models import Category
from apps.categories.serializers import CategorySerializer
from apps.products.models import Product, ProductImage
from apps.products.serializers import ProductSerializer, ProductImageSerializer
from apps.promotions.models import Promotion
from apps.promotions.serializers import PromotionSerializer
from apps.business_information.models import BusinessInformation
from apps.business_information.serializers import BusinessInformationSerializer
from apps.location.models import BusinessLocation
from apps.location.serializers import BusinessLocationSerializer
from apps.website_content.models import (
    HomepageContent,
    AboutContent,
    AboutImage,
    WebsiteSettings,
)
from apps.website_content.serializers import (
    HomepageContentSerializer,
    AboutContentSerializer,
    AboutImageSerializer,
    WebsiteSettingsSerializer,
)


def get_singleton(model_cls):
    obj = model_cls.objects.first()
    if not obj:
        obj = model_cls.objects.create()
    return obj


def handle_draft_or_publish(request, instance, serializer_cls, section_name):
    """
    Supports draft & publish workflow for singleton CMS models:
    - workflow_action = 'save_draft': stores non-file fields in instance.draft_data and sets has_unpublished_changes=True
    - workflow_action = 'discard_draft': clears draft_data and sets has_unpublished_changes=False
    - workflow_action = 'publish' (default): applies changes directly to the live model, clears draft_data,
      updates last_published_at, and records an AuditLog entry.
    """
    workflow_action = request.data.get('workflow_action', 'publish')

    if workflow_action == 'discard_draft':
        instance.draft_data = {}
        instance.has_unpublished_changes = False
        instance.save(update_fields=['draft_data', 'has_unpublished_changes', 'updated_at'])
        log_audit(request.user, section_name, 'Discarded Draft', f'Reverted unsaved draft changes in {section_name}.')
        serializer = serializer_cls(instance, context={'request': request})
        return Response(serializer.data)

    # Parse any JSON string fields sent via multipart/form-data
    mutable_data = {}
    for key in request.data.keys():
        if key == 'workflow_action':
            continue
        val = request.data.get(key)
        if key in ('why_choose_items', 'section_order', 'why_visit_items', 'other_social_links') and isinstance(val, str):
            try:
                mutable_data[key] = json.loads(val)
            except Exception:
                mutable_data[key] = val
        elif val in ('true', 'false') and not isinstance(val, bool):
            mutable_data[key] = (val == 'true')
        else:
            mutable_data[key] = val

    if workflow_action == 'save_draft':
        # Save serializable fields into draft_data without overwriting live published fields
        draft_dict = dict(instance.draft_data or {})
        for k, v in mutable_data.items():
            # Skip uploaded file objects in JSON draft storage; if files are uploaded during draft save,
            # or if text fields are edited, store text/boolean/JSON fields in draft_data
            if not hasattr(v, 'read'):
                draft_dict[k] = v
        instance.draft_data = draft_dict
        instance.has_unpublished_changes = True
        instance.save(update_fields=['draft_data', 'has_unpublished_changes', 'updated_at'])
        log_audit(request.user, section_name, 'Saved Draft', f'Saved draft changes for {section_name}.')
        serializer = serializer_cls(instance, context={'request': request})
        return Response(serializer.data)

    # Default: Publish live
    # Merge any existing draft_data with incoming mutable_data
    merged_data = {}
    if instance.draft_data:
        merged_data.update(instance.draft_data)
    merged_data.update(mutable_data)

    serializer = serializer_cls(
        instance,
        data=merged_data,
        partial=True,
        context={'request': request},
    )
    serializer.is_valid(raise_exception=True)
    updated_instance = serializer.save(
        draft_data={},
        has_unpublished_changes=False,
        last_published_at=timezone.now(),
    )
    log_audit(
        request.user,
        section_name,
        'Published Content',
        f'Published live updates to {section_name}.',
    )
    return Response(serializer_cls(updated_instance, context={'request': request}).data)


# ==============================================================================
# PUBLIC READ-ONLY API VIEWS
# ==============================================================================

class PublicHomepageView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        homepage = get_singleton(HomepageContent)
        serializer = HomepageContentSerializer(homepage, context={'request': request})
        return Response(serializer.data)


class PublicProductsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Product.objects.filter(
            is_published=True,
            is_archived=False,
            category__is_published=True,
        ).select_related('category').prefetch_related('images', 'variants')

        category_slug = request.query_params.get('category')
        if category_slug and category_slug != 'all':
            if category_slug.isdigit():
                qs = qs.filter(category_id=int(category_slug))
            else:
                qs = qs.filter(category__slug=category_slug)

        search_q = (request.query_params.get('search') or '').strip()
        if search_q:
            qs = qs.filter(
                Q(name__icontains=search_q)
                | Q(description__icontains=search_q)
                | Q(category__name__icontains=search_q)
                | Q(variants__variant_name__icontains=search_q)
            ).distinct()

        if request.query_params.get('featured') == 'true':
            qs = qs.filter(is_featured=True)

        if request.query_params.get('best_seller') == 'true':
            qs = qs.filter(is_best_seller=True)

        serializer = ProductSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)


class PublicProductDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug_or_id):
        qs = Product.objects.filter(
            is_published=True,
            is_archived=False,
            category__is_published=True,
        ).select_related('category').prefetch_related('images', 'variants')

        if str(slug_or_id).isdigit():
            product = qs.filter(id=int(slug_or_id)).first()
        else:
            product = qs.filter(slug=slug_or_id).first()

        if not product:
            return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProductSerializer(product, context={'request': request})
        return Response(serializer.data)


class PublicFeaturedProductsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Product.objects.filter(
            is_published=True,
            is_archived=False,
            is_featured=True,
            category__is_published=True,
        ).select_related('category').prefetch_related('images', 'variants')
        serializer = ProductSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)


class PublicBestSellerProductsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Product.objects.filter(
            is_published=True,
            is_archived=False,
            is_best_seller=True,
            category__is_published=True,
        ).select_related('category').prefetch_related('images', 'variants')
        serializer = ProductSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)


class PublicCategoriesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Category.objects.filter(is_published=True)
        serializer = CategorySerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)


class PublicAboutView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        about = get_singleton(AboutContent)
        serializer = AboutContentSerializer(about, context={'request': request})
        return Response(serializer.data)


class PublicPromotionsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Promotion.objects.filter(is_published=True)
        serializer = PromotionSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)


class PublicLocationView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        loc = get_singleton(BusinessLocation)
        serializer = BusinessLocationSerializer(loc, context={'request': request})
        return Response(serializer.data)


class PublicContactView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        info = get_singleton(BusinessInformation)
        serializer = BusinessInformationSerializer(info, context={'request': request})
        return Response(serializer.data)


class PublicWebsiteSettingsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        settings_obj = get_singleton(WebsiteSettings)
        serializer = WebsiteSettingsSerializer(settings_obj, context={'request': request})
        return Response(serializer.data)


class PublicVerifyAccessCodeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        code = str(request.data.get('code') or '').strip()
        settings_obj = get_singleton(WebsiteSettings)
        expected_code = (settings_obj.owner_access_code or '1830').strip()
        if code == expected_code:
            return Response({'verified': True})
        return Response(
            {'verified': False, 'detail': 'Incorrect 4-digit security code.'},
            status=status.HTTP_403_FORBIDDEN,
        )


# ==============================================================================
# OWNER / ADMIN AUTHENTICATION, ACCOUNT CRUD & DASHBOARD VIEWS
# ==============================================================================

class AdminLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = (request.data.get('username') or '').strip()
        password = request.data.get('password') or ''
        user = authenticate(request, username=username, password=password)
        if not user:
            return Response(
                {'detail': 'Invalid username or password.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        profile = getattr(user, 'account_profile', None)
        if not (user.is_superuser or user.is_staff or (profile and profile.role in ('OWNER', 'ADMIN'))):
            return Response(
                {'detail': 'You do not have owner or administrator access.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)
        log_audit(user, 'Authentication', 'Owner Login', f'{user.username} signed into the Owner CMS.')
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserProfileSerializer(user).data,
        })


class AdminMeView(APIView):
    permission_classes = [IsOwnerOrAdmin]

    def get(self, request):
        return Response(UserProfileSerializer(request.user).data)

    def patch(self, request):
        user = request.user
        username = (request.data.get('username') or user.username).strip()
        if not username:
            return Response({'detail': 'Username cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=username).exclude(pk=user.pk).exists():
            return Response({'detail': 'That username is already taken.'}, status=status.HTTP_400_BAD_REQUEST)

        user.username = username
        if 'first_name' in request.data:
            user.first_name = (request.data.get('first_name') or '').strip()
        if 'last_name' in request.data:
            user.last_name = (request.data.get('last_name') or '').strip()
        if 'email' in request.data:
            user.email = (request.data.get('email') or '').strip()
        user.save()
        log_audit(user, 'Account Profile', 'Updated Profile', f'Updated account profile for {user.username}.')
        return Response(UserProfileSerializer(user).data)


class AdminChangePasswordView(APIView):
    permission_classes = [IsOwnerOrAdmin]

    def post(self, request):
        user = request.user
        current_password = request.data.get('current_password') or ''
        new_password = request.data.get('new_password') or ''
        confirm_password = request.data.get('confirm_password') or ''

        if not user.check_password(current_password):
            return Response(
                {'detail': 'Your current password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(new_password) < 6:
            return Response(
                {'detail': 'New password must be at least 6 characters long.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if new_password != confirm_password:
            return Response(
                {'detail': 'New password and confirmation do not match.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()
        log_audit(user, 'Account Security', 'Changed Password', f'{user.username} changed their account password.')
        return Response({'detail': 'Password updated successfully!'})


class AdminAccessCodeView(APIView):
    permission_classes = [IsOwnerOrAdmin]

    def get(self, request):
        settings_obj = get_singleton(WebsiteSettings)
        return Response({'owner_access_code': settings_obj.owner_access_code or '1830'})

    def patch(self, request):
        new_code = str(request.data.get('owner_access_code') or '').strip()
        if not new_code.isdigit() or len(new_code) != 4:
            return Response(
                {'detail': 'Access code must be an exact 4-digit number (e.g., 1830).'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        settings_obj = get_singleton(WebsiteSettings)
        settings_obj.owner_access_code = new_code
        settings_obj.save(update_fields=['owner_access_code', 'updated_at'])
        log_audit(request.user, 'Account Security', 'Updated 4-Digit Access Code', 'Changed the 4-digit owner portal security code.')
        return Response({'owner_access_code': settings_obj.owner_access_code, 'detail': '4-digit access code updated!'})


class AdminAccountListCreateView(APIView):
    permission_classes = [IsOwnerOrAdmin]

    def get(self, request):
        users = User.objects.filter(
            Q(is_staff=True) | Q(is_superuser=True) | Q(account_profile__isnull=False)
        ).distinct().select_related('account_profile').order_by('id')
        serializer = AdminUserCrudSerializer(users, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = AdminUserCrudSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        created_user = serializer.save()
        log_audit(request.user, 'Admin Accounts', 'Created Account', f'Created admin user "{created_user.username}".')
        return Response(AdminUserCrudSerializer(created_user).data, status=status.HTTP_201_CREATED)


class AdminAccountDetailView(APIView):
    permission_classes = [IsOwnerOrAdmin]

    def get_object(self, pk):
        return User.objects.select_related('account_profile').filter(pk=pk).first()

    def get(self, request, pk):
        user_obj = self.get_object(pk)
        if not user_obj:
            return Response({'detail': 'Account not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(AdminUserCrudSerializer(user_obj).data)

    def patch(self, request, pk):
        user_obj = self.get_object(pk)
        if not user_obj:
            return Response({'detail': 'Account not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = AdminUserCrudSerializer(user_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        log_audit(request.user, 'Admin Accounts', 'Updated Account', f'Updated account "{updated.username}".')
        return Response(AdminUserCrudSerializer(updated).data)

    def delete(self, request, pk):
        user_obj = self.get_object(pk)
        if not user_obj:
            return Response({'detail': 'Account not found.'}, status=status.HTTP_404_NOT_FOUND)
        if user_obj.pk == request.user.pk:
            return Response(
                {'detail': 'You cannot delete your own currently signed-in account.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        username = user_obj.username
        user_obj.delete()
        log_audit(request.user, 'Admin Accounts', 'Deleted Account', f'Deleted account "{username}".')
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminAuditLogListView(APIView):
    permission_classes = [IsOwnerOrAdmin]

    def get(self, request):
        logs = AuditLog.objects.all()[:100]
        return Response(AuditLogSerializer(logs, many=True).data)

    def delete(self, request):
        AuditLog.objects.all().delete()
        log_audit(request.user, 'Audit Log', 'Cleared History', 'Cleared activity audit log history.')
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminAuditLogDetailView(APIView):
    permission_classes = [IsOwnerOrAdmin]

    def delete(self, request, pk):
        item = AuditLog.objects.filter(pk=pk).first()
        if not item:
            return Response({'detail': 'Log entry not found.'}, status=status.HTTP_404_NOT_FOUND)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminDashboardSummaryView(APIView):
    permission_classes = [IsOwnerOrAdmin]

    def get(self, request):
        active_products = Product.objects.filter(is_archived=False)
        published_products_count = active_products.filter(is_published=True).count()
        hidden_products_count = active_products.filter(is_published=False).count()
        archived_products_count = Product.objects.filter(is_archived=True).count()
        featured_products_count = active_products.filter(is_featured=True, is_published=True).count()
        best_seller_products_count = active_products.filter(is_best_seller=True, is_published=True).count()
        products_with_images_count = active_products.exclude(main_image='').exclude(main_image__isnull=True).count()

        total_categories = Category.objects.count()
        published_categories = Category.objects.filter(is_published=True).count()

        total_promotions = Promotion.objects.count()
        published_promotions = Promotion.objects.filter(is_published=True).count()

        homepage = get_singleton(HomepageContent)
        about = get_singleton(AboutContent)
        location = get_singleton(BusinessLocation)
        contact = get_singleton(BusinessInformation)
        settings_obj = get_singleton(WebsiteSettings)

        latest_audit = AuditLog.objects.first()
        last_update = latest_audit.created_at if latest_audit else homepage.updated_at

        draft_sections = []
        if homepage.has_unpublished_changes:
            draft_sections.append({'name': 'Home Page', 'path': '/admin/homepage'})
        if about.has_unpublished_changes:
            draft_sections.append({'name': 'About Us', 'path': '/admin/about'})
        if location.has_unpublished_changes:
            draft_sections.append({'name': 'Location & Map', 'path': '/admin/location'})
        if contact.has_unpublished_changes:
            draft_sections.append({'name': 'Contact Us', 'path': '/admin/contact'})
        if settings_obj.has_unpublished_changes:
            draft_sections.append({'name': 'Website Settings', 'path': '/admin/settings'})

        recent_logs = AuditLogSerializer(AuditLog.objects.all()[:12], many=True).data

        return Response({
            'total_published_products': published_products_count,
            'total_products': active_products.count(),
            'hidden_or_unpublished_products': hidden_products_count,
            'archived_products': archived_products_count,
            'featured_products': featured_products_count,
            'best_seller_products': best_seller_products_count,
            'products_with_photos': products_with_images_count,
            'total_categories': total_categories,
            'published_categories': published_categories,
            'promotional_banners': published_promotions,
            'total_promotional_banners': total_promotions,
            'last_content_update': last_update,
            'draft_sections': draft_sections,
            'recent_audit_logs': recent_logs,
        })


# ==============================================================================
# OWNER / ADMIN PRODUCT & CATEGORY MANAGEMENT VIEWS
# ==============================================================================

class AdminProductListCreateView(APIView):
    permission_classes = [IsOwnerOrAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        include_archived = request.query_params.get('archived') == 'true'
        qs = Product.objects.select_related('category').prefetch_related('images', 'variants')
        if not include_archived:
            qs = qs.filter(is_archived=False)
        else:
            qs = qs.filter(is_archived=True)
        serializer = ProductSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = ProductSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        log_audit(request.user, 'Products', 'Created Product', f'Added "{product.name}" to {product.category.name}.')
        return Response(
            ProductSerializer(product, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class AdminProductDetailView(APIView):
    permission_classes = [IsOwnerOrAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self, pk):
        return Product.objects.select_related('category').prefetch_related('images', 'variants').filter(pk=pk).first()

    def get(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ProductSerializer(product, context={'request': request}).data)

    def patch(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ProductSerializer(product, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        log_audit(request.user, 'Products', 'Updated Product', f'Updated "{updated.name}".')
        return Response(ProductSerializer(updated, context={'request': request}).data)

    def delete(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)
        name = product.name
        product.delete()
        log_audit(request.user, 'Products', 'Deleted Product', f'Permanently deleted "{name}".')
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminProductImageCreateView(APIView):
    permission_classes = [IsOwnerOrAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        product = Product.objects.filter(pk=pk).first()
        if not product:
            return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ProductImageSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        img = serializer.save(product=product)
        log_audit(request.user, 'Product Media', 'Uploaded Gallery Image', f'Uploaded gallery image for "{product.name}".')
        return Response(
            ProductImageSerializer(img, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class AdminProductImageDeleteView(APIView):
    permission_classes = [IsOwnerOrAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def patch(self, request, pk):
        img = ProductImage.objects.select_related('product').filter(pk=pk).first()
        if not img:
            return Response({'detail': 'Image not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ProductImageSerializer(img, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        log_audit(request.user, 'Product Media', 'Updated Gallery Image', f'Updated gallery image for "{img.product.name}".')
        return Response(ProductImageSerializer(updated, context={'request': request}).data)

    def delete(self, request, pk):
        img = ProductImage.objects.select_related('product').filter(pk=pk).first()
        if not img:
            return Response({'detail': 'Image not found.'}, status=status.HTTP_404_NOT_FOUND)
        product_name = img.product.name
        if img.image:
            img.image.delete(save=False)
        img.delete()
        log_audit(request.user, 'Product Media', 'Deleted Gallery Image', f'Removed gallery image from "{product_name}".')
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminCategoryListCreateView(APIView):
    permission_classes = [IsOwnerOrAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        qs = Category.objects.all()
        serializer = CategorySerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = CategorySerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        cat = serializer.save()
        log_audit(request.user, 'Categories', 'Created Category', f'Created category "{cat.name}".')
        return Response(
            CategorySerializer(cat, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class AdminCategoryDetailView(APIView):
    permission_classes = [IsOwnerOrAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def patch(self, request, pk):
        cat = Category.objects.filter(pk=pk).first()
        if not cat:
            return Response({'detail': 'Category not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CategorySerializer(cat, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        log_audit(request.user, 'Categories', 'Updated Category', f'Updated category "{updated.name}".')
        return Response(CategorySerializer(updated, context={'request': request}).data)

    def delete(self, request, pk):
        cat = Category.objects.filter(pk=pk).first()
        if not cat:
            return Response({'detail': 'Category not found.'}, status=status.HTTP_404_NOT_FOUND)
        name = cat.name
        cat.delete()
        log_audit(request.user, 'Categories', 'Deleted Category', f'Deleted category "{name}".')
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==============================================================================
# OWNER / ADMIN WEBSITE CONTENT MANAGEMENT VIEWS
# ==============================================================================

class AdminHomepageView(APIView):
    permission_classes = [IsOwnerOrAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        homepage = get_singleton(HomepageContent)
        return Response(HomepageContentSerializer(homepage, context={'request': request}).data)

    def patch(self, request):
        homepage = get_singleton(HomepageContent)
        return handle_draft_or_publish(request, homepage, HomepageContentSerializer, 'Home Page')


class AdminAboutView(APIView):
    permission_classes = [IsOwnerOrAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        about = get_singleton(AboutContent)
        return Response(AboutContentSerializer(about, context={'request': request}).data)

    def patch(self, request):
        about = get_singleton(AboutContent)
        return handle_draft_or_publish(request, about, AboutContentSerializer, 'About Us Page')


class AdminAboutImageCreateView(APIView):
    permission_classes = [IsOwnerOrAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        about = get_singleton(AboutContent)
        serializer = AboutImageSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        img = serializer.save(about=about)
        log_audit(request.user, 'About Us Media', 'Uploaded Store Photo', f'Uploaded photo "{img.caption or img.id}".')
        return Response(
            AboutImageSerializer(img, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class AdminAboutImageDeleteView(APIView):
    permission_classes = [IsOwnerOrAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def patch(self, request, pk):
        img = AboutImage.objects.filter(pk=pk).first()
        if not img:
            return Response({'detail': 'Photo not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = AboutImageSerializer(img, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        log_audit(request.user, 'About Us Media', 'Updated Store Photo', f'Updated caption/order for photo #{img.id}.')
        return Response(AboutImageSerializer(updated, context={'request': request}).data)

    def delete(self, request, pk):
        img = AboutImage.objects.filter(pk=pk).first()
        if not img:
            return Response({'detail': 'Photo not found.'}, status=status.HTTP_404_NOT_FOUND)
        if img.image:
            img.image.delete(save=False)
        img.delete()
        log_audit(request.user, 'About Us Media', 'Deleted Store Photo', 'Removed photograph from About Us gallery.')
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminPromotionListCreateView(APIView):
    permission_classes = [IsOwnerOrAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        qs = Promotion.objects.all()
        return Response(PromotionSerializer(qs, many=True, context={'request': request}).data)

    def post(self, request):
        serializer = PromotionSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        promo = serializer.save()
        log_audit(request.user, 'Promotions', 'Created Promotion Banner', f'Created banner "{promo.title}".')
        return Response(
            PromotionSerializer(promo, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class AdminPromotionDetailView(APIView):
    permission_classes = [IsOwnerOrAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def patch(self, request, pk):
        promo = Promotion.objects.filter(pk=pk).first()
        if not promo:
            return Response({'detail': 'Promotion not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = PromotionSerializer(promo, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        log_audit(request.user, 'Promotions', 'Updated Promotion Banner', f'Updated banner "{updated.title}".')
        return Response(PromotionSerializer(updated, context={'request': request}).data)

    def delete(self, request, pk):
        promo = Promotion.objects.filter(pk=pk).first()
        if not promo:
            return Response({'detail': 'Promotion not found.'}, status=status.HTTP_404_NOT_FOUND)
        title = promo.title
        if promo.image:
            promo.image.delete(save=False)
        promo.delete()
        log_audit(request.user, 'Promotions', 'Deleted Promotion Banner', f'Deleted banner "{title}".')
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminLocationView(APIView):
    permission_classes = [IsOwnerOrAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        loc = get_singleton(BusinessLocation)
        return Response(BusinessLocationSerializer(loc, context={'request': request}).data)

    def patch(self, request):
        loc = get_singleton(BusinessLocation)
        resp = handle_draft_or_publish(request, loc, BusinessLocationSerializer, 'Location & Map')
        # Keep BusinessInformation address in sync when published
        if request.data.get('workflow_action', 'publish') == 'publish':
            loc.refresh_from_db()
            info = get_singleton(BusinessInformation)
            if info.address != loc.address:
                info.address = loc.address
                info.save(update_fields=['address', 'updated_at'])
        return resp


class AdminContactView(APIView):
    permission_classes = [IsOwnerOrAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        info = get_singleton(BusinessInformation)
        return Response(BusinessInformationSerializer(info, context={'request': request}).data)

    def patch(self, request):
        info = get_singleton(BusinessInformation)
        return handle_draft_or_publish(request, info, BusinessInformationSerializer, 'Contact Information')


class AdminWebsiteSettingsView(APIView):
    permission_classes = [IsOwnerOrAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        settings_obj = get_singleton(WebsiteSettings)
        return Response(WebsiteSettingsSerializer(settings_obj, context={'request': request}).data)

    def patch(self, request):
        settings_obj = get_singleton(WebsiteSettings)
        return handle_draft_or_publish(request, settings_obj, WebsiteSettingsSerializer, 'Website Settings')


# ==============================================================================
# SEO SITEMAP & ROBOTS.TXT VIEWS
# ==============================================================================

def robots_txt_view(request):
    host = request.build_absolute_uri('/')[:-1]
    lines = [
        "User-agent: *",
        "Allow: /",
        "Disallow: /admin/",
        "Disallow: /api/admin/",
        f"Sitemap: {host}/sitemap.xml",
    ]
    return HttpResponse("\n".join(lines), content_type="text/plain")


def sitemap_xml_view(request):
    frontend_origin = request.headers.get('Origin') or 'http://localhost:5173'
    static_routes = ['', '/about', '/menu', '/location', '/contact']
    products = Product.objects.filter(is_published=True, is_archived=False)

    urls_xml = []
    for route in static_routes:
        urls_xml.append(
            f"  <url><loc>{frontend_origin}{route}</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>"
        )
    for prod in products:
        urls_xml.append(
            f"  <url><loc>{frontend_origin}/menu/{prod.slug}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>"
        )

    xml_content = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls_xml)
        + "\n</urlset>"
    )
    return HttpResponse(xml_content, content_type="application/xml")

