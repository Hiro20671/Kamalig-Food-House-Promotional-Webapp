from django.contrib import admin
from apps.accounts.models import Account, AuditLog
from apps.categories.models import Category
from apps.products.models import Product, ProductImage, ProductVariant
from apps.promotions.models import Promotion
from apps.business_information.models import BusinessInformation
from apps.location.models import BusinessLocation
from apps.website_content.models import (
    HomepageContent,
    AboutContent,
    AboutImage,
    WebsiteSettings,
)
from apps.media_management.models import MediaAsset

admin.site.register(Account)
admin.site.register(AuditLog)
admin.site.register(Category)
admin.site.register(Product)
admin.site.register(ProductImage)
admin.site.register(ProductVariant)
admin.site.register(Promotion)
admin.site.register(BusinessInformation)
admin.site.register(BusinessLocation)
admin.site.register(HomepageContent)
admin.site.register(AboutContent)
admin.site.register(AboutImage)
admin.site.register(WebsiteSettings)
admin.site.register(MediaAsset)

