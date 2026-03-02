from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('users.auth_urls')),
    path('api/v1/organizations/', include('organizations.urls')),
    path('api/v1/users/', include('users.urls')),  # list at users/, detail at users/<pk>/
    path('api/v1/companies/', include('companies.urls')),
    path('api/v1/contacts/', include('contacts.urls')),
    path('api/v1/activity-log/', include('activity_log.urls')),
]

# Nested: /api/v1/companies/<pk>/contacts/ - need a separate router
from rest_framework.routers import DefaultRouter
from contacts.views import ContactNestedViewSet
_nested_router = DefaultRouter()
_nested_router.register(r'contacts', ContactNestedViewSet, basename='company-contacts')
urlpatterns += [
    path('api/v1/companies/<int:company_pk>/', include(_nested_router.urls)),
]

if settings.DEBUG and getattr(settings, 'MEDIA_ROOT', None):
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
